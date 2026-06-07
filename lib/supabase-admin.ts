import { createClient } from '@supabase/supabase-js'

// En producción, usar SUPABASE_SERVICE_ROLE_KEY (Supabase Dashboard → Settings → API → service_role).
// Si no está definida, cae al publishable key (funciona porque RLS está desactivado).
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  ?? 'https://cpvufjavhiosfaekevjl.supabase.co'

const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ?? 'sb_publishable_cHPwz9Bi4HHxVLzqqkApPg_MjxNrahR'

export const supabaseAdmin = createClient(url, key)
