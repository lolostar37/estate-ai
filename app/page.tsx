'use client'

import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

type Metrics = {
  currentPrice?: string
  fairValue?: string
  bubbleRate?: string
  opinion?: string
}

const apartmentSuggestions = [
  '잠실엘스',
  '리센츠',
  '헬리오시티',
  '래미안대치팰리스',
  '아크로리버파크',
  '반포자이',
  '마포래미안푸르지오',
  '트리마제',
]

export default function Home() {
  const [district, setDistrict] = useState('11710')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [chartData, setChartData] = useState<any[]>([])

  const [metrics, setMetrics] = useState<Metrics>({
    currentPrice: '-',
    fairValue: '-',
    bubbleRate: '-',
    opinion: '-',
  })

  const filteredSuggestions =
    search.length > 0
      ? apartmentSuggestions.filter((name) => name.includes(search))
      : []

  async function handleAnalyze() {
    try {
      setLoading(true)
      setResult('분석중...')

      const response = await fetch('/api/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          search,
          district,
        }),
      })

      const data = await response.json()

      setResult(data.result || '응답 없음')
      setMetrics(data.metrics || {})
      setChartData(data.chartData || [])
    } catch (error) {
      console.error(error)
      setResult('오류 발생')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <h1 className="text-5xl font-bold mb-2">ESTATE AI</h1>

      <p className="text-gray-400 mb-10">
        AI 기반 부동산 투자 비서
      </p>

      <div className="flex gap-3 mb-4">
        <select
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          className="bg-zinc-900 p-4 rounded"
        >
          <option value="11710">송파구</option>
          <option value="11680">강남구</option>
          <option value="11650">서초구</option>
          <option value="11440">마포구</option>
          <option value="11200">성동구</option>
          <option value="11170">용산구</option>
        </select>

        <div className="relative flex-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="예: 잠실엘스"
            className="w-full p-4 rounded bg-zinc-900"
          />

          {filteredSuggestions.length > 0 && (
            <div className="absolute z-10 mt-2 w-full bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
              {filteredSuggestions.map((name) => (
                <button
                  key={name}
                  onClick={() => setSearch(name)}
                  className="block w-full text-left px-4 py-3 hover:bg-zinc-800"
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="bg-yellow-500 px-8 rounded text-black font-bold"
        >
          {loading ? '분석중...' : 'AI 분석'}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-5 mt-10">
        <div className="bg-zinc-900 p-5 rounded">
          <p>실거래 평균</p>
          <h2 className="text-3xl">{metrics.currentPrice}</h2>
        </div>

        <div className="bg-zinc-900 p-5 rounded">
          <p>AI 적정가</p>
          <h2 className="text-3xl">{metrics.fairValue}</h2>
        </div>

        <div className="bg-zinc-900 p-5 rounded">
          <p>버블률</p>
          <h2 className="text-3xl">{metrics.bubbleRate}</h2>
        </div>

        <div className="bg-zinc-900 p-5 rounded">
          <p>AI 의견</p>
          <h2 className="text-3xl">{metrics.opinion}</h2>
        </div>
      </div>

      <div className="bg-zinc-900 p-8 rounded mt-10">
        <h2 className="text-2xl mb-5">최근 12개월 가격 추이</h2>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <XAxis dataKey="month" />
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

      <div className="bg-zinc-900 p-8 rounded mt-10">
        <h2 className="text-2xl mb-4">AI 투자 분석</h2>

        <div className="whitespace-pre-wrap">
          {result}
        </div>
      </div>
    </main>
  )
}