/* Guidelines from Raine:
- all functions as methods
- don't make children responsible for parents 

*/

/* Current focus:
- random map generation psuedo code
	-


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

	var checkNextTile = function(horz, vert) {
		if(currentLevel.map[rogue.y + vert][rogue.x + horz].impassable) {
			return 'impassable'
		}
		else if(currentLevel.map[rogue.y + vert][rogue.x + horz].monster) {
			return 'monster'
		}
	}

	var keyHandler = function(keyCode) {
			// "right = l"
			if(keyCode === 108) {
				var horz = 1
				var vert = 0
				if(checkNextTile(horz, vert) === 'impassable') {
					addMessage("You shall not pass!")
				}
				else if (checkNextTile(horz, vert) === 'monster') {
					// call a combat function
				}
				else {
					currentLevel.updateRogue(horz, vert);
				}
				
			}
			// "left = h"
			else if(keyCode === 104) {
				var horz = -1
				var vert = 0
				if(checkNextTile(horz, vert) === 'impassable') {
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
				if(checkNextTile(horz, vert) === 'impassable') {
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
				if(checkNextTile(horz, vert) === 'impassable') {
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
				if(checkNextTile(horz, vert) === 'impassable') {
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
				if(checkNextTile(horz, vert) === 'impassable') {
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
				if(checkNextTile(horz, vert) === 'impassable') {
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
				if(checkNextTile(horz, vert) === 'impassable') {
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
		// this.roomList = [];

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

		this.createRoom = function(room) {
			var offsetX = room.xCenter - Math.floor(room.width/2);
			var offsetY = room.yCenter - Math.floor(room.height/2);

			for(var i = 0; i < room.height; i++) {
				for (var j = 0; j < room.width; j++) {
					// top & bottom of room
					if(i === 0 || i === room.height - 1) {
						this.map[i + offsetY][j + offsetX] = new Wall(j + offsetX, i + offsetY);
					}
					// left & right of room
					else if(j === 0 || j === room.width - 1) {
						this.map[i + offsetY][j + offsetX] = new Wall(j + offsetX, i + offsetY);
					}
					
				}
			}
			
		}

		// Returns true/false and is used in randomRooms functions to detect if a new room will overlap an existing one.
		this.roomOverlapCheck = function(room, grid) {
			for(var y = room.upLeftCornerY; y < room.upLeftCornerY + room.height; y++) {
				for(var x = room.upLeftCornerX; x < room.upLeftCornerX + room.width; x++) {
					if(grid[y][x].class === 'wall') {
						return false
					}
				}
			}
			return true;
		}

		// checks if spaces to left/right or up/down from coordinate are empty returns, true or false
		this.checkDoorPath = function(x, y, grid) {
			// check left and right
			if (grid[y][x - 1].class === 'dot' && grid[y][x + 1].class === 'dot') {
				console.log("leftright");
				return true;
			}
			else if (grid[y - 1][x].class === 'dot' && grid[y + 1][x].class === 'dot') {
				console.log("updown");
				return true;
			}
			return false;
		}

		// Takes an array of rooms and checks if doors can be placed on each room so that there are no unreachable rooms.
		this.doorsUpdateIfPossible = function(array, grid) {
			// tempMap.randomRooms(Math.ceil(this.columns/2));
			var counter = 0;
			var wantToBreak = false;
			for(var k = 0; k < array.length; k++) {
				var offsetX = array[k].xCenter - Math.floor(array[k].width/2);
				var offsetY = array[k].yCenter - Math.floor(array[k].height/2);
				midArray: for(var y = 0; y < array[k].height; y++) {
					for (var x = 0; x < array[k].width; x++) {
						// top & bottom of room
						if(y === 0 || y === array[k].height - 1) {
							if(this.checkDoorPath(x + offsetX, y + offsetY, grid)) {
								grid[y + offsetY][x + offsetX] = new Door(x + offsetX, y + offsetY);
								counter++;
								break midArray;
							}
							
						}
						// left & right of room
						else if(x === 0 || x === array[k].width - 1) {
							if(this.checkDoorPath(x + offsetX, y + offsetY, grid)) {
								grid[y + offsetY][x + offsetX] = new Door(x + offsetX, y + offsetY);
								counter++;
								break midArray;
							}
						}
						
					}
				}
			}
			console.log(counter);
			if(counter === array.length) {
				return true;
			}
			else {
				return false;
			}

		}

		this.randomRooms = function(quantity) {
			var i = 0;
			var minRoomDimension = 4;
			var maxRoomDimension = 10;
			// create a temp map to check for overlap & door problems
			var tempMap = this.map;
			roomList = [];

			while (i < quantity) {
				var centerX = Math.floor(Math.random()*(this.columns - maxRoomDimension * 1.5) + maxRoomDimension) 
				var centerY = Math.floor(Math.random()*(this.rows - maxRoomDimension * 1.5) + maxRoomDimension)
				var width = Math.floor(Math.random() * (maxRoomDimension - minRoomDimension) + minRoomDimension)
				var height = Math.floor(Math.random() * (maxRoomDimension - minRoomDimension) + minRoomDimension)
				var tempRoom = new Room(centerX, centerY, width, height)
				// this.createRoom(tempRoom);
				// i++;
				
				if(this.roomOverlapCheck(tempRoom, tempMap)) {
					roomList.push(tempRoom);
					this.createRoom(tempRoom, tempMap);
					i++;
				}
			}

			// console.log(tempMap);
			console.log(roomList);
			console.log();
			console.log();
			console.log();
			console.log();
			
			if(this.doorsUpdateIfPossible(roomList, tempMap)) {
				for(var j = 0; j < roomList.length; j++) {
					this.createRoom(j);
				}
				this.doorsUpdateIfPossible(roomList, this.map);
			}
			else {
				return this.randomRooms;
			}

			// for(var j = 0; j < roomList.length; j++) {
			// 		this.createRoom(j);
			// }

			
			
		}

		this.createTerrain = function() {
			var minRoomDimension = 4;
			var maxRoomDimension = 8;
			// creates walls on outer edge of map
			var outerWalls = new Room(Math.floor(currentLevel.columns/2), Math.floor(currentLevel.rows/2), currentLevel.columns, currentLevel.rows)

			this.createRoom(outerWalls);

			// creates random rooms on map
			this.randomRooms(Math.ceil(this.columns/2));
			 

		}

		this.createMonsters = function(quantity) {
			var i = 0;
			while (i < quantity) {
				var randomY = Math.floor(Math.random() * currentLevel.rows)
				var randomX = Math.floor(Math.random() * currentLevel.columns)
				var randomRat = new Rat(randomX, randomY);
				if(currentLevel.map[randomY][randomX].class === 'dot') {
					// console.log('thing')
					currentLevel.map[randomY][randomX] = randomRat;
					i++;
					
				}

			}
		};

		this.placeCharacter = function() {
			this.map[rogue.y][rogue.x] = rogue;
		};

		this.updateDisplay = function(obj1, obj2) {
			$(pos(obj1.location())).text(obj1.text);
			$(pos(obj2.location())).text(obj2.text);
			$(pos(obj1.location())).removeClass();
			$(pos(obj2.location())).removeClass();
			$(pos(obj2.location())).addClass(obj2.class + " tile");
			$(pos(obj1.location())).addClass(obj1.class + " tile");

		};

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
		};


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
// random map generation code
	var Room = function(xCenter, yCenter, width, height) {
		this.xCenter = xCenter;
		this.yCenter = yCenter;
		this.width = width;
		this.height = height;	
		this.upLeftCornerX = this.xCenter - Math.floor(this.width/2);
		this.upLeftCornerY = this.yCenter - Math.floor(this.height/2)
	}

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

	var Wall = function(x, y) {
		Tile.call(this, x, y);
		this.text = "#"
		this.class = "wall"
		this.impassable = true;
	}

	Wall.prototype = new Terrain();
	Wall.prototype.constructor = Wall;

	var Door = function(x, y) {
		Tile.call(this, x, y);
		this.text = "+"
		this.class = "door";
		this.door = true;
	}

	Door.prototype = new Terrain();
	Door.prototype.constructor = Door;


// character related code
	var Character = function(x, y) {
		Tile.call(this, x, y);
		this.text = "@"
		this.class = "character"
		this.health = 100;
		this.attack = 100;
		this.defense = 100;
		this.damage = 100;	
	}

	Character.prototype = new Tile();
	Character.prototype.constructor = Character;


// monster related code
	var Monster = function() {
		this.healthBase = 100;
		this.attackBase = 100;
		this.damageBase = 100;
		this.defenseBase = 100;
		this.monster = true;
	}

	Monster.prototype.attack = function() {
		// do something
	}

	Monster.prototype = new Tile();
	Monster.prototype.constructor = Monster;

	var Rat = function(x, y) {
		Tile.call(this, x, y)
		this.class = 'rat'
		this.text = 'r'
		this.health = this.healthBase/10;
		this.attack = this.attackBase/10;
		this.defense = this.defenseBase/10;
		this.damage = this.damageBase/10;
		this.treasureQuality = 1;

	}

	Rat.prototype = new Monster();
	Rat.prototype.constructor = Rat;
		
// everything else
	// create local 'globals'
	var currentLevel = new Level(60, 40);
	var rogue = new Character(Math.floor(currentLevel.columns/2), Math.floor(currentLevel.rows/2));
	// var monsterList = []

	var initialize = function() {
		// console.log("initialize called");
		currentLevel.createMap();
		currentLevel.createTerrain();
		currentLevel.placeCharacter();
		currentLevel.createMonsters(10);
		currentLevel.drawMap();
		
	}

	return {
		initialize: initialize,
		rogue: rogue,
		currentLevel: currentLevel,	
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