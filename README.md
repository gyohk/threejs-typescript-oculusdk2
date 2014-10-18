threejs-typescript-oculusdk2
===========================

Project template for coding your program with three.js in TypeScript.

## prerequisite
* [node.js](http://nodejs.org/)
* [grunt-cli](https://github.com/gruntjs/grunt-cli)
* [Java Runtime Environment](https://java.com/ja/download/)

## usage
### STEP 1
execute the following command.
```
npm install
grunt setup
grunt
```

### STEP 2
execute Oculus-WebSocket connector.
```
tools/OculusWebSocket/runInConsole.bat
```
This utility has been published in the following sites.
#### Laht's blog

http://laht.info/dk2-sensor-data-websocket-server/

http://laht.info/WebGL/DK2Demo.html

### STEP 3
Open dest/index.html In your browser that supports WebGL.

(You must use a local server.)

If you have installed Chrome on your PC, you can also use the following command.
```
grunt connect
```
