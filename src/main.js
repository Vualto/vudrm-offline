const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const WindowHandler = require('./handlers/window-handler');
const BitmovinVideoPlayer = require('./bitmovin-video-player');

let windowHandler = new WindowHandler();
let win;
let APP_DIR = path.resolve(__dirname);
let VIEWS_DIR = APP_DIR + '/views/';

let menuTemplate = [{
    label: 'File',
    submenu: [
        {
            label: 'load stream',
            accelerator: process.platform === 'darwin' ? 'Command+L' : 'Ctrl+L',
            click() {
                let addWindow = windowHandler.createWindow("Add stream", 500, 200)
                windowHandler.setWindowEvents(addWindow);
                windowHandler.loadWindow(addWindow, VIEWS_DIR + 'add_stream.html');
            }
        },
        {
            label: 'quit',
            accelerator: process.platform === 'darwin' ? 'Command+Q' : 'Ctrl+Q',
            click() {
                app.quit();
            }
        }
    ]
}];

Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));

app.on('ready', () => {
    if (typeof win === 'undefined' || win === null) {
        win = windowHandler.createWindow("VUDRM Offline", 800, 800);
    }
    windowHandler.setWindowEvents(win, true);
    windowHandler.loadWindow(win, VIEWS_DIR + 'index.html');
    // let container = document.getElementById('container');
    // let source = 'https://d1chyo78gdexn4.cloudfront.net/vualto-demo/tomorrowland2015/tomorrowland2015_nodrm.ism/manifest.mpd';
    // let player = new BitmovinVideoPlayer(container, source);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});