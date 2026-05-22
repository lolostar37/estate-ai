import { NextResponse } from 'next/server'
import { XMLParser } from 'fast-xml-parser'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const search = body.search || ''
    const district = body.district || '11710'

    const key = process.env.MOLIT_API_KEY
    const openaiKey = process.env.OPENAI_API_KEY

    const today = new Date()
    const months: string[] = []

    for (let i = 0; i < 12; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      months.push(`${y}${m}`)
    }

    let allItems: any[] = []

    for (const dealYmd of months) {
      const url =
        'https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade' +
        `?serviceKey=${encodeURIComponent(key || '')}` +
        `&LAWD_CD=${district}` +
        `&DEAL_YMD=${dealYmd}` +
        '&pageNo=1' +
        '&numOfRows=100'

      const response = await fetch(url, { cache: 'no-store' })
      const xml = await response.text()
      const parser = new XMLParser()
      const json = parser.parse(xml)

      const raw = json?.response?.body?.items?.item || []
      const items = Array.isArray(raw) ? raw : [raw]

      allItems = [...allItems, ...items]
    }

    const filtered = allItems.filter((item: any) =>
      String(item.aptNm || '')
        .replace(/\s/g, '')
        .includes(search.replace(/\s/g, ''))
    )

    if (filtered.length === 0) {
      return NextResponse.json({
        result: `${search}의 최근 12개월 실거래 데이터를 찾을 수 없습니다.`,
        metrics: {
          currentPrice: '-',
          fairValue: '-',
          bubbleRate: '-',
          opinion: '-',
        },
        chartData: [],
      })
    }

    const prices = filtered.map((item: any) =>
      Number(String(item.dealAmount).replaceAll(',', ''))
    )

    const avg =
      prices.reduce((a: number, b: number) => a + b, 0) / prices.length

    const currentPrice = Math.round((avg / 10000) * 10) / 10
    const fairValue = Math.round(currentPrice * 0.92 * 10) / 10
    const bubble = Math.round(((currentPrice - fairValue) / fairValue) * 100)
    const opinion = bubble > 10 ? '보수 접근' : '중립'

    const monthlyMap: Record<string, number[]> = {}

    filtered.forEach((item: any) => {
      const label = `${item.dealYear}.${String(item.dealMonth).padStart(2, '0')}`
      const price = Number(String(item.dealAmount).replaceAll(',', '')) / 10000

      if (!monthlyMap[label]) {
        monthlyMap[label] = []
      }

      monthlyMap[label].push(price)
    })

    const chartData = Object.keys(monthlyMap)
      .sort()
      .map((month) => {
        const values = monthlyMap[month]
        const avgPrice =
          values.reduce((a, b) => a + b, 0) / values.length

        return {
          month,
          price: Math.round(avgPrice * 10) / 10,
        }
      })

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
              '너는 대한민국 부동산 투자 분석가다. 제공된 실거래 데이터를 기준으로만 분석한다.',
          },
          {
            role: 'user',
            content: `
아파트명: ${search}
최근 12개월 거래건수: ${filtered.length}건
평균 실거래가: ${currentPrice}억
AI 적정가 추정: ${fairValue}억
버블률 추정: ${bubble}%
AI 기본 의견: ${opinion}

아래 형식으로 분석해줘.

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
      result: gpt.choices?.[0]?.message?.content || `${search} 분석 완료`,
      metrics: {
        currentPrice: `${currentPrice}억`,
        fairValue: `${fairValue}억`,
        bubbleRate: `${bubble}%`,
        opinion,
      },
      chartData,
    })
  } catch (error) {
    return NextResponse.json({
      result: '분석 오류가 발생했습니다.',
      metrics: {
        currentPrice: '-',
        fairValue: '-',
        bubbleRate: '-',
        opinion: '-',
      },
      chartData: [],
    })
  }
}