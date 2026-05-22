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
      .from('alerts')
      .insert({
        user_email: body.user_email,
        apartment_name: body.apartment_name,
        target_price: body.target_price,
        alert_type: body.alert_type,
        is_active: true,
      })

    return NextResponse.json({
      success: !error,
      message: error?.message,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: String(error),
    })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const user_email = searchParams.get('user_email')

    if (!user_email) {
      return NextResponse.json({
        success: false,
        data: [],
      })
    }

    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_email', user_email)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      success: !error,
      data: data || [],
      message: error?.message,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      data: [],
      message: String(error),
    })
  }
}