var kreate_facebook = (function () {

    var db = require('./db');
    var imageUtility = require('./k_image');
    var request = require('request');
    var k_file = require('./k_file');
    var async = require('async');

    function getCount() {
        return postFromFacebookCount;
    }

    function handleFacebook(dbName, imageFolder, result, callback) {
        var access_token = '1394424484170312|y5o9hU-YvSRnWVXf_sguAIb2pKU';
        var post_limit = 10;
        var fb = require('fb');
        // scope a variable representing the last FB item pulled
        var facebookLastItemDate = result.facebook_last_item_date;
        var pageID = result.id;
        //console.log(result);
        // make an API call to facebook asking for relevant page info
        fb.api("/" + result.facebook_page_id + "/posts?access_token=" + access_token + "&limit=" + post_limit + "&fields=object_id, message,name,description,picture,link,type", function (res) {
            if (!res || res.error) {
                if (res) {
                    console.log("1000:" + dbName + "," + JSON.stringify(res));
                } else {
                    console.log("1000.1  *Error:facebook res=null");
                }
                callback(0, 0);
            } else {
                var fbEntries = 0;
                var maxDate = 0;

                function loop(index) {
                    if (index < res.data.length) {
                        if (res.data[index].object_id) {
                            fb.api("/"+res.data[index].object_id + "?access_token="+access_token, function (res2) {
                              if(!res2 || res2.error) {
                                if (res2) {
                                    console.log("1050:" + dbName + "," + JSON.stringify(res2));
                                } else {
                                    console.log("1050.1  *Error:facebook res2=null");
                                }
                                //callback()
                                loop(index + 1);
                              } else {
                                var fbEntry = res2; 
                                date = new Date(fbEntry.created_time).getTime() / 1000;
                                checkIfNewPost(date, facebookLastItemDate, fbEntry, imageFolder, dbName, pageID, function (entryDate) {
                                    fbEntries++;
                                    if (entryDate > maxDate) maxDate = entryDate;
                                    //callback();
                                    loop(index + 1);
                                });
                              }

                            });
                        } else {
                            var fbEntry = res.data[index];
                            date = new Date(fbEntry.created_time).getTime() / 1000;
                            checkIfNewPost(date, facebookLastItemDate, fbEntry, imageFolder, dbName, pageID, function (entryDate) {
                                fbEntries++;
                                if (entryDate > maxDate) maxDate = entryDate;
                                //callback();
                                loop(index + 1);
                            });
                        }
                    } else callback(fbEntries, maxDate);
                }
                loop(0);

                /*   async.eachSeries(res.data,
                       function (fbEntry, callback) {
                           date = new Date(fbEntry.created_time).getTime() / 1000;
                           checkIfNewPost(date, facebookLastItemDate, fbEntry, imageFolder, dbName, pageID, function (entryDate) {
                               fbEntries++;
                               if (entryDate > maxDate) maxDate = entryDate;
                               callback();
                           });
                       },
                       function () {
                           callback(fbEntries, maxDate);
                       }); */
            }
        });
    }

    function checkIfNewPost(date, lastItemDate, post, imageFolder, dbName, pageID, callback) {
        var postForDB = getPostProperties(post, imageFolder);
        var fbEntries = 0;
        if (date > lastItemDate && postForDB !== null) {
            if (postForDB.image) { //if there's an image, download it and create post
                var imageName = imageUtility.getUniqueImageName(postForDB.image, postForDB.media_id);
                k_file.download(postForDB.image, imageFolder, imageName, function (err) {
                    postForDB.image = imageName;
                    imageUtility.resizeAndSquareTo640(imageFolder, postForDB.image, "facebook", function () {
                        fbEntries++;
                        db.createFeedItem(postForDB, dbName, pageID, function (err) {
                            if (err) console.log("101:err");
                            callback(date);
                        });
                    });
                });
            } else { //if there's no image, just create the post
                postForDB.image = 'default-post-image.jpg';
                fbEntries++;
                db.createFeedItem(postForDB, dbName, pageID, function (err) {
                    if (err) console.log("101.5:err");
                    callback(date);
                });
            }
            
        } else callback(0);
    }

    function getPostProperties(post, imageFolder) {
        //	console.log(post);
        var out = {
            title: null,
            description: null,
            image: null,
            link_url: null,
            start_date: null,
            end_date: 0,
            media_id: 0,
            object_id: null
        };

        out.object_id = post.id;
        
        // If there is no information inside the post return null.
        if ((post.message == null) && (post.name == null) && (post.description == null)) {
            return null;
        }
        if (post.created_time != null) {
            out.start_date = new Date(post.created_time).getTime() / 1000;
        }
        // If the picture is not its original size change the url so that we get the original sized image.
        if (post.source != null) {
            post.picture = post.source;
        }
        out.media_id = post.object_id;
        if (!out.media_id) out.media_id = post.id;
        if (post.picture) {
            out.image = post.picture;
            if( post.picture.indexOf("&url=") !== -1 && post.picture.indexOf("fbexternal") !== -1 ){

              post.picture = post.picture.split("+").join(" ");

              var params = {}, tokens,
                re = /[?&]?([^=]+)=([^&]*)/g;

              while (tokens = re.exec(post.picture)) {
                params[decodeURIComponent(tokens[1])]
                  = decodeURIComponent(tokens[2]);
              }
              out.image=params.url;
            }
            
            //out.image=out.image.replace("v/t1.0-9/","");

        }
        if (post.link != null) {
            out.link_url = post.link;
        }
        if (post.message != null) {
            if (post.name != null || post.description != null) {
                out.title = post.message;
                out.description = "";
                if (post.name != null) {
                    out.description = post.name;
                }
                if (post.description != null) {
                    if (out.description != "") {
                        out.description += "\n";
                    }
                    out.description += post.description;
                }
            } else {
                out.description = post.message;
            }
            // If we don't have a post message...
        } else {
            // and we have a name or description.
            if (post.name != null || post.description != null) {
                if (post.name != null) {
                    out.title = post.name;
                }
                if (post.description != null) {
                    out.description = post.description;
                }
            }
        }
        if (out.title != null && out.description != null && out.title != "" && out.description != "") {
            if (out.title.length > out.description.length) {
                var temp = out.title;
                out.title = out.description;
                out.description = temp;
            }
        }

        if (out.title == null) {
            out.title = "";
        }
        if (out.title == "") {
            out.title = out.description;
            out.description = "";
        }
        return out;
    }



    return {
        dealWithIt: handleFacebook,
        getCount: getCount
    };
})();

module.exports = kreate_facebook;



/*{ object_id: '10153047997691509',
    message: 'Who\'s your favorite muppet? http://cnn.it/1oDeTb2',
    name: '\'Sesame Street\': 5 of the cutest moments',
    picture: 'https://fbcdn-sphotos-d-a.akamaihd.net/hphotos-ak-xpf1/v/t1.0-9/s130x130/1922127_10153047997691509_933456833905866089_n.jpg?oh=69614da13addeccabcf1f21c6fe12553&oe=551D7F8B&__gda__=1424857142_8d2167a0b2170a7c7b66dd77882378c8',
    link: 'https://www.facebook.com/cnn/photos/a.10153047997351509.1073741861.5550296508/10153047997691509/?type=1&relevant_count=10',
    id: '5550296508_10153048039566509',
    created_time: '2014-11-10T19:51:41+0000' } 

    res2:{"id":"5550296508_10153048039566509",
    "from":{"category":"Media/news/publishing","name":"CNN","id":"5550296508"},
    "message":"Who's your favorite muppet? http://cnn.it/1oDeTb2",
    "picture":"https://fbcdn-sphotos-d-a.akamaihd.net/hphotos-ak-xpf1/v/t1.0-9/s130x130/1922127_10153047997691509_933456833905866089_n.jpg?oh=69614da13addeccabcf1f21c6fe12553&oe=551D7F8B&__gda__=1424857142_8d2167a0b2170a7c7b66dd77882378c8",
    "link":"https://www.facebook.com/cnn/photos/a.10153047997351509.1073741861.5550296508/10153047997691509/?type=1&relevant_count=10",
    "name":"'Sesame Street': 5 of the cutest moments",
    "caption":"Who's your favorite muppet? http://cnn.it/1oDeTb2",
    "icon":"https://fbstatic-a.akamaihd.net/rsrc.php/v2/yz/r/StEh3RhPvjk.gif",
    "privacy":{"value":""},
    "type":"photo",
    "status_type":"added_photos",
    "object_id":"10153047997691509",
    "created_time":"2014-11-10T19:51:41+0000",
    "updated_time":"2014-11-10T22:18:14+0000",
    "shares":{"count":343},"likes":{"data":[{"id":"100000202742652","name":"Joao Rangel"},{"id":"1771310822","name":"Vanessa Marie"},{"id":"100000998766101","name":"Makda Fantaye"},{"id":"100000269490969","name":"LisaLisa Douglas Braddy"},{"id":"100000086508884","name":"Kathryn Blake"},{"id":"1469487787","name":"Jackie Burt"},{"id":"1476834540","name":"Debra Wasserman"},{"id":"682925300","name":"Kathleen MacLeod Cournoyea"},{"id":"100003534020633","name":"Michael Frazier"},{"id":"1109077268","name":"Ruby Ramirez"},{"id":"1462577866","name":"Linda Ogin"},{"id":"1674916262","name":"Sean McGuire"},{"id":"1348692857","name":"Pam Cruz"},{"id":"1531860145","name":"Zacharias Wayne Vega"},{"id":"508870000","name":"Afua Cooper"},{"id":"100000351330492","name":"Drew Berry"},{"id":"100007702483223","name":"Xiaowei Du"},{"id":"763637655","name":"Lauren Webb"},{"id":"100000067389935","name":"Jennifer Jones"},{"id":"100000436406344","name":"Claudio Dias"},{"id":"100001498997924","name":"Roberto Riviera"},{"id":"100007392556533","name":"陳薇楓"},{"id":"1307843508","name":"Marco Tomat"},{"id":"100000750907542","name":"Amanda Forsyth Weiss"},{"id":"670036068","name":"Dorothy Eden"}],"paging":{"cursors":{"after":"NjcwMDM2MDY4","before":"MTAwMDAwMjAyNzQyNjUy"},"next":"https://graph.facebook.com/v1.0/5550296508_10153048039566509/likes?access_token=1394424484170312|y5o9hU-YvSRnWVXf_sguAIb2pKU&limit=25&after=NjcwMDM2MDY4"}},"comments":{"data":[{"id":"10153047997351509_10153048042706509","from":{"id":"690441764","name":"Angelo Emanuel Buttigieg"},"message":"The Count!","can_remove":false,"created_time":"2014-11-10T19:53:07+0000","like_count":12,"user_likes":false},{"id":"10153047997351509_10153048042106509","from":{"id":"633898377","name":"Nancy Robeson"},"message":"CNN wants me to pick my favorite muppet?","can_remove":false,"created_time":"2014-11-10T19:52:56+0000","like_count":10,"user_likes":false},{"id":"10153047997351509_10153048052911509","from":{"id":"650110241","name":"Brittani Norman"},"message":"Sesame street characters aren't Muppets. You goofed, cnn!","can_remove":false,"created_time":"2014-11-10T19:57:51+0000","like_count":5,"user_likes":false},{"id":"10153047997351509_10153048053616509","from":{"id":"630910704","name":"Dechend Bateman"},"message":"Beverley West must have been born before she could of learned and enjoyed the memories of Srsame Street. Must have not had any children either. Or only enjoys all the negatives we read about daily! I am so thankful for Sesame street.","can_remove":false,"created_time":"2014-11-10T19:58:02+0000","like_count":4,"user_likes":false},{"id":"10153047997351509_10153048087526509","from":{"id":"585341832","name":"Cindy Tellkamp Penfold"},"message":"Oscar the Grouch","can_remove":false,"created_time":"2014-11-10T20:13:36+0000","like_count":3,"user_likes":false},{"id":"10153047997351509_10153048041096509","from":{"id":"525810683","name":"Marie-France Belair"},"message":"Kermit is the DUDE!","can_remove":false,"created_time":"2014-11-10T19:52:28+0000","like_count":3,"user_likes":false},{"id":"10153047997351509_10153048134841509","from":{"id":"100001095646402","name":"Marysia Stepaniuk"},"message":"It is hard to choose only one:)","can_remove":false,"created_time":"2014-11-10T20:36:50+0000","like_count":2,"user_likes":false},{"id":"10153047997351509_10153048048031509","from":{"id":"1507159606","name":"Jean Hogge"},"message":"The grumpy old men.","can_remove":false,"created_time":"2014-11-10T19:55:31+0000","like_count":2,"user_likes":false},{"id":"10153047997351509_10153048043226509","from":{"id":"100003028806610","name":"Melissa Witter"},"message":"Big bird","can_remove":false,"created_time":"2014-

   res2:{"id":"10153047997691509",
   "created_time":"2014-11-10T19:33:16+0000",
   "from":{"category":"Media/news/publishing",
   "name":"CNN","id":"5550296508"},
   "height":360,"icon":"https://fbstatic-a.akamaihd.net/rsrc.php/v2/yz/r/StEh3RhPvjk.gif",
   "images":
   [{"height":360,"source":"https://fbcdn-sphotos-d-a.akamaihd.net/hphotos-ak-xpf1/v/t1.0-9/1922127_10153047997691509_933456833905866089_n.jpg?oh=ff03d2f95c240166f8feb0424477de8d&oe=54E4D953&__gda__=1423410489_58ecec93b70f87bd5f6accce58150740","width":640},
   {"height":320,"source":"https://fbcdn-sphotos-d-a.akamaihd.net/hphotos-ak-xpf1/v/t1.0-9/p320x320/1922127_10153047997691509_933456833905866089_n.jpg?oh=ee62086a1de0231ab7143221303bd154&oe=551B27F7&__gda__=1424442442_e37110f083f65f89ff3edc4c85f88563","width":568},
   {"height":130,"source":"https://fbcdn-sphotos-d-a.akamaihd.net/hphotos-ak-xpf1/v/t1.0-9/p130x130/1922127_10153047997691509_933456833905866089_n.jpg?oh=b69965e67c2f7dafb27750f4c428297f&oe=54E3A098&__gda__=1423117861_e56cbcd311585ee2980aa3e3b20e3f53","width":231},
   {"height":225,"source":"https://fbcdn-sphotos-d-a.akamaihd.net/hphotos-ak-xpf1/v/t1.0-9/p75x225/1922127_10153047997691509_933456833905866089_n.jpg?oh=f67131c667c1913448b0b1e7bb3b485c&oe=54EFA81B&__gda__=1423949980_709d60bf486459cfc37ef6c08c197850","width":400}],
   "link":"https://www.facebook.com/cnn/photos/a.10153047997351509.1073741861.5550296508/10153047997691509/?type=1",
   "name":"The Muppet Show made him a star, but Kermit the Frog had already begun winning younger fans on Sesame Street. We take a look back at five of the most adorable moments from the show: http://cnn.it/1oDeTb2",
   "name_tags":
   {"95":[
   {"id":"169731464548","length":13,"name":"Sesame Street","offset":95,"type":"page"}]},
   "picture":"https://fbcdn-sphotos-d-a.akamaihd.net/hphotos-ak-xpf1/v/t1.0-9/s130x130/1922127_10153047997691509_933456833905866089_n.jpg?oh=69614da13addeccabcf1f21c6fe12553&oe=551D7F8B&__gda__=1424857142_8d2167a0b2170a7c7b66dd77882378c8",
   "source":"https://fbcdn-sphotos-d-a.akamaihd.net/hphotos-ak-xpf1/v/t1.0-9/1922127_10153047997691509_933456833905866089_n.jpg?oh=ff03d2f95c240166f8feb0424477de8d&oe=54E4D953&__gda__=1423410489_58ecec93b70f87bd5f6accce58150740",
   "updated_time":"2014-11-10T19:48:57+0000",
   "width":640,
   "comments":
   {"data":[
   {"id":"10153047997691509_10153048044626509","can_remove":false,"created_time":"2014-11-10T19:53:54+0000","from":{"id":"1669687809","name":"Susan Scott Price"},"like_count":1,"message":"Such a wonderful show...and adults can enjoy it also!","user_likes":false},{"id":"10153047997691509_10153048293551509","can_remove":false,"created_time":"2014-11-10T21:49:09+0000","from":{"id":"100002056212435","name":"Sue Haskins"},"like_count":0,"message":"Kermie all the way.","user_likes":false},{"id":"10153047997691509_10153048096181509","can_remove":false,"created_time":"2014-11-10T20:17:54+0000","from":{"id":"1436811886","name":"Jessica Mapes"},"like_count":0,"message":"Luís Fernando Chuquimango Alca","message_tags":[{"id":"100008377869377","length":30,"name":"Luís Fernando Chuquimango Alca","offset":0,"type":"user"}],"user_likes":false},{"id":"10153047997691509_10153048056846509","can_remove":false,"created_time":"2014-11-10T19:59:33+0000","from":{"id":"100007017012772","name":"Manon Wilhelm"},"like_count":0,"message":"Katrin, déi bopen sinn nt do :(","message_tags":[{"id":"100000738122080","length":6,"name":"Katrin Gillen","offset":0,"type":"user"}],"user_likes":false},{"id":"10153047997691509_10153048047166509","can_remove":false,"created_time":"2014-11-10T19:55:19+0000","from":{"id":"100003864476348","name":"Badar Niyamath"},"like_count":0,"message":"HI AMPHIBIAN.","user_likes":false},{"id":"10153047997691509_10153048074731509","can_remove":false,"created_time":"2014-11-10T20:07:45+0000","from":{"id":"100005306954951","name":"Roy Brinkman"},"like_count":0,"message":"Lets get this frog in doctor who tv series will be alot funny inside the tardis :)","user_likes":false},{"id":"10153047997691509_10153048044871509","can_remove":false,"created_time":"2014-11-10T19:54:01+0000","from":{"id":"100007763941803","name":"Daa Badr"},"like_count":0,"message":"http://www.amazon.com/gp/product/B0012KSUUY/ref=as_li_qf_sp_asin_il_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=B0012KSUUY&linkCode=as2&tag=furnitustores-20&linkId=3YPOO57HYUQ4WOHZ","user_likes":false}],"paging":{"cursors":{"before":"Nw==","after":"MQ=="}}},"likes":{"data":[{"id":"100004305914166","name":"Kayoko  Hashino"},{"id":"1039533930","name":"Keight Lynn"},{"id":"100000967598937","name":"Francois Gonzalez"},{"id":"100001610387875","name":"Paulus Remie"},{"id":"1306677732","name":"Carrie Parks"},{"id":"100000230425096","name":"Jen Ayers"},{"id":"1164855151","name":"Sheila Heilig Banks"},{"id":"1276722470","name":"Lyne Principal"},{"id":"1030476123","name":"Joanne Jamora Munez"},{"id":"100002037286061","name":"Aaron Kiraly"},{"id":"100008044411392","name":"Sidra Usman"},{"id":"732213326","name":"Vivian Lef O'Middle"},{"id":"1832461091","name":"Carolina Collao"},{"id":"16409399","name":"XDj Prodigy"},{"id":"100002530820759","name":"Catherine McGuire"},{"id":"717876087","name":"Chantal Noordeloos"},{"id":"100007283916711","name":"Gracielita Oneldita Avila"},{"id":"100001873046609","name":"Robert Briseño"},{"id":"100001421906482","name":"Anum Sameer"},{"id":"100000868882631","name":"Jonella Nella Matthew"},{"id":"100000730287137","name":"Melissa Gallant"},{"id":"863290390","name":"Karlita Alfaro Gallo"},{"id":"1067453108","name":"Jimmie Jean Stump"},{"id":"1560911279","name":"Tracy Elliott"},{"id":"100003722332046","name":"Gabriel Portell"}],"paging":{"cursors":{"before":"MTAwMDA0MzA1OTE0MTY2","after":"MTAwMDAzNzIyMzMyMDQ2"},"next":"https://graph.facebook.com/v1.0/10153047997691509/likes?access_token=1394424484170312%7Cy5o9hU-YvSRnWVXf_sguAIb2pKU&limit=25&after=MTAwMDAzNzIyMzMyMDQ2"}}}


    */