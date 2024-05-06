#!/bin/bash
cd /home/container

git clone https://github.com/fluffy-kaiju/scape-and-run-bot.git bot

npm ci

# Replace Startup Variables
MODIFIED_STARTUP=`eval echo $(echo ${STARTUP} | sed -e 's/{{/${/g' -e 's/}}/}/g')`
echo ":/home/container$ ${MODIFIED_STARTUP}"

# Run the Server
${MODIFIED_STARTUP}