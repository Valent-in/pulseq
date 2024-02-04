"use strict";

function ArrangeUi(songObj, onPatternSelectCallback, defaults) {
	const aheadSpace = defaults.emptyBarsBuffer; //8
	const minColumnCount = defaults.minSongBars; //32
	const maxPatternSteps = defaults.maxPatternSteps; //64

	let rowCount = 0;
	let columnCount = 0;

	let playbackMarkers = [];
	let previousMarker = 0;

	let loopStartPoint = null;
	let loopEndPoint = null;
	let loopStartIndex = -1;
	let loopLength = 0;

	let pressTimeout = null;
	let cancelClick = false;

	let table = document.createElement("TABLE");

	table.oncontextmenu = () => false;
	table.addEventListener("click", arrangeEventListener);
	table.addEventListener("pointerdown", pointerdownListener);

	table.addEventListener("pointerup", pointerEndListener);
	table.addEventListener("pointercancel", pointerEndListener);
	table.addEventListener("pointerleave", pointerEndListener);
	table.addEventListener("touchend", pointerEndListener);

	function pointerEndListener() {
		clearTimeout(pressTimeout);
		pressTimeout = null;
	}

	document.getElementById("button-add-pattern").onclick = () => {
		let defaultName = songObj.generatePatternName();
		showPrompt("Enter pattern name", (result) => {

			if (!result) {
				showToast("Pattern NOT created");
				return;
			}

			songObj.patterns[rowCount] = new Pattern(result, songObj.barSteps);
			addRow(result);
			showPattern(rowCount - 1);
			g_scrollToLastPatten();
		}, defaultName);
	};

	const insertColumns = (startPoint, length) => {
		let ins = [];
		for (let i = 0; i < length; i++)
			ins.push([]);

		songObj.song.splice(startPoint, 0, ...ins);
		this.fillSongView();
	}

	const spliceColumns = (startPoint, length) => {
		for (let i = 0; i < songObj.patterns.length; i++) {
			let patternBars = Math.ceil(songObj.patterns[i].length / songObj.barSteps);

			for (let j = startPoint; j >= Math.max(0, startPoint - patternBars + 1); j--)
				if (songObj.song[j][i])
					songObj.song[j][i] = false;
		}

		songObj.song.splice(startPoint, length);
		this.fillSongView();
	}

	this.build = function () {
		let arrange = document.getElementById("arrange-main");
		arrange.appendChild(table);

		document.getElementById("column-modal-menu").oncontextmenu = () => false;

		document.getElementById("button-column-menu-close").onclick = () => {
			hideModal("column-modal-menu");
		}

		document.getElementById("button-insert-columns").onclick = () => {
			hideModal("column-modal-menu");

			showPrompt("Insert columns:", result => {
				if (result === null || result === 0)
					return;

				let length = Math.floor(result);
				if (length > 0 && length < 500)
					insertColumns(songObj.arrangeStartPoint, length)
				else
					showAlert("Can not insert columns");
			}, 1, "number");
		}

		document.getElementById("button-remove-columns").onclick = () => {
			hideModal("column-modal-menu");

			showPrompt("Delete columns:", result => {
				if (result === null || result === 0)
					return;

				let length = Math.floor(result);
				if (length > 0 && length < 500)
					spliceColumns(songObj.arrangeStartPoint, length)
				else
					showAlert("Can not delete columns");
			}, 1, "number");
		}
	}

	this.setMarker = function (index) {
		if (playbackMarkers[previousMarker])
			playbackMarkers[previousMarker].style.backgroundColor = "#111";

		if (index >= 0 && index < playbackMarkers.length) {
			playbackMarkers[index].style.backgroundColor = "#696969";
			previousMarker = index;
		}
	}

	this.setLoopMarkers = function (startIndex, length) {
		if (startIndex !== undefined) {
			loopStartIndex = startIndex;
			loopLength = length || 0;
		}

		if (loopStartIndex == -1) {
			if (loopStartPoint) {
				loopStartPoint.classList.remove("loop-start-point");
				loopStartPoint = null;
			}

			if (loopEndPoint) {
				loopEndPoint.classList.remove("loop-end-point");
				loopEndPoint = null;
			}
		} else {
			let endIndex = loopStartIndex + loopLength - 1;

			loopStartPoint = document.getElementById("arr_col-" + loopStartIndex + "_header");
			if (loopStartPoint)
				loopStartPoint.classList.add("loop-start-point");

			loopEndPoint = document.getElementById("arr_col-" + endIndex + "_header");
			if (loopEndPoint)
				loopEndPoint.classList.add("loop-end-point");
		}
	};

	this.fillSongView = function () {
		clearSongView();

		let newSongLen = songObj.song.length;
		console.log("Track length: " + newSongLen + " bars");

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

		fitGridLength();
		markDisabledCells(0, songObj.song.length - 1);
		g_markCurrentPattern();
		this.setLoopMarkers();
	}

	const reorderMenu = new ReorderMenu(songObj, this.fillSongView.bind(this));

	function maxPatternBars() {
		return Math.ceil(maxPatternSteps / songObj.barSteps);
	}

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
		if (cancelClick)
			return;

		let tgt = event.target;
		if (tgt.nodeName != "TD")
			return;

		if (tgt.id == "arr_corner") {
			reorderMenu.showMenu();
			return;
		}

		let idParts = tgt.id.split("_");
		let col = Number(idParts[1].split("-")[1]);
		let row = Number(idParts[2].split("-")[1]);

		if (tgt.id.includes("header")) {
			setArrangeStartPoint(col);
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

	function pointerdownListener(event) {
		cancelClick = false;
		let tgtId = event.target.id;
		if (!tgtId.includes("header"))
			return;

		pressTimeout = setTimeout(() => {
			cancelClick = true;

			let idParts = tgtId.split("_");
			let col = Number(idParts[1].split("-")[1]);
			setArrangeStartPoint(col);

			updateTimerView();
			showModal("column-modal-menu");
		}, 400);
	}

	function updateTimerView() {
		let timers = document.getElementById("timers-area");
		timers.innerHTML = "";
		let span = document.createElement("SPAN");
		let timeString = songObj.getStartPointTime() + " / " + songObj.getEndPointTime();
		span.appendChild(document.createTextNode(timeString));
		timers.appendChild(span);
	}

	function setArrangeStartPoint(col) {
		let prev = document.getElementById("arr_col-" + songObj.arrangeStartPoint + "_header");
		if (prev)
			prev.classList.remove("play-start-point");

		songObj.arrangeStartPoint = col;
		let next = document.getElementById("arr_col-" + col + "_header");
		next.classList.add("play-start-point");
	}

	function setArrangeBlock(col, row, targetCell) {
		let startPoint = col;

		if (songObj.song[col][row]) {
			songObj.song[col][row] = false;
			drawBlock(col, row, false);
		} else {
			if (targetCell.classList.contains("js-fill-tail")) {

				while (!songObj.song[startPoint][row])
					startPoint--;

				songObj.song[startPoint][row] = false;
				drawBlock(startPoint, row, false);
			} else {
				let len = Math.ceil(songObj.patterns[row].length / songObj.barSteps);
				for (let i = col; i < Math.min(col + len, songObj.song.length); i++) {
					if (songObj.song[i][row]) {
						showToast("Can not insert block - no room");
						return;
					}
				}

				if (songObj.checkSynthConflict(row, col)) {
					console.log("Pattern with same synth present in this bar.");
					showToast("Can not insert block - conflict with other cells");
					return;
				}

				songObj.song[col][row] = true;
				if (col >= songObj.song.length - aheadSpace - maxPatternBars())
					fitGridLength();

				drawBlock(col, row, true);
			}
		}

		let addBars = Math.ceil(songObj.patterns[row].length / songObj.barSteps) - 1;
		markDisabledCells(startPoint, startPoint + addBars);
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

		if (songObj.arrangeStartPoint >= songObj.song.length)
			setArrangeStartPoint(0);
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

		if (songObj.patterns[rowCount])
			tr.classList.add("color-index-" + songObj.patterns[rowCount].colorIndex);

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

	function markDisabledCells(startPoint, endPoint) {
		songObj.calculateSynthFill();
		for (let i = startPoint; i <= endPoint; i++) {
			for (let j = 0; j < songObj.patterns.length; j++) {
				let cell = document.getElementById("arr_col-" + i + "_row-" + j);

				if (!songObj.isArrangeCellFree(i, j)) {
					cell.classList.add("non-free-cell");
				} else {
					cell.classList.remove("non-free-cell");
				}
			}
		}
	}
}