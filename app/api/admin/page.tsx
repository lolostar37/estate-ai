'use client'

import { useEffect, useState } from 'react'

export default function AdminPage() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch('/api/admin')
      .then((res) => res.json())
      .then(setData)
  }, [])

  if (!data) {
    return (
      <main className="min-h-screen bg-black text-white p-10">
        관리자 데이터 불러오는 중...
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <h1 className="text-5xl font-bold mb-10">
        ESTATE AI Admin
      </h1>

      <div className="grid grid-cols-2 gap-5 mb-10">
        <div className="bg-zinc-900 p-6 rounded">
          <p className="text-zinc-400">전체 관심 저장 수</p>
          <h2 className="text-4xl font-bold">
            {data.totalFavorites}
          </h2>
        </div>

        <div className="bg-zinc-900 p-6 rounded">
          <p className="text-zinc-400">최근 분석 기록 수</p>
          <h2 className="text-4xl font-bold">
            {data.totalHistory}
          </h2>
        </div>
      </div>

      <div className="bg-zinc-900 p-6 rounded mb-10">
        <h2 className="text-2xl font-bold mb-5">
          인기 아파트 순위
        </h2>

        {data.popularApartments.map((item: any, index: number) => (
          <div
            key={item.name}
            className="flex justify-between border-b border-zinc-800 py-3"
          >
            <span>{index + 1}. {item.name}</span>
            <span>{item.count}회</span>
          </div>
        ))}
      </div>

      <div className="bg-zinc-900 p-6 rounded">
        <h2 className="text-2xl font-bold mb-5">
          최근 분석 기록
        </h2>

        {data.recentHistory.map((item: any) => (
          <div
            key={item.id}
            className="border-b border-zinc-800 py-3"
          >
            <p className="font-bold">{item.apartment_name}</p>
            <p className="text-sm text-zinc-400">
              {item.user_email} · {item.current_price} · {item.investment_score}
            </p>
          </div>
        ))}
      </div>
    </main>
  )
}