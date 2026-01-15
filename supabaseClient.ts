import { createClient } from '@supabase/supabase-js';

// ✅ あなたの Supabase プロジェクトに合わせて書き換えてください
const supabaseUrl = 'https://cbdoqrvrlgzlsefhoehv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiZG9xcnZybGd6bHNlZmhvZWh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MjQwNTYsImV4cCI6MjA4MTAwMDA1Nn0.SRc4LEHnISS6pU-kAd_bIyQQPAXpkHkJgkMTol-6vws';

console.log('🔍 Supabase URL:', supabaseUrl);
console.log('🔍 Supabase Key:', supabaseAnonKey ? '[SET]' : '[MISSING]');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
