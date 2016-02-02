var exec = require('child_process').exec;
var express = require('express');
var app = express();
var crypto = require('crypto');
var fs = require('fs');

// folder where DirectionMaps-Backend, dirmaps-web and DirectionMaps-Rendering repos are located
var datahome = "/tmp/dirmapsdata";
var dmalgdir = "/home/c/code/DirectionMaps-Backend/dist";
var renderdir = "/home/c/code/pythonmapnik";

function log(msg) {
	var thetime = new Date().toISOString();
	console.log('['+ thetime +'] ', msg)
}

//app.get('/', function (req, res) {
//	res.send('Direction Maps');
//});

app.get('/map', function (req, res) {
	//if(req.query.lat && req.query.lon){
		var lat = parseFloat(req.query.lat) || '51.961831';
		var lon = parseFloat(req.query.lon) || '7.617630';
		var modes = ['car', 'bike'];
		var mode = (modes.indexOf(req.query.mode) !== -1) ? req.query.mode : 'car';
		var now = Date.now();
		var hash = crypto.createHash('md5').update(''+lat+lon+now).digest('hex');

		var options = {
			"start": now,
			"lat": lat,
			"lon": lon,
			"mode": mode,
			"hash": hash
		}
		log(options);

		res.header('Access-Control-Allow-Origin', '*');
		res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
		res.header('Access-Control-Allow-Headers', 'Content-Type');
		try {
			var a = runAlgos(options, function(){
				var img = fs.readFileSync(datahome+'/out/'+options.hash+'.png');
				res.writeHead(200, {'Content-Type': 'image/png' });
				res.end(img, 'binary');
				//res.send('<img src="img/'+options.hash+'.png">');
				var timeElapsed = Date.now() - options.start;
				log("" + options.hash + " took "+ Math.round(timeElapsed/1000) +" seconds")
			});
		} catch(e) {
			res.send('{"msg":"An error occured"}');
		}
		
	//} else {
	//	res.send('Please specify latitude and longitude.');
	//}
});

var runAlgos = function(options, cb){
	log('Calculating '+options.hash);
	var child = exec('java -jar '+dmalgdir+'/dm-alg.jar '+options.lat+' '+options.lon+' '+options.mode+' '+options.hash,
		{ cwd: datahome },
		function (error, stdout, stderr) {
			if (error !== null) {
				log('exec error: ' + error);
				return false;
			}
			log(stderr);
			log(stdout);
			runRender(options, cb);
			//return true;
	});
}

var runRender = function(options, cb){
	log('Rendering '+options.hash);
	// python test.py 7.3828125 52.26815737376817 ./data output123.png asdf
	var child = exec('python '+renderdir+'/render.py '+options.lat+' '+options.lon+' '+datahome+' "'+datahome+'/out/'+options.hash+'.png" '+options.hash,
		{ cwd: renderdir },
		function (error, stdout, stderr) {
		if (error !== null) {
			log('exec error: ' + error);
			return false;
		}
		log(stderr);
		log(stdout);
		//return true;
		cb();
	});
}


app.use('/', express.static('./leaflet'));

var server = app.listen(3000, function () {
	var host = server.address().address;
	var port = server.address().port;
	console.log('Server listening at http://%s:%s', host, port);
});

server.on('connection', function(socket) {
  socket.setTimeout(180 * 1000); 
});