#!/bin/sh

grunt build
mv dist dist-temp
git checkout gh-pages
rm -r dist
mv dist-temp dist
#git add -A
#git commit -m "rebuilt"