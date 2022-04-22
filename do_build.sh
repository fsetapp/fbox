#!/bin/bash

npm run build

cp ./build/dist/main.js ~/dev/product/fset/assets/js/vendor/fbox.min.js
cp ./build/dist/main.css ~/dev/product/fset/assets/css/vendor/fbox.min.css
