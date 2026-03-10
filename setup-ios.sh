#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  Ecora – Setup iOS (ejecutar en Mac con Xcode instalado)
# ─────────────────────────────────────────────────────────────

set -e

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   Ecora iOS Setup Script             ║"
echo "╚══════════════════════════════════════╝"
echo ""

# 1. Instalar dependencias si hace falta
echo "▶ Instalando dependencias npm..."
npm install

# 2. Build web
echo "▶ Compilando app web (vite build)..."
npm run build

# 3. Agregar plataforma iOS si no existe
if [ ! -d "ios" ]; then
  echo "▶ Agregando plataforma iOS..."
  npx cap add ios
else
  echo "▶ Plataforma iOS ya existe, omitiendo cap add."
fi

# 4. Sincronizar assets y plugins
echo "▶ Sincronizando con iOS (cap sync)..."
npx cap sync ios

echo ""
echo "✅ Sincronización completada."
echo ""
echo "──────────────────────────────────────────────"
echo "  PASOS MANUALES EN XCODE:"
echo "──────────────────────────────────────────────"
echo ""
echo "  1. Abrir Xcode:"
echo "     npx cap open ios"
echo ""
echo "  2. Signing & Capabilities:"
echo "     - Team: selecciona tu Apple Developer account"
echo "     - Bundle ID: com.ecora.app"
echo ""
echo "  3. Agregar URL Scheme para Google Sign-In:"
echo "     - Info > URL Types > (+)"
echo "     - URL Schemes: com.googleusercontent.apps.331686188304-<TU_IOS_CLIENT_ID>"
echo "     (descarga el GoogleService-Info.plist desde Google Cloud Console"
echo "      y copia el valor REVERSED_CLIENT_ID)"
echo ""
echo "  4. Arrastrar GoogleService-Info.plist al proyecto en Xcode"
echo "     (junto a AppDelegate.swift)"
echo ""
echo "  5. Product → Archive → Distribute App"
echo ""
echo "──────────────────────────────────────────────"
echo "  CREDENCIAL iOS EN GOOGLE CLOUD CONSOLE:"
echo "──────────────────────────────────────────────"
echo ""
echo "  Si no tienes un OAuth Client ID de tipo iOS:"
echo "  → console.cloud.google.com"
echo "  → APIs & Services → Credentials → + Create Credentials"
echo "  → OAuth Client ID → iOS"
echo "  → Bundle ID: com.ecora.app"
echo ""
