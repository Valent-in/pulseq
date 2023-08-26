"use strict"

console.log("%c\u25A0 %c\u25B6 %c\u25A0 %c PulseQueue %c standalone synth ",
	"color:#1ff", "color:#f81", "color:#bbb", "background-color:#000;color:#fff", "background-color:#ddd;color:#000");

{
	Tone.context.lookAhead = 0.02;

	window.onbeforeunload = function () { return "Leave App?" };

	window.g_markCurrentSynth = function () {
		// dummy
	}

	const songObject = new SongObject();

	const synthUi = new SynthUi();

	const synthHelper = new SynthHelper(songObject, synthUi, updPatternSynthList);
	synthHelper.buildPresetList();

	// Override listener from SynthHelper
	let polyCheck = document.getElementById("chk-polyphonic-mode");
	let synthPresetSelect = document.getElementById("selsct-synth-preset");
	synthPresetSelect.onchange = () => {
		let index = synthPresetSelect.selectedIndex - 1;
		let value = synthPresetSelect.value;

		let polyMode = (value.indexOf("p-") == 0);
		polyCheck.checked = polyMode;
		synthUi.poly = polyMode;
		synthUi.onInterrupt();

		console.log("preset", index, value);
		synthPresetSelect.value = "Preset";

		setSynth(index);
	}

	function setSynth(index) {
		let synth = songObject.synths[0];
		let synthParams = synthHelper.loadSynth(SYNTH_PRESETS[index], synth);
		songObject.synthParams[0] = synthParams;
		synthUi.assignSynth(synthParams, synth, songObject.synthNames[0]);
	}

	document.getElementById("startup-loading-title").style.display = "none";
	document.getElementById("startup-menu").style.display = "block";
	document.getElementById("button-new-track").focus();

	function onSongChange(isNewSong, stopCommand) {
		if (isNewSong) {
			synthUi.assignSynth(songObject.synthParams[0], songObject.synths[0], songObject.synthNames[0]);
			songObject.currentSynthIndex = 0;
		}
		synthHelper.rebuildSynthList();

		switch (stopCommand) {
			case "stop":
				schedulerUi.stop();
				break;
			case "release":
				scheduler.release();
				break;
		}
	}

	function updPatternSynthList(updArrangeView) {
		// dummy
	}

	document.getElementById("startup-menu").onclick = () => {
		if (Tone.context.state != "running") {
			console.log("Starting web audio context");
			Tone.context.resume();
		} else {
			console.log("Web audio context is already running");
		}
	}

	document.getElementById("button-new-track").onclick = () => {
		songObject.createEmptySong();
		onSongChange(true);
		hideModal("startup-modal-menu");

		setSynth(26);
		polyCheck.checked = true;
		synthUi.poly = true;
		synthUi.onInterrupt();
	}
}