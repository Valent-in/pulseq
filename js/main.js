"use strict";

console.log("%c\u25A0 %c\u25B6 %c\u25A0 %c PulseQuaver v" + DEFAULT_PARAMS.programVersion + " ",
	"color:#1ff", "color:#f81", "color:#bbb", "background-color:#000;color:#fff");

{
	Tone.context.lookAhead = getAppSettings("lookahead") || 0.15;

	console.log("Lookahead:", Tone.context.lookAhead);
	console.log("Sample rate:", Tone.context.sampleRate);
	console.log("Latency:", Tone.context.rawContext.baseLatency);

	// Disable closing browser window with back button (Android/PWA)
	if (history.length == 1) {
		history.replaceState({ alter: true }, "", location.href);
		history.pushState({ alter: true }, "", location.href);
	}

	if (history.state && history.state.alter) {
		window.onpopstate = function () {
			history.go(1);
			scheduler.stop();
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

	window.g_scrollToLastPattern = function () {
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

	let patternDiv = document.getElementById("pattern-main");
	// non-zero width indicates non-overlay scrollbar
	if (patternDiv.offsetWidth <= 1) {
		patternDiv.classList.add("add-scrollbar-spacing");
		document.getElementById("arrange-main").classList.add("add-scrollbar-spacing");
	}

	const songObject = new SongObject();

	const synthUi = new SynthUi(songObject);

	const patternUi = new PatternUi(songObject, synthUi.assignSynth, onSongChange);
	patternUi.build();

	const synthHelper = new SynthHelper(songObject, synthUi, redrawSequence);
	synthHelper.buildPresetList();

	const arrangeUi = new ArrangeUi(songObject, onPatternSelect, DEFAULT_PARAMS);
	arrangeUi.build();

	const scheduler = new Scheduler(songObject, arrangeUi.setMarker, patternUi.setMarker);

	schedulerUi(scheduler, arrangeUi.setLoopMarkers);
	menuInit(songObject, onSongChange, synthHelper.loadSynth, scheduler.renderSong, scheduler.exportMidiSequence);
	waveformEditor(songObject);

	let samplerateBox = document.getElementById("samplerate-box");
	samplerateBox.appendChild(document.createTextNode("Sample rate: " + Tone.context.sampleRate));
	if (getAppSettings("samplerate"))
		samplerateBox.classList.add("sr-nondefault");

	document.getElementById("startup-loading-title").style.display = "none";
	document.getElementById("startup-menu").style.display = "block";
	document.getElementById("input-import-track").focus();

	function onSongChange(isNewSong, stopCommand, preserveArrangeView) {
		redrawSequence(!preserveArrangeView);
		if (isNewSong) {
			let ind = songObject.currentSynthIndex;
			synthUi.assignSynth(songObject.synthParams[ind], songObject.synths[ind], songObject.synthNames[ind]);
		}
		synthHelper.rebuildSynthList();

		switch (stopCommand) {
			case "stop":
				scheduler.stop();
				break;
			case "release":
				scheduler.release();
				break;
		}
	}

	function redrawSequence(updArrangeView) {
		if (updArrangeView) {
			arrangeUi.fillSongView();
			g_markCurrentPattern();
		}

		patternUi.redrawPattern();
		patternUi.rebuildPatternSynthList();
	}

	function onPatternSelect(isNewPattern) {
		scheduler.releasePattern();
		patternUi.redrawPattern();
		patternUi.rebuildPatternSynthList();

		if (isNewPattern)
			patternUi.setNewPatternSynth();
	}
}