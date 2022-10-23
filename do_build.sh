#!/bin/bash
rm -rf ./lib/pkgs/*/dist
npm run build

mkdir -p ~/dev/product/fset/assets/js/internal
rm -rf ~/dev/product/fset/assets/js/internal/
cp -r ./lib/pkgs/fset ~/dev/product/fset/assets/js/internal/

# Standalone
gzip -c ./lib/pkgs/model/dist/model.es.js > ./lib/pkgs/model/dist/model.es.js.gz
gzip -c ./lib/pkgs/json/dist/json.es.js > ./lib/pkgs/json/dist/json.es.js.gz
gzip -c ./lib/pkgs/html/dist/html.es.js > ./lib/pkgs/html/dist/html.es.js.gz

# Report
echo "minified"
du -sh ./lib/pkgs/**/dist/*.{js,css}
du -sh ./lib/pkgs/**/dist/**/*.{js,css}
echo
echo "gzip"
du -sh ./lib/pkgs/**/dist/*.gz
