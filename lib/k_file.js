var Download = require('download');

var kreate_file_utility = (function () {

    function download(source, destination, destinationFilename, callback) {
        var dl = new Download({
                mode: '755'
            })
            .get(source)
            .dest(destination)
            .rename(destinationFilename);
        dl.run(function (err, files, stream) {
            callback(err);
        });
    }

    return {
        download: download
    };

})();

module.exports = kreate_file_utility;