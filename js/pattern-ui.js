"use strict"

function PatternUi(songObj, assignSynthCallback) {
	let noteArr = DEFAULT_PARAMS.noteSet.slice().reverse();

	let lengthMod = "75";
	let patternObj = {};
	let patternLength = 64;

	let dragStartRow = 0;
	let dragStartCol = 0;
	let pointerPress = false;
	let pressTimeout = 0;
	let cancelClick = false;

	let patternName = document.getElementById("pattern-name-area");
	let pattern = document.getElementById("pattern-main");
	let table = document.createElement("TABLE");

	table.oncontextmenu = () => false;

	table.addEventListener("pointerdown", (e) => {
		if (e.target.nodeName != "TD" || !e.target.id.includes("_row-") || e.which == 2)
			return;

		pointerPress = true;
		cancelClick = false;

		let coords = getCellCoordinates(e.target);
		dragStartCol = coords.col;
		dragStartRow = coords.row;

		pressTimeout = setTimeout(() => {
			cancelClick = true;
			pointerPress = false;

			if (getNoteByColumn(dragStartCol) && getNoteByColumn(dragStartCol) == noteArr[dragStartRow])
				clearLineOfNotes();
			else
				setLineOfNotes();
		}, 400)
	});

	table.addEventListener("click", (e) => {
		if (e.target.nodeName != "TD" || !e.target.id.includes("_row-") || e.which == 2)
			return;

		if (!cancelClick)
			sequencerCellListener(e.target);

		pointerPress = false;
	});

	table.addEventListener("pointerover", (e) => {
		if (!pointerPress)
			return

		if (e.target.nodeName != "TD" || !e.target.id.includes("_row-") || e.which == 2)
			return;

		clearTimeout(pressTimeout);

		let { col } = getCellCoordinates(e.target);
		redrawLine(col);
		for (let i = Math.min(dragStartCol, col); i <= Math.max(dragStartCol, col); i++) {
			setNoteAtColumn(noteArr[dragStartRow], i);
			setNoteLengthAtColumn(lengthMod, i);
		}

		cancelClick = true;
	});

	table.addEventListener("pointerup", pointerEndListener);
	table.addEventListener("pointercancel", pointerEndListener);
	table.addEventListener("touchend", pointerEndListener);


	function pointerEndListener() {
		pointerPress = false;
		clearTimeout(pressTimeout);
	}

	function getCellCoordinates(cell) {
		let idParts = cell.id.split("_");
		return {
			col: Number(idParts[1].split("-")[1]),
			row: Number(idParts[2].split("-")[1])
		};
	}

	function getNoteByColumn(col) {
		return songObj.currentPattern.patternData[songObj.currentPattern.activeIndex].notes[col];
	}

	function getNoteLengthByColumn(col) {
		return songObj.currentPattern.patternData[songObj.currentPattern.activeIndex].lengths[col];
	}

	function setNoteAtColumn(note, col) {
		songObj.currentPattern.patternData[songObj.currentPattern.activeIndex].notes[col] = note;
	}

	function setNoteLengthAtColumn(length, col) {
		songObj.currentPattern.patternData[songObj.currentPattern.activeIndex].lengths[col] = Number(length);
	}

	this.build = function () {
		for (let i = 0; i <= DEFAULT_PARAMS.noteSet.length; i++) {
			let tr = document.createElement("TR");
			table.appendChild(tr);
			for (let j = 0; j < 65; j++) {
				let td = document.createElement("TD");

				if (i == 0 && j == 0) {
					td.id = "note-length-control";
					td.classList.add("fill-" + lengthMod);
				}

				if (i == 0 && j > 0)
					td.id = "seq_col-" + (j - 1) + "_header";

				if (i == 0 && (j - 1) % 4 == 0)
					td.appendChild(document.createTextNode(j));

				if (i > 0 && j == 0)
					if (noteArr[i - 1].includes("b")) {
						td.classList.add("pattern-black-key");
					} else {
						td.appendChild(document.createTextNode(noteArr[i - 1]));
					}

				if (i > 0 && j > 0) {
					td.id = "seq_col-" + (j - 1) + "_row-" + (i - 1);
				}

				tr.appendChild(td);
			}
		}

		pattern.appendChild(table);

		let lControl = document.getElementById("note-length-control");
		lControl.addEventListener("click", (e) => {
			e.target.classList.remove("fill-" + lengthMod);

			switch (lengthMod) {
				case "25":
					lengthMod = "50";
					break;
				case "50":
					lengthMod = "75";
					break;
				case "75":
					lengthMod = "100";
					break;
				case "100":
					lengthMod = "125";
					break;
				case "125":
					lengthMod = "25";
					break;
			}

			e.target.classList.add("fill-" + lengthMod);
		})
	}

	document.getElementById("button-pattern-length-set").onclick = () => {
		let lenValue = document.getElementById("input-pattern-length").value;
		let len = Number(lenValue);
		this.setLength(len);

		for (let seq of patternObj.patternData) {
			seq.notes.length = len;
			seq.lengths.length = len;
		}

		if (patternObj) {
			patternObj.length = len;
			this.importSequence(patternObj);
		}
	};

	function setLineOfNotes() {
		let col = dragStartCol;
		let snote = noteArr[dragStartRow];
		for (let i = col; i >= 0; i--) {
			if (getNoteByColumn(i) == snote) {
				col = i;
				break;
			}
		}

		redrawLine(col);
		for (let i = col; i <= dragStartCol; i++) {
			setNoteAtColumn(snote, i);
			setNoteLengthAtColumn(lengthMod, i);
		}
	}

	function clearLineOfNotes() {
		let col = dragStartCol;
		let snote = noteArr[dragStartRow];
		for (let i = col; i < patternLength; i++) {
			if (getNoteByColumn(i) != snote) {
				break;
			}
			col = i;
		}

		clearLine(col);
		for (let i = dragStartCol; i <= col; i++) {
			setNoteAtColumn(null, i);
			setNoteLengthAtColumn(0, i);
		}
	}

	function redrawLine(col) {
		for (let i = 0; i < patternLength; i++) {

			let note = getNoteByColumn(i);
			let row = findRowByNote(note);
			let prevCell = document.getElementById("seq_col-" + i + "_row-" + row);

			let nextCell = document.getElementById("seq_col-" + i + "_row-" + dragStartRow);

			if (i >= Math.min(dragStartCol, col) && i <= Math.max(dragStartCol, col)) {
				if (prevCell)
					prevCell.classList.remove("fill-" + getNoteLengthByColumn(i));
				nextCell.classList.add("fill-" + lengthMod);
			} else {
				nextCell.classList.remove("fill-" + lengthMod);
				if (prevCell)
					prevCell.classList.add("fill-" + getNoteLengthByColumn(i));
			}
		}
	}

	function clearLine(col) {
		for (let i = 0; i < patternLength; i++) {

			let note = getNoteByColumn(i);
			let row = findRowByNote(note);
			let cell = document.getElementById("seq_col-" + i + "_row-" + row);

			if (i >= Math.min(dragStartCol, col) && i <= Math.max(dragStartCol, col)) {
				if (cell)
					cell.classList.remove("fill-" + getNoteLengthByColumn(i));
			}
		}
	}

	function sequencerCellListener(tgt) {
		let { col, row } = getCellCoordinates(tgt);
		let note = noteArr[row];
		let prevNote = getNoteByColumn(col);

		if (prevNote == note) {
			tgt.classList.remove("fill-" + getNoteLengthByColumn(col))
			setNoteAtColumn(null, col);
			setNoteLengthAtColumn(0, col);
		} else {
			if (prevNote) {
				let prevRow = findRowByNote(prevNote);
				let prevCell = document.getElementById("seq_col-" + col + "_row-" + prevRow);
				prevCell.classList.remove("fill-" + getNoteLengthByColumn(col));
			}

			tgt.classList.add("fill-" + lengthMod);
			setNoteAtColumn(note, col);
			setNoteLengthAtColumn(lengthMod, col);
		}
	}

	this.setLength = function (len) {
		for (let i = 0; i < DEFAULT_PARAMS.noteSet.length; i++) {
			for (let j = 0; j < Math.max(len, patternLength); j++) {
				let cell = document.getElementById("seq_col-" + j + "_row-" + i);

				if (j < len)
					cell.style.display = "table-cell";
				else
					cell.style.display = "none";
			}
		}

		for (let j = 1; j < Math.max(len, patternLength); j++) {
			let cell = document.getElementById("seq_col-" + j + "_header");
			if (j < len)
				cell.style.display = "table-cell";
			else
				cell.style.display = "none";
		}

		patternLength = len;
	}

	function findRowByNote(note) {
		for (let i = 0; i < noteArr.length; i++)
			if (noteArr[i] == note)
				return i;

		return -1;
	}

	function importData(data) {
		for (let i = 0; i < data.notes.length; i++) {
			if (data.notes[i] === null)
				continue;

			let row = findRowByNote(data.notes[i])
			let cell = document.getElementById("seq_col-" + i + "_row-" + row);
			if (cell)
				cell.classList.add("fill-" + data.lengths[i]);
		}
	}

	function importShadowData(dataArr, excludeIndex) {
		for (let i = 0; i < dataArr.length; i++) {
			if (i == excludeIndex)
				continue;

			for (let j = 0; j < dataArr[i].notes.length; j++) {
				if (dataArr[i][j] === null)
					continue;

				let row = findRowByNote(dataArr[i].notes[j])
				let cell = document.getElementById("seq_col-" + j + "_row-" + row);
				if (cell)
					cell.classList.add("mark-shadow");
			}
		}
	}

	this.clearGrid = function () {
		for (let className of ["mark-shadow", "fill-25", "fill-50", "fill-75", "fill-100", "fill-125",]) {
			document.querySelectorAll("." + className).forEach(e => {
				if (e.id != "note-length-control")
					e.classList.remove(className);
			});
		}
	}

	this.importSequence = (data) => {
		patternObj = data;

		if (data.length)
			this.setLength(data.length);

		let dataArr = data.patternData;
		let currentIndex = data.activeIndex;

		this.clearGrid();
		importData(dataArr[currentIndex]);
		importShadowData(dataArr, currentIndex);

		patternName.innerHTML = "";
		patternName.appendChild(document.createTextNode(data.name));
	}


	// Sequencer footer (pattern synth tabs)
	const patternLayerTabListener = (event) => {
		let activeLayerTab = document.querySelectorAll(".js-pattern-synth-tab.tab--active")[0];
		if (activeLayerTab)
			activeLayerTab.classList.remove("tab--active");

		event.target.classList.add("tab--active");
		let index = Number(event.target.dataset.index);
		songObj.currentPattern.activeIndex = index;

		this.importSequence(songObj.currentPattern);

		let synthIndex = songObj.currentPattern.patternData[index].synthIndex;
		if (synthIndex !== null)
			assignSynthCallback(songObj.synthParams[synthIndex], songObj.synths[synthIndex], songObj.synthNames[synthIndex]);
	}

	this.rebuildPatternSynthList = function (pattern) {
		let addLayerBtn = document.getElementById("button-add-pattern-layer");
		let patternTabs = document.querySelectorAll(".js-pattern-synth-tab");
		patternTabs.forEach(e => e.remove());

		if (pattern.patternData.length == 1 && pattern.patternData[0].synthIndex === null)
			return;

		for (let i = 0; i < pattern.patternData.length; i++) {
			let index = pattern.patternData[i].synthIndex;
			let tab = document.createElement("DIV");

			let name;
			if (index === null)
				name = "[none]";
			else
				name = songObj.synthNames[index];

			tab.appendChild(document.createTextNode(name));
			tab.dataset.index = i;

			if (i == pattern.activeIndex)
				tab.classList.add("tab--active");

			tab.classList.add("js-pattern-synth-tab");
			addLayerBtn.before(tab);
			tab.addEventListener("click", patternLayerTabListener);
		}
	}
}
