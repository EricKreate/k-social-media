var kreate_instagram = (function () {
    var request = require('request');
    //  var instagram = require('instagram').createClient('bed88a2932e3415ebc531577e5fbfff8', '4f6e71daec6240818602006c443612eb');
    var ig = require('instagram-node').instagram();

    ig.use({
        access_token: '214659491.bed88a2.aa5362853e4c4e799333bc0a29e4863e'
    });
    ig.use({
        client_id: 'bed88a2932e3415ebc531577e5fbfff8',
        client_secret: '4f6e71daec6240818602006c443612eb'
    });
    /*   function handleInstagram(dbName, result, callback) {
  startTime(result.id);

  console.log("Instagram: (" + dbName + ")" + result.instagram_user_name + " | Last Insta: " + result.instagram_last_item_date);

  request({
    uri: "http://www.wildcardhq.com/oms2_v2/Instagram/instagram.php",
    method: "GET",
    qs: {
      // access token that gives us basic and relationship permissions
      "instaToken": "214659491.bed88a2.aa5362853e4c4e799333bc0a29e4863e",
      // User that we want to display content for (username)
      "instaFollowedUserID": result.instagram_user_name
    }
  }, function (err, res, body) {
    if (err) {
      console.log("An error occured (Instagram). Message: " + err);
    } else {
      if (body != null && body != "") {
        var instagramInfo = JSON.parse(body);
        console.log("Instagram Parsing");
        instagramProperties = {
          network: "instagram",
          dbName: dbName,
          page_id: result.id,
          description: null,
          link_url: null,
          image: null,
          start_date: null,
          end_date: 0
        };


        var instagram_date;
        var max_instagram_date = 0;

        endTime(result.id, 'Instagram');
        for (var i = 0; i < instagramInfo.length; i++) {
          instagramProperties.description = instagramInfo[i].text;
          instagramProperties.image = instagramInfo[i].image_url;
          instagramProperties.link_url = instagramInfo[i].link_url;
          instagram_date = instagramInfo[i].created_time;
          instagramProperties.start_date = instagram_date;
          //console.log("Instagram " + i + " - " + dbName);

          if (result.instagram_last_item_date < instagram_date) {
            if (instagram_date > max_instagram_date) {
              max_instagram_date = instagram_date;
            }
            request({
              uri: "http://www.wildcardhq.com/oms2_v2/controllers/create/social-network-feed-item.php",
              method: "POST",
              form: instagramProperties
            }, function (error, response, body) {
              postFromInstagramCount += 1;
              if (!error && response.statusCode == 200) {
                //console.log("Instagram - " + postFromInstagramCount + " - URL is OK"); // Print the google web page.
              } else {
                console.log(error);
              }
            });

          }
        }
        if (max_instagram_date !== 0) {
          updateLastItemDate(dbName, max_instagram_date, result.id, "instagram_last_item_date");
        }
      }
      //console.log("An error occured (Instagram). Empty Body");
    }
  });
  callback();
}
    }; */

    /*$instaToken = $_GET['instaToken'];
      // User to view content from (username)
      $instaFollowedUserID = $_GET['instaFollowedUserID'];
      // Convert user name to id for content pull
      $instaFollowedUserID = $instagram->searchUser($instaFollowedUserID)->data[0]->id;

      // Set access token for $instagram object (lets us make calls)
      $instagram->setAccessToken($instaToken);

      // Call to get info on relationship between two users.
      $relationship = $instagram->getUserRelationship($instaFollowedUserID);

      // If Kreate instagram account isn't following, follow.
      $isFollowing = $relationship->data->outgoing_status;
      if ($isFollowing != 'follows') {
        $instagram->modifyRelationship('follow', $instaFollowedUserID);
      }
      // Get posts from chosen user.
      $instaContent = $instagram->getUserMedia($instaFollowedUserID,10);

      $out = array();

      foreach($instaContent->data as $rawPost){

        if($rawPost->type == "image"){

          $post = array(
            "text"         => $rawPost->caption->text,
            "created_time" => $rawPost->caption->created_time,
            "image_url"    => $rawPost->images->standard_resolution->url,
            "link_url"     => $rawPost->link
          );

          $out [] = $post;

        } */

    function dealWithIt(dbName, imageFolder, page, callback) {
        var userID = '0';
        ig.user_search('bbcnews', function (err, users, remaining, limit) {
            if (err) {
                console.log("401.1:" + err);
                callback(err);
            } else {
                if (users && users.length > 0) userID = users[0].id;
                if (userID > 0) {
                    ig.user_media_recent(userID, {
                        count: 5
                    }, function (err, medias, pagination, remaining, limit) {
                        if (err) {
                            console.log("401.2:" + err);
                            callback(err);
                        } else {
                            for (var z = 0; z < medias.length; z++) {
                                var media = {
                                    text: medias[z].caption.text,
                                    created_time: medias[z].caption.created_time,
                                    image_url: medias[z].images.standard_resolution.url,
                                    link_url: medias[z].link
                                };
                            }
                        }
                    });
                }
            }
        });
    }

    return {
        dealWithIt: dealWithIt
    };

})();

//module.exports = kreate_instagram;

var page = {};
page.instagram_user_name = 'bbcnews';
page.instagram_last_item_date = 0;
page.id = 5;
var imageFolder = '/wildcard/oms2files/994/images/';

kreate_instagram.dealWithIt("994_james", imageFolder, page, function (lastIGDate, lateIGEntries) {
    console.log("_done:" + lastIGDate + "," + lateIGEntries);
});