// setup.js — One-time setup: create assistant, upload RAG docs, print SQL
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BackboardClient } from 'backboard-sdk';
import { default as nodeFetch } from 'node-fetch';
import FormDataNode from 'form-data';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bb = new BackboardClient({ apiKey: process.env.BACKBOARD_API_KEY });

// ── RAG DOCUMENTS ─────────────────────────────────────────────────────────────
const DOCS = {
    'cmhc-stress-test-2026.txt': {
        envKey: 'RAG_DOC_STRESS_TEST',
        content: `CMHC Mortgage Stress Test Rules 2026
=====================================
Section 3.2 — Qualifying Rate
The minimum qualifying rate for insured mortgages is the greater of:
(a) 5.25% per annum, or
(b) the contract interest rate plus 2.00 percentage points.

Section 4.1 — Debt Service Ratios
Gross Debt Service (GDS) ratio must not exceed 39%.
Total Debt Service (TDS) ratio must not exceed 44%.
GDS = (PITH) / Gross Annual Income
TDS = (PITH + all other debt payments) / Gross Annual Income
PITH = Principal + Interest + Property Taxes + Heating costs

Section 5.1 — Down Payment Requirements
Minimum 5% on first $500,000.
Minimum 10% on portion between $500,000 and $999,999.
Minimum 20% on purchase price $1,000,000 and above.

Section 6.1 — Amortization
Maximum 25 years for insured mortgages.
Maximum 30 years for uninsured mortgages (20%+ down).`,
    },
    'cra-fhsa-2026.txt': {
        envKey: 'RAG_DOC_FHSA',
        content: `First Home Savings Account (FHSA) — CRA 2026
=============================================
Eligibility Requirements:
- Canadian resident, 18 years of age or older
- First-time home buyer (no qualifying home ownership in current year or preceding 4 years)
- Cannot contribute if spouse/common-law partner currently owns a qualifying home

Annual Contribution Limit: $8,000
Lifetime Contribution Limit: $40,000
Unused room carries forward (max $16,000 in a single year)

Tax Treatment:
- Contributions are fully tax-deductible (like RRSP)
- Qualifying withdrawals are completely tax-free (like TFSA)
- Must be used for a qualifying home purchase or transferred to RRSP/RRIF by age 71`,
    },
    'ontario-ltt.txt': {
        envKey: 'RAG_DOC_LTT',
        content: `Ontario Land Transfer Tax — 2026 Rates
=======================================
Tax calculated on purchase price:
  0.5%  on the first $55,000
  1.0%  on $55,001 to $250,000
  1.5%  on $250,001 to $400,000
  2.0%  on $400,001 to $2,000,000
  2.5%  on amounts exceeding $2,000,000

First-Time Homebuyer Rebate (Ontario): Maximum $4,000
First-Time Homebuyer Rebate (Toronto): Maximum additional $4,475`,
    },
    'hamilton-zoning-2026.txt': {
        envKey: 'RAG_DOC_ZONING',
        content: `City of Hamilton — Zoning and Development Plan 2026
=====================================================
Transit-Oriented Corridors:
- King Street East/West: up to 8 storeys
- Main Street East: mixed-use, minimum 4 storeys
- Barton Street: neighbourhood improvement plan, 3-4 storeys

Protected Low-Density Neighbourhoods:
- Kirkendall, Durand, Westdale: max 2.5 storeys, heritage protected
- Ancaster Village: heritage overlay, strict character guidelines

Approved 2026 Developments:
- Stoney Creek waterfront: 1,200 units across 3 towers (Phase 1 Q2 2026)
- Concession at Upper James: 6-storey mixed-use, 240 units (approved Nov 2025)
- Downtown core: 2 office-to-residential conversions, 180 units total

GO Transit Expansion:
- Confederation GO Station: opening Q3 2027
- West Harbour GO: increasing from 2 to 4 trains/hour in 2026`,
    },
};

// ── STEP 1: Create Backboard assistant ──────────────────────────────────────
async function createAssistant() {
    console.log('\n[1/3] Creating Backboard assistant...');
    const assistant = await bb.createAssistant({
        name: 'Housing Oracle Debate System',
        description: 'Multi-agent debate system for Canadian housing analysis',
        tools: [
            {
                type: 'function',
                function: {
                    name: 'web_search',
                    description: 'Search the web for current information about Canadian real estate, neighbourhoods, schools, crime stats, mortgage rules, and market data.',
                    parameters: {
                        type: 'object',
                        properties: {
                            query: {
                                type: 'string',
                                description: 'The search query to look up current data'
                            }
                        },
                        required: ['query']
                    }
                }
            }
        ],
        system_prompt: `You are part of the Housing Oracle — a multi-agent debate system for Canadian real estate analysis.
You specialize in analyzing properties from different perspectives: community, family, finance, and investment.
You have persistent memory of everything each user tells you across all sessions.
When referencing policy documents, cite the specific section.
Be honest about uncertainty — flag low confidence clearly.
Always search the web for current data before answering.`
    });

    console.log(`   ✅ Assistant created: ${assistant.assistantId}`);
    return assistant.assistantId;
}

// ── STEP 2: Upload RAG documents ───────────────────────────────────────────
async function uploadRagDocs(assistantId) {
    console.log('\n[2/3] Uploading RAG documents...');
    const RAG_DIR = path.join(__dirname, 'rag-docs');
    if (!fs.existsSync(RAG_DIR)) fs.mkdirSync(RAG_DIR);
    const ids = {};

    for (const [filename, config] of Object.entries(DOCS)) {
        const realPath = path.join(RAG_DIR, filename);
        const tempPath = path.join(__dirname, `_temp_${filename}`);
        const uploadPath = fs.existsSync(realPath) ? realPath : tempPath;

        if (!fs.existsSync(realPath)) {
            fs.writeFileSync(tempPath, config.content.trim());
        }

        const form = new FormDataNode();
        form.append('file', fs.createReadStream(uploadPath), {
            filename,
            contentType: 'text/plain'
        });

        const uploadRes = await nodeFetch(
            `https://app.backboard.io/api/assistants/${assistantId}/documents`,
            {
                method: 'POST',
                headers: {
                    'X-API-Key': process.env.BACKBOARD_API_KEY,
                    ...form.getHeaders()
                },
                body: form
            }
        );

        if (!uploadRes.ok) {
            throw new Error(`Upload failed for ${filename}: ${await uploadRes.text()}`);
        }

        const doc = await uploadRes.json();
        process.stdout.write(`   Indexing ${filename}...`);

        // Poll for indexing completion
        while (true) {
            const statusRes = await nodeFetch(
                `https://app.backboard.io/api/documents/${doc.document_id}/status`,
                {
                    headers: { 'X-API-Key': process.env.BACKBOARD_API_KEY }
                }
            );
            const status = await statusRes.json();

            if (status.status === 'indexed') {
                console.log(` ✅ ${doc.document_id}`);
                break;
            }
            if (status.status === 'error') {
                console.log(` ❌ failed`);
                break;
            }
            await new Promise(r => setTimeout(r, 2000));
            process.stdout.write('.');
        }

        ids[config.envKey] = doc.document_id;

        // Clean up temp file
        if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
        }
    }

    return ids;
}

// ── STEP 3: Print Supabase SQL ─────────────────────────────────────────────
function printSupabaseSQL() {
    console.log(`\n${'─'.repeat(70)}`);
    console.log('  Run this SQL in Supabase SQL Editor:');
    console.log(`${'─'.repeat(70)}\n`);

    const sql = `-- Users table with persona weights and debate support
create table if not exists public.users (
  id                   uuid primary key references auth.users(id) on delete cascade,
  email                text unique not null,
  first_name           text,
  annual_income        integer,
  down_payment         integer,
  family_size          integer,
  first_time_buyer     boolean default true,
  backboard_thread_id  text unique,
  persona_weights      jsonb default '{"community":0.25,"family":0.35,"finance":0.25,"investment":0.15}',
  created_at           timestamp with time zone default now()
);

-- Queries table to store debate history
create table if not exists public.queries (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.users(id) on delete cascade,
  user_query            text not null,
  property_address      text,
  orchestration_reasoning text,
  agent_responses       jsonb,
  oracle_response       jsonb,
  certificate_id        text unique,
  created_at            timestamp with time zone default now()
);

-- RLS policies
alter table public.users enable row level security;
alter table public.queries enable row level security;

create policy "Users manage own profile" on public.users for all using (auth.uid() = id);
create policy "Service role full access users" on public.users for all using (auth.role() = 'service_role');
create policy "Users manage own queries" on public.queries for all using (auth.uid() = user_id);
create policy "Service role full access queries" on public.queries for all using (auth.role() = 'service_role');`;

    console.log(sql);
    console.log(`\n${'─'.repeat(70)}\n`);
}

// ── STEP 4: Write IDs to .env ──────────────────────────────────────────────
function writeEnvIds(assistantId, docIds) {
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) {
        console.log('⚠️  No .env file found. Creating .env from .env.example...');
        if (fs.existsSync(path.join(__dirname, '.env.example'))) {
            fs.copyFileSync(path.join(__dirname, '.env.example'), envPath);
        }
    }

    let env = fs.readFileSync(envPath, 'utf8');
    const entries = { BACKBOARD_ASSISTANT_ID: assistantId, ...docIds };

    for (const [key, value] of Object.entries(entries)) {
        if (env.includes(`${key}=`)) {
            env = env.replace(new RegExp(`${key}=.*`), `${key}=${value}`);
        } else {
            env += `\n${key}=${value}`;
        }
    }

    fs.writeFileSync(envPath, env);
    console.log('   ✅ IDs written to .env');
}

// ── MAIN SETUP ─────────────────────────────────────────────────────────────
async function setup() {
    console.log('═'.repeat(70));
    console.log('  Housing Oracle Debate System — One-Time Setup');
    console.log('═'.repeat(70));

    try {
        const assistantId = await createAssistant();
        const docIds = await uploadRagDocs(assistantId);

        console.log('\n[3/3] Supabase configuration...');
        printSupabaseSQL();

        writeEnvIds(assistantId, docIds);

        console.log('═'.repeat(70));
        console.log('  ✅ Setup complete!');
        console.log('═'.repeat(70));
        console.log('\nNext steps:');
        console.log('  1. Copy the SQL above and run it in Supabase SQL Editor');
        console.log('  2. npm start (or npm run dev)');
        console.log('');
    } catch (err) {
        console.error('\n❌ Setup failed:', err.message);
        process.exit(1);
    }
}

setup();