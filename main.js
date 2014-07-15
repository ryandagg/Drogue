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
		$("#messages").prepend("<p>" + text + "</p>")
	}

	var turnHandler = function () {
		totalTurns++;
		addMessage("------------------- Turn " + totalTurns + " -------------------");
		for(var i = 0; i < monstersActive.length; i++) {
			monsterTurn(monstersActive[i]);
		}
		// console.log(totalTurns);

		// character regen
		actorRegen(rogue);
	}

	var checkNextTile = function(horz, vert) {
		var nextTile = currentLevel.map[rogue.y + vert][rogue.x + horz];
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
		else {
			return 'empty';
		}
	}

	// todo put in character class
	var keyHandler = function(keyCode) {
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
		}

		// console.log("horz: ", horz, " vert: ", vert);
		if(checkNextTile(horz, vert) === 'impassable') {
				addMessage("You shall not pass!")
			}
		else if(checkNextTile(horz, vert) === 'monster') {
			combatHandler(rogue, currentLevel.map[rogue.y + vert][rogue.x + horz]);
			turnHandler();
		}
		else if(checkNextTile(horz, vert) === 'door'){
			currentLevel.emptyTile(rogue.x + horz, rogue.y + vert);
			currentLevel.findRoomLightRoom(rogue.x + horz, rogue.y + vert, currentLevel.roomList);
			// update dungeon. Takes 2 turns to kick down a door.
			addMessage("You kick down the door. A loud noise reverberates throughout the dungeon.")
			turnHandler();
		}
		else if(checkNextTile(horz, vert) === 'empty') {
			currentLevel.updateActor(horz, vert, rogue);
			turnHandler();
		}
		else if(checkNextTile(horz, vert) === 'character') {
			turnHandler();
		}
		
	}	

	// todo put this in an actor class
	var actorRegen = function(actor) {
		if(actor.health < actor.maxHealth) {
			actor.health += actor.maxHealth / actor.regenRate;
			// console.log("health: ", actor.health);
		}
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
		if(path.length > 0 && path.length < 11) {
			var horz = path[1][0] - monster.x;
			var vert = path[1][1] - monster.y;
			// console.log("monster:", monster.x, monster.y);
			// console.log("horz: " + horz, "vert: " + vert);

			// check for combat & initiate
			if(path.length === 2) {
				combatHandler(monster, rogue);
			}
			// check if next square is a monster & wait
			else if(currentLevel.map[path[1][1]][path[1][0]].monster) {
				// do nothing on purpose
			}
			else {
				currentLevel.updateActor(horz, vert, monster);
			}

		}
		actorRegen(monster);
	}

	var removeMonster = function(monster, array) {
		for(var i = 0; i < array.length; i++) {
			if(array[i].x === monster.x && array[i].y === monster.y) {
				array.splice(i, 1);
				break;
			}
		}
	}

// combat!
	var damageRoll = function(attacker) {
		var damage = 0;
		for(var i = 0; i < attacker.damClump; i++) {
			damage += Math.random() * attacker.maxDamage/attacker.damClump;
		}
		return damage;
	}

	var attackRoll = function(attacker, defender) {

		var toHitFactor = attacker.offense - defender.defense + 50;
		var roll = Math.random() * 100;

		return roll < toHitFactor;
	}

	var combatHandler = function(attacker, defender) {
		if(attackRoll(attacker, defender)) {
			var damage = damageRoll(attacker);
			defender.health -= damage;
			if(defender.health < 0) {
				addMessage("The " + attacker.class + " killed the " + defender.class + "!");
				currentLevel.emptyTile(defender.x, defender.y);
				if(defender === rogue) {
					// end game
				}
				else if(defender.monster) {
					// console.log("monster dead")
					removeMonster(defender, monstersActive);
				}
			}
			else {
				addMessage("The " + attacker.class + " hit the " + defender.class + " for " + Math.round(damage) + " damage.");
			}
		}
		else {
			addMessage("The " + attacker.class + " missed the " + defender.class + ".")
		}

	}

// level and map related code
	var Level = function(columns, rows) {
		this.rows = rows;
		this.columns = columns;
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

		// this.cloneMap = function() {
		// 	var temp = [];
		// 	for(var i = 0; i < this.map.length; i++) {
		// 		// console.log(this.map[i].clone());
		// 		temp.push(clone(this.map[i]));
		// 	}
		// 	return temp;
		// }

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

		// Iterates through an array of room objects and finds a door with matching location. Calls popRoom to light room after door open. Location taken from keyhandler.
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

		this.randomRooms = function(quantity) {
			var minRoomDimension = 4;
			var maxRoomDimension = 11;
			// create a temp map to check for overlap & door problems
			var tempMap = this.map.map(clone);
			var tempRoomList = [];

			var i = 0;
			while (i < quantity) {
				var centerX = Math.floor(Math.random()*(this.columns - maxRoomDimension) + maxRoomDimension/2) 
				var centerY = Math.floor(Math.random()*(this.rows - maxRoomDimension) + maxRoomDimension/2)
				var width = Math.floor(Math.random() * (maxRoomDimension - minRoomDimension) + minRoomDimension)
				var height = Math.floor(Math.random() * (maxRoomDimension - minRoomDimension) + minRoomDimension)

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
			var outerWalls = new Room(Math.floor(currentLevel.columns/2), Math.floor(currentLevel.rows/2), currentLevel.columns, currentLevel.rows);

			this.createRoom(outerWalls, this.map);

			// Creates random rooms on map. DOES NOT SCALE WITH SIZE OF LEVEL leads to infinite loops on smaller levels.
			this.randomRooms(Math.ceil(Math.sqrt(this.columns*this.rows)/1.5));
			// console.log(Math.sqrt(this.columns*this.rows)/1.5);	
		};

		// THIS DOES NOTHING will eventually be called by createMonsters
		this.selectRandomMonster = function() {
			// do something;
		};

		// this populates monsters on map. Currently only populates rats. Needs to work for other monsters and only populate in rooms.
		this.createMonsters = function(quantity) {
			var i = 0;
			var monster
			while (i < quantity) {
				var randomY = Math.floor(Math.random() * currentLevel.rows)
				var randomX = Math.floor(Math.random() * currentLevel.columns)
				var randomRat = new Rat(randomX, randomY);
				if(currentLevel.map[randomY][randomX].class === 'dot') {
					currentLevel.map[randomY][randomX] = randomRat;
					monstersActive.push(randomRat);
					i++;
				}
			}
			// console.log(monstersActive);
		};

		this.placeCharacter = function() {
			this.map[rogue.y][rogue.x] = rogue;
		};

		// Currently works on doors and dots. Could potentially handle items and stairs with conditional statements.
		this.updateDisplay = function(obj1, obj2) {
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

		this.updateActor = function(horz, vert, actor) {
			var tempTile = new Tile(actor.x , actor.y); 
			actor.x += horz;
			actor.y += vert;
			// console.log(actor);
			// console.log("x: ", actor.x, " y: ", actor.y);
			// console.log("location", this.map[actor.y][actor.x]);
			this.map[actor.y][actor.x] = actor;
			this.map[actor.y - vert][actor.x - horz] = tempTile;
			this.updateDisplay(actor, tempTile)
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
		this.text = "."
		this.class = "dot"
		this.impassable = false
		this.inspectText = "A dank dungeon floor.";
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


// character related code
	var Character = function(x, y) {
		Tile.call(this, x, y);
		this.text = "@";
		this.class = "character";
		this.character = true;
		this.maxHealth = 100;
		this.health = this.maxHealth;
		this.offense = 10;
		this.defense = 10;
		this.maxDamage = 10;
		this.damClump = 3;
		this.inspectText = "A badass MFer.";
	}

	Character.prototype = new Tile();
	Character.prototype.constructor = Character;


// monster related code
	var Monster = function() {
		this.healthBase = 100;
		this.offenseBase = 100;
		this.maxDamageBase = 100;
		this.defenseBase = 100;
		this.damClump = 3;
		this.regenRate = 400;
		this.monster = true;
		this.moveSpeed = 1;
	}

	Monster.prototype = new Tile();
	Monster.prototype.constructor = Monster;

	var Rat = function(x, y) {
		Tile.call(this, x, y)
		this.class = 'rat'
		this.text = 'r'
		this.maxHealth = this.healthBase/10;
		this.health = this.maxHealth;
		this.offense = this.offenseBase/10;
		this.defense = this.defenseBase/10;
		this.maxDamage = this.maxDamageBase/10;
		this.treasureQuality = 1;
		this.inspectText = "A enormous, mangy rat. It looks hungry."

	}

	Rat.prototype = new Monster();
	Rat.prototype.constructor = Rat;

	var Kobold = function(x, y) {
		Tile.call(this, x, y)
		this.class = 'kobold'
		this.text = 'k'
		this.maxHealth = this.healthBase/8;
		this.health = this.maxHealth;
		this.offense = this.offenseBase/8;
		this.defense = this.defenseBase/8;
		this.maxDamage = this.maxDamageBase/8;
		this.treasureQuality = 2;
		this.inspectText = "A short, reptilian humanoid. It walks on two legs and wants to stab you."
	}

	Kobold.prototype = new Monster();
	Kobold.prototype.constructor = Kobold;
		
// everything else
	// create local 'globals'
	var currentLevel = new Level(60, 40);
	var rogue = new Character(1, 1);
	var monstersActive = [];
	var monstersAvailable = []
	var totalTurns = 0;
	var pathFinder = new PF.AStarFinder({
	    allowDiagonal: true
	});

	var initialize = function() {
		// console.log("initialize called");
		currentLevel.createMap();
		currentLevel.createTerrain();
		currentLevel.placeCharacter();
		currentLevel.createMonsters(30);
		currentLevel.drawMap();
		// console.log(currentLevel.roomList);
		currentLevel.darkenRooms(currentLevel.roomList);
		
	}

	return {
		GameSpace: GameSpace,
		initialize: initialize,
		keyHandler: keyHandler,
		rogue: rogue,
		clickText: clickText,
		currentLevel: currentLevel,
	}

})();




// jquery event handlers
$(document).on('ready', function() {
	GameSpace.initialize();
	// keyboard handler
	$(document).keypress(function(e) {
		// console.log("charCode: ", e.charCode);
		GameSpace.keyHandler(e.charCode);
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
});