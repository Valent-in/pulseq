"use strict"

function ArrangeUi(songObj, showSequenceCallback, onPatternSelectCallback) {
	let sideCells = [];
	let rowCount = 0;
	let columnCount = 32;
	let songLength = 24;

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

			songObj.patterns[rowCount] = new Pattern(result);
			songObj.currentPattern = songObj.patterns[rowCount];
			showPattern(rowCount);
			addRow(result);
			g_switchTab("pattern");
		}, defaultName);
	});

	this.build = function () {
		buildGridHeader();
		addRow("ptrn1");

		let arrange = document.getElementById("arrange-main");
		arrange.appendChild(table);

		for (let i = 0; i < columnCount; i++)
			if (!songObj.song[i])
				songObj.song[i] = [];
	}

	function buildGridHeader() {
		let th = document.createElement("TR");
		for (let j = 0; j <= columnCount; j++) {
			let td = document.createElement("TD");

			if (j == 0) {
				td.id = "arr_corner";
			} else {
				if ((j - 1) % 4 == 0)
					td.appendChild(document.createTextNode(j));

				td.id = "arr_col-" + (j - 1) + "_header";
				td.classList.add("arrange-header");
				sideCells.push(td);
			}

			th.appendChild(td);
		}
		table.appendChild(th);
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
			console.log("selected start point: " + col);
			let prev = document.getElementById("arr_col-" + songObj.arrangeStartPoint + "_header");
			prev.classList.remove("play-start-point");
			songObj.arrangeStartPoint = col;
			let next = document.getElementById("arr_col-" + col + "_header");
			next.classList.add("play-start-point");
			return;
		}

		if (tgt.id.includes("side")) {
			console.log("arrange pattern " + row);
			sideCells.forEach(e => e.classList.remove("select-fill"));
			tgt.classList.add("select-fill");

			if (!songObj.patterns[row]) {
				songObj.patterns[row] = new Pattern();
				tgt.classList.add("fill");
			}

			showPattern(row);
			g_switchTab("pattern");
			return;
		}

		setArrangeBlock(col, row, tgt);

		if (col >= songLength - 1)
			fitGridLength();

		console.log(col, row);
	}

	function setArrangeBlock(col, row, targetCell) {
		if (songObj.song[col][row]) {
			songObj.song[col][row] = false;
			drawBlock(col, row, false);
		} else {
			if (targetCell.classList.contains("fill-tail-next", "fill-tail-last")) {
				let startPoint = col;
				while (!songObj.song[startPoint][row])
					startPoint--;

				songObj.song[startPoint][row] = false;
				drawBlock(startPoint, row, false);
			} else {
				let len = Math.ceil(songObj.patterns[row].length / 16);
				for (let i = col; i < Math.min(col + len, songObj.song.length); i++) {
					if (songObj.song[i][row]) {
						//TODO: notify!
						console.log("Can not insert block - no room");
						return;
					}
				}

				songObj.song[col][row] = true;
				if (col >= songLength - 1)
					fitGridLength();

				drawBlock(col, row, true);
			}
		}
	}

	function drawBlock(col, row, isDraw) {
		let len = Math.ceil(songObj.patterns[row].length / 16);
		let startCell = document.getElementById("arr_col-" + col + "_row-" + row);

		if (isDraw)
			startCell.classList.add("fill");
		else
			startCell.classList.remove("fill");

		if (len == 1)
			return;

		for (let i = 0; i < len; i++) {
			let cell = document.getElementById("arr_col-" + (col + i) + "_row-" + row);

			if (!cell)
				continue;

			if (isDraw) {
				cell.classList.add("fill-tail-next");

				if (i == len - 1)
					cell.classList.add("fill-tail-last");
			} else {
				cell.classList.remove("fill-tail-next");

				if (i == len - 1)
					cell.classList.remove("fill-tail-last");
			}
		}
	}

	function fitGridLength() {
		let newSongLen = calcSongLength();

		if (newSongLen > songLength) {
			for (let i = 0; i < newSongLen - songLength; i++) {
				addColumn();
				songObj.song.push([]);
			}
		}

		if (newSongLen < songLength) {
			for (let i = 0; i < songLength - newSongLen; i++) {
				removeColumn();
				songObj.song.pop();
			}
		}

		songLength = newSongLen;
	}

	function showPattern(index) {
		songObj.currentPattern = songObj.patterns[index];
		onPatternSelectCallback(songObj.currentPattern);

		if (songObj.currentPattern.patternData[0]) {
			showSequenceCallback(songObj.currentPattern);
		}
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
				sideCells.push(td);
			}

			tr.appendChild(td);
		}
		table.appendChild(tr);
		rowCount++;
	}

	function addColumn() {
		let preCell = document.getElementById("arr_col-" + (columnCount - 1) + "_header");
		let td = document.createElement("TD");
		td.id = "arr_col-" + columnCount + "_header";
		td.classList.add("arrange-header");
		preCell.after(td);

		if ((columnCount) % 4 == 0)
			td.appendChild(document.createTextNode(columnCount + 1));

		for (let i = 0; i < rowCount; i++) {
			preCell = document.getElementById("arr_col-" + (columnCount - 1) + "_row-" + i);
			let td = document.createElement("TD");
			td.id = "arr_col-" + columnCount + "_row-" + i;
			preCell.after(td);
		}

		columnCount++;
	}

	function removeColumn() {
		let cell = document.getElementById("arr_col-" + (columnCount - 1) + "_header");;
		cell.remove();

		for (let i = 0; i < rowCount; i++) {
			cell = document.getElementById("arr_col-" + (columnCount - 1) + "_row-" + i);
			cell.remove();
		}

		columnCount--;
	}

	function calcSongLength() {
		let song = songObj.song;
		for (let i = song.length - 1; i >= 0; i--) {
			if (i < 24)
				return 24;

			for (let j = 0; j < song[i].length; j++)
				if (song[i][j])
					return i + 1;
		}
	}

	function clearSongView() {
		sideCells = [];
		rowCount = 0;
		columnCount = 32;
		songLength = 24;

		table.innerHTML = "";
		buildGridHeader();
	}

	this.fillSongView = function () {
		clearSongView();

		let newSongLen = calcSongLength();
		console.log("import length: " + newSongLen);

		for (let i = 0; i < songObj.patterns.length; i++)
			addRow(songObj.patterns[i].name);

		if (newSongLen > songLength) {
			for (let i = songLength; i < newSongLen; i++) {
				addColumn();
			}
			songLength = newSongLen;
		}

		for (let i = songObj.song.length; i < columnCount; i++) {
			songObj.song.push([]);
		}

		for (let i = 0; i < songObj.song.length; i++) {
			for (let j = 0; j < songObj.song[i].length; j++) {
				if (songObj.song[i][j]) {
					let e = document.getElementById("arr_col-" + i + "_row-" + j);
					e.classList.add("fill");
					drawBlock(i, j, true)
				}
			}
		}
	}
}