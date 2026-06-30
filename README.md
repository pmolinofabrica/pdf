# El Molino - Gestor de Turnos y Exportador de PDF

Interfaz para administrar esquemas semanales y mensuales del personal, con exportacion a PDF desde una SPA construida con React, Vite y TypeScript.

## Requisitos previos

1. Instalar [Node.js](https://nodejs.org/) version 20 o superior.
2. Verificar que `npm` quede disponible en terminal.

## Instalacion y credenciales

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Crear un archivo `.env` en la raiz del proyecto.
3. Copiar la plantilla de `.env.example` y completar estas variables:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu_clave_anon
   ```

Si usas los scripts de `scratch/` para auditoria o depuracion, agrega tambien:

```env
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

La `service role key` nunca debe quedar dentro de `src/` ni usar prefijo `VITE_`.

## Uso

Para desarrollo local:

```bash
npm run dev
```

La app queda disponible en `http://localhost:5173/`.

En Linux tambien puedes usar el lanzador `El_Molino.desktop`.
