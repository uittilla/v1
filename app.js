/**
 * Author mibbotson (ibbo was ere)
 */

var express = require('express'),
    routes  = require('./routes'),
    v1      = require('./v1'),
    Player  = require('./player'), 
    BISON   = require('bison');    
var app = module.exports = express.createServer();
var io  = require('socket.io').listen(app);
    
// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes
	
app.get('/', routes.index);
app.listen(3000);

io.configure(function (){
	io.enable('browser client minification');  // send minified client
	io.enable('browser client etag');          // apply etag caching logic based on version number
	io.enable('browser client gzip');          // gzip the file
	io.set('log level', 1);                    // reduce logging
	io.set('transports', [                     // enable all transports (optional if you want flashsocket)
	        'websocket',
	        'flashsocket',
	        'htmlfile',
	        'xhr-polling',
	        'jsonp-polling'
	]);
});

io.sockets.on('connection', function (socket) {	

	var player = Object.create(Player);
	
	socket.on('register', function (data) {
        v1.players[socket.id] = player.init(socket.id, data.name);     // add the new player
		socket.emit("ID", socket.id);
	});

	socket.on('keyup', function (event) {
        var data = BISON.decode(event);   
		if(v1.players[data.id]) {
            v1.players[data.id].end_move = v1.unixTime();
			v1.keyEvent(data.key, data.type, data.id);
		}
	});
	 
	socket.on('keydown', function (event) {
        var data = BISON.decode(event);   
		if(v1.players[data.id]) {
            v1.players[data.id].start_move = v1.unixTime();
			v1.keyEvent(data.key, data.type, data.id);
		}
	});
	
	socket.on('disconnect', function(){
		var that = this;		
		io.sockets.emit('remove', that.id);
		delete v1.players[this.id];
	});	
});

var dataStream = [];

setInterval(function(){
	v1.v1();
	
	dataStream[0] = v1.players;
	dataStream[1] = v1.enemies;
	
    var bdata = BISON.encode(dataStream);
    
    io.sockets.emit('update', bdata);			
},33);



/*console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);*/
