"use strict";

const DEFAULT_PARAMS = {};

DEFAULT_PARAMS.programVersion = "1.1";
DEFAULT_PARAMS.fileFormatVersion = "1.7";

DEFAULT_PARAMS.maxPatternSteps = 64;

DEFAULT_PARAMS.minSongBars = 32;
DEFAULT_PARAMS.emptyBarsBuffer = 8;

DEFAULT_PARAMS.synthState = {
	"synth-amplifier-gain": 1,
	"synth-amplifier-mod-input": "[none]",
	"synth-amplifier-mod-value": 0,
	"synth-envelope-attack": 0.2,
	"synth-envelope-decay": 0.2,
	"synth-envelope-release": 2,
	"synth-envelope-sustain": 1,
	"synth-envelope-type": "exponential",
	"synth-filter-frequency": 1,
	"synth-filter-mod-input": "[none]",
	"synth-filter-mod-value": 0,
	"synth-filter-quality": 0,
	"synth-filter-type": "[none]",
	"synth-fx-amount": 0.5,
	"synth-fx-rate": 0.5,
	"synth-fx-sync": false,
	"synth-fx-type": "[none]",
	"synth-fx-wet": 0.5,
	"synth-glide": 0,
	"synth-lfo1-frequency": 0,
	"synth-lfo1-sync": false,
	"synth-lfo1-type": "[none]",
	"synth-lfo2-frequency": 0,
	"synth-lfo2-type": "[none]",
	"synth-mod-envelope-attack": 6,
	"synth-mod-envelope-decay": 6,
	"synth-mod-envelope-release": 6,
	"synth-mod-envelope-sustain": 0,
	"synth-mod-envelope-type": "[none]",
	"synth-noise-level": 0,
	"synth-noise-type": "[none]",
	"synth-osc1-detune": 0,
	"synth-osc1-level": 1,
	"synth-osc1-mod-input": "[none]",
	"synth-osc1-mod-value": 0,
	"synth-osc1-octave": 0,
	"synth-osc1-type": "triangle",
	"synth-osc2-detune": 0,
	"synth-osc2-level": 0,
	"synth-osc2-mod-input": "[none]",
	"synth-osc2-mod-value": 0,
	"synth-osc2-octave": 0,
	"synth-osc2-type": "[none]",
	"synth-osc3-detune": 0,
	"synth-osc3-level": 0,
	"synth-osc3-octave": 0,
	"synth-osc3-type": "[none]",
	"synth-pan": 0
};

DEFAULT_PARAMS.noteSet = [
	"C2", "Db2", "D2", "Eb2", "E2", "F2", "Gb2", "G2", "Ab2", "A2", "Bb2", "B2",
	"C3", "Db3", "D3", "Eb3", "E3", "F3", "Gb3", "G3", "Ab3", "A3", "Bb3", "B3",
	"C4", "Db4", "D4", "Eb4", "E4", "F4", "Gb4", "G4", "Ab4", "A4", "Bb4", "B4",
	"C5", "Db5", "D5", "Eb5", "E5", "F5", "Gb5", "G5", "Ab5", "A5", "Bb5", "B5",
	"C6", "Db6", "D6", "Eb6", "E6", "F6", "Gb6", "G6", "Ab6", "A6", "Bb6", "B6"
];

DEFAULT_PARAMS.colorSet = [
	"#b4d", "#4bd", "#4db", "#bd4", "#db4", "#d4b",
	"#97d", "#7dd", "#7d9", "#dd7", "#d94", "#d77",
	"#b9d", "#9bd", "#bd9", "#dd9", "#db9", "#d9b",
	"#999", "#bbb", "#ddd", "#55d", "#5b5", "#d55"
];

for (let key in DEFAULT_PARAMS) {
	let o = DEFAULT_PARAMS[key];
	if (typeof o == "object")
		Object.freeze(o);
}

Object.freeze(DEFAULT_PARAMS);