"use strict"

function SynthList(songObj, synthUi, rebuildPatternSynthListCallback) {
	let o = {};
	let selectedSynthIndex = 0;

	let addSynth = document.getElementById("button-add-synth");
	addSynth.addEventListener("click", () => {
		let defaultName = "synth" + (songObj.synths.length + 1);
		g_showPrompt("Enter synth name", (result) => {
			if (!result) {
				console.log("Synth NOT created");
				return;
			}
			o.createNewSynth(result);
			g_switchTab("synth");
		}, defaultName);
	});

	document.getElementById("button-synth-menu-open").onclick = () => {
		selectedSynthIndex = songObj.currentSynthIndex;
		openSynthMenu();
	};

	document.getElementById("button-synth-menu-close").onclick = () => {
		document.getElementById("synth-modal-menu").classList.add("nodisplay");
	};

	let synthNameInput = document.getElementById("input-synth-name");
	synthNameInput.addEventListener("change", (event) => {
		let value = event.target.value;

		if (value) {
			songObj.synthNames[selectedSynthIndex] = value;
			o.rebuildSynthList();
			rebuildPatternSynthListCallback();

			if (selectedSynthIndex == songObj.currentSynthIndex) {
				let synthName = document.getElementById("synth-name-area");
				synthName.innerHTML = "";
				synthName.appendChild(document.createTextNode(value));
			}
		}
	});

	document.getElementById("button-delete-synth").onclick = () => {
		if (songObj.synths.length == 1) {
			g_showAlert("Can not delete last synth");
			return;
		}

		g_showConfirm("Delete current synth?", (isOk) => {
			if (!isOk)
				return;

			songObj.deleteSynth(selectedSynthIndex);
			rebuildPatternSynthListCallback();
			synthUi.assignSynth(songObj.synthParams[0], songObj.synths[0], songObj.synthNames[0]);
			songObj.currentSynthIndex = 0;
			o.rebuildSynthList();
			g_switchTab("synth-list");
			document.getElementById("synth-modal-menu").classList.add("nodisplay");
		});
	};

	let resetSynthButton = document.getElementById("button-reset-synth");
	resetSynthButton.addEventListener("click", () => g_showConfirm("Reset synth?", (isOk) => {
		if (!isOk)
			return;

		let synthParams = songObj.synthParams[selectedSynthIndex];
		let synth = songObj.synths[selectedSynthIndex];

		for (let key in DEFAULT_PARAMS.synthState) {
			synthParams[key] = DEFAULT_PARAMS.synthState[key];
			synthParamApply(key, synthParams[key], synth);
		}

		if (selectedSynthIndex == songObj.currentSynthIndex)
			synthUi.assignSynth(synthParams, synth, songObj.synthNames[selectedSynthIndex]);

		document.getElementById("synth-modal-menu").classList.add("nodisplay");
	}));

	document.getElementById("button-copy-synth").onclick = () => {
		let name = songObj.synthNames[selectedSynthIndex];
		g_showPrompt("Copy synth \"" + name + "\" to", (result) => {
			if (result === null)
				return;

			for (let i = 0; i < songObj.synthNames.length; i++) {
				if (result == songObj.synthNames[i]) {
					g_showConfirm("Synth with name '" + result + "' already exists. Overwrite?", (isOk) => {
						document.getElementById("synth-modal-menu").classList.add("nodisplay");
						if (!isOk)
							return;

						let sourceParams = songObj.synthParams[selectedSynthIndex];
						let targetParams = songObj.synthParams[i];
						let targetSynth = songObj.synths[i];

						for (let key in sourceParams) {
							targetParams[key] = sourceParams[key];
							synthParamApply(key, targetParams[key], targetSynth);
						}

						g_switchTab("synth-list");
					});

					return;
				}
			}

			o.createNewSynth(result, songObj.synthParams[selectedSynthIndex]);

			console.log("Synth '" + name + "' copied to '" + result + "'");
			o.rebuildSynthList();
			g_switchTab("synth-list");
			document.getElementById("synth-modal-menu").classList.add("nodisplay");
		}, name + "-2");
	};

	document.getElementById("input-import-synth").onchange = (e) => {
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
				g_showAlert("JSON parsing error");
				return;
			}

			let synth = songObj.synths[selectedSynthIndex];
			let newParams = o.loadSynth(params, synth);
			for (let key in newParams)
				songObj.synthParams[selectedSynthIndex][key] = newParams[key];

			if (selectedSynthIndex == songObj.currentSynthIndex)
				synthUi.assignSynth(newParams, synth, songObj.synthNames[selectedSynthIndex]);

			document.getElementById("synth-modal-menu").classList.add("nodisplay");
		};
		reader.readAsText(file);
	};

	document.getElementById("link-synth-export").onclick = (e) => {
		let expString = JSON.stringify(songObj.synthParams[selectedSynthIndex], null, 1);
		let file = new Blob([expString], { type: 'text/json' });
		e.target.href = URL.createObjectURL(file);
		let name = songObj.synthNames[selectedSynthIndex] || "synth";
		e.target.download = name + ".json";
	};


	o.createNewSynth = function (name, copyFromParams) {
		let newSynth = new Synth(songObj.compressor, songObj.bpm);
		let newSynthParamObj = {};
		let params = copyFromParams || DEFAULT_PARAMS.synthState;

		for (let key in params) {
			newSynthParamObj[key] = params[key];
			synthParamApply(key, newSynthParamObj[key], newSynth);
		}

		songObj.synthParams.push(newSynthParamObj);
		songObj.synths.push(newSynth);
		songObj.synthNames.push(name);

		if (!copyFromParams) {
			synthUi.assignSynth(newSynthParamObj, newSynth, name);
			songObj.currentSynthIndex = songObj.synths.length - 1;
		}

		o.rebuildSynthList();
	}

	o.rebuildSynthList = function () {
		let container = document.getElementById("synth-list-main");
		container.innerHTML = "";

		for (let i = 0; i < songObj.synthNames.length; i++) {
			let entry = createSynthEntry(songObj.synthNames[i]);
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

		function createSynthEntry(name) {
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

			entry.classList.add("synth-list-entry");
			return entry;
		}
	}

	o.loadSynth = function (synthParams, targetSynth) {
		let newParams = {};

		for (let key in DEFAULT_PARAMS.synthState) {
			if (key in synthParams)
				newParams[key] = synthParams[key];
			else
				newParams[key] = DEFAULT_PARAMS.synthState[key];

			synthParamApply(key, newParams[key], targetSynth);
		}

		return newParams;
	}

	function openSynthMenu() {
		let menu = document.getElementById("synth-modal-menu");
		menu.classList.remove("nodisplay");
		document.getElementById("input-synth-name").value = songObj.synthNames[selectedSynthIndex];
	}

	return o;
}