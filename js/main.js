"use strict"
{
    const songObject = {
        song: [],
        patterns: [],
        synthParams: [],
        synths: [],
        synthNames: [],

        bpm: 120,
        currentPattern: null,
        synthAssignMode: false,
        arrangeStartPoint: 0,

        comprThreshold: -30,
        comprRatio: 3,
        compressor: new Tone.Compressor(this.comprThreshold, this.comprRatio),
    }
    songObject.compressor.toDestination();

    const g_synthUi = new SynthUi();

    const g_patternUi = new PatternUi(songObject, g_synthUi.assignSynth);
    g_patternUi.build();
    g_patternUi.setLength(16);

    // TODO: use separate list for synth selection in pattern view
    const g_synthList = new SynthList(songObject, g_synthUi, g_addSynthToPattern);

    const g_arrange = new Arrange(songObject, g_patternUi.importSequence, g_patternUi.rebuildPatternSynthList);

    const g_scheduler = new Scheduler(songObject);

    schedulerUiInit(g_scheduler);
    menuInit(songObject, g_onSongLoad, g_synthUi.loadSynth, g_patternUi.importSequence, g_scheduler.renderSong);

    // init
    songObject.patterns.push(new Pattern());
    songObject.currentPattern = songObject.patterns[0];
    g_synthList.createNewSynth("synth1");
    songObject.currentPattern.patternData[0].synthIndex = 0;
    g_patternUi.importSequence(songObject.currentPattern);
    g_patternUi.rebuildPatternSynthList(songObject.currentPattern);

    function g_addSynthToPattern(pattern) {
        g_patternUi.importSequence(pattern);
        g_patternUi.rebuildPatternSynthList(pattern);
    }

    function g_onSongLoad() {
        g_synthList.rebuildSynthList();
        g_arrange.fillSongView();
        songObject.currentPattern = songObject.patterns[0];
        g_patternUi.importSequence(songObject.currentPattern);
        g_patternUi.rebuildPatternSynthList(songObject.currentPattern);
    }
}