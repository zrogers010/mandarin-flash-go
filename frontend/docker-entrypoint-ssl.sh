#!/bin/sh
if [ "$USE_SSL" = "true" ] && [ -n "$DOMAIN" ]; then
    envsubst '$DOMAIN' < /etc/nginx/nginx.prod.conf.template > /etc/nginx/nginx.conf
    echo "nginx: using production SSL config for $DOMAIN"
fi
