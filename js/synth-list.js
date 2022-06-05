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

	document.getElementById("button-synth-menu-close").onclick = () => {
		document.getElementById("synth-list-modal-menu").classList.add("modal-hidden");
	};

	let synthNameInput = document.getElementById("input-synth-name");
	synthNameInput.addEventListener("change", (event) => {
		let value = event.target.value;

		if (value) {
			songObj.synthNames[selectedSynthIndex] = value;
			o.rebuildSynthList();
			rebuildPatternSynthListCallback();

			let name = songObj.synthNames[selectedSynthIndex];
			let synthTab = document.getElementById("synth-tab");
			synthTab.innerHTML = "";
			synthTab.appendChild(document.createTextNode(name));
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
			o.rebuildSynthList();
			rebuildPatternSynthListCallback();
			synthUi.assignSynth(songObj.synthParams[0], songObj.synths[0], songObj.synthNames[0]);
			document.getElementById("synth-list-modal-menu").classList.add("modal-hidden");
		});
	};

	o.createNewSynth = function (name) {
		let newSynth = new Synth(songObj.compressor, songObj.bpm);
		let newSynthParamObj = {};

		for (let key in DEFAULT_PARAMS.synthState)
			newSynthParamObj[key] = DEFAULT_PARAMS.synthState[key];

		songObj.synthParams.push(newSynthParamObj);
		songObj.synths.push(newSynth);
		songObj.synthNames.push(name);

		synthUi.assignSynth(newSynthParamObj, newSynth, name);
		synthUi.resetCurrentSynth();

		o.rebuildSynthList();
	}

	o.rebuildSynthList = function () {
		let container = document.getElementById("synth-list-main");
		container.innerHTML = "";

		for (let i = 0; i < songObj.synthNames.length; i++) {
			let entry = createSynthEntry(songObj.synthNames[i])
			container.appendChild(entry);
			entry.addEventListener("click", (event) => {
				synthUi.assignSynth(songObj.synthParams[i], songObj.synths[i], songObj.synthNames[i]);
				selectedSynthIndex = i;

				if (event.target.classList.contains("js-synth-entry-menu")) {
					let menu = document.getElementById("synth-list-modal-menu");
					menu.classList.remove("modal-hidden");
					document.getElementById("input-synth-name").value = songObj.synthNames[i];
					return;
				}

				g_switchTab("synth");
			})
		}

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

	return o;
}