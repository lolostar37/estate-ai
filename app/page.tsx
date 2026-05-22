'use client'

import { useState } from 'react'

type Metrics = {
  currentPrice?: string
  fairValue?: string
  bubbleRate?: string
  opinion?: string
}

export default function Home() {
  const [district, setDistrict] = useState('11710')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')

  const [metrics, setMetrics] = useState<Metrics>({
    currentPrice: '-',
    fairValue: '-',
    bubbleRate: '-',
    opinion: '-',
  })

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

      if (data.metrics) {
        setMetrics(data.metrics)
      }

    } catch (error) {
      console.error(error)

      setResult(
        '분석 중 오류가 발생했습니다.'
      )

    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-black text-white p-10">

      <h1 className="text-5xl font-bold mb-2">
        ESTATE AI
      </h1>

      <p className="text-gray-400 mb-8">
        AI 기반 부동산 투자 비서
      </p>

      <div className="flex gap-3 mb-10">

        <select
          value={district}
          onChange={(e)=>
            setDistrict(e.target.value)
          }
          className="bg-zinc-900 p-4 rounded"
        >
          <option value="11710">
            송파구
          </option>

          <option value="11680">
            강남구
          </option>

          <option value="11650">
            서초구
          </option>

        </select>

        <input
          value={search}
          onChange={(e)=>
            setSearch(e.target.value)
          }
          placeholder="예: 잠실엘스"
          className="flex-1 p-4 rounded bg-zinc-900"
        />

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="bg-yellow-500 text-black px-8 rounded font-bold"
        >
          {loading ? '분석중...' : 'AI 분석'}
        </button>

      </div>

      <div className="grid grid-cols-4 gap-5">

        <div className="bg-zinc-900 p-5 rounded">
          <p>실거래 평균</p>

          <h2 className="text-3xl">
            {metrics.currentPrice}
          </h2>
        </div>

        <div className="bg-zinc-900 p-5 rounded">
          <p>AI 적정가</p>

          <h2 className="text-3xl">
            {metrics.fairValue}
          </h2>
        </div>

        <div className="bg-zinc-900 p-5 rounded">
          <p>버블률</p>

          <h2 className="text-3xl">
            {metrics.bubbleRate}
          </h2>
        </div>

        <div className="bg-zinc-900 p-5 rounded">
          <p>AI 의견</p>

          <h2 className="text-3xl">
            {metrics.opinion}
          </h2>
        </div>

      </div>

      <div className="bg-zinc-900 p-8 rounded mt-10">

        <h2 className="text-2xl mb-4">
          AI 투자 분석
        </h2>

        <div className="whitespace-pre-wrap">
          {result}
        </div>

      </div>

    </main>
  )
}