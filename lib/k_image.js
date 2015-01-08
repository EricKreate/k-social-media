var kreate_image_utility = (function () {

  var gm = require("gm");
  var path = require('path');



  function resize(imageFolder, sourceFileName, newWidth, callback) {
    var originalSize = {
      width: 640,
      height: 640
    };
    var newSize = {
      width: 240,
      height: 260
    };
    var newPath = imageFolder + sourceFileName;
    gm(newPath)
      .size(function (err, size) {
        if (err) {
          console.log("3000.0 error:" + err);
          callback('');
        } else {
          newSize.width = size.width;
          newSize.height = size.height;
          if (size.width > size.height) {
            aspect = size.width / size.height;
            newSize.height = 640;
            newSize.width = 640 * aspect;
          } else {
            aspect = size.height / size.width;
            newSize.width = 640;
            newSize.height = 640 * aspect;
          }
          this.resize(newSize.width, newSize.height, "!");
          this.write(newPath, function (err) {
            if (err) console.log('error writing resized image,' + imageFolder + ':' + err);
            callback(newPath);
          });
        }
      });
  }

  function square(imageURL, callback) {
    try {
      gm(imageURL)
        .size(function (err, size) {
          if (err) {
            console.log("3000.0 error:" + err);
            callback();
          } else {
            var cropWidth = 640,
              cropHeight = 640;
            if (size.width > size.height) {
              cropWidth = size.height;
              cropHeight = size.height;
              /*  aspect = size.width / size.height;
                cropHeight = size.height;
                cropWidth = size.height * aspect; */
            } else {
              cropWidth = size.width;
              cropHeight = size.width;
              /*    aspect = size.height / size.width;
                  cropWidth = size.width;
                  cropHeight = size.width * aspect; */
            }
            //console.log(" xxxxx " + cropWidth + " x " + cropHeight);
            gm(imageURL).crop(cropWidth, cropHeight)
              .write(imageURL, function (err) {
                if (err) console.log('3.1:,' + imageURL + ':' + err);
                callback();
              });
          }
        });
    } catch (e) {
      console.log('0.0:' + e);
      callback();
    }
  }

  function tagSocialMedia(imageURL, socialMedia, callback) {
    var root = '/wildcard/oms2_v2/img';
    var smi = root + '/via-twitter.png';

    switch (socialMedia) {
    case "facebook":
      smi = root + '/via-facebook.png';
      break;
    case "twitter":
      smi = root + '/via-twitter.png';
      break;
    case "instagram":
      smi = root + '/via-instagram.png';
      break;
    }
    gm()
      .command("composite")
      .in("-gravity", "south")
      .in(smi)
      .in(imageURL)
      .write(imageURL, function (err) {
        if (err) {
          console.log('3.0:' + err);
          callback();
        } else {
          callback();
        }
      });
  }

  function resizeAndSquareTo640(imageFolder, imageFileName, SMnetwork, callback) {
    var newPath = imageFolder + imageFileName;  
    console.log("*" + newPath);
    //    resize(imageFolder, imageFileName, 640, function(newPath) {
    //      if (newPath != '') {
    square(newPath, function () {
      callback();
      //  tagSocialMedia(newPath, SMnetwork, function() {
      //      callback();
      //  });
    });
    //     } else callback();
    // });
  }

  function getUniqueImageName(source, uniqueID) {
    var ext = path.extname(source).substring(1);
    if (!ext){
      ext = 'jpg';
    } else {
      var regex = /[#\\?]/g; // regex of illegal extension characters
      var endOfExt = ext.search(regex);
      if (endOfExt > -1) {
          ext = ext.substring(0, endOfExt);
      }
    }
    if (uniqueID) {
      return uniqueID + "." + ext;
    } else {
      uTime = new Date().getTime();
      return uTime + '.' + ext;
    }
  }

  return {
    resize: resize,
    square: square,
    tagSocialMedia: tagSocialMedia,
    resizeAndSquareTo640: resizeAndSquareTo640,
    getUniqueImageName: getUniqueImageName
  };

})();

module.exports = kreate_image_utility;

/*kreate_image_utility.resize("/Users/ericKreate/Documents", "http://pbs.twimg.com/media/B2LkdbEIYAAWv4v.png", 640, function(newPath) {
    kreate_image_utility.square(newPath, 640, 640, function() {
        kreate_image_utility.tagSocialMedia(newPath, {
            network: "facebook_test"
        });
    });
});*/