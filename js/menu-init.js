"use strict";

function menuInit(songObj, onSongChangeCallback, loadSynthCallback, renderCallback, midiCallback) {

	const backupStorage = "pulseq-backup";
	let storedSong = localStorage.getItem(backupStorage);

	let enterPressed = false;

	window.onbeforeunload = function () {
		backupToLocalStorage();
		return "Leave App?"
	};

	window.onblur = () => {
		backupToLocalStorage();
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

	let btnContinue = document.getElementById("button-continue-session");
	if (!storedSong)
		btnContinue.classList.add("nodisplay");

	btnContinue.onclick = () => {
		showModal("loading-modal");

		setTimeout(() => {
			if (importSong(storedSong)) {
				console.log("## loaded from local storage ##");
				hideModal("startup-modal-menu");
				storedSong = null;
			} else {
				console.log("## error in local storage data ##");
				showAlert("Can not restore previous session");
			}
			hideModal("loading-modal");
		}, 10);
	}

	/*
	 * Demo modal menu
	 */
	document.getElementById("demo-list-container").onclick = (event) => {
		if (!event.target.classList.contains("js-demo-entry"))
			return;

		console.log("# demo track", event.target.dataset.file);

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
	document.getElementById("button-arrange-menu-open").onclick = arrangeMenuOpen;
	document.getElementById("song-title-area").onclick = arrangeMenuOpen;

	function arrangeMenuOpen() {
		document.getElementById("input-bpm-value").value = songObj.bpm;
		document.getElementById("input-steps-value").value = songObj.barSteps;

		highlight(bpmSet, false);
		highlight(barStepsSet, false);

		showModal("arrange-modal-menu");

		titleInput.value = songObj.title;
		if (!songObj.title)
			titleInput.focus();
	};

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

		if (bpmValue < 4 || bpmValue > 440) {
			showAlert("BPM should be in range 4..440");
			bpmValue = songObj.bpm;
		}

		bpmInput.value = bpmValue;
		showToast("BPM: " + bpmValue);

		songObj.setBpm(bpmValue);
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
		let stepsFromInput = Number(barStepsInput.value);
		let stepsValue = Math.floor(stepsFromInput);

		if (stepsFromInput != stepsValue)
			barStepsInput.value = stepsValue;

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
				barStepsInput.value = songObj.barSteps;
				return;
			}

			if (stepsValue < 4) {
				showAlert("Minimum bar length is 4 steps");
				barStepsInput.value = songObj.barSteps;
				return;
			}

			songObj.setBarLength(stepsValue);
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

		let file = new Blob([exportSong(true)], { type: 'text/json' });
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

	document.getElementById("button-pattern-menu-open").onclick = patternMenuOpen;

	let patternNameArea = document.getElementById("pattern-name-area");
	patternNameArea.onclick = patternMenuOpen;

	function patternMenuOpen() {
		patternNameInput.value = songObj.currentPattern.name;

		let barsInPattern = Math.round(songObj.currentPattern.length / songObj.barSteps);
		document.getElementById("input-pattern-length").value = barsInPattern;

		let synthName = songObj.getCurrentLayerSynthName();
		let synthSelect = document.getElementById("button-synth-select");
		synthSelect.textContent = synthName === null ? "[none]" : synthName || "[ ... ]";

		document.getElementById("button-color-select").style.backgroundColor =
			DEFAULT_PARAMS.colorSet[songObj.currentPattern.colorIndex];

		deletePatternBtn.disabled = (songObj.patterns.length == 1);
		deleteLayerBtn.disabled = (songObj.currentPattern.patternData.length == 1);

		highlight(patternLengthSet, false);

		showModal("pattern-modal-menu");
	};

	patternNameInput.onchange = (event) => {
		let value = event.target.value || "";
		songObj.currentPattern.name = value;
		patternNameArea.textContent = value;
		onSongChangeCallback(false);
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

		let currentBars = songObj.currentPattern.length / songObj.barSteps;
		let currentLen = songObj.currentPattern.length;
		let maxPatternLength = Math.floor(DEFAULT_PARAMS.maxPatternSteps / songObj.barSteps) * songObj.barSteps;
		let maxPatternBars = maxPatternLength / songObj.barSteps;

		if (bars > maxPatternBars) {
			patternLengthInput.value = currentBars;
			showAlert("Maximum pattern length is " + maxPatternBars + " bars (" + maxPatternLength + " steps)");
			return;
		}

		if (bars < 1) {
			patternLengthInput.value = currentBars;
			showAlert("Minimum pattern length is 1 bar (" + songObj.barSteps + " steps)");
			return;
		}

		if (len % songObj.barSteps != 0) {
			len = Math.ceil(len / songObj.barSteps) * songObj.barSteps;
			bars = Math.round(len / songObj.barSteps);
			patternLengthInput.value = bars;
			showAlert("Pattern length rounded to " + bars + " bars (" + len + " steps)");
		}

		if (songObj.setCurrentPatternLength(len)) {
			if (len >= currentLen)
				onSongChangeCallback(false);
			else
				onSongChangeCallback(false, "release");

			let str = bars > 1 ? " bars (" : " bar (";
			showToast("Pattern length: " + bars + str + songObj.currentPattern.length + " steps)");
		} else {
			patternLengthInput.value = currentBars;
			showAlert("Can not extend pattern");
		}
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
			showToast("Pattern deleted");
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
		let defaultName = songObj.generatePatternName(name.split("-")[0] + "-");

		document.getElementById("span-pattern-for-copy").textContent = "'" + name + "'";
		showModal("pattern-copy-modal-menu");

		document.getElementById("input-pattern-copy-name").value = defaultName;
	};

	document.getElementById("button-pattern-menu-close").onclick = () => {
		hideModal("pattern-modal-menu");
	};

	/*
	 * Pattern copy menu
	 */
	let inputPatternCopy = document.getElementById("input-pattern-copy-name");

	document.getElementById("button-create-pattern").onclick = copyPattern;

	inputPatternCopy.addEventListener("keyup", (event) => {
		if (event.key == "Enter")
			copyPattern();
	});

	document.getElementById("button-pattern-copy-menu-close").onclick = () => {
		hideModal("pattern-copy-modal-menu");
	};

	function copyPattern() {
		let newName = inputPatternCopy.value;
		let isPlaceUnder = document.getElementById("input-copy-pattern-under").checked;

		let index = songObj.currentPatternIndex;
		songObj.copyPattern(songObj.currentPattern, newName);

		if (isPlaceUnder) {
			songObj.movePattern(songObj.patterns.length - 1, index + 1)
		}

		hideModal("pattern-copy-modal-menu");
		hideModal("pattern-modal-menu");
		g_switchTab("arrange");
		showToast("Pattern copied")

		onSongChangeCallback(false);

		if (!isPlaceUnder)
			g_scrollToLastPattern();
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
	 * Layer edit menu
	 */
	document.getElementById("button-layer-edit-open").onclick = () => {
		if (songObj.currentPattern.isActiveLayerEmpty())
			showAlert("Layer is empty");
		else
			showModal("layer-edit-modal-menu");
	};

	document.getElementById("button-layer-edit-close").onclick = () => {
		hideModal("layer-edit-modal-menu");
	};

	document.getElementById("button-shift-layer").onclick = () => {
		hideModal("layer-edit-modal-menu");
		showModal("layer-shift-modal-menu");
	};

	document.getElementById("button-transpose-layer").onclick = () => {
		hideModal("layer-edit-modal-menu");
		showModal("layer-transpose-modal-menu");
	};

	document.getElementById("button-copy-layer").onclick = () => {
		hideModal("layer-edit-modal-menu");
		hideModal("pattern-modal-menu");
		showToast("Layer copied");

		songObj.currentPattern.copyActiveLayer();
		onSongChangeCallback(false, null, true);
	};

	/*
	 * Layer fade menu
	 */
	let fadeTypeSetRadio = document.getElementById("input-fade-type-set");
	let inputFadeStart = document.getElementById("input-fade-start");
	let inputFadeEnd = document.getElementById("input-fade-end");
	let inputFadeAdd = document.getElementById("input-fade-add");

	document.getElementById("button-fade-layer").onclick = () => {
		openFadeDialog();
	}

	document.getElementById("layer-block-title").onclick = () => {
		openFadeDialog();
	}

	function openFadeDialog() {
		if (songObj.currentPattern.isActiveLayerEmpty()) {
			showToast("Layer is empty");
			return;
		}

		let range = songObj.currentPattern.getFadeRange();
		inputFadeStart.value = range.startVolume;
		inputFadeEnd.value = range.endVolume;
		disableFadeInputs();

		hideModal("layer-edit-modal-menu");
		showModal("layer-fade-modal-menu");
	}

	fadeTypeSetRadio.onchange = () => {
		disableFadeInputs();
	}

	document.getElementById("input-fade-type-add").onchange = () => {
		disableFadeInputs();
	}

	function disableFadeInputs() {
		let mode = fadeTypeSetRadio.checked;
		inputFadeStart.disabled = !mode;
		inputFadeEnd.disabled = !mode;
		inputFadeAdd.disabled = mode;
	}

	document.getElementById("button-apply-fade").onclick = applyFade;

	inputFadeStart.addEventListener("keyup", (event) => {
		if (event.key == "Enter")
			inputFadeEnd.focus();
	});

	inputFadeEnd.addEventListener("keyup", (event) => {
		if (event.key == "Enter")
			applyFade();
	});

	inputFadeAdd.addEventListener("keydown", (event) => {
		if (event.key == "Enter")
			enterPressed = true;
	});

	inputFadeAdd.addEventListener("keyup", (event) => {
		if (enterPressed && event.key == "Enter")
			applyFade();

		enterPressed = false;
	});

	function applyFade() {
		if (fadeTypeSetRadio.checked) {
			let startVolume = Number(inputFadeStart.value);
			let endVolume = Number(inputFadeEnd.value);

			// actual limit is 100 - exceeding values will be capped
			if (startVolume < 1 || startVolume > 200 || endVolume < 1 || endVolume > 200) {
				showAlert("Volume values should be in range 1..100");
				return;
			}

			songObj.currentPattern.fadeActiveLayer(startVolume, endVolume);
		} else {
			let volumeMod = inputFadeAdd.value;

			if (volumeMod == "" || volumeMod < -100 || volumeMod > 100) {
				showAlert("Volume modifier should be in range -100..100");
				return;
			}

			songObj.currentPattern.fadeAddActiveLayer(volumeMod);
		}

		onSongChangeCallback(false, null, true);
		hideModal("pattern-modal-menu");
		hideModal("layer-fade-modal-menu");
	};

	document.getElementById("button-fade-menu-close").onclick = () => {
		hideModal("layer-fade-modal-menu");
	};

	/*
	 * Layer shift menu
	 */
	let shiftStepsInput = document.getElementById("input-shift-value");

	document.getElementById("button-apply-shift").onclick = () => {
		patternShift();
	};

	shiftStepsInput.addEventListener("keyup", (event) => {
		if (event.key == "Enter") {
			patternShift();
		}
	});

	function patternShift() {
		let wholeChk = document.getElementById("input-shift-whole-pattern");
		let steps = Number(shiftStepsInput.value);
		songObj.currentPattern.shiftActiveLayer(steps, wholeChk.checked);
		hideModal("pattern-modal-menu");
		hideModal("layer-shift-modal-menu");
		onSongChangeCallback(false, null, true);
	}

	document.getElementById("button-shift-menu-close").onclick = () => {
		hideModal("layer-shift-modal-menu");
	};

	/*
	 * Layer transpose menu
	 */
	let transposeStepsInput = document.getElementById("input-transpose-value");

	document.getElementById("button-transpose-menu-close").onclick = () => {
		hideModal("layer-transpose-modal-menu");
	};

	document.getElementById("button-apply-transpose").onclick = () => {
		layerTranspose();
	};


	transposeStepsInput.addEventListener("keydown", (event) => {
		if (event.key == "Enter")
			enterPressed = true;
	});

	transposeStepsInput.addEventListener("keyup", (event) => {
		if (enterPressed && event.key == "Enter") {
			layerTranspose();
		}
		enterPressed = false;
	});

	function layerTranspose() {
		let steps = Number(transposeStepsInput.value);
		let result = songObj.currentPattern.transposeActiveLayer(Math.floor(steps));

		if (!result) {
			showAlert("No room for transposing");
		} else {
			hideModal("pattern-modal-menu");
			hideModal("layer-transpose-modal-menu");
			onSongChangeCallback(false, null, true);
		}
	}

	/*
	 * Settings modal menu
	 */
	let buttonZoom = document.getElementById("button-zoom-set");
	let inputZoom = document.getElementById("input-zoom-value");
	inputZoom.value = 100;

	document.getElementById("button-settings-open").onclick = () => {
		showModal("settings-modal-menu");
		highlight(buttonZoom, false);

		let zoom = getAppSettings("zoom");
		if (zoom)
			inputZoom.value = zoom;
		else
			inputZoom.value = 100;
	};

	document.getElementById("button-reset-app").onclick = () => {
		showConfirm("Application restart. All unsaved data will be lost!\nContinue?", (isOk) => {
			if (!isOk)
				return;

			console.log("bye!");
			localStorage.removeItem(backupStorage);
			window.onbeforeunload = null;
			document.location.reload();
		});
	};

	inputZoom.oninput = () => {
		highlight(buttonZoom, true);
	}

	inputZoom.addEventListener("keyup", (event) => {
		if (event.key == "Enter") {
			setZoom();
		}
	});

	buttonZoom.onclick = () => {
		setZoom();
	};

	function setZoom() {
		let zoom = Number(inputZoom.value);

		if (zoom < 50 || zoom > 200) {
			showAlert("Zoom percent should be in range 50..200");
			return;
		}

		document.body.style.zoom = zoom + "%";
		highlight(buttonZoom, false);

		if (zoom == 100) {
			setAppSettings("zoom", null);
			return;
		}

		showConfirm("Keep this zoom value?", (isOk) => {
			if (isOk) {
				setAppSettings("zoom", zoom);
			} else {
				document.body.style.zoom = "100%";
				setAppSettings("zoom", null);
				inputZoom.value = 100;
			}
		});
	}

	document.getElementById("button-cleanup-menu-open").onclick = () => {
		showConfirm("This will delete unused patterns and layers.\nContinue?", (isOk) => {
			if (!isOk)
				return;

			hideModal("settings-modal-menu");
			songObj.cleanup();
			onSongChangeCallback(true, "stop");
			g_switchTab("arrange");
			showToast("Cleanup...");
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

	function exportSong(isCleanup) {
		let expObj = {};

		expObj.songFormatVersion = DEFAULT_PARAMS.fileFormatVersion;

		if (isCleanup) {
			expObj.synthParams = [];
			for (let i = 0; i < songObj.synthParams.length; i++)
				expObj.synthParams.push(songObj.getCleanSynthParams(i))
		} else {
			expObj.synthParams = songObj.synthParams;
		}

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

	function backupToLocalStorage() {
		if (!songObj.patterns[0]) {
			console.log("## nothing to backup ##");
			return;
		}

		if (songObj.isSongEmpty()) {
			console.log("## clearing local storage backup ##");
			localStorage.removeItem(backupStorage);
		} else {
			console.log("## saving song data to local storage ##");
			localStorage.setItem(backupStorage, exportSong(false));
		}
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
}