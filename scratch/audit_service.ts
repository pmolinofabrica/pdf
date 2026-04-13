import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://zgzqeusbpobrwanvktyz.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnenFldXNicG9icndhbnZrdHl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjE0ODY5OSwiZXhwIjoyMDgxNzI0Njk5fQ.nekEcuPqHs4VnJDrvZ_Z9SMGTJY6dRQofyxqcwGnBI8'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function auditWithServiceKey() {
  console.log('--- Database Audit (Service Role) ---')
  
  const tables = ['convocatoria', 'planificacion', 'dias', 'turnos', 'datos_personales']
  
  for (const table of tables) {
    console.log(`\n--- Table: ${table} ---`)
    const { data, error, count } = await supabase.from(table).select('*', { count: 'exact' }).limit(3)
    
    if (error) {
      console.log(`Error reading ${table}: ${error.message}`)
    } else {
      console.log(`Total records: ${count}`)
      console.log('Sample data:', JSON.stringify(data, null, 2))
    }
  }

  // Double check cohortes in datos_personales
  const { data: cohortes } = await supabase.from('datos_personales').select('cohorte').order('cohorte', { ascending: false }).limit(20)
  const uniqueCohortes = [...new Set(cohortes?.map(c => c.cohorte))]
  console.log('\n--- Unique Cohortes found ---', uniqueCohortes)
}

auditWithServiceKey()
