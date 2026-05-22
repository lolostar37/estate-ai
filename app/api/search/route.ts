import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const keyword = body.keyword || ''

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      return NextResponse.json({
        success: false,
        error: 'Supabase 환경변수가 없습니다.',
        data: [],
      })
    }

    const supabase = createClient(url, key)

    const { data, error } = await supabase
      .from('apartments')
      .select('name,current_price,fair_value,bubble_rate,opinion')
      .ilike('name', `%${keyword}%`)
      .limit(10)

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