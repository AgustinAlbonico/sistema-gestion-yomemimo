#!/usr/bin/env bash
set -e
# Simple wait-for-it replacement: waits for host:port to be available
host=$1
port=$2
shift 2
echo "Waiting for ${host}:${port}..."
until nc -z $host $port; do
  sleep 1
done
echo "${host}:${port} is available"
exec "$@"
