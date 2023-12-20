#!/bin/bash

VERSION=$(cat mod/info.json | jq -r '.version')
MODID=$(cat mod/info.json | jq -r '.name')
DIRNAME="$MODID/_$VERSION"
ZIPPATH="$DIRNAME.zip"

cp -r "mod" "$DIRNAME"

zip -r "$ZIPPATH" "$DIRNAME"

factorio-api publish --api-key "$FACTORIO_API_KEY" \
                     --mod "$MODID" \
                     --file "$ZIPPATH"
