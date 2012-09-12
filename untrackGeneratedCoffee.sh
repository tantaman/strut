#!/bin/sh

while read line; do git rm --cached web/scripts/$line; done < web/scripts/.gitignore