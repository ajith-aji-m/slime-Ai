#!/usr/bin/env bash
# Exercises the internal AI router against scripts/fake-nvidia.mjs.
# Usage: bash scripts/test-router.sh
set -u
BASE=http://localhost:3000

msg() { printf '{"messages":[{"id":"m1","role":"user","parts":[{"type":"text","text":"%s"}],"createdAt":"2026-09-02T00:00:00Z"}],"tools":[]}' "$1"; }

hit() {
  echo "──── $1"
  curl -s -N -X POST "$BASE/api/chat" -H "Content-Type: application/json" -d "$(msg "$2")"
  echo
}

hit "normal success"            "Say hello."
hit "fallback (recoverable)"    "Tell me about your architecture."
hit "permanent error"           "Explain something."
hit "rate limit -> fallback"    "What is the weather."
hit "timeout -> fallback"       "Give me a summary."
hit "midstream failure"         "Write a short paragraph."
