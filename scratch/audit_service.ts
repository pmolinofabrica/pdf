import { createClient } from '@supabase/supabase-js'
import { readSupabaseEnv } from './supabase-env'

const { url, serviceRoleKey } = readSupabaseEnv({ requireServiceRole: true })

const supabase = createClient(url, serviceRoleKey!)

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
