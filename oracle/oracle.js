// oracle.js — Flexible response parsing
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
 * Parse oracle response flexibly
 */
function parseOracleResponse(response) {
    const result = {
        oracle: 'ORACLE',
        recommendation: '',
        weighted_analysis: '',
        key_insights: [],
        final_verdict: 'MAYBE',
        next_steps: ''
    };

    // Try JSON first
    try {
        const json = JSON.parse(response);
        result.recommendation = json.recommendation || result.recommendation;
        result.weighted_analysis = json.weighted_analysis || result.weighted_analysis;
        result.key_insights = json.key_insights || result.key_insights;
        result.final_verdict = json.final_verdict || result.final_verdict;
        result.next_steps = json.next_steps || result.next_steps;
        return result;
    } catch (e) {
        // Continue with text parsing
    }

    // Extract verdict (YES, MAYBE, NO)
    const verdictMatch = response.match(/verdict[:\s]+(YES|MAYBE|NO)/i);
    if (verdictMatch) {
        result.final_verdict = verdictMatch[1].toUpperCase();
    }

    // Extract recommendation (usually first or longest paragraph)
    const lines = response.split('\n').filter(l => l.trim().length > 10);
    result.recommendation = lines
        .find(l => !l.includes('verdict') && !l.includes('insight') && !l.includes('step')) || '';

    // Extract insights (look for numbered lists or bullet points)
    const insightMatch = response.match(/insight[s]?[:\s]*\n?([\s\S]+?)(?:next|step|verdict|$)/i);
    if (insightMatch) {
        const insights = insightMatch[1]
            .split(/[\n•-]/)
            .map(i => i.trim().replace(/^\d+\.\s*/, ''))
            .filter(i => i.length > 10)
            .slice(0, 4);
        result.key_insights = insights;
    }

    // Extract next steps
    const stepsMatch = response.match(/next[:\s]*step[s]?[:\s]*(.+?)(?:insight|verdict|$)/is);
    if (stepsMatch) {
        result.next_steps = stepsMatch[1].trim().substring(0, 200);
    }

    // Extract weighted analysis
    const analysisMatch = response.match(/weighted[:\s]*(.+?)(?:insight|recommendation|next|$)/is);
    if (analysisMatch) {
        result.weighted_analysis = analysisMatch[1].trim().substring(0, 300);
    }

    return result;
}

/**
 * Synthesize debate
 */
export async function synthesizeDebate(threadId, userQuery, propertyAddress, agentResponses, personaWeights) {
    console.log('[oracle] synthesizing debate...');

    const debateTranscript = agentResponses.map(agent =>
        `${agent.agent}: ${agent.argument} (Verdict: ${agent.verdict})`
    ).join('\n');

    const message = `Synthesize this real estate debate and provide your recommendation.

DEBATE:
${debateTranscript}

USER PRIORITIES:
- Family: ${(personaWeights.family * 100).toFixed(0)}%
- Community: ${(personaWeights.community * 100).toFixed(0)}%
- Finance: ${(personaWeights.finance * 100).toFixed(0)}%
- Investment: ${(personaWeights.investment * 100).toFixed(0)}%

PROPERTY: ${propertyAddress}

Provide:
1. Your recommendation (1-2 sentences)
2. How user priorities affect the decision
3. Key insights (2-4 bullets)
4. Your verdict: YES, MAYBE, or NO
5. Next steps

Any format works - plain text, JSON, bullet points, whatever.`;

    try {
        const response = await sendMessage(threadId, message);
        const parsed = parseOracleResponse(response);

        console.log(`[oracle] ✅ verdict: ${parsed.final_verdict}`);
        return parsed;
    } catch (err) {
        console.log(`[oracle] ⚠️  Using mock (${err.message})`);
        return getMockOracleSynthesis(personaWeights);
    }
}

/**
 * Mock oracle
 */
function getMockOracleSynthesis(personaWeights) {
    const familyWeight = personaWeights.family || 0.35;

    let verdict = 'MAYBE';
    let recommendation = 'This property has mixed advantages that require careful consideration.';

    if (familyWeight > 0.45) {
        verdict = 'NO';
        recommendation = `Family suitability is your top priority (${(familyWeight * 100).toFixed(0)}%), and this property doesn't meet those needs well.`;
    } else if (familyWeight > 0.35) {
        verdict = 'MAYBE';
        recommendation = `Your moderate family focus (${(familyWeight * 100).toFixed(0)}%) means tradeoffs exist that you should carefully evaluate.`;
    }

    return {
        oracle: 'ORACLE',
        recommendation,
        weighted_analysis: `Your priorities: Family ${(familyWeight * 100).toFixed(0)}%, others distributed accordingly.`,
        key_insights: [
            'Strong potential for appreciation',
            'Mixed amenity quality',
            'Consider local development',
            'Visit multiple times'
        ],
        final_verdict: verdict,
        next_steps: 'Visit the property multiple times, check local schools, and review development plans.'
    };
}

/**
 * Format for TTS
 */
export function formatForTTS(agentResponses, oracleResponse) {
    const lines = [];
    for (const agent of agentResponses) {
        lines.push(`${agent.agent}: ${agent.argument}`);
    }
    lines.push(`ORACLE: ${oracleResponse.recommendation}`);
    lines.push(`Verdict: ${oracleResponse.final_verdict}`);
    return lines.join('\n\n');
}

/**
 * Create certificate
 */
export function createCertificate(userId, propertyAddress, oracleVerdict, personaWeights) {
    const timestamp = new Date().toISOString();
    return {
        certificateId: `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        propertyAddress,
        verdict: oracleVerdict,
        personaWeights,
        timestamp,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
}

export default {
    synthesizeDebate,
    formatForTTS,
    createCertificate
};