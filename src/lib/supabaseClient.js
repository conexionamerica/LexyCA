import { createClient } from '@supabase/supabase-js';

const defaultUrl = 'https://vmbjptvjuggmxsmgfkhr.supabase.co';
const defaultAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtYmpwdHZqdWdnbXhzbWdma2hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0ODMyMjYsImV4cCI6MjEwMjA1OTIyNn0.c50b3z3VFfUMj2EI95mwqa6A76qoBfVho7ZtPL3xK10';

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseUrl = (envUrl && typeof envUrl === 'string' && envUrl.startsWith('http'))
  ? envUrl
  : defaultUrl;

const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseAnonKey = (envKey && typeof envKey === 'string' && envKey.length > 20)
  ? envKey
  : defaultAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
