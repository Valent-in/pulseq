"use strict";

function PatternUi(songObj, assignSynthCallback) {
	const maxSequencerLength = DEFAULT_PARAMS.maxPatternSteps;
	let sequencerLength = maxSequencerLength;

	let noteArr = DEFAULT_PARAMS.noteSet.slice().reverse();

	let lengthMod = 75;
	let volumeMod = 0;

	let dragStartRow = 0;
	let dragStartCol = 0;

	let pointerPress = false;
	let pressTimeout = 0;
	let cancelClick = false;

	let barLength = 0;
	let velocityStep = 12;

	let autoRow, filterControls;
	let noFilter = true;
	let automationFreqMod = 3.5;
	let automationQMod = 15;
	const autoFreqScale = 26 / 5;
	const autoQscale = 26 / 50;

	let sequenceCells = [];
	let automationCells = [];
	for (let i = 0; i < maxSequencerLength; i++) {
		sequenceCells.push({});
		automationCells.push({});
	}

	let playbackMarkers = [];
	let previousMarker = 0;

	let isSidekeyPalying = false;
	let lastSideKey;

	let patternName = document.getElementById("pattern-name-area");
	let pattern = document.getElementById("pattern-main");

	let volumeControl = document.createElement("DIV");
	volumeControl.id = "note-volume-control";

	let table = document.createElement("TABLE");
	table.oncontextmenu = () => false;

	table.addEventListener("pointerdown", (e) => {
		if (e.target.nodeName != "TD" || e.button == 1)
			return;

		if (!e.target.id.includes("_row-")) {
			if (e.target.dataset.note) {
				let synth = getSynthFromLayer();
				if (synth) {
					if (lastSideKey)
						lastSideKey.classList.remove("key--pressed");

					let stepLen = (60 / songObj.bpm) / 4;
					synth.triggerAttack(e.target.dataset.note, 0, Tone.now(), stepLen);
					isSidekeyPalying = true;
					lastSideKey = e.target;
					lastSideKey.classList.add("key--pressed");
				}
			}

			return;
		}

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
		if (e.target.nodeName != "TD" || !e.target.id.includes("_row-") || e.button == 1)
			return;

		if (!cancelClick)
			sequencerCellListener(e.target);

		pointerPress = false;
	});

	table.addEventListener("pointerover", (e) => {
		if (!pointerPress)
			return

		if (e.target.nodeName != "TD" || !e.target.id.includes("_row-") || e.button == 1)
			return;

		clearTimeout(pressTimeout);
		pressTimeout = null;

		let { col } = getCellCoordinates(e.target);

		let startCol = Math.min(dragStartCol, col);
		let endCol = Math.max(dragStartCol, col);
		let fillBlock = dragStartCol > col ? lengthMod : 100;

		clearLine(col);
		for (let i = startCol; i <= endCol; i++) {
			setNoteAtColumn(noteArr[dragStartRow], i);
			setNoteLengthAtColumn(i == endCol ? lengthMod : fillBlock, i);
			setNoteVolumeAtColumn(volumeMod, i);
		}
		redrawLine();

		cancelClick = true;
	});

	table.addEventListener("pointerup", pointerEndListener);
	table.addEventListener("pointercancel", pointerEndListener);
	table.addEventListener("pointerleave", pointerEndListener);
	table.addEventListener("touchend", pointerEndListener);

	volumeControl.addEventListener("click", (event) => {
		let fullWidth = event.target.clientWidth;

		if (event.offsetX < fullWidth / 2) {
			volumeMod -= velocityStep;
			volumeMod = Math.ceil(volumeMod / velocityStep) * velocityStep;
		} else {
			volumeMod += velocityStep;
			volumeMod = Math.floor(volumeMod / velocityStep) * velocityStep;
		}

		let minVelocity = Math.ceil(-90 / velocityStep) * velocityStep

		if (volumeMod > 0)
			volumeMod = minVelocity;

		if (volumeMod < minVelocity)
			volumeMod = 0;

		let shadow = "inset " + Math.round(fullWidth * volumeMod / 100 - 1) + "px 0 0 0 #111";
		event.target.style.boxShadow = shadow;
	});


	this.build = function () {
		document.getElementById("input-more-velosteps").onchange = (e) => {
			if (e.target.checked)
				velocityStep = 6;
			else
				velocityStep = 12;

			showToast((8 * 12 / velocityStep) + " levels for note volume control")
		}

		let lControl;

		for (let i = 0; i <= DEFAULT_PARAMS.noteSet.length; i++) {
			let tr = document.createElement("TR");
			table.appendChild(tr);
			for (let j = 0; j <= maxSequencerLength; j++) {
				let td = document.createElement("TD");

				if (i == 0 && j == 0) {
					lControl = document.createElement("DIV");
					lControl.id = "note-length-control";
					lControl.classList.add("control-fill-" + lengthMod);
					td.appendChild(lControl);
				}

				if (i == 0 && j > 0)
					playbackMarkers.push(td);

				if (i == 0 && (j - 1) % 4 == 0 && j > 1)
					td.appendChild(document.createTextNode(j));

				if (i > 0 && j == 0) {
					td.dataset.note = noteArr[i - 1];

					if (noteArr[i - 1] == "C4")
						td.classList.add("c4-key-mark");

					if (noteArr[i - 1].includes("b"))
						td.classList.add("pattern-black-key");
					else if (i > 1 && i < DEFAULT_PARAMS.noteSet.length)
						td.appendChild(document.createTextNode(noteArr[i - 1]));
				}

				if (i > 0 && j > 0) {
					td.id = "seq_col-" + (j - 1) + "_row-" + (i - 1);
				}

				tr.appendChild(td);

				if (i == 0 && j == maxSequencerLength) {
					let tdl = document.createElement("TD");
					tdl.id = "seq-volume-cell";
					tdl.appendChild(volumeControl);
					tr.appendChild(tdl);
				}
			}
		}

		lControl.addEventListener("click", (event) => {
			lControl.classList.remove("control-fill-" + lengthMod);

			let fullWidth = event.target.clientWidth;
			if (event.offsetX < fullWidth / 2)
				lengthMod -= 25;
			else
				lengthMod += 25;

			if (lengthMod > 100)
				lengthMod = 25;

			if (lengthMod < 25)
				lengthMod = 100;

			lControl.classList.add("control-fill-" + lengthMod);
		});

		buildAutomationRow();
		pattern.appendChild(table);
	}

	this.setMarker = function (index) {
		playbackMarkers[previousMarker].style.backgroundColor = "#111";
		if (index >= 0 && index < playbackMarkers.length) {
			playbackMarkers[index].style.backgroundColor = "#696969";
			previousMarker = index;
		}
	}

	this.setLength = function (len) {
		if (sequencerLength == len)
			return;

		for (let i = 0; i < DEFAULT_PARAMS.noteSet.length; i++) {
			for (let j = 0; j < Math.max(len, sequencerLength); j++) {
				let cell = document.getElementById("seq_col-" + j + "_row-" + i);

				if (j < len)
					cell.style.display = "table-cell";
				else
					cell.style.display = "none";
			}
		}

		for (let j = 1; j < Math.max(len, sequencerLength); j++) {
			let cellh = playbackMarkers[j];
			let cellf = automationCells[j].cell;
			if (j < len) {
				cellh.style.display = "table-cell";
				cellf.style.display = "table-cell";
			} else {
				cellh.style.display = "none";
				cellf.style.display = "none";
			}
		}

		sequencerLength = len;
	}

	this.clearGrid = function () {
		let classNames = ["shade"];
		for (let className of classNames) {
			document.querySelectorAll("." + className).forEach(e => {
				if (e.id != "note-length-control")
					e.classList.remove(className);
			});
		}

		for (let i = 0; i < sequenceCells.length; i++) {
			if (sequenceCells[i].len)
				clearCell(i, sequenceCells[i].row);
		}
	}

	this.importSequence = (data) => {
		if (data.length)
			this.setLength(data.length);

		let dataArr = data.patternData;
		let currentIndex = data.activeIndex;

		this.clearGrid();
		importData(dataArr[currentIndex]);
		importShadowData(dataArr, currentIndex);
		updateBarSeparator();

		patternName.innerHTML = "";
		patternName.appendChild(document.createTextNode(data.name));
	}

	function pointerEndListener() {
		pointerPress = false;
		clearTimeout(pressTimeout);

		if (isSidekeyPalying) {
			isSidekeyPalying = false;

			let synth = getSynthFromLayer();
			if (synth)
				synth.triggerRelease();

			if (lastSideKey) {
				lastSideKey.classList.remove("key--pressed");
				lastSideKey = null;
			}
		}
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

	function getNoteVolumeByColumn(col) {
		return songObj.currentPattern.patternData[songObj.currentPattern.activeIndex].volumes[col];
	}

	function setNoteAtColumn(note, col) {
		songObj.currentPattern.patternData[songObj.currentPattern.activeIndex].notes[col] = note;
	}

	function setNoteLengthAtColumn(length, col) {
		songObj.currentPattern.patternData[songObj.currentPattern.activeIndex].lengths[col] = length;
	}

	function setNoteVolumeAtColumn(length, col) {
		songObj.currentPattern.patternData[songObj.currentPattern.activeIndex].volumes[col] = length;
	}

	function getSynthFromLayer() {
		let layerIndex = songObj.currentPattern.activeIndex;
		let synthIndex = songObj.currentPattern.patternData[layerIndex].synthIndex;

		return synthIndex === null ? null : songObj.synths[synthIndex];
	}

	function setCell(col, row, length, volume, cell) {
		if (!cell)
			cell = document.getElementById("seq_col-" + col + "_row-" + row);

		if (!cell)
			return;

		if (sequenceCells[col].len) {
			cell.classList.remove("fill-" + sequenceCells[col].len);
			cell.classList.remove("vol-" + sequenceCells[col].volume);
		}

		let stepVolume = Math.round(volume / 6) * 6;

		sequenceCells[col] = { row: row, len: length, volume: stepVolume };
		cell.classList.add("fill-" + length);
		cell.classList.add("vol-" + stepVolume);
	}

	function clearCell(col, row, cell) {
		if (!cell)
			cell = document.getElementById("seq_col-" + col + "_row-" + row);

		if (!cell)
			return;

		if (sequenceCells[col].len) {
			cell.classList.remove("fill-" + sequenceCells[col].len);
			cell.classList.remove("vol-" + sequenceCells[col].volume);
		}

		sequenceCells[col].len = 0;
	}

	function resetAutomationCell(col) {
		let synthIndex = songObj.currentPattern.patternData[songObj.currentPattern.activeIndex].synthIndex;
		let fHeight = 0;
		let qHeight = 0;

		if (synthIndex !== null) {
			let f = songObj.synths[synthIndex].filterFreqInput;
			fHeight = Math.round(autoFreqScale * f);

			let q = songObj.synths[synthIndex].values.filterQValue;
			qHeight = Math.round(autoQscale * q);
		}

		automationCells[col].fBar.style.height = fHeight + "px";
		automationCells[col].qBar.style.height = qHeight + "px";

		automationCells[col].cell.classList.remove("active");
	}

	function setAutomationCell(col, freq, q) {
		let height = Math.round(autoFreqScale * freq);
		automationCells[col].fBar.style.height = height + "px";

		height = Math.round(autoQscale * q);
		automationCells[col].qBar.style.height = height + "px";

		automationCells[col].cell.classList.add("active");
	}

	function buildAutomationRow() {
		autoRow = document.createElement("TR");
		autoRow.id = "pattern-auto-row";
		table.appendChild(autoRow);

		let fRange = document.createElement("INPUT");
		let qRange = document.createElement("INPUT");

		// Update automation row on pattern tab selection
		document.getElementById("pattern-tab").addEventListener("click", () => {
			redrawAutomationRow(songObj.currentPattern.patternData[songObj.currentPattern.activeIndex])
		});

		autoRow.addEventListener("click", (e) => {
			if (cancelClick)
				return;

			if (noFilter) {
				showToast("Filter is not set");
				return;
			}

			if (e.target.nodeName != "TD")
				return;

			if (e.target.id == "automation-levels-set") {
				filterControls.classList.toggle("nodisplay");
				return;
			}

			let index = Number(e.target.dataset.index);
			let layer = songObj.currentPattern.patternData[songObj.currentPattern.activeIndex];

			if (layer.filtQ[index] || layer.filtQ[index] === 0) {
				layer.filtQ[index] = null;
				layer.filtF[index] = null;
				resetAutomationCell(index);
			} else {
				layer.filtQ[index] = automationQMod;
				layer.filtF[index] = automationFreqMod;
				setAutomationCell(index, automationFreqMod, automationQMod);
			}
		});

		autoRow.addEventListener("pointerdown", (e) => {
			cancelClick = false;

			if (noFilter)
				return;

			if (e.target.nodeName != "TD")
				return;

			if (e.target.id == "automation-levels-set")
				return;

			let index = Number(e.target.dataset.index);
			let layer = songObj.currentPattern.patternData[songObj.currentPattern.activeIndex];

			pressTimeout = setTimeout(() => {
				cancelClick = true;

				if (layer.filtQ[index] || layer.filtQ[index] === 0) {
					fRange.value = automationFreqMod = layer.filtF[index];
					qRange.value = automationQMod = layer.filtQ[index];
				} else {
					fRange.value = automationFreqMod = songObj.synths[layer.synthIndex].filterFreqInput;
					qRange.value = automationQMod = songObj.synths[layer.synthIndex].values.filterQValue;
				}

				fRange.dispatchEvent(new Event("change"));
				qRange.dispatchEvent(new Event("change"));
				showToast("Values copied");
			}, 400)
		});

		for (let j = 0; j <= maxSequencerLength; j++) {
			let td = document.createElement("TD");

			let fBar = document.createElement("DIV");
			let qBar = document.createElement("DIV");

			fBar.classList.add("filter-bar");
			qBar.classList.add("filter-bar");

			if (j == 0) {
				td.id = "automation-levels-set"

				filterControls = document.createElement("DIV");
				filterControls.id = "automation-levels-control";
				filterControls.classList.add("nodisplay");

				// Prevent touch-scroll
				filterControls.addEventListener("touchstart", e => {
					e.stopPropagation();
				});

				fRange.type = "range";
				fRange.min = 0;
				fRange.max = 5;
				fRange.step = 0.02;

				qRange.type = "range";
				qRange.min = 0;
				qRange.max = 50;
				qRange.step = 0.1;

				fRange.addEventListener("change", (e) => {
					automationFreqMod = Number(e.target.value);
					fBar.style.height = (autoFreqScale * automationFreqMod) + "px";
				});

				qRange.addEventListener("change", (e) => {
					automationQMod = Number(e.target.value);
					qBar.style.height = (autoQscale * automationQMod) + "px";
				});

				fBar.style.height = (autoFreqScale * automationFreqMod) + "px";
				qBar.style.height = (autoQscale * automationQMod) + "px";
				fRange.value = automationFreqMod;
				qRange.value = automationQMod;

				let title = document.createElement("SPAN");
				title.appendChild(document.createTextNode("Filter"));
				filterControls.appendChild(title);

				filterControls.appendChild(fRange);
				filterControls.appendChild(qRange);
				td.appendChild(filterControls);
			} else {
				td.dataset.index = j - 1;
				automationCells[j - 1].cell = td;
				automationCells[j - 1].fBar = fBar;
				automationCells[j - 1].qBar = qBar;
			}

			td.appendChild(fBar);
			td.appendChild(qBar);
			autoRow.appendChild(td);
		}
	}

	function setLineOfNotes() {
		let col = dragStartCol;
		let snote = noteArr[dragStartRow];
		for (let i = col; i >= 0; i--) {
			if (getNoteByColumn(i) == snote) {
				col = i;
				break;
			}
		}

		let tmp = dragStartCol;
		dragStartCol = col;
		col = tmp;

		clearLine(col);
		for (let i = dragStartCol; i <= col; i++) {
			setNoteAtColumn(snote, i);
			setNoteLengthAtColumn(i == col ? lengthMod : 100, i);
			setNoteVolumeAtColumn(slopeVolume(dragStartCol, col, i), i);
		}
		redrawLine();
	}

	function slopeVolume(start, end, position) {
		let startNote = getNoteVolumeByColumn(start);

		if (position == end)
			return volumeMod;

		if (position == start)
			return startNote;

		let len = end - start;
		if (len == 0)
			return volumeMod;

		let pos = position - start;
		let progress = pos / len;
		let volumeRange = volumeMod - startNote;

		return Math.round(volumeRange * progress + startNote);
	}

	function clearLineOfNotes() {
		let col = dragStartCol;
		let snote = noteArr[dragStartRow];
		for (let i = col; i < sequencerLength; i++) {
			if (getNoteByColumn(i) != snote) {
				break;
			}
			col = i;
		}

		clearLine(col);
		for (let i = dragStartCol; i <= col; i++) {
			setNoteAtColumn(null, i);
			setNoteLengthAtColumn(0, i);
			setNoteVolumeAtColumn(0, i);
		}
	}

	function redrawLine() {
		for (let i = 0; i < sequencerLength; i++) {

			let note = getNoteByColumn(i);
			let row = findRowByNote(note);

			clearCell(i, dragStartRow);
			setCell(i, row, getNoteLengthByColumn(i), getNoteVolumeByColumn(i))
		}
	}

	function clearLine(col) {
		for (let i = 0; i < sequencerLength; i++) {

			let note = getNoteByColumn(i);
			let row = findRowByNote(note);

			if (i >= Math.min(dragStartCol, col) && i <= Math.max(dragStartCol, col))
				clearCell(i, row);
		}
	}

	function sequencerCellListener(tgt) {
		let { col, row } = getCellCoordinates(tgt);
		let note = noteArr[row];
		let prevNote = getNoteByColumn(col);

		if (prevNote == note) {
			clearCell(col, row, tgt);
			setNoteAtColumn(null, col);
			setNoteLengthAtColumn(0, col);
			setNoteVolumeAtColumn(0, col);
		} else {
			if (prevNote)
				clearCell(col, findRowByNote(prevNote));

			setCell(col, row, lengthMod, volumeMod, tgt)
			setNoteAtColumn(note, col);
			setNoteLengthAtColumn(lengthMod, col);
			setNoteVolumeAtColumn(volumeMod, col);
		}
	}

	function findRowByNote(note) {
		for (let i = 0; i < noteArr.length; i++)
			if (noteArr[i] == note)
				return i;

		return -1;
	}

	function updateBarSeparator() {
		if (barLength == songObj.barSteps)
			return;

		barLength = songObj.barSteps;
		let style = document.getElementById("bar-separator-style");
		style.innerText = `
			#pattern-main td:nth-child(${barLength}n+1) {
				border-right: 1px solid #6a6a6a;
			}`;
	}

	function importData(data) {
		for (let i = 0; i < data.notes.length; i++) {
			if (data.notes[i] === null)
				continue;

			let row = findRowByNote(data.notes[i])
			setCell(i, row, data.lengths[i], data.volumes[i]);
		}

		redrawAutomationRow(data);
	}

	function redrawAutomationRow(data) {
		let index = songObj.currentPattern.patternData[songObj.currentPattern.activeIndex].synthIndex;
		if (index !== null && songObj.synths[index].filter) {
			autoRow.classList.remove("inactive");
			noFilter = false;
		} else {
			autoRow.classList.add("inactive");
			filterControls.classList.add("nodisplay");
			noFilter = true;
		}

		for (let i = 0; i < sequencerLength; i++) {
			if (data.filtQ[i] || data.filtQ[i] === 0)
				setAutomationCell(i, data.filtF[i], data.filtQ[i]);
			else
				resetAutomationCell(i);
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
					cell.classList.add("shade");
			}
		}
	}


	// Sequencer footer (pattern synth tabs)
	const patternLayerTabListener = (event) => {
		let index = Number(event.target.dataset.index);
		let synthIndex = songObj.currentPattern.patternData[index].synthIndex;
		if (synthIndex !== null && event.target.classList.contains("tab--active")) {
			assignSynthCallback(songObj.synthParams[synthIndex], songObj.synths[synthIndex], songObj.synthNames[synthIndex]);
			songObj.currentSynthIndex = synthIndex;
			g_markCurrentSynth();

			g_switchTab("synth");
		}

		let activeLayerTab = document.querySelectorAll(".js-pattern-layer-tab.tab--active")[0];
		if (activeLayerTab)
			activeLayerTab.classList.remove("tab--active");

		event.target.classList.add("tab--active");
		songObj.currentPattern.activeIndex = index;

		this.importSequence(songObj.currentPattern);
	}

	this.rebuildPatternSynthList = function (pattern) {
		let addLayerBtn = document.getElementById("button-add-pattern-layer");
		let patternTabs = document.querySelectorAll(".js-pattern-layer-tab");
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

			if (index !== null && songObj.synths[index].isMuted)
				tab.classList.add("muted-m-mark");

			tab.appendChild(document.createTextNode(name));
			tab.dataset.index = i;

			if (i == pattern.activeIndex)
				tab.classList.add("tab--active");

			tab.classList.add("tab");
			tab.classList.add("js-pattern-layer-tab");
			addLayerBtn.before(tab);
			tab.addEventListener("click", patternLayerTabListener);
		}
	}
}