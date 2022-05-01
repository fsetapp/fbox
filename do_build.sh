#!/bin/bash

npm run build

gzip -c ./build/dist/fset.min.js > ./build/dist/fset.min.js.gz
gzip -c ./build/dist/fset.min.css > ./build/dist/fset.min.css.gz

cp ./build/dist/fset.min.js ~/dev/product/fset/assets/js/vendor/fbox.min.js
cp ./build/dist/fset.min.js.map ~/dev/product/fset/assets/js/vendor/fbox.min.js.map
cp ./build/dist/fset.min.css ~/dev/product/fset/assets/css/vendor/fbox.min.css
cp ./build/dist/fset.min.css.map ~/dev/product/fset/assets/css/vendor/fbox.min.css.map

du -sh ./build/dist/*
