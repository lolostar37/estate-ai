import { NextResponse } from 'next/server'
import { XMLParser } from 'fast-xml-parser'

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

    const xml = await response.text()

    const parser = new XMLParser()

    const json = parser.parse(xml)

    const items =
      json.response.body.items.item

    const filtered =
      items.filter(
        (item:any)=>
        item.aptNm==="잠실엘스"
      )

    return NextResponse.json({
      success:true,
      count:filtered.length,
      data:filtered
    })

  } catch(error){

    return NextResponse.json({
      success:false
    })

  }

}