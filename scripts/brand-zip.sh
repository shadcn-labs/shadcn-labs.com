#!/bin/bash

set -e

cd "$(dirname "$0")/.."

ZIP_FILE="public/shadcn-labs-brand.zip"

rm -f "$ZIP_FILE"

zip -j "$ZIP_FILE" \
  public/shadcn-labs-logomark.svg \
  public/shadcn-labs-logotype.svg \
  public/shadcn-labs-icon.svg

echo "Created $ZIP_FILE"
