// server.js — Housing Oracle REST API with debate system
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { runPipeline } from './pipeline.js';
import { signup, login, getUser } from './auth.js';

const app = express();
app.use(cors());
app.use(express.json());

// ── AUTHENTICATION ────────────────────────────────────────────────────────────

// POST /auth/signup
app.post('/auth/signup', async (req, res) => {
    try {
        const result = await signup(req.body);
        res.status(201).json(result);
    } catch (err) {
        console.error('[signup]', err.message);
        res.status(400).json({ error: err.message });
    }
});

// POST /auth/login
app.post('/auth/login', async (req, res) => {
    try {
        const session = await login(req.body);
        res.json({ session });
    } catch (err) {
        console.error('[login]', err.message);
        res.status(401).json({ error: err.message });
    }
});

// GET /auth/me/:userId
app.get('/auth/me/:userId', async (req, res) => {
    try {
        const user = await getUser(req.params.userId);
        res.json(user);
    } catch (err) {
        console.error('[getUser]', err.message);
        res.status(404).json({ error: err.message });
    }
});

// ── DEBATE API ────────────────────────────────────────────────────────────────

/**
 * POST /api/query — Run the complete debate pipeline
 * Body:
 *   - userId (required): User ID
 *   - userQuery (required): Question to ask the oracle
 *   - propertyAddress (optional): Address to analyze
 */
app.post('/api/query', async (req, res) => {
    const { userId, userQuery, propertyAddress } = req.body;

    if (!userId || !userQuery) {
        return res.status(400).json({
            error: 'userId and userQuery are required.'
        });
    }

    try {
        const result = await runPipeline(userId, userQuery, propertyAddress || null);
        res.json(result);
    } catch (err) {
        console.error('[query]', err.message);
        res.status(500).json({
            error: err.message || 'Pipeline execution failed'
        });
    }
});

// ── HEALTH & INFO ─────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
    res.json({
        name: 'Housing Oracle Debate System',
        version: '1.0.0',
        endpoints: {
            auth: {
                signup: 'POST /auth/signup',
                login: 'POST /auth/login',
                profile: 'GET /auth/me/:userId'
            },
            debate: {
                query: 'POST /api/query'
            }
        }
    });
});

// ── ERROR HANDLING ────────────────────────────────────────────────────────────

app.use((err, req, res, next) => {
    console.error('[error]', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// ── START SERVER ──────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`  Housing Oracle — Debate System API`);
    console.log(`  http://localhost:${PORT}`);
    console.log(`  Mode: ${process.env.BACKBOARD_API_KEY ? 'LIVE' : 'MOCK'}`);
    console.log('═'.repeat(60));
    console.log('\nEndpoints:');
    console.log('  POST   /auth/signup');
    console.log('  POST   /auth/login');
    console.log('  GET    /auth/me/:userId');
    console.log('  POST   /api/query');
    console.log(`\n${'═'.repeat(60)}\n`);
});

export default app;