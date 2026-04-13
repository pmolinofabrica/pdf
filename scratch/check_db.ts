import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env') })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''
)

async function checkTables() {
  // Query information_schema via RPC if available, or just try to list common tables
  const tables = ['dias', 'calendario_dispositivos', 'configuracion_turnos', 'feriados']
  console.log('--- Checking Tables ---')
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1)
    if (error) {
      console.log(`[${table}] Error: ${error.message}`)
    } else {
      console.log(`[${table}] Success: Found data`)
    }
  }
}

checkTables()
