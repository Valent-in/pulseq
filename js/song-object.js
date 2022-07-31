"use strict"

function SongObject() {
    this.song = [];
    this.patterns = [];
    this.synthParams = [];
    this.synths = [];
    this.synthNames = [];

    this.title = "";
    this.bpm = 120;
    this.barSteps = 16;

    this.currentPattern = null;
    this.currentPatternIndex = 0;
    this.currentSynthIndex = 0;
    this.arrangeStartPoint = 0;

    this.compressorThreshold = -30;
    this.compressorRatio = 3;
    this.compressor = new Tone.Compressor(this.compressorThreshold, this.compressorRatio);
    this.compressor.toDestination();

    this.deleteCurrentPattern = function () {
        let deleteIndex = this.currentPatternIndex;
        this.patterns.splice(deleteIndex, 1);

        for (let i = 0; i < this.song.length; i++) {
            if (this.song[i].length >= deleteIndex + 1) {
                this.song[i].splice(deleteIndex, 1);
            }
        }

        this.setCurrentPattern(0);
    }

    this.deleteSynth = function (index) {
        this.synths[index].destroy();

        this.synths.splice(index, 1);
        this.synthNames.splice(index, 1);
        this.synthParams.splice(index, 1);

        for (let i = 0; i < this.patterns.length; i++) {
            this.patterns[i].spliceSynth(index);
        }
    }

    this.setCurrentLayerSynthIndex = function (index) {
        let layerIndex = this.currentPattern.activeIndex;
        this.currentPattern.patternData[layerIndex].synthIndex = index;
    }

    this.getCurrentLayerSynthIndex = function () {
        let layerIndex = this.currentPattern.activeIndex;
        return this.currentPattern.patternData[layerIndex].synthIndex;
    }

    this.getCurrentLayerSynthName = function () {
        let index = this.getCurrentLayerSynthIndex();
        return index === null ? null : this.synthNames[index];
    }

    this.setCurrentPattern = function (index) {
        this.currentPatternIndex = index;
        this.currentPattern = this.patterns[index];
    }

    this.setCurrentPatternLength = function (len) {
        for (let seq of this.currentPattern.patternData) {
            seq.notes.length = len;
            seq.lengths.length = len;
            seq.volumes.length = len;
        }

        this.currentPattern.length = len;
    }

    this.calcSongLength = function () {
        const maxBarsPerPattern = Math.ceil(64 / this.barSteps);
        let maxLen = 0;

        for (let i = this.song.length - 1; i >= 0; i--) {
            let maxPatternLen = 0;

            for (let j = 0; j < this.song[i].length; j++) {
                if (this.song[i][j]) {
                    maxPatternLen = Math.max(maxPatternLen, this.patterns[j].length);
                }
            }

            if (maxPatternLen != 0) {
                maxLen = Math.max(maxLen, i + Math.ceil(maxPatternLen / this.barSteps));
                maxPatternLen = 0;
            }

            if (i <= maxLen - maxBarsPerPattern) {
                return maxLen;
            }
        }

        return maxLen;
    }

    this.setBarLength = function (steps) {
        this.barSteps = steps;
        this.patterns.forEach(e => {
            e.length = Math.min(64, Math.round(e.length / steps) * steps);
        });
    }

    this.getSongDuration = function () {
        let totalBars = this.calcSongLength();
        let totalBeats = Math.ceil((totalBars + 1) * this.barSteps / 4);
        let totalTime = Math.ceil(totalBeats * (60 / this.bpm));
        return totalTime;
    }

    this.copyPattern = function (copyFromPattern, name) {
        let len = copyFromPattern.length;
        let ptrn = new Pattern(name, len);
        ptrn.patternData = JSON.parse(JSON.stringify(copyFromPattern.patternData));
        this.patterns.push(ptrn);
    }
}