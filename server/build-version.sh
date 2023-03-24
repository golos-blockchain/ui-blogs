#!/bin/sh

VERSION=$1
[ -z "$VERSION" ] && VERSION=$(git rev-parse --short HEAD)
[ -z "$VERSION" ] && VERSION='dev'

echo "module.exports = '1.0-$VERSION';" > server/version.js
