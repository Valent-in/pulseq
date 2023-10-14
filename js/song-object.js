"use strict";

function SongObject() {
	this.song = [];
	this.patterns = [];
	this.synthParams = [];
	this.synths = [];
	this.synthNames = [];

	this.title = "";
	this.bpm = 120;
	this.barSteps = 16;
	this.swing = 0;

	this.currentPattern = null;
	this.currentPatternIndex = 0;
	this.currentSynthIndex = 0;
	this.arrangeStartPoint = 0;
	this.synthFill = [];
	this.playableLength = 0;

	this.compressorThreshold = -30;
	this.compressorRatio = 3;
	this.compressor = new Tone.Compressor(this.compressorThreshold, this.compressorRatio);
	this.compressor.toDestination();

	this.fillSong = function () {
		this.song = [];
		for (let i = 0; i < DEFAULT_PARAMS.minSongBars; i++)
			this.song.push([]);
	}

	this.createEmptySong = function () {
		this.fillSong();
		this.createSynth("synth1");
		this.patterns.push(new Pattern("ptrn1"));
		this.setCurrentPattern(0);
		this.currentPattern.patternData[0].synthIndex = 0;
	}

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

	this.generatePatternName = function (prefix, startNumber) {
		let patternNames = this.patterns.map(e => e.name);
		return generateName(prefix || "ptrn", patternNames, startNumber);
	}

	this.createSynth = function (name, copyFromParams) {
		let newSynth = new Synth(this.compressor, this.bpm);
		let newSynthParamObj = {};
		let params = copyFromParams || DEFAULT_PARAMS.synthState;

		for (let key in params) {
			newSynthParamObj[key] = params[key];
			synthParamApply(key, newSynthParamObj[key], newSynth);
		}

		this.synthParams.push(newSynthParamObj);
		this.synths.push(newSynth);
		this.synthNames.push(name);
	}

	this.deleteSynth = function (index) {
		this.synths[index].destroy();

		this.synths.splice(index, 1);
		this.synthNames.splice(index, 1);
		this.synthParams.splice(index, 1);

		for (let i = 0; i < this.patterns.length; i++) {
			this.patterns[i].spliceSynth(index);
		}

		this.calculateSynthFill();
	}

	this.generateSynthName = function (prefix, startNumber) {
		return generateName(prefix || "synth", this.synthNames, startNumber);
	}

	this.testSynthOnPattern = function (synthIndex) {
		let layerIndex = this.currentPattern.activeIndex;

		if (synthIndex === null)
			return true;

		if (this.currentPattern.patternData[layerIndex].synthIndex == synthIndex)
			return true;

		if (this.isSynthInCurrentPattern(synthIndex))
			return false;

		let patternBars = Math.ceil(this.currentPattern.length / this.barSteps);
		for (let i = 0; i <= this.song.length - patternBars; i++)
			if (this.song[i][this.currentPatternIndex])
				for (let j = i; j < i + patternBars; j++)
					if (this.synthFill[j][synthIndex])
						return false;

		return true;
	}

	this.setCurrentLayerSynthIndex = function (synthIndex) {
		let layerIndex = this.currentPattern.activeIndex;
		if (this.testSynthOnPattern(synthIndex))
			this.currentPattern.patternData[layerIndex].synthIndex = synthIndex;
	}

	this.isSynthInCurrentPattern = function (synthIndex) {
		if (synthIndex === null)
			return false;

		let pattern = this.currentPattern;
		for (let i = 0; i < pattern.patternData.length; i++) {
			if (pattern.patternData[i].synthIndex == synthIndex)
				return true;
		}

		return false;
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
		let tmpLen = this.currentPattern.length;
		this.currentPattern.length = len;

		let collisions = this.calculateSynthFill();

		let ptrnBars = Math.ceil(len / this.barSteps);
		for (let i = 0; i <= this.song.length - ptrnBars; i++) {
			if (this.song[i][this.currentPatternIndex])
				for (let j = 1; j < ptrnBars; j++)
					if (this.song[i + j][this.currentPatternIndex])
						collisions++;
		}

		if (len >= tmpLen && collisions > 0) {
			this.currentPattern.length = tmpLen;
			this.calculateSynthFill();
			return false;
		}

		for (let seq of this.currentPattern.patternData) {
			seq.notes.length = len;
			seq.lengths.length = len;
			seq.volumes.length = len;
		}

		return true;
	}

	this.calcSongLength = function () {
		const maxBarsPerPattern = Math.ceil(DEFAULT_PARAMS.maxPatternSteps / this.barSteps);
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
			}

			if (i <= maxLen - maxBarsPerPattern) {
				return maxLen;
			}
		}

		return maxLen;
	}

	this.isSongEmpty = function () {
		if (this.patterns.length > 1)
			return false;

		if (this.calcSongLength() > 0)
			return false;

		if (this.patterns[0].patternData.length > 1)
			return false;

		for (let note of this.patterns[0].patternData[0].notes)
			if (note)
				return false;

		return true;
	}

	this.setBarLength = function (steps) {
		if (this.barSteps == steps)
			return;

		this.barSteps = Math.floor(steps);
		this.patterns = [];
		this.patterns.push(new Pattern("ptrn1", this.barSteps));

		this.fillSong();
		this.calculateSynthFill();

		this.setCurrentPattern(0);
		this.setCurrentLayerSynthIndex(0);
	}

	this.calculateDuration = function (bars) {
		let beats = bars * this.barSteps / 4;
		return beats * (60 / this.bpm);
	}

	this.getSongDuration = function () {
		let totalBars = this.calcSongLength();
		return Math.ceil(this.calculateDuration(totalBars) + this.calculateDuration(1));
	}

	this.getStartPointTime = function () {
		let time = this.calculateDuration(this.arrangeStartPoint);
		return secondsToStr(time);
	}

	this.getEndPointTime = function () {
		let time = this.calculateDuration(this.calcSongLength());
		return secondsToStr(time);
	}

	this.copyPattern = function (copyFromPattern, name) {
		let len = copyFromPattern.length;
		let ptrn = new Pattern(name, len);
		ptrn.colorIndex = copyFromPattern.colorIndex;
		ptrn.patternData = JSON.parse(JSON.stringify(copyFromPattern.patternData));
		this.patterns.push(ptrn);
		this.setCurrentPattern(this.patterns.length - 1);
	}

	this.calculateSynthFill = function (statrPoint, endPoint) {
		let collisions = 0;
		if (statrPoint === undefined || this.song.length != this.synthFill.length) {
			this.synthFill = [];
			for (let i = 0; i < this.song.length; i++) {
				let col = [];
				col.length = this.synths.length;
				this.synthFill.push(col);
			}

			statrPoint = 0;
			endPoint = this.song.length - 1;
		}

		const setPatternFill = (pattern, startPosition) => {
			let patternSynthIndexes = getPatternSynthIndexes(pattern);

			let patternBars = Math.ceil(pattern.length / this.barSteps);
			for (let i = startPosition; i < startPosition + patternBars; i++) {
				for (let j = 0; j < patternSynthIndexes.length; j++) {
					let row = patternSynthIndexes[j];

					if (this.synthFill[i][row])
						collisions++;

					this.synthFill[i][row] = true;
				}
			}
		}

		for (let i = statrPoint; i <= endPoint; i++) {
			for (let j = 0; j < this.song[i].length; j++) {
				if (this.song[i][j]) {
					let ptrn = this.patterns[j];
					setPatternFill(ptrn, i);
				}
			}
		}

		this.playableLength = this.calcSongLength();
		return collisions;
	}

	this.checkSynthConflict = function (patternIndex, position) {
		let pattern = this.patterns[patternIndex];
		let addBars = Math.ceil(pattern.length / this.barSteps) - 1;
		let endPoint = Math.min(this.song.length - 1, position + addBars);

		for (let i = position; i <= endPoint; i++) {
			if (!this.isArrangeCellFree(i, patternIndex))
				return true;
		}

		return false;
	}

	this.isArrangeCellFree = function (col, row) {
		let pattern = this.patterns[row];
		let patternSynthIndexes = getPatternSynthIndexes(pattern);

		for (let i = 0; i < patternSynthIndexes.length; i++) {
			if (this.synthFill[col][patternSynthIndexes[i]]) {
				return false;
			}
		}

		return true;
	}

	this.switchPatterns = function (indexOne, indexTwo) {
		switchElements(this.patterns, indexOne, indexTwo);

		if (this.currentPatternIndex == indexOne)
			this.setCurrentPattern(indexTwo)
		else if (this.currentPatternIndex == indexTwo)
			this.setCurrentPattern(indexOne)

		for (let i = 0; i < this.song.length; i++)
			switchElements(this.song[i], indexOne, indexTwo);

		function switchElements(array, indexO, indexT) {
			let tmp = array[indexO] || null;
			array[indexO] = array[indexT] || null;
			array[indexT] = tmp;
		}
	}

	this.movePattern = function (indexFrom, indexTo) {
		if (indexFrom < 0 || indexFrom >= this.patterns.length) {
			console.log("invalid pattern index: FROM " + indexFrom);
			return;
		}

		if (indexTo < 0 || indexTo >= this.patterns.length) {
			console.log("invalid pattern index: TO " + indexTo);
			return;
		}

		if (indexFrom < indexTo) {
			for (let i = indexFrom; i < indexTo; i++)
				this.switchPatterns(i, i + 1)
		} else {
			for (let i = indexFrom; i > indexTo; i--)
				this.switchPatterns(i - 1, i)
		}
	}

	this.sortPatternsByName = function (isDescending) {
		for (let i = 0; i < this.patterns.length; i++) {
			let tmpIndex = i;
			for (let j = i + 1; j < this.patterns.length; j++) {
				if (comparePatterns(this.patterns[j], this.patterns[tmpIndex], isDescending))
					tmpIndex = j;
			}

			this.switchPatterns(i, tmpIndex);
		}

		function comparePatterns(one, two, isDescending) {
			// return true if one-two in order
			if (!isDescending && (one.name <= two.name))
				return true;

			if (isDescending && (one.name >= two.name))
				return true;

			return false;
		}
	}

	function getPatternSynthIndexes(pattern) {
		let patternSynthIndexes = [];
		for (let i = 0; i < pattern.patternData.length; i++) {
			let synthIndex = pattern.patternData[i].synthIndex;
			if (synthIndex !== null)
				patternSynthIndexes.push(synthIndex);
		}

		return patternSynthIndexes;
	}

	function generateName(prefix, givenArray, startIndex) {
		let index = startIndex || (givenArray.length + 1);

		let name = String(prefix) + index;

		while (givenArray.some(e => e == name))
			name = String(prefix) + ++index;

		return name;
	}

	function secondsToStr(time) {
		let minutes = String(Math.floor(time / 60));
		let seconds = String(Math.floor(time % 60));
		let decimal = String(Math.floor((time - Math.floor(time)) * 100));

		if (minutes.length == 1)
			minutes = "0" + minutes;

		if (seconds.length == 1)
			seconds = "0" + seconds;

		if (decimal.length == 1)
			decimal = "0" + decimal;

		return minutes + ":" + seconds + "." + decimal;
	}
}