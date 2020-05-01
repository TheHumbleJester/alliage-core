#!/bin/sh

config="`realpath tsconfig.build.json`"
tsc="`realpath ./node_modules/.bin/tsc`"
extractPackageName="`realpath scripts/utils/extract-package-name.js`"
nodeModules="`realpath ./node_modules`"
for f in packages/*; do
  if [ -d "$f" ] && [ -d "$f/src" ] && [ -e "$f/package.json" ]; then
    cd "$f"
    packageName="`node $extractPackageName`"
    echo "Linking $packageName..."
    ln -s "`realpath src`" "$nodeModules/$packageName"
    cd - > /dev/null
  fi
done
for f in packages/*; do
    if [ -d "$f" ] && [ -e "$f/package.json" ]; then
        cd "$f"
        packageName="`node $extractPackageName`"
        echo "Building $packageName..."
        rm -rf dist
        mkdir dist
        if [ -d "src" ]; then
          cp "$config" "tsconfig.json"
          NODE_ENV=production "$tsc" --declaration
        fi
        cp package.json dist
        if [ -d "base-files" ]; then
          cp -R base-files dist/.
        fi
        if [ -e "tsconfig.json" ]; then
          rm tsconfig.json
        fi
        cd - > /dev/null
    fi
done
for f in packages/*; do
  if [ -d "$f" ] && [ -d "$f/src" ] && [ -e "$f/package.json" ]; then
    cd "$f"
    packageName="`node $extractPackageName`"
    echo "Unlinking $packageName..."
    rm "$nodeModules/$packageName"
    cd - > /dev/null
  fi
done