const fs = require('fs');

module.exports.loadContent = async (filePath, callback) => {
    let content = [];
    return fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) throw err;
        callback(JSON.parse(data));
    });
}