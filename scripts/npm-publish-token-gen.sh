#!/bin/bash

TOKEN_NAME=sokutils-publish-$(date +%Y%m%d)

npm token create \
  --name=$TOKEN_NAME \
  --scopes=@sokutils \
  --bypass-2fa \
  --packages-and-scopes-permission=read-write
