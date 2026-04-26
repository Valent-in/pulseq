"use strict";

class Pattern {
	constructor(name, steps) {
		this.name = name || "";
		this.length = steps || 16;
		this.colorIndex = 0;
		this.patternData = [];

		this.addLayer();
	}

	addLayer = () => {
		this.activeIndex = this.patternData.length;
		this.patternData.push({ notes: [], lengths: [], volumes: [], filtF: [], filtQ: [], fxWet: [], synthIndex: null });
	}

	deleteActiveLayer() {
		this.patternData.splice(this.activeIndex, 1);
		this.activeIndex = 0;
	}

	spliceSynth(index) {
		for (let i = 0; i < this.patternData.length; i++) {
			if (this.patternData[i].synthIndex == index)
				this.patternData[i].synthIndex = null;

			if (this.patternData[i].synthIndex > index)
				this.patternData[i].synthIndex--;
		}
	}

	isActiveLayerEmpty() {
		let layer = this.patternData[this.activeIndex];
		for (let i = 0; i < this.length; i++) {
			if (layer.notes[i])
				return false;
		}

		return true;
	}

	getFadeRange() {
		let layer = this.patternData[this.activeIndex];
		let startVolume = 0, endVolume = 0, isEmpty = true;

		for (let i = 0; i < this.length; i++) {
			if (layer.notes[i]) {
				isEmpty = false;
				endVolume = 100 + layer.volumes[i];

				if (startVolume == 0)
					startVolume = 100 + layer.volumes[i];
			}
		}

		return { startVolume: startVolume, endVolume: endVolume, isEmpty: isEmpty };
	}

	fadeActiveLayer(startVolume, endVolume) {
		let layer = this.patternData[this.activeIndex];

		let startIndex = -1, endIndex = 0;
		for (let i = 0; i < this.length; i++) {
			if (layer.notes[i]) {
				endIndex = i;

				if (startIndex < 0)
					startIndex = i;
			}
		}

		let lineLength = Math.max(1, endIndex - startIndex);
		let step = (endVolume - startVolume) / lineLength;

		for (let i = 0; i <= lineLength; i++) {
			if (layer.notes[i + startIndex])
				layer.volumes[i + startIndex] = Math.min(0, -100 + Math.round(startVolume + i * step));
		}
	}

	fadeAddActiveLayer(volumeMod) {
		let layer = this.patternData[this.activeIndex];

		for (let i = 0; i < this.length; i++) {
			layer.volumes[i] += Math.round(volumeMod);
			layer.volumes[i] = Math.max(layer.volumes[i], -99);
			layer.volumes[i] = Math.min(layer.volumes[i], 0);
		}
	}

	copyActiveLayer() {
		let layer = this.patternData[this.activeIndex];

		this.addLayer();
		let newLayer = this.patternData[this.activeIndex];

		for (let i = 0; i < this.length; i++) {
			newLayer.notes[i] = layer.notes[i];
			newLayer.lengths[i] = layer.lengths[i];
			newLayer.volumes[i] = layer.volumes[i];
			newLayer.filtF[i] = layer.filtF[i];
			newLayer.filtQ[i] = layer.filtQ[i];
			newLayer.fxWet[i] = layer.fxWet[i];
		}
	}

	shiftActiveLayer(steps, isShiftAutomation) {
		if (steps == 0)
			return;

		let length = this.length;
		steps = steps % length;

		shiftLayer(this.patternData[this.activeIndex], steps);

		function shiftLayer(layer, steps) {
			for (let i = 0; i < Math.abs(steps); i++) {
				shiftOne(layer.notes, steps);
				shiftOne(layer.lengths, steps);
				shiftOne(layer.volumes, steps);

				if (isShiftAutomation) {
					shiftOne(layer.filtF, steps);
					shiftOne(layer.filtQ, steps);
					shiftOne(layer.fxWet, steps);
				}
			}
		}

		function shiftOne(arr, direction) {
			arr.length = length;

			if (direction < 0)
				arr.push(arr.shift());
			else
				arr.unshift(arr.pop());
		}
	}

	transposeActiveLayer(steps) {
		let layer = this.patternData[this.activeIndex];
		let buffer = [];

		for (let i = 0; i < this.length; i++) {
			let buff = DEFAULT_PARAMS.noteSet.indexOf(layer.notes[i]);
			if (buff == -1) {
				buffer[i] = null;
				continue;
			}

			buffer[i] = buff + steps;

			if (buffer[i] < 0 || buffer[i] >= DEFAULT_PARAMS.noteSet.length)
				return false;
		}

		for (let i = 0; i < this.length; i++)
			if (buffer[i] !== null)
				layer.notes[i] = DEFAULT_PARAMS.noteSet[buffer[i]];

		return true;
	}

	invertActiveLayer(isKeepScale) {
		let layer = this.patternData[this.activeIndex];
		let buffer = [];

		let max = 0;
		let min = DEFAULT_PARAMS.noteSet.length;
		let presentNotes = [];

		for (let i = 0; i < this.length; i++) {
			let buff = DEFAULT_PARAMS.noteSet.indexOf(layer.notes[i]);
			if (buff == -1) {
				buffer[i] = null;
				continue;
			}

			buffer[i] = buff;
			min = Math.min(min, buff);
			max = Math.max(max, buff);

			if (presentNotes.indexOf(buff) == -1)
				presentNotes.push(buff);
		}

		let mid = min + (max - min) / 2;
		presentNotes.sort((a, b) => a - b);
		console.log(presentNotes);

		for (let i = 0; i < this.length; i++) {
			if (buffer[i] == null)
				continue;

			if (isKeepScale) {
				let ind = presentNotes.indexOf(buffer[i]);
				buffer[i] = presentNotes[presentNotes.length - 1 - ind];
			} else {
				buffer[i] = mid * 2 - buffer[i];
			}

			layer.notes[i] = DEFAULT_PARAMS.noteSet[buffer[i]];
		}
	}

	reverseActiveLayer(isReverseAutomation) {
		let layer = this.patternData[this.activeIndex];

		layer.notes.length = this.length;
		layer.lengths.length = this.length;
		layer.volumes.length = this.length;

		layer.notes.reverse();
		layer.volumes.reverse();
		layer.lengths.reverse();

		for (let i = 1; i < this.length; i++) {
			if (layer.lengths[i - 1] && (layer.lengths[i] == 100)) {
				layer.lengths[i] = layer.lengths[i - 1];
				layer.lengths[i - 1] = 100;
			}
		}

		if (isReverseAutomation) {
			layer.filtF.length = this.length;
			layer.filtQ.length = this.length;
			layer.fxWet.length = this.length;
			layer.filtF.reverse();
			layer.filtQ.reverse();
			layer.fxWet.reverse();
		}
	}
}