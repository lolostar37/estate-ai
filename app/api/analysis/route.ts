import { NextResponse } from 'next/server'
import { XMLParser } from 'fast-xml-parser'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const search = body.search || ''
    const district = body.district || '11710'

    const key = process.env.MOLIT_API_KEY

    const today = new Date()

    const year = today.getFullYear()

    const month = String(
      today.getMonth() + 1
    ).padStart(2, '0')

    const dealYmd = `${year}${month}`

    const url =
      'https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade'
      +
      `?serviceKey=${encodeURIComponent(key || '')}`
      +
      `&LAWD_CD=${district}`
      +
      `&DEAL_YMD=${dealYmd}`
      +
      '&pageNo=1'
      +
      '&numOfRows=100'

    const response =
      await fetch(
        url,
        {
          cache:'no-store'
        }
      )

    const xml =
      await response.text()

    const parser =
      new XMLParser()

    const json =
      parser.parse(xml)

    const raw =
      json?.response?.body?.items?.item
      || []

    const items =
      Array.isArray(raw)
      ? raw
      : [raw]

    const filtered =
      items.filter(
        (item:any)=>
        String(
          item.aptNm||''
        )
        .replace(/\s/g,'')
        .includes(
          search.replace(/\s/g,'')
        )
      )

    if(filtered.length===0){

      return NextResponse.json({
        result:'데이터를 찾을 수 없습니다.',
        metrics:{
          currentPrice:'-',
          fairValue:'-',
          bubbleRate:'-',
          opinion:'-'
        }
      })

    }

    const prices =
      filtered.map(
        (item:any)=>
        Number(
          item.dealAmount
          .replaceAll(',','')
        )
      )

    const avg =
      prices.reduce(
        (a:number,b:number)=>
        a+b,
        0
      )
      /
      prices.length

    const currentPrice =
      Math.round(
        avg/10000
      )

    const fairValue =
      Math.round(
        currentPrice*0.92
      )

    const bubble =
      Math.round(
        (
          (
            currentPrice
            -
            fairValue
          )
          /
          fairValue
        )
        *
        100
      )

    return NextResponse.json({

      result:
      `${search} 분석 완료`,

      metrics:{

        currentPrice:
        `${currentPrice}억`,

        fairValue:
        `${fairValue}억`,

        bubbleRate:
        `${bubble}%`,

        opinion:
        bubble>10
        ?
        '보수 접근'
        :
        '중립'

      }

    })

  }

  catch(error){

    return NextResponse.json({

      result:
      '분석 오류',

      metrics:{
        currentPrice:'-',
        fairValue:'-',
        bubbleRate:'-',
        opinion:'-'
      }

    })

  }

}