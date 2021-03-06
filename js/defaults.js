"use strict"

const DEFAULT_PARAMS = {};

DEFAULT_PARAMS.synthState = {
	"synth-amplifier-gain": 0.75,
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
	"synth-mod-envelope-state": "disabled",
	"synth-mod-envelope-sustain": 0,
	"synth-noise-level": 0,
	"synth-noise-type": "[none]",
	"synth-osc1-detune": 0,
	"synth-osc1-level": 1,
	"synth-osc1-mod-input": "[none]",
	"synth-osc1-mod-value": 0,
	"synth-osc1-octave": 0,
	"synth-osc1-type": "sine",
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
}

DEFAULT_PARAMS.noteSet = [
	"C2", "Db2", "D2", "Eb2", "E2", "F2", "Gb2", "G2", "Ab2", "A2", "Bb2", "B2",
	"C3", "Db3", "D3", "Eb3", "E3", "F3", "Gb3", "G3", "Ab3", "A3", "Bb3", "B3",
	"C4", "Db4", "D4", "Eb4", "E4", "F4", "Gb4", "G4", "Ab4", "A4", "Bb4", "B4",
	"C5", "Db5", "D5", "Eb5", "E5", "F5", "Gb5", "G5", "Ab5", "A5", "Bb5", "B5",
	"C6", "Db6", "D6", "Eb6", "E6", "F6", "Gb6", "G6", "Ab6", "A6", "Bb6", "B6"
];