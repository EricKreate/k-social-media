var kreate_twitter = (function () {

  var db = require('./db');
  var Twitter = require("twitter-js-client").Twitter;
  var imageUtility = require('./k_image');
  var k_file = require('./k_file');

  var config = {
    "consumerKey": "MYnzyib2D4cGxYkoBvSaDoT0k",
    "consumerSecret": "RlCALylEpdS4AYG9Nyf3T3OQX3UZNTHRJeMMJ8Df2hkBBtng2G",
    "accessToken": "2480065404-K8g7iqiRvJ2Ymp23PtNEofVOpZ5roc7rTgMSkaO",
    "accessTokenSecret": "FEB4f8R6TaKPD8xMu1XSRpfVVkvWxaQCFC1njRQ4A7oWT",
    "callBackUrl": "{callBackUrl}"
  };

  var lastTweetID = 0;
  var maxTweetID = 0;
  var databaseName = "";
  var pageID = 0;
  var twitterEntries = 0;

  function postToDB(dbObject, callback) {
    try {
      db.postToDB(dbObject, function (err) {
        if (err) {
          callback("204.4:" + err);
        } else {
          twitterEntries++;
          callback();
        }
      });
    } catch (e) {
      console.log("204.3:" + e);
      callback("204.3:" + e);
    }
  }

  var success = function (data, imageFolder, callback) {
    try {
      var tweets = JSON.parse(data);
      tweets.sort(function (a, b) {
        return parseInt(a.id) - parseInt(b.id);
      });
      maxTweetID = lastTweetID;
      console.log('count:' + tweets.length + " " + imageFolder);

      function loop(index) {
        if (index < tweets.length) {
          var tweet = tweets[index];
          try {
            if (tweet) {
              if (tweet.id > lastTweetID) {
                if (tweet.id > maxTweetID) maxTweetID = tweet.id;

                var dbObject = {
                  title: null,
                  description: tweet.text,
                  image_url: null,
                  link_url: null,
                  start_date: new Date(tweet.created_at).getTime() / 1000,
                  end_date: 0,
                  page_id: pageID,
                  network: "twitter",
                  media_id: tweet.id
                };
                if (tweet.entities.urls)
                  if (tweet.entities.urls.length > 0)
                    dbObject.link_url = tweet.entities.urls[0].expanded_url;
                if (tweet.entities.media)
                  dbObject.image_url = tweet.entities.media[0].media_url;
                /*  if (dbObject.image_url && dbObject.image_url !== "") {
                    var imageName = imageUtility.getUniqueImageName(dbObject.image, dbObject.media_id);
                    k_file.download(dbObject.image, imageFolder, imageName, function (err) {
                      dbObject.image = imageName;
                      imageUtility.resizeAndSquareTo640(imageFolder, dbObject.image, "twitter", function () {
                        postToDB(dbObject, function () {
                          loop(index + 1);
                        });
                      });
                    });
                  } else { */
                postToDB(dbObject, function () {
                  loop(index + 1);
                });
                //    }
              } else loop(index + 1);
            } else {
              loop(index + 1);
            }
          } catch (e) {
            console.log("204.0:" + e);
            loop(index + 1);
          }
        } else callback(null);
      }
      loop(0);
    } catch (e) {
      console.log("204.1");
      callback("204.1");
    }
  };

  function dealWithIt(dbName, imageFolder, page, callback) {
    try {
      twitterAccount = "nytimes"; //page.twitter_user_name;
      //   lastTweetID = page.twitter_last_tweet_id;
      databaseName = dbName;
      //  pageID = page.id;
      twitterEntries = 0;

      twitter = new Twitter(config);
      console.log('twitter call');
      twitter.getUserTimeline({
        screen_name: twitterAccount,
        count: '50'
      }, function (err) {
        console.log('205:' + JSON.stringify(err));
        callback('205:' + JSON.stringify(err), twitterEntries, lastTweetID);
      }, function (data) {
        success(data, imageFolder, function (err) {
          callback(err, twitterEntries, lastTweetID);
        });
      });
    } catch (e) {
      console.log('205.1' + e);
    }
  }

  return {
    dealWithIt: dealWithIt
  };

})();

module.exports = kreate_twitter;