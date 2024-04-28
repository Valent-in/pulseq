"use strict";

function Pattern(name, steps) {
	this.name = name || "ptrn";
	this.length = steps || 16;
	this.colorIndex = 0;
	this.patternData = [];

	this.addLayer = () => {
		if (this.patternData.length == 1 && this.patternData[0].synthIndex === null) {
			console.log("Layer already created. No synth index.")
		} else {
			this.activeIndex = this.patternData.length;
			this.patternData.push({ notes: [], lengths: [], volumes: [], filtF: [], filtQ: [], synthIndex: null });
		}
	}
	this.addLayer();

	this.deleteActiveLayer = () => {
		this.patternData.splice(this.activeIndex, 1);
		this.activeIndex = 0;
	}

	this.spliceSynth = (index) => {
		for (let i = 0; i < this.patternData.length; i++) {
			if (this.patternData[i].synthIndex == index)
				this.patternData[i].synthIndex = null;

			if (this.patternData[i].synthIndex > index)
				this.patternData[i].synthIndex--;
		}
	}
}