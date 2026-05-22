import { NextResponse } from 'next/server'
import { XMLParser } from 'fast-xml-parser'

export async function GET() {
  try {
    const key = process.env.MOLIT_API_KEY

    const lawdCode = '11710' // 송파구
    const dealYmd = '202604'

    const url =
      'https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade' +
      `?serviceKey=${encodeURIComponent(key || '')}` +
      `&LAWD_CD=${lawdCode}` +
      `&DEAL_YMD=${dealYmd}` +
      `&pageNo=1` +
      `&numOfRows=100`

    const response = await fetch(url, { cache: 'no-store' })
    const xml = await response.text()

    const parser = new XMLParser()
    const json = parser.parse(xml)

    const rawItems = json?.response?.body?.items?.item || []
    const items = Array.isArray(rawItems) ? rawItems : [rawItems]

    const filtered = items.filter((item: any) =>
      String(item.aptNm || '').includes('잠실엘스')
    )

    return NextResponse.json({
      success: true,
      total: items.length,
      count: filtered.length,
      data: filtered,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
    })
  }
}