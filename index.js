var exec = require('child_process').exec;
var express = require('express');
var app = express();
var crypto = require('crypto');
var fs = require('fs');

// folder where DirectionMaps-Backend, dirmaps-web and DirectionMaps-Rendering repos are located
var datahome = process.env.DIRMAPS_DATAHOME || "/home/c/tmp/dirmapsdata";
var dmalgdir = process.env.DIRMAPS_DMALGDIR || "/home/c/code/DirectionMaps-Backend/dist";
var renderdir = process.env.DIRMAPS_RENDERDIR || "/home/c/code/DirectionMaps-Rendering";

function log(msg) {
	var thetime = new Date().toISOString();
	console.log('['+ thetime +'] ', msg)
}

/*
	API endpoint
*/
app.get('/map', function (req, res) {
	if(req.query.lat && req.query.lon){
		// destination coordinates and name
		var lat = parseFloat(req.query.lat) || '51.961831';
		var lon = parseFloat(req.query.lon) || '7.617630';
		// destination name/label
		var description = (req.query.name) ? req.query.name : "Your destination";
		// mode of transportation, default mode is car
		var modes = ['car', 'bike']; 
		var mode = (modes.indexOf(req.query.mode) !== -1) ? req.query.mode : 'car';
		var now = Date.now();
		// generate unique id for request
		var hash = crypto.createHash('md5').update(''+lat+lon+now).digest('hex');
		// either output as blob or text/json
		var outputType = (req.query.output === "json") ? "json" : "blob";

		var options = {
			"start": now,
			"lat": lat,
			"lon": lon,
			"mode": mode,
			"hash": hash,
			"out": outputType
		}
		log(options);

		// enable CORS
		res.header('Access-Control-Allow-Origin', '*');
		res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
		res.header('Access-Control-Allow-Headers', 'Content-Type');
		try {
			// write the destination point in GeoJSON format into the target folder
			var destinationGeojson = {"type": "FeatureCollection", "features": [
					{"type": "Feature", "properties": { "ref": "destination_pt", "name": description }, "geometry": {
						"type": "Point", "coordinates": [lon, lat] } 
					} 
				] };
			fs.writeFileSync(datahome+'/destination'+options.hash+'.geojson', JSON.stringify(destinationGeojson), 'utf8');

			// start the calculations and rendering process
			var a = runAlgos(options, function(){
				// return image blob if not otherwise specified
				if(options.out === 'json') {
					res.send( JSON.stringify({"filename":"/out/"+options.hash+".png"}) );
				} else {
					var img = fs.readFileSync(datahome+'/out/'+options.hash+'.png');
					res.writeHead(200, {'Content-Type': 'image/png' });
					res.end(img, 'binary');
				}
				// log the time that has passed
				var timeElapsed = Date.now() - options.start;
				log("" + options.hash + " took "+ Math.round(timeElapsed/1000) +" seconds")
			});
		} catch(e) {
			res.status(500);
			res.send('{"msg":"An error occured"}');
		}
		
	} else {
		res.status(400);
		res.send('{"msg":"Please specify latitude and longitude parameters lon & lat."');
	}
});

/*
	Run Sweep, simplification & landmark algorithms
*/
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

/*
	Run mapnik python script
*/
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

/*
	Serve Leaflet and output files statically
*/
app.use('/', express.static('./leaflet'));
app.use('/out', express.static(datahome+'/out'));

var server = app.listen(3000, function () {
	var host = server.address().address;
	var port = server.address().port;
	console.log('Server listening at http://%s:%s', host, port);
});

server.on('connection', function(socket) {
  socket.setTimeout(180 * 1000); 
});