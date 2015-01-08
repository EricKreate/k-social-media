var kreate_serverLoop = (function () {

  var db = require("./db");
  var async = require('async');
  var fb = require("./k_facebook");
  var twitter = require("./k_twitter");

  function getFaceBookPages(connection, imageFolder, dbName, callback) {
    var strQuery = 'SELECT id, facebook_page_id, facebook_last_item_date, subscription_network FROM pages WHERE subscription_network="facebook_eric";';
    connection.query(strQuery, function (err, result) {
      if (err) {
        console.log("222.11:[" + dbName + "] - [" + err + "]");
        callback();
      } else {
        if (result) {
          function loop(index) {
            if (index < result.length) {
              var page = result[index];
              console.log("fb:" + dbName);
              fb.dealWithIt(dbName, imageFolder, page, function (number, maxDate) {
                if (number > 0 && maxDate > 0) {
                  console.log('added ' + number + ' facebook feed-items to ' + dbName + ',' + page.id);
                  db.increasePageVersion(dbName, page.id, function (err) {
                    db.updateLastItemDate(dbName, maxDate, page.id, "facebook_last_item_date", function () {
                      console.log('maxDate:' + maxDate + " page.id:" + page.id);
                      loop(index + 1);
                    });
                  });
                } else {
                  loop(index + 1);
                }
              });
            } else callback();
          }
          loop(0);
        } else {
          callback("222.2: result undefined");
        }
      }
    });
  }

  function getTwitterPages(connection, imageFolder, dbName, callback) {
    var page = 0;
    console.log("twitter:");
    twitter.dealWithIt(dbName, imageFolder, page, function (err, number, maxID) {
      if (err) {
        callback(err);
      } else {
        console.log('back');
        if (number > 0 && maxID > 0) {
          console.log('added ' + number + ' twitter feed-items to ' + dbName + ',' + page.id);
        }
        callback();
      }
    });
  }

  /*    function getInstagramPages(connection, imageFolder, dbName, callback) {
      //       var strQuery = "SELECT id, facebook_page_id, facebook_last_item_date, instagram_user_name, instagram_last_item_date, twitter_user_name, twitter_last_tweet_id, subscription_network FROM pages;"; //" WHERE ((facebook_page_id is not null and facebook_page_id <> '' and subscription_network='facebook') or (instagram_user_name is not null and instagram_user_name <> '' and subscription_network='instagram') or (twitter_user_name is not null and twitter_user_name <> '' and subscription_network='twitter'));";
      var strQuery = 'SELECT id, twitter_user_name, twitter_last_tweet_id, subscription_network FROM pages WHERE subscription_network="instagram_eric"';
      connection.query(strQuery, function(err, result) {
          if (err) {
              console.log("*Error [getTwitterPages] - [" + dbName + "] - [" + err + "]");
              callback();
          } else {
              if (result) {
                  async.eachSeries(result,
                      function(page, seriesCallback) {
                          console.log("instagram::" + dbName + " " + result);
                          //   if (page.subscription_network == "twitter_test") {
                          console.log("   --page:" + page.facebook_page_id + "," + page.facebook_last_item_date + " " + page.twitter_user_name + " " + page.instagram_user_name);
                          instagram.dealWithIt(dbName, imageFolder, page, function(number, maxID) {
                              if (number > 0 && maxID > 0) {
                                  console.log('added ' + number + ' instagram feed-items to ' + dbName + ',' + page.id);
                                  db.increasePageVersion(dbName, page.id, function(err) {
                                      db.updateLastItemDate(dbName, maxID, page.id, "twitter_last_tweet_id", function() {
                                          console.log('maxID:' + maxID + " page.id:" + page.id);
                                          seriesCallback();
                                      });
                                  });
                              } else seriesCallback();
                          });
                          //  } else {
                          //      seriesCallback();
                          //  }
                      },
                      function finished(err) {
                          if (err) {
                              console.log("222 Error:" + err);
                          }
                          callback(err);
                      }
                  );
              } else {
                  callback("1.5: result undefined");
              }
          }
      });
  } */

  return {
    getTwitterPages: getTwitterPages
  };

})();

module.exports = kreate_serverLoop;