import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase 환경변수가 없습니다. .env.local을 확인하세요.')
}

const supabase = createClient(supabaseUrl, supabaseKey)

const csvPath = path.join(
  process.cwd(),
  'data',
  'seoul_apartments_sample.csv'
)

async function main() {
  const file = fs.readFileSync(csvPath, 'utf-8')

  const records = parse(file, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  })

  const rows = records.map((row: any) => ({
    name: row.name,
    district_name: row.district_name,
    district_code: row.district_code,
  }))

  console.log(`업로드 준비: ${rows.length}개 단지`)

  const { error } = await supabase
    .from('apartments')
    .upsert(rows, {
      onConflict: 'name,district_code',
    })

  if (error) {
    console.error('업로드 실패:', error.message)
    process.exit(1)
  }

  console.log('서울 아파트 DB 업로드 완료')
}

main()