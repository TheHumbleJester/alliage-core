version="$($(npm bin)/package-property version lerna.json)"
repo="$CIRCLE_PROJECT_USERNAME/$CIRCLE_PROJECT_REPONAME"
$(npm bin)/version-has-changed lerna.json
if [ $? -eq 0 ]; then
  $(npm bin)/create-github-release $repo $version && echo "Release \"$version\" created on \"$repo\""
  for f in packages/*; do
    if [ -d "$f" ] && [ -e "$f/package.json" ]; then
      cd "$f"
      packageName="$($(npm bin)/package-property name)"
      npm publish dist && echo "\"$name@$version\" has been successfully published on NPM"
      cd - >/dev/null
    fi
  done
else
  echo "No need to publish packages"
fi
