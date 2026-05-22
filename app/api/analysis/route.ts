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

    for (let i = 0; i < 120; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      months.push(`${y}${m}`)
    }

    let allItems: any[] = []
    const parser = new XMLParser()

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
        result: `${search}의 실거래 데이터를 찾을 수 없습니다.`,
        metrics: {
          currentPrice: '-',
          fairValue: '-',
          bubbleRate: '-',
          investmentScore: '-',
          opinion: '-',
        },
        chartData: [],
        forecastData: [],
        forecast: null,
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
    const investmentScore = Math.max(0, Math.min(100, 100 - bubble * 3))

    const opinion =
      investmentScore >= 80
        ? '관심 권장'
        : investmentScore >= 60
        ? '중립'
        : '보수 접근'

    const yearlyMap: Record<string, number[]> = {}

    filtered.forEach((item: any) => {
      const year = String(item.dealYear)
      const price = Number(String(item.dealAmount).replaceAll(',', '')) / 10000

      if (!yearlyMap[year]) {
        yearlyMap[year] = []
      }

      yearlyMap[year].push(price)
    })

    const pastData = Object.keys(yearlyMap)
      .sort()
      .map((year) => {
        const values = yearlyMap[year]
        const avgPrice =
          values.reduce((a: number, b: number) => a + b, 0) / values.length

        return {
          year,
          price: Math.round(avgPrice * 10) / 10,
          type: 'past',
        }
      })

    const firstPrice = pastData[0]?.price || currentPrice
    const lastPrice = pastData[pastData.length - 1]?.price || currentPrice

    const yearCount = Math.max(pastData.length - 1, 1)

    const annualGrowthRate =
      Math.pow(lastPrice / firstPrice, 1 / yearCount) - 1

    const conservativeRate = annualGrowthRate * 0.5
    const baseRate = annualGrowthRate
    const optimisticRate = annualGrowthRate * 1.5

    const currentYear = today.getFullYear()

    const forecastData = []

    for (let i = 1; i <= 5; i++) {
      forecastData.push({
        year: String(currentYear + i),
        conservative:
          Math.round(currentPrice * Math.pow(1 + conservativeRate, i) * 10) /
          10,
        base:
          Math.round(currentPrice * Math.pow(1 + baseRate, i) * 10) / 10,
        optimistic:
          Math.round(currentPrice * Math.pow(1 + optimisticRate, i) * 10) / 10,
      })
    }

    const after5YearsBear = forecastData[4].conservative
    const after5YearsBase = forecastData[4].base
    const after5YearsBull = forecastData[4].optimistic

    const expectedGrowthRate =
      Math.round(((after5YearsBase - currentPrice) / currentPrice) * 1000) / 10

    const gptResponse = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
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
                '너는 대한민국 부동산 투자 분석가다. 제공된 실거래 데이터와 계산값을 기준으로만 분석한다.',
            },
            {
              role: 'user',
              content: `
아파트명: ${search}
최근 10년 거래건수: ${filtered.length}건
현재 평균 실거래가: ${currentPrice}억
AI 적정가 추정: ${fairValue}억
버블률 추정: ${bubble}%
투자 점수: ${investmentScore}점
연평균 성장률 추정: ${(annualGrowthRate * 100).toFixed(2)}%

5년 뒤 보수 전망: ${after5YearsBear}억
5년 뒤 중립 전망: ${after5YearsBase}억
5년 뒤 낙관 전망: ${after5YearsBull}억
5년 예상 상승률: ${expectedGrowthRate}%

아래 형식으로 분석해줘.

1. 과거 10년 가격 흐름
2. 현재 시장 위치
3. 가격 거품 여부
4. 향후 5년 가격 전망
5. 투자 리스크
6. 실거주 가치
7. 최종 의견
`,
            },
          ],
        }),
      }
    )

    const gpt = await gptResponse.json()

    return NextResponse.json({
      result: gpt.choices?.[0]?.message?.content || `${search} 분석 완료`,
      metrics: {
        currentPrice: `${currentPrice}억`,
        fairValue: `${fairValue}억`,
        bubbleRate: `${bubble}%`,
        investmentScore: `${investmentScore}점`,
        opinion,
      },
      chartData: pastData,
      forecastData,
      forecast: {
        after5YearsBear,
        after5YearsBase,
        after5YearsBull,
        expectedGrowthRate,
        annualGrowthRate: Math.round(annualGrowthRate * 1000) / 10,
      },
    })
  } catch (error) {
    return NextResponse.json({
      result: '10년 기반 AI 전망 분석 중 오류가 발생했습니다.',
      metrics: {
        currentPrice: '-',
        fairValue: '-',
        bubbleRate: '-',
        investmentScore: '-',
        opinion: '-',
      },
      chartData: [],
      forecastData: [],
      forecast: null,
    })
  }
}