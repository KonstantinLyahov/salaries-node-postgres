var AdmZip = require('adm-zip');

var zip = new AdmZip();

module.exports = {
    addFileToZip(content, fileName, zipName) {
        zip.addFile(fileName, Buffer.from(content, 'utf-8'));
        zip.writeZip(zipName);
    }
}