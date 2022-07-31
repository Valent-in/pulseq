"use strict"

{
    Tone.context.lookAhead = 0.15;

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

    const songObject = new SongObject();

    const synthUi = new SynthUi();

    const patternUi = new PatternUi(songObject, synthUi.assignSynth);
    patternUi.build();
    patternUi.setLength(16);

    const synthList = new SynthList(songObject, synthUi, updPatternSynthList);

    const arrangeUi = new ArrangeUi(songObject, onPatternSelect);
    arrangeUi.build();

    const scheduler = new Scheduler(songObject, arrangeUi.setMarker, patternUi.setMarker);

    schedulerUiInit(scheduler);
    menuInit(songObject, onSongChange, synthList.loadSynth, patternUi.importSequence, scheduler.renderSong);

    songObject.patterns.push(new Pattern("ptrn1"));
    songObject.setCurrentPattern(0);
    g_markCurrentPattern();
    synthList.createNewSynth("synth1");
    songObject.currentPattern.patternData[0].synthIndex = 0;
    updPatternSynthList();

    document.getElementById("startup-loading-title").style.display = "none";
    document.getElementById("startup-menu").style.display = "block";

    function onSongChange(isNewSong) {
        arrangeUi.fillSongView();
        updPatternSynthList();
        if (isNewSong) {
            synthUi.assignSynth(songObject.synthParams[0], songObject.synths[0], songObject.synthNames[0]);
            songObject.currentSynthIndex = 0;
        }
        synthList.rebuildSynthList();
        g_markCurrentPattern();
    }

    function updPatternSynthList() {
        patternUi.importSequence(songObject.currentPattern);
        patternUi.rebuildPatternSynthList(songObject.currentPattern);
    }

    function onPatternSelect(newCurrentPattern) {
        scheduler.releasePattern();
        patternUi.importSequence(newCurrentPattern);
        patternUi.rebuildPatternSynthList(newCurrentPattern);
    }
}