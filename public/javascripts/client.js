



if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = (window.webkitRequestAnimationFrame ||
                                  window.mozRequestAnimationFrame ||
                                  window.msRequestAnimationFrame ||
                                  window.oRequestAnimationFrame ||
                                  function (callback) {
                                    return window.setTimeout(callback, 17 /*~ 1000/60*/);
                                  });
}

if (!window.cancelRequestAnimationFrame) {
  window.cancelRequestAnimationFrame = (window.cancelAnimationFrame ||
                                        window.webkitCancelRequestAnimationFrame ||
                                        window.mozCancelRequestAnimationFrame ||
                                        window.msCancelRequestAnimationFrame ||
                                        window.oCancelRequestAnimationFrame ||
                                        window.clearTimeout);
}

// Keyname constants

var user = "";    
var canvas  = document.getElementById('canvas');
var context = canvas.getContext('2d');

var Game = {
    players: {},
    enemies: {},
    socket: io.connect('http://10.1.1.104:3000'),
	id: null,
	stars:[],
	suns: [],
	eimages: [{img: "../images/e1.png"},{img: "../images/e2.png"},{img: "../images/e3.png"}], 
	explosion: null,
	level: 0,
	fighter: new Image(),
	sys: {
/*
		n1: {
			img: '../images/n1.png',
			x: 1500,
			y:200
		},*/

		n2: {
			img: '../images/n2.png',
			x: 200,
			y:900			
		}
	},
	init: function(user) {
		var self = this;
		this.user = user;
		this.setup(user);
		
		document.addEventListener('keydown', function (event) {
           var data = BISON.encode( {"key": event.keyCode, "type": event.type, "id": self.id} );   
           self.socket.emit('keydown', data);
        }, false);

        document.addEventListener('keyup', function (event) {
           var data = BISON.encode( {"key": event.keyCode, "type": event.type, "id": self.id} );   
           self.socket.emit('keyup', data);
        }, false);    	
        
        for (var i = 0; i < 500; i++) {
            var s = this.star();
            this.stars.push(s);
        }
        
        var img = {};
        for (var i in this.eimages) {
        	img = this.eimages[i];
        	img.obj = new Image();
        	img.obj.onload = function() {
        	   img.imgid = Math.round(Math.random());
            }	
            img.obj.src = img.img;
        }
    
        this.explosion = new Image();
        this.explosion.src = "../images/explosion.png";
        this.fighter.src = "./images/fighter.png";
       
        var neb = {};
        
        for(var s in this.sys) {
           neb = this.sys[s];	
           neb.imageObj = new Image();
           neb.imageObj.onload = function(){
	         neb.imageObj.style.zindex = -1;  
	       };
	       neb.imageObj.src = neb.img;	       
        }
		
		(function drawFrame () {
            window.requestAnimationFrame(drawFrame, canvas);
                      
            Game.render();             
   	    }());        
	},

    setup: function(user) {
		
		var self = this;
		
		this.socket.on('connect', function () {
			self.socket.emit('register', {"name": user, "ship": 1});
		});
	
		this.socket.on('ID', function (id) { 
			self.id = id;
		}); 
        
		this.socket.on('update', function (data)  { 
            var decode = BISON.decode(data);
            
            self.level = decode[0].round;
            self.players = decode[0];
			self.enemies = decode[1];			
	    });
	    	
	    this.socket.on('remove', function (id)    { 
	    	delete self.players[id]; 
	    });
    },

    showStatus: function(player) {
       context.globalAlpha = 0.5;
       context.font = "10px sans-serif";
       context.strokeStyle="white";
       
       if(player.id == Game.id && player.map) {
          var enemy = {};
          var track = [];
          var colour = "red";
          
          for (var e in this.enemies){
	           enemy = this.enemies[e];
               track.push({"color":"red", "x": enemy.x, "y": enemy.y});
	       }
           
           for (var e in this.players){
               enemy = this.players[e];
               var local_player = (e == Game.id) ? true : false;
               colour = (local_player) ? "green" : "blue";
               track.push({"color":colour, "x": enemy.x, "y": enemy.y});
	       }           
           
           var trackers = track.length - 1, tracked = {}; 
           
           var px = (player.x + 10);
           var py = (player.y - 120);
          
           for(var i = trackers; i >= 0; i--) {
               tracked = track[i];
               var x = (tracked.x / 30);
               var y = (tracked.y / 20);
               
               context.save();     
	           context.setTransform(1,0,0,1,0,0); 
	           context.translate(px + x ,py + y);
	           context.strokeStyle = tracked.color;
	           context.globalAlpha = 1;
	           context.beginPath();
	           context.moveTo(-1,-1);
	           context.lineTo(1,-1);
	           context.lineTo(-1,1);
	           context.stroke();
	           context.closePath();	  
	           context.restore();               
           }
           
           track = [];
           
       } else if (player.id == Game.id && player.help) {
           context.strokeText("Arrow keys: Move", player.x, player.y-60);                        
           context.stroke();
           context.strokeText("Space bar: Shoot", player.x, player.y-50);                        
           context.stroke();
           context.strokeText("Ctrl: Shield", player.x, player.y-40);                        
           context.stroke();
           context.strokeText("t: teleport", player.x, player.y-30);                        
           context.stroke();   
           
       } else if(player.id == Game.id){
       
           var vx = parseFloat(player.vx),
               vy = parseFloat(player.vy),
               strx = vx.toFixed(10),
               stry = vx.toFixed(10);
               
           strx = strx.substring(0, strx.length-7);
           stry = stry.substring(0, stry.length-7);
           
           context.strokeText("Level: " + player.round, player.x, player.y-30);                        
           context.stroke();
           context.strokeText(player.name + " (" + player.lives + " : " + player.score + ")", player.x, player.y-40);
           context.stroke();    
           context.strokeText(strx + ":" + stry, player.x, player.y-50);
           context.stroke();           
       } else {
           context.strokeText(player.name, player.x, player.y-40);
           context.stroke();     
       }
    },
    
    renderShip: function () {
    	var player = {};
        var exhaust = ['red', 'orange', 'yellow', 'purple', 'green'];
    	var flame = [30, 31, 32, 33, 34, 35];
    	
    	var x = 10;
    	
    	if(this.id) {
    	    var thisPlayer = this.players[this.id]; 
    	    var screen = document.getElementById('wrapper');
    	    if(screen) {
    	    	if(thisPlayer) {
    	    	    window.scrollTo(thisPlayer.x-500, thisPlayer.y-500);
    	    	}
    	    }	   
		}	   
    	
        for(var p in this.players) {
        	player = this.players[p];
        	if(player.lives >= 0) {
	        	context.save();	        	
	        	this.showStatus(player);	                 	
	        	//console.log(player.score);
		        context.lineWidth = 1;
		        context.translate(player.x, player.y);
                context.rotate(player.rotation);       
		        if(player.particles.length > 0) {
		        	 
		        } else {
					//var gradient = context.createLinearGradient(0, 0, 0, 10);
					    //gradient.addColorStop(0, "orange");
					    //gradient.addColorStop(1, "yellow");
						context.globalAlpha = 1;
						context.beginPath();
					    //context.moveTo(-20, -25);
					    //context.lineTo(-10, 10);
					    //context.lineTo(-5, 0);
					    //context.lineTo(-10, -10);
					    //context.lineTo(10, 0);
					    //context.fillStyle = gradient;
					    //context.fill();
					    //context.stroke();
					    context.drawImage(this.fighter, -20, -23);
                        context.closePath();
			        
			        if (player.thruster) {
			            context.beginPath();
			           
			            context.moveTo(-17.5, -2.5);
                        context.lineTo(-flame[Math.floor(flame.length * Math.random())], 0);
                        context.lineTo(-17.5, 2); 
                        context.fillStyle = exhaust[Math.floor(exhaust.length * Math.random())];
                        context.fill();
                        context.stroke();
                        context.closePath();
			        }
		           
		            if(player.sheild) {	            	
				        context.beginPath();
		                context.globalAlpha = 0.1;
		                context.lineStyle = "black";
				        context.fillStyle = exhaust[Math.floor(exhaust.length * Math.random())];
				        context.arc(-1,-1, 35, 0, 2*Math.PI, true);    
				        context.fill();
				        context.stroke();			        
				        context.closePath();
		            }
		            
		        }	            
		        context.restore();
		    } else {
		    	context.font = "20px sans-serif";
                context.strokeStyle="white";
		    	context.strokeText("Game Over", player.x, player.y-30);                   
                context.stroke();
		    }
	    }	    
    },

    render: function() {
    	context.save();
        context.clearRect(0, 0,3000, 2000);
        
        var neb = {};
        this.renderStars();    
            
        for(var s in this.sys) {
           neb = this.sys[s];	    
           context.drawImage(neb.imageObj, neb.x, neb.y);
        }
       
        context.globalAlpha = 0.8;
        
        
        for(var e in this.enemies){
            var ball = this.enemies[e]; 
            context.beginPath();
            context.fillStyle=ball.col;
            
            if(ball.explode) {
            //	var w = this.explosion.width;
            //   var h = this.explosion.height;
              //context.arc(ball.x, ball.y, ball.radius, 0, 2*Math.PI, true);
               console.log("boom");
            }
            
            if(ball.particles.length <= 0) {
                context.drawImage(this.eimages[ball.id].obj,  ball.x-20, ball.y-19);
            }
            //context.translate( -ball.x, -ball.y );         
            //context.stroke();
            context.fill();
            context.closePath();
        }  
        
        this.renderShip();   
        this.renderMissiles();
        this.renderEnemyMissiles();
        this.renderParticles();
        this.renderEnemyParticles();
        context.restore();
    },
    
    renderMissiles: function() {
        var missile = {};
        var player  = {};
        
        for (var p in this.players) {
            player = this.players[p];
            var missileLength = player.shots.length-1;   
            
	        for (var i=missileLength; i>=0; i--){
	           missile = player.shots[i];
	           //this.missileContact(missile);
	           context.save();     
	           context.setTransform(1,0,0,1,0,0); 
	           context.translate(missile.x,missile.y);
	           context.strokeStyle = 'red';
	           context.globalAlpha = 1;
	           
	           context.beginPath();
	           context.moveTo(-1,-1);
	           context.lineTo(1,-1);
	           context.lineTo(1,1);
	           context.lineTo(-1,1);
	           context.lineTo(-1,-1);
	           context.stroke();
	           context.closePath();
	           	  
	           context.restore();      
	       }
	   }
    },

    renderEnemyMissiles: function() {
        var missile = {};
        var ball  = {};
        var exhaust = ['red', 'orange', 'yellow', 'blue', 'green'];
        
        for(var e in this.enemies){
            var ball = this.enemies[e];
           
            var missileLength = ball.shots.length-1;   
            
	        for (var i=missileLength; i>=0; i--){
	           missile = ball.shots[i];
	           context.save();     
	           context.setTransform(1,0,0,1,0,0); 
	           context.translate(missile.x,missile.y);
	           context.strokeStyle = exhaust[Math.floor(exhaust.length * Math.random())];
	           context.globalAlpha = 1;
	           context.beginPath();
	           context.moveTo(-1,-1);
	           context.lineTo(1,-1);
	           context.lineTo(1,1);
	           context.lineTo(-1,1);
	           context.lineTo(-1,-1);
	           context.stroke();
	           context.closePath();	  
	           context.restore();      
	       }
	   }
    },
    
    
    renderEnemyParticles: function() {
    	var particle={};
              var srcX = 0, srcY = 0, eX = 0, eY =0, offset=70;
        
        
        for (var p in this.enemies) {
            player = this.enemies[p];
            var particleLength = player.particles.length-1;
            //console.log(particleLength);
            for (var i=particleLength;i>=0;i--){
	            particle=player.particles[i];
	            context.save(); //save current state in stack 
	           
	            context.beginPath();
	        
                
                context.drawImage(this.explosion, srcX, srcY, 124, 124, particle.x-offset, particle.y-offset, 124, 124);
                
	            
	            context.closePath();
	            srcX += 124;
                //srcY += 124;
	            context.restore(); //pop old state on to screen
	        }
        }
        
        srcX = 0;
        srcY = 0;
    },
    
    renderParticles: function() {
        var particle={};
        var srcX = 125, srcY = 250, eX = 0, eY =0, offset=70;
        for (var p in this.players) {
            player = this.players[p];
            var particleLength = player.particles.length-1;
            for (var i=particleLength;i>=0;i--){
	            particle=player.particles[i];
	            context.save(); //save current state in stack 
	            //context.setTransform(1,0,0,1,0,0); // reset to identity
	            //context.globalAlpha = 1;
	            //translate the canvas origin to the center of the player
	            //context.translate(particle.x,particle.y);
	            //context.strokeStyle = 'red';
	        
	            context.beginPath();
	            context.drawImage(this.explosion, srcX, srcY, 124, 124, particle.x-offset, particle.y-offset, 124, 124);
	            //draw everything offset by 1/2. Zero Relative 1/2 is 15
	            //context.moveTo(0,0); 
	            //context.lineTo(1,1);
	        
	            context.stroke();
	            context.closePath();
	            srcX += 124;
                srcY += 124;
	            context.restore(); //pop old state on to screen
	        }
        }
        srcX = 0;
        srcY = 0;        
    },
    
    star: function () {
		return {
			x:      Math.random() * canvas.width,
			y:      Math.random() * canvas.height,
			radius: Math.random() * 3 
		};
	},

    sun: function () {
		return {
			x:      Math.random() * canvas.width,
			y:      Math.random() * canvas.height,
			radius: 15 
		};
	},
	
	renderStars: function () {
		
		context.save();
        context.clearRect(0, 0,canvas.width, canvas.height);
		
		var starsLength = this.stars.length-1;		
		var star = {};
		
		for(var i = starsLength; i > 0; i--) {
		    star = this.stars[i];
		    	
		    context.fillStyle = "#FFF";
		    context.beginPath();
		    context.arc(star.x, star.y, star.radius, 0, Math.PI * 2, false);
		    context.closePath();
		    context.fill();
		    context.restore();
		}
	}
};

window.onload = function() {
	user = prompt("Username");
    Game.init(user);   
}
