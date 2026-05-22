'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const ADMIN_EMAIL = 'fly3737@googlemail.com'

export default function AdminPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const email = session?.user.email || null
    setUserEmail(email)

    if (email === ADMIN_EMAIL) {
      await loadAdminData()
    }

    setLoading(false)
  }

  async function loginWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/admin',
      },
    })
  }

  async function logout() {
    await supabase.auth.signOut()
    setUserEmail(null)
    setData(null)
  }

  async function loadAdminData() {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const token = session?.access_token

    if (!token) {
      setMessage('로그인이 필요합니다.')
      return
    }

    const response = await fetch('/api/admin', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const result = await response.json()

    if (!result.success) {
      setMessage(result.message || '관리자 데이터를 불러올 수 없습니다.')
      return
    }

    setData(result)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white p-10">
        관리자 페이지 확인 중...
      </main>
    )
  }

  if (!userEmail) {
    return (
      <main className="min-h-screen bg-black text-white p-10">
        <h1 className="text-4xl font-bold mb-6">관리자 로그인</h1>

        <button
          onClick={loginWithGoogle}
          className="bg-white text-black px-6 py-3 rounded font-bold"
        >
          Google로 로그인
        </button>
      </main>
    )
  }

  if (userEmail !== ADMIN_EMAIL) {
    return (
      <main className="min-h-screen bg-black text-white p-10">
        <h1 className="text-4xl font-bold mb-6">접근 권한 없음</h1>

        <p className="text-zinc-400 mb-6">
          현재 계정: {userEmail}
        </p>

        <button
          onClick={logout}
          className="bg-zinc-800 px-6 py-3 rounded font-bold"
        >
          로그아웃
        </button>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-black text-white p-10">
        <p>{message || '관리자 데이터 불러오는 중...'}</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-5xl font-bold mb-2">
            ESTATE AI Admin
          </h1>

          <p className="text-zinc-400">
            관리자 계정: {userEmail}
          </p>
        </div>

        <button
          onClick={logout}
          className="bg-zinc-800 px-5 py-3 rounded font-bold"
        >
          로그아웃
        </button>
      </div>

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

        {data.popularApartments?.length === 0 ? (
          <p className="text-zinc-400">아직 데이터가 없습니다.</p>
        ) : (
          data.popularApartments?.map((item: any, index: number) => (
            <div
              key={item.name}
              className="flex justify-between border-b border-zinc-800 py-3"
            >
              <span>{index + 1}. {item.name}</span>
              <span>{item.count}회</span>
            </div>
          ))
        )}
      </div>

      <div className="bg-zinc-900 p-6 rounded">
        <h2 className="text-2xl font-bold mb-5">
          최근 분석 기록
        </h2>

        {data.recentHistory?.length === 0 ? (
          <p className="text-zinc-400">아직 분석 기록이 없습니다.</p>
        ) : (
          data.recentHistory?.map((item: any) => (
            <div
              key={item.id}
              className="border-b border-zinc-800 py-3"
            >
              <p className="font-bold">{item.apartment_name}</p>
              <p className="text-sm text-zinc-400">
                {item.user_email} · {item.current_price} · {item.investment_score}
              </p>
            </div>
          ))
        )}
      </div>
    </main>
  )
}