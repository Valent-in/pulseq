"use strict"

function ArrangeUi(songObj, onPatternSelectCallback) {
	const aheadSpace = 8;
	const minColumnCount = 32;

	let rowCount = 0;
	let columnCount = 0;

	let playbackMarkers = [];
	let previousMarker = 0;

	let table = document.createElement("TABLE");
	table.addEventListener("click", arrangeEventListener);

	let btnAddPattern = document.getElementById("button-add-pattern");
	btnAddPattern.addEventListener("click", () => {
		let defaultName = "ptrn" + (songObj.patterns.length + 1);
		g_showPrompt("Enter pattern name", (result) => {

			if (!result) {
				console.log("Pattern NOT created");
				return;
			}

			songObj.patterns[rowCount] = new Pattern(result, songObj.barSteps);
			addRow(result);
			showPattern(rowCount - 1);
		}, defaultName);
	});

	this.build = function () {
		let arrange = document.getElementById("arrange-main");
		arrange.appendChild(table);

		buildGridHeader();
		addRow("ptrn1");

		for (let i = 0; i < columnCount; i++)
			if (!songObj.song[i])
				songObj.song[i] = [];
	}

	this.setMarker = function (index) {
		if (playbackMarkers[previousMarker])
			playbackMarkers[previousMarker].style.backgroundColor = "#111";

		if (index >= 0 && index < playbackMarkers.length) {
			playbackMarkers[index].style.backgroundColor = "#696969";
			previousMarker = index;
		}
	}

	function maxPatternBars() {
		return Math.ceil(64 / songObj.barSteps);
	};

	function buildGridHeader() {
		let th = document.createElement("TR");

		let td = document.createElement("TD");
		td.id = "arr_corner";
		th.appendChild(td);
		table.appendChild(th);

		for (let j = 0; j < minColumnCount; j++)
			addColumn();
	}

	function arrangeEventListener(event) {
		let tgt = event.target;
		if (tgt.nodeName != "TD")
			return;

		if (tgt.id == "arr_corner")
			return;

		let idParts = tgt.id.split("_");
		let col = Number(idParts[1].split("-")[1]);
		let row = Number(idParts[2].split("-")[1]);

		if (tgt.id.includes("header")) {
			let prev = document.getElementById("arr_col-" + songObj.arrangeStartPoint + "_header");
			if (prev)
				prev.classList.remove("play-start-point");

			songObj.arrangeStartPoint = col;
			let next = document.getElementById("arr_col-" + col + "_header");
			next.classList.add("play-start-point");
			return;
		}

		if (tgt.id.includes("side")) {
			showPattern(row);
			return;
		}

		setArrangeBlock(col, row, tgt);

		if (col >= songObj.song.length - aheadSpace - maxPatternBars())
			fitGridLength();
	}

	function setArrangeBlock(col, row, targetCell) {
		if (songObj.song[col][row]) {
			songObj.song[col][row] = false;
			drawBlock(col, row, false);
		} else {
			if (targetCell.classList.contains("js-fill-tail")) {
				let startPoint = col;
				while (!songObj.song[startPoint][row])
					startPoint--;

				songObj.song[startPoint][row] = false;
				drawBlock(startPoint, row, false);
			} else {
				let len = Math.ceil(songObj.patterns[row].length / songObj.barSteps);
				for (let i = col; i < Math.min(col + len, songObj.song.length); i++) {
					if (songObj.song[i][row]) {
						//TODO: notify!
						console.log("Can not insert block - no room");
						return;
					}
				}

				songObj.song[col][row] = true;
				if (col >= songObj.song.length - aheadSpace - maxPatternBars())
					fitGridLength();

				drawBlock(col, row, true);
			}
		}
	}

	function drawBlock(col, row, isDraw) {
		let len = Math.ceil(songObj.patterns[row].length / songObj.barSteps);
		let startCell = document.getElementById("arr_col-" + col + "_row-" + row);

		if (isDraw)
			startCell.classList.add("js-fill-head");
		else
			startCell.classList.remove("js-fill-head");

		for (let i = 1; i < len; i++) {
			let cell = document.getElementById("arr_col-" + (col + i) + "_row-" + row);

			if (!cell)
				continue;

			if (isDraw)
				cell.classList.add("js-fill-tail");
			else
				cell.classList.remove("js-fill-tail");
		}
	}

	function fitGridLength() {
		let songLen = songObj.song.length;
		let newSongLen = Math.max(songObj.calcSongLength() + aheadSpace, minColumnCount);

		if (newSongLen > songLen) {
			for (let i = 0; i < newSongLen - songLen; i++) {
				addColumn();
				songObj.song.push([]);
			}
		}

		if (newSongLen < songLen) {
			for (let i = 0; i < songLen - newSongLen; i++) {
				removeColumn();
				songObj.song.pop();
			}
		}
	}

	function showPattern(index) {
		songObj.setCurrentPattern(index);
		g_markCurrentPattern();
		onPatternSelectCallback(songObj.currentPattern);
		g_switchTab("pattern");
	}

	function addRow(name) {
		name = name ? name : "undf" + (rowCount + 1);

		let tr = document.createElement("TR");
		for (let j = 0; j <= columnCount; j++) {
			let td = document.createElement("TD");

			if (j > 0) {
				td.id = "arr_col-" + (j - 1) + "_row-" + rowCount;
			} else {
				td.id = "arr_side_row-" + rowCount;
				td.classList.add("arrange-sidebar");
				td.appendChild(document.createTextNode(name));
			}

			tr.appendChild(td);
		}
		table.appendChild(tr);
		rowCount++;
	}

	function addColumn() {
		let preCell = document.getElementById("arr_col-" + (columnCount - 1) + "_header");
		if (!preCell)
			preCell = document.getElementById("arr_corner");

		let td = document.createElement("TD");
		td.id = "arr_col-" + columnCount + "_header";
		td.classList.add("arrange-header");
		preCell.after(td);

		if ((columnCount) % 4 == 0)
			td.appendChild(document.createTextNode(columnCount + 1));

		if (columnCount == songObj.arrangeStartPoint)
			td.classList.add("play-start-point");

		for (let i = 0; i < rowCount; i++) {
			preCell = document.getElementById("arr_col-" + (columnCount - 1) + "_row-" + i);
			let td = document.createElement("TD");
			td.id = "arr_col-" + columnCount + "_row-" + i;
			preCell.after(td);
		}

		playbackMarkers.push(td);
		columnCount++;
	}

	function removeColumn() {
		let cell = document.getElementById("arr_col-" + (columnCount - 1) + "_header");;
		cell.remove();

		for (let i = 0; i < rowCount; i++) {
			cell = document.getElementById("arr_col-" + (columnCount - 1) + "_row-" + i);
			cell.remove();
		}

		playbackMarkers.pop();
		columnCount--;
	}

	function clearSongView() {
		playbackMarkers = [];
		rowCount = 0;
		columnCount = 0;

		table.innerHTML = "";
		buildGridHeader();
	}

	this.fillSongView = function () {
		clearSongView();

		let newSongLen = songObj.song.length;
		console.log("import length: " + newSongLen);

		for (let i = 0; i < songObj.patterns.length; i++)
			addRow(songObj.patterns[i].name);

		if (newSongLen > columnCount) {
			for (let i = columnCount; i < newSongLen; i++) {
				addColumn();
			}
		}

		for (let i = songObj.song.length; i < columnCount; i++) {
			songObj.song.push([]);
		}

		for (let i = 0; i < songObj.song.length; i++) {
			for (let j = 0; j < songObj.song[i].length; j++) {
				if (songObj.song[i][j]) {
					drawBlock(i, j, true)
				}
			}
		}
	}
}