#!/bin/bash -
set -e


VERSION=$1
if [ -z "$VERSION" ]; then
  echo 'Usage: ./release.sh VERSION <BRANCH>'
  exit 1
fi

BRANCH=$2
if [ -z "$BRANCH" ]; then
  BRANCH=$VERSION
fi

echo "Checking if meta $BRANCH exists: https://github.com/nuxeo/generator-nuxeo-meta/archive/$BRANCH.tar.gz"
curl -s -f -I -L https://github.com/nuxeo/generator-nuxeo-meta/archive/$BRANCH.tar.gz > /dev/null

git checkout master

# Update the version in package.json
npm version $VERSION --git-tag-version=false
git add package.json
git commit -m "Update version to $VERSION"

# branch to do the actual build
git checkout -b release

# make sure dependencies are up to date
NODE_MODULES=node_modules
if [ -d "$NODE_MODULES" ]; then
  rm -r $NODE_MODULES
fi
npm install

# freeze dependencies versions
npm shrinkwrap --dev
git add -f npm-shrinkwrap.json

# Update generator-nuxeo-meta branch
sed -i.bak "s/\"stable\"/\"$BRANCH\"/g" package.json
rm -f package.json.bak
git add package.json

# build, test and publish
npm run gulp -- prepublish
npm publish

git commit -m "Release $VERSION - meta: $BRANCH"
git tag v$VERSION

# cleanup
git checkout master
git branch -D release

npm version prepatch --git-tag-version=false

# push everything
git push origin master
git push origin v$VERSION
