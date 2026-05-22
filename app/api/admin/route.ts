import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  const { data: favorites } = await supabase
    .from('favorites')
    .select('*')

  const { data: history } = await supabase
    .from('analysis_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  const ranking: Record<string, number> = {}

  favorites?.forEach((item) => {
    ranking[item.apartment_name] =
      (ranking[item.apartment_name] || 0) + 1
  })

  const popularApartments = Object.entries(ranking)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return NextResponse.json({
    success: true,
    totalFavorites: favorites?.length || 0,
    totalHistory: history?.length || 0,
    popularApartments,
    recentHistory: history || [],
  })
}