'use client'

import { useState } from 'react'

export default function Home() {

  const [district, setDistrict] = useState('11710')
  const [search, setSearch] = useState('')
  const [result, setResult] = useState('')
  const [metrics, setMetrics] = useState<any>({})

  async function handleAnalyze() {

    const response = await fetch('/api/analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        search,
        district
      })
    })

    const data = await response.json()

    setResult(data.result)
    setMetrics(data.metrics)
  }

  return (

    <main className="p-10 bg-black min-h-screen text-white">

      <h1 className="text-5xl font-bold mb-2">
        ESTATE AI
      </h1>

      <p className="mb-8 text-gray-400">
        AI 기반 부동산 투자 비서
      </p>

      <div className="flex gap-3 mb-10">

        <select
          value={district}
          onChange={(e)=>setDistrict(e.target.value)}
          className="bg-gray-900 p-4 rounded"
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
          onChange={(e)=>setSearch(e.target.value)}
          placeholder="예: 잠실엘스"
          className="flex-1 p-4 rounded bg-gray-900"
        />

        <button
          onClick={handleAnalyze}
          className="bg-yellow-500 text-black px-6 rounded"
        >
          AI 분석
        </button>

      </div>

      <div className="grid grid-cols-4 gap-5">

        <div className="bg-gray-900 p-5 rounded">
          실거래 평균
          <h1 className="text-3xl">
            {metrics.currentPrice}
          </h1>
        </div>

        <div className="bg-gray-900 p-5 rounded">
          AI 적정가
          <h1 className="text-3xl">
            {metrics.fairValue}
          </h1>
        </div>

        <div className="bg-gray-900 p-5 rounded">
          버블률
          <h1 className="text-3xl">
            {metrics.bubbleRate}
          </h1>
        </div>

        <div className="bg-gray-900 p-5 rounded">
          AI 의견
          <h1 className="text-3xl">
            {metrics.opinion}
          </h1>
        </div>

      </div>

      <div className="bg-gray-900 p-8 rounded mt-10">

        <h1 className="text-3xl mb-5">
          AI 투자 분석
        </h1>

        <div className="whitespace-pre-wrap">
          {result}
        </div>

      </div>

    </main>

  )

}