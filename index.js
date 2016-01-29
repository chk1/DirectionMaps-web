var exec = require('child_process').exec;
var express = require('express');
var app = express();
var crypto = require('crypto');

// folder where DirectionMaps-Backend, dirmaps-web and DirectionMaps-Rendering repos are located
var datahome = "/tmp/dirmapsdata";
var dmalgdir = "/home/c/code/DirectionMaps-Backend/dist";
var renderdir = "/home/c/code/pythonmapnik";

app.get('/', function (req, res) {
	res.send('Hello World!');
});

app.get('/map', function (req, res) {
	//if(req.query.lat && req.query.lon){
		var lat = parseFloat(req.query.lat) || '51.961831';
		var lon = parseFloat(req.query.lon) || '7.617630';
		var modes = ['car', 'bike'];
		var mode = (modes.indexOf(req.query.lon) == -1) ? 'car' : req.query.mode;
		var now = Date.now();
		console.log(now);
		var hash = crypto.createHash('md5').update(''+lat+lon+now).digest('hex');

		console.log(lat, lon, mode, hash);

		var options = {
			"lat": lat,
			"lon": lon,
			"mode": mode,
			"hash": hash
		}

		var a = runAlgos(options, function(){
			res.send('<img src="img/'+options.hash+'.png">');
		});
		
	//} else {
	//	res.send('Please specify latitude and longitude.');
	//}
});

var runAlgos = function(options, cb){
	console.log('Calculating '+options.hash);
	var child = exec('java -jar '+dmalgdir+'/dm-alg.jar '+options.lat+' '+options.lon+' '+options.mode+' '+options.hash,
		{ cwd: datahome },
		function (error, stdout, stderr) {
			if (error !== null) {
				console.log('exec error: ' + error);
				return false;
			}
			console.log(stderr);
			console.log(stdout);
			runRender(options, cb);
			//return true;
	});
}

var runRender = function(options, cb){
	console.log('Rendering '+options.hash);
	// python test.py 7.3828125 52.26815737376817 ./data output123.png asdf
	var child = exec('python '+renderdir+'/render.py '+options.lat+' '+options.lon+' '+datahome+' "'+datahome+'/out/'+options.hash+'.png" '+options.hash,
		{ cwd: renderdir },
		function (error, stdout, stderr) {
		if (error !== null) {
			console.log('exec error: ' + error);
			return false;
		}
		console.log(stderr);
		console.log(stdout);
		//return true;
		cb();
	});
}


app.use('/img', express.static(datahome+'/out'));

var server = app.listen(3000, function () {
	var host = server.address().address;
	var port = server.address().port;
	console.log('Server listening at http://%s:%s', host, port);
});

server.on('connection', function(socket) {
  socket.setTimeout(180 * 1000); 
});