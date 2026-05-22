import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  const { data, error } = await supabase
    .from('apartment_prices')
    .select('*')
    .order('created_at', { ascending: false })

  return NextResponse.json({
    success: !error,
    data: data || [],
  })
}