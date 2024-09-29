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
		if (this.patternData.length == 1 && this.patternData[0].synthIndex === null) {
			console.log("Layer already created. No synth index.")
		} else {
			this.activeIndex = this.patternData.length;
			this.patternData.push({ notes: [], lengths: [], volumes: [], filtF: [], filtQ: [], synthIndex: null });
		}
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

		console.log("volumes", layer.volumes);
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
		}
	}

	shiftActiveLayer(steps, isShiftPattern) {
		if (steps == 0)
			return;

		let length = this.length;
		steps = steps % length;

		if (isShiftPattern) {
			for (let i = 0; i < this.patternData.length; i++) {
				let layer = this.patternData[i];
				shiftLayer(layer, steps, this.length);
			}
		} else {
			let layer = this.patternData[this.activeIndex];
			shiftLayer(layer, steps);
		}

		function shiftLayer(layer, steps) {
			for (let i = 0; i < Math.abs(steps); i++) {
				let direction = steps > 0 ? 1 : -1;
				shiftOne(layer.notes, direction);
				shiftOne(layer.lengths, direction);
				shiftOne(layer.volumes, direction);
				shiftOne(layer.filtF, direction);
				shiftOne(layer.filtQ, direction);
			}
		}

		function shiftOne(arr, direction) {
			if (direction < 0)
				shiftOneLeft(arr);
			if (direction > 0)
				shiftOneRight(arr);
		}

		function shiftOneLeft(arr) {
			let tmp = arr[0];
			for (let i = 0; i < length - 1; i++)
				arr[i] = arr[i + 1];

			arr[length - 1] = tmp;
		}

		function shiftOneRight(arr) {
			let tmp = arr[length - 1];
			for (let i = length - 1; i > 0; i--)
				arr[i] = arr[i - 1];

			arr[0] = tmp;
		}
	}

	transposeActiveLayer(steps) {
		let noteArr = DEFAULT_PARAMS.noteSet.slice().reverse();
		let layer = this.patternData[this.activeIndex];
		let buffer = [];

		for (let i = 0; i < this.length; i++) {
			buffer[i] = findRowByNote(layer.notes[i]);

			if (buffer[i] !== null)
				buffer[i] -= steps;

			if (buffer[i] < 0 || buffer[i] >= noteArr.length)
				return false;
		}

		for (let i = 0; i < this.length; i++)
			if (buffer[i] !== null)
				layer.notes[i] = noteArr[buffer[i]];


		return true;

		function findRowByNote(note) {
			for (let i = 0; i < noteArr.length; i++)
				if (noteArr[i] == note)
					return i;

			return null;
		}
	}
}