import { NextResponse } from 'next/server'
import { XMLParser } from 'fast-xml-parser'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const search = body.search?.trim()
    const lawdCode = body.district

    const molitKey = process.env.MOLIT_API_KEY
    const openaiKey = process.env.OPENAI_API_KEY

    if (!search) {
      return NextResponse.json({
        result: '아파트명을 입력해주세요.',
      })
    }

    const today = new Date()
    const months: string[] = []

    for (let i = 0; i < 12; i++) {
      const d = new Date(
        today.getFullYear(),
        today.getMonth() - i
      )

      const year = d.getFullYear()

      const month = String(
        d.getMonth() + 1
      ).padStart(2, '0')

      months.push(`${year}${month}`)
    }

    let allItems: any[] = []

    for (const dealYmd of months) {
      const url =
        'https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade' +
        `?serviceKey=${encodeURIComponent(
          molitKey || ''
        )}` +
        `&LAWD_CD=${lawdCode}` +
        `&DEAL_YMD=${dealYmd}` +
        `&pageNo=1` +
        `&numOfRows=100`

      const response = await fetch(url, {
        cache: 'no-store',
      })

      const xml = await response.text()

      const parser = new XMLParser()

      const json = parser.parse(xml)

      const rawItems =
        json?.response?.body?.items?.item || []

      const items = Array.isArray(rawItems)
        ? rawItems
        : [rawItems]

      allItems = [
        ...allItems,
        ...items,
      ]
    }

    const filtered = allItems.filter(
      (item: any) =>
        String(item.aptNm || '')
          .replace(/\s/g, '')
          .includes(
            search.replace(/\s/g, '')
          )
    )

    if (filtered.length === 0) {
      return NextResponse.json({
        result: `${search} 데이터를 찾을 수 없습니다.`,
      })
    }

    const prices = filtered.map(
      (item: any) =>
        Number(
          String(
            item.dealAmount
          ).replaceAll(',', '')
        )
    )

    const averagePrice =
      prices.reduce(
        (sum: number, current: number) =>
          sum + current,
        0
      ) / prices.length

    const currentPrice =
      Math.round(
        (averagePrice / 10000) * 10
      ) / 10

    const fairValue =
      Math.round(
        currentPrice * 0.92 * 10
      ) / 10

    const bubbleRate =
      Math.round(
        (
          ((currentPrice - fairValue) /
            fairValue) *
          100
        )
      )

    const opinion =
      bubbleRate > 15
        ? '보수 접근'
        : bubbleRate > 7
        ? '중립'
        : '관심 권장'

    const gptResponse = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/json',

          Authorization:
            `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                '너는 대한민국 부동산 투자 분석가다.',
            },
            {
              role: 'user',
              content: `

아파트:
${search}

최근 거래:
${currentPrice}억

적정가:
${fairValue}억

버블률:
${bubbleRate}%

의견:
${opinion}

다음을 분석:

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
      }
    )

    const gpt =
      await gptResponse.json()

    return NextResponse.json({
      result:
        gpt?.choices?.[0]
          ?.message?.content ||
        '응답 없음',

      metrics: {
        currentPrice:
          `${currentPrice}억`,
        fairValue:
          `${fairValue}억`,
        bubbleRate:
          `${bubbleRate}%`,
        opinion,
      },
    })
  } catch (error) {
    console.log(error)

    return NextResponse.json({
      result:
        'AI 분석 중 오류 발생',
    })
  }
}