#!/bin/sh
set -eu

mkdir -p /app/uploads

# Canonical default avatar. Keep the legacy filename as a compatibility copy
# for rows created by older versions of the application.
if [ ! -f /app/uploads/default-avatar.png ]; then
  cp /app/assets/default-avatar.png /app/uploads/default-avatar.png
fi
if [ ! -f /app/uploads/avatar-placeholder.png ]; then
  cp /app/assets/default-avatar.png /app/uploads/avatar-placeholder.png
fi

exec node dist/main.js
