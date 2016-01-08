var exec = require('child_process').exec;
var express = require('express');
var app = express();

// folder where DirectionMaps-Backend, dirmaps-web and DirectionMaps-Rendering repos are located
var home = "/home/c/code";

app.get('/', function (req, res) {
	res.send('Hello World!');
});

app.get('/map', function (req, res) {
	//if(req.query.lat && req.query.lon){
		var lat = parseFloat(req.query.lat) || '51.961831';
		var lon = parseFloat(req.query.lon) || '7.617630';
		var modes = ['car'];
		var mode = (modes.indexOf(req.query.lon) == -1) ? 'car' : req.query.mode;

		console.log(lat, lon, mode);

		var a = runAlgos(lat, lon, mode, function(){
			res.send('<img src="img/out.png">');
		});
		
	//} else {
	//	res.send('Please specify latitude and longitude.');
	//}
});

var runAlgos = function(lat, lon, mode, cb){
	console.log('Running algorithms');
	var child = exec('java -jar ../../DirectionMaps-Backend/dist/dm-alg.jar '+lat+' '+lon+' '+mode,
		{ cwd: home+'/dirmaps-web/data' },
		function (error, stdout, stderr) {
			if (error !== null) {
				console.log('exec error: ' + error);
				return false;
			}
			console.log(stderr);
			console.log(stdout);
			runIntermediate(cb);
			//return true;
	});
}

var runIntermediate = function(cb){
	console.log('Running intermediate');
	var child = exec('python fetchattributes.py', 
		{ cwd: home+'/pythonmapnik' },
		function (error, stdout, stderr) {
		if (error !== null) {
			console.log('exec error: ' + error);
			return false;
		}
		console.log(stderr);
		console.log(stdout);
		runRender(cb);
		//return true;
	});
}

var runRender = function(cb){
	console.log('Running rendering');
	var child = exec('python render.py', 
		{ cwd: home+'/pythonmapnik' },
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


app.use('/img', express.static('./data'));

var server = app.listen(3000, function () {
	var host = server.address().address;
	var port = server.address().port;
	console.log('Server listening at http://%s:%s', host, port);
});

server.on('connection', function(socket) {
  socket.setTimeout(180 * 1000); 
});