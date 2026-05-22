import { NextResponse } from 'next/server'
import { XMLParser } from 'fast-xml-parser'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const search = body.search?.trim()

    const key = process.env.MOLIT_API_KEY
    const openaiKey = process.env.OPENAI_API_KEY

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
      String(item.aptNm || '').includes(search)
    )

    if (filtered.length === 0) {
      return NextResponse.json({
        result: `${search}의 2026년 4월 송파구 실거래 데이터를 찾을 수 없습니다.`,
      })
    }

    const prices = filtered.map((item: any) =>
      Number(String(item.dealAmount).replaceAll(',', ''))
    )

    const avgPriceManwon =
      prices.reduce((sum: number, price: number) => sum + price, 0) /
      prices.length

    const currentPrice = Math.round(avgPriceManwon / 10000 * 10) / 10
    const fairValue = Math.round(currentPrice * 0.9 * 10) / 10
    const bubbleRate = Math.round(((currentPrice - fairValue) / fairValue) * 100)

    const apt = filtered[0]

    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              '너는 대한민국 부동산 투자 분석가다. 반드시 제공된 국토부 실거래 데이터만 기준으로 분석해라.',
          },
          {
            role: 'user',
            content: `
아파트명: ${apt.aptNm}
지역: ${apt.umdNm}
거래월: ${apt.dealYear}년 ${apt.dealMonth}월
거래건수: ${filtered.length}건
평균 실거래가: ${currentPrice}억
AI 적정가 추정: ${fairValue}억
버블률 추정: ${bubbleRate}%
최근 거래층: ${apt.floor}층
전용면적: ${apt.excluUseAr}㎡
건축연도: ${apt.buildYear}년

위 데이터를 기준으로 아래 형식으로 분석해줘.

1. 현재 시장 위치
2. 가격 거품 여부
3. 투자 리스크
4. 실거주 가치
5. 향후 전망
6. 최종 의견
`,
          },
        ],
      }),
    })

    const gpt = await gptResponse.json()

    return NextResponse.json({
      result: gpt.choices?.[0]?.message?.content || 'AI 응답이 없습니다.',
      metrics: {
        currentPrice: `${currentPrice}억`,
        fairValue: `${fairValue}억`,
        bubbleRate: `${bubbleRate}%`,
        opinion: bubbleRate > 10 ? '보수 접근' : '중립',
      },
    })
  } catch (error) {
    console.log(error)

    return NextResponse.json({
      result: '국토부 실거래 데이터 분석 중 오류가 발생했습니다.',
    })
  }
}