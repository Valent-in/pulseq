"use strict"

function PatternUi(songObj, assignSynthCallback) {
	let pattern = document.getElementById("pattern-main");
	let table = document.createElement("TABLE");
	let noteArr = DEFAULT_PARAMS.noteSet.slice().reverse();
	this.length = 64;

	let patternObj = {};

	this.build = function () {
		pattern.addEventListener("click", sequencerCellListener);

		for (let i = 0; i < 73; i++) {
			let tr = document.createElement("TR");
			table.appendChild(tr);
			for (let j = 0; j < 65; j++) {
				let td = document.createElement("TD");

				if (i == 0 && j == 0)
					td.id = "note-length-control";

				if (i == 0 && j > 0)
					td.id = "seq_header_col-" + (j - 1);

				if (i == 0 && (j - 1) % 4 == 0)
					td.appendChild(document.createTextNode(j));

				if (i > 0 && j == 0)
					if (noteArr[i - 1].indexOf("b") != -1) {
						td.classList.add("pattern-black-key");
					} else {
						td.appendChild(document.createTextNode(noteArr[i - 1]));
					}


				if (i > 0 && j > 0) {
					td.id = "seq_col-" + (j - 1) + "_row-" + (i - 1);
					td.dataset.note = noteArr[i - 1];
				}

				tr.appendChild(td);
			}
		}

		pattern.appendChild(table);


		let lControl = document.getElementById("note-length-control");
		lControl.addEventListener("click", (e) => {
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

			classListCheck(e.target);
			e.target.classList.add("fill-" + lengthMod);
		})

	}

	let sequenceNotes = [];
	let sequenceLengths = [];
	let sequenceElementRows = [];
	let shadowNotes = [];
	for (let i = 0; i < 64; i++) {
		sequenceNotes[i] = null;
		sequenceElementRows[i] = null;
		sequenceLengths[i] = 0;
		shadowNotes[i] = null;
	}

	this.data = {
		notes: sequenceNotes,
		lengths: sequenceLengths
	}

	let btnLength = document.getElementById("buttorn-pattern-length");
	btnLength.addEventListener("click", () => {
		let lenValue = document.getElementById("pattern-length-value").value;
		let len = Number(lenValue);
		this.setLength(len);

		sequenceNotes.length = len;
		sequenceLengths.length = len;
		patternObj.length = len;
	})


	let lengthMod = "75";
	function sequencerCellListener(event) {
		//console.log(event.target);
		let tgt = event.target;
		if (tgt.nodeName == "TD" && tgt.id.includes("seq_")) {
			//tgt.classList.toggle("fill-" + lengthMod);
			let idParts = tgt.id.split("_");
			let col = Number(idParts[1].split("-")[1]);
			let row = Number(idParts[2].split("-")[1]);
			let note = tgt.dataset.note;
			//console.log(col,row,note);

			if (!classListCheck(tgt)) {
				tgt.classList.add("fill-" + lengthMod);

				if (sequenceNotes[col]) {
					let checked = document.getElementById("seq_col-" + col + "_row-" + sequenceElementRows[col]);
					classListCheck(checked);
				}

				sequenceNotes[col] = note;
				sequenceLengths[col] = Number(lengthMod);
				sequenceElementRows[col] = row;
				//seq.events = sequenceNotes;
				//console.log(note,row,col)
			} else {
				sequenceNotes[col] = null;
				sequenceElementRows[col] = null;
				sequenceLengths[col] = 0;
				//seq.events = sequenceNotes;
			}
		}
	}

	function classListCheck(element) {
		if (!element)
			return;

		let lengths = ["25", "50", "75", "100", "125"];

		for (let e of lengths) {
			if (element.classList.contains("fill-" + e)) {
				element.classList.remove("fill-" + e);
				return true;
			}
		}

		return false;
	}

	this.setLength = function (len) {
		this.length = len;

		if (sequenceNotes.length > len)
			for (let i = len; i < sequenceNotes.length; i++) {
				if (sequenceNotes[i]) {
					let cell = document.getElementById("seq_col-" + i + "_row-" + sequenceElementRows[i]);
					cell.classList.remove("fill-" + sequenceLengths[i])
				}
			}

		for (let i = 0; i < 72; i++)
			for (let j = 0; j < Math.max(len, sequenceNotes.length); j++) {
				let cell = document.getElementById("seq_col-" + j + "_row-" + i);
				//console.log("seq_col-" + j + "_row-" + i)
				if (j < len)
					cell.style.display = "table-cell";
				else
					cell.style.display = "none";
			}

		for (let j = 1; j < Math.max(len, sequenceNotes.length); j++) {
			let cell = document.getElementById("seq_header_col-" + j);
			//console.log("seq_header_col-" + j)
			if (j < len)
				cell.style.display = "table-cell";
			else
				cell.style.display = "none";
		}
	}

	function findRowByNote(note) {
		for (let i = 0; i < noteArr.length; i++)
			if (noteArr[i] == note)
				return i;

		return -1;
	}

	this.exportData = function () {
		let data = {
			notes: sequenceNotes,
			lengths: sequenceLengths
		}

		return data;
	}

	this.importData = function (data) {
		for (let i = 0; i < sequenceNotes.length; i++) {
			if (sequenceNotes[i] === null)
				continue;

			let row = findRowByNote(sequenceNotes[i])
			let cell = document.getElementById("seq_col-" + i + "_row-" + row);
			if (cell)
				cell.classList.remove("fill-" + sequenceLengths[i]);
		}

		sequenceNotes = data.notes;
		sequenceLengths = data.lengths;

		//console.log(sequenceLengths);

		sequenceElementRows = [];
		for (let i = 0; i < 72; i++)
			sequenceElementRows[i] = null;

		for (let i = 0; i < sequenceNotes.length; i++) {
			if (sequenceNotes[i] === null)
				continue;

			let row = findRowByNote(sequenceNotes[i])
			sequenceElementRows[i] = row;
			let cell = document.getElementById("seq_col-" + i + "_row-" + row);
			if (cell)
				cell.classList.add("fill-" + sequenceLengths[i]);
		}

		this.data = {
			notes: sequenceNotes,
			lengths: sequenceLengths
		}
	}


	this.importShadowData = function (dataArr, excludeIndex) {
		//console.log(dataArr)
		for (let i = 0; i < 64; i++)
			for (let j = 0; j < 64; j++) {

				let cell = document.getElementById("seq_col-" + i + "_row-" + j);
				if (cell)
					cell.classList.remove("mark-shadow");
			}

		//console.log(sequenceLengths);
		for (let i = 0; i < dataArr.length; i++) {
			if (i == excludeIndex)
				continue;


			for (let j = 0; j < dataArr[i].notes.length; j++) {
				if (dataArr[i][j] === null)
					continue;

				let row = findRowByNote(dataArr[i].notes[j])
				//console.log(dataArr[i].notes[j], j,row);
				let cell = document.getElementById("seq_col-" + j + "_row-" + row);
				if (cell)
					cell.classList.add("mark-shadow");

			}
		}
	}

	this.importSequence = (data) => {
		patternObj = data;

		if (data.length)
			this.setLength(data.length);

		let dataArr = data.patternData;
		let currentIndex = data.activeIndex;
		this.importData(dataArr[currentIndex]);
		this.importShadowData(dataArr, currentIndex);

		let index = songObj.currentPattern.activeIndex;
		let synthIndex = songObj.currentPattern.patternData[index].synthIndex;
		if (synthIndex !== null)
			assignSynthCallback(songObj.synthParams[synthIndex], songObj.synths[synthIndex], songObj.synthNames[synthIndex]);
	}


	// Sequencer footer (pattern synth tabs)
	let addLayer = document.getElementById("button-add-pattern-layer");
	addLayer.addEventListener("click", () => {
		songObj.synthAssignMode = true;
		document.getElementById("pattern-view").classList.add("hidden");
		document.getElementById("synth-select-view").classList.remove("hidden");
	})

	let active = null;
	const patternLayerTabListener = (event) => {

		if (active)
			active.classList.remove("tab--active");

		event.target.classList.add("tab--active");
		active = event.target;
		let index = Number(event.target.dataset.index);
		songObj.currentPattern.activeIndex = index;

		this.importSequence(songObj.currentPattern);
	}

	this.rebuildPatternSynthList = function (pattern) {
		let addLayerBtn = document.getElementById("button-add-pattern-layer");
		let patternTabs = document.querySelectorAll(".js-pattern-synth-tab");
		patternTabs.forEach(e => e.remove());

		for (let i = 0; i < pattern.patternData.length; i++) {

			if (pattern.patternData[i].synthIndex === null)
				break;

			let index = pattern.patternData[i].synthIndex;
			let tab = document.createElement("DIV");
			tab.appendChild(document.createTextNode(songObj.synthNames[index]));
			tab.dataset.index = i;

			if (i == pattern.activeIndex) {
				active = tab;
				tab.classList.add("tab--active");
			}

			tab.classList.add("js-pattern-synth-tab");
			addLayerBtn.before(tab);
			tab.addEventListener("click", patternLayerTabListener);
		}
	}
}
