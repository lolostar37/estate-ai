import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const key = process.env.MOLIT_API_KEY

    const lawdCode = '11710' // 송파구
    const dealYmd = '202604'

    const url =
      `https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade` +
      `?serviceKey=${key}` +
      `&LAWD_CD=${lawdCode}` +
      `&DEAL_YMD=${dealYmd}`

    const response = await fetch(url)

    const xml = await response.text()

    return NextResponse.json({
      success: true,
      data: xml.substring(0,3000)
    })

  } catch (error) {
    return NextResponse.json({
      success: false
    })
  }
}