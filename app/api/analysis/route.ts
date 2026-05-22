import { NextResponse } from 'next/server'

export async function GET() {
  try {

    const key = process.env.MOLIT_API_KEY

    const lawdCode = '11710'
    const dealYmd = '202604'

    const url =
      `https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade` +
      `?serviceKey=${key}` +
      `&LAWD_CD=${lawdCode}` +
      `&DEAL_YMD=${dealYmd}`

    const response = await fetch(url)

    const text = await response.text()

    return NextResponse.json({
      success: true,
      data: text.substring(0,2000)
    })

  } catch (error) {

    return NextResponse.json({
      success:false
    })
  }
}