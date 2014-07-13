/* Guidelines from Raine:
- all functions as methods
- don't make children responsible for parents 

*/

/* Current focus:
- convert all tiles to an object in currentLevel.map
	-create tile parent class, then append to map


 */


var GameSpace = (function() {
// helper funcitons
	// formats location of object to reference tile id
	var pos = function(loc) {
		return "#column-" + String(loc[0]) + "-row-" + String(loc[1]);
	};

	var addMessage = function(text) {
		$("#messages").append("<p>" + text + "</p>")
	}

	var checkPassable = function(horz, vert) {
		return currentLevel.map[rogue.y + vert][rogue.x + horz].impassable
	}

	var keyHandler = function(keyCode) {
			// "right = l"
			if(keyCode === 108) {
				var horz = 1
				var vert = 0
				if(checkPassable(horz, vert)) {
					addMessage("You shall not pass!")
				}
				else {
					currentLevel.updateRogue(horz, vert);
				}
				
			}
			// "left = h"
			else if(keyCode === 104) {
				var horz = -1
				var vert = 0
				if(checkPassable(horz, vert)) {
					addMessage("You shall not pass!")
				}
				else {
					currentLevel.updateRogue(horz, vert);
				}
			}
			// "down = j"
			else if(keyCode === 106) {
				var horz = 0
				var vert = 1
				if(checkPassable(horz, vert)) {
					addMessage("You shall not pass!")
				}
				else {
					currentLevel.updateRogue(horz, vert);
				}
			}
			// "up = k"
			else if(keyCode === 107) {
				var horz = 0
				var vert = -1
				if(checkPassable(horz, vert)) {
					addMessage("You shall not pass!")
				}
				else {
					currentLevel.updateRogue(horz, vert);
				}
			}
			// "upright = u"
			else if(keyCode === 117) {
				var horz = 1
				var vert = -1
				if(checkPassable(horz, vert)) {
					addMessage("You shall not pass!")
				}
				else {
					currentLevel.updateRogue(horz, vert);
				}
			}
			// "upleft = y"
			else if(keyCode === 121) {
				var horz = -1
				var vert = -1
				if(checkPassable(horz, vert)) {
					addMessage("You shall not pass!")
				}
				else {
					currentLevel.updateRogue(horz, vert);
				}
			}
			// "downright = n"
			else if(keyCode === 110) {
				var horz = 1
				var vert = 1
				if(checkPassable(horz, vert)) {
					addMessage("You shall not pass!")
				}
				else {
					currentLevel.updateRogue(horz, vert);
				}
			}
			// "downleft = b"
			else if(keyCode === 98) {
				var horz = -1
				var vert = 1
				if(checkPassable(horz, vert)) {
					addMessage("You shall not pass!")
				}
				else {
					currentLevel.updateRogue(horz, vert);
				}
			}
			
		}	

// level and map related code
	var Level = function(columns, rows) {
		this.rows = rows;
		this.columns = columns;
		this.map = [];

		this.tileMatrixGenerator = function() {
		// console.log(this.rows)
			for (var r = 0; r < this.rows; r++) {
				var row = [];
				for(var c = 0; c < this.columns; c++) {
					row.push(new Tile([c, r]));
				}
				this.map.push(row);
			}	
			// console.log(this.map);
		};

		this.createMap = function () {
			this.tileMatrixGenerator();
		};

		this.createTerrain = function() {
			for(var i = 0; i < this.map.length; i++) {
				for (var j = 0; j < this.map[0].length; j++) {
					if(i === 0 || i === this.rows - 1) {
						this.map[i][j] = new Wall([i, j]);
					}
					else if(j === 0 || j === this.columns - 1) {
						this.map[i][j] = new Wall(i, j);
					}
					
				}
			}
		}
// THIS IS  NOT WORKING
		this.placeMonsters = function(quantity) {
			while (i < 10) {
				var randomY = Math.floor(Math.random() * currentLevel.rows)
				var randomX = Math.floor(Math.random() * currentLevel.columns)
				var randomYeek = new Yeek();
				if(currentLevel.map[randomY][randomX].class === 'dot') {
					currentLevel.map[randomY][randomX] = randomYeek;
					i++;
					
				}

			}
		}

		this.placeCharacter = function() {
			this.map[rogue.y][rogue.x] = rogue;
		}

		this.updateDisplay = function(obj1, obj2) {
			$(pos(obj1.location())).text(obj1.text);
			$(pos(obj2.location())).text(obj2.text);
			$(pos(obj2.location())).addClass(obj2.class);
			$(pos(obj1.location())).addClass(obj1.class);
			$(pos(obj1.location())).removeClass(obj2.class);
			$(pos(obj2.location())).removeClass(obj1.class);

		}

		this.updateRogue = function(horz, vert, obj1, obj2) {
			var tempTile = new Tile(rogue.x , rogue.y); 
			console.log(tempTile.location());
			rogue.x += horz;
			rogue.y += vert;
			this.map[rogue.y][rogue.x] = rogue;
			this.map[rogue.y - vert][rogue.x - horz] = tempTile 
			console.log(rogue.location())
			// this.drawMap();
			this.updateDisplay(rogue, tempTile)
		}


		this.drawMap = function() {
			$("#game-window").empty();
			var sourceGame = $("#game-window-template").html();
			var gameTemplate = Handlebars.compile(sourceGame);
			var that = this;
			var counter = 0;


			Handlebars.registerHelper("columnCounter", function() {
				// counter++;
				return counter % that.columns;
				// console.log(that.columns);
			})

			Handlebars.registerHelper("rowCounter", function() {
				counter++;
				// console.log(that.rows);
				return Math.floor(counter/that.columns);
			})
			

			$("#game-window").append(gameTemplate(that));
		};

	};


// terrain related code
	var Tile = function(x, y) {
		this.x = x;
		this.y = y;
		this.text = "."
		this.class = "dot"
		this.impassable = false
	}

	Tile.prototype.location = function() {
		return [this.x, this.y]
	}

	var Terrain = function() {
	}

	Terrain.prototype = new Tile();
	Terrain.prototype.constructor = Terrain;

	var Wall = function(location) {
		Tile.call(this, location);
		this.text = "#"
		this.class = "wall"
		this.impassable = true;
	}

	Wall.prototype = new Terrain();
	Wall.prototype.constructor = Wall;


// character related code
	var Character = function() {
		this.text = "@"
		this.class = "character"
		this.x = Math.floor(currentLevel.columns/2);
		this.y = Math.floor(currentLevel.rows/2)
		this.health = 100;
		this.attack = 100;
		this.defense = 100;
		this.damage = 100;
		this.location = function() {
			return [this.x, this.y];
		}
		
	}

// monster related code
	var Monster = function() {
		this.healthBase = 100;
		this.attackBase = 100;
		this.damageBase = 100;
		this.defenseBase = 100;
	}

	Monster.prototype.attack = function() {
		// do something
	}

	var Yeek = function() {
		this.class = 'yeek'
		this.text = 'y'
		this.health = this.healthBase/10;
		this.attack = this.attackBase/10;
		this.defense = this.defenseBase/10;
		this.damage = this.damageBase/10;
		this.treasureQuality = 1;

	}

	Yeek.prototype = new Monster();
	Yeek.prototype.constructor = Yeek;
		
// everything else
	// create local 'globals'
	var currentLevel = new Level(60, 40);
	var rogue = new Character();
	var monsterList = []

	var initialize = function() {
		// console.log("initialize called");
		currentLevel.createMap();
		currentLevel.createTerrain();
		currentLevel.placeCharacter();
		currentLevel.placeMonsters;
		currentLevel.drawMap();
		
	}

	return {
		initialize: initialize,
		rogue: rogue,
		keyHandler: keyHandler,
	}

})();




$(document).on('ready', function() {
	GameSpace.initialize();
	// keyboard handler
	$(document).keypress(function(e) {
		// console.log(e);
		GameSpace.keyHandler(e.charCode);
	})
});