import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  ?? 'https://cpvufjavhiosfaekevjl.supabase.co'

const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ?? 'sb_publishable_cHPwz9Bi4HHxVLzqqkApPg_MjxNrahR'

export const supabase = createClient(url, key)
