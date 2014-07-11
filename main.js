/* Guidelines from Raine:
- all functions as methods
- don't make children responsible for parents 

*/

/* Current focus:
- convert all tiles to an object in currentLevel.map


 */


var GameSpace = (function() {
// helper funcitons
	// formats location of object to reference tile id
	var pos = function(loc) {
		return "#column-" + String(loc[0]) + "-row-" + String(loc[1]);
	};

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
					row.push([c, r]);
				}
				this.map.push(row);
			}	
		};

		this.createMap = function () {
			currentLevel.tileMatrixGenerator();
		};

		this.drawMap = function() {
			$("#game-window").empty();
			this.createMap();
			var sourceGame = $("#game-window-template").html();
			var gameTemplate = Handlebars.compile(sourceGame);

			var counter = 0;
			Handlebars.registerHelper("columnCounter", function() {
				// counter++;
				return counter % currentLevel.columns;
				// console.log(currentLevel.columns);
			})

			Handlebars.registerHelper("rowCounter", function() {
				counter++;
				// console.log(currentLevel.rows);
				return Math.floor(counter/currentLevel.columns);
			})
			

			$("#game-window").append(gameTemplate(currentLevel));
		};

	};

	// Level.prototype.tileMatrixGenerator = function() {
	// 	// console.log(this.rows)
	// 	for (var r = 0; r < this.rows; r++) {
	// 		var row = [];
	// 		for(var c = 0; c < this.columns; c++) {
	// 			row.push([c, r]);
	// 		}
	// 		this.map.push(row);
	// 	}	
	// };

	var currentLevel = new Level(60, 40);

	// create map object?
	// var createMap = function () {
	// 	currentLevel.tileMatrixGenerator();
	// };

	// var drawMap = function() {
	// 	$("#game-window").empty();
	// 	createMap();
	// 	var sourceGame = $("#game-window-template").html();
	// 	var gameTemplate = Handlebars.compile(sourceGame);

	// 	var counter = 0;
	// 	Handlebars.registerHelper("columnCounter", function() {
	// 		// counter++;
	// 		return counter % currentLevel.columns;
	// 		// console.log(currentLevel.columns);
	// 	})

	// 	Handlebars.registerHelper("rowCounter", function() {
	// 		counter++;
	// 		// console.log(currentLevel.rows);
	// 		return Math.floor(counter/currentLevel.columns);
	// 	})
		

	// 	$("#game-window").append(gameTemplate(currentLevel));
	// };

// terrain related code
	var Terrain = function(location) {
		this.classCSS = "impassable";
		this.location = location;
	}

	var Wall = function(location) {
		Terrain.call(this, location);
		this.color = "grey";
		this.icon = "hash";
	}

	// Wall.prototype.create = function() {
	// 	var el = $(this.location)
	// 		.css({'color': this.color, "font-size": "1.3em"})
	// 		.addClass("icon-" + this.iconType);
	// 		return el;
	// }

	Wall.prototype = new Terrain();
	Wall.prototype.constructor = Wall;

	var populateWalls = function() {
		var firstWall = new Wall([0, 0]);
		console.log(firstWall);
		console.log(pos(firstWall.location))
		$(pos(firstWall.location)).addClass("icon-hash");
		// $("#column-" + String(firstWall.position[0]) + "-row-" + String(firstWall.position[1])).addClass("icon-hash");
	}


// character related code
	var Character = function() {
		this.position = [Math.floor(currentLevel.columns/2), Math.floor(currentLevel.rows/2)];
		this.placeCharacter = function() {
			$("#column-" + String(this.position[0]) + "-row-" + String(this.position[1])).append("<div id='character'>@</div>");
		}

		this.updateCharacterPosition = function() {
			$("#character").remove();
			$("#column-" + String(this.position[0]) + "-row-" + String(this.position[1])).append("<div id='character'>@</div>");
		}
		this.moveCharacter = function(keyCode) {
			// var moveDict = {right: []}
			// "right"
			if(keyCode === 108) {
				this.position[0]++;

			}
			// "left"
			else if(keyCode === 104) {
				this.position[0]--;
			}
			// "down"
			else if(keyCode === 106) {
				this.position[1]++;
			}
			// "up"
			else if(keyCode === 107) {
				this.position[1]--;
			}
			// "upright"
			else if(keyCode === 117) {
				this.position[1]--;
				this.position[0]++;
			}
			// "upleft"
			else if(keyCode === 121) {
				this.position[1]--;
				this.position[0]--;
			}
			// "downright"
			else if(keyCode === 110) {
				this.position[1]++;
				this.position[0]++;
			}
			// "downleft"
			else if(keyCode === 98) {
				this.position[1]++;
				this.position[0]--;
			}
			
			this.updateCharacterPosition();
		}	
	}

	var rogue = new Character();

// everything else
	var init = function() {
		console.log("init called");
		currentLevel.drawMap();
		rogue.placeCharacter();
		populateWalls();
	}

	return {
		init: init,
		rogue: rogue,
	}

})();




$(document).on('ready', function() {
	GameSpace.init();
	// keyboard handler
	$(document).keypress(function(e) {
		// console.log(e);
		GameSpace.rogue.moveCharacter(e.charCode);
	})
});