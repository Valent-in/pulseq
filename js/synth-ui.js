"use strict"

function SynthUi() {
	let pianoContainer = document.getElementById("piano-container");
	pianoContainer.oncontextmenu = () => false;

	document.getElementById("button-piano-show").onclick = () => {
		pianoContainer.classList.toggle("piano--hidden");
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

		key.addEventListener("pointerdown", () => {
			//console.log(note);
			if (this.currentSynth.lfo1) {
				this.currentSynth.lfo1.stop();
				this.currentSynth.lfo1.start();
			}

			this.currentSynth.triggerAttack(note, 0, Tone.now(), 0.5);
		})

		key.addEventListener("pointerup", () => {
			this.currentSynth.triggerRelease();
		});

		key.addEventListener("pointercancel", () => {
			this.currentSynth.triggerRelease();
		});

		pianoContainer.appendChild(key);
	}

	if ("ontouchstart" in window) {
		let rangeInputs = document.querySelectorAll("#synth-main input[type=range]");
		rangeInputs.forEach((e) => {
			e.addEventListener("pointercancel", (el) => {
				el.target.value = el.target.dataset.value;
				universalSynthListener(el);
			});

			e.addEventListener("change", (el) => {
				el.target.dataset.value = el.target.value;
			});
		});
	}

	const universalSynthListener = (e) => {
		let idValue;
		if (e.target.type == "checkbox")
			idValue = synthParamApply(e.target.id, e.target.checked, this.currentSynth);
		else
			idValue = synthParamApply(e.target.id, e.target.value, this.currentSynth);

		if (idValue) {
			this.curSynthParamObj[idValue.id] = idValue.value;

			if (e.target.id != idValue.id) {
				let newTgt = document.getElementById(idValue.id);
				newTgt.value = idValue.value;
				newTgt.dataset.value = idValue.value;
			}
		}

		setBlockState(e.target);
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
			if (input) {
				if (input.type == "checkbox") {
					input.checked = params[key];
				} else {
					input.value = params[key];
					input.dataset.value = params[key];
				}

				setBlockState(input);
			}
		}

		if (name) {
			let synthTab = document.getElementById("synth-name-area");
			synthTab.innerHTML = "";
			synthTab.appendChild(document.createTextNode(name));
		}
	}

	function setBlockState(selector) {
		if (selector.id == "synth-fx-type") {
			let range = document.getElementById("synth-fx-rate");
			let span = document.getElementById("synth-fx-rate-span");
			let checkbox = document.getElementById("synth-fx-sync");
			let label = document.getElementById("synth-fx-sync-label");

			if ("stereo distort reverb".includes(selector.value)) {
				range.disabled = true;
				span.classList.add("disabled")
			} else {
				range.disabled = false;
				span.classList.remove("disabled")
			}

			if ("delay pingpong".includes(selector.value)) {
				checkbox.style.visibility = "visible";
				label.style.visibility = "visible";
			} else {
				checkbox.style.visibility = "hidden";
				label.style.visibility = "hidden";
			}
		}

		if (selector.dataset.block) {
			let blocks = document.getElementsByClassName(selector.dataset.block);
			for (let el of blocks) {
				if (selector.value == "[none]")
					el.style.visibility = "hidden";
				else
					el.style.visibility = "visible";
			}
		}
	}

}