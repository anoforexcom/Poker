import { createClient } from '@supabase/supabase-js';

// In Vercel, these variables need to be configured in the Project Dashboard
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ CRITICAL ERROR: Supabase credentials not found!');
    console.warn('Make sure to add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the Vercel Dashboard.');
}

// Initialize with empty strings if missing (createClient won't explode on import, but will fail on calls)
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder'
);
