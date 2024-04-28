"use strict";

function SynthUi(songObj) {
	const rowKeys = ["KeyQ", "KeyW", "KeyE", "KeyR", "KeyT", "KeyY", "KeyU", "KeyI", "KeyO", "KeyP", "BracketLeft", "BracketRight", "Backslash",
		"KeyA", "KeyS", "KeyD", "KeyF", "KeyG", "KeyH", "KeyJ", "KeyK", "KeyL", "Semicolon", "Quote"];
	const rowNotes = ["F3", "G3", "A3", "B3", "Db4", "Eb4", "F4", "G4", "A4", "B4", "Db5", "Eb5", "E5",
		"Gb3", "Ab3", "Bb3", "C4", "D4", "E4", "Gb4", "Ab4", "Bb4", "C5", "D5"];
	const rowSymbols = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",
		"A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'"];

	let rowDomKeys = new Array(rowNotes.length);
	let lastDomKey;
	let lastKey = null;
	let showLetters = false;

	let pianoScroll = 260;
	let pianoOuter = document.getElementById("piano-container-outer");
	let pianoContainer = document.getElementById("piano-container");
	pianoContainer.oncontextmenu = () => false;

	let btnShow = document.getElementById("button-piano-show");
	btnShow.onclick = () => {
		if (pianoContainer.classList.contains("piano--hidden")) {
			pianoContainer.classList.remove("piano--hidden");
			pianoContainer.classList.remove("show-letters");
			pianoOuter.classList.remove("piano--scrolllock");
			pianoOuter.scroll(pianoScroll, 0);
			showLetters = false;
		} else {
			let notScrollable = pianoContainer.offsetWidth < document.body.clientWidth;
			let noTouchInput = !("ontouchstart" in window);
			if (pianoOuter.classList.contains("piano--scrolllock") || notScrollable || noTouchInput) {
				pianoScroll = pianoOuter.scrollLeft;
				pianoContainer.classList.add("piano--hidden");
				btnShow.classList.remove("button--highlight-yellow");
			} else {
				pianoOuter.classList.add("piano--scrolllock");
				btnShow.classList.add("button--highlight-yellow");
				showToast("Scroll Lock");
			}
		}
	}

	let lastNote = "";
	let isPlaying = false;
	let pianoTouched = false;

	const upperRow = document.createElement("DIV");
	const lowerRow = document.createElement("DIV");

	const playSynth = (note, newDomKey) => {
		let stepLen = (60 / songObj.bpm) / 4;

		this.currentSynth.filterSweep(null, null, Tone.now(), 0.01)

		if (isPlaying)
			this.currentSynth.glideTo(note, 0, Tone.now(), stepLen);
		else
			this.currentSynth.triggerAttack(note, 0, Tone.now(), stepLen);

		isPlaying = true;
		lastNote = note;

		lastDomKey.classList.remove("key--pressed");
		lastDomKey = newDomKey;
		lastDomKey.classList.add("key--pressed");
	}

	const stopSynth = () => {
		this.currentSynth.triggerRelease();
		isPlaying = false;
		lastNote = "";
		lastDomKey.classList.remove("key--pressed");
	}

	window.addEventListener("blur", () => {
		if (isPlaying)
			stopSynth();
	});

	for (let i = 0; i < DEFAULT_PARAMS.noteSet.length; i++) {
		let key = document.createElement("DIV");
		key.classList.add("piano-key");
		let note = DEFAULT_PARAMS.noteSet[i];

		let indexInKeys = rowNotes.indexOf(note);
		if (indexInKeys != -1) {
			rowDomKeys[indexInKeys] = key;
			let s = document.createElement("SPAN");
			s.classList.add("letter-mark");
			s.appendChild(document.createTextNode(rowSymbols[indexInKeys]));
			key.appendChild(s);
		}

		if (note.indexOf("b") == -1) {
			key.classList.add("piano-key-white");
			let s = document.createElement("SPAN");
			s.classList.add("note-mark");
			s.appendChild(document.createTextNode(note));

			if (note == "C4")
				s.classList.add("c4-key-mark");

			key.appendChild(s);
		} else {
			key.classList.add("piano-key-black");
		}

		if (i % 2 == 0)
			lowerRow.appendChild(key);
		else
			upperRow.appendChild(key);

		key.addEventListener("pointerdown", () => {
			if (isPlaying && lastNote == note)
				return;

			playSynth(note, key);
		});

		key.addEventListener("pointerup", () => {
			if (pianoTouched)
				return;

			if (lastKey && note != lastNote)
				return;

			stopSynth();
		});

		key.addEventListener("pointercancel", () => {
			if (pianoTouched)
				return;

			stopSynth();
		});

		key.addEventListener("touchstart", () => {
			pianoTouched = true;

			if (isPlaying && lastNote == note)
				return;

			playSynth(note, key);
		});

		key.addEventListener("touchend", () => {
			if (note != lastNote)
				return;

			pianoTouched = false;
			stopSynth();
		});

		key.addEventListener("touchcancel", () => {
			pianoTouched = false;
			stopSynth();
		});
	}

	pianoContainer.appendChild(upperRow);
	pianoContainer.appendChild(lowerRow);
	pianoOuter.scroll(pianoScroll, 0);
	lastDomKey = rowDomKeys[0];

	document.addEventListener("keydown", (e) => {
		if (e.target.tagName == "INPUT" && e.target.type != "range" && e.target.type != "checkbox")
			return;

		if (e.target.tagName == "SELECT")
			e.preventDefault();

		if (e.code == "Slash" || e.code == "Quote")
			e.preventDefault();

		if (e.code == lastKey)
			return;

		lastKey = e.code;

		let keyIndex = rowKeys.indexOf(e.code);
		if (keyIndex == -1)
			return;

		if (!showLetters) {
			pianoContainer.classList.add("show-letters");
			showLetters = true;
		}

		let note = rowNotes[keyIndex];

		if (isPlaying && note == lastNote)
			return;

		playSynth(note, rowDomKeys[keyIndex]);
	});

	document.addEventListener("keyup", (e) => {
		let keyIndex = rowKeys.indexOf(e.code);
		if (keyIndex == -1)
			return;

		let note = rowNotes[keyIndex];

		if (e.code == lastKey)
			lastKey = null;

		if (note != lastNote)
			return;

		stopSynth();
	});

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

}