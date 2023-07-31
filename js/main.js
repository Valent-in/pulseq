"use strict"

console.log("%c\u25A0 %c\u25B6 %c\u25A0 %c PulseQueue v0.9.8 ",
	"color:#1ff", "color:#f81", "color:#bbb", "background-color:#000;color:#fff");

{
	Tone.context.lookAhead = 0.15;

	window.onbeforeunload = function () { return "Leave App?" };

	// Disable closing browser window with back button
	if (history.length == 1 || window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) {
		history.pushState(null, null, location.href);
		window.onpopstate = function () {
			history.go(1);
		}
	}

	window.g_markCurrentSynth = function () {
		let previous = document.querySelectorAll("#synth-list-main > .synth-list-entry--current");
		if (previous.length > 0)
			previous[0].classList.remove("synth-list-entry--current");

		let element = document.getElementById("synth-list-entry_" + songObject.currentSynthIndex);
		if (element)
			element.classList.add("synth-list-entry--current");
	}

	window.g_markCurrentPattern = function () {
		let previous = document.querySelectorAll("#arrange-main .current-pattern-mark");
		if (previous.length > 0)
			previous[0].classList.remove("current-pattern-mark");

		let element = document.getElementById("arr_side_row-" + songObject.currentPatternIndex);
		if (element)
			element.classList.add("current-pattern-mark");
	}

	window.g_scrollToLastPatten = function () {
		setTimeout(() => {
			let rows = document.querySelectorAll("#arrange-main table tr:last-child");
			if (rows[0])
				rows[0].scrollIntoView();
		}, 0);
	}

	let styleForRows = document.getElementById("colored-rows-style");
	let styleTxt = ``;
	for (let i = 0; i < DEFAULT_PARAMS.colorSet.length; i++) {
		styleTxt += `
			#arrange-main tr.color-index-${i} td.js-fill-head {
                background-color: ${DEFAULT_PARAMS.colorSet[i]};
            }
            #arrange-main tr.color-index-${i} td.js-fill-tail {
                background-color: ${DEFAULT_PARAMS.colorSet[i]};
            }
            #arrange-main tr.color-index-${i} td:first-child {
                color: ${DEFAULT_PARAMS.colorSet[i]};
            }
            `;
	}
	styleForRows.innerText = styleTxt;

	const songObject = new SongObject();

	const synthUi = new SynthUi();

	const patternUi = new PatternUi(songObject, synthUi.assignSynth);
	patternUi.build();

	const synthHelper = new SynthHelper(songObject, synthUi, updPatternSynthList);
	synthHelper.buildPresetList();

	const arrangeUi = new ArrangeUi(songObject, onPatternSelect);
	arrangeUi.build();

	const scheduler = new Scheduler(songObject, arrangeUi.setMarker, patternUi.setMarker);
	const schedulerUi = new SchedulerUi(scheduler, arrangeUi.setLoopMarkers);

	menuInit(songObject, onSongChange, synthHelper.loadSynth, scheduler.renderSong);

	document.getElementById("startup-loading-title").style.display = "none";
	document.getElementById("startup-menu").style.display = "block";
	document.getElementById("input-import-track").focus();

	function onSongChange(isNewSong, stopCommand) {
		updPatternSynthList(true);
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
		if (updArrangeView) {
			arrangeUi.fillSongView();
			g_markCurrentPattern();
		}

		patternUi.importSequence(songObject.currentPattern);
		patternUi.rebuildPatternSynthList(songObject.currentPattern);
	}

	function onPatternSelect(newCurrentPattern) {
		scheduler.releasePattern();
		patternUi.importSequence(newCurrentPattern);
		patternUi.rebuildPatternSynthList(newCurrentPattern);
	}
}