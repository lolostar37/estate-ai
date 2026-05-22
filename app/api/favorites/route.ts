import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { user_email, apartment_name, district } = body

    if (!user_email || !apartment_name || !district) {
      return NextResponse.json({
        success: false,
        message: '필수값이 없습니다.',
      })
    }

    const { error } = await supabase
      .from('favorites')
      .insert({
        user_email,
        apartment_name,
        district,
      })

    if (error) {
      return NextResponse.json({
        success: false,
        message: error.message,
      })
    }

    return NextResponse.json({
      success: true,
      message: '관심 아파트가 저장되었습니다.',
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
    .from('favorites')
    .select('*')
    .eq('user_email', user_email)
    .order('created_at', { ascending: false })

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