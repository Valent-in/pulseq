"use strict";

const DEFAULT_PARAMS = {};

DEFAULT_PARAMS.programVersion = "1.5.1";
DEFAULT_PARAMS.fileFormatVersion = "21";

DEFAULT_PARAMS.maxPatternSteps = 64;

DEFAULT_PARAMS.minSongBars = 32;
DEFAULT_PARAMS.emptyBarsBuffer = 8;

DEFAULT_PARAMS.pressDelay = 380;

DEFAULT_PARAMS.heavyEffects = "reverb phaser";

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
	"synth-lfo1-partials": "",
	"synth-lfo1-sync": false,
	"synth-lfo1-type": "[none]",
	"synth-lfo2-frequency": 0,
	"synth-lfo2-partials": "",
	"synth-lfo2-retrig": false,
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
	"synth-osc1-partials": "",
	"synth-osc1-type": "triangle",
	"synth-osc2-detune": 0,
	"synth-osc2-level": 0,
	"synth-osc2-mod-input": "[none]",
	"synth-osc2-mod-value": 0,
	"synth-osc2-octave": 0,
	"synth-osc2-partials": "",
	"synth-osc2-type": "[none]",
	"synth-osc3-detune": 0,
	"synth-osc3-level": 0,
	"synth-osc3-octave": 0,
	"synth-osc3-partials": "",
	"synth-osc3-type": "[none]",
	"synth-pan": 0,
	"synth-porta": false
};

DEFAULT_PARAMS.noteSet = [];
{
	let noteSet = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
	for (let i = 2; i <= 6; i++)
		noteSet.forEach(e => { DEFAULT_PARAMS.noteSet.push(e + i) });
}

DEFAULT_PARAMS.noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

DEFAULT_PARAMS.scaleSet = [[null, "[none]"],
["101011010101", "Major"],
["101011011001", "H-Major"], // Harmonic
["101101011010", "Minor"],
["101101011001", "H-Minor"],
["100101010010", "P-Minor"], // Pentatonic
["100110011001", "Augmented"],
["101011011101", "Bebop"], // major
["100101110010", "Blues"],
["110010101011", "Enigmatic"],
["110011011001", "Flamenco"],
["101100111010", "Gypsy"],
["100111010100", "Harmonics"],
["100010110001", "Hirajoshi"],
["100110110110", "Hungarian"], // major
["110001010010", "Insen"],
["110110110000", "Istrian"],
["101101010101", "Jazz"], // Melodic minor (ascending)
["110101010101", "Neapolitan"], // major ?
["101101101101", "Octatonic"],
["110011101001", "Persian"],
["101010100110", "Prometheus"],
["110010110010", "Tritone"],
["101100110110", "Ukrainian"],
["101010101010", "Wholetone"]
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