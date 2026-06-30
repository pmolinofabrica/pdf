import { createClient } from '@supabase/supabase-js'
import { readSupabaseEnv } from './supabase-env'

const { url, serviceRoleKey } = readSupabaseEnv({ requireServiceRole: true })

const supabase = createClient(url, serviceRoleKey!)

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
