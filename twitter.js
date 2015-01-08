var serverCheck = require("./lib/k_serverLoop");
var db = require('./lib/db');

var first = true;
var steps = 0;

function a() {
	var pattern = "\\\\'";
	var test = "\\\\'";
	var regex = new RegExp(pattern, "gi");
	console.log(test.replace(regex, "\'"));
	serverCheck.getTwitterPages(null, "", "", function (err) {
		if (err) {
			console.log("000: exited with error:" + err);
		} else {
			console.log("finished");
		}
	});
	/*	try {
			console.log('a:' + steps);
			var t = 300000;
			if (first) t = 1;
			first = false;
			setTimeout(function () {
				serverCheck.check("twitter", function (err) {
					if (err) console.log("000:" + err);
					steps++;
					a();
				});
			}, t);
		} catch (e) {
			console.log("000.1:" + e);
			a();
		} */
}

a();