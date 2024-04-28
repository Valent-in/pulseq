"use strict";

function SynthHelper(songObj, synthUi, rebuildPatternSynthListCallback) {
	let that = this;
	let selectedSynthIndex = 0;
	let mixerIsShown = false;

	let deleteSynthBtn = document.getElementById("button-delete-synth");

	document.getElementById("button-add-synth").addEventListener("click", () => {
		let defaultName = songObj.generateSynthName();
		showPrompt("Enter synth name", (result) => {
			if (!result) {
				console.log("Synth NOT created");
				return;
			}
			that.createNewSynth(result);
			g_switchTab("synth");
		}, defaultName);
	});

	document.getElementById("button-synth-mute").onclick = () => {
		selectedSynthIndex = songObj.currentSynthIndex;
		let synth = songObj.synths[selectedSynthIndex];
		synth.mute(!synth.isMuted);

		synthUi.updateMuteControls(synth);
		updateMuteMarkers();
	};

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

		that.rebuildSynthList();
		rebuildPatternSynthListCallback(false);
	};

	document.getElementById("button-synth-menu-open").onclick = () => {
		selectedSynthIndex = songObj.currentSynthIndex;
		openSynthMenu();
	};

	document.getElementById("button-synth-menu-close").onclick = () => {
		hideModal("synth-modal-menu");
	};

	let synthNameInput = document.getElementById("input-synth-name");
	synthNameInput.addEventListener("change", (event) => {
		let value = event.target.value;

		if (value) {
			songObj.synthNames[selectedSynthIndex] = value;
			that.rebuildSynthList();
			rebuildPatternSynthListCallback(false);

			if (selectedSynthIndex == songObj.currentSynthIndex) {
				let synthName = document.getElementById("synth-name-area");
				synthName.textContent = value;
			}
		}
	});

	synthNameInput.addEventListener("keydown", (event) => {
		if (event.key == "Escape") {
			synthNameInput.value = songObj.synthNames[selectedSynthIndex];
		}
	});

	deleteSynthBtn.onclick = () => {
		if (songObj.synths.length == 1) {
			showAlert("Can not delete last synth");
			return;
		}

		showConfirm("Delete selected synth?", (isOk) => {
			if (!isOk)
				return;

			songObj.deleteSynth(selectedSynthIndex);
			rebuildPatternSynthListCallback(true);
			synthUi.assignSynth(songObj.synthParams[0], songObj.synths[0], songObj.synthNames[0]);
			songObj.currentSynthIndex = 0;
			that.rebuildSynthList();
			updateMuteMarkers();
			g_switchTab("synth-list");
			hideModal("synth-modal-menu");
		});
	};

	let synthPresetSelect = document.getElementById("select-synth-preset");
	synthPresetSelect.onchange = () => {
		let index = synthPresetSelect.selectedIndex - 1;
		let value = synthPresetSelect.value;
		console.log("preset", index, value);
		synthPresetSelect.value = "Preset";

		showConfirm("Overwrite selected synth?", (isOk) => {
			if (!isOk)
				return;

			let synth = songObj.synths[selectedSynthIndex];
			let synthParams = this.loadSynth(SYNTH_PRESETS[index], synth);
			songObj.synthParams[selectedSynthIndex] = synthParams;

			if (selectedSynthIndex == songObj.currentSynthIndex)
				synthUi.assignSynth(synthParams, synth, songObj.synthNames[selectedSynthIndex]);

			hideModal("synth-modal-menu");
		});
	};

	document.getElementById("button-copy-synth").onclick = () => {
		let name = songObj.synthNames[selectedSynthIndex];
		let defaultName = songObj.generateSynthName(name.split("-")[0] + "-", 2);

		showPrompt("Copy synth \"" + name + "\" to", (result) => {
			if (result === null)
				return;

			let sameCount = 0;
			for (let e of songObj.synthNames)
				if (e == result)
					sameCount++;

			let confirmMsg = sameCount <= 1 ?
				"Synth with name '" + result + "' already exists. Overwrite?" :
				sameCount + " synths with name '" + result + "' already exist. Overwrite?";

			if (sameCount > 0) {
				showConfirm(confirmMsg, (isOk) => {
					hideModal("synth-modal-menu");
					if (!isOk)
						return;

					for (let i = 0; i < songObj.synthNames.length; i++) {
						if (result == songObj.synthNames[i]) {

							let sourceParams = songObj.synthParams[selectedSynthIndex];
							let targetParams = songObj.synthParams[i];
							let targetSynth = songObj.synths[i];

							for (let key in sourceParams) {
								targetParams[key] = sourceParams[key];
								synthParamApply(key, targetParams[key], targetSynth);
							}
						}
					}
				});
			}

			if (sameCount >= 1) {
				g_switchTab("synth-list");
				return;
			}

			that.createNewSynth(result, songObj.synthParams[selectedSynthIndex]);

			console.log("Synth '" + name + "' copied to '" + result + "'");
			that.rebuildSynthList();
			g_switchTab("synth-list");
			hideModal("synth-modal-menu");
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

			let synth = songObj.synths[selectedSynthIndex];
			let synthParams = songObj.synthParams[selectedSynthIndex];
			let newParams = that.loadSynth(params, synth);
			for (let key in newParams)
				synthParams[key] = newParams[key];

			if (selectedSynthIndex == songObj.currentSynthIndex)
				synthUi.assignSynth(synthParams, synth, songObj.synthNames[selectedSynthIndex]);

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

		let expString = JSON.stringify(songObj.synthParams[selectedSynthIndex], null, 1);
		let file = new Blob([expString], { type: 'text/json' });
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

		if (!copyFromParams) {
			songObj.currentSynthIndex = songObj.synths.length - 1;
			let synthParamObj = songObj.synthParams[songObj.currentSynthIndex];
			let synth = songObj.synths[songObj.currentSynthIndex];
			synthUi.assignSynth(synthParamObj, synth, name);
		}

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

				synthUi.assignSynth(songObj.synthParams[i], songObj.synths[i], songObj.synthNames[i]);
				songObj.currentSynthIndex = i;
				g_markCurrentSynth();
				g_switchTab("synth");
			})
		}

		g_markCurrentSynth();

		let listInfo = document.getElementById("synth-list-caption-area");
		listInfo.textContent = "Instruments (" + songObj.synths.length + ")";

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

			entry.classList.add("synth-list-entry");
			return entry;
		}
	}

	this.loadSynth = function (synthParams, targetSynth) {
		let newParams = {};
		let paramCount = 0;

		for (let key in DEFAULT_PARAMS.synthState) {
			if (key in synthParams) {
				newParams[key] = synthParams[key];
				paramCount++;
			} else {
				newParams[key] = DEFAULT_PARAMS.synthState[key];
			}
		}

		// Convert modulation envelope settings (previous versions)
		if (synthParams["synth-mod-envelope-state"] == "enabled") {
			newParams["synth-mod-envelope-type"] = "exponential";
		}

		if (synthParams["synth-mod-envelope-state"] == "lock") {
			newParams["synth-mod-envelope-type"] = "exponential";
			newParams["synth-mod-envelope-attack"] = newParams["synth-envelope-attack"];
			newParams["synth-mod-envelope-decay"] = newParams["synth-envelope-decay"];
			newParams["synth-mod-envelope-release"] = newParams["synth-envelope-release"];
			newParams["synth-mod-envelope-sustain"] = newParams["synth-envelope-sustain"];
		}

		// Convert modulation intensity
		for (let param in newParams) {
			if (newParams[param] == "envelopeModRev") {
				newParams[param] = "envelopeMod";
				let valueKey = param.replace("-input", "-value");
				newParams[valueKey] = -newParams[valueKey];
			}
		}

		for (let key in newParams) {
			synthParamApply(key, newParams[key], targetSynth);
		}

		if (paramCount == 0)
			showToast("Invalid synth config");

		return newParams;
	}

	function openSynthMenu() {
		showModal("synth-modal-menu");
		document.getElementById("input-synth-name").value = songObj.synthNames[selectedSynthIndex];
		deleteSynthBtn.disabled = (songObj.synths.length == 1);
	}

	document.getElementById("button-mixer-menu-open").onclick = () => {
		buildMixerList();
		showModal("mixer-modal-menu");
		mixerIsShown = true;
	};

	document.getElementById("button-mixer-menu-close").onclick = () => {
		closeMixer();
	};

	window.addEventListener("keyup", (event) => {
		if (event.key == "Escape" && mixerIsShown)
			closeMixer();
	});

	document.getElementById("button-mute-all").onclick = () => {
		muteAllSynths(true);
	};

	document.getElementById("button-unmute-all").onclick = () => {
		muteAllSynths(false);
	};

	function closeMixer() {
		let index = songObj.currentSynthIndex;
		synthUi.assignSynth(songObj.synthParams[index], songObj.synths[index], songObj.synthNames[index]);

		updateMuteMarkers();
		hideModal("mixer-modal-menu");

		let container = document.getElementById("mixer-list-container");
		container.innerHTML = "";

		mixerIsShown = false;
	}

	function muteAllSynths(isMute) {
		songObj.synths.forEach(e => e.mute(isMute));
		buildMixerList();
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
			let fxValue = params["synth-fx-type"] == "[none]" ? false : true;

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
			fxCheckbox.checked = fxValue;
			let fxLabel = document.createElement("LABEL");
			fxLabel.appendChild(document.createTextNode("FX"));
			fxLabel.htmlFor = fxCheckbox.id;

			if (!synth.lastFXType) {
				fxCheckbox.disabled = true;
				fxLabel.classList.add("disabled");
			}

			let muteButton = document.createElement("BUTTON");
			muteButton.classList.add("button--small");
			muteButton.appendChild(document.createTextNode("Mute"));
			if (synth.isMuted)
				muteButton.classList.add("button--highlight-orange");

			headerDiv.appendChild(nameSpan);
			headerDiv.appendChild(muteButton);
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