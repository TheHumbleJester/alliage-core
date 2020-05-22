set -e
version=$1
packageProperty=$(npm bin)/package-property
setPackageValue=$(npm bin)/set-package-value
$(npm bin)/lerna version --no-push --no-git-tag-version "$version" -m "Upgrade to version: $version"
for f in packages/*; do
  if [ -d "$f" ] && [ -e "$f/package.json" ]; then
    cd "$f"

    for dep in `"$packageProperty" alliageManifest.dependencies`; do
      "$setPackageValue" "peerDependencies.alliage" "~$version"
      "$setPackageValue" "peerDependencies.$dep" "~$version"
    done

    cd - >/dev/null
  fi
done
git commit --amend --no-edit