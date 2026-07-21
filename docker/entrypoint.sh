#!/bin/sh
set -eu

if [ -x ./node_modules/.bin/prisma ]; then
  ./node_modules/.bin/prisma migrate deploy
elif [ -f ./node_modules/prisma/build/index.js ]; then
  node ./node_modules/prisma/build/index.js migrate deploy
else
  echo "ERROR: prisma CLI not found in image" >&2
  exit 1
fi

exec node server.js
