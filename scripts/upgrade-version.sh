set -e
version=$1
packageProperty=$(npm bin)/package-property
setPackageValue=$(npm bin)/set-package-value
$(npm bin)/lerna version --no-push --no-git-tag-version "$version" -m "Upgrade to version: $version"
for f in packages/*; do
  if [ -d "$f" ] && [ -e "$f/package.json" ]; then
    cd "$f"
    name=$("$packageProperty" name)
    [[ $name = "alliage-core" ]] && depType="dependencies" || depType="peerDependencies"
    "$setPackageValue" "peerDependencies.alliage" "~$version"
    for dep in $("$packageProperty" alliageManifest.dependencies); do
      "$setPackageValue" "$depType.$dep" "~$version"
    done
    cd - >/dev/null
  fi
done
git commit --amend --no-edit
