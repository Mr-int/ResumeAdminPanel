#!/bin/sh
set -e

API_UPSTREAM="${API_UPSTREAM:-https://test-api.singularity-resume.ru}"
API_HOST="${API_HOST:-test-api.singularity-resume.ru}"

sed \
  -e "s|\${API_UPSTREAM}|${API_UPSTREAM}|g" \
  -e "s|\${API_HOST}|${API_HOST}|g" \
  /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
