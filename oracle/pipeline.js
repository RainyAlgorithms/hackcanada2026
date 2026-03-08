// pipeline.js — Main pipeline: orchestrate, agents, synthesis, certificate
import 'dotenv/config';
import supabase from './db.js';
import { analyzeIntent, buildDebateStructure } from './orchestrator.js';
import { runAllAgents } from './agents.js';
import { synthesizeDebate, formatForTTS, createCertificate } from './oracle.js';

/**
 * Run the complete debate pipeline for a user query
 * @param {string} userId - User ID
 * @param {string} userQuery - User question
 * @param {string} propertyAddress - Property address (optional)
 * @returns {object} Complete analysis with agents, synthesis, and certificate
 */
export async function runPipeline(userId, userQuery, propertyAddress) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  Housing Oracle Debate Pipeline`);
  console.log(`  User: ${userId}`);
  console.log(`  Query: ${userQuery}`);
  console.log(`  Property: ${propertyAddress || 'Not specified'}`);
  console.log('═'.repeat(60) + '\n');

  // 1. Get user profile and thread ID
  const user = await supabase
    .from('users')
    .select('backboard_thread_id, persona_weights')
    .eq('id', userId)
    .single();

  if (user.error) throw new Error(`User not found: ${user.error.message}`);

  const threadId = user.data.backboard_thread_id;
  const currentWeights = user.data.persona_weights || {
    community: 0.25,
    family: 0.35,
    finance: 0.25,
    investment: 0.15
  };

  // 2. Orchestrator: analyze intent and get persona weights
  const orchestration = await analyzeIntent(threadId, userQuery, propertyAddress, currentWeights);

  // Update user persona weights in DB
  await supabase
    .from('users')
    .update({ persona_weights: orchestration.persona_weights })
    .eq('id', userId);

  console.log(`[pipeline] orchestration complete`);

  // 3. Build debate structure
  const debateStructure = buildDebateStructure(orchestration.agenda);

  // 4. Run all specialist agents in parallel
  const agentResponses = await runAllAgents(threadId, userQuery, propertyAddress);

  console.log(`[pipeline] all agents complete`);

  // 5. Oracle synthesizes debate
  const oracleResponse = await synthesizeDebate(
    threadId,
    userQuery,
    propertyAddress,
    agentResponses,
    orchestration.persona_weights
  );

  // 6. Create certificate
  const certificate = createCertificate(
    userId,
    propertyAddress,
    oracleResponse.final_verdict,
    orchestration.persona_weights
  );

  // 7. Format for TTS
  const ttsDialogue = formatForTTS(agentResponses, oracleResponse);

  // 8. Store interaction in Supabase
  const { error: insertError } = await supabase
    .from('queries')
    .insert({
      user_id: userId,
      user_query: userQuery,
      property_address: propertyAddress,
      orchestration_reasoning: orchestration.reasoning,
      agent_responses: agentResponses,
      oracle_response: oracleResponse,
      certificate_id: certificate.certificateId,
      created_at: new Date().toISOString()
    });

  if (insertError) console.warn('[pipeline] failed to store query:', insertError.message);

  console.log(`[pipeline] complete ✅\n`);

  // 9. Return complete response
  return {
    userId,
    userQuery,
    propertyAddress,
    orchestration: {
      personaWeights: orchestration.persona_weights,
      agenda: orchestration.agenda,
      reasoning: orchestration.reasoning
    },
    debate: {
      agents: agentResponses,
      oracle: oracleResponse
    },
    output: {
      ttsDialogue,
      formattedResponse: formatDebateForUI(agentResponses, oracleResponse)
    },
    certificate
  };
}

/**
 * Format debate nicely for UI display
 * @param {object[]} agents - Agent responses
 * @param {object} oracle - Oracle response
 * @returns {string} HTML-formatted debate
 */
function formatDebateForUI(agents, oracle) {
  let html = '<div class="debate">\n';

  // Agent arguments
  html += '<div class="round round-1">\n<h3>Round 1: Initial Arguments</h3>\n';
  for (const agent of agents) {
    html += `<div class="agent agent-${agent.agent.toLowerCase()}">
<h4>${agent.agent}</h4>
<p>${agent.argument}</p>
</div>\n`;
  }
  html += '</div>\n';

  // Oracle synthesis
  html += '<div class="oracle">\n';
  html += '<h3>Oracle Synthesis</h3>\n';
  html += `<h4 class="verdict ${oracle.final_verdict.toLowerCase()}">${oracle.final_verdict}</h4>\n`;
  html += `<p>${oracle.recommendation}</p>\n`;
  html += `<p><strong>Next Steps:</strong> ${oracle.next_steps}</p>\n`;
  html += '</div>\n';

  html += '</div>\n';
  return html;
}

// ── TEST MODE (no API keys needed) ───────────────────────────────────────────
async function runMockPipeline() {
  console.log('\n' + '═'.repeat(60));
  console.log('  Housing Oracle — Mock Mode');
  console.log('═'.repeat(60) + '\n');

  const mockResponse = {
    userId: 'mock-user-123',
    userQuery: 'Is this a good place for my growing family?',
    propertyAddress: '123 King St W, Kitchener, Ontario',
    orchestration: {
      personaWeights: {
        family: 0.40,
        community: 0.30,
        finance: 0.20,
        investment: 0.10
      },
      agenda: ['Family Amenities', 'Community Quality', 'Financial Outlook', 'Investment Potential'],
      reasoning: 'User prioritizes family needs and community quality'
    },
    debate: {
      agents: [
        {
          agent: 'COMMUNITY',
          argument: 'Downtown Kitchener is highly walkable with excellent access to restaurants, shops, and the new LRT expansion.',
          searches: ['walkability downtown Kitchener', 'restaurants near King St'],
          challenge: 'Family Agent may overstate the importance of suburban schools if the buyer values urban lifestyle.',
          verdict: 'GOOD'
        },
        {
          agent: 'FAMILY',
          argument: 'School ratings near this property are average. While Community Agent highlights walkability, families typically prioritize school quality and green space. Parks nearby are limited.',
          searches: ['schools near King St Kitchener', 'parks downtown Kitchener'],
          challenge: 'Community Agent underestimated the family priorities. Urban walkability doesn\'t compensate for below-average schools.',
          verdict: 'MIXED'
        },
        {
          agent: 'FINANCE',
          argument: 'Major transit improvements and downtown development are expected in the next 3-5 years. Even if current amenities are average, these improvements will significantly increase property value.',
          searches: ['Kitchener development plans 2026', 'LRT expansion Kitchener'],
          challenge: 'Investment Agent focuses on short-term returns, but this property has strong long-term appreciation potential due to infrastructure.',
          verdict: 'GOOD'
        },
        {
          agent: 'INVESTMENT',
          argument: 'Downtown Kitchener has strong rental demand due to nearby tech companies and transit access. Even if not ideal for families, this could perform very well as a rental investment.',
          searches: ['rental demand Kitchener', 'tech companies Kitchener'],
          challenge: 'Family Agent dismisses investment potential, but rental yield here is strong.',
          verdict: 'STRONG'
        }
      ],
      oracle: {
        oracle: 'ORACLE',
        recommendation: 'Because your profile places the highest importance on family suitability (40%), this property may not be ideal. While the community is vibrant and financially promising, school quality and park availability are only average. Consider properties slightly outside downtown where family amenities are stronger.',
        weighted_analysis: 'Your family priority (40%) outweighs the finance (20%) and investment (10%) upside. The community (30%) is excellent but cannot compensate for family concerns.',
        key_insights: [
          'Strong long-term appreciation potential due to LRT expansion',
          'Below-average schools may impact resale to family buyers',
          'Excellent rental investment if you change plans'
        ],
        final_verdict: 'MAYBE',
        next_steps: 'Visit top-rated schools in nearby neighborhoods. Consider a hybrid: live slightly outside downtown, but within LRT commute.'
      }
    },
    output: {
      ttsDialogue: 'COMMUNITY:\nDowntown Kitchener is highly walkable with excellent access to restaurants...',
      formattedResponse: '<div class="debate">...</div>'
    },
    certificate: {
      certificateId: 'cert_mock_12345',
      userId: 'mock-user-123',
      propertyAddress: '123 King St W, Kitchener, Ontario',
      verdict: 'MAYBE',
      personaWeights: { family: 0.40, community: 0.30, finance: 0.20, investment: 0.10 },
      timestamp: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  };

  console.log(JSON.stringify(mockResponse, null, 2));
  return mockResponse;
}

// Run in mock mode if no API keys
if (!process.env.BACKBOARD_API_KEY) {
  console.log('⚠️  No BACKBOARD_API_KEY found. Running in mock mode.');
  runMockPipeline();
}