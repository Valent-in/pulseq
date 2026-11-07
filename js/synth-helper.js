"use strict";

function SynthHelper(songObj, synthUi, rebuildPatternSynthListCallback) {
	let that = this;
	let selectedSynthIndex = 0;
	let mixerIsShown = false;

	this.toggleMixer = () => {
		if (mixerIsShown)
			closeMixer();
		else
			showMixer();
	}

	let pressTimeout = null;
	let cancelClick = false;

	let synthPresetSelect = document.getElementById("select-synth-preset");
	let deleteSynthBtn = document.getElementById("button-delete-synth");
	let synthNameArea = document.getElementById("synth-name-area");

	let unmuteMsg = "Unmute all";

	let listInfo = document.getElementById("synth-list-caption-area");
	listInfo.onclick = () => {
		muteAllSynths(false);
		synthUi.updateMuteControls();
		that.rebuildSynthList();
		showToast(unmuteMsg);
	}

	document.getElementById("button-add-synth").addEventListener("click", () => {
		let defaultName = songObj.generateSynthName();
		showPrompt("Create synthesizer", (result) => {
			if (result === null)
				return;

			that.createNewSynth(result || "");
			g_switchTab("synth");
			showToast("New synthesizer");
		}, defaultName);
	});

	document.getElementById("button-synth-mute").onclick = () => {
		if (cancelClick)
			return;

		selectedSynthIndex = songObj.currentSynthIndex;
		let synth = songObj.synths[selectedSynthIndex];
		synth.mute(!synth.isMuted);

		synthUi.updateMuteControls();
		that.rebuildSynthList();
	};

	document.getElementById("button-synth-mute").onpointerdown = () => {
		cancelClick = false;
		selectedSynthIndex = songObj.currentSynthIndex;
		let synth = songObj.synths[selectedSynthIndex];

		pressTimeout = setTimeout(() => {
			if (songObj.synths.length < 2)
				return;

			cancelClick = true;
			synth.mute(false);

			let mutedCount = 0;
			for (let i = 0; i < songObj.synths.length; i++)
				if (songObj.synths[i].isMuted)
					mutedCount++;

			if (mutedCount == songObj.synths.length - 1) {
				showToast(unmuteMsg);
				muteAllSynths(false);
			} else {
				showToast("Solo");
				for (let i = 0; i < songObj.synths.length; i++)
					if (i != selectedSynthIndex)
						songObj.synths[i].mute(true);
			}

			synthUi.updateMuteControls();
			that.rebuildSynthList();
		}, DEFAULT_PARAMS.pressDelay);
	};

	document.getElementById("button-synth-mute").onpointerup = pointerEndListener;
	document.getElementById("button-synth-mute").onpointercancel = pointerEndListener;
	document.getElementById("button-synth-mute").onpointerleave = pointerEndListener;

	function pointerEndListener() {
		clearTimeout(pressTimeout);
		pressTimeout = null;
	}

	function selectSynth(index) {
		let params = songObj.synthParams[index];
		let synth = songObj.synths[index];
		let name = songObj.synthNames[index];
		synthUi.assignSynth(params, synth, name);
		songObj.currentSynthIndex = index;
	}

	function updateMuteMarkers() {
		let isSomeMuted = false;
		for (let s of songObj.synths)
			if (s.isMuted)
				isSomeMuted = true;

		let listTab = document.getElementById("synth-list-tab");
		if (isSomeMuted)
			listTab.classList.add("muted-m-mark");
		else
			listTab.classList.remove("muted-m-mark");
	};

	let isSynthGrouped = false;
	let groupButton = document.getElementById("button-toggle-group");
	let synthGroups = document.querySelectorAll("#synth-main > div:not(:first-child)");

	let groupTabs = document.querySelectorAll(".group-tab");
	groupTabs.forEach(e => { e.onclick = groupTabListener });

	groupButton.onclick = () => {
		let groupBlock = document.getElementById("synth-grouping");

		if (isSynthGrouped) {
			groupBlock.classList.add("synth-ungroup");
			groupButton.textContent = "Group";
			groupTabs.forEach(e => { e.classList.remove("tab--active") });
			synthGroups.forEach(e => { e.classList.remove("hidden-group") });
		} else {
			groupBlock.classList.remove("synth-ungroup");
			groupButton.textContent = "All";
		}

		isSynthGrouped = !isSynthGrouped;
	}

	function groupTabListener() {
		groupTabs.forEach(e => { e.classList.remove("tab--active") });
		this.classList.add("tab--active");
		let group = this.dataset.group;
		synthGroups.forEach(e => {
			if (e.classList.contains(group))
				e.classList.remove("hidden-group")
			else
				e.classList.add("hidden-group")
		});
	}

	document.getElementById("button-synth-menu-open").onclick = synthMenuOpen;
	synthNameArea.onclick = synthMenuOpen;

	function synthMenuOpen() {
		selectedSynthIndex = songObj.currentSynthIndex;
		openSynthMenu();
	};

	document.getElementById("button-synth-menu-close").onclick = () => {
		hideModal("synth-modal-menu");
	};

	let synthNameInput = document.getElementById("input-synth-name");
	synthNameInput.addEventListener("change", (event) => {
		let value = event.target.value || "";

		songObj.synthNames[selectedSynthIndex] = value;
		that.rebuildSynthList();
		rebuildPatternSynthListCallback(false);

		if (selectedSynthIndex == songObj.currentSynthIndex) {
			synthNameArea.textContent = value;
		}
	});

	deleteSynthBtn.onclick = () => {
		if (songObj.synths.length == 1) {
			showAlert("Can not delete last synth");
			return;
		}

		showConfirm("Delete selected synthesizer?", (isOk) => {
			if (!isOk)
				return;

			songObj.deleteSynth(selectedSynthIndex);
			rebuildPatternSynthListCallback(true);
			selectSynth(0);

			that.rebuildSynthList();
			g_switchTab("synth-list");
			hideModal("synth-modal-menu");
			showToast("Synthesizer deleted");
		});
	};

	document.getElementById("button-i-plugin-select").addEventListener("click", () => {
		// Actual plugin selector implemented in wam-ui.js
		// Pass selectedSynthIndex to songObj
		g_switchTab("synth");
		if (songObj.currentSynthIndex != selectedSynthIndex) {
			selectSynth(selectedSynthIndex);
			g_markCurrentSynth();
		}
	});

	synthPresetSelect.onchange = () => {
		let index = synthPresetSelect.selectedIndex - 1;
		let value = synthPresetSelect.value;
		console.log("preset", index, value);
		synthPresetSelect.value = "Preset";

		showConfirm("Overwrite selected synth?", (isOk) => {
			if (!isOk)
				return;

			let synth = songObj.synths[selectedSynthIndex];
			let synthParams = loader.loadSynth(SYNTH_PRESETS[index], synth);
			songObj.synthParams[selectedSynthIndex] = synthParams;

			// Clear name to prevent number cycling
			songObj.synthNames[selectedSynthIndex] = "";
			let newName = SYNTH_PRESETS[index]["-name"].split(" ")[0];
			if (newName == "[default]")
				songObj.synthNames[selectedSynthIndex] = songObj.generateSynthName("synth", selectedSynthIndex + 1);
			else
				songObj.synthNames[selectedSynthIndex] = songObj.generateSynthName(newName, 0);

			rebuildPatternSynthListCallback(false);
			that.rebuildSynthList();

			if (selectedSynthIndex == songObj.currentSynthIndex)
				synthUi.assignSynth(synthParams, synth, songObj.synthNames[selectedSynthIndex]);

			hideModal("synth-modal-menu");
		});
	};

	document.getElementById("select-send-effect").onchange = (e) => {
		let slot = e.target.value;

		if (slot == "[none]") {
			songObj.setSend(selectedSynthIndex, null)
			return;
		}

		let index = Number(slot);
		songObj.setSend(selectedSynthIndex, index);
	}

	function createSynthObj(index, params) {
		if (params.pluginState) {
			songObj.synths[index] = new WamSynth(songObj.compressor, songObj.bpm);
			songObj.restoreSynthPlugin(songObj.synths[index], params.pluginState, true);
		} else {
			songObj.synths[index] = new Synth(songObj.compressor, songObj.bpm);
		}
	}

	document.getElementById("button-copy-synth").onclick = () => {
		let name = songObj.synthNames[selectedSynthIndex];
		let defaultName = songObj.generateSynthName(name.split("-")[0] + "-", 2);

		showPrompt("Copy synth '" + name + "' to", (result) => {
			if (result === null)
				return;

			let nextInd = songObj.synths.length;
			let params = songObj.synthParams[selectedSynthIndex];
			let newParams = JSON.parse(JSON.stringify(params));
			createSynthObj(nextInd, newParams);
			loader.loadSynth(newParams, songObj.synths[nextInd]);
			songObj.synthParams[nextInd] = newParams;
			songObj.synthNames[nextInd] = result;

			console.log("Synth '" + name + "' copied to '" + result + "'");
			that.rebuildSynthList();
			g_switchTab("synth-list");
			hideModal("synth-modal-menu");
			showToast("Synthesizer copied");
		}, defaultName);
	};

	let importSynthInput = document.getElementById("input-import-synth");
	importSynthInput.onchange = (e) => {
		let file = e.target.files[0];
		if (!file)
			return;

		let reader = new FileReader();
		reader.onload = function (ev) {
			let synthStr = ev.target.result;
			let params;

			try {
				params = JSON.parse(synthStr);
			} catch {
				showAlert("JSON parsing error");
				return;
			}

			songObj.synths[selectedSynthIndex].destroy();
			createSynthObj(selectedSynthIndex, params);
			songObj.restoreSends();

			let synth = songObj.synths[selectedSynthIndex];
			songObj.synthParams[selectedSynthIndex] = loader.loadSynth(params, synth);

			let newName = songObj.generateSynthName(file.name.split(".")[0].split(" ")[0], 0);
			songObj.synthNames[selectedSynthIndex] = newName;
			rebuildPatternSynthListCallback(false);
			that.rebuildSynthList();

			if (selectedSynthIndex == songObj.currentSynthIndex)
				synthUi.assignSynth(songObj.synthParams[selectedSynthIndex], synth, newName);

			hideModal("synth-modal-menu");
		};
		reader.readAsText(file);
		e.target.value = null;
	};

	importSynthInput.ondragenter = () => {
		importSynthInput.classList.add("dragover");
	}

	importSynthInput.ondragleave = () => {
		importSynthInput.classList.remove("dragover");
	}

	importSynthInput.ondrop = () => {
		importSynthInput.classList.remove("dragover");
	}

	document.getElementById("link-synth-export").onclick = (e) => {
		let lnk = e.target;
		if (lnk.protocol == "blob:")
			URL.revokeObjectURL(lnk.href);

		let expString = JSON.stringify(songObj.getCleanSynthParams(selectedSynthIndex), null, 1);
		let file = new Blob([expString], { type: 'text/plain' });
		lnk.href = URL.createObjectURL(file);
		let name = songObj.synthNames[selectedSynthIndex] || "synth";
		lnk.download = name + ".synth.json";
	};

	this.buildPresetList = function () {
		for (let preset of SYNTH_PRESETS) {
			let option = document.createElement("OPTION");
			option.appendChild(document.createTextNode(preset["-name"]));
			synthPresetSelect.appendChild(option);
		}
		synthPresetSelect.value = "Preset";
	};

	this.createNewSynth = function (name, copyFromParams) {
		songObj.createSynth(name, copyFromParams);

		if (!copyFromParams)
			selectSynth(songObj.synths.length - 1);

		this.rebuildSynthList();
	}

	this.rebuildSynthList = function () {
		let container = document.getElementById("synth-list-main");
		container.innerHTML = "";

		for (let i = 0; i < songObj.synthNames.length; i++) {
			let entry = createSynthEntry(songObj.synthNames[i], songObj.synths[i].isMuted);
			entry.id = "synth-list-entry_" + i;
			container.appendChild(entry);

			entry.addEventListener("click", (event) => {
				selectedSynthIndex = i;

				if (event.target.classList.contains("js-synth-entry-menu")) {
					openSynthMenu();
					return;
				}

				selectSynth(i);
				g_markCurrentSynth();
				g_switchTab("synth");
			})
		}

		g_markCurrentSynth();
		updateMuteMarkers();
		rebuildPatternSynthListCallback(false);

		let voiceCount = 0;
		songObj.synths.forEach(e => { if (!e.isMuted) voiceCount++ });
		if (voiceCount == songObj.synths.length)
			listInfo.textContent = "Instruments (" + songObj.synths.length + ")";
		else
			listInfo.textContent = "Instruments (" + voiceCount + "/" + songObj.synths.length + ")";

		function createSynthEntry(name, isMuted) {
			let entry = document.createElement("DIV");

			let text = document.createTextNode(name);
			let tdiv = document.createElement("DIV");
			tdiv.classList.add("synth-entry-name");
			tdiv.appendChild(text);
			entry.appendChild(tdiv);

			let dots = document.createTextNode("•••");
			let mdiv = document.createElement("DIV");
			mdiv.classList.add("js-synth-entry-menu");
			mdiv.appendChild(dots);
			entry.appendChild(mdiv);

			if (isMuted)
				entry.classList.add("muted-mark");

			entry.classList.add("select-list-entry");
			return entry;
		}
	}

	function openSynthMenu() {
		showModal("synth-modal-menu");
		document.getElementById("input-synth-name").value = songObj.synthNames[selectedSynthIndex];
		deleteSynthBtn.disabled = (songObj.synths.length == 1);
		synthPresetSelect.disabled = !!songObj.synthParams[selectedSynthIndex].pluginState;

		let select = document.getElementById("select-send-effect");
		select.innerHTML = "";

		let o = document.createElement("OPTION");
		o.appendChild(document.createTextNode("[none]"));
		o.value = "[none]";
		select.appendChild(o);

		for (let i = 0; i < songObj.pluginStates.length; i++) {
			let o = document.createElement("OPTION");
			let pluginName = songObj.isPluginLoaded(i) && songObj.pluginStates[i].title;
			let text = "slot " + (i + 1) + " (" + (pluginName || "---") + ")";
			if (!songObj.isPluginLoaded(i))
				o.disabled = true;
			o.appendChild(document.createTextNode(text));
			o.value = i;
			select.appendChild(o);
		}

		if (songObj.sends[selectedSynthIndex] !== null)
			select.value = songObj.sends[selectedSynthIndex];

		let pluginSelect = document.getElementById("button-i-plugin-select");
		if (songObj.synthParams[selectedSynthIndex].pluginState)
			pluginSelect.textContent = songObj.synthParams[selectedSynthIndex].pluginState.title;
		else
			pluginSelect.textContent = "[none]";
	}

	document.getElementById("button-mixer-menu-open").onclick = showMixer;

	document.getElementById("button-mixer-menu-close").onclick = () => {
		closeMixer();
	};

	window.addEventListener("keyup", (event) => {
		if (event.key == "Escape" && mixerIsShown)
			closeMixer();
	});

	document.getElementById("button-mute-all").onclick = () => {
		muteAllSynths(true);
		buildMixerList();
	};

	document.getElementById("button-unmute-all").onclick = () => {
		muteAllSynths(false);
		buildMixerList();
	};

	function showMixer() {
		if (!songObj.synths.length)
			return;

		buildMixerList();
		mixerIsShown = true;
		showModal("mixer-modal-menu");
	}

	function closeMixer() {
		selectSynth(songObj.currentSynthIndex);

		that.rebuildSynthList();
		hideModal("mixer-modal-menu");

		let container = document.getElementById("mixer-list-container");
		container.innerHTML = "";

		mixerIsShown = false;
	}

	function muteAllSynths(isMute) {
		songObj.synths.forEach(e => e.mute(isMute));
	}

	function buildMixerList() {
		let container = document.getElementById("mixer-list-container");

		container.innerHTML = "";

		for (let i = 0; i < songObj.synths.length; i++) {
			container.appendChild(createEntry(i));
		}

		function createEntry(index) {
			let name = songObj.synthNames[index];
			let synth = songObj.synths[index];
			let params = songObj.synthParams[index];

			let volValue = params["synth-amplifier-gain"];
			let panValue = params["synth-pan"];
			let isFxEnabled = (params["synth-fx-type"] != "[none]")

			let entry = document.createElement("DIV");
			entry.classList.add("mixer-entry");

			let headerDiv = document.createElement("DIV");
			headerDiv.classList.add("mixer-header-line");
			let nameSpan = document.createElement("SPAN");
			nameSpan.appendChild(document.createTextNode(name));
			nameSpan.classList.add("caption-text");

			let fxCheckbox = document.createElement("INPUT");
			fxCheckbox.type = "checkbox";
			fxCheckbox.id = "mixer-fx-chk-" + index;
			fxCheckbox.checked = isFxEnabled;
			let fxLabel = document.createElement("LABEL");
			fxLabel.appendChild(document.createTextNode("FX"));
			fxLabel.htmlFor = fxCheckbox.id;

			if (!synth.lastFXType) {
				fxCheckbox.disabled = true;
				fxLabel.classList.add("disabled");
			}

			let fxWarn = document.createElement("SPAN");
			fxWarn.classList.add("fx-warning-span")
			fxWarn.appendChild(document.createTextNode("!"));
			if (DEFAULT_PARAMS.heavyEffects.includes(synth.lastFXType)) {
				fxWarn.style.visibility = "visible";
			} else {
				fxWarn.style.visibility = "hidden";
			}

			let muteButton = document.createElement("BUTTON");
			muteButton.classList.add("button--small");
			muteButton.appendChild(document.createTextNode("Mute"));
			if (synth.isMuted)
				muteButton.classList.add("button--highlight-orange");

			headerDiv.appendChild(nameSpan);
			headerDiv.appendChild(muteButton);
			headerDiv.appendChild(fxWarn);
			headerDiv.appendChild(fxLabel);
			headerDiv.appendChild(fxCheckbox);

			let volumeDiv = document.createElement("DIV");
			volumeDiv.classList.add("mixer-line");
			let volSpan = document.createElement("SPAN");
			volSpan.appendChild(document.createTextNode("Vol."));
			let volRange = document.createElement("INPUT");
			volRange.type = "range";
			volRange.classList.add("range--volume");
			volRange.min = 0;
			volRange.max = 1.2;
			volRange.step = 0.01;
			volRange.value = volValue;
			volRange.dataset.value = volValue;

			volumeDiv.appendChild(volSpan);
			volumeDiv.appendChild(volRange);

			let panDiv = document.createElement("DIV");
			panDiv.classList.add("mixer-line");
			panDiv.style["max-width"] = "80%";
			let panRange = document.createElement("INPUT");
			panRange.type = "range";
			panRange.classList.add("range--10-marks");
			panRange.min = -1;
			panRange.max = 1;
			panRange.step = 0.01;
			panRange.value = panValue;
			panRange.dataset.value = panValue;

			let panSpan = document.createElement("SPAN");
			panSpan.appendChild(document.createTextNode("Pan"));

			panDiv.appendChild(panRange);
			panDiv.appendChild(panSpan);

			nameSpan.onclick = () => {
				selectSynth(index);
				g_markCurrentSynth();
				g_switchTab("synth");

				that.rebuildSynthList();
				hideModal("mixer-modal-menu");
			}

			fxCheckbox.onchange = () => {
				if (fxCheckbox.checked) {
					let idValue = synthParamApply("synth-fx-type", synth.lastFXType || "[none]", synth);
					params[idValue.id] = idValue.value;
				} else {
					let idValue = synthParamApply("synth-fx-type", "[none]", synth);
					params[idValue.id] = idValue.value;
				}
			}

			muteButton.onclick = () => {
				synth.mute(!synth.isMuted);
				if (synth.isMuted)
					muteButton.classList.add("button--highlight-orange");
				else
					muteButton.classList.remove("button--highlight-orange");
			}

			volRange.oninput = (e) => {
				let idValue = synthParamApply("synth-amplifier-gain", e.target.value, synth);
				params[idValue.id] = idValue.value;
			}

			panRange.oninput = (e) => {
				let idValue = synthParamApply("synth-pan", e.target.value, synth);
				params[idValue.id] = idValue.value;
			}

			if ("ontouchstart" in window) {
				volRange.addEventListener("pointercancel", (e) => {
					e.target.value = e.target.dataset.value;
					let idValue = synthParamApply("synth-amplifier-gain", e.target.value, synth);
					params[idValue.id] = idValue.value;
				});

				volRange.addEventListener("change", (e) => {
					e.target.dataset.value = e.target.value;
				});

				panRange.addEventListener("pointercancel", (e) => {
					e.target.value = e.target.dataset.value;
					let idValue = synthParamApply("synth-pan", e.target.value, synth);
					params[idValue.id] = idValue.value;
				});

				panRange.addEventListener("change", (e) => {
					e.target.dataset.value = e.target.value;
				});
			}

			entry.appendChild(headerDiv);
			entry.appendChild(volumeDiv);
			entry.appendChild(panDiv);
			return entry;
		}
	}
}