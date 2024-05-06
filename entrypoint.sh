#!/bin/bash
cd /home/container

if [ ! -d "/home/container/scape-and-run-bot" ]; then
	echo "Cloning the bot repository..."
	git clone https://github.com/fluffy-kaiju/scape-and-run-bot.git
	echo "Cloning complete!"
else
	echo "Pulling the latest changes..."
	cd /home/container/scape-and-run-bot
	git pull
	echo "Pulling complete!"
fi

cd /home/container/scape-and-run-bot/bot

# Install Dependencies
echo "Installing dependencies..."
npm ci

# Replace Startup Variables
MODIFIED_STARTUP=`eval echo $(echo ${STARTUP} | sed -e 's/{{/${/g' -e 's/}}/}/g')`
echo ":/home/container$ ${MODIFIED_STARTUP}"

# Run the Server
${MODIFIED_STARTUP}