import { NextResponse } from 'next/server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(

  process.env.NEXT_PUBLIC_SUPABASE_URL!,

  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

)

export async function POST(req: Request) {

  try {

    const body = await req.json()

    const { user_email, apartment_name, target_price, alert_type } = body

    if (!user_email || !apartment_name || !target_price) {

      return NextResponse.json({

        success: false,

        message: '필수값이 없습니다.',

      })

    }

    const { error } = await supabase.from('alerts').insert({

      user_email,

      apartment_name,

      target_price,

      alert_type: alert_type || 'below',

      is_active: true,

    })

    if (error) {

      return NextResponse.json({

        success: false,

        message: error.message,

      })

    }

    return NextResponse.json({

      success: true,

      message: '알림이 저장되었습니다.',

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

      .eq('is_active', true)

      .order('created_at', { ascending: false })

    if (error) {

      return NextResponse.json({

        success: false,

        data: [],

        message: error.message,

      })

    }

    return NextResponse.json({

      success: true,

      data: data || [],

    })

  } catch (error) {

    return NextResponse.json({

      success: false,

      data: [],

      message: String(error),

    })

  }

}

export async function DELETE(req: Request) {

  try {

    const body = await req.json()

    const { id } = body

    if (!id) {

      return NextResponse.json({

        success: false,

        message: '삭제할 ID가 없습니다.',

      })

    }

    const { error } = await supabase

      .from('alerts')

      .delete()

      .eq('id', id)

    if (error) {

      return NextResponse.json({

        success: false,

        message: error.message,

      })

    }

    return NextResponse.json({

      success: true,

      message: '알림이 삭제되었습니다.',

    })

  } catch (error) {

    return NextResponse.json({

      success: false,

      message: String(error),

    })

  }

}