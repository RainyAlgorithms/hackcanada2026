Housing Oracle — Complete Setup Guide
Project Structure
oracle/
├── .env.example        ← copy to .env, fill in 3 keys
├── .gitignore
├── package.json
│
├── backboard.js        ← Backboard REST client (one function)
├── db.js               ← Supabase client (null in mock mode)
├── auth.js             ← signup / login / getUser
├── pipeline.js         ← 4 agents + synthesizer + certificate
├── server.js           ← Express API
├── setup.js            ← run once: creates assistant + uploads RAG docs
│
└── rag-docs/           ← create this folder, drop .txt files here (optional)
    ├── cmhc-stress-test-2026.txt
    ├── cra-fhsa-2026.txt
    ├── ontario-ltt.txt
    └── hamilton-zoning-2026.txt

Keys You Need
Backend .env (you)
KeyWhere to get itBACKBOARD_API_KEYapp.backboard.io → Settings → API KeysSUPABASE_URLsupabase.com → your project → Settings → API → Project URLSUPABASE_SERVICE_KEYsupabase.com → your project → Settings → API → service_role (secret)
Frontend .env (your teammate)
KeyWhere to get itSUPABASE_URLsame as aboveSUPABASE_ANON_KEYsupabase.com → your project → Settings → API → anon (public)BACKEND_URLhttp://localhost:3000 (or deployed URL)

Step 1 — Install
bashnpm install

Step 2 — Create your .env
bashcp .env.example .env
Open .env and fill in these 3 keys:
BACKBOARD_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=

Step 3 — One-time Backboard + RAG setup
bashnode setup.js
This will:

Create the Housing Oracle assistant in Backboard
Upload 4 Canadian policy documents as RAG (uses mock content if no real files)
Print the SQL you need to run in Supabase
Automatically write all generated IDs into your .env


Step 4 — Run the Supabase SQL
Copy the SQL printed by setup.js and run it in:
supabase.com → your project → SQL Editor → New query → Paste → Run
It creates the users table with the backboard_thread_id column.

Step 5 — Start the server
bashnode server.js
You'll see:
══════════════════════════════════════════
  Housing Oracle API — http://localhost:3000
  Mode:     LIVE
  Memory:   Backboard
  Database: Supabase
══════════════════════════════════════════

Step 6 — Test it
Signup a user (creates Backboard thread automatically)
bashcurl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstTimeBuyer": true,
    "annualIncome": 120000,
    "downPayment": 80000,
    "familySize": 3
  }'
Response includes userId — use it for queries.
Query the Oracle
bashcurl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "paste-user-id-here",
    "userQuery": "Is this a good place for my family?",
    "propertyAddress": "123 Barton St, Hamilton ON"
  }'
Get user profile
bashcurl http://localhost:3000/auth/me/paste-user-id-here

Test without any API keys (mock mode)
bashnode pipeline.js
Runs 3 simulated interactions with full mock data. No keys needed.

API Endpoints
MethodEndpointBodyPOST/auth/signup{ email, password, firstName?, annualIncome?, downPayment?, familySize?, firstTimeBuyer? }POST/auth/login{ email, password }GET/auth/me/:userId—POST/api/query{ userId, userQuery, propertyAddress? }

Adding Real Policy Documents (optional but recommended for demo)
Create rag-docs/ folder and add these as .txt files:
FileSourcecmhc-stress-test-2026.txtcmhc-schl.gc.ca → search "stress test qualifying rate"cra-fhsa-2026.txtcanada.ca → search "first home savings account"ontario-ltt.txtontario.ca/laws/statute/90l06hamilton-zoning-2026.txthamilton.ca → Planning → Zoning By-law
Then re-run node setup.js — it will re-upload with the real content.

How it works end to end
POST /auth/signup
  → create Supabase Auth user
  → insert users table row
  → create Backboard thread
  → write thread_id to users table

POST /api/query
  → load user from Supabase (gets thread_id)
  → fetch memory from Backboard thread
  → run 4 agents in parallel (hot-swapped models)
      Community   → google/gemini-2.0-flash
      Finance     → anthropic/claude-sonnet-4-5  + RAG docs
      Family      → google/gemini-2.0-flash
      Investment  → anthropic/claude-haiku  + RAG docs
  → synthesizer produces one spoken answer
  → store interaction in Backboard (memory auto-updates)
  → return synthesis + agent reports + certificate

What Backboard does (for judges)
FeatureHow it's usedStateful memoryEvery query updates the user's memory — deal breakers, preferences, taste signals persist forever across sessionsModel hot-swappingFinance agent uses Claude Sonnet, Investment uses Claude Haiku, Community/Family use Gemini Flash — best model per taskDocument RAGCMHC stress test rules, FHSA eligibility, Ontario LTT, Hamilton zoning — Finance agent cites exact policy sectionsMulti-agent orchestration4 specialist agents run in parallel, synthesizer merges results weighted by user memory