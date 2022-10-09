function SchedulerUi(scheduler) {

	let songPlayBtn = document.getElementById("button-arrange-play");
	let patternPlayBtn = document.getElementById("button-pattern-play");

	songPlayBtn.addEventListener("click", () => {
		let state = scheduler.playStopSong(onForceStop);
		updateButtons(false, state);
	});

	patternPlayBtn.addEventListener("click", () => {
		let state = scheduler.playStopPattern(onForceStop);
		updateButtons(state, false);
	});

	this.stop = function () {
		scheduler.stop();
		updateButtons(false, false);
	}

	function onForceStop() {
		updateButtons(false, false);
	}

	function updateButtons(patternState, songState) {
		let playUrl = "url('img/play.svg')";
		let stopUrl = "url('img/stop.svg')";
		let stopgUrl = "url('img/stopg.svg')";

		if (!patternState && !songState) {
			songPlayBtn.style.backgroundImage = playUrl;
			patternPlayBtn.style.backgroundImage = playUrl;
		}

		if (patternState) {
			patternPlayBtn.style.backgroundImage = stopUrl;
			songPlayBtn.style.backgroundImage = stopgUrl;
		}

		if (songState) {
			songPlayBtn.style.backgroundImage = stopUrl;
			patternPlayBtn.style.backgroundImage = stopgUrl;
		}
	}
}