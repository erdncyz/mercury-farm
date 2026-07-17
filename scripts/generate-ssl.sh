#!/bin/sh

set -eu

previous_subject="$(cat /certs/subject 2>/dev/null || true)"
if [ ! -s /certs/cert.pem ] || [ ! -s /certs/key.pem ] || [ "$previous_subject" != "$SSL_SUBJECT" ]; then
  case "$SSL_SUBJECT" in
    *[!0-9.]*) subject_alt_name="DNS:$SSL_SUBJECT" ;;
    *) subject_alt_name="IP:$SSL_SUBJECT" ;;
  esac

  openssl req -x509 -nodes -newkey rsa:2048 -sha256 -days 3650 \
    -subj "/CN=$SSL_SUBJECT" \
    -addext "subjectAltName=$subject_alt_name" \
    -keyout /certs/key.pem \
    -out /certs/cert.pem
  chmod 600 /certs/key.pem
  printf '%s\n' "$SSL_SUBJECT" > /certs/subject
fi