import { createClient } from '@supabase/supabase-client';

const supabaseUrl = 'https://yoigxaznyhkhhvpcfhxp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvaWd4YXpueWhraGh2cGNmaHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MjQxNzAsImV4cCI6MjA5MzIwMDE3MH0.4L7YCY4sK-sjF2ds9GKbB6MwYzPL5cLG-Djnr7DbcuY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);