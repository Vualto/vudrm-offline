const { app, BrowserWindow } = require('electron');

class WindowHandler {
    constructor() { }

    createWindow(title, width, height) {
        return new BrowserWindow({
            title: title,
            width: width,
            height: height
        });
    }

    setWindowEvents(window, isMain) {
        let isMainWindow = false;
        if (typeof isMain !== 'undefined' && isMain !== null) {
            isMainWindow = isMain;
        }

        if (isMainWindow) {
            window.on('closed', () => {
                app.quit();
            })
        }
        window.on('closed', () => {
            window = null;
        });
    }

    loadWindow(window, template) {
        window.loadFile(template);
    }
}

module.exports = WindowHandler;