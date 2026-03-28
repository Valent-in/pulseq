"use strict";

function schedulerUi(scheduler, setLoopMarkersCallback) {
	let songPlayBtn = document.getElementById("button-arrange-play");
	let patternPlayBtn = document.getElementById("button-pattern-play");
	let barsInput = document.getElementById("input-loop-bars");
	let arrangeTab = document.getElementById("arrange-tab")
	let patternTab = document.getElementById("pattern-tab")

	document.addEventListener("keydown", (event) => {
		if (event.target.type == "number" || event.target.type == "text")
			return;

		if (event.code == "Backquote")
			songPlayListener();

		if (event.code == "Digit1")
			patternPlayListener();

		if (event.code == "Space") {
			if (event.target.type == "checkbox")
				return;

			event.preventDefault();

			switch (window.g_activeTab) {
				case "arrange":
					songPlayListener();
					break;

				case "pattern":
					patternPlayListener();
					break;

				default:
					scheduler.stop();
					updateButtons(false, false);
			}
		}
	});

	document.addEventListener("keyup", (event) => {
		if (event.target.tagName != "INPUT" && event.code == "Space") {
			event.preventDefault();
		}
	});

	songPlayBtn.onclick = songPlayListener;
	patternPlayBtn.onclick = patternPlayListener;

	document.getElementById("button-loop-play").onclick = loopPlayListener;
	barsInput.addEventListener("keyup", (event) => {
		if (event.key == "Enter") {
			loopPlayListener();
		}
	});

	function onForceStop() {
		updateButtons(false, false);
		removePlayMarkers();
	};

	function songPlayListener() {
		let state = scheduler.playStopSong(onForceStop);
		updateButtons(false, state);
		removePlayMarkers();
	};

	function loopPlayListener() {
		let barsInLoop = Math.round(barsInput.value);

		if (!(barsInLoop >= 1 && barsInLoop <= 99)) {
			showAlert("Loop length should be in range 1..99");
			barsInput.value = 1;
			return;
		}

		let startIndex = scheduler.playLoop(onForceStop, barsInLoop);
		removePlayMarkers();
		setPlayMarkers(startIndex, barsInLoop);

		updateButtons(false, true);
		hideModal("column-modal-menu");
	};

	function patternPlayListener() {
		let state = scheduler.playStopPattern(onForceStop);
		updateButtons(state, false);
		removePlayMarkers();
	};

	function updateButtons(patternState, songState) {
		if (patternState) {
			patternPlayBtn.classList.add("bg-stop");
			songPlayBtn.classList.add("bg-stopg");
			patternTab.classList.add("playback-animation")
		} else {
			patternPlayBtn.classList.remove("bg-stop");
			songPlayBtn.classList.remove("bg-stopg");
			patternTab.classList.remove("playback-animation")
		}

		if (songState) {
			songPlayBtn.classList.add("bg-stop");
			patternPlayBtn.classList.add("bg-stopg");
			arrangeTab.classList.add("playback-animation")
		} else {
			songPlayBtn.classList.remove("bg-stop");
			patternPlayBtn.classList.remove("bg-stopg");
			arrangeTab.classList.remove("playback-animation")
		}
	};

	function removePlayMarkers() {
		songPlayBtn.classList.remove("button--play-loop");
		setLoopMarkersCallback(-1);
	};

	function setPlayMarkers(startIndex, length) {
		songPlayBtn.classList.add("button--play-loop");
		setLoopMarkersCallback(startIndex, length);
	}
}