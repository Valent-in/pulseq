"use strict"

function SynthUi() {

	let synthFooter = document.getElementById("synth-footer");
	synthFooter.addEventListener("click", () => {
		synthFooter.classList.remove("synth-footer-shrink");
		synthFooter.classList.add("synth-footer-expand");
	})

	let pianoContainer = document.getElementById("piano-container");

	let eventDown = "mousedown";
	let eventUp = "mouseup";
	if ("ontouchstart" in window) {
		eventDown = "touchstart";
		eventUp = "touchend";
		//console.log("touch device");
	}


	for (let i = 0; i < 72; i++) {
		let key = document.createElement("DIV");
		let note = DEFAULT_PARAMS.noteSet[i];

		if (note.indexOf("b") == -1) {
			key.classList.add("piano-key-white");
			let s = document.createElement("SPAN");
			s.appendChild(document.createTextNode(note));
			key.appendChild(s);
		} else {
			key.classList.add("piano-key-black");
		}

		key.addEventListener(eventDown, () => {
			//console.log(note);
			this.currentSynth.triggerAttack(note);
		})

		key.addEventListener(eventUp, () => {
			//if (silence)
			this.currentSynth.triggerRelease();
		})

		pianoContainer.appendChild(key);
	}

	let pianoControls = document.createElement("div");
	pianoControls.id = "piano-controls";
	let pianoHide = document.createElement("div");
	pianoHide.id = "piano-hide";
	let noRelease = document.createElement("div");
	noRelease.id = "piano-no-release";

	pianoControls.appendChild(pianoHide);
	pianoControls.appendChild(noRelease);
	pianoContainer.appendChild(pianoControls);

	pianoHide.addEventListener("click", (event) => {
		event.stopPropagation();
		synthFooter.classList.remove("synth-footer-expand");
		synthFooter.classList.add("synth-footer-shrink");
	})

	const universalSynthListener = (e) => {
		//console.log("synth listener :", e.target.id, e.target.value)
		let value;
		if (e.target.type == "checkbox")
			value = synthParamApply(e.target.id, e.target.checked, this.currentSynth);
		else
			value = synthParamApply(e.target.id, e.target.value, this.currentSynth);

		if (e.target.id && value !== undefined)
			this.curSynthParamObj[e.target.id] = value;
	}

	let controls = document.querySelectorAll("#synth-main input, #synth-main select, #synth-main button");
	controls.forEach((e) => {
		//console.log(e.id, e.tagName);

		switch (e.tagName) {
			case "INPUT":
				e.addEventListener("input", universalSynthListener);
				break;

			case "SELECT":
				e.addEventListener("change", universalSynthListener);
				break;

			case "BUTTON":
				e.addEventListener("click", universalSynthListener);
				break;
		}
	})

	this.loadSynth = function (params, targetSynth) {
		for (let key in params) {
			synthParamApply(key, params[key], targetSynth);

			let input = document.getElementById(key);
			if (input)
				if (input.type == "checkbox")
					input.checked = params[key];
				else
					input.value = params[key];
		}
	};

	this.assignSynth = (params, targetSynth, name) => {
		this.curSynthParamObj = params;
		this.currentSynth = targetSynth;
		//this.loadSynth(params, targetSynth);

		for (let key in params) {
			//synthParamApply(key, params[key], targetSynth, false);

			let input = document.getElementById(key);
			if (input)
				if (input.type == "checkbox")
					input.checked = params[key];
				else
					input.value = params[key];
		}

		let synthTab = document.getElementById("synth-tab");
		synthTab.innerHTML = "";
		synthTab.appendChild(document.createTextNode(name));
	}

	this.resetCurrentSynth = () => {
		this.loadSynth(DEFAULT_PARAMS.synthState, this.currentSynth);

		for (let key in DEFAULT_PARAMS.synthState)
			this.curSynthParamObj[key] = DEFAULT_PARAMS.synthState[key];
	}

	let resetSynthButton = document.getElementById("button-reset-synth");
	resetSynthButton.addEventListener("click", this.resetCurrentSynth);

	let importSynthButton = document.getElementById("button-import-synth");
	importSynthButton.addEventListener("click", () => {
		let str = document.getElementById("export-data").value;
		let params = JSON.parse(str);
		this.loadSynth(params, this.currentSynth);

		for (let key in params)
			this.curSynthParamObj[key] = params[key];
	});

	let exportSynthButton = document.getElementById("button-export-synth");
	exportSynthButton.addEventListener("click", () => {
		let outText = document.getElementById("export-data");
		outText.value = JSON.stringify(this.curSynthParamObj, null, 1);
	});

}