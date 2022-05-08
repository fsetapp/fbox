#!/bin/bash
rm -rf ./lib/pkgs/*/dist
npm run build

mkdir -p ~/dev/product/fset/assets/js/internal
rm -rf ~/dev/product/fset/assets/js/internal/
cp -r ./lib/pkgs/fset ~/dev/product/fset/assets/js/internal/
# We are trying to link css in shadow dom instead, seems easier to distribute
cp ./lib/pkgs/fset/dist/main.css ~/dev/product/fset/assets/css/vendor/fbox.css
cp ./lib/pkgs/fset/dist/main.css.map ~/dev/product/fset/assets/css/vendor/fbox.css.map

# gzip -c ./lib/pkgs/fset/dist/main.js > ./lib/pkgs/fset/dist/fset.es.js.gz
# gzip -c ./lib/pkgs/fset/dist/main.css > ./lib/pkgs/fset/dist/fset.css.gz

# Standalone
gzip -c ./lib/pkgs/model/dist/model.es.js > ./lib/pkgs/model/dist/model.es.js.gz
gzip -c ./lib/pkgs/json/dist/json.es.js > ./lib/pkgs/json/dist/json.es.js.gz
gzip -c ./lib/pkgs/html/dist/html.es.js > ./lib/pkgs/html/dist/html.es.js.gz

# Report
echo "minified"
du -sh ./lib/pkgs/**/dist/*.{js,css}
echo
echo "gzip"
du -sh ./lib/pkgs/**/dist/*.gz
