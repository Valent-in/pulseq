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


	for (let i = 0; i < DEFAULT_PARAMS.noteSet.length; i++) {
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
			if (this.currentSynth.lfo1) {
				this.currentSynth.lfo1.stop();
				this.currentSynth.lfo1.start();
			}

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
		let idValue;
		if (e.target.type == "checkbox")
			idValue = synthParamApply(e.target.id, e.target.checked, this.currentSynth);
		else
			idValue = synthParamApply(e.target.id, e.target.value, this.currentSynth);

		if (idValue)
			this.curSynthParamObj[idValue.id] = idValue.value;
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

	// Restore slider position after scroll misclick (touchscreen)
	let rangeInputs = document.querySelectorAll("#synth-main input[type=range]");
	rangeInputs.forEach((e) => {
		e.addEventListener("pointerup", saveValue);
		e.addEventListener("touchend", saveValue);
		e.addEventListener("keyup", saveValue);
		e.addEventListener("wheel", saveValue);

		e.addEventListener("pointercancel", (el) => {
			el.target.value = el.target.dataset.value;
			universalSynthListener(el);
		});

		function saveValue(el) {
			el.target.dataset.value = el.target.value;
		};
	});

	this.loadSynth = function (params, targetSynth) {
		for (let key in params) {
			synthParamApply(key, params[key], targetSynth);
		}
	};

	this.assignSynth = (params, targetSynth, name) => {
		this.curSynthParamObj = params;
		this.currentSynth = targetSynth;

		for (let key in params) {
			let input = document.getElementById(key);
			if (input) {
				if (input.type == "checkbox") {
					input.checked = params[key];
				} else {
					input.value = params[key];
					input.dataset.value = params[key];
				}
			}
		}

		if (name) {
			let synthTab = document.getElementById("synth-tab");
			synthTab.innerHTML = "";
			synthTab.appendChild(document.createTextNode(name));
		}
	}

	this.resetCurrentSynth = () => {
		for (let key in DEFAULT_PARAMS.synthState)
			this.curSynthParamObj[key] = DEFAULT_PARAMS.synthState[key];

		this.loadSynth(this.curSynthParamObj, this.currentSynth);
		this.assignSynth(this.curSynthParamObj, this.currentSynth);

	}

	let resetSynthButton = document.getElementById("button-reset-synth");
	resetSynthButton.addEventListener("click", () => g_showConfirm("Reset synth?", (isOk) => {
		if (isOk)
			this.resetCurrentSynth();
	}));

	let importSynthButton = document.getElementById("button-import-synth");
	importSynthButton.addEventListener("click", () => {
		let str = document.getElementById("text-export-data").value;
		let params = JSON.parse(str);
		this.loadSynth(params, this.currentSynth);
		this.assignSynth(params, this.currentSynth);

		for (let key in params)
			this.curSynthParamObj[key] = params[key];
	});

	let exportSynthButton = document.getElementById("button-export-synth");
	exportSynthButton.addEventListener("click", () => {
		let outText = document.getElementById("text-export-data");
		outText.value = JSON.stringify(this.curSynthParamObj, null, 1);
	});

}