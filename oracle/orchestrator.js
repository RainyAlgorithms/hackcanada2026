// orchestrator.js — Updated to ensure weight changes flow through
import 'dotenv/config';
import FormData from 'form-data';
import fetch from 'node-fetch';

const API_KEY = process.env.BACKBOARD_API_KEY;

/**
 * Send message
 */
async function sendMessage(threadId, content) {
    try {
        const form = new FormData();
        form.append('role', 'user');
        form.append('content', content);
        form.append('web_search', 'true');
        form.append('llm_provider', 'openrouter');
        form.append('model_name', 'google/gemini-2.5-pro');
        form.append('memory', 'Auto');

        const res = await fetch(`https://app.backboard.io/api/threads/${threadId}/messages`, {
            method: 'POST',
            headers: { 'X-API-Key': API_KEY, ...form.getHeaders() },
            body: form,
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const raw = data.content ?? data.message ?? data.text ?? '';

        if (!raw || raw.includes('processing') || raw.length < 20) {
            return await pollMessages(threadId);
        }

        return raw;
    } catch (err) {
        throw new Error(`sendMessage failed: ${err.message}`);
    }
}

/**
 * Poll for response
 */
async function pollMessages(threadId) {
    for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 1500));

        try {
            const res = await fetch(`https://app.backboard.io/api/threads/${threadId}/messages?limit=10`, {
                headers: { 'X-API-Key': API_KEY },
            });

            if (!res.ok) continue;

            const data = await res.json();
            const messages = data?.messages ?? data ?? [];

            const match = (Array.isArray(messages) ? messages : [])
                .reverse()
                .find(m =>
                    (m.role === 'assistant' || m.role === 'ai') &&
                    (m.content ?? m.message ?? m.text ?? '').length > 20
                );

            if (match) {
                return match.content ?? match.message ?? match.text;
            }
        } catch (err) {
            continue;
        }
    }

    throw new Error('Poll timeout');
}

/**
 * Parse orchestrator response flexibly
 */
function parseOrchestratorResponse(response, currentWeights) {
    const result = {
        persona_weights: { ...currentWeights },
        agenda: ['Community Livability', 'Family Suitability', 'Financial Feasibility', 'Investment Outlook'],
        reasoning: 'Analysis complete'
    };

    // Try JSON first
    try {
        const json = JSON.parse(response);
        if (json.persona_weights) result.persona_weights = json.persona_weights;
        if (json.agenda) result.agenda = json.agenda;
        if (json.reasoning) result.reasoning = json.reasoning;
        return result;
    } catch (e) {
        // Continue with text parsing
    }

    // Parse from natural text
    const familyMatch = response.match(/family[:\s]*([0-9.]+)/i);
    const communityMatch = response.match(/community[:\s]*([0-9.]+)/i);
    const financeMatch = response.match(/finance[:\s]*([0-9.]+)/i);
    const investmentMatch = response.match(/investment[:\s]*([0-9.]+)/i);

    if (familyMatch || communityMatch || financeMatch || investmentMatch) {
        const weights = {
            family: familyMatch ? parseFloat(familyMatch[1]) / 100 : currentWeights.family,
            community: communityMatch ? parseFloat(communityMatch[1]) / 100 : currentWeights.community,
            finance: financeMatch ? parseFloat(financeMatch[1]) / 100 : currentWeights.finance,
            investment: investmentMatch ? parseFloat(investmentMatch[1]) / 100 : currentWeights.investment
        };

        const sum = Object.values(weights).reduce((a, b) => a + b, 0);
        if (sum > 0) {
            result.persona_weights = Object.fromEntries(
                Object.entries(weights).map(([k, v]) => [k, v / sum])
            );
        }
    }

    const agendaMatch = response.match(/agenda[:\s]*\[?([^\]]+)\]?/is);
    if (agendaMatch) {
        const topics = agendaMatch[1]
            .split(/[,\n]/)
            .map(t => t.trim().replace(/^["'\d.]+|["']$/g, ''))
            .filter(t => t.length > 5)
            .slice(0, 4);
        if (topics.length > 0) {
            result.agenda = topics;
        }
    }

    const reasoningMatch = response.match(/reasoning[:\s]*(.+?)(?:agenda|weights|$)/is);
    if (reasoningMatch) {
        result.reasoning = reasoningMatch[1].trim().substring(0, 200);
    }

    return result;
}

/**
 * Analyze intent AND UPDATE WEIGHTS based on user query
 */
export async function analyzeIntent(threadId, userQuery, propertyAddress, currentWeights) {
    console.log('[orchestrator] analyzing intent...');
    console.log(`[orchestrator] current weights:`, currentWeights);

    // KEYWORD-BASED WEIGHT BOOST (happens regardless of Backboard)
    let weights = { ...currentWeights };

    const query = userQuery.toLowerCase();

    if (query.includes('family') || query.includes('kids') || query.includes('children') || query.includes('school')) {
        weights.family = Math.min(0.70, weights.family + 0.15);  // BOOST family
        console.log(`[orchestrator] Detected family keywords - boosting family weight`);
    }
    if (query.includes('invest') || query.includes('rental') || query.includes('income')) {
        weights.investment = Math.min(0.50, weights.investment + 0.15);
        console.log(`[orchestrator] Detected investment keywords - boosting investment weight`);
    }
    if (query.includes('walk') || query.includes('transit') || query.includes('downtown') || query.includes('urban')) {
        weights.community = Math.min(0.50, weights.community + 0.15);
        console.log(`[orchestrator] Detected community keywords - boosting community weight`);
    }

    const message = `Analyze these user priorities and refine the weights:

User Query: "${userQuery}"
Property: "${propertyAddress || 'not specified'}"

Current weights (adjusted): Family ${(weights.family * 100).toFixed(0)}%, Community ${(weights.community * 100).toFixed(0)}%, Finance ${(weights.finance * 100).toFixed(0)}%, Investment ${(weights.investment * 100).toFixed(0)}%

Do these weights match the user's priorities? Return ONLY JSON:
{"persona_weights":{"family":0.70,"community":0.15,"finance":0.10,"investment":0.05},"agenda":["topic1","topic2","topic3","topic4"],"reasoning":"brief"}`;

    try {
        const response = await sendMessage(threadId, message);
        const parsed = parseOrchestratorResponse(response, weights);

        console.log(`[orchestrator] ✅ Real Backboard API`);
        console.log(`[orchestrator] updated weights:`, parsed.persona_weights);

        return parsed;
    } catch (err) {
        console.log(`[orchestrator] ⚠️  Using keyword-adjusted weights (${err.message})`);

        // Normalize weights
        const sum = Object.values(weights).reduce((a, b) => a + b, 0);
        const normalized = Object.fromEntries(
            Object.entries(weights).map(([k, v]) => [k, v / sum])
        );

        console.log(`[orchestrator] normalized weights:`, normalized);

        return {
            persona_weights: normalized,
            agenda: ['Community Livability', 'Family Suitability', 'Financial Feasibility', 'Investment Outlook'],
            reasoning: 'Keyword-based priority analysis'
        };
    }
}

/**
 * Build debate structure
 */
export function buildDebateStructure(agendaTopics) {
    const agents = ['COMMUNITY', 'FAMILY', 'FINANCE', 'INVESTMENT'];
    return {
        round1: agents.map((agent, idx) => ({
            agent, round: 1, topic: agendaTopics[idx] || agents[idx], type: 'initial'
        })),
        round2: [
            { agent: 'FAMILY', round: 2, challenger: 'COMMUNITY', type: 'counter' },
            { agent: 'INVESTMENT', round: 2, challenger: 'FAMILY', type: 'counter' },
            { agent: 'FINANCE', round: 2, challenger: 'INVESTMENT', type: 'counter' },
            { agent: 'COMMUNITY', round: 2, challenger: 'FINANCE', type: 'counter' }
        ],
        round3: agents.map(agent => ({ agent, round: 3, type: 'verdict' }))
    };
}

export default {
    analyzeIntent,
    buildDebateStructure
};