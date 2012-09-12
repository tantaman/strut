#!/bin/sh

find src -name *.coffee | awk '{print substr($0, 5, length($0)-10)"js"}' > web/scripts/.gitignore
echo "main-built.js" >> web/scripts/.gitignore