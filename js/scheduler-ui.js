"use strict";

function schedulerUi(scheduler, setLoopMarkersCallback) {
	let songPlayBtn = document.getElementById("button-arrange-play");
	let patternPlayBtn = document.getElementById("button-pattern-play");
	let barsInput = document.getElementById("input-loop-bars");
	let arrangeTab = document.getElementById("arrange-tab")
	let patternTab = document.getElementById("pattern-tab")

	let listeners = {};

	listeners.patternPlay = () => {
		if (scheduler.isPlaying())
			scheduler.stop();
		else
			scheduler.playPattern(onForceStop);

		updateButtons(scheduler.isPlaying(), false);
		removePlayMarkers();
	};

	listeners.songPlay = () => {
		if (scheduler.isPlaying())
			scheduler.stop();
		else
			scheduler.playSong(onForceStop);

		updateButtons(false, scheduler.isPlaying());
		removePlayMarkers();
	}

	listeners.loopStart = () => {
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

	listeners.loopPlay = () => {
		if (scheduler.isPlaying())
			scheduler.stop();
		else
			listeners.loopStart();
	}

	songPlayBtn.onclick = listeners.songPlay;
	patternPlayBtn.onclick = listeners.patternPlay;

	document.getElementById("button-loop-play").onclick = listeners.loopStart;
	barsInput.addEventListener("keyup", (event) => {
		if (event.key == "Enter") {
			listeners.loopStart();
		}
	});

	function onForceStop() {
		updateButtons(false, false);
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

	return listeners;
}