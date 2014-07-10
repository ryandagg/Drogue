var GameSpace = (function() {

	var Level = function(rows, columns) {
		this.rows = rows;
		this.columns = columns;
		this.map = [];

	};

	Level.prototype.tileMatrixGenerator = function() {
		// console.log(this.rows)
		for (var r = 0; r < this.rows; r++) {
			var row = [];
			for(var c = 0; c < this.columns; c++) {
				row.push([c, r]);
			}
			this.map.push(row);
		}	
	};

	var currentLevel = new Level(30, 30);

	var createMap = function () {
		currentLevel.tileMatrixGenerator();
	};

	var drawMap = function() {
		$("#game-window").empty();
		createMap();
		var sourceGame = $("#game-window-template").html();
		var gameTemplate = Handlebars.compile(sourceGame);

		var counterR = -1;
		Handlebars.registerHelper("rowCounter", function() {
			counterR++;
			// console.log(currentLevel.rows);
			return counterR % currentLevel.rows;
		})
		var counterC = -1;
		Handlebars.registerHelper("columnCounter", function() {
			counterC++;
			// console.log(currentLevel.columns);
			return Math.floor(counterC/currentLevel.columns);
		})

		$("#game-window").append(gameTemplate(currentLevel));
	};

	var Character = function() {
		this.position = [Math.floor(currentLevel.columns/2), Math.floor(currentLevel.rows/2)];
		this.placeCharacter = function() {
			$("#location-" + String(this.position[0]) + "-" + String(this.position[1])).append("<div id='character'>@</div>");
		}

		this.updateCharacterPosition = function() {
			$("#character").remove();
			$("#location-" + String(this.position[0]) + "-" + String(this.position[1])).append("<div id='character'>@</div>");
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

	// var characterPos = [Math.floor(currentLevel.columns/2), Math.floor(currentLevel.rows/2)];

	// var placeCharacter = function() {
	// 	$("#location-" + String(characterPos[0]) + "-" + String(characterPos[1])).append("<div id='character'>@</div>");
	// }

	// var changeCharacterPosition = function(direction) {
	// 	if(direction === "right") {
	// 		characterPos[0]++;

	// 	}
	// 	$("#character").remove();
	// 	$("#location-" + String(characterPos[0]) + "-" + String(characterPos[1])).append("<div id='character'>@</div>");
	// }

	var init = function() {
		drawMap();
		rogue.placeCharacter();
	}

	return {
		// currentLevel: currentLevel,
		init: init,
		rogue: rogue,
	}

})();




$(document).on('ready', function() {
	GameSpace.init();

	$(document).keypress(function(e) {
		console.log(e);
		GameSpace.rogue.moveCharacter(e.charCode);
	})
	// var attachInputEvents = function () {
	// $(document).bind("enterKey", function(e) {
	// 	$(this).prev(".day-block").addClass("editable");
	// 	var eventText = $(this).val()
	// 	$(this).replaceWith("<div class = 'editableEvent'>" + eventText + "</div>")
	// })

	// $(document).keyup(function(e) {
	// 	if(e.keyCode == 13) {
 //    		$(this).trigger("enterKey");
	// 	}
	// });
// }

});