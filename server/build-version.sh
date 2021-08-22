#!/bin/sh

echo "module.exports = '1.0-$(git rev-parse --short HEAD)';" > server/version.js
