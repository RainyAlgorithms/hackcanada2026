// agents.js — Final version with real data lookup
import 'dotenv/config';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { findPropertyByAddress, formatPropertyForDisplay } from './listing-lookup.js';

const API_KEY = process.env.BACKBOARD_API_KEY;

/**
 * Send message and poll
 */
async function sendMessage(threadId, content, webSearch = true) {
    try {
        const form = new FormData();
        form.append('role', 'user');
        form.append('content', content);
        if (webSearch) form.append('web_search', 'true');
        form.append('llm_provider', 'openrouter');
        form.append('model_name', 'google/gemini-2.5-flash');
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
        await new Promise(r => setTimeout(r, 700));

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
 * Parse response flexibly
 */
function parseAgentResponse(response, agent) {
    const result = {
        agent,
        argument: '',
        searches: [],
        challenge: '',
        verdict: 'MIXED'
    };

    try {
        const json = JSON.parse(response);
        result.argument = json.argument || result.argument;
        result.searches = json.searches || result.searches;
        result.challenge = json.challenge || result.challenge;
        result.verdict = json.verdict || result.verdict;
        return result;
    } catch (e) {
        // Continue with text parsing
    }

    const verdictMatch = response.match(/verdict[:\s]+(GOOD|BAD|MIXED|STRONG)/i);
    if (verdictMatch) {
        result.verdict = verdictMatch[1].toUpperCase();
    }

    const argMatch = response.match(/argument[:\s]*(.+?)(?:challenge|search|verdict|$)/is);
    if (argMatch) {
        result.argument = argMatch[1].trim().substring(0, 500);
    } else {
        const lines = response.split('\n');
        const para = lines.find(l => l.trim().length > 20);
        if (para) {
            result.argument = para.trim().substring(0, 500);
        }
    }

    const searchMatch = response.match(/search[es]*[:\s]*\[?([^\]]+)\]?/is);
    if (searchMatch) {
        const searches = searchMatch[1]
            .split(/[,\n]/)
            .map(s => s.trim().replace(/^["']|["']$/g, ''))
            .filter(s => s.length > 3)
            .slice(0, 3);
        result.searches = searches;
    }

    const challengeMatch = response.match(/challenge[:\s]*(.+?)(?:verdict|search|$)/is);
    if (challengeMatch) {
        result.challenge = challengeMatch[1].trim().substring(0, 500);
    }

    return result;
}

const AGENT_CONFIG = {
    COMMUNITY: {
        focus: ['walkability', 'safety', 'transit', 'restaurants', 'neighborhood reputation'],
    },
    FAMILY: {
        focus: ['schools', 'parks', 'daycare', 'safety for children'],
    },
    FINANCE: {
        focus: ['economic outlook', 'property appreciation', 'infrastructure'],
    },
    INVESTMENT: {
        focus: ['rental demand', 'price growth', 'investor interest'],
    }
};

/**
 * Run a single specialist agent WITH REAL PROPERTY DATA
 */
export async function runAgent(agent, threadId, userQuery, propertyAddress, otherVerdicts = {}) {
    const config = AGENT_CONFIG[agent];
    if (!config) throw new Error(`Unknown agent: ${agent}`);

    console.log(`[${agent}] running with REAL DATA...`);

    // Find the actual property
    const property = findPropertyByAddress(propertyAddress);

    if (!property) {
        console.log(`[${agent}] ❌ Property not found: ${propertyAddress}`);
        return getMockAgentResponse(agent, propertyAddress, null);
    }

    // Format property data
    const propData = formatPropertyForDisplay(property);

    // Build message with REAL data
    const message = `You are the ${agent} Agent analyzing a REAL property.

PROPERTY DATA:
Address: ${propData.address}
Price: ${propData.price}
Beds: ${propData.beds} | Baths: ${propData.baths} | Sqft: ${propData.sqft}
Type: ${propData.propertyType} | Year Built: ${propData.yearBuilt}
Walk Score: ${propData.walkScore} | Transit Score: ${propData.transitScore}
Nearby Schools: ${propData.schools.join(', ')}
Nearby Amenities: ${propData.nearbyAmenities.join(', ')}

USER QUERY: "${userQuery}"
${Object.keys(otherVerdicts).length > 0 ? `Other agent verdicts: ${JSON.stringify(otherVerdicts)}\nBriefly challenge at least one.` : ''}

Based on THIS ACTUAL PROPERTY DATA:
- Analyze the ${agent.toLowerCase()}'s perspective
- Use real data provided above

Provide:
- Your main argument about THIS property (1-2 sentences, based on real data)
- Any relevant searches you'd perform
- How you challenge other agents
- Your verdict: GOOD, BAD, MIXED, or STRONG

Use the actual property data provided, not speculation.`;

    try {
        const response = await sendMessage(threadId, message, true);
        const parsed = parseAgentResponse(response, agent);

        if (!parsed.argument) {
            console.log(`[${agent}] ⚠️  Partial response`);
        } else {
            console.log(`[${agent}] ✅ verdict: ${parsed.verdict} (REAL DATA)`);
        }

        return parsed;
    } catch (err) {
        console.log(`[${agent}] ⚠️  Using smart mock (${err.message})`);
        return getMockAgentResponse(agent, propertyAddress, property);
    }
}

/**
 * Smart mock response using real property data if available
 */
function getMockAgentResponse(agent, propertyAddress, property) {
    if (!property) {
        return {
            agent,
            argument: `Property "${propertyAddress}" not found in listings database.`,
            searches: [],
            challenge: 'Cannot analyze property that does not exist.',
            verdict: 'MIXED'
        };
    }

    const propData = formatPropertyForDisplay(property);

    const mocks = {
        COMMUNITY: {
            agent: 'COMMUNITY',
            argument: `Walk Score of ${property.walkScore} indicates ${property.walkScore > 80 ? 'excellent' : property.walkScore > 70 ? 'good' : 'moderate'} walkability in ${property.address.city}. Nearby amenities include ${property.nearbyAmenities?.slice(0, 3).join(', ')}.`,
            searches: ['walkability score', 'transit access', 'nearby amenities'],
            challenge: property.walkScore > 75 ? 'Strong community features make this location desirable.' : 'Lower walkability may be a concern for urban lifestyle.',
            verdict: property.walkScore > 75 ? 'GOOD' : property.walkScore > 65 ? 'MIXED' : 'BAD'
        },
        FAMILY: {
            agent: 'FAMILY',
            argument: `${property.description.beds} bedrooms available. Nearby schools include ${property.schools?.map(s => s.name).slice(0, 2).join(', ') || 'local schools'} with solid ratings.`,
            searches: ['school ratings', 'nearby parks', 'family amenities'],
            challenge: property.schools?.some(s => s.rating > 8) ? 'Good schools are a major plus for families.' : 'School quality is moderate - may concern families.',
            verdict: property.schools?.some(s => s.rating > 8) ? 'GOOD' : property.schools?.some(s => s.rating > 7.5) ? 'MIXED' : 'BAD'
        },
        FINANCE: {
            agent: 'FINANCE',
            argument: `Property priced at ${propData.price} built in ${property.description.year_built}. Located in ${property.address.city} market with potential for growth.`,
            searches: ['property appreciation', 'market trends', 'development plans'],
            challenge: property.description.year_built > 2010 ? 'Newer construction may have good appreciation potential.' : 'Older properties may need updates, affecting appreciation.',
            verdict: property.list_price < 600000 ? 'GOOD' : property.list_price < 1000000 ? 'MIXED' : 'MIXED'
        },
        INVESTMENT: {
            agent: 'INVESTMENT',
            argument: `${property.description.beds} bed ${propData.propertyType} at ${propData.price}. Located in ${property.address.city} with transit score of ${property.transitScore}.`,
            searches: ['rental demand', 'rent prices', 'investment returns'],
            challenge: property.transitScore > 80 ? 'High transit score suggests strong rental demand.' : 'Lower transit may limit rental pool.',
            verdict: property.description.property_type.includes('multi_family') || property.description.property_type.includes('condo') ? 'STRONG' : 'GOOD'
        }
    };

    return mocks[agent] || mocks.COMMUNITY;
}

/**
 * Run all specialist agents
 */
export async function runAllAgents(threadId, userQuery, propertyAddress) {
    const agents = ['COMMUNITY', 'FAMILY', 'FINANCE', 'INVESTMENT'];
    const verdicts = {};

    const property = findPropertyByAddress(propertyAddress);
    if (!property) {
        console.log(`[pipeline] Property not found: ${propertyAddress}`);
    }

    const results = [];
    for (const agent of agents) {
        const result = await runAgent(agent, threadId, userQuery, propertyAddress, verdicts);
        results.push(result);
        verdicts[agent] = result.verdict;
    }

    return results;
}

export default {
    runAgent,
    runAllAgents,
    AGENT_CONFIG,
    findPropertyByAddress
};