import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'MOLIT API 연결 성공',
    test: 'v2',
    timestamp: Date.now()
  })
}