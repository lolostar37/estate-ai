'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import jsPDF from 'jspdf'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { CircularProgressbar } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Metrics = {
  currentPrice?: string
  fairValue?: string
  bubbleRate?: string
  investmentScore?: string
  opinion?: string
}

type Suggestion = {
  name: string
  current_price?: number
  fair_value?: number
  bubble_rate?: number
  opinion?: string
}

type Favorite = {
  id: number
  user_email: string
  apartment_name: string
  district: string
}

type History = {
  id: number
  apartment_name: string
  district: string
  current_price: string
  fair_value: string
  bubble_rate: string
  investment_score: string
  opinion: string
  result: string
  created_at: string
}

const districtMap: Record<string, string> = {
  잠실엘스: '11710',
  리센츠: '11710',
  헬리오시티: '11710',
  래미안대치팰리스: '11680',
  은마: '11680',
  아크로리버파크: '11650',
  반포자이: '11650',
  마포래미안푸르지오: '11440',
  트리마제: '11200',
}

function Gauge({
  title,
  value,
  color,
  suffix,
}: {
  title: string
  value: number
  color: string
  suffix: string
}) {
  return (
    <div className="bg-zinc-900 p-8 rounded">
      <h2 className="text-xl mb-6">{title}</h2>
      <div className="w-48 h-48 mx-auto">
        <CircularProgressbar
          value={value}
          text={`${value}${suffix}`}
          styles={{
            path: { stroke: color },
            text: { fill: '#ffffff', fontSize: '18px' },
            trail: { stroke: '#27272a' },
          }}
        />
      </div>
    </div>
  )
}

export default function Home() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [district, setDistrict] = useState('11710')
  const [search, setSearch] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [history, setHistory] = useState<History[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [chartData, setChartData] = useState<any[]>([])

  const [metrics, setMetrics] = useState<Metrics>({
    currentPrice: '-',
    fairValue: '-',
    bubbleRate: '-',
    investmentScore: '-',
    opinion: '-',
  })

  const bubbleNumber = parseInt(metrics.bubbleRate?.replace('%', '') || '0')
  const scoreNumber = parseInt(metrics.investmentScore?.replace('점', '') || '0')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const email = data.session?.user.email || null
      setUserEmail(email)
      if (email) {
        loadFavorites(email)
        loadHistory(email)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const email = session?.user.email || null
        setUserEmail(email)

        if (email) {
          loadFavorites(email)
          loadHistory(email)
        } else {
          setFavorites([])
          setHistory([])
        }
      }
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  async function loginWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  async function logout() {
    await supabase.auth.signOut()
    setUserEmail(null)
    setFavorites([])
    setHistory([])
  }

  async function loadFavorites(email: string) {
    const res = await fetch(`/api/favorites?user_email=${encodeURIComponent(email)}`)
    const data = await res.json()
    if (data.success) setFavorites(data.data || [])
  }

  async function loadHistory(email: string) {
    const res = await fetch(`/api/history?user_email=${encodeURIComponent(email)}`)
    const data = await res.json()
    if (data.success) setHistory(data.data || [])
  }

  async function saveFavorite() {
    if (!userEmail) return alert('로그인 후 저장할 수 있습니다.')
    if (!search) return alert('아파트를 먼저 선택해주세요.')

    const res = await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_email: userEmail, apartment_name: search, district }),
    })

    const data = await res.json()

    if (data.success) {
      alert('관심 아파트에 저장되었습니다.')
      loadFavorites(userEmail)
    } else {
      alert(data.message || '저장 실패')
    }
  }

  async function saveHistory(
    email: string,
    apartmentName: string,
    districtCode: string,
    data: any
  ) {
    await fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_email: email,
        apartment_name: apartmentName,
        district: districtCode,
        current_price: data.metrics?.currentPrice,
        fair_value: data.metrics?.fairValue,
        bubble_rate: data.metrics?.bubbleRate,
        investment_score: data.metrics?.investmentScore,
        opinion: data.metrics?.opinion,
        result: data.result,
      }),
    })

    loadHistory(email)
  }

  async function searchApartments(keyword: string) {
    setSearch(keyword)

    if (keyword.length < 1) {
      setSuggestions([])
      return
    }

    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword }),
    })

    const data = await res.json()
    if (data.success) setSuggestions(data.data || [])
  }

  async function runAnalyze(targetSearch: string, targetDistrict: string) {
    try {
      setLoading(true)
      setResult('분석중...')

      const res = await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ search: targetSearch, district: targetDistrict }),
      })

      const data = await res.json()

      setSearch(targetSearch)
      setDistrict(targetDistrict)
      setResult(data.result || '응답 없음')
      setMetrics(data.metrics || {})
      setChartData(data.chartData || [])
      setSuggestions([])

      if (userEmail && data.metrics) {
        saveHistory(userEmail, targetSearch, targetDistrict, data)
      }
    } catch (error) {
      console.error(error)
      setResult('오류 발생')
    } finally {
      setLoading(false)
    }
  }

  function handleAnalyze() {
    runAnalyze(search, district)
  }

  function selectSuggestion(item: Suggestion) {
    const code = districtMap[item.name] || district
    setSearch(item.name)
    setDistrict(code)
    setSuggestions([])
    setTimeout(() => runAnalyze(item.name, code), 100)
  }

  function openHistory(item: History) {
    setSearch(item.apartment_name)
    setDistrict(item.district)
    setResult(item.result)
    setMetrics({
      currentPrice: item.current_price,
      fairValue: item.fair_value,
      bubbleRate: item.bubble_rate,
      investmentScore: item.investment_score,
      opinion: item.opinion,
    })
  }

  function handlePdf() {
    const doc = new jsPDF()

    doc.setFontSize(22)
    doc.text('ESTATE AI REPORT', 20, 20)

    doc.setFontSize(12)
    doc.text(`Apartment: ${search || '-'}`, 20, 40)
    doc.text(`Average Price: ${metrics.currentPrice || '-'}`, 20, 52)
    doc.text(`Fair Value: ${metrics.fairValue || '-'}`, 20, 64)
    doc.text(`Bubble Rate: ${metrics.bubbleRate || '-'}`, 20, 76)
    doc.text(`Investment Score: ${metrics.investmentScore || '-'}`, 20, 88)
    doc.text(`AI Opinion: ${metrics.opinion || '-'}`, 20, 100)

    doc.setFontSize(14)
    doc.text('AI Analysis', 20, 120)

    doc.setFontSize(10)
    const lines = doc.splitTextToSize(result || 'No analysis result.', 170)
    doc.text(lines, 20, 135)

    doc.save(`${search || 'estate-ai'}-report.pdf`)
  }

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-5xl font-bold mb-2">ESTATE AI</h1>
          <p className="text-zinc-400">AI 기반 부동산 투자 비서</p>
        </div>

        <div>
          {userEmail ? (
            <div className="text-right">
              <p className="text-sm text-zinc-400 mb-2">{userEmail}</p>
              <button onClick={logout} className="bg-zinc-800 px-5 py-3 rounded font-bold">
                로그아웃
              </button>
            </div>
          ) : (
            <button onClick={loginWithGoogle} className="bg-white text-black px-6 py-3 rounded font-bold">
              Google로 로그인
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-3 mb-10">
        <select value={district} onChange={(e) => setDistrict(e.target.value)} className="bg-zinc-900 p-4 rounded">
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
            onChange={(e) => searchApartments(e.target.value)}
            placeholder="예: 잠실"
            className="w-full p-4 rounded bg-zinc-900"
          />

          {suggestions.length > 0 && (
            <div className="absolute z-50 mt-2 w-full bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
              {suggestions.map((item) => (
                <button key={item.name} onClick={() => selectSuggestion(item)} className="block w-full text-left px-4 py-3 hover:bg-zinc-800">
                  <div className="font-bold">{item.name}</div>
                  <div className="text-sm text-zinc-400">
                    기준가 {item.current_price}억 · 의견 {item.opinion}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={handleAnalyze} disabled={loading} className="bg-yellow-500 px-8 rounded text-black font-bold disabled:opacity-50">
          {loading ? '분석중...' : 'AI 분석'}
        </button>

        <button onClick={saveFavorite} className="bg-zinc-800 px-6 rounded font-bold">
          관심 저장
        </button>
      </div>

      {userEmail && (
        <div className="grid grid-cols-2 gap-5 mb-10">
          <div className="bg-zinc-900 p-6 rounded">
            <h2 className="text-xl font-bold mb-4">내 관심 아파트</h2>
            {favorites.length === 0 ? (
              <p className="text-zinc-400">아직 저장된 아파트가 없습니다.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {favorites.map((item) => (
                  <button key={item.id} onClick={() => runAnalyze(item.apartment_name, item.district)} className="bg-black border border-zinc-700 px-4 py-3 rounded hover:bg-zinc-800">
                    {item.apartment_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-zinc-900 p-6 rounded">
            <h2 className="text-xl font-bold mb-4">내 분석 기록</h2>
            {history.length === 0 ? (
              <p className="text-zinc-400">아직 분석 기록이 없습니다.</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-auto">
                {history.map((item) => (
                  <button key={item.id} onClick={() => openHistory(item)} className="block w-full text-left bg-black border border-zinc-700 px-4 py-3 rounded hover:bg-zinc-800">
                    <div className="font-bold">{item.apartment_name}</div>
                    <div className="text-sm text-zinc-400">
                      {item.current_price} · {item.investment_score} · {item.opinion}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-5 gap-5">
        <div className="bg-zinc-900 p-5 rounded"><p>실거래 평균</p><h2 className="text-3xl">{metrics.currentPrice}</h2></div>
        <div className="bg-zinc-900 p-5 rounded"><p>AI 적정가</p><h2 className="text-3xl">{metrics.fairValue}</h2></div>
        <div className="bg-zinc-900 p-5 rounded"><p>버블률</p><h2 className="text-3xl">{metrics.bubbleRate}</h2></div>
        <div className="bg-zinc-900 p-5 rounded"><p>투자 점수</p><h2 className="text-3xl text-yellow-400">{metrics.investmentScore}</h2></div>
        <div className="bg-zinc-900 p-5 rounded"><p>AI 의견</p><h2 className="text-3xl">{metrics.opinion}</h2></div>
      </div>

      <div className="grid grid-cols-2 gap-5 mt-10">
        <Gauge title="버블 리스크" value={bubbleNumber} color="#ef4444" suffix="%" />
        <Gauge title="투자 점수" value={scoreNumber} color="#eab308" suffix="점" />
      </div>

      <div className="bg-zinc-900 p-8 rounded mt-10">
        <h2 className="text-2xl mb-5">최근 12개월 가격 추이</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="price" stroke="#eab308" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-zinc-900 p-8 rounded mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl">AI 투자 분석</h2>
          <button onClick={handlePdf} className="bg-yellow-500 text-black px-5 py-3 rounded font-bold">
            PDF 리포트 다운로드
          </button>
        </div>

        <div className="whitespace-pre-wrap">{result}</div>
      </div>
    </main>
  )
}