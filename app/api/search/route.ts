import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: Request) {
  try {

    const body =
      await req.json()

    const keyword =
      body.keyword || ''

    const { data, error } =
      await supabase
      .from('apartments')
      .select(`
        name,
        current_price,
        fair_value,
        bubble_rate,
        opinion
      `)
      .ilike(
        'name',
        `%${keyword}%`
      )
      .limit(10)

    if(error){

      return NextResponse.json({
        success:false,
        data:[]
      })

    }

    return NextResponse.json({

      success:true,
      data

    })

  }

  catch(error){

    return NextResponse.json({

      success:false,
      data:[]

    })

  }

}