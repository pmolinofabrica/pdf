import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://zgzqeusbpobrwanvktyz.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnenFldXNicG9icndhbnZrdHl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjE0ODY5OSwiZXhwIjoyMDgxNzI0Njk5fQ.nekEcuPqHs4VnJDrvZ_Z9SMGTJY6dRQofyxqcwGnBI8'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function debugWsod() {
  console.log('--- Debugging White Screen ---')
  
  // Checking data for March/April for a sample agent
  const { data, error } = await supabase
    .from('view_convocatoria_calendario')
    .select('*')
    .limit(50)

  if (error) {
    console.error('Error:', error.message)
    return
  }

  console.log(`Found ${data.length} records. Checking for nulls...`)
  
  data.forEach((row, i) => {
    if (!row.etiqueta || !row.hora_inicio || !row.hora_fin) {
      console.log(`[ALERT] Row ${i} has NULL values:`, JSON.stringify(row))
    }
  })

  console.log('\nSample Row structure:', JSON.stringify(data[0], null, 2))
}

debugWsod()
