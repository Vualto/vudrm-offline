const { app, ipcMain, BrowserWindow } = require('electron');
const { download } = require('electron-dl');
const Queue = require('promise-queue');
const https = require('https');
const path = require('path');
const fs = require('fs');
const MenuService = require('./services/menu-service');
const ContentService = require('./services/content-service');
const ManifestParser = require('./services/manifest-parser-service');

let mainWindow, menuTemplate, mediaContent = [];
let downloadQueue = new Queue(2, Infinity);
let queueSize = 0;
let downloadedItemsnumber = 0;

exports.getMediaContent = () => {
    return mediaContent;
}

exports.queueDownload = (urls) => {
    queueSize += urls.length;
    urls.forEach(url => {
        downloadQueue.add(() => {
            return download(mainWindow, url);
        }).then((arg) => {
            downloadedItemsnumber++;
            console.log(`${downloadedItemsnumber}/${queueSize}`);
        }).catch(err => console.error(url, err));
    });
}

exports.getContentId = (manifestUrl) => {

}

menuTemplate = [{
    label: 'File',
    submenu: [
        {
            label: 'quit',
            accelerator: 'CommandOrControl+Q',
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
            accelerator: 'CommandOrControl +Z',
            selector: "undo:"
        },
        {
            label: "Redo",
            accelerator: 'CommandOrControl+Shift+Z',
            selector: "redo:"
        },
        {
            type: "separator"
        },
        {
            label: "Cut",
            accelerator: 'CommandOrControl+X',
            selector: "cut:"
        },
        {
            label: "Copy",
            accelerator: 'CommandOrControl+C',
            selector: "copy:"
        },
        {
            label: "Paste",
            accelerator: 'CommandOrControl+V',
            selector: "paste:"
        },
        {
            label: "Select All",
            accelerator: 'CommandOrControl+A',
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
            accelerator: 'CommandOrControl+i',
            click(item, focusedWindow) {
                if (typeof focusedWindow === 'undefined' || focusedWindow === null) return;
                focusedWindow.toggleDevTools();
            }
        }]
    });
};

app.on('ready', async () => {
    if (typeof mainWindow === 'undefined' || mainWindow === null) {
        mainWindow = new BrowserWindow({
            title: "VUDRM Offline",
            width: 1020,
            height: 768,
            webPreferences: {
                nodeIntegration: true,
                plugins: true
            },
            show: false
        });

        mainWindow.once('ready-to-show', () => {
            mainWindow.show();
        });

        mainWindow.on('closed', () => {
            mainWindow = null;
            app.quit();
        });


        ipcMain.on('download-requested', (e, args) => {
            download(mainWindow, args.stream).then((item) => {
                let path = item.getSavePath();
                fs.readFile(path, (err, data) => {
                    ManifestParser.parse(args.stream, data);
                });

            }).catch(err => console.error(err));
        });

        MenuService.setupMenu(menuTemplate);
        await ContentService.loadContent(path.join(`${__dirname}../../assets/content.json`), (content) => { mediaContent = content; });
        mainWindow.loadFile(__dirname + '/views/index.html');

    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});