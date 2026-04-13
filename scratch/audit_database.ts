import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://zgzqeusbpobrwanvktyz.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnenFldXNicG9icndhbnZrdHl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNDg2OTksImV4cCI6MjA4MTcyNDY5OX0.F5KRxRDsKT88mAIwFwBXJLaldt8l0lDCT-vs80aCZ40'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function audit() {
  console.log('--- Database Audit ---')
  
  const tables = ['convocatoria', 'planificacion', 'dias', 'turnos']
  
  for (const table of tables) {
    console.log(`\n--- Table: ${table} ---`)
    // Get columns via a simple query
    const { data: colsRes, error: colsErr } = await supabase.from(table).select('*').limit(1)
    if (colsErr) {
      console.log(`Error reading ${table}: ${colsErr.message}`)
    } else if (colsRes && colsRes.length > 0) {
      console.log('Columns:', Object.keys(colsRes[0]).join(', '))
      console.log('Sample Row:', JSON.stringify(colsRes[0]))
    } else {
      console.log('Table exists but is empty.')
    }
  }

  // Check for existing views that might be relevant
  // Note: Standard Supabase REST API doesn't allow querying information_schema directly easily without RPC.
  // But we can try to guess or use RPC if it exists.
  console.log('\n--- Checking for potential views ---')
  const { data: viewsRes, error: viewsErr } = await supabase.from('convocatorias_view').select('*').limit(1)
  if (viewsErr) {
    console.log('convocatorias_view does not exist or is not reachable.')
  } else {
    console.log('convocatorias_view exists!')
  }
}

audit()
