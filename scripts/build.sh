#!/bin/sh

config="$(realpath tsconfig.build.json)"
tsc="$(realpath ./node_modules/.bin/tsc)"
extractPackageName="$(npm bin)/package-property name"
nodeModules="$(realpath ./node_modules)"
copyPackageFile="$(npm bin)/copy-package-file"
for f in packages/*; do
  if [ -d "$f" ] && [ -d "$f/src" ] && [ -e "$f/package.json" ]; then
    cd "$f"
    packageName="$($extractPackageName)"
    echo "Linking $packageName..."
    ln -s "$(realpath src)" "$nodeModules/$packageName"
    cd - >/dev/null
  fi
done
for f in packages/*; do
  if [ -d "$f" ] && [ -e "$f/package.json" ]; then
    cd "$f"
    packageName="$($extractPackageName)"
    echo "Building $packageName..."
    rm -rf dist
    mkdir dist
    if [ -d "src" ]; then
      cp "$config" "tsconfig.json"
      NODE_ENV=production "$tsc" --declaration
    else
      echo "module.exports = {}" >dist/index.js
    fi
    "$copyPackageFile" dist devDependencies scripts
    if [ -d "base-files" ]; then
      cp -R base-files dist/.
    fi
    cp README.md dist/.
    if [ -e "tsconfig.json" ]; then
      rm tsconfig.json
    fi
    cd - >/dev/null
  fi
done
for f in packages/*; do
  if [ -d "$f" ] && [ -d "$f/src" ] && [ -e "$f/package.json" ]; then
    cd "$f"
    packageName="$($extractPackageName)"
    echo "Unlinking $packageName..."
    rm "$nodeModules/$packageName"
    cd - >/dev/null
  fi
done
