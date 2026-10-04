#!/bin/sh
set -e

BASE_PATH="${BASE_PATH:-/admin/}"
BASE_PATH_NOSLASH="${BASE_PATH%/}"

sed \
  -e "s|\${BASE_PATH_NOSLASH}|${BASE_PATH_NOSLASH}|g" \
  -e "s|\${BASE_PATH}|${BASE_PATH}|g" \
  /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
