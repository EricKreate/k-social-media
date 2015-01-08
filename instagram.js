var serverCheck = require("./lib/k_serverLoop");

var first = true;
var steps = 0;

function a() {
    try {
        //	console.log('a:' + steps);
        var t = 300000;
        if (first) t = 1;
        first = false;
        setTimeout(function() {
            serverCheck.check("instagram", function(err) {
                if (err) console.log("000:" + err);
                steps++;
                a();
            });
        }, t); //em1 300000 );
    } catch (e) {
        console.log("000.1:" + e);
        a();
    }
}

a();