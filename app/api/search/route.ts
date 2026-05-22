import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const keyword = body.keyword || ''

    const { data, error } = await supabase
      .from('apartments')
      .select(`
        name,
        current_price,
        fair_value,
        bubble_rate,
        opinion,
        district_name,
        district_code
      `)
      .ilike('name', `%${keyword}%`)
      .limit(20)

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        data: [],
      })
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
      data: [],
    })
  }
}