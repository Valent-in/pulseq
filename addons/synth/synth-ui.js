"use strict"

function SynthUi() {
	let pianoContainer = document.getElementById("piano-container");
	pianoContainer.oncontextmenu = () => false;
	let pianoState = 0;

	let synthExpControl = document.getElementById("link-synth-export");
	let synthImpControl = document.getElementById("button-import-synth");

	document.getElementById("button-piano-show").onclick = () => {
		synthExpControl.style.display = "none";
		synthImpControl.style.display = "none";

		pianoState++;
		if (pianoState > 3)
			pianoState = 0;

		switch (pianoState) {
			case 0:
				pianoContainer.classList.remove("piano--hidden");
				pianoContainer.classList.remove("piano--shrink");
				synthExpControl.style.display = "inline-block";
				synthImpControl.style.display = "inline-block";
				break;

			case 1:
				pianoContainer.classList.remove("piano--hidden");
				pianoContainer.classList.add("piano--shrink");
				break;

			case 2:
				pianoContainer.classList.add("piano--hidden");
				break;

			case 3:
				pianoContainer.classList.remove("piano--hidden");
				pianoContainer.classList.add("piano--shrink");
				break;
		}
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

	let focusAnchor = document.getElementById("steal-focus-anchor");
	controls = document.querySelectorAll("input, select, button");
	controls.forEach((e) => {
		switch (e.tagName) {
			case "INPUT":
				e.addEventListener("click", () => focusAnchor.focus());
				e.addEventListener("change", () => focusAnchor.focus());
				break;

			case "SELECT":
				e.addEventListener("change", () => focusAnchor.focus());
				break;

			case "BUTTON":
				e.addEventListener("click", () => focusAnchor.focus());
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

		this.updateMuteControls(targetSynth);
	}

	this.updateMuteControls = function (targetSynth) {
		let muteButton = document.getElementById("button-synth-mute");
		if (targetSynth.isMuted)
			muteButton.classList.add("button--highlight-orange");
		else
			muteButton.classList.remove("button--highlight-orange");
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

	this.poly = false;

	let sustain = false;
	let lastNote = null;
	let firstNote = null;

	let polyPool = [3, 2, 1];
	let polyPlay = [];
	let notesPlay = [];

	this.onInterrupt = () => {
		lastNote = null;
		polyPool = [3, 2, 1];
		polyPlay = [];
		notesPlay = [];

		let keys = document.querySelectorAll(".pressed");
		keys.forEach((e) => e.classList.remove("pressed"));

		if (this.currentSynth)
			this.currentSynth.triggerRelease(Tone.now());
	}

	document.onblur = this.onInterrupt;

	document.getElementById("chk-polyphonic-mode").onchange = (e) => {
		this.poly = e.target.checked;
		this.onInterrupt();
	}

	const downListener = (key) => {
		if (key && this.currentSynth) {
			if (sustain) {
				if (this.poly) {
					if (notesPlay.includes(key.dataset.note))
						return;

					if (polyPool.length == 0)
						return;

					let oscIndex = polyPool.pop();
					polyPlay.push(oscIndex);
					notesPlay.push(key.dataset.note);

					this.currentSynth.addPolyVoice(key.dataset.note, 0, Tone.now(), 0.5, oscIndex);
					console.log(key.dataset.note);

				} else if (key.dataset.note != lastNote) {
					this.currentSynth.glideTo(key.dataset.note, 0, Tone.now(), 0.5);
					lastNote = key.dataset.note;
					console.log(key.dataset.note, "Glide");
				}
			} else {
				if (this.poly)
					this.currentSynth.triggerPolyAttack(key.dataset.note, 0, Tone.now(), 0.5);
				else
					this.currentSynth.triggerAttack(key.dataset.note, 0, Tone.now(), 0.5);

				firstNote = key.dataset.note;

				polyPool = [3, 2];
				polyPlay = [1];
				notesPlay.push(key.dataset.note);

				console.log(key.dataset.note, "Attack");
			}

			lastNote = key.dataset.note;
			sustain = true;

			key.classList.add("pressed");
			//console.log(key.dataset.note);
		}
	}

	const upListener = (key) => {
		if (key) {
			key.classList.remove("pressed");

			if (this.poly) {
				let playIndex = notesPlay.indexOf(key.dataset.note);

				if (playIndex == -1)
					return;

				notesPlay.splice(playIndex, 1);

				let osc = polyPlay.splice(playIndex, 1)[0];
				polyPool.push(osc);

				if (notesPlay.length == 0) {
					this.currentSynth.triggerRelease(Tone.now());
					sustain = false;
					console.log("Release");
				} else {
					this.currentSynth.releasePolyVoice(Tone.now(), osc);
				}
			} else {
				if (key.dataset.note == lastNote) {
					this.currentSynth.triggerRelease(Tone.now());
					sustain = false;
				}
			}
		}
	}

	document.addEventListener("keydown", (e) => {
		if (e.code == "Slash" || e.code == "Quote")
			e.preventDefault();

		let key = document.getElementById(e.code);
		//console.log(key.dataset.note);
		downListener(key);
	})

	document.addEventListener("keyup", (e) => {
		let key = document.getElementById(e.code);

		upListener(key);
	})


	let rowkeys = [];
	let rowsymb = [];
	let rownotes = [];

	rowkeys[3] = ["Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7", "Digit8", "Digit9", "Digit0", "Minus", "Equal", "Backspace"];
	rowsymb[3] = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "<"];
	rownotes[3] = ["A#2", "C3", "D3", "E3", "F#3", "G#3", "A#3", "C4", "D4", "E4", "F#4", "G#4", "A#4"];

	rowkeys[2] = ["KeyQ", "KeyW", "KeyE", "KeyR", "KeyT", "KeyY", "KeyU", "KeyI", "KeyO", "KeyP", "BracketLeft", "BracketRight", "Backslash"];
	rowsymb[2] = ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]", "\\"];
	rownotes[2] = ["B2", "Db3", "Eb3", "F3", "G3", "A3", "B3", "Db4", "Eb4", "F4", "G4", "A4", "B4"];

	rowkeys[1] = ["KeyA", "KeyS", "KeyD", "KeyF", "KeyG", "KeyH", "KeyJ", "KeyK", "KeyL", "Semicolon", "Quote", "Enter"];
	rowsymb[1] = ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'", " "];
	rownotes[1] = ["C3", "D3", "E3", "F#3", "G#3", "A#3", "C4", "D4", "E4", "F#4", "G#4", "A#4"];

	rowkeys[0] = ["KeyZ", "KeyX", "KeyC", "KeyV", "KeyB", "KeyN", "KeyM", "Comma", "Period", "Slash"];
	rowsymb[0] = ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"];
	rownotes[0] = ["Db3", "Eb3", "F3", "G3", "A3", "B3", "Db4", "Eb4", "F4", "G4"];


	let container = document.getElementById("piano-container");

	for (let i = 3; i >= 0; i--) {
		let row = document.createElement("DIV");
		row.classList.add("row");
		container.appendChild(row);

		for (let j = 0; j < rowsymb[i].length; j++) {
			let key = document.createElement("DIV");
			key.classList.add("key");

			let span = document.createElement("SPAN")
			let text = document.createTextNode(rowsymb[i][j])
			span.appendChild(text);
			key.appendChild(span);
			key.id = rowkeys[i][j];
			row.appendChild(key);


			if (rownotes[i][j].includes("b") || rownotes[i][j].includes("#")) {
				key.classList.add("black");
			} else {
				let text = document.createElement("SPAN");
				text.appendChild(document.createTextNode(rownotes[i][j]));
				text.style.color = "gray";
				text.style.fontWeight = "bold";
				key.appendChild(document.createElement("BR"));
				key.appendChild(text);
			}

			key.dataset.note = rownotes[i][j];

			if (rowkeys[i][j] == "Enter")
				key.style.width = "50px";

			if (i == 2 && j == 0) {
				key.classList.add("dub");
				key.classList.add("oct3");
			}


			key.addEventListener("pointerdown", (e) => {
				let key = e.target;
				downListener(key);
			});

			key.addEventListener("pointerup", (e) => {
				let key = e.target;
				upListener(key);
			});

			key.addEventListener("pointercancel", (e) => {
				let key = e.target;
				upListener(key);
			});

			if ("ontouchstart" in window)
				key.addEventListener("pointerleave", (e) => {
					let key = e.target;
					upListener(key);
				});
			else
				key.addEventListener("mouseleave", (e) => {
					if (e.buttons == 1) {
						let key = e.target;
						upListener(key);
					}
				});

		}

	}

}