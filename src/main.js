const { app } = require('electron');
const path = require('path');
const WindowHandler = require('./handlers/window-handler');
const MyMenuHandler = require('./handlers/menu-handler');
const BitmovinVideoPlayer = require('./bitmovin-video-player');

let windowHandler = new WindowHandler();
let MenuHandler = new MyMenuHandler();
let mainWindow;
let VIEWS_DIR = path.join(__dirname + '/views/');

app.on('ready', () => {
    if (typeof mainWindow === 'undefined' || mainWindow === null) {
        mainWindow = windowHandler.createWindow("VUDRM Offline", 800, 800);
    }
    windowHandler.setWindowEvents(mainWindow, true);
    windowHandler.loadWindow(mainWindow, VIEWS_DIR + 'index.html');
    // let container = document.getElementById('container');
    // let source = 'https://d1chyo78gdexn4.cloudfront.net/vualto-demo/tomorrowland2015/tomorrowland2015_nodrm.ism/manifest.mpd';
    // let player = new BitmovinVideoPlayer(container, source);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});