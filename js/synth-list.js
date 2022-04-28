"use strict"

function SynthList(songObj, synthUi, rebuildPatternSynthListCallback) {
	let o = {};

	let cancelAssign = document.getElementById("button-cancel-assign-mode");
	cancelAssign.addEventListener("click", () => {
		o.rebuildSynthList();

		if (!songObj.synthAssignMode)
			return;

		songObj.synthAssignMode = false;
		document.getElementById("pattern-view").classList.remove("hidden");
		document.getElementById("synth-select-view").classList.add("hidden");
	})

	let addSynth = document.getElementById("button-add-synth");
	addSynth.addEventListener("click", () => {
		let name = prompt("Enter synth name");
		if (!name) {
			alert("Synth NOT created");
			console.log(name);
		} else {
			o.createNewSynth(name);
		}
	});

	o.createNewSynth = function(name) {
		let newSynth = new Synth(songObj.compressor);
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
		let container = document.getElementById("synth-select-main");
		container.innerHTML = "";

		for (let i = 0; i < songObj.synthNames.length; i++) {
			let entry = createSynthEntry(songObj.synthNames[i])
			container.appendChild(entry);
			entry.addEventListener("click", () => {
				synthUi.assignSynth(songObj.synthParams[i], songObj.synths[i], songObj.synthNames[i]);

				document.getElementById("synth-select-view").classList.add("hidden");

				if (songObj.synthAssignMode) {

					songObj.currentPattern.addLayer();
					songObj.currentPattern.patternData[songObj.currentPattern.activeIndex].synthIndex = i;
					rebuildPatternSynthListCallback(songObj.currentPattern);

					songObj.synthAssignMode = false;
					document.getElementById("pattern-view").classList.remove("hidden");
				} else {
					let tabs = document.querySelectorAll(".js-tab");
					tabs.forEach(e => {
						e.classList.remove("tab--active")
					})
					document.getElementById("synth-view").classList.remove("hidden");
					document.getElementById("synth-tab").classList.add("tab--active");
				}
			})
		}

		function createSynthEntry(name) {
			let entry = document.createElement("DIV");
			let text = document.createTextNode(name);
			entry.classList.add("synth-list-entry");
			entry.appendChild(text);
			return entry;
		}
	}

	return o;
}