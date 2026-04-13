# El Molino - Gestor de Turnos & Exportador de PDF

Software de interfaz desarrollado para administrar esquemas semanales/mensuales del personal y exportarlos con fiabilidad tipográfica matemática directamente a formato de diseño PDF de alta fidelidad.

## Requisitos Previos

Dado que esta es una SPA (Single Page Application) moderna escrita en React + Vite + TypeScript, existen requisitos de servidor para el intérprete:

1. **Instalar Node.js:** Es mandatorio instalar [Node.js](https://nodejs.org/) (Versión 20+ es sugerida por estabilidad, LTS). 
   - Durante la instalación, verificar que incluya el manejador de componentes **npm**.

## Instalación y Credenciales

1. **Clonar e instalar recursos:**
   Abre una terminal normal o de VSCode dentro de la carpeta:
   ```bash
   npm install
   ```
2. **Inyección de Identidad Segura (.env):**
   Las credenciales de acceso a la base de datos de Supabase **no viajan** a este repositorio por protocolo de seguridad.
   Una vez en la nueva PC, necesitas crear tú mismo en la raíz de la carpeta (junto al `package.json`) un archivo llamado literalmente `.env` y pegarle exactamente las 2 líneas originales que tenías guardadas en tu otra computadora central, con el formato vital:
   ```env
   VITE_SUPABASE_URL=el_link_de_tu_URL
   VITE_SUPABASE_ANON_KEY=las_contraseñas_alfa_numéricas
   ```

## Forma de Uso

**Arranque Rápido para Operarios Diarios (Linux):**
Si estás usando entorno Linux, hay un acceso directo ya prefabricado. Simplemente haz doble clic al archivo `El_Molino.desktop` ubicado en tu carpeta raíz y pulsa "Confiar y Ejecutar" en el mensaje del sistema. Eso subirá el servidor.

**Arranque Genérico por Terminal:**
Si prefieres consola, o estás en otra PC/Mac/Windows:
```bash
npm run dev
```

La app encenderá en `http://localhost:5173/`. Selecciona tu usuario y haz click a "Generar PDF".
