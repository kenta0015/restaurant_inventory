import { createClient } from '@supabase/supabase-js';

// ✅ あなたの Supabase プロジェクトに合わせて書き換えてください
const supabaseUrl = 'https://nbxqroyabnzxlclfmlyc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ieHFyb3lhYm56eGxjbGZtbHljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NjY5MTAsImV4cCI6MjA2MTU0MjkxMH0.Xqf54TQRp8FTy_JbsQJdSx5D1M6NA8JEfMFJYoHM0eA';

console.log('🔍 Supabase URL:', supabaseUrl);
console.log('🔍 Supabase Key:', supabaseAnonKey ? '[SET]' : '[MISSING]');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
