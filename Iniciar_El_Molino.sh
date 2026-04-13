#!/bin/bash

# ==============================================================================
# El Molino - Gestor de Turnos & Calendario
# ==============================================================================
# Este script inicia automáticamente la aplicación local en el puerto estándar.
# Garantiza que las dependencias estén instaladas antes de arrancar.

echo "Iniciando El Molino - Gestor de Calendario..."
echo "-----------------------------------------------"

# Verificar dependencias
if [ ! -d "node_modules" ]; then
    echo "¡Atención! Es la primera vez que inicia la aplicación o faltan componentes."
    echo "Instalando módulos requeridos (esto puede tardar unos minutos)..."
    npm install
fi

# Arrancar el servidor Vite en modo desarrollo
echo "Iniciando sistema. El navegador debería abrirse pronto..."
npm run dev
