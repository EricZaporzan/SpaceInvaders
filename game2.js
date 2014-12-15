// Init --------------------------------------------------------------
	var canvas = document.getElementById("canvas");
	var context = canvas.getContext("2d");

	/*	step is a timer that moves the aliens
		maxStep is the number of steps before the aliens would move
		sizeStep is the amount of pixels they will moves  */
	var sizeStepX = 1;
	var maxStepX = 320 / sizeStepX;
	var sizeStepY = 10;
	
    /*  playerStep is the amount of pixels the player moves
        max and minPlayer are the player's left & right boundaries */
    var maxPlayer = 840;
    var minPlayer = 20;
    var playerStep = 10;
	
	// the timer interval - the number of ms between ticks
	var interval = 20;
	
    /* missile steps is the number of pixels missiles move in 1 step
       missileCoolDown is the count down of when the next missile can be shot
       missileMaxCoolDown is number of steps between shots */
    var missileStep = 16;
    var missileMaxCoolDown = 5;
    var missileCoolDown = 0;

    /* this controls the amount of ticks between missile shots. Lower values for
       maxFoeCooldown will make foes fire more frequently */
    var maxFoeCooldown = 50;
    var foeCooldown = 0;
    
    // the height of the lowest row of aliens
    var lowestRow = 350;
    
    // an array of integers that indicates the difficulty according to the level
    var levellist = [1,2,4,6,8,10,16,18,20,24,28,32];
    
    // whether the game is paused or not
    var pause = false;
    var playing = false;

    // if the player is hit by a missile, this is set to true
    var gameOver = false;

// Events----------------------------------------------------
    document.onkeydown = function(event) {
		var event = event || window.event;
		var keycode = event.charCode || event.keyCode;
		if (playing) {
			if (keycode === 37) { // left arrow key
				player.isMovingLeft = true;
			}
			if (keycode === 39) { // right arrow key
                player.isMovingRight = true;
			}
			if (keycode === 32) { // space bar
				player.isShooting = true;
			}
		}
        
		if (keycode === 27) { // esc
			if (!pause) {
				game.stopTimer();
				pause = true;
			} else {
				game.startTimer();
				pause = false;
			}
		}
    }
    
    document.onkeyup = function(event) {
		var event = event || window.event;
		var keycode = event.charCode || event.keyCode;
		if (playing) {
			if (keycode === 37) { // left arrow key
				player.isMovingLeft = false;
			}
			if (keycode === 39) { // right arrow key
                player.isMovingRight = false;
			}
			if (keycode === 32) { // space bar
				player.isShooting = false;
			}
		}
    }
    
// missiles ----------------------------------------------------------
    var missiles = new Array();

    // move each missile up by missileStep pixels
    missiles.move = function() {
        for (var i=0; i<missiles.length; i++) {
            if(missiles[i].dir == 0) {
                missiles[i].y -= missileStep;
            }
            if(missiles[i].dir == 1) {
                missiles[i].y += missileStep;
            }
        }
    }
    
    // add a missile to the array on firing
    missiles.add = function(x, y, dir, enemy) {
        missiles.push(new Missile(x, y, dir, enemy));
    }
    
    // loading in the missile image
    var missile = new Image();
    missile.onload = function () {
        console.log("loaded img");
    }
    missile.src = "img/missile.png";
    
    // drawing the missile
    missiles.draw = function() {
        for (var i=0; i<missiles.length; i++) {
        	if (missiles[i].hit === false) {
 	           context.drawImage(missile, missiles[i].x, missiles[i].y, 2, 10);
 	    	}
        }
    }

// foes --------------------------------------------------------------
	var foes = new Array();

	// populate the foes array
	foes.populate = function () {
		for (var i=0; i<50; i++) {
			foes[i] = new Alien();
			foes[i].x = i%10 * 70 + 40;
			foes[i].y = Math.floor(i/10) * 70 + 30;
			foes[i].type = 5 - Math.floor(i/10);
			foes[i].value = (5 - Math.floor(i/10)) * game.level;
		}
	}

	// move all the aliens
	foes.move = function () {
		// increment steps
		game.stepX ++;
		game.stepY ++;
		var goDown = false;

		// check if stepX need to be reset
		// if so, move foes downward
		if (game.stepX >= maxStepX) {
			game.stepX = 0;
			goDown = true;
		}

		var maxLiving = -1;	// detect the lowest row of living alien
		for (var i=0; i<foes.length; i++) {
			if (game.stepX < (maxStepX/2)) {
				foes[i].x += sizeStepX;
			} else {
				foes[i].x -= sizeStepX;
			}
			
			// check if the alien should move downwards
			if (goDown) {
				foes[i].y += sizeStepY;
			}
			
			// check if this alien is alive
			if(foes[i].living) {
				maxLiving = i;
			}
		}
		
		// update lowestRow
		if (goDown) {
				lowestRow = foes[maxLiving].y + 40;
		}
		
		// check if any alien is alive
		if (maxLiving === -1) {
			game.nextLevel();
		}
	}
    
    // randomly selects an enemy every 50 ticks. That enemy shoots if it is alive
    foes.shoot = function() {
        if(foeCooldown == 0) {
            // randomly select a shooter
            var shooter = Math.floor(Math.random(0, 1) * foes.length);
            if(foes[shooter].living) {
                missiles.add(foes[shooter].x + 20, foes[shooter].y + 30, 1, true); 
            }
            foeCooldown = maxFoeCooldown;
        }
    }

// list --------------------------------------------------------------
	/*	list: 2D array storing value and img for all actors:
		list[x][0]   = actor.value	list[0] = player
		list[x][1-?] = actor.img	list[1-?] = alien
		list[list.length - 1][x] = death.img
		Naming convention: i_j.png (i=id; j=frame) 	*/
	var list = new Array();
	var imgLoaded = new Array();
	var numOfAliens = 6;
	var numOfFrames = 1;
	
	// setup the list array
	for (var i=0; i<numOfAliens; i++) {
		list[i] = new Array();
		// set value
		list[i][0] = i * 10;
		// set img
		for (var j=1; j<=numOfFrames; j++) {
			if (i == 0) {
				// player
				list[i][j] = new Image();
				list[i][j].onload = function () {
					console.log("loaded img");
				}
				list[i][j].src = "img/player" + j + ".png";
			} else {
				// alien
				list[i][j] = new Image();
				list[i][j].onload = function () {
					console.log("loaded img");
				}
				list[i][j].src = "img/" + i + "_" + j + ".png";
			}
		}

	}
	
	// insert the death screen image (used by all actors) into list
	var deathimg = new Image();
    deathimg.onload = function () {
        console.log("loaded death img");
    }
    deathimg.src = "img/dead.png";
	list.push(new Array());
	list[list.length-1].push(deathimg);
	
// Actor: Super class for Player and Alien ---------------------------
	function Actor() {
	}
	Actor.prototype.living = true;
	Actor.prototype.x = 0;
	Actor.prototype.y = 0;
	Actor.prototype.type = -1; // the type of actor, i.e., i in list[i]
	Actor.prototype.frame = 1; // for animation

	// draw the actor onto the canvas
	Actor.prototype.draw = function () {
		context.drawImage(list[this.type][this.frame], this.x, this.y, 40, 40);
	}
	
	// kill the actor
	Actor.prototype.die = function () {
		this.type = list.length - 1;
		this.frame = 0;
		this.living = false;
	}
	
// Player ------------------------------------------------------------
	function Player() {
		Actor.call();
		this.type = 0;
        this.isMovingLeft = false;
        this.isMovingRight = false;
        this.isShooting = false;
        
        // moves the player to the right by playerStep. 
        this.moveRight = function () {
            // check if the player is within the boundaries
            if (this.x <= maxPlayer && this.isMovingRight) {
                this.x += playerStep;
            }
        }
        // moves the player to the left by playerStep.
        this.moveLeft = function () {
            if (this.x >= minPlayer && this.isMovingLeft) {
                this.x -= playerStep;
            }
        }
        
        // fires a missile - delay should be built in to prevent spam
        this.shoot = function () {
            if (this.living && missileCoolDown === 0 && this.isShooting) {
    	        missiles.add(this.x + 20, this.y - 10, 0, false); 
    	        missileCoolDown = missileMaxCoolDown;
    	    }
        }
    }
	Player.prototype = new Actor();
	Player.prototype.constructor = Player;

	// set the player's initial position
	var player = new Player();
	player.x = canvas.width / 2 - 20;
	player.y = canvas.height - 45;

// Alien -------------------------------------------------------------
	function Alien() {
		Actor.call();
	}
	Alien.prototype = new Actor();
	Alien.prototype.constructor = Alien;
	
	Alien.prototype.value = 0;

// Missile -----------------------------------------------------------
    function Missile(x, y, dir, enemy) {
        this.x = x;
        this.y = y;
        this.dir = dir; // 0 for shooting up, 1 for down
        this.hit = false; // if the missile has hit something
        this.enemy = enemy; /* if the missile was shot by an enemy
                               will prevent aliens dying to friendly fire */
    }  

// Game object -------------------------------------------------------
	function Game() {
		this.level = sizeStepX;
		this.score = 0;
		this.stepX = 0;
		this.stepY = 0;
		
		// Timer for the game
		// Note: startTimer and stopTimer must be wrapped within a f'n
		//       or they will be called when declared
		this.timer;
		this.tick = function () {
            
            // make the player move or shoot when the corresponding key is pressed
            player.moveLeft();
            player.moveRight();
            player.shoot();
            
			// move aliens and run their shooting function
			foes.move();
            foes.shoot();
            
            // move the missiles up or down according to their dir variable
            missiles.move();
            
            // check if a missile hit an alien or player
            checkMissileHit();
            
            // update score
            updateScore();
            
            // check if player should die
            if (lowestRow >= player.y || gameOver) {
            	player.die();
            	game.stopTimer();
            	document.getElementById("container").innerHTML = 
            	"<p style='color: red; font-size: 120px; font-weight:700;'>" + 
            	"GAME OVER</p><br>" + 
            	"<p onclick='location.reload()';>Click here to replay</p>";
            }
            
            // decrement the cooldown timer for missiles
            if (missileCoolDown > 0) {
            	missileCoolDown--;
            }
            if (foeCooldown > 0) {
                foeCooldown--;
            }
            
			// redraw all objects
			draw();
		}
		
		// start the timer of the game
		this.startTimer = function () {
			this.timer = setInterval(this.tick, interval);
			playing = true;
			console.log("called: startimer");
		}
		
		// stop the timer of the game
		this.stopTimer = function () {
			clearInterval(this.timer);
			playing = false;
			console.log("called: stoptimer");
		}
		
		// pause the timer of the game
		var self = this;
		this.pauseTimer = function () {
			this.stopTimer();
			var temp = setInterval(function () {
				clearInterval(temp)
				console.log("called: pausetimer");
				self.startTimer();
			}, 1000);
		}
		
		// Level control
		this.nextLevel = function () {
			this.level++;
			this.stopTimer();
			this.startGame();
		}
		
		// (re)Start the game
		this.startGame = function () {
			// get and display the correct level
			document.getElementById("level").innerHTML = "level: " + game.level;
			
			// control the difficulty of the game through level
			if (level >= levellist.length-1) {
				sizeStepX = levellist.length-1;
			} else {
				sizeStepX = levellist[this.level-1];
			}
			
			// reset the values
			maxStepX = 320 / sizeStepX;
			this.stepX = 0;
			this.stepY = 0;
            
            player.isMovingLeft = false;
            player.isMovingRight = false;
            player.isShooting = false;
            
			while (missiles.length > 0) {
				missiles.pop();
			}
			foes.populate();
			
			// draw all objects
			draw();
			
			// start the game with a 1 second pause at the beginning
			game.pauseTimer();
		}
		
		
	}
	var game = new Game();
	
	// update the score
	function updateScore () {
		document.getElementById("score").innerHTML = "score: " + game.score;
	}

	// detect if a missile hit an alien
	function checkMissileHit() {
		// Check if the missile hit an alien
		for (var i = 0; i<missiles.length; i++) {
			var m = missiles[i];
			
			for (var j=0; j<foes.length; j++) {
				var f = foes[j];
				
				if (f.living === true && 
					m.hit === false &&
                    m.enemy === false && (
					(m.x >= f.x && m.y >= f.y &&
					m.x <= f.x+40 && m.y >= f.y &&
					m.x >= f.x && m.y <= f.y+40 &&
					m.x <= f.x+40 && m.y <= f.y+40) ||
					(m.x >= f.x && m.y+10 >= f.y &&
					m.x <= f.x+40 && m.y+10 >= f.y &&
					m.x >= f.x && m.y+10 <= f.y+40 &&
					m.x <= f.x+40 && m.y+10 <= f.y+40))) {
					
					m.hit = true;
					f.die();
					game.score += f.value;
					break;
				}
			}
            if  (m.enemy === true &&
                (m.x >= player.x && m.y >= player.y &&
                m.x <= player.x+40 && m.y >= player.y &&
                m.x >= player.x && m.y <= player.y+40 &&
                m.x <= player.x+40 && m.y <= player.y+40) ||
                (m.x >= player.x && m.y+10 >= player.y &&
                m.x <= player.x+40 && m.y+10 >= player.y &&
                m.x >= player.x && m.y+10 <= player.y+40 &&
                m.x <= player.x+40 && m.y+10 <= player.y+40)) {
                
                m.hit = true;
                gameOver = true;
                break;
            }
		}
	}
	
// Functions ----------------------------------------------------------
	// redraw the whole canvas
	function draw () {
		// clear the canvas - once only!
		context.clearRect(0, 0, canvas.width, canvas.height);

		// redraw actors
		for (var i=0; i<foes.length; i++) {
			foes[i].draw();
		}
		missiles.draw();
		player.draw();
	}

// Start the game loop when the page is loaded -----------------------
	window.onload = function () {
		game.startGame();
	}