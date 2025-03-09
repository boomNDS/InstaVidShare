import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

// Add helper function to get redirect URL
export const getRedirectUrl = () => {
  // Check if we're in development or production
  const isDevelopment = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1'

  // Get the base URL
  const baseUrl = isDevelopment 
    ? 'http://localhost:3000'
    : window.location.origin

  // Return the full redirect URL
  return `${baseUrl}/dashboard`
}