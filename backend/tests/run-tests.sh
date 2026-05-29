#!/bin/bash

# Test Runner Script for Lawgpt Authentication APIs
# Usage: bash tests/run-tests.sh

set -e

echo "╔════════════════════════════════════════════════╗"
echo "║       Lawgpt Authentication API Test Suite     ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# Check if server is running
echo "🔍 Checking if backend server is running on port 3000..."
if ! curl -s http://localhost:3000/api/auth/register -X OPTIONS > /dev/null 2>&1; then
    echo ""
    echo "❌ ERROR: Backend server is not running on port 3000"
    echo ""
    echo "Please start the server first:"
    echo "  npm start"
    echo ""
    exit 1
fi

echo "✓ Server is running"
echo ""

# Menu
echo "Select testing method:"
echo "1) Run automated Jest tests"
echo "2) Run manual Node.js test script"
echo "3) Run both"
echo "4) Show curl command examples"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "Running automated Jest tests..."
        echo "═════════════════════════════════"
        npm test
        ;;
    2)
        echo ""
        echo "Running manual test script..."
        echo "═════════════════════════════════"
        node tests/manual-test.js
        ;;
    3)
        echo ""
        echo "Running all tests..."
        echo "═════════════════════════════════"
        echo ""
        echo "1️⃣  Starting Jest tests..."
        echo "─────────────────────────────────"
        npm test || true
        echo ""
        echo "2️⃣  Starting manual test script..."
        echo "─────────────────────────────────"
        node tests/manual-test.js || true
        echo ""
        ;;
    4)
        echo ""
        echo "📝 Common curl commands for testing:"
        echo "═════════════════════════════════"
        echo ""
        echo "1. Register:"
        echo "   curl -X POST http://localhost:3000/api/auth/register \\"
        echo "     -H 'Content-Type: application/json' \\"
        echo "     -d '{\"username\": \"user\", \"email\": \"user@test.com\", \"password\": \"pass123\"}' \\"
        echo "     -c cookies.txt"
        echo ""
        echo "2. Login:"
        echo "   curl -X POST http://localhost:3000/api/auth/login \\"
        echo "     -H 'Content-Type: application/json' \\"
        echo "     -d '{\"email\": \"user@test.com\", \"password\": \"pass123\"}' \\"
        echo "     -b cookies.txt -c cookies.txt"
        echo ""
        echo "3. Get Me:"
        echo "   curl -X GET http://localhost:3000/api/auth/get-me \\"
        echo "     -H 'Content-Type: application/json' \\"
        echo "     -b cookies.txt"
        echo ""
        echo "4. Logout:"
        echo "   curl -X GET http://localhost:3000/api/auth/logout \\"
        echo "     -H 'Content-Type: application/json' \\"
        echo "     -b cookies.txt"
        echo ""
        echo "For more details, see: API_TESTING_GUIDE.md"
        echo ""
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✓ Testing complete!"
echo ""
