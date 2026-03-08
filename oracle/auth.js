// auth.js — User signup, login, getUser
import 'dotenv/config';
import supabase from './db.js';
import bb from './backboard.js';

// ── SIGNUP ────────────────────────────────────────────────────────────────────
export async function signup({ email, password, firstName, annualIncome, downPayment, familySize, firstTimeBuyer }) {

    // 1. Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) throw new Error(`Supabase signup failed: ${authError.message}`);

    const userId = authData.user.id;

    // 2. Insert profile row with default persona weights
    const { error: insertError } = await supabase
        .from('users')
        .insert({
            id: userId,
            email,
            first_name: firstName || null,
            annual_income: annualIncome || null,
            down_payment: downPayment || null,
            family_size: familySize || null,
            first_time_buyer: firstTimeBuyer ?? true,
            backboard_thread_id: null,
            persona_weights: {
                family: 0.35,
                finance: 0.25,
                community: 0.25,
                investment: 0.15
            }
        });

    if (insertError) throw new Error(`Profile insert failed: ${insertError.message}`);

    // 3. Create Backboard thread for this user
    const thread = await bb.createThread(process.env.BACKBOARD_ASSISTANT_ID);

    // 4. Write thread_id back to Supabase
    const { error: updateError } = await supabase
        .from('users')
        .update({ backboard_thread_id: thread.threadId })
        .eq('id', userId);

    if (updateError) throw new Error(`Thread ID write failed: ${updateError.message}`);

    console.log(`[auth] signup: ${email} → thread ${thread.threadId}`);

    return { userId, email, threadId: thread.threadId, session: authData.session };
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────
export async function login({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(`Login failed: ${error.message}`);
    return data.session;
}

// ── GET USER ──────────────────────────────────────────────────────────────────
export async function getUser(userId) {
    const { data, error } = await supabase
        .from('users')
        .select('id, email, first_name, annual_income, down_payment, family_size, first_time_buyer, backboard_thread_id, persona_weights')
        .eq('id', userId)
        .single();

    if (error) throw new Error(`User not found: ${error.message}`);
    if (!data.backboard_thread_id) throw new Error(`No Backboard thread for user ${userId}`);

    return data;
}