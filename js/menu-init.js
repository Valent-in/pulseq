"use strict";

function menuInit(songObj, onSongChangeCallback, loadSynthCallback, renderCallback, midiCallback) {

	let isCreateNewLayer = false;
	document.getElementById("button-add-pattern-layer").onclick = () => {
		isCreateNewLayer = true;
		showSynthSelectList();
	};

	/*
	 * Startup menu
	 */
	document.getElementById("startup-menu").onclick = () => {
		if (Tone.context.state != "running") {
			console.log("Starting web audio context");
			Tone.context.resume();
		} else {
			console.log("Web audio context is already running");
		}
	}

	document.getElementById("button-new-track").onclick = () => {
		songObj.createEmptySong();
		onSongChangeCallback(true);
		hideModal("startup-modal-menu");
	}

	let importTrackInput = document.getElementById("input-import-track");
	importTrackInput.onchange = (e) => {
		let file = e.target.files[0];
		if (!file)
			return;
		showModal("loading-modal");

		let reader = new FileReader();
		reader.onload = function (ev) {
			let songStr = ev.target.result;

			if (importSong(songStr))
				hideModal("startup-modal-menu");

			hideModal("loading-modal");

		};
		reader.readAsText(file);
	}

	importTrackInput.ondragenter = () => {
		importTrackInput.classList.add("dragover");
	}

	importTrackInput.ondragleave = () => {
		importTrackInput.classList.remove("dragover");
	}

	importTrackInput.ondrop = () => {
		importTrackInput.classList.remove("dragover");
	}

	document.getElementById("button-demo-track").onclick = () => {
		showModal("demo-modal-menu");

		let container = document.getElementById("demo-list-container");
		container.innerHTML = "Loading...";

		fetch("data/tracklist.json").then(response => response.json()).then(data => {
			container.innerHTML = "";
			for (let i = 0; i < data.length; i++) {
				let item = document.createElement("DIV");
				item.appendChild(document.createTextNode(data[i].name));
				item.classList.add("startup-menu-entry");
				item.classList.add("js-demo-entry");
				item.dataset.file = data[i].file;
				container.appendChild(item);
			}
		}).catch(() => {
			container.innerHTML = "Data loading error!";
		});
	}

	/*
	 * Demo modal menu
	 */
	document.getElementById("demo-list-container").onclick = (event) => {
		console.log(event.target.dataset.file);

		if (!event.target.classList.contains("js-demo-entry"))
			return;

		hideModal("demo-modal-menu");
		showModal("loading-modal");

		let filename = event.target.dataset.file;
		fetch("data/tracks/" + filename).then(response => response.json()).then(data => {

			if (importSong(JSON.stringify(data)))
				hideModal("startup-modal-menu");

			hideModal("loading-modal");

		}).catch(() => {
			hideModal("loading-modal");
			showAlert("Data loading error!");
		});
	};

	document.getElementById("button-demo-menu-close").onclick = () => {
		hideModal("demo-modal-menu");
	};

	/*
	 * Arrange modal menu
	 */
	let bpmSet = document.getElementById("button-bpm-set");
	let barStepsSet = document.getElementById("button-steps-set");

	let titleInput = document.getElementById("input-song-title");
	document.getElementById("button-arrange-menu-open").onclick = () => {
		document.getElementById("input-bpm-value").value = songObj.bpm;
		document.getElementById("input-steps-value").value = songObj.barSteps;

		highlight(bpmSet, false);
		highlight(barStepsSet, false);

		showModal("arrange-modal-menu");

		titleInput.value = songObj.title;
		if (!songObj.title)
			titleInput.focus();
	};

	titleInput.addEventListener("keydown", (event) => {
		if (event.key == "Escape") {
			titleInput.value = songObj.title;
		}
	});

	titleInput.onchange = (event) => {
		songObj.title = event.target.value;
		showSongTitle();
	};

	bpmSet.onclick = () => {
		applyBpm();
		highlight(bpmSet, false);
	};

	let bpmInput = document.getElementById("input-bpm-value");
	bpmInput.addEventListener("keyup", (event) => {
		if (event.key == "Enter") {
			applyBpm();
			highlight(bpmSet, false);
		}
	});

	bpmInput.addEventListener("input", () => {
		highlight(bpmSet, true);
	});

	function applyBpm() {
		let bpmValue = Number(bpmInput.value);

		if (bpmValue < 4) {
			showAlert("Minimum 4 BPM");
			bpmValue = 4;
		}

		if (bpmValue > 1000) {
			showAlert("Maximum 1000 BPM");
			bpmValue = 1000;
		}

		bpmInput.value = bpmValue;
		showToast("BPM: " + bpmValue);

		songObj.bpm = bpmValue;
		Tone.Transport.bpm.value = songObj.bpm;
		songObj.synths.forEach(e => e.setBpm(songObj.bpm));
	};

	let barStepsInput = document.getElementById("input-steps-value");
	barStepsInput.addEventListener("input", () => {
		highlight(barStepsSet, true);
	});

	barStepsInput.addEventListener("keyup", (event) => {
		if (event.key == "Enter") {
			applyBarSteps();
			highlight(barStepsSet, false);
		}
	});

	barStepsSet.onclick = () => {
		applyBarSteps()
		highlight(barStepsSet, false);
	};

	function applyBarSteps() {
		let stepsValue = barStepsInput.value;

		if (stepsValue == songObj.barSteps)
			return;

		if (songObj.isSongEmpty())
			setBarLength();
		else
			showConfirm("This will delete all patterns! Proceed?", isOk => {
				if (isOk)
					setBarLength();
				else
					barStepsInput.value = songObj.barSteps;
			});

		function setBarLength() {
			if (stepsValue > 32) {
				showAlert("Maximum bar length is 32 steps");
				stepsValue = 32;
				barStepsInput.value = 32;
			}

			if (stepsValue < 4) {
				showAlert("Minimum bar length is 4 steps");
				stepsValue = 4;
				barStepsInput.value = 4;
			}

			songObj.setBarLength(Number(stepsValue));
			songObj.swing = 0;
			onSongChangeCallback(false);
			showToast("Steps in bar: " + stepsValue);
		}
	};

	document.getElementById("button-additional-menu-open").onclick = () => {
		showModal("additional-modal-menu");
		document.getElementById("range-compressor-threshold").value = -songObj.compressorThreshold;
		document.getElementById("range-compressor-ratio").value = songObj.compressorRatio;
		document.getElementById("range-swing-amount").value = songObj.swing;
		fillAdditionalValues();
	};

	document.getElementById("link-song-download").onclick = (event) => {
		let lnk = event.target;

		if (lnk.protocol == "blob:")
			URL.revokeObjectURL(lnk.href);

		let file = new Blob([exportSong()], { type: 'text/json' });
		lnk.href = URL.createObjectURL(file);
		let name = songObj.title || "song";
		lnk.download = name + ".json";
	};

	const showEmptyTrackMsg = () => { showAlert("Can not export empty track") };

	document.getElementById("button-export-menu-open").onclick = () => {
		if (songObj.playableLength > 0) {
			showModal("export-modal-menu");
			document.getElementById("input-render-length").value = songObj.getSongDuration();
		} else {
			showEmptyTrackMsg();
		}
	};

	document.getElementById("button-midi-menu-open").onclick = () => {
		if (songObj.playableLength > 0)
			showModal("midi-modal-menu");
		else
			showEmptyTrackMsg();
	};

	document.getElementById("button-arrange-menu-close").onclick = () => {
		hideModal("arrange-modal-menu");
	};

	/*
	 * Export modal menu
	 */
	document.getElementById("button-render").onclick = () => {
		let exportResult = document.getElementById("export-menu-result-container");
		exportResult.style.display = "none";

		let renderLengthInput = document.getElementById("input-render-length");
		let renderLength = Number(renderLengthInput.value);

		if (renderLength <= 0) {
			showAlert("Duration should be greater than 0.")
			renderLengthInput.value = songObj.getSongDuration();
			return;
		}

		if (renderLength > songObj.getSongDuration() + 30) {
			showAlert("Duration should not exceed track length by more than 30 sec.")
			renderLengthInput.value = songObj.getSongDuration();
			return;
		}

		exportResult.style.display = "block";
		updateUiOnExport(true);

		let downloadLink = document.getElementById("link-wav-download");
		if (downloadLink.protocol == "blob:")
			URL.revokeObjectURL(downloadLink.href);

		let timer = new Date();
		renderCallback(renderLength).then(buffer => {
			// check offline render time
			let renderTime = Date.now() - timer;

			//let player = new Tone.Player(buffer).toDestination();
			//player.start();
			console.log("Render buffer length:", buffer.length);

			let expData = bufferToWave(buffer, buffer.length);

			// check convert time
			let convertTime = Date.now() - timer - renderTime;
			console.log("render time: " + (renderTime / 1000).toFixed(2)
				+ "  convert time: " + (convertTime / 1000).toFixed(2)
				+ "  total: " + ((Date.now() - timer) / 1000).toFixed(2));

			let newFile = URL.createObjectURL(expData);
			downloadLink.href = newFile;
			let name = songObj.title || "export";
			downloadLink.download = name + ".wav";
			updateUiOnExport(false);
		})
	};

	document.getElementById("button-export-menu-close").onclick = () => {
		hideModal("export-modal-menu");

		let downloadLink = document.getElementById("link-wav-download");
		URL.revokeObjectURL(downloadLink.href);
		downloadLink.href = "";

		document.getElementById("export-menu-result-container").style.display = "none";
		document.getElementById("wav-link-container").style.display = "none";
	};

	/*
	 * Export MIDI modal menu
	 */
	document.getElementById("link-midi-download").onclick = (e) => {
		let lnk = e.target;

		if (lnk.protocol == "blob:")
			URL.revokeObjectURL(lnk.href);

		let exportGlide = document.getElementById("input-export-glide");
		let exportExpand = document.getElementById("input-export-expand");
		let exportVelocity = document.getElementById("select-velocity-scale");

		let o = midiCallback(
			exportGlide.checked,
			exportExpand.checked,
			exportVelocity.selectedIndex
		);

		let data = writeMidi(o);
		let udata = new Uint8Array(data.length);
		for (let i = 0; i < data.length; i++)
			udata[i] = data[i];

		let file = new Blob([udata], { type: "audio/midi" });
		lnk.href = URL.createObjectURL(file);
		let name = songObj.title || "export";
		lnk.download = name + ".mid";

		if (o.tracks.length == 0)
			showToast("Empty file exported");
	};

	document.getElementById("button-midi-menu-close").onclick = () => {
		hideModal("midi-modal-menu");
		let downloadLink = document.getElementById("link-midi-download");
		URL.revokeObjectURL(downloadLink.href);
		downloadLink.href = "";
	};

	/*
	 * Modal menu for additional song parameters
	 */
	let compressorThresholdInput = document.getElementById("range-compressor-threshold");
	compressorThresholdInput.onchange = (event) => {
		let value = -event.target.value;
		songObj.compressorThreshold = value;
		songObj.compressor.threshold.value = value;
		fillAdditionalValues();
	};

	let compressorRatioInput = document.getElementById("range-compressor-ratio");
	compressorRatioInput.onchange = (event) => {
		let value = +event.target.value;
		songObj.compressorRatio = value;
		songObj.compressor.ratio.value = value;
		fillAdditionalValues();
	};

	let swingAmountInput = document.getElementById("range-swing-amount");
	swingAmountInput.onchange = (event) => {
		let value = +event.target.value;
		songObj.swing = value;
		fillAdditionalValues();
	};

	document.getElementById("button-reset-additional").onclick = () => {
		songObj.compressorThreshold = -30;
		songObj.compressor.threshold.value = -30;
		compressorThresholdInput.value = +30;

		songObj.compressorRatio = 3;
		songObj.compressor.ratio.value = 3;
		compressorRatioInput.value = 3;

		songObj.swing = 0;
		swingAmountInput.value = 0;

		fillAdditionalValues();
	}

	document.getElementById("button-additional-menu-close").onclick = () => {
		hideModal("additional-modal-menu");
	}

	/*
	 * Pattern modal menu
	 */
	let patternNameInput = document.getElementById("input-pattern-name");
	let patternLengthInput = document.getElementById("input-pattern-length");
	let patternLengthSet = document.getElementById("button-pattern-length-set");
	let deletePatternBtn = document.getElementById("button-delete-pattern")
	let deleteLayerBtn = document.getElementById("button-delete-layer")

	document.getElementById("button-pattern-menu-open").onclick = () => {
		patternNameInput.value = songObj.currentPattern.name;

		let barsInPattern = Math.round(songObj.currentPattern.length / songObj.barSteps);
		document.getElementById("input-pattern-length").value = barsInPattern;

		let synthName = songObj.getCurrentLayerSynthName();
		let synthSelect = document.getElementById("button-synth-select");
		synthSelect.textContent = synthName || "[none]";

		document.getElementById("button-color-select").style.backgroundColor =
			DEFAULT_PARAMS.colorSet[songObj.currentPattern.colorIndex];

		deletePatternBtn.disabled = (songObj.patterns.length == 1);
		deleteLayerBtn.disabled = (songObj.currentPattern.patternData.length == 1);

		highlight(patternLengthSet, false);

		showModal("pattern-modal-menu");
	};

	patternNameInput.addEventListener("keydown", (event) => {
		if (event.key == "Escape") {
			patternNameInput.value = songObj.currentPattern.name;
		}
	});

	patternNameInput.onchange = (event) => {
		let value = event.target.value;

		if (value) {
			songObj.currentPattern.name = value;

			let patternName = document.getElementById("pattern-name-area");
			patternName.textContent = value;
			onSongChangeCallback(false);
		} else {
			event.target.value = songObj.currentPattern.name;
			showToast("Pattern NOT renamed");
		}
	};

	patternLengthInput.addEventListener("input", () => {
		highlight(patternLengthSet, true);
	});

	patternLengthInput.addEventListener("keyup", (event) => {
		if (event.key == "Enter") {
			applyPatternLength();
			highlight(patternLengthSet, false);
		}
	});

	patternLengthSet.onclick = () => {
		applyPatternLength();
		highlight(patternLengthSet, false);
	}

	function applyPatternLength() {
		let bars = Number(patternLengthInput.value);
		let len = bars * songObj.barSteps;

		let currentLen = songObj.currentPattern.length;
		let valueAccepted = true;
		let maxPatternLength = Math.floor(DEFAULT_PARAMS.maxPatternSteps / songObj.barSteps) * songObj.barSteps;
		let maxPatternBars = maxPatternLength / songObj.barSteps;

		if (len > maxPatternLength) {
			showAlert("Maximum pattern length is " + maxPatternBars + " bars (" + maxPatternLength + " steps)");
			len = maxPatternLength;
			patternLengthInput.value = maxPatternBars;
			valueAccepted = false;
		}

		if (bars < 1) {
			len = songObj.barSteps;
			patternLengthInput.value = 1;
			showAlert("Minimum pattern length is 1 bar (" + songObj.barSteps + " steps)");
			valueAccepted = false;
		}

		if (len % songObj.barSteps != 0) {
			len = Math.ceil(len / songObj.barSteps) * songObj.barSteps;
			let calcBars = Math.round(len / songObj.barSteps);
			patternLengthInput.value = calcBars;
			showAlert("Pattern length rounded to " + calcBars + " bars (" + len + " steps)");
			valueAccepted = false;
		}

		if (songObj.setCurrentPatternLength(len)) {
			if (len >= currentLen)
				onSongChangeCallback(false);
			else
				onSongChangeCallback(false, "release");
		} else {
			showAlert("Can not extend pattern");
			patternLengthInput.value = Math.round(songObj.currentPattern.length / songObj.barSteps);
			valueAccepted = false;
		}

		if (valueAccepted) {
			let bstr = bars > 1 ? " bars (" : " bar (";
			showToast("Pattern length: " + bars + bstr + songObj.currentPattern.length + " steps)");
		}
	};

	document.getElementById("button-synth-select").onclick = () => {
		isCreateNewLayer = false;
		showSynthSelectList();
	};

	document.getElementById("button-color-select").onclick = () => {
		let colorButtons = document.querySelectorAll("#color-list-container button.button--selected");
		colorButtons.forEach(e => { e.classList.remove("button--selected") });
		document.getElementById("button-color-index" + songObj.currentPattern.colorIndex).classList.add("button--selected");

		showModal("color-select-modal-menu");
	};

	deletePatternBtn.onclick = () => {
		if (songObj.patterns.length == 1) {
			showAlert("Can not delete last pattern");
			return;
		}

		showConfirm("Delete current pattern?", (isOk) => {
			if (!isOk)
				return;

			songObj.deleteCurrentPattern();
			onSongChangeCallback(false, "stop");
			hideModal("pattern-modal-menu");
			g_switchTab("arrange");
		});
	};

	deleteLayerBtn.onclick = () => {
		if (songObj.currentPattern.patternData.length == 1) {
			showAlert("Can not delete last layer");
			return;
		}

		showConfirm("Delete current layer?", (isOk) => {
			if (!isOk)
				return;

			let isEmpty = songObj.getCurrentLayerSynthIndex() === null;
			songObj.currentPattern.deleteActiveLayer();

			if (isEmpty)
				onSongChangeCallback(false);
			else
				onSongChangeCallback(false, "release");

			hideModal("pattern-modal-menu");
		});
	};

	document.getElementById("button-copy-pattern").onclick = () => {
		let name = songObj.currentPattern.name;
		let defaultName = songObj.generatePatternName(name.split("-")[0] + "-", 2);

		showPrompt("Copy pattern \"" + name + "\" to", (result) => {
			if (result === null)
				return;

			songObj.copyPattern(songObj.currentPattern, result);
			console.log("Pattern '" + name + "' copied to '" + result + "'");
			onSongChangeCallback(false);
			hideModal("pattern-modal-menu");
			g_switchTab("arrange");
			g_scrollToLastPatten();
		}, defaultName);
	};

	document.getElementById("button-pattern-menu-close").onclick = () => {
		hideModal("pattern-modal-menu");
	};

	/*
	 * Pattern color menu
	 */
	let colorContainer = document.getElementById("color-list-container");
	colorContainer.innerHTML = "";
	for (let i = 0; i < DEFAULT_PARAMS.colorSet.length; i++) {
		let btn = document.createElement("BUTTON");
		btn.appendChild(document.createTextNode(i));
		btn.classList = "button--shadowed";
		btn.style.backgroundColor = DEFAULT_PARAMS.colorSet[i];
		btn.id = "button-color-index" + i;

		btn.addEventListener("click", () => {
			songObj.currentPattern.colorIndex = i;
			onSongChangeCallback(false);
			document.getElementById("button-color-select").style.backgroundColor = DEFAULT_PARAMS.colorSet[i];
			hideModal("color-select-modal-menu");
		})

		colorContainer.appendChild(btn);
	}

	document.getElementById("button-color-menu-close").onclick = () => {
		hideModal("color-select-modal-menu");
	};

	/*
	 * Layer fade menu
	 */
	document.getElementById("button-fade-layer").onclick = () => {
		let pattern = songObj.currentPattern;
		let index = pattern.activeIndex;
		let layer = pattern.patternData[index];

		let startVolume = 0, endVolume = 0, isEmpty = true;

		for (let i = 0; i < pattern.length; i++) {
			if (layer.notes[i]) {
				isEmpty = false;
				endVolume = 100 + layer.volumes[i];

				if (startVolume == 0)
					startVolume = 100 + layer.volumes[i];
			}
		}

		if (isEmpty) {
			showAlert("Layer is empty");
			return;
		}

		document.getElementById("input-fade-start").value = startVolume;
		document.getElementById("input-fade-end").value = endVolume;
		showModal("fade-layer-modal-menu");
	};

	document.getElementById("button-apply-fade").onclick = applyFade;

	document.getElementById("input-fade-end").addEventListener("keyup", (event) => {
		if (event.key == "Enter")
			applyFade();
	});

	function applyFade() {
		let pattern = songObj.currentPattern;
		let index = pattern.activeIndex;
		let layer = pattern.patternData[index];

		let startVolume = Number(document.getElementById("input-fade-start").value);
		let endVolume = Number(document.getElementById("input-fade-end").value);

		// actual limit is 100 - exceeding values will be capped
		if (isNaN(startVolume) || startVolume < 1 || startVolume > 200 ||
			isNaN(endVolume) || endVolume < 1 || endVolume > 200) {
			showAlert("Volume values should be in range 1-100");
			return;
		}

		let startIndex = -1, endIndex = 0;
		for (let i = 0; i < pattern.length; i++) {
			if (layer.notes[i]) {
				endIndex = i;

				if (startIndex < 0)
					startIndex = i;
			}
		}

		let lineLength = Math.max(1, endIndex - startIndex);
		let step = (endVolume - startVolume) / lineLength;

		for (let i = 0; i <= lineLength; i++) {
			if (layer.notes[i + startIndex])
				layer.volumes[i + startIndex] = Math.min(0, -100 + Math.round(startVolume + i * step));
		}

		console.log("volumes", layer.volumes);

		onSongChangeCallback(false);
		hideModal("pattern-modal-menu");
		hideModal("fade-layer-modal-menu");
	};

	document.getElementById("button-fade-menu-close").onclick = () => {
		hideModal("fade-layer-modal-menu");
	};

	/*
	 * Synth modal menu
	 */
	document.getElementById("menu-synth-list-container").onclick = (event) => {
		if (!event.target.classList.contains("js-synth-list-entry"))
			return;

		hideModal("synth-select-modal-menu");

		let isEmpty = songObj.getCurrentLayerSynthIndex() === null;

		let index = Number(event.target.dataset.index);
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

		let synthName = songObj.getCurrentLayerSynthName() || "[none]";
		let synthSelect = document.getElementById("button-synth-select");
		synthSelect.textContent = synthName;

		if (isCreateNewLayer || isEmpty)
			onSongChangeCallback(false);
		else
			onSongChangeCallback(false, "release");

		isCreateNewLayer = false;
	};

	document.getElementById("button-synth-select-close").onclick = () => {
		hideModal("synth-select-modal-menu");
	};

	/*
	 * Settings modal menu
	 */
	document.getElementById("button-settings-open").onclick = () => {
		showModal("settings-modal-menu");
	};

	document.getElementById("button-reset-app").onclick = () => {
		showConfirm("Application restart. All unsaved data will be lost!\nContinue?", (isOk) => {
			if (!isOk)
				return;

			console.log("bye!");
			window.onbeforeunload = null;
			document.location.reload();
		});
	};

	document.getElementById("button-context-resume").onclick = () => {
		showAlert("Unmute your device if silent mode is turned on");

		if (Tone.context.state == "running") {
			showToast("Web audio context is already running");
		} else {
			Tone.context.resume();
			showToast("Web audio context resumed");
		}
	};

	document.getElementById("button-settings-close").onclick = () => {
		hideModal("settings-modal-menu");
	};

	/*
	 * Auxility
	 */
	function showSongTitle() {
		let songTitle = document.getElementById("song-title-area");
		songTitle.textContent = songObj.title || "[untitled]";
	}

	function fillAdditionalValues() {
		let cell = document.getElementById("compressor-values-cell");
		cell.textContent = "T:" + songObj.compressorThreshold + "dB / R:" + songObj.compressorRatio;

		cell = document.getElementById("swing-value-cell");
		cell.textContent = songObj.swing + "%";
	}

	function highlight(element, isHightlight) {
		if (isHightlight)
			element.classList.add("button--highlight-yellow");
		else
			element.classList.remove("button--highlight-yellow");
	}

	function importSong(songStr) {
		let expObj;
		try {
			expObj = JSON.parse(songStr);
		} catch {
			showAlert("JSON parsing error");
			return false;
		}

		if (!expObj.songFormatVersion) {
			showAlert("Can not load data");
			return false;
		}

		// Expect single-digit numbers
		if (expObj.songFormatVersion > DEFAULT_PARAMS.fileFormatVersion)
			showAlert("WARNING:\nFile was created in more recent PulseQueue version.");

		songObj.title = expObj.title || "";
		songObj.synthParams = [];
		songObj.synthNames = expObj.synthNames;

		songObj.synths.forEach(e => e.destroy());
		songObj.synths = [];

		songObj.bpm = expObj.bpm || 120;
		Tone.Transport.bpm.value = songObj.bpm;
		songObj.swing = expObj.swing || 0;

		songObj.barSteps = expObj.barSteps || 16;

		songObj.compressorThreshold = expObj.compressorThreshold || 0;
		songObj.compressorRatio = expObj.compressorRatio || 1;
		songObj.compressor.threshold.value = songObj.compressorThreshold;
		songObj.compressor.ratio.value = songObj.compressorRatio;

		for (let i = 0; i < expObj.synthParams.length; i++) {
			let synth = new Synth(songObj.compressor, songObj.bpm);
			songObj.synths.push(synth);
			let newParams = loadSynthCallback(expObj.synthParams[i], songObj.synths[i]);
			songObj.synthParams.push(newParams);
		}

		songObj.patterns = [];
		for (let i = 0; i < expObj.patterns.length; i++) {
			let ptrn = new Pattern(expObj.patternNames[i]);
			ptrn.patternData = expObj.patterns[i];

			// Create filter automation if file does not contain it
			ptrn.patternData.forEach(e => {
				if (!e.filtQ) {
					e.filtQ = [];
					e.filtF = [];
				}
			});

			if (expObj.patternLengths)
				ptrn.length = expObj.patternLengths[i];

			if (expObj.patternColors)
				ptrn.colorIndex = expObj.patternColors[i];

			songObj.patterns.push(ptrn);
		}

		songObj.song = expObj.song;
		songObj.setCurrentPattern(0);
		songObj.arrangeStartPoint = 0;
		onSongChangeCallback(true);
		showSongTitle();

		if (songObj.calculateSynthFill() > 0)
			showAlert("WARNING: Patterns overlap in imported file!");

		return true;
	}

	function exportSong() {
		let expObj = {};

		expObj.songFormatVersion = DEFAULT_PARAMS.fileFormatVersion;
		expObj.synthParams = songObj.synthParams;
		expObj.synthNames = songObj.synthNames;
		expObj.song = songObj.song;
		expObj.patterns = [];
		expObj.patternLengths = [];
		expObj.patternNames = [];
		expObj.patternColors = [];
		expObj.compressorThreshold = songObj.compressorThreshold;
		expObj.compressorRatio = songObj.compressorRatio;
		expObj.bpm = songObj.bpm;
		expObj.barSteps = songObj.barSteps;
		expObj.title = songObj.title;
		expObj.swing = songObj.swing;

		for (let i = 0; i < songObj.patterns.length; i++) {
			expObj.patterns.push(songObj.patterns[i].patternData);
			expObj.patternLengths.push(songObj.patterns[i].length);
			expObj.patternNames.push(songObj.patterns[i].name);
			expObj.patternColors.push(songObj.patterns[i].colorIndex);
		}

		return JSON.stringify(expObj, null, 1);
	}

	function updateUiOnExport(isExporting) {
		let closeButton = document.getElementById("export-menu-close-container");
		let startButton = document.getElementById("button-render");
		let renderLength = document.getElementById("input-render-length");
		let ongoing = document.getElementById("export-ongoing-container");
		let progress = document.getElementById("export-progress-anim");
		let link = document.getElementById("wav-link-container");

		startButton.disabled = isExporting;
		renderLength.disabled = isExporting;

		if (isExporting) {
			ongoing.style.display = "block";
			link.style.display = "none";
			progress.classList.add("moving");
			closeButton.style.display = "none";
		} else {
			ongoing.style.display = "none";
			link.style.display = "block";
			progress.classList.remove("moving");
			closeButton.style.display = "block";
		}
	}

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