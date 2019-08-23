const fs = require('fs');

module.exports.getContentsFromFile = async (filePath, callback) => {
    return fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) throw err;
        callback(JSON.parse(data));
    });
}