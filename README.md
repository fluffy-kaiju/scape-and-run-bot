# scape-and-run-bot

A Scape and Run: Parasites discord webhook to alert phases

## Dev

To test the RCON use this

```
docker run -it --rm outdead/rcon ./rcon   -a ip:port -p PassWord
```

To test the server use this

```
docker run -it --rm -p 25565:25565 -p 25575:25575 -v ${PWD}:/app openjdk:8 /bin/bash
```

```
java -Xms128M -XX:MaxRAMPercentage=95.0 -Dterminal.jline=false -Dterminal.ansi=true $( [[ ! -f unix_args.txt ]] && printf %s "-jar server.jar" || printf %s "@unix_args.txt" )
```

```
HOST=192.168.129.7 PASSWD=test npm run start:dev
```
