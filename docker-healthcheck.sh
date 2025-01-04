#!/bin/sh
set -e

# Log file for debugging
LOG_FILE="/tmp/healthcheck.log"

# Start with a timestamp
echo "$(date): Starting health check" >> "$LOG_FILE"

# Try the health check
response=$(curl -s http://0.0.0.0:3000/health)
echo "$(date): Health check response: $response" >> "$LOG_FILE"

# Check if the response contains "success":true
if echo "$response" | grep -q '"success":true'; then
    echo "$(date): Health check succeeded" >> "$LOG_FILE"
    exit 0
else
    echo "$(date): Health check failed" >> "$LOG_FILE"
    exit 1
fi