#!/bin/bash
# dev.sh - Start ngrok, update .env files, then start backend and frontend in separate Terminal windows

# Start ngrok in a new Terminal window
oterminal_ngrok='tell application "Terminal" to do script "cd \"$(pwd)\" && ngrok http 3000"'
osascript -e "$oterminal_ngrok"

# Wait for ngrok to initialize
sleep 5

# Get ngrok public URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url')

if [ -z "$NGROK_URL" ]; then
  echo "Failed to get ngrok URL. Is ngrok running?"
  exit 1
fi

echo "NGROK_URL: $NGROK_URL"

# Update .env files with correct variable names
# Backend: PUBLIC_URL
BACKEND_ENV=./backend/.env
if [ -f "$BACKEND_ENV" ]; then
  grep -v '^PUBLIC_URL=' "$BACKEND_ENV" > "$BACKEND_ENV.tmp"
  echo "PUBLIC_URL=$NGROK_URL" >> "$BACKEND_ENV.tmp"
  mv "$BACKEND_ENV.tmp" "$BACKEND_ENV"
else
  echo "PUBLIC_URL=$NGROK_URL" > "$BACKEND_ENV"
fi

# Frontend: EXPO_PUBLIC_API_PUBLIC_URL
FRONTEND_ENV=./frontend/.env
if [ -f "$FRONTEND_ENV" ]; then
  grep -v '^EXPO_PUBLIC_API_PUBLIC_URL=' "$FRONTEND_ENV" > "$FRONTEND_ENV.tmp"
  echo "EXPO_PUBLIC_API_PUBLIC_URL=$NGROK_URL" >> "$FRONTEND_ENV.tmp"
  mv "$FRONTEND_ENV.tmp" "$FRONTEND_ENV"
else
  echo "EXPO_PUBLIC_API_PUBLIC_URL=$NGROK_URL" > "$FRONTEND_ENV"
fi

echo "Updated PUBLIC_URL in backend/.env and EXPO_PUBLIC_API_PUBLIC_URL in frontend/.env."

# Start backend in a new Terminal window
oterminal_backend='tell application "Terminal" to do script "cd \"$(pwd)/backend\" && npm run dev"'
osascript -e "$oterminal_backend"

# Start frontend in a new Terminal window
oterminal_frontend='tell application "Terminal" to do script "cd \"$(pwd)/frontend\" && npx expo start --clear"'
osascript -e "$oterminal_frontend"

echo "All services started in separate Terminal windows."
