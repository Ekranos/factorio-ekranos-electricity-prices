#!/bin/bash

set -e

VERSION=$(cat mod/info.json | jq -r '.version')
MODID=$(cat mod/info.json | jq -r '.name')

# DIRNAME is MODID + _ + VERSION
DIRNAME="$MODID"_"$VERSION"
ZIPPATH="$DIRNAME.zip"

cp -r "mod" "$DIRNAME"

zip -r "$ZIPPATH" "$DIRNAME"

factorio-api upload --api-key "$FACTORIO_API_KEY" \
                     --mod "$MODID" \
                     --file "$ZIPPATH"
