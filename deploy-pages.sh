#!/bin/sh

grunt build
mv dist dist-temp
git checkout gh-pages
rm -r dist-rewrite
mv dist-temp dist-rewrite
git add -A
git commit -m "rebuilt"