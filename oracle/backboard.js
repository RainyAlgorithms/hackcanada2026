// backboard.js — Backboard SDK client singleton
import { BackboardClient } from 'backboard-sdk';
import 'dotenv/config';

const client = new BackboardClient({ apiKey: process.env.BACKBOARD_API_KEY });

export default client;