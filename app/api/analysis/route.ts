import { NextResponse } from 'next/server'

const apartments = {
  잠실엘스: {
    currentPrice: '27.8억',
    fairValue: '23.9억',
    bubbleRate: '16%',
    opinion: '보수 접근',
  },

  리센츠: {
    currentPrice: '26.5억',
    fairValue: '24.7억',
    bubbleRate: '7%',
    opinion: '중립',
  },

  헬리오시티: {
    currentPrice: '22.1억',
    fairValue: '20.4억',
    bubbleRate: '8%',
    opinion: '관찰 필요',
  },
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const search =
      body.search?.trim() as keyof typeof apartments

    const apt = apartments[search]

    if (!apt) {
      return NextResponse.json({
        result: '현재는 잠실엘스 / 리센츠 / 헬리오시티만 지원합니다.',
      })
    }

    const apiKey = process.env.OPENAI_API_KEY

    const response = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          Authorization:`Bearer ${apiKey}`
        },
        body:JSON.stringify({
          model:'gpt-4o-mini',
          messages:[
            {
              role:'system',
              content:'너는 대한민국 최고의 부동산 투자 분석가다.'
            },
            {
              role:'user',
              content:`

아파트:
${search}

실거래 평균:
${apt.currentPrice}

AI 적정가:
${apt.fairValue}

버블률:
${apt.bubbleRate}

AI 의견:
${apt.opinion}

아래 형식으로 분석:

1. 현재 시장 위치
2. 가격 거품 여부
3. 투자 리스크
4. 실거주 가치
5. 향후 전망
6. 최종 의견

`
            }
          ]
        })
      }
    )

    const data=await response.json()

    return NextResponse.json({

      result:data.choices?.[0]?.message?.content,

      metrics:apt

    })

  } catch(error){

    console.log(error)

    return NextResponse.json({
      result:'오류 발생'
    })

  }
}