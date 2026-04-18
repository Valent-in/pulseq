"use strict";

function PatternUi(songObj, assignSynthCallback, onSongChangeCallback) {
	const maxSequencerLength = DEFAULT_PARAMS.maxPatternSteps;
	let sequencerLength = maxSequencerLength;

	let noteArr = DEFAULT_PARAMS.noteSet.slice().reverse();

	let lengthMod = 75;
	let volumeMod = 0;

	let dragStartRow = 0;
	let dragStartCol = 0;

	let pointerPress = false;
	let pressTimeout = null;
	let cancelClick = false;

	let barLength = 0;
	let velocityStep = 12;

	let autoRow, automationControls;
	let automationFreqMod = 3.5;
	let automationQMod = 15;
	let automationWetMod = 0.5;
	const maxAutoBarHeight = 27;
	const freqRange = 5;
	const qRange = 50;
	const autoFreqScale = maxAutoBarHeight / freqRange;
	const autoQscale = maxAutoBarHeight / qRange;
	const autoWetScale = maxAutoBarHeight / 1;
	let fRangeInput = document.createElement("INPUT");
	let qRangeInput = document.createElement("INPUT");
	let isFxEdit = false;

	let autoLevelsSet;
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

	let patternNameArea = document.getElementById("pattern-name-area");
	let pattern = document.getElementById("pattern-main");

	let lControl = document.createElement("DIV");
	lControl.id = "note-length-control";
	let volumeControl = document.createElement("DIV");
	volumeControl.id = "note-volume-control";

	let table = document.createElement("TABLE");
	table.oncontextmenu = () => false;

	table.addEventListener("pointerdown", (e) => {
		if (e.target.nodeName != "TD" || e.button == 1)
			return;

		if (!e.target.id.includes("_row-")) {
			autoRowPointerListener(e);
			pianoColumnListener(e);
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

		}, DEFAULT_PARAMS.pressDelay);
	});

	table.addEventListener("click", (e) => {
		if (cancelClick)
			return;

		if (e.target.nodeName != "TD" || e.button == 1)
			return;

		if (e.target.id.includes("_row-"))
			sequencerCellListener(e.target);
		else
			autoRowClickListener(e);

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

	lControl.addEventListener("click", (event) => {
		if (cancelClick)
			return;

		lControl.classList.remove("control-fill-" + lengthMod);

		let fullWidth = event.target.getBoundingClientRect().width;
		if (event.offsetX < fullWidth / 2)
			lengthMod -= 25;
		else
			lengthMod += 25;

		if (lengthMod == 74)
			lengthMod = 75;

		if (lengthMod == 124)
			lengthMod = 100;

		if (lengthMod > 100)
			lengthMod = 25;

		if (lengthMod < 25)
			lengthMod = 100;

		lControl.classList.add("control-fill-" + lengthMod);
	});

	lControl.addEventListener("pointerdown", () => {
		cancelClick = false;

		pressTimeout = setTimeout(() => {
			cancelClick = true;

			lControl.classList.remove("control-fill-" + lengthMod);
			lengthMod = 99;
			lControl.classList.add("control-fill-" + lengthMod);

		}, DEFAULT_PARAMS.pressDelay);
	});

	volumeControl.addEventListener("click", (event) => {
		let fullWidth = event.target.getBoundingClientRect().width;
		let direction = event.offsetX < fullWidth / 2 ? -1 : 1;

		if (!cancelClick)
			volumeControlReceiver(direction, false);
	});

	volumeControl.addEventListener("pointerdown", (event) => {
		let fullWidth = event.target.getBoundingClientRect().width;
		let direction = event.offsetX < fullWidth / 2 ? -1 : 1;
		cancelClick = false;

		pressTimeout = setTimeout(() => {
			cancelClick = true;

			volumeControlReceiver(direction, true);
			showToast("Velocity " + (100 + volumeMod) + "%");

		}, DEFAULT_PARAMS.pressDelay);
	});


	this.build = function () {
		document.getElementById("input-more-velosteps").onchange = (e) => {
			if (e.target.checked)
				velocityStep = 6;
			else
				velocityStep = 12;

			showToast((8 * 12 / velocityStep) + " levels for note volume control")
		}

		for (let i = 0; i <= DEFAULT_PARAMS.noteSet.length; i++) {
			let tr = document.createElement("TR");
			table.appendChild(tr);
			for (let j = 0; j <= maxSequencerLength; j++) {
				let td = document.createElement("TD");

				if (i == 0 && j == 0) {
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

					if (noteArr[i - 1].includes("b")) {
						td.classList.add("pattern-black-key");
						td.appendChild(document.createTextNode("#"));
					} else if (i > 1 && i < DEFAULT_PARAMS.noteSet.length) {
						td.appendChild(document.createTextNode(noteArr[i - 1]));
					}
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

	this.redrawPattern = () => {
		let ptrn = songObj.currentPattern;
		if (ptrn.length)
			this.setLength(ptrn.length);

		this.clearGrid();
		redrawActiveLayer(ptrn.patternData[ptrn.activeIndex]);
		redrawShadowLayers(ptrn.patternData, ptrn.activeIndex);
		updateBarSeparator();

		patternNameArea.textContent = ptrn.name;
	}

	function volumeControlReceiver(direction, isHalfStep) {
		let step = isHalfStep ? velocityStep / 2 : velocityStep;

		if (direction < 0) {
			volumeMod -= step;
			volumeMod = Math.ceil(volumeMod / step) * step;
		} else {
			volumeMod += step;
			volumeMod = Math.floor(volumeMod / step) * step;
		}

		let threshold = isHalfStep ? step : 10;
		let minVelocity = Math.ceil((threshold - 100) / step) * step;

		if (volumeMod > 0)
			volumeMod = minVelocity;

		if (volumeMod < minVelocity)
			volumeMod = 0;

		let shadow = "inset " + Math.round(volumeControl.clientWidth * volumeMod / 100 - 1) + "px 0 0 0 #111";
		volumeControl.style.boxShadow = shadow;
	}

	function pointerEndListener() {
		pointerPress = false;
		clearTimeout(pressTimeout);
		pressTimeout = null;

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

	function pianoColumnListener(e) {
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

	function resetFiltAutomationCell(col) {
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

		automationCells[col].cell.classList.remove("filt-active");
	}

	function resetWetAutomationCell(col) {
		let synthIndex = songObj.currentPattern.patternData[songObj.currentPattern.activeIndex].synthIndex;
		let wHeight = 0;

		if (synthIndex !== null) {
			let w = songObj.synths[synthIndex].values.FXWetValue;
			wHeight = Math.round(autoWetScale * w);
		}

		automationCells[col].wBar.style.height = wHeight + "px";

		automationCells[col].cell.classList.remove("fx-active");
	}

	function setFiltAutomationCell(col, freq, q) {
		let height = Math.round(autoFreqScale * freq);
		automationCells[col].fBar.style.height = height + "px";

		height = Math.round(autoQscale * q);
		automationCells[col].qBar.style.height = height + "px";

		automationCells[col].cell.classList.add("filt-active");
	}

	function setWetAutomationCell(col, wet) {
		let height = Math.round(autoWetScale * wet);
		automationCells[col].wBar.style.height = height + "px";

		automationCells[col].cell.classList.add("fx-active");
	}

	function setAutomationCell(col, freq, q, wet) {
		if (q || q === 0)
			setFiltAutomationCell(col, freq, q)
		else
			resetFiltAutomationCell(col)

		if (wet || wet === 0)
			setWetAutomationCell(col, wet)
		else
			resetWetAutomationCell(col)
	}

	function buildAutomationRow() {
		autoRow = document.createElement("TR");
		autoRow.id = "pattern-auto-row";
		table.appendChild(autoRow);

		// Update automation row on pattern tab selection
		document.getElementById("pattern-tab").addEventListener("click", () => {
			redrawAutomationRow(songObj.currentPattern.patternData[songObj.currentPattern.activeIndex]);
		});

		for (let j = 0; j <= maxSequencerLength; j++) {
			let td = document.createElement("TD");
			td.classList.add("js-auto-cell");

			let fBar = document.createElement("DIV");
			let qBar = document.createElement("DIV");
			let wBar = document.createElement("DIV");

			fBar.classList.add("filter-bar", "filt-f-bar");
			qBar.classList.add("filter-bar", "filt-q-bar");
			wBar.classList.add("filter-bar", "fx-wet-bar");

			if (j == 0) {
				td.id = "automation-levels-set"

				automationControls = document.createElement("DIV");
				automationControls.id = "automation-levels-control";
				automationControls.classList.add("nodisplay");

				// Prevent touch-scroll
				automationControls.addEventListener("touchstart", e => {
					e.stopPropagation();
				});

				fRangeInput.type = "range";
				fRangeInput.min = 0;
				fRangeInput.max = 5;
				fRangeInput.step = 0.02;

				qRangeInput.type = "range";
				qRangeInput.min = 0;
				qRangeInput.max = 50;
				qRangeInput.step = 0.1;

				fRangeInput.addEventListener("change", (e) => {
					automationFreqMod = Number(e.target.value);
					fBar.style.height = (autoFreqScale * automationFreqMod) + "px";
				});

				qRangeInput.addEventListener("change", (e) => {
					if (isFxEdit) {
						automationWetMod = Number(e.target.value) / qRange;
						wBar.style.height = (autoWetScale * automationWetMod) + "px";
					} else {
						automationQMod = Number(e.target.value);
						qBar.style.height = (autoQscale * automationQMod) + "px";
					}
				});

				fBar.style.height = (autoFreqScale * automationFreqMod) + "px";
				qBar.style.height = (autoQscale * automationQMod) + "px";
				wBar.style.height = (autoWetScale * automationWetMod) + "px";;
				fRangeInput.value = automationFreqMod;
				qRangeInput.value = automationQMod;

				let title = document.createElement("DIV");
				title.id = "automation-levels-title";

				let titleFilt = document.createElement("SPAN");
				titleFilt.id = "automation-title-filter";
				let titleFx = document.createElement("SPAN");
				titleFx.id = "automation-title-fx";
				titleFilt.appendChild(document.createTextNode("Filter"));
				titleFx.appendChild(document.createTextNode("FX"));
				title.appendChild(titleFilt);
				title.appendChild(titleFx);

				title.onclick = () => {
					isFxEdit = !isFxEdit;

					if (isFxEdit && !checkFx())
						showToast("FX is not set");

					if (!isFxEdit && !checkFilter())
						showToast("Filter is not set");

					updateControlMode();
				}

				automationControls.appendChild(title);

				automationControls.appendChild(fRangeInput);
				automationControls.appendChild(qRangeInput);
				td.appendChild(automationControls);
				autoLevelsSet = td;
			} else {
				td.dataset.index = j - 1;
				automationCells[j - 1].cell = td;
				automationCells[j - 1].fBar = fBar;
				automationCells[j - 1].qBar = qBar;
				automationCells[j - 1].wBar = wBar;
			}

			td.appendChild(fBar);
			td.appendChild(qBar);
			td.appendChild(wBar);
			autoRow.appendChild(td);
		}
	}

	function autoRowClickListener(e) {
		if (!e.target.classList.contains("js-auto-cell"))
			return;

		if (!checkFilter() && !checkFx()) {
			showToast("No automation target present");
			return;
		}

		if (e.target.id == "automation-levels-set") {
			automationControls.classList.toggle("nodisplay");
			return;
		}

		let index = Number(e.target.dataset.index);
		let layer = songObj.currentPattern.patternData[songObj.currentPattern.activeIndex];

		if (isFxEdit) {
			if (layer.fxWet[index] || layer.fxWet[index] === 0) {
				layer.fxWet[index] = null;
			} else {
				layer.fxWet[index] = automationWetMod;
			}
		} else {
			if (layer.filtQ[index] || layer.filtQ[index] === 0) {
				layer.filtQ[index] = null;
				layer.filtF[index] = null;
			} else {
				layer.filtQ[index] = automationQMod;
				layer.filtF[index] = automationFreqMod;
			}
		}

		setAutomationCell(index, layer.filtF[index], layer.filtQ[index], layer.fxWet[index]);
	}

	function autoRowPointerListener(e) {
		if (!e.target.classList.contains("js-auto-cell"))
			return;

		cancelClick = false;

		if (!checkFilter() && !checkFx())
			return;

		if (e.target.id == "automation-levels-set")
			return;

		let index = Number(e.target.dataset.index);
		let layer = songObj.currentPattern.patternData[songObj.currentPattern.activeIndex];

		pressTimeout = setTimeout(() => {
			cancelClick = true;
			if (isFxEdit) {
				if (layer.fxWet[index] || layer.fxWet[index] === 0) {
					automationWetMod = layer.fxWet[index];
				} else {
					automationWetMod = songObj.synths[layer.synthIndex].values.FXWetValue;
				}
				qRangeInput.value = automationWetMod * qRange;
			} else {
				if (layer.filtQ[index] || layer.filtQ[index] === 0) {
					fRangeInput.value = automationFreqMod = layer.filtF[index];
					qRangeInput.value = automationQMod = layer.filtQ[index];
				} else {
					fRangeInput.value = automationFreqMod = songObj.synths[layer.synthIndex].filterFreqInput;
					qRangeInput.value = automationQMod = songObj.synths[layer.synthIndex].values.filterQValue;
				}
			}

			fRangeInput.dispatchEvent(new Event("change"));
			qRangeInput.dispatchEvent(new Event("change"));
			showToast("Values copied");

		}, DEFAULT_PARAMS.pressDelay);
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

	function redrawActiveLayer(ptrnData) {
		for (let i = 0; i < ptrnData.notes.length; i++) {
			if (!ptrnData.notes[i])
				continue;

			let row = findRowByNote(ptrnData.notes[i])
			setCell(i, row, ptrnData.lengths[i], ptrnData.volumes[i]);
		}

		redrawAutomationRow(ptrnData);
	}

	function checkFilter() {
		let index = songObj.currentPattern.patternData[songObj.currentPattern.activeIndex].synthIndex;
		if (index === null)
			return false;

		return songObj.synths[index].filter ? true : false;
	}

	function checkFx() {
		let index = songObj.currentPattern.patternData[songObj.currentPattern.activeIndex].synthIndex;
		if (index === null)
			return false;

		return songObj.synths[index].FX ? true : false;
	}

	function updateControlMode() {
		if (!checkFx() && !checkFilter()) {
			automationControls.classList.add("nodisplay");
			autoLevelsSet.style.backgroundColor = "#333";
			return;
		}

		if (isFxEdit)
			if (checkFx()) {
				automationControls.classList.add("js-auto-control-fx");
			} else {
				automationControls.classList.remove("js-auto-control-fx");
				isFxEdit = false;
			}
		else
			if (checkFilter()) {
				automationControls.classList.remove("js-auto-control-fx");
			} else {
				automationControls.classList.add("js-auto-control-fx");
				isFxEdit = true;
			}

		if (isFxEdit) {
			autoLevelsSet.style.backgroundColor = "#4ca";
			autoLevelsSet.classList.add("control-fx");
			qRangeInput.value = automationWetMod * qRange;
		} else {
			autoLevelsSet.style.backgroundColor = "#a5d";
			autoLevelsSet.classList.remove("control-fx");
			qRangeInput.value = automationQMod;
		}
	}

	function redrawAutomationRow(ptrnData) {
		if (checkFilter() || checkFx())
			autoRow.classList.remove("inactive");
		else
			autoRow.classList.add("inactive");

		if (checkFilter())
			autoRow.classList.remove("no-filter-set");
		else
			autoRow.classList.add("no-filter-set");

		if (checkFx())
			autoRow.classList.remove("no-fx-set");
		else
			autoRow.classList.add("no-fx-set");

		updateControlMode();

		for (let i = 0; i < sequencerLength; i++)
			setAutomationCell(i, ptrnData.filtF[i], ptrnData.filtQ[i], ptrnData.fxWet[i]);
	}

	function redrawShadowLayers(ptrnData, excludeIndex) {
		for (let i = 0; i < ptrnData.length; i++) {
			if (i == excludeIndex)
				continue;

			for (let j = 0; j < ptrnData[i].notes.length; j++) {
				if (!ptrnData[i].notes[j])
					continue;

				let row = findRowByNote(ptrnData[i].notes[j])
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

		if (event.target.classList.contains("tab--active")) {
			if (synthIndex === null) {
				isCreateNewLayer = false;
				showSynthSelectList();
			} else {
				assignSynthCallback(songObj.synthParams[synthIndex], songObj.synths[synthIndex], songObj.synthNames[synthIndex]);
				songObj.currentSynthIndex = synthIndex;
				g_markCurrentSynth();
				g_switchTab("synth");
			}
			return;
		}

		let activeLayerTab = document.querySelectorAll(".js-pattern-layer-tab.tab--active")[0];
		if (activeLayerTab)
			activeLayerTab.classList.remove("tab--active");

		event.target.classList.add("tab--active");
		songObj.currentPattern.activeIndex = index;

		this.redrawPattern();
	}

	this.rebuildPatternSynthList = function () {
		let pattern = songObj.currentPattern;
		let addLayerBtn = document.getElementById("button-add-pattern-layer");
		let patternTabs = document.querySelectorAll(".js-pattern-layer-tab");
		patternTabs.forEach(e => e.remove());

		for (let i = 0; i < pattern.patternData.length; i++) {
			let index = pattern.patternData[i].synthIndex;
			let tab = document.createElement("DIV");

			let name;
			if (index === null)
				name = "[none]";
			else
				name = songObj.synthNames[index] || "[ ... ]";

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


	// Synth select dialog
	let isCreateNewLayer = false;

	this.setNewPatternSynth = function () {
		if (songObj.synths.length == 1) {
			songObj.setCurrentLayerSynthIndex(0);
			onSongChangeCallback(false);
		} else {
			isCreateNewLayer = false;
			showSynthSelectList();
		}
	}

	document.getElementById("button-add-pattern-layer").onclick = () => {
		isCreateNewLayer = true;
		showSynthSelectList();
	};

	document.getElementById("button-synth-select").onclick = () => {
		isCreateNewLayer = false;
		showSynthSelectList();
	};

	document.getElementById("menu-synth-list-container").onclick = (event) => {
		if (!event.target.classList.contains("js-synth-list-entry"))
			return;

		hideModal("synth-select-modal-menu");

		let isEmpty = songObj.getCurrentLayerSynthIndex() === null;

		let index = Number(event.target.dataset.index);

		if (!isCreateNewLayer &&
			index == songObj.currentPattern.patternData[songObj.currentPattern.activeIndex].synthIndex) {
			showToast("Already selected");
			return;
		}

		if (songObj.isSynthInCurrentPattern(index)) {
			showAlert("Synth is already in this pattern");
		} else {
			let synthIndex = index >= 0 ? index : null;

			if (songObj.testSynthOnPattern(synthIndex)) {
				if (isCreateNewLayer)
					songObj.currentPattern.addLayer();

				songObj.setCurrentLayerSynthIndex(synthIndex);
			} else {
				showAlert("Collision with another pattern in track");
			}
		}

		let synthName = songObj.getCurrentLayerSynthName();
		let synthSelect = document.getElementById("button-synth-select");
		synthSelect.textContent = synthName === null ? "[none]" : synthName || "[ ... ]";;

		if (isCreateNewLayer || isEmpty)
			onSongChangeCallback(false);
		else
			onSongChangeCallback(false, "release");

		isCreateNewLayer = false;
	};

	document.getElementById("button-synth-select-close").onclick = () => {
		hideModal("synth-select-modal-menu");
	};

	function showSynthSelectList() {
		showModal("synth-select-modal-menu");

		let listContainer = document.getElementById("menu-synth-list-container");
		listContainer.innerHTML = "";

		let noneEntry = document.createElement("DIV");
		noneEntry.classList.add("js-synth-list-entry");
		noneEntry.classList.add("synth-list-entry");
		noneEntry.id = "synth-list-entry-none";

		if (!isCreateNewLayer && songObj.getCurrentLayerSynthIndex() === null)
			noneEntry.classList.add("synth-list-entry--current");

		noneEntry.dataset.index = -1;
		noneEntry.appendChild(document.createTextNode("[none]"));
		listContainer.appendChild(noneEntry);

		for (let i = 0; i < songObj.synthNames.length; i++) {
			let entry = document.createElement("DIV");
			entry.classList.add("js-synth-list-entry");
			entry.classList.add("synth-list-entry");

			if (!isCreateNewLayer && songObj.getCurrentLayerSynthIndex() === i)
				entry.classList.add("synth-list-entry--current");

			if (!songObj.testSynthOnPattern(i))
				entry.classList.add("synth-list-entry--disabled");

			if (isCreateNewLayer && songObj.isSynthInCurrentPattern(i))
				entry.classList.add("synth-list-entry--disabled");

			if (songObj.synths[i].isMuted)
				entry.classList.add("muted-mark");

			entry.dataset.index = i;
			entry.appendChild(document.createTextNode(songObj.synthNames[i]));
			listContainer.appendChild(entry);
		}
	}
}