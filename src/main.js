const { app, ipcMain, BrowserWindow } = require('electron');
const { download } = require('electron-dl');
const express = require('express');
const Queue = require('promise-queue');
const path = require('path');
const fs = require('fs');
const MenuService = require('./services/menu-service');
const ContentService = require('./services/content-service');
const ManifestParser = require('./services/manifest-parser-service');

let mainWindow, menuTemplate, mediaContent = [], currentStream;
let downloadQueue = new Queue(2, Infinity);
let queueSize = 0;
let downloadedItemsTotal = 0;

app.commandLine.appendSwitch('widevine-cdm-path', '../vendor/google/widevine');

exports.getMediaContent = () => {
    return mediaContent;
}

exports.getCurrentStream = () => {
    return currentStream;
}
exports.queueDownload = (urls, dir) => {
    queueSize += urls.length;
    let directory = `./content/${dir}`;
    urls.forEach(url => {
        if (this.fileExistOnSystem(url, directory)) return;
        downloadQueue.add(() => {
            return download(mainWindow, url, { directory: directory });
        }).then((arg) => {
            downloadedItemsTotal++;
            let percentComplete = Math.floor(downloadedItemsTotal * (100 / queueSize));
            // TODO add download update event 
            printDownloadPercentage(percentComplete);
            if (queueSize === downloadedItemsTotal) {
                process.stdout.write("downloads complete");
            }
        }).catch(err => console.error(url, err));
    });
}

exports.fileExistOnSystem = (url, dir) => {
    let lastSlashIndex = url.lastIndexOf('/');
    let filename = url.substring(lastSlashIndex, url.length);
    let path = `${dir}/${filename}`;
    return fs.existsSync(`${dir}${filename}`);
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
    createServer()
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
            let dir = args.directory;
            download(mainWindow, args.stream, {
                directory: `./content/${dir}`
            }).then((item) => {
                let path = item.getSavePath();
                fs.readFile(path, (err, data) => {
                    let manifestParser = new ManifestParser(args.stream, dir, data);
                    manifestParser.parse();
                });

            }).catch(err => console.error(err));
        });

        ipcMain.on('play-requested', (e, args) => {
            currentStream = args.stream;
            mainWindow.loadFile(__dirname + '/views/player.html');
        })

        MenuService.setupMenu(menuTemplate);
        await ContentService.getContentsFromFile(path.join(`${__dirname}../../assets/content.json`), (content) => { parseContent(content); });
        mainWindow.loadFile(__dirname + '/views/index.html');

    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

function printDownloadPercentage(percentage) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write("download percentage: " + percentage + "% complete.");
}

function parseContent(content) {
    content.forEach(c => {
        // TODO get a better way of checking file name
        let filePath = `./content/${c.directory}/manifest.mpd`;
        c.downloaded = isFileDownloaded(filePath);
    });
    mediaContent = content;
}

function isFileDownloaded(filePath) {
    return fs.existsSync(filePath);
}

function createServer(app) {
    const server = express();
    server.use(express.static(path.join(__dirname, "../content"), {
        dotfiles: 'ignore',
        etag: false,
        extensions: ['mpd', 'dash'],
        index: false,
        maxAge: '1d',
        redirect: false,
        setHeaders: function (res, path, stat) {
            res.set('x-timestamp', Date.now())
        }
    }));

    server.get("/", (req, res) => {
        res.sendFile(path.resolve(__dirname, "../content/", req.query.name));
    });
    server.listen(9292, () => console.log('server running'));
}