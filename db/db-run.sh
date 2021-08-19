#!/bin/sh

if [ -f "/home/src/app.lua" ]; then
    echo "running in development mode via /home/src/app.lua"
    cd /home/src
    /usr/local/bin/tarantool app.lua
else
    /usr/local/bin/tarantool /opt/tarantool/app.lua
fi
