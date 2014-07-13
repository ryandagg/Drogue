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

	var checkPassable = function(horz, vert) {
		return currentLevel.map[rogue.y + vert][rogue.x + horz].impassable
	}

	var keyHandler = function(keyCode) {
			// "right = l"
			if(keyCode === 108) {
				var horz = 1
				var vert = 0
				console.log(currentLevel.map[rogue.y][rogue.x + 1].impassable);
				if(checkPassable(horz, vert)) {
					$("#messages").text("You shall not pass!")
				}
				else {
					currentLevel.updateRogue(horz, vert);
				}
				
			}
			// "left = h"
			else if(keyCode === 104) {
				var horz = -1
				var vert = 0
				console.log(currentLevel.map[rogue.y][rogue.x - 1].impassable);
				if(checkPassable(horz, vert)) {
					$("#messages").text("You shall not pass!")
				}
				else {
					currentLevel.updateRogue(horz, vert);
				}
			}
			// "down = j"
			else if(keyCode === 106) {
				var horz = 0
				var vert = 1
				console.log(currentLevel.map[rogue.y][rogue.x - 1].impassable);
				if(checkPassable(horz, vert)) {
					$("#messages").text("You shall not pass!")
				}
				else {
					currentLevel.updateRogue(horz, vert);
				}
			}
			// "up = k"
			else if(keyCode === 107) {
				var horz = 0
				var vert = -1
				console.log(currentLevel.map[rogue.y][rogue.x - 1].impassable);
				if(checkPassable(horz, vert)) {
					$("#messages").text("You shall not pass!")
				}
				else {
					currentLevel.updateRogue(horz, vert);
				}
			}
			// "upright = u"
			else if(keyCode === 117) {
				var horz = 1
				var vert = -1
				console.log(currentLevel.map[rogue.y][rogue.x - 1].impassable);
				if(checkPassable(horz, vert)) {
					$("#messages").text("You shall not pass!")
				}
				else {
					currentLevel.updateRogue(horz, vert);
				}
			}
			// "upleft = y"
			else if(keyCode === 121) {
				var horz = -1
				var vert = -1
				console.log(currentLevel.map[rogue.y][rogue.x - 1].impassable);
				if(checkPassable(horz, vert)) {
					$("#messages").text("You shall not pass!")
				}
				else {
					currentLevel.updateRogue(horz, vert);
				}
			}
			// "downright = n"
			else if(keyCode === 110) {
				var horz = 1
				var vert = 1
				console.log(currentLevel.map[rogue.y][rogue.x - 1].impassable);
				if(checkPassable(horz, vert)) {
					$("#messages").text("You shall not pass!")
				}
				else {
					currentLevel.updateRogue(horz, vert);
				}
			}
			// "downleft = b"
			else if(keyCode === 98) {
				var horz = -1
				var vert = 1
				console.log(currentLevel.map[rogue.y][rogue.x - 1].impassable);
				if(checkPassable(horz, vert)) {
					$("#messages").text("You shall not pass!")
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

		// a potentialy different way to build the map
		// for(var i = 0; i < this.rows * this.columns; i++) {
		// 	this.map.push(new Tile([i % this.columns, Math.floor(i/this.columns)]));
		// }

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

		this.placeCharacter = function() {
			this.map[rogue.y][rogue.x] = rogue;
		}

		this.updateRogue = function(horz, vert) {
			rogue.x += horz;
			rogue.y += vert;
			this.map[rogue.y][rogue.x] = rogue;
			this.map[rogue.y - vert][rogue.x - horz] = new Tile(rogue.x - horz, rogue.y - vert)
			
			this.drawMap();
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

	var currentLevel = new Level(60, 40);

// terrain related code
	var Tile = function(x, y) {
		this.x = x;
		this.y = y;
		this.location = [this.x, this.y];
		this.text = "."
		this.class = "dot"
		this.impassable = false
	}

	var Terrain = function() {
		// this.class = " impassable";
		// this.location = location;
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
		this.x = Math.floor(currentLevel.columns/2);
		this.y = Math.floor(currentLevel.rows/2)
		// this.x = 58;
		// this.y = 1;
		this.location = [this.x, this.y]
		this.text = "@"
		this.class = "character"


		// this.updateCharacterLocation = function() {
		// 	$("#character").remove();
		// 	$("#column-" + String(this.location[0]) + "-row-" + String(this.location[1])).append("<div id='character'>@</div>");
		// }
		// this.moveCharacter = function(keyCode) {
		// 	// var moveDict = {right: []}
		// 	// "right"
		// 	if(keyCode === 108) {
		// 		this.location[0]++;

		// 	}
		// 	// "left"
		// 	else if(keyCode === 104) {
		// 		this.location[0]--;
		// 	}
		// 	// "down"
		// 	else if(keyCode === 106) {
		// 		this.location[1]++;
		// 	}
		// 	// "up"
		// 	else if(keyCode === 107) {
		// 		this.location[1]--;
		// 	}
		// 	// "upright"
		// 	else if(keyCode === 117) {
		// 		this.location[1]--;
		// 		this.location[0]++;
		// 	}
		// 	// "upleft"
		// 	else if(keyCode === 121) {
		// 		this.location[1]--;
		// 		this.location[0]--;
		// 	}
		// 	// "downright"
		// 	else if(keyCode === 110) {
		// 		this.location[1]++;
		// 		this.location[0]++;
		// 	}
		// 	// "downleft"
		// 	else if(keyCode === 98) {
		// 		this.location[1]++;
		// 		this.location[0]--;
		// 	}
			
		// 	this.updateCharacterLocation();
		// }	
	}


	

// everything else
	// create local 'globals'
	var rogue = new Character();
	var currentLevel = new Level(60, 40);

	var initialize = function() {
		// console.log("initialize called");
		// rogue.placeCharacter();
		// populateWalls();
		currentLevel.createMap();
		currentLevel.createTerrain();
		currentLevel.placeCharacter();
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