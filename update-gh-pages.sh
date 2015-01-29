#!/bin/sh

OLD_PATH=$(pwd)
MY_PATH=$(dirname $0)
GH_PAGES_PATH=gh-pages
DIST_PATH=dist
APP_NAME='ember-enhanced-router'

if [ "`cat ${MY_PATH}/.git/HEAD`" != 'ref: refs/heads/master' ]; then
  echo "You must be on master branch prior to update GitHub pages"
  exit 1
fi

cd ${MY_PATH}

# first cleanup the folder
if [ -d ${GH_PAGES_PATH} ]; then
  cd ${GH_PAGES_PATH}
  # update to the latest
  git fetch
  git reset --hard origin/gh-pages
  rm -rf *
else
  mkdir ${GH_PAGES_PATH}
  cd ${GH_PAGES_PATH}
  git init
  git remote add origin git@github.com:huafu/${APP_NAME}.git
  git fetch
  git checkout gh-pages
fi

# go back to root of project
cd ${OLD_PATH}
cd ${MY_PATH}


# build the app with dev environment
EMBER_CLI_BASE_URL="/${APP_NAME}/" EMBER_CLI_LOCATION_TYPE='hash' ./node_modules/.bin/ember build --env production
resCode=$?

if [ "$resCode" == "0" ]; then
  # copy files over
  cp -R ${DIST_PATH}/* ${GH_PAGES_PATH}/
  rev=`git describe --always`
  cd ${GH_PAGES_PATH}
  git add -A
  git commit -m "Updating GitHub pages to ${rev}"
  git push origin gh-pages:gh-pages
  echo "[OK] Done building the GitHub pages package in ${GH_PAGES_PATH}."
else
  echo "[!!] Error building the GitHub pages package."
fi

cd ${OLD_PATH}
exit ${resCode}
