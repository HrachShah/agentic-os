#!/bin/bash
set -e

echo ""
echo "============================================"
echo "  Claude OS Setup (Linux/macOS)"
echo "============================================"
echo ""

# Install backend deps
echo "[1/3] Installing backend dependencies..."
cd "$(dirname "$0")/../backend"
npm install

# Install dashboard deps
echo "[2/3] Installing dashboard dependencies..."
cd "../dashboard"
npm install

# Build dashboard
echo "[3/3] Building dashboard..."
npm run build

echo ""
echo "✓ Setup complete!"
echo ""
echo "To start Claude OS:"
echo "  cd backend && node server.js"
echo ""
echo "Or open http://localhost:3000"
