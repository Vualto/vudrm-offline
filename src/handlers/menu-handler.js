const { app, Menu } = require('electron');
const WindowHandler = require('./window-handler');
const path = require('path');

let windowHandler = new WindowHandler();
let VIEWS_DIR = path.join(__dirname + '/../views/');

class AppMenuHandler {
    constructor() {
        let menuTemplate = [{
            label: 'File',
            submenu: [
                {
                    label: 'load stream',
                    accelerator: process.platform === 'darwin' ? 'Command+L' : 'Ctrl+L',
                    click() {
                        let addWindow = windowHandler.createWindow("Add stream", 500, 200)
                        windowHandler.setWindowEvents(addWindow);
                        windowHandler.loadWindow(addWindow, path.join(VIEWS_DIR + 'add_stream.html'));
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

        if (process.platform === 'darwin') {
            menuTemplate.unshift({ label: "" });
        }
        Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
    }

}

module.exports = AppMenuHandler;