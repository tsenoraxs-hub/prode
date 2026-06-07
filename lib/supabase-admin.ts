import { createClient } from '@supabase/supabase-js'

// En producción, usar SUPABASE_SERVICE_ROLE_KEY (Supabase Dashboard → Settings → API → service_role).
// Si no está definida, cae al publishable key (funciona porque RLS está desactivado).
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  key
)
