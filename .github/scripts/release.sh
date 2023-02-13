#!/usr/bin/env bash

set -e
set -u

SYNC_AZURE_CDN=no

while [[ $# -gt 0 ]]; do
  case $1 in
    --source)
      PATH_TO_SOURCE=$(realpath "$2")
      shift # pop option
      shift # pop value
      ;;
    --azure-sa-name)
      AZURE_STORAGE_ACCOUNT_NAME="$2"
      shift # pop option
      shift # pop option
      ;;
    --azure-sa-token)
      AZURE_STORAGE_ACCOUNT_TOKEN="$2"
      shift # pop option
      shift # pop option
      ;;
    --azure-sync-cdn )
      SYNC_AZURE_CDN=yes
      shift #pop option
      ;;
    -*|--*)
      echo "Unknown option $1"
      exit 1
      ;;
    *)
      echo "Unknown argument $1"
      exit 1
      ;;
  esac
done

TMP_DIR=/tmp/cdn

rm -rf $TMP_DIR
mkdir $TMP_DIR
rsync $PATH_TO_SOURCE -rv --exclude-from=.cdnignore --exclude-from=.gitignore $TMP_DIR

AZURE_TARGET_URI="https://${AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/altinn-cdn"

if [[ -z "$AZURE_STORAGE_ACCOUNT_NAME" ]]; then
    echo "Skipping publish to azure cdn. As --azure-sa-name flag not defined"
else 
    cd $TMP_DIR
    AZCOPY_OPTS=( --put-md5 --compare-hash=MD5 --delete-destination=true )
    if [[ "$SYNC_AZURE_CDN" == "no" ]]; then
        echo "Publish to azure cdn will run with --dry-run (toggle with --azure-sync-cdn). No files will actually be synced"
        AZCOPY_OPTS+=( --dry-run )
    else
        echo "Publishing files to azure cdn"
    fi
    azcopy sync "$TMP_DIR/altinn-cdn/" "$AZURE_TARGET_URI/${AZURE_STORAGE_ACCOUNT_TOKEN}" "${AZCOPY_OPTS[@]}"
fi

rm -rf $TMP_DIR