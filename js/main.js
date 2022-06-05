"use strict"
{
    const songObject = {
        song: [],
        patterns: [],
        synthParams: [],
        synths: [],
        synthNames: [],

        title: "",
        bpm: 120,

        currentPattern: null,
        arrangeStartPoint: 0,

        compressorThreshold: -30,
        compressorRatio: 3,
        compressor: new Tone.Compressor(this.compressorThreshold, this.compressorRatio),

        deleteCurrentPattern: function () {
            if (!this.currentPattern)
                return;

            this.currentPattern.toDelete = true;
            let deleteIndex = 0;
            for (let i = 0; i < this.patterns.length; i++) {
                if (this.patterns[i].toDelete) {
                    deleteIndex = i;
                    break;
                }
            }

            this.patterns.splice(deleteIndex, 1);

            for (let i = 0; i < this.song.length; i++) {
                if (this.song[i].length >= deleteIndex + 1) {
                    this.song[i].splice(deleteIndex, 1);
                }
            }

            this.currentPattern = this.patterns[0];
        },

        deleteSynth: function (index) {
            this.synths[index].destroy();

            this.synths.splice(index, 1);
            this.synthNames.splice(index, 1);
            this.synthParams.splice(index, 1);

            for (let i = 0; i < this.patterns.length; i++) {
                this.patterns[i].spliceSynth(index);
            }
        },

        setCurrentLayerSynthIndex: function (index) {
            let layerIndex = this.currentPattern.activeIndex;
            this.currentPattern.patternData[layerIndex].synthIndex = index;
        },

        getCurrentLayerSynthIndex: function () {
            let layerIndex = this.currentPattern.activeIndex;
            return this.currentPattern.patternData[layerIndex].synthIndex;
        },

        getCurrentLayerSynthName: function () {
            let index = this.getCurrentLayerSynthIndex();
            return index === null ? null : this.synthNames[index];
        }
    }
    songObject.compressor.toDestination();

    const synthUi = new SynthUi();

    const patternUi = new PatternUi(songObject, synthUi.assignSynth);
    patternUi.build();
    patternUi.setLength(16);

    // TODO: use separate list for synth selection in pattern view
    const synthList = new SynthList(songObject, synthUi, updPatternSynthList);

    const arrangeUi = new ArrangeUi(songObject, patternUi.importSequence, patternUi.rebuildPatternSynthList);
    arrangeUi.build();

    const scheduler = new Scheduler(songObject);

    schedulerUiInit(scheduler);
    menuInit(songObject, onSongChange, synthUi.loadSynth, patternUi.importSequence, scheduler.renderSong);

    // init
    songObject.patterns.push(new Pattern("ptrn1"));
    songObject.currentPattern = songObject.patterns[0];
    synthList.createNewSynth("synth1");
    songObject.currentPattern.patternData[0].synthIndex = 0;
    updPatternSynthList();

    function onSongChange(isNewSong) {
        synthList.rebuildSynthList();
        arrangeUi.fillSongView();
        updPatternSynthList();
        if (isNewSong)
            synthUi.assignSynth(songObject.synthParams[0], songObject.synths[0], songObject.synthNames[0]);
    }

    function updPatternSynthList() {
        patternUi.importSequence(songObject.currentPattern);
        patternUi.rebuildPatternSynthList(songObject.currentPattern);
    }
}