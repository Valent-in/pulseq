"use strict"

function SynthUi() {
	document.getElementById("button-piano-show").onclick = () => {
		document.getElementById("synth-view").classList.toggle("synth-footer-shrink");
	}

	let pianoContainer = document.getElementById("piano-container");

	let eventDown = "mousedown";
	let eventUp = "mouseup";
	if ("ontouchstart" in window) {
		eventDown = "touchstart";
		eventUp = "touchend";

		document.getElementById("synth-main").classList.add("slider-drag-only-area");
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

			this.currentSynth.triggerAttack(note, 0, Tone.now(), 0.5);
		})

		key.addEventListener(eventUp, () => {
			//if (silence)
			this.currentSynth.triggerRelease();
		})

		pianoContainer.appendChild(key);
	}

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
	});

	this.assignSynth = (params, targetSynth, name) => {
		this.curSynthParamObj = params;
		this.currentSynth = targetSynth;

		for (let key in params) {
			let input = document.getElementById(key);
			if (input)
				if (input.type == "checkbox")
					input.checked = params[key];
				else
					input.value = params[key];
		}

		if (name) {
			let synthTab = document.getElementById("synth-name-area");
			synthTab.innerHTML = "";
			synthTab.appendChild(document.createTextNode(name));
		}
	}

}