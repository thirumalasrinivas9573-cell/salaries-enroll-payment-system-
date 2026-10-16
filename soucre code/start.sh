#!/bin/bash
# ==============================================================================
# Salary Enroll Pay System — Launch Script
# Starts C++ OOP verification, Node.js Backend API, and React Frontend
# ==============================================================================

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "======================================================================="
echo "   SALARY ENROLL PAY SYSTEM — STARTUP SEQUENCE                        "
echo "======================================================================="

# 1. Compile C++ Engine if needed
echo "[1/3] Checking C++17 OOP Engine..."
cd "$DIR/cpp_engine"
make test

# 2. Start Backend API on port 5001
echo "[2/3] Starting Express & MongoDB Atlas Backend API on port 5001..."
cd "$DIR/backend"
node src/server.js &
BACKEND_PID=$!

# Trap Ctrl+C to kill backend
trap "kill $BACKEND_PID 2>/dev/null; exit" SIGINT SIGTERM EXIT

# 3. Start Frontend Dev Server on port 3000
echo "[3/3] Starting Vite React Frontend Dev Server on port 3000..."
cd "$DIR/frontend"
npm run dev -- --host 0.0.0.0 --port 3000

wait $BACKEND_PID
