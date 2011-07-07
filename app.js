
/**
 * Module dependencies.
 */

// Command Constants
var IDLE = 0, LOGIN = 1, USERID = 2, LOGOUT = 3, SYNCUSER = 4,NEW = 5,DELETE = 6;
var STARTSYNCCUBES = 99 , ENDSYNCCUBES = 100;

var express = require('express');
var ws = require("websocket-server")

var app = module.exports = express.createServer();
var userGrounp = {};

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

app.get('/', function(req, res){
  res.render('Editor', {
    title: '3D Editor',
    layout: false
  });
});


app.listen(3000);

var wsserver = ws.createServer();
wsserver.addListener("connection", function(connection) {
	
	connection.addListener("message", function(msg) {
		wsOnMessage(connection, msg);
	});
});

function User() {
	
	this.userID = undefined;
	this.nickname = undefined;
	this.pos = function(){
	
		this.x = undefined;
		this.y = undefined;
		this.z = undefined;
		
	};
	
	this.color = undefined;
	this.offline = true;
	
	
}

function Cube(){

	this.x = undefined;
	this.y = undefined;
	this.z = undefined;
	
	this.color = undefined;
	
}

var Cubes = [];

function wsOnMessage(con, msg) {
	console.log("got message: " + msg);
	
	
		var cmd = msg.split('|');
		switch (parseInt(cmd[0]))
		{
			case LOGIN:
				onLogin(con);
				break;
			case NEW:
			
				for(var i = 0;i<Cubes.length;i++){
				
					if(!Cubes[i]) break;
				}
				
				var ___cube = new Cube();
				___cube.x = cmd[2];
				___cube.y = cmd[3];
				___cube.z = cmd[4];
				___cube.color = cmd[5];
				
				Cubes[i] = ___cube;
				
				con.broadcast(msg);
			
				break;
			
			case DELETE:
				
				for(var i= 0;i<Cubes.length;i++){
				
					if(Cubes[i]) {
					
						if(Cubes[i].x == cmd[2] && Cubes[i].y == cmd[3] && Cubes[i].z == cmd[4]) Cubes[i] = undefined;
					
					}
				}
				
				con.broadcast(msg);
				break;
			
			case LOGOUT:
				userGrounp[parseInt(cmd[1])].offline = true;
				userGrounp[parseInt(cmd[1])] = undefined;
				
			
		}
}



function onLogin(con) {
	
	for(var id = 0;id<99;id++){
		if(!userGrounp[id] || userGrounp[id].offline == true){
			
			break;
		}
	}
	
	
	console.log("Sending UID:" + id);
	
	var LoginUser = new User();
	LoginUser.userID = id;
	LoginUser.offline = false;
	
	userGrounp[id] = LoginUser;
	
	var str = [USERID,id].join('|');
	con.send(str);
	
	// let other client know a new user has joined
	str = [LOGIN,id].join('|');
	con.broadcast(str);
	
	// synchronize other clients that joined before this connection
	for (var k in userGrounp) {
		if (k != id && userGrounp.hasOwnProperty(k) && userGrounp[k].offline == false) {
			var u = userGrounp[k];
			var msg = [SYNCUSER, u.userID].join('|');
			con.send(msg);
		}
	}
	
	var str = [STARTSYNCCUBES].join('|');
	con.send(str);
	

	
	for (var i= 0;i<Cubes.length;i++){
		
		if(Cubes[i]){
		
			var str = [NEW,id,Cubes[i].x,Cubes[i].y,Cubes[i].z,Cubes[i].color].join('|');
			con.send(str);
		}
		
	}
	
	var str = [ENDSYNCCUBES].join('|');
	con.send(str);
	
	
}

wsserver.listen(8080);
console.log("Express server listening on port %d", app.address().port);
