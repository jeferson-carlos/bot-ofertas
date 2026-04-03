import { createClient } from '@supabase/supabase-js'


const url = "https://dkyvmwhbriomarhodhgz.supabase.co"
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRreXZtd2hicmlvbWFyaG9kaGd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwODI5NTcsImV4cCI6MjA5MDY1ODk1N30.CUXW2_f3k0VkvHH3exuCbfhLjksFZdhHZC6PW0cPy70"


console.log("URL:", url)
console.log("KEY:", key?.slice(0, 20))

export const supabase = createClient(url, key)