const { Menu } = require('electron');

module.exports.setupMenu = (menuTemplate) => {
    Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
}