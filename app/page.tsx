'use client'

import { useState } from 'react'
import jsPDF from 'jspdf'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

type Metrics = {
  currentPrice: string
  fairValue: string
  bubbleRate: string
  opinion: string
}

const priceData = [
  { year: '2021', price: 22.5 },
  { year: '2022', price: 27.2 },
  { year: '2023', price: 25.8 },
  { year: '2024', price: 26.9 },
  { year: '2025', price: 27.8 },
]

export default function HomePage() {
  const [search, setSearch] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const [metrics, setMetrics] = useState<Metrics>({
    currentPrice: '-',
    fairValue: '-',
    bubbleRate: '-',
    opinion: '-',
  })

  const handleAnalyze = async () => {
    try {
      setLoading(true)
      setResult('')

      const response = await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ search }),
      })

      const data = await response.json()
      setResult(data.result || '응답이 없습니다.')

      if (data.metrics) {
        setMetrics(data.metrics)
      }
    } catch (error) {
      console.error(error)
      setResult('분석 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handlePdf = () => {
    const doc = new jsPDF()

    doc.setFontSize(20)
    doc.text('ESTATE AI REPORT', 20, 20)

    doc.setFontSize(14)
    doc.text(`실거래 평균: ${metrics.currentPrice}`, 20, 50)
    doc.text(`AI 적정가: ${metrics.fairValue}`, 20, 65)
    doc.text(`버블률: ${metrics.bubbleRate}`, 20, 80)
    doc.text(`AI 의견: ${metrics.opinion}`, 20, 95)

    doc.save('estate-ai-report.pdf')
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <p className="text-yellow-500 mb-3 uppercase tracking-[0.3em]">
          AI REAL ESTATE INTELLIGENCE
        </p>

        <h1 className="text-6xl font-bold mb-5">ESTATE AI</h1>

        <p className="text-zinc-400 text-xl mb-10">
          AI 기반 부동산 투자 비서
        </p>

        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 mb-12 flex gap-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="예: 잠실엘스"
            className="flex-1 bg-black border border-zinc-700 rounded-2xl px-6 py-5 text-lg"
          />

          <button
            onClick={handleAnalyze}
            className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 rounded-2xl font-bold"
          >
            {loading ? '분석중...' : 'AI 분석'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-zinc-950 rounded-3xl p-6 border border-zinc-800">
            <p className="text-zinc-500">실거래 평균</p>
            <h2 className="text-3xl font-bold mt-3">{metrics.currentPrice}</h2>
          </div>

          <div className="bg-zinc-950 rounded-3xl p-6 border border-zinc-800">
            <p className="text-zinc-500">AI 적정가</p>
            <h2 className="text-3xl font-bold mt-3">{metrics.fairValue}</h2>
          </div>

          <div className="bg-zinc-950 rounded-3xl p-6 border border-zinc-800">
            <p className="text-zinc-500">버블률</p>
            <h2 className="text-3xl font-bold text-red-400 mt-3">
              {metrics.bubbleRate}
            </h2>
          </div>

          <div className="bg-zinc-950 rounded-3xl p-6 border border-zinc-800">
            <p className="text-zinc-500">AI 의견</p>
            <h2 className="text-3xl font-bold text-yellow-500 mt-3">
              {metrics.opinion}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8">
            <h2 className="text-2xl font-bold mb-6">버블 리스크</h2>

            <div className="flex items-center justify-center">
              <div className="w-52 h-52 rounded-full border-[18px] border-red-500 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-zinc-500 mb-2">Bubble Risk</p>
                  <h3 className="text-5xl font-bold text-red-400">
                    {metrics.bubbleRate}
                  </h3>
                </div>
              </div>
            </div>

            <p className="text-zinc-400 text-center mt-6 leading-7">
              현재 가격이 AI 적정가 대비 어느 정도 고평가되어 있는지 보여줍니다.
            </p>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8">
            <h2 className="text-2xl font-bold mb-6">AI 리포트</h2>

            <p className="text-zinc-400 leading-8 mb-8">
              선택한 아파트의 실거래 평균, 적정가, 버블률, 투자 리스크를 바탕으로
              AI 투자 리포트를 생성합니다.
            </p>

            <button
              onClick={handlePdf}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-black py-5 rounded-2xl font-bold"
            >
              PDF 리포트 생성하기
            </button>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 mb-10">
          <h2 className="text-2xl font-bold mb-6">가격 추이</h2>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#eab308"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {result && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 whitespace-pre-wrap leading-8">
            <h2 className="text-2xl font-bold mb-6">AI 투자 분석</h2>
            {result}
          </div>
        )}
      </div>
    </main>
  )
}