var v1 = function() {};

v1.prototype = {
	diff: 0,
	round: 0,
	baddies: 5,
	enemies: {},
	players: {},
	height: 2000,
	width:  3000, 
	KEY_NAME_THRUSTER:"up",
    KEY_NAME_TELEPORT:"t",
    KEY_NAME_LEFT:"left",
    KEY_NAME_RIGHT:"right",
    KEY_NAME_SPACE:"space",
    KEY_NAME_HELP:"h", 
    KEY_NAME_MAP:"m", 
    KEY_NAME_SMART:"s",
    KEY_TYPE_UP:"keyup",
    KEY_TYPE_DOWN:"keydown",
    KEY_NAME_CTRL:"control",
    
    v1: function () {
    	for(var p in this.players) { this.updatePlayer(p); }
	    for(var e in this.enemies) { 
	    	this.calcEnemyMissileXY(e);
	    }
	
		if(this.isEmpty(this.enemies)) {
			this.baddies++;
			this.round++;
			this.diff++;
			this.bad_guys(this.baddies);
		}
	
	    this.updateEnemy();
    },
    
	calcXY: function(id) {
		var player = this.players[id];
        var now = this.unixTime();
        
        var diff = now - player.end_move;
        
	    player.rotation += player.vr * Math.PI / 180;
	    var ax = Math.cos(player.rotation) * player._thrust,
	        ay = Math.sin(player.rotation) * player._thrust,
	        left = 0, right = this.width,
	        top = 0, bottom = this.height;
	
        player.vx += ax;
        player.vy += ay;
	    
        if (player.x > right) { player.x = left; }
        else if (player.x  < left) { player.x = right; }
        player.x += player.vx;
        if (player.y > bottom) { player.y = top; }
        else if (player.y < top ) { player.y = bottom; }
        player.y += player.vy; 	
	    
	    if(this.shipContact(player)) {
           this.particles(player);
        }       
	},
	
	calcMissileXY: function (id) {
		var player = this.players[id];
        var missile = {};
	    var missileLength = player.shots.length-1;
	   
	     for (var i=missileLength; i>=0; i--){
	      missile = player.shots[i];
	    
	      if(this.shipMissileContact(player.id, missile)) {
            // player.score -= 50;
	      }
	    
	      if(this.missileContact(missile)){
            player.score += 5;
	      }
	      
	      // tally up including vx + vy to account for ship speed.
	      missile.x += (missile.dx + player.vx);
	      missile.y += (missile.dy + player.vy);
	    
	      if (missile.x > this.width) { missile.x =- missile.width; }
	      else if (missile.x<-missile.width){ missile.x = this.width; }
	      if (missile.y > this.height) { missile.y =- missile.height; }
	      else if (missile.y<-missile.height){ missile.y = this.height; }
	    
	      missile.lifeCtr++;
	      if (missile.lifeCtr > missile.life){
	         player.shots.splice(i,1);
	         missile = null;
	      }
	    }			
	},
	
	calcEnemyMissileXY: function (e) {
		var enemy = this.enemies[e];
		var missile = {};
	    var missileLength = enemy.shots.length-1;
	   
	     for (var i=missileLength; i>=0; i--){
	      missile = enemy.shots[i];
	    
	      this.enemyMissileContact(missile);
	      
	      // tally up including vx + vy to account for ship speed.
	      missile.x += (missile.dx);
	      missile.y += (missile.dy);
	      
	      if (missile.x > this.width) { missile.x =- missile.width; }
	      else if (missile.x<-missile.width){ missile.x = this.width; }
	      if (missile.y > this.height) { missile.y =- missile.height; }
	      else if (missile.y<-missile.height){ missile.y = this.height; }
	    
	      missile.lifeCtr++;
	      
	      if (missile.lifeCtr > missile.life){
	         enemy.shots.splice(i,1);
	         missile = null;
	      }
	    }			
	},
  
    updatePlayer: function(id) {
    		
		var player =  this.players[id];
		player.round = this.round;
	    
		if(player.lives >= 0) {
	        
	       if(player.score !== 0 && player.score % 5000 === 0) {
	           player.lives++;
	       }
	        
		   this.calcXY(id); 
		   this.calcMissileXY(id);
		   this.updateParticles(id);
		   
		} else {
		   player.message = true; 
		}
    },
	
	updateParticles: function(id) {
		var player = this.players[id];
        var particle={};
        var remove =false;
        var particleLength=player.particles.length-1;
        
        for (var i=particleLength;i>=0;i--){
          
	        particle = player.particles[i];
	        particle.x += particle.dx;
	        particle.y += particle.dy;
	        
	        particle.lifeCtr++;
	        
	        if (particle.lifeCtr > particle.life){
                remove=true;
	        } else if ((particle.x > this.width) || (particle.x < 0) || (particle.y > this.height) || (particle.y < 0)){
                remove=true;
	        }
	        
	        if (remove) {
                player.particles.splice(i,1);
	            particle=null;
	        }
	    }            
    },
	
	updateEnemy: function () {	
		
		
		for(var e in this.enemies) {
			var ball = this.enemies[e];
			this.checkCollision(ball, e); 
			
		    if(ball.x <= ball.radius || ball.x >= (this.width-ball.radius)){ 
		       ball.dx *= -1;                                                    
		    }
		    if(ball.y<=ball.radius || ball.y >= (this.height-ball.radius)){
		       ball.dy *= -1;
		    }
		      
		    ball.x += ball.dx;                                              
		    ball.y += ball.dy;
		
		    if(ball.particles.length > 0) {
	    	    this.updateEnemyParticles(e); 
	    	}
            		    
		    if(ball.shots.length <= this.diff) {
			    var shot = this.enemyMissile(ball);
			    ball.shots.push(shot);
			}
			
            if(ball.explode) {
               if(ball.timeout > 0) {
               	  ball.timeout--;
               } else {
                  delete this.enemies[e];
                  ball = null;
               }               
            }
		}
	},

	updateEnemyParticles: function(e) {
		var enemy = {};
        var particle={};
        var remove =false;
        
        enemy = this.enemies[e];

        var particleLength=enemy.particles.length-1;
        
        for (var i=particleLength;i>=0;i--){
          
	        particle = enemy.particles[i];
	        particle.x += particle.dx;
	        particle.y += particle.dy;
	     
	        particle.lifeCtr++;
	        
	        if (particle.lifeCtr > particle.life){
                remove=true;
	        } else if ((particle.x > this.width) || (particle.x < 0) || (particle.y > this.height) || (particle.y < 0)){
                remove=true;
	        }
	        
	        if (remove) {
                enemy.particles.splice(i,1);
	            particle=null;
	        }
	    }
	                
    },
	
	enemyMissile: function(enemy) {
		  return  {
	            dx: (Math.random() * enemy.radius + 1), 
	            dy: (Math.random() * enemy.radius + 1),
	            x: enemy.x,
	            y: enemy.y,
	            life: 100,
	            lifeCtr: 0,
	            width: 2,
	            height: 2
          };		
	},
	
	missile: function(player) {
          var angle = player.rotation += (player.vr * Math.PI / 180);
          return  {
	            dx: 5 * Math.cos(angle), 
	            dy: 5 * Math.sin(angle),
	            x: player.x,
	            y: player.y,
	            life: 60,
	            lifeCtr: 0,
	            width: 2,
	            height: 2
          };		
	},
	
	particles: function(player) {
		for (var i=0;i<25;i++){
            var particle = {
                x: player.x,
                y: player.y,  
                dx: Math.random()*3,
                dy: Math.random()*3,
                life: 25,
                lifeCtr: 0
            };
            
            if (Math.random()<0.5){
               particle.dx*=-1;
               particle.dy*=-1;
            }            
            player.particles.push(particle);
        }
        
        player.dx = 0;
        player.dy = 0;
        player.vy = 0;
        player.vx = 0;
        
        player.score -= 10;
        player.lives--;
	},
	
	ball: function() {
		var colours = ['red','green','yellow','orange','blue', 'black'];
        var rad = 10;
        return {
            radius: rad,
            x:      Math.floor(Math.random()*(this.width - rad + 1)) + rad,
            y:      Math.floor(Math.random()*(this.height - rad + 1)) + rad,
            dx:     Math.floor(Math.random() * 2) * 2 - 1,
            dy:     Math.floor(Math.random() * 2) * 2 - 1,
            col:    colours[Math.floor(Math.random() * colours.length)],
            id:     0,
            hits:   0, 
            shots: [],
            particles: []             
        };      
    },
    
    explode: function(ball) {
       var radius    = [10, 15, 20, 25, 30];
       var nova      = ['orange', 'red', 'yellow']; 
       ball.radius   = radius[Math.floor(Math.random() * radius.length)];
       ball.col      = nova[Math.floor(Math.random() * nova.length)];
       ball.timeout--;
    },

    checkCollision: function (ballA, i) {
         for (var j in this.enemies) {
            if( j != i ){
                var ballB    = this.enemies[j],
                    dx       = (ballB.x) - (ballA.x),
                    dy       = (ballB.y) - (ballA.y),
                    dist     = Math.sqrt((dx * dx) + (dy * dy)),
                    min_dist = ballA.radius + ballB.radius;
               
                if (dist < min_dist) {                               // center hit not outside edge (refine)
                    var angle = Math.atan2(dy, dx),                  // radians (where the balls hit each other)
                    tx = ballA.x + Math.cos(angle) * min_dist,       // trajectory x
                    ty = ballA.y + Math.sin(angle) * min_dist,       // trajectory y
                    ax = (tx - ballB.x) * 1.5 * 0.5,    // angle x
                    ay = (ty - ballB.y) * 1.5 * 0.5;    // angle y
                    ballA.dx -= ax;                                  // ballA direction + speed
                    ballA.dy -= ay;
                    ballB.dx += ax;                                  // ballB direction + speed
                    ballB.dy += ay;
                }
            }
         }
    },
    
    enemyMissileContact: function (missile) {
        var player = {};
        for(var p in this.players) {
           player = this.players[p];
	
            var dx       = (missile.x) - (player.x),
                dy       = (missile.y) - (player.y),
                dist     = Math.sqrt((dx * dx) + (dy * dy)),
                min_dist = 35;
            
            if(!player.sheild && dist < min_dist) {
               if(player.particles.length === 0) {
			        this.particles(player);
			        return true;     
			     }
            }    
       }       
       return false;	
    },
    
    missileContact: function(missile) {
       for(var j in this.enemies) {
           var ball     = this.enemies[j], 
                dx       = (ball.x) - (missile.x),
                dy       = (ball.y) - (missile.y),
                dist     = Math.sqrt((dx * dx) + (dy * dy)),
                min_dist = 45;
           
            
           if (!ball.explode && dist < min_dist) {       
               ball.explode = true;
               ball.timeout = 25;
               
               for (var i=0;i<25;i++){
		            var particle = {
		                x: ball.x,
		                y: ball.y,  
		                dx: Math.random()*3,
		                dy: Math.random()*3,
		                life: 25,
		                lifeCtr: 0
		            };
		            
		            if (Math.random()<0.5){
		               particle.dx*=-1;
		               particle.dy*=-1;
		            }        
		                
		            ball.particles.push(particle);
		        }
		        return true;
           }
       }  
       return false;       
    },
    
    shipContact: function(player) {
       for(var j in this.enemies) {
            var ball     = this.enemies[j], 
                dx       = (ball.x) - (player.x),
                dy       = (ball.y) - (player.y),
                dist     = Math.sqrt((dx * dx) + (dy * dy)),
                min_dist = 45;
            
            if(player.sheild) {
               min_dist = ball.radius + 20; 
               if (dist < min_dist) {
                
                var angle = Math.atan2(dy, dx),                     // radians (where the balls hit each other)
                    tx = player.x + Math.cos(angle) * min_dist,     // trajectory x
                    ty = player.y + Math.sin(angle) * min_dist,     // trajectory y
                    ax = (tx - ball.x) * 1.5 * 0.5,                 // angle x
                    ay = (ty - ball.y) * 1.5 * 0.5;                 // angle y

                    ball.dx += ax;                                  // ballB direction + speed
                    ball.dy += ay;
              }
            } else {
                if (dist < min_dist) {
                   if(!player.particles.length > 0) {
                      player.score -= 10;  
                      player.lives--;
                      return true;   
                   }
                }
            }    
       }       
       return false;	
    },
    
    shipMissileContact: function(id, missile) {
       var particle = {};    
       for(var p in this.players) {
            var player  = this.players[p], 
                dx       = (missile.x) - (player.x),
                dy       = (missile.y) - (player.y),
                dist     = Math.sqrt((dx * dx) + (dy * dy)),
                min_dist = 25;
            
            if(player.id != id) {   
               if(player.particles.length === 0) {
			        if (dist < min_dist && !player.sheild) {
                        this.particles(player);
                        return true;
			        }     
			     }
		    }
	   }
	   return false;
	},
	
	unixTime: function () {
		var foo = new Date; // Generic JS date object
	    var unixtime_ms = foo.getTime(); // Returns milliseconds since the epoch	    
	    return parseInt(unixtime_ms / 1000);
	},
	
	keyEvent: function(keyCode, type, player) {
       var keyName = String.fromCharCode(keyCode).toLowerCase();
       if (keyCode == 37) { keyName = this.KEY_NAME_LEFT; }     // Left arrow key
       if (keyCode == 39) { keyName = this.KEY_NAME_RIGHT; }    // Right arrow key
       if (keyCode == 38) { keyName = this.KEY_NAME_THRUSTER; } // Up arrow key
       if (keyCode == 32) { keyName = this.KEY_NAME_SPACE; }    // space bar
       if (keyCode == 17) { keyName = this.KEY_NAME_CTRL; }     // left control
       if (keyCode == 84) { keyName = this.KEY_NAME_TELEPORT; }     // left control    
       if (keyCode == 77) { keyName = this.KEY_NAME_MAP; }     // left control    
       this.move(type, keyName, player);       
    },
   
    move: function(keyType, keyName, id) {
    
       var shot = {};
       var player = this.players[id];
          
       // Thruster is off
       if (keyName == this.KEY_NAME_THRUSTER && keyType == this.KEY_TYPE_UP) {           
           player.thruster = false;
           player._thrust = 0;
           player.vr = 0;
       }
       // Thruster on
       else if(keyName == this.KEY_NAME_THRUSTER && keyType == this.KEY_TYPE_DOWN) {
           player.thruster = true;
	       player._thrust = 0.3;           
       }
       // Turning left
       if (keyName == this.KEY_NAME_LEFT && keyType == this.KEY_TYPE_DOWN) {
           player.vr = -7;
       }
       // Turning right
       if (keyName == this.KEY_NAME_RIGHT && keyType == this.KEY_TYPE_DOWN) {
           player.vr = 7;
       }
       // Stop turning
       if ((keyName == this.KEY_NAME_RIGHT || keyName == this.KEY_NAME_LEFT ) && keyType == this.KEY_TYPE_UP) {
           player.vr = 0;
       }  
       // v1 here to allow thrusting turning and firing
       if (keyName == this.KEY_NAME_SPACE && keyType == this.KEY_TYPE_DOWN) {
          if(!player.sheild) {
          	  if(player.shots.length <= this.diff) {
	            shot = this.missile(player);   
	            player.shots.push(shot);
	          }
	      }
       } 
       else if(keyName == this.KEY_NAME_SPACE && keyType == this.KEY_TYPE_UP) {
          
       }  
       
       if(keyName == this.KEY_NAME_CTRL && keyType == this.KEY_TYPE_DOWN) { 
          player.sheild = true;
       } 

       if(keyName == this.KEY_NAME_CTRL && keyType == this.KEY_TYPE_UP) { 
          player.sheild = false;
       }    
       
       if(keyName == this.KEY_NAME_TELEPORT  && keyType == this.KEY_TYPE_DOWN) { 
          player.x = Math.random() * this.width + 1;
          player.y = Math.random() * this.height + 1;
       } 
       
       if(keyName == this.KEY_NAME_HELP && keyType == this.KEY_TYPE_DOWN) {
           player.help = true;
       }
       
       if(keyName == this.KEY_NAME_HELP && keyType == this.KEY_TYPE_UP) {
           player.help = false;
       }
       
       if(keyName == this.KEY_NAME_MAP && keyType == this.KEY_TYPE_DOWN) {
          if(player.map === true) {
              player.map = false;
          } else {
              player.map = true;
          }
       }
    }, 
    
    boss: function() {
    	return {
    		id:   'boss',
    		x:    this.width / 2,
    		y:    this.height / 2,
    		dx:   Math.floor(Math.random() * 2) * 2 - 1,
            dy:   Math.floor(Math.random() * 2) * 2 - 1,
    		life: 500
    	}
    },
    
    bad_guys: function (num) {
    	
       for(var i=0; i < num; i++){
		   var ball = this.ball();
		   ball.id = Math.round(Math.random() * 2);
		   this.enemies[i] = ball;
		}		
	},
    
    isEmpty: function(obj) {
	    for(var prop in obj) {
	        if(obj.hasOwnProperty(prop)) {
	            return false;
	        }
	    }
	    return true;
	}
};

module.exports = new v1();
