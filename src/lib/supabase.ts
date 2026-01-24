import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// User types
export interface User {
    id: string;
    email: string;
    status: 'pending' | 'active';
    apiCallsRemaining: number;
    createdAt: string;
}

// Rate limit check
export async function checkRateLimit(userId: string): Promise<boolean> {
    const { data, error } = await supabase
        .from('users')
        .select('apiCallsRemaining')
        .eq('id', userId)
        .single();

    if (error || !data) return false;
    return data.apiCallsRemaining > 0;
}

// Decrement API call count
export async function decrementApiCalls(userId: string): Promise<void> {
    await supabase.rpc('decrement_api_calls', { user_id: userId });
}
