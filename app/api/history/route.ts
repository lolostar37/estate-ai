import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { error } = await supabase
      .from('analysis_history')
      .insert({
        user_email: body.user_email,
        apartment_name: body.apartment_name,
        district: body.district,
        current_price: body.current_price,
        fair_value: body.fair_value,
        bubble_rate: body.bubble_rate,
        investment_score: body.investment_score,
        opinion: body.opinion,
        result: body.result,
      })

    if (error) {
      return NextResponse.json({
        success: false,
        message: error.message,
      })
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: String(error),
    })
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const user_email = searchParams.get('user_email')

  if (!user_email) {
    return NextResponse.json({
      success: false,
      data: [],
    })
  }

  const { data, error } = await supabase
    .from('analysis_history')
    .select('*')
    .eq('user_email', user_email)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    return NextResponse.json({
      success: false,
      data: [],
    })
  }

  return NextResponse.json({
    success: true,
    data,
  })
}