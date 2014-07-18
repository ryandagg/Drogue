/* Guidelines from Raine:
-all functions as methods
-don't make children responsible for parents 
-if a funciton is passed a single type of object it should probably be made a method under the class of that object type

*/

/* Current focus:
- random map generation psuedo code
	-current problems: 
		-nested rooms where inner room fills one dimension of external and inner door is facing space that does not contain outer door.
		-spaces that are note walls that are completely surrounded by rooms
		-nested rooms can share the same door



 */

/* copy-bin:
else if(checkNextTile(horz, vert) === 'door'){
	currentLevel.updateActor(horz, vert);
	addMessage("You kick down the door. A loud noise reverberates throughout the dungeon.")
}

*/


var GameSpace = (function() {
// helper funcitons
	// constant variables
	var MAP_COLUMNS = 60;
	var MAP_ROWS = 40;
	var ROOMS_QUANTITY = 52;
	var ROOM_MIN_DIMENSION = 4;
	var ROOM_MAX_DIMENSION = 8;

	// formats location of object to reference tile id
	var pos = function(loc) {
		return "#" + String(loc[0]) + "-" + String(loc[1]);
	};

	// does the oposite of pos(). Looks for a number in a string, then checks if there is one immedidately proceeding. Repeats.
	var reversePos = function(str) {
		var x = str[0]
		var y = ''
		if(!isNaN(str[1])) {
			x += str[1];
		}

		if(!isNaN(str[str.length - 2])) {
			y += str[str.length - 2];
			y += str[str.length - 1];
		}
		else {
			y += str[str.length - 1];
		}

		return [Number(x), Number(y)];
	}

	var clone = function clone(iterable) {
		var newObj = (iterable instanceof Array) ? [] : {};
			for (i in iterable) {
				if(i == 'clone') continue;
				if(iterable[i] && typeof iterable[i] == "object") {
				  newObj[i] = clone(iterable[i]);
				} 
				else {
					newObj[i] = iterable[i]
				}
			} 
		return newObj;
	};

	var clickText = function(id) {
		var loc = reversePos(id);
		// console.log("loc: ", loc);
		var obj = currentLevel.map[loc[1]][loc[0]];
		$("#" + id).parent().append(
			"<div class='text-popup'>" + obj.inspectText + "</br>" +
				"<span class='close-popup'>close</span>" + 
			"</div>");
	}

	var addMessage = function(text) {
		$("#messages").prepend("<p class='a-message'>" + text + "</p>")
	}

	var turnHandler = function () {
		totalTurns++;
		addMessage("----------- Turn " + totalTurns + " -----------");
		for(var i = 0; i < monstersActive.length; i++) {
			monsterTurn(monstersActive[i]);
		}
		// console.log(totalTurns);

		// character regen
		rogue.regen();
		$("#hp").text("HP: " + Math.floor(rogue.health));
		rogue.drawInventory();
	}

	// todo 
	var monsterTurn = function(monster) {
		var tempMatrix = currentLevel.createPFMatrix(currentLevel.map);
		// console.log(tempMatrix);
		tempMatrix[monster.y][monster.x] = 0;
		var grid = new PF.Grid(currentLevel.columns, currentLevel.rows, tempMatrix);
		// var testPath = pathFinder.findPath(0, 0, 0, 1, grid);
		// console.log(testPath);

		var path = pathFinder.findPath(monster.x, monster.y, rogue.x, rogue.y, grid);
		// console.log("path:", path);
		// 
		if(path.length > 0 && path.length < 11) {
			var horz = path[1][0] - monster.x;
			var vert = path[1][1] - monster.y;
			// console.log("monster:", monster.x, monster.y);
			// console.log("horz: " + horz, "vert: " + vert);

			// check for combat & initiate
			if(path.length === 2) {
				monster.combatHandler(rogue);
			}
			// check if next square is a monster & wait
			else if(currentLevel.map[path[1][1]][path[1][0]].monster) {
				// do nothing on purpose
			}
			else {
				currentLevel.updateActor(horz, vert, monster);
			}

		}
		monster.regen();
	}

	var createNewLevel = function(direction) {
		// create new level object
		currentLevel = new Level(MAP_COLUMNS, MAP_ROWS, currentLevel.depth + direction);

		// player goes down
		if(direction > 0) {
			currentLevel.initializeMap('up');
		}
		// player goes up
		else if(direction < 0) {
			currentLevel.initializeMap('down');
		}
		resizeTiles();
		resizeText();

	}

// level and map related code
	var Level = function(columns, rows, depth) {
		this.rows = rows;
		this.columns = columns;
		this.depth = depth;
		this.map = [];

		// used to keep track of rooms for each level so they can be used in various ways
		this.roomList = null;

		this.createMap = function () {
			// console.log(this.rows)
			for (var r = 0; r < this.rows; r++) {
				var row = [];
				for(var c = 0; c < this.columns; c++) {
					row.push(new Tile(c, r));
				}
				this.map.push(row);
			}	
			// console.log(this.map);
		};

		this.eachTileInRoom = function(room, func) {
			for(var y = room.upLeftCornerY + 1; y < room.height + room.upLeftCornerY -1; y++) {
				for(var x = room.upLeftCornerX + 1; x < room.width + room.upLeftCornerX -1; x++) {
					func(x, y);
				}
			}
		}

		this.createRoom = function(room, grid) {
			// can delte the 2 lines below and just use UpLeftCornerX & Y.
			var offsetX = room.xCenter - Math.floor(room.width/2);
			var offsetY = room.yCenter - Math.floor(room.height/2);

			for(var i = 0; i < room.height; i++) {
				for (var j = 0; j < room.width; j++) {
					// top & bottom of room
					if(i === 0 || i === room.height - 1) {
						grid[i + offsetY][j + offsetX] = new Wall(j + offsetX, i + offsetY);
					}
					// left & right of room
					else if(j === 0 || j === room.width - 1) {
						grid[i + offsetY][j + offsetX] = new Wall(j + offsetX, i + offsetY);
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

		// checks if spaces to left/right or up/down from coordinate are empty returns, true or false. THIS IS CURRENTLY NOT WORKING properly: rooms are being generated without doors.
		this.checkDoorPath = function(x, y, grid) {
			// check left and right
			if(grid[y][x - 1].class === 'dot' && grid[y][x + 1].class === 'dot') {
				// console.log("leftright");
				return true;
			}
			else if(grid[y - 1][x].class === 'dot' && grid[y + 1][x].class === 'dot') {
				// console.log("updown");
				return true;
			}
			return false;
		}

		// Takes an array of rooms and checks if doors can be placed on each room so that there are no unreachable rooms.
		this.doorsUpdateIfPossible = function(array, grid) {
			var counter = 0;
			for(var k = 0; k < array.length; k++) {
				var offsetX = array[k].xCenter - Math.floor(array[k].width/2);
				var offsetY = array[k].yCenter - Math.floor(array[k].height/2);
				MIDARRAY: for(var y = 0; y < array[k].height; y++) {
					for (var x = 0; x < array[k].width; x++) {
						// top & bottom of room
						if(y === 0 || y === array[k].height - 1) {
							if(this.checkDoorPath(x + offsetX, y + offsetY, grid)) {
								grid[y + offsetY][x + offsetX] = new Door(x + offsetX, y + offsetY);
								array[k].doorLocationX = x + offsetX;
								array[k].doorLocationY = y + offsetY;
								counter++;
								break MIDARRAY;
							}
							
						}
						// left & right of room
						else if(x === 0 || x === array[k].width - 1) {
							if(this.checkDoorPath(x + offsetX, y + offsetY, grid)) {
								grid[y + offsetY][x + offsetX] = new Door(x + offsetX, y + offsetY);
								array[k].doorLocationX = x + offsetX;
								array[k].doorLocationY = y + offsetY;
								counter++;
								break MIDARRAY;
							}
						}
						
					}
				}
			}
			// console.log(counter);
			if(counter === array.length) {
				return true;
			}
			else {
				return false;
			}

		}

		// used to darken rooms upon level creations & lighten them upon character entering, also sets monsters in room to attack. True lightens, false darkens.
		this.popRoom = function(trueFalse, room) {
			// console.log(trueFalse, 'wtf');
			// console.log(room.upLeftCornerY);
			this.eachTileInRoom(room, function(x, y) {
				// console.log(arguments);
				if(trueFalse) {
					// console.log(pos([x, y]));
					$(pos([x, y])).removeClass("hidden");
				}
				else {
					// console.log('something');
					$(pos([x, y])).addClass("hidden");
				}
			})
		}

		// Iterates through an array of room objects and finds a door or rogue with matching location. Calls popRoom to light room after door open. Location taken from keyhandler.
		this.findRoomLightRoom = function(x, y, array) {
			var poppedIndex;
			var poppedRoom;
			var that = this;
			for(var i = 0; i < array.length; i++) {
				if(array[i].doorLocationX === x && array[i].doorLocationY === y) {
				 	this.popRoom(true, array[i]);
				 	poppedIndex = i;
				 	poppedRoom = array[i];
				}
			}
			
			// checks for nested rooms and darkens them again.
			for(var j = 0; j < array.length; j++) {
				if(poppedIndex !== j) {
					this.eachTileInRoom(poppedRoom, function(x, y) {
						// console.log("x: " + x);
						// console.log("y: " + y);
						if(array[j].upLeftCornerX === x && array[j].upLeftCornerY === y) {
							// console.log(array[j]);
							// console.log("x: " + x);
							// console.log("y: " + y);
							that.popRoom(false, array[j]);
						}
					})
				}
			}
		}

		// hides unopened rooms
		this.darkenRooms = function(array) {
			// console.log(array);
			for(var i = 0; i < array.length; i++) {
				// console.log(array[i]);
				this.popRoom(false, array[i]);
			}
		}

		this.lightRoomRogueIn = function(array) {
			var that = this;
			// console.log(array);
			for(var i = 0; i < array.length; i++) {
				this.eachTileInRoom(array[i], function(x, y) {
					if(rogue.x === x && rogue.y === y) {
						that.popRoom(true, array[i]);
					}
				})
			}
		}

		// used to check for & break infinite loops caused by randomRooms
		this.randomRoomsCountRecursion = 0;
		this.randomRooms = function(quantity) {
			// this.randomRoomsCountRecursion++;
			// if(this.randomRoomsCountRecursion > 10000000) {
			// 	alert("randomRoomsRecursion maxed out");
			// 	// break;
			// }
			// create a temp map to check for overlap & door problems
			var tempMap = this.map.map(clone);
			var tempRoomList = [];

			var randomRoomsCountWhile = 0;
			var i = 0;
			while (i < quantity) {
				randomRoomsCountWhile++;
				if(randomRoomsCountWhile > 100000) {
					console.log("randomRoomsWhile maxed out");
					return this.randomRooms(quantity);
				}
				var centerX = Math.floor(Math.random()*(this.columns - ROOM_MAX_DIMENSION) + ROOM_MAX_DIMENSION/2) 
				var centerY = Math.floor(Math.random()*(this.rows - ROOM_MAX_DIMENSION) + ROOM_MAX_DIMENSION/2)
				var width = Math.floor(Math.random() * (ROOM_MAX_DIMENSION - ROOM_MIN_DIMENSION) + ROOM_MIN_DIMENSION)
				var height = Math.floor(Math.random() * (ROOM_MAX_DIMENSION - ROOM_MIN_DIMENSION) + ROOM_MIN_DIMENSION)

				var tempRoom = new Room(centerX, centerY, width, height)
				// this.createRoom(tempRoom);
				// i++;
				
				// this appears to be effecting this.map. I have no idea how it would be effecting tempRoom since it's a local variable.
				if(this.roomOverlapCheck(tempRoom, tempMap)) {
					tempRoomList.push(tempRoom);
					this.createRoom(tempRoom, tempMap);
					i++;
				}
			}
			console.log(randomRoomsCountWhile);
			// console.log("tempMap: ", tempMap);
			// console.log(tempRoomList);
			

			if(this.doorsUpdateIfPossible(tempRoomList, tempMap)) {
				for(var j = 0; j < tempRoomList.length; j++) {
					// console.log(tempRoomList[j]);
					this.createRoom(tempRoomList[j], this.map);
				}
				this.doorsUpdateIfPossible(tempRoomList, this.map);
			}
			else {
				return this.randomRooms(quantity);
			}

			this.roomList = clone(tempRoomList);
		}

		this.createTerrain = function() {
			// creates walls on outer edge of map
			var outerWalls = new Room(Math.floor(this.columns/2), Math.floor(this.rows/2), this.columns, this.rows);

			this.createRoom(outerWalls, this.map);

			// Creates random rooms on map. DOES NOT SCALE WITH SIZE OF LEVEL leads to infinite loops on smaller levels.
			this.randomRooms(ROOMS_QUANTITY);
			// console.log(Math.sqrt(this.columns*this.rows)/1.5);	
		};

		// THIS DOES NOTHING will eventually be called by createMonsters
		this.selectRandomMonster = function() {
			// do something;
		};

		// this populates monsters on map. Currently only populates rats. Needs to work for other monsters and only populate in rooms.

		this.createMonsters = function(quantity) {
			var i = 0;
			while (i < quantity) {
				var randomY = Math.floor(Math.random() * this.rows)
				var randomX = Math.floor(Math.random() * this.columns)
				if(this.depth === 0) {
					var randomMonster = new Rat(randomX, randomY);
				}
				else if(this.depth === 1) {
					var randomMonster = new Kobold(randomX, randomY);
				}
				else if(this.depth === 2) {
					var randomMonster = new Goblin(randomX, randomY);
				}
				if(this.map[randomY][randomX].class === 'dot') {
					this.map[randomY][randomX] = randomMonster;
					monstersActive.push(randomMonster);
					i++;
				}
			}
			// console.log(monstersActive);
		};

		this.placeStairsCount = 0;
		this.placeStairs = function(upDown) {

			var i = 0;
			while (i < 1) {
				this.placeStairsCount++;
				if(this.placeStairsCount > 1000) {
					console.log("placeStairs break");
					break;
				}
				var randomY = Math.floor(Math.random() * this.rows)
				var randomX = Math.floor(Math.random() * this.columns)
				var randomDownStairs = new DownStairs(randomX, randomY);
				var randomUpStairs = new UpStairs(randomX, randomY);
				if(this.map[randomY][randomX].class === 'dot') {
					if(upDown === 'down') {
						this.map[randomY][randomX] = randomDownStairs;
						i++;
					}
					else if(upDown === 'up') {
						this.map[randomY][randomX] = randomUpStairs;
						i++;
					}
				}
			}

			// the returned location is used in the newLevel function to place the rogue
			return [randomX, randomY];

		}

		// called on initial level creation and when moving down stairs
		this.placeCharacterStairs = function(upDown) {
			var loc = this.placeStairs(upDown);
			rogue.x = loc[0];
			rogue.y = loc[1];
			this.map[rogue.y][rogue.x] = rogue;

			if(this.depth > 0) {
				if(upDown === 'down') {
					rogue.standingOn = new DownStairs(rogue.x, rogue.y);
				}
				else if(upDown === 'up') {
					rogue.standingOn = new UpStairs(rogue.x, rogue.y);
				}
			}
			else {
				rogue.standingOn = new Tile(rogue.x, rogue.y);
			}
		};

		// Currently works on doors and dots. Could potentially handle items and stairs with conditional statements.
		this.updateDisplay = function(obj1, obj2) {
			// console.log("updateDisplay obj2", obj2);
			$(pos(obj1.location())).text(obj1.text);
			$(pos(obj1.location())).removeClass();
			$(pos(obj1.location())).addClass(obj1.class + " tile");
			// console.log("arguments length: ", arguments.length);
			if(arguments.length === 2) {
				// console.log("arguments if triggered");
				$(pos(obj2.location())).removeClass();
				$(pos(obj2.location())).addClass(obj2.class + " tile");
				$(pos(obj2.location())).text(obj2.text);
			}
		};

		// replaces object in map with an empty tile
		this.emptyTile = function(x, y) {
			this.map[y][x] = new Tile(x, y);
			this.updateDisplay(this.map[y][x]);
		}
		
		// moves characters & monsters around map & calls updateDisplay
		this.updateActor = function(horz, vert, actor) {

			
			var tempTile = actor.standingOn;
			// console.log(actor.standingOn);

			// change the location of the actor without moving in map
			actor.x += horz;
			actor.y += vert;

			// move the actor in map. Needed in both updates what the actor is standing on
			actor.standingOn = this.map[actor.y][actor.x];

			this.map[actor.y][actor.x] = actor;

			// update map with new tile
			this.map[actor.y - vert][actor.x - horz] = tempTile;

			// udpates display
			this.updateDisplay(actor, tempTile);

		}

		this.drawMap = function() {
			$("#game-window").empty();
			var sourceGame = $("#game-window-template").html();
			var gameTemplate = Handlebars.compile(sourceGame);
			var that = this;
			var counter = 0;


			Handlebars.registerHelper("columnCounter", function() {
				// counter++;
				// console.log(counter);
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

		this.createPFMatrix = function(room) {
			var matrix = [];
			for (var y = 0; y < this.rows; y++) {
				var row = [];
				for(var x = 0; x < this.columns; x++) {
					if(room[y][x].class === 'wall' || room[y][x].class === 'door') {
						row.push(1);
					}
					else {
						row.push(0);
					}
				}
				matrix.push(row);
			}
			return matrix;
		}

		this.initializeMap = function(upDown) {
			monstersActive = [];
			this.createMap();
			this.createTerrain();
			// // called by placeCharacter
			this.placeCharacterStairs(upDown);
			if(upDown === 'down') {
				this.placeStairs("up");
			}
			else if(upDown === 'up') {
				this.placeStairs("down");
			}
			// this.placeStairs(upDown);
			this.createMonsters(30);
			// // the line below is used for texting new items & inventory
			// this.map[rogue.y + 1][rogue.x + 1] = new Dagger(1, 1);
			this.drawMap();
			this.darkenRooms(this.roomList);
			this.lightRoomRogueIn(this.roomList);
		}

	};
// random map generation code
	var Room = function(xCenter, yCenter, width, height, doorLocationX, doorLocationY) {
		this.xCenter = xCenter;
		this.yCenter = yCenter;
		this.width = width;
		this.height = height;	
		this.doorLocationX = doorLocationX || null;
		this.doorLocationY = doorLocationY || null;
		this.upLeftCornerX = this.xCenter - Math.floor(this.width/2);
		this.upLeftCornerY = this.yCenter - Math.floor(this.height/2)
	}

// terrain related code
	var Tile = function(x, y) {
		this.x = x;
		this.y = y;
		this.text = "·";
		this.class = "dot"
		this.impassable = false
		this.inspectText = "A dank dungeon floor.";
	}

	Tile.prototype.location = function() {
		return [this.x, this.y]
	}

	// class currently does nothing but is being used for expected future functionality
	var Terrain = function() {
	}

	Terrain.prototype = new Tile();
	Terrain.prototype.constructor = Terrain;

	var Wall = function(x, y) {
		Tile.call(this, x, y);
		this.text = "#"
		this.class = "wall"
		this.impassable = true;
		this.inspectText = "A solid wall."
	}

	Wall.prototype = new Terrain();
	Wall.prototype.constructor = Wall;

	var Door = function(x, y) {
		Tile.call(this, x, y);
		this.text = "+"
		this.class = "door";
		this.door = true;
		this.inspectText = "A door. I wonder what is on the other side.";
	}

	Door.prototype = new Terrain();
	Door.prototype.constructor = Door;

	var DownStairs = function(x, y) {
		Tile.call(this, x, y);
		this.text = ">"
		this.class = "downstairs";
		this.downStairs = true;
		this.inspectText = "Stairs leading further into the dungeon. Are you ready for a greater challenge?";
	}

	DownStairs.prototype = new Terrain();
	DownStairs.prototype.constructor = DownStairs;

	DownStairs.prototype.goDown = function() {
		// call a function in currentLevel
	}

	var UpStairs = function(x, y) {
		Tile.call(this, x, y);
		this.text = "<"
		this.class = "upstairs";
		this.upStairs = true;
		this.inspectText = "Stairs leading up to an easier part of the dungeon.";
	}

	UpStairs.prototype = new Terrain();
	UpStairs.prototype.constructor = UpStairs;

	UpStairs.prototype.goUp = function() {
		// call a function in currentLevel
	}

// character & monster code section. Includes combat.
	var Actor = function(x, y) {
		Tile.call(this, x, y);
		this.standingOn = new Tile(x, y);

		// combat stats
		this.healthBase = 100;
		this.offenseBase = 10;
		this.maxDamageBase = 10;
		this.defenseBase = 10;
		this.damClump = 3;
		this.regenRate = 400;
		this.moveSpeed = 1;

	}
	Actor.prototype = new Tile();
	Actor.prototype.constructor = Actor;

	Actor.prototype.regen = function() {
		if(this.health < this.maxHealth) {
			this.health += this.maxHealth / this.regenRate;
			// console.log("health: ", this.health);
		}
	}

	Actor.prototype.removeActor = function(array) {
		for(var i = 0; i < array.length; i++) {
			if(array[i].x === this.x && array[i].y === this.y) {
				array.splice(i, 1);
				break;
			}
		}
	}

	Actor.prototype.damageRoll = function() {
		var damage = 0;
		for(var i = 0; i < this.damClump; i++) {
			damage += Math.random() * this.maxDamage/this.damClump;
		}
		return damage;
	}

	Actor.prototype.attackRoll = function(defender) {
		var toHitFactor = this.offense - defender.defense + 50;
		var roll = Math.random() * 100;

		return roll < toHitFactor;
	}

	Actor.prototype.combatHandler = function(defender) {
		if(this.attackRoll(defender)) {
			var damage = this.damageRoll();
			defender.health -= damage;
			if(defender.health < 0) {
				addMessage("The " + this.class + " killed the " + defender.class + "!");
				currentLevel.emptyTile(defender.x, defender.y);
				if(defender === rogue) {
					currentLevel = new Level(MAP_COLUMNS, MAP_ROWS);
					$("#game-window").empty();
					$("#game-wrapper").prepend(
						"<div id='dead'>" +
							"YOU SUCK AND YOU'RE DEAD. lolz" +
							"<br>" +
							"You had " + rogue.gold + " gold." +
							"</div>");

				}
				else if(defender.monster) {
					// console.log("monster dead")
					defender.removeActor(monstersActive);
					var loot = defender.lootDrop();
					currentLevel.map[defender.y][defender.x] = loot;
					currentLevel.updateDisplay(defender, loot);
				}
			}
			else {
				addMessage("The " + this.class + " hit the " + defender.class + " for " + Math.round(damage) + " damage.");
			}
		}
		else {
			addMessage("The " + this.class + " missed the " + defender.class + ".")
		}

	}

// character related code
	var Character = function(x, y) {
		// Tile.call(this, x, y);
		Actor.call(this, x, y);
		this.text = "@";
		this.class = "character";
		this.character = true;
		this.inspectText = "A badass MFer.";
		this.inventoryOpen = false;
		this.inventoryFocus = null;
		this.tunneling = false;

		// combat stats
		this.maxHealth = this.healthBase;
		this.health = this.maxHealth;
		this.offense = this.offenseBase;
		this.defense = this.defenseBase;
		this.maxDamage = this.maxDamageBase;

		// inventory
		this.gold = 0;
		this.inventory = {a: null, b: null, c: null, d: null, e: null, f: null, g: null, h: null, i: null, j: null, k: null, l: null, m: null, n: null, o: null, p: null, q: null, r: null, s: null, t: null, u: null, v: null, x: null, y: null, z: null};
		this.inventory.a = new Dagger(x, y, false);
		this.inventory.b = new LeatherArmor(x, y, false);
	}

	Character.prototype = new Actor();
	Character.prototype.constructor = Character;

	Character.prototype.openInventorySlot = function() {
		for(var i in this.inventory) {
			console.log("this.inventory.i: ", this.inventory.i)
			if(this.inventory[i] === null) {
				console.log("i: ", i);
				return i;
			}
		}
		return false;
	}

	Character.prototype.inventoryHandler = function(keyCode) {
		var closeInventoryOnAction = function(that) {
			that.inventoryFocus = null;
			that.inventoryOpen = false;
			that.drawInventory();
			turnHandler();
		}

		if(keyCode >= 97 && keyCode <= 122) {
			var keyCheck = {97: "a", 98: "b", 99: "c", 100: "d", 101: "e", 102: "f", 103: "g", 104: "h", 105: "i", 106: "j", 107: "k", 108: "l", 109: "m", 110: "n", 111: "o", 112: "p", 113: "q", 114: "r", 115: "s", 116: "t", 117: "u", 118: "v", 119: "w",  120: "x", 121: "x", 122: "z"};
			
			if(this.inventoryFocus) {
				// checks if 'e' is press and if the item is equipment
				if(keyCode === 101) {
					if(this.inventoryFocus instanceof Equipment) {
						this.equip(this.inventoryFocus);
						addMessage("You have " + this.inventoryFocus + ".");
						closeInventoryOnAction(this);
					}
					else {
						addMessage("That is not equipment");
						return this.inventoryHandler();
					}
				}
				
				// checks if 'u' is pressed and if it's equipment
				else if(keyCode === 117) {
					if(this.inventoryFocus instanceof Equipment) {
						this.unEquip(this.inventoryFocus);
						closeInventoryOnAction(this);
					}
					else {
						addMessage("That is not equipment");
						return this.inventoryHandler();
					}
				}
			}
			else {
				var item = keyCheck[keyCode];
				console.log(item);
				if(this.inventory[item] !== null) {
					addMessage("Do what with the " + this.inventory[item].toString() + "?");
					addMessage("drop (d), equip (e), use (u), unequip (u)");
					this.inventoryFocus = this.inventory[item];
					console.log(this.inventoryFocus instanceof Equipment);
				}
				else {
					addMessage("That is not an item");
					return this.inventoryHandler();
				}
			}
		}
		else {
			addMessage("That is not an item");
			return this.inventoryHandler();
		}
	}

	Character.prototype.equip = function(equipment) {
		equipment.equipped = true;
		this.offense += equipment.offenseMod;
		this.maxDamage += equipment.damageMod;
		this.damage += equipment.defenseMod
	}

	Character.prototype.unEquip = function(equipment) {
		equipment.equipped = false;
		this.offense -= equipment.offenseMod;
		this.maxDamage -= equipment.damageMod;
		this.defense -= equipment.defenseMod
	}

	Character.prototype.checkNextTile = function(horz, vert) {
		var nextTile = currentLevel.map[this.y + vert][this.x + horz];
		if(nextTile.monster) {
			return "monster";
		}
		else if(nextTile.impassable) {
			return "impassable";
		}
		else if(nextTile.door) {
			return "door";
		}
		else if(nextTile.character) {
			return "character";
		}
		// this must come before gold or will add gold to inventory
		else if(nextTile instanceof Gold) {
			return "gold";
		}
		else if(nextTile instanceof Item) {
			return "item";
		}
		else {
			return 'empty';
		}
	}

	// todo put in character class
	Character.prototype.keyHandler = function(keyCode) {
		// console.log('working?')

		// quit inventory = "Q"
		if(keyCode === 81) {
			this.inventoryOpen = false;
			this.inventoryFocus = null;
		}
		if(!this.inventoryOpen || this.tunneling) {
			var horz;
			var vert;
			// "right = l"
			if(keyCode === 108) {
				horz = 1;
				vert = 0;
			}
			// "left = h"
			else if(keyCode === 104) {
				horz = -1;
				vert = 0;
			}
			// "down = j"
			else if(keyCode === 106) {
				horz = 0;
				vert = 1;
			}
			// "up = k"
			else if(keyCode === 107) {
				horz = 0;
				vert = -1;
			}
			// "upright = u"
			else if(keyCode === 117) {
				horz = 1;
				vert = -1;
			}
			// "upleft = y"
			else if(keyCode === 121) {
				horz = -1;
				vert = -1;
			}
			// "downright = n"
			else if(keyCode === 110) {
				horz = 1;
				vert = 1;
			}
			// "downleft = b"
			else if(keyCode === 98) {
				horz = -1;
				vert = 1;
			}
			// wait a turn = "."
			else if(keyCode === 46) {
				horz = 0;
				vert = 0;
				this.tunneling = false;
			}
			if(!this.tunneling) {

				// go down a floor = ">"
				if(keyCode === 62) {
					if(this.standingOn.downStairs) {
						createNewLevel(1);
					}
					else {
						addMessage("You are not standing on descending stairs.");
					}
				}
				// go up a floor = "<"
				else if(keyCode === 60) {
					if(this.standingOn.upStairs) {
						createNewLevel(-1);
					}
					else {
						addMessage("You are not standing on ascending stairs.");
					}
				}
				// open inventory = "i"
				else if(keyCode === 105) {
					this.inventoryOpen = true;
					addMessage("------INVENTORY OPEN------");
					addMessage("(close with 'Q')")
					addMessage("Interact with which item?");
					// this.inventoryHandler(keyCode);
				}
				// // equip from inventory = "e"
				// else if(keyCode === 101) {
				// 	console.log(this.inventory);
				// }
				// rest 100 turns = "R"
				else if(keyCode === 82) {
					for(var i = 0; i < 100; i++) {
						turnHandler();
					}
				}
				// tunnel through wall = "T"
				else if(keyCode === 84) {
					this.tunneling = true;
					addMessage("--- Tunnel in which direction? ---");
				}
			}

			// only runs if a direciton was selected on keyboard
			if(horz !== undefined) {
				// console.log("horz: ", horz, " vert: ", vert);

				// this must go before normal walls while not tunelling
				if(this.checkNextTile(horz, vert) === 'impassable' && this.tunneling) {
						for(var i = 0; i < 20; i++) {
							turnHandler();
						}
						addMessage("You dig through the wall with your pick.");
						currentLevel.emptyTile(this.x + horz, this.y + vert);
						this.tunneling = false;
					}
				else if(this.checkNextTile(horz, vert) === 'impassable') {
						addMessage("You shall not pass!")
					}
				else if(this.checkNextTile(horz, vert) === 'monster') {
					this.combatHandler(currentLevel.map[this.y + vert][this.x + horz]);
					turnHandler();
				}
				else if(this.checkNextTile(horz, vert) === 'door'){
					currentLevel.emptyTile(this.x + horz, this.y + vert);
					currentLevel.findRoomLightRoom(this.x + horz, this.y + vert, currentLevel.roomList);
					// update dungeon. Takes a turn to kick down a door.
					addMessage("You kick down the door. A loud noise reverberates throughout the dungeon.")
					turnHandler();
				}
				else if(this.checkNextTile(horz, vert) === 'empty') {
					currentLevel.updateActor(horz, vert, this);
					turnHandler();
				}
				else if(this.checkNextTile(horz, vert) === 'character') {
					turnHandler();
				}
				else if(this.checkNextTile(horz, vert) === 'gold') {
					this.gold += currentLevel.map[this.y + vert][this.x + horz].quantity;
					currentLevel.map[this.y + vert][this.x + horz] = new Tile(this.x + horz, this.y + vert);
					currentLevel.updateActor(horz, vert, this);
					$("#gold").text("Gold: " + this.gold);
					turnHandler();
				}
				else if(this.checkNextTile(horz, vert) === 'item') {
					if(this.openInventorySlot()) {
						var slot = this.openInventorySlot()
						this.inventory[slot] = currentLevel.map[this.y + vert][this.x + horz];
						currentLevel.map[this.y + vert][this.x + horz] = new Tile(this.x + horz, this.y + vert);
						currentLevel.updateActor(horz, vert, this);
						turnHandler();
					}
					else {
						currentLevel.updateActor(horz, vert, this);
						turnHandler();
					}
				}
			}
		}	
		else {
			this.inventoryHandler(keyCode);
		}

	}	

	Character.prototype.drawInventory = function() {
		$("#inventory").empty();
		for(var i in this.inventory) {
			$("#inventory").append(i + ": " + this.inventory[i] + "<br>");
		}
		// uncomment this to throw the "call initialize on ready twice bug"
		// $("#inventory").append("blah" + ": " + this.inventory[blah] + "<br>");
	}

// monster related code
	var Monster = function(x, y) {
		Actor.call(this, x, y);
		this.monster = true;
	}

	Monster.prototype = new Actor();
	Monster.prototype.constructor = Monster;

	Monster.prototype.lootDrop = function() {
		if(Math.random() * 100 < this.treasureQuality) {
			return new EnchantScroll(this.x, this.y);
		}
		else {
			return new Gold(this.x, this.y, this.treasureQuality);
		}
	}

	var Rat = function(x, y) {
		Monster.call(this, x, y);
		Tile.call(this, x, y)
		this.class = 'rat'
		this.text = 'r'
		this.inspectText = "A enormous, mangy rat. It looks hungry."

		// combat stats
		this.maxHealth = this.healthBase/10;
		this.health = this.maxHealth;
		this.offense = this.offenseBase;
		this.defense = this.defenseBase;
		this.maxDamage = this.maxDamageBase;
		this.treasureQuality = 1;
	}

	Rat.prototype = new Monster();
	Rat.prototype.constructor = Rat;

	var Kobold = function(x, y) {
		Monster.call(this, x, y);
		Tile.call(this, x, y);
		this.class = 'kobold'
		this.text = 'k'
		this.inspectText = "A short, reptilian humanoid. It walks on two legs and wants to stab you."

		// combat stats
		this.maxHealth = this.healthBase/5;
		this.health = this.maxHealth;
		this.offense = this.offenseBase;
		this.defense = this.defenseBase/2;
		this.maxDamage = this.maxDamageBase/3;
		this.treasureQuality = 2;
	}

	Kobold.prototype = new Monster();
	Kobold.prototype.constructor = Kobold;

	var Goblin = function(x, y) {
		Monster.call(this, x, y);
		Tile.call(this, x, y);
		this.class = 'goblin'
		this.text = 'g'
		this.inspectText = "A short, twisted version of a man."

		// combat stats
		this.maxHealth = this.healthBase;
		this.health = this.maxHealth;
		this.offense = this.offenseBase;
		this.defense = this.defenseBase;
		this.maxDamage = this.maxDamageBase;
		this.treasureQuality = 3;
	}

	Goblin.prototype = new Monster();
	Goblin.prototype.constructor = Goblin;

// loot and equipment
	var Item = function(x, y) {
		this.x = x;
		this.y = y;
	}

	Item.prototype = new Tile();
	Item.prototype.constructor = Item;

	Item.prototype.toString = function() {
	    return this.label;
	}

	var Equipment = function(x, y, equipped) {
		Item.call(this, x, y);
		this.x = x;
		this.y = y;
		this.equipped = equipped || false;
		this.enchantLevel = 0;
		this.offenseMod = 0;
		this.damageMod = 0;
		this.defenseMod = 0;
	}

	Equipment.prototype = new Item();
	Equipment.prototype.constructor = Equipment;

	Equipment.prototype.toString = function() {
		if(this.equipped) {
	    	return "equipped " + this.label + " " + this.enchantLevel;
		}
		else {
	    	return this.label + " " + this.enchantLevel;
		}
	}

	var Weapon = function(x, y, equipped) {
		Equipment.call(this, x, y, equipped);
		this.x = x;
		this.y = y;
		this.weapon = true;
		this.text = "^"
		this.class = "weapon"
	}

	Weapon.prototype = new Equipment();
	Weapon.prototype.constructor = Weapon;

	var Dagger = function(x, y, equipped) {
		Weapon.call(this, x, y, equipped);
		this.x = x;
		this.y = y;
		this.label = "Dagger"

		// combat stuff
		this.offenseMod = 10;
		this.damageMod = 2;
	}

	Dagger.prototype = new Weapon();
	Dagger.prototype.constructor = Dagger;

	var Sword = function(x, y, equipped) {
		Weapon.call(this, x, y, equipped);
		this.x = x;
		this.y = y;
		this.label = "Sword"

		// combat stuff
		this.offenseMod = 5;
		this.damageMod = 6;
	}

	Sword.prototype = new Weapon();
	Sword.prototype.constructor = Sword;
// armor
	var Armor = function(x, y, equipped) {
		Equipment.call(this, x, y, equipped);
		this.x = x;
		this.y = y;
		this.text = ")";
		this.class = "armor";
	}

	Armor.prototype = new Equipment();
	Armor.prototype.constructor = Armor;

	var LeatherArmor = function(x, y, equipped) {
		Armor.call(this, x, y, equipped);
		this.x = x;
		this.y = y;
		this.label = "Leather Armor"

		// combat stuff
		this.defenseMod = 2;
	}

	LeatherArmor.prototype = new Armor();
	LeatherArmor.prototype.constructor = LeatherArmor;
// gold

	var Gold = function(x, y, quantity) {
		Item.call(this, x, y);
		this.x = x;
		this.y = y;
		this.text = "$";
		this.class = "gold";
		this.quantity = quantity;
	}

	Gold.prototype = new Item();
	Gold.prototype.constructor = Gold;

// scrolls
	var Scroll = function(x, y) {
		Item.call(this, x, y);
		this.x = x;
		this.y = y;
		this.text = "~";
		this.text = "scroll";
	}

	Scroll.prototype = new Item();
	Scroll.prototype.constructor = Scroll;

	var EnchantScroll = function(x, y) {
		Item.call(this, x, y);
		this.x = x;
		this.y = y;
		this.label = "Scroll of enchantment";
	}

	EnchantScroll.prototype = new Item();
	EnchantScroll.prototype.constructor = EnchantScroll;
		
// everything else
	// create local 'globals'
	var currentLevel = new Level(MAP_COLUMNS, MAP_ROWS, 0);
	var rogue = new Character(1, 1);
	var monstersActive = [];
	var monstersAvailable = []
	var totalTurns = 0;
	var pathFinder = new PF.AStarFinder({
	    allowDiagonal: true
	});

	var initialize = function() {
		console.log("initialize called");
		currentLevel.initializeMap("up");
		rogue.drawInventory();
		
	}

	return {
		GameSpace: GameSpace,
		initialize: initialize,
		rogue: rogue,
		clickText: clickText,
		currentLevel: currentLevel,
	}
})();

var resizeTiles = function() {
		// var winSize = Math.min($(window).width(), $(window).height()) * 0.85;
		var winHeight = $(window).height() * 0.85
		var winWidth = $(window).width() * 0.75
		$(".tile").width(winWidth / GameSpace.currentLevel.columns);
		$(".tile").height(winHeight / GameSpace.currentLevel.rows);

	}

var resizeText = function() {
	// Set font size to scale with square height
	$('.scale-font').css('font-size', $('.tile').height()*1.05);
}

// jquery event handlers
$(document).on('ready', function() {
	// there is some strange bug where an error occuring after intitialize is called will call initilize twice. Not sure if it's in jQuery or my code. This stops the infinite loop that occurs after this bug.
	try {
		GameSpace.initialize();
	}
	catch(err) {
		console.log("initialize failed");
		setTimeout(function() {
			throw err;
		},100) 
	}

	// keyboard handler
	
	$(document).keypress(function(e) {
		console.log(e.charCode);
		GameSpace.rogue.keyHandler(e.charCode);
	});

	// click handler to inspect elements on map
	// delegation on this IS NOT WORKING and no one knows why
	$(document).on("click", ".tile", function() {
		// console.log("tile click firing");
		GameSpace.clickText($(this).attr("id"));
		// console.log("clickText firing");
	});

	$(document).on("click", ".close-popup", function() {
		$(".text-popup").remove();
	})


	resizeTiles();
	resizeText();
	$(window).resize(function() {
		resizeTiles();
		resizeText();

		
	})

	// var resize = function() {
	//    // Set font size to scale with square height
	//    $('.class-to-scale-font').css('font-size', $('.square').height()*1.06)
	 
	//    // Set line height to scale with font size so centering doesn't break
	//    $('.square').css('line-height', 0.75*parseInt($('.board').css('font-size'))+'px')
	// }

	
});