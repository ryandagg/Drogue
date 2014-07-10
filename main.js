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
			return counterC % currentLevel.columns;
		})

		$("#game-window").append(gameTemplate(currentLevel));
	};

	var init = function() {
		drawMap();
	}

	return {
		currentLevel: currentLevel,
		init: init,
	}

})();




$(document).on('ready', function() {
  GameSpace.init();
});