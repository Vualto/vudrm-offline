const fs = require('fs');

module.exports.getLanguagesFromFile = (filePath) => {
    return new Promise(resolve => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) throw err;
            resolve(JSON.parse(data));
        });

    })
}