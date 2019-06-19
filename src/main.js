const { app, ipcMain, BrowserWindow, Menu } = require('electron');
const path = require('path');
let mainWindow, addWindow;

ipcMain.on('stream:load', (e, stream) => {
    mainWindow.webContents.send('stream:load', stream);
    addWindow.close();
});

app.on('ready', () => {
    if (typeof mainWindow === 'undefined' || mainWindow === null) {
        mainWindow = createWindow("VUDRM Offline", 800, 800);
    }
    setupMenu();
    setWindowEvents(mainWindow, true);
    loadWindow(mainWindow, path.join(__dirname + '/views/index.html'));
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

let setupMenu = () => {
    let menuTemplate = [{
        label: 'File',
        submenu: [
            {
                label: 'load stream',
                accelerator: process.platform === 'darwin' ? 'Command+L' : 'Ctrl+L',
                click: loadStreamClickHandler.bind(this)
            },
            {
                label: 'quit',
                accelerator: process.platform === 'darwin' ? 'Command+Q' : 'Ctrl+Q',
                click() {
                    app.quit();
                }
            }
        ]
    }, {
        label: "Edit",
        submenu: [
            {
                label: "Undo",
                accelerator: process.platform === 'darwin' ? 'Command+Z' : 'Ctrl+Z',
                selector: "undo:"
            },
            {
                label: "Redo",
                accelerator: process.platform === 'darwin' ? 'Shift+Command+Z' : 'Shift+Ctrl+Z',
                selector: "redo:"
            },
            {
                type: "separator"
            },
            {
                label: "Cut",
                accelerator: process.platform === 'darwin' ? 'Command+X' : 'Ctrl+X',
                selector: "cut:"
            },
            {
                label: "Copy",
                accelerator: process.platform === 'darwin' ? 'Command+C' : 'Ctrl+C',
                selector: "copy:"
            },
            {
                label: "Paste",
                accelerator: process.platform === 'darwin' ? 'Command+V' : 'Ctrl+V',
                selector: "paste:"
            },
            {
                label: "Select All",
                accelerator: process.platform === 'darwin' ? 'Command+A' : 'Ctrl+A',
                selector: "selectAll:"
            }
        ]
    }];

    if (process.platform === 'darwin') {
        menuTemplate.unshift({ label: "" });
    }

    if (process.env.NODE_ENV !== 'production') {
        menuTemplate.push({
            label: "dev tools",
            submenu: [{
                label: 'Toggl devTools',
                accelerator: process.platform === 'darwin' ? 'Command+i' : 'Ctrl+i',
                click(item, focusedWindow) {
                    if (typeof focusedWindow === 'undefined' || focusedWindow === null) return;
                    focusedWindow.toggleDevTools();
                }
            }]
        });
    }
    Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
}

let loadStreamClickHandler = () => {
    addWindow = createWindow("Add stream", 500, 62)
    setWindowEvents(addWindow);
    loadWindow(addWindow, path.join(__dirname + '/views/add_stream.html'));
}

let createWindow = (title, width, height) => {
    return new BrowserWindow({
        title: title,
        width: width,
        height: height,
        webPreferences: {
            nodeIntegration: true
        }
    });
}

let setWindowEvents = (window, isMain) => {
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

let loadWindow = (window, template) => {
    window.loadFile(template);
}