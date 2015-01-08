var pg = require('pg');
var conString = "postgres://root:1123Aa!!@kreate-dev.capjjibnptxg.us-east-1.rds.amazonaws.com/test";

var kreate_postgres = (function () {

	String.prototype.replaceAll = function (search, replace) {
		//replace="\'"
		//search="\\\\'"
		var regex = new RegExp(search, "gi");
		//	console.log(test.replace(regex, "\'"));
		return this.replace(regex, replace);
	};

	function postToDB(post, PScallback) {
		pg.connect(conString, function (err, client, done) {
			if (err) {
				PScallback(err);
			} else {
				console.log();
				if (post.title !== null) {
					post.title = post.title.replaceAll('\"', '\\\\"');
					post.title = post.title.replaceAll("\'", "\\'");
				}
				if (post.description !== null) {
					console.log("d:" + post.description);
					//		post.description = post.description.replaceAll('\"', '\\"');
					post.description = post.description.replaceAll("\'", "\\'");
					console.log("e:" + post.description);
				}
				var json = JSON.stringify(post);
				console.log("j:" + json);
				//			json = replaceDoubleBackslash(json);
				//		json = replaceNewLines(json);
				json = json.replaceAll("\\\\'", "'");
				json = json.replaceAll('\"', '\\"');
				console.log("k:" + json);
				var sql = "insert into content (type,content,created,modified) values ('twitter',E'" +
					json + "','" +
					post.start_date + "','0');";
				client.query(sql, function (err, result) {
					done();
					if (err) {
						console.log(sql);
						console.log();
						console.log(json);
						console.log("ps error:" + err);
						console.log();
						PScallback(err);
					} else {
						PScallback();
					}
				});
			}
		});
	}

	return {
		postToDB: postToDB,
	};

})();

module.exports = kreate_postgres;