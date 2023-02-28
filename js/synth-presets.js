SYNTH_PRESETS = [
	{
		"-name": "[default]",
		"synth-osc1-type": "triangle"
	},

	{
		"-name": "3-in-1",
		"synth-envelope-attack": 1.98,
		"synth-envelope-decay": 0.96,
		"synth-envelope-release": 8.92,
		"synth-filter-frequency": 1.86,
		"synth-filter-type": "lowpass",
		"synth-osc1-type": "sawtooth",
		"synth-osc2-detune": 10,
		"synth-osc2-level": 0.36,
		"synth-osc2-octave": -1,
		"synth-osc2-type": "sawtooth",
		"synth-osc3-detune": -500,
		"synth-osc3-level": 0.69,
		"synth-osc3-type": "sawtooth"
	},

	{
		"-name": "blip",
		"synth-envelope-attack": 1.34,
		"synth-envelope-decay": 0,
		"synth-envelope-release": 7.78,
		"synth-filter-frequency": 2.98,
		"synth-filter-type": "lowpass",
		"synth-lfo1-frequency": 9,
		"synth-lfo1-type": "square",
		"synth-osc1-level": 0.5,
		"synth-osc1-mod-input": "lfo1",
		"synth-osc1-mod-value": 0.98,
		"synth-osc1-type": "square"
	},

	{
		"-name": "blip paired",
		"synth-envelope-attack": 1.34,
		"synth-envelope-decay": 0,
		"synth-envelope-release": 7.78,
		"synth-filter-frequency": 2.98,
		"synth-filter-type": "lowpass",
		"synth-lfo1-frequency": 9,
		"synth-lfo1-type": "square",
		"synth-osc1-level": 0.5,
		"synth-osc1-mod-input": "lfo1",
		"synth-osc1-mod-value": 0.98,
		"synth-osc1-type": "square",
		"synth-osc2-level": 0.5,
		"synth-osc2-mod-input": "lfo1",
		"synth-osc2-mod-value": 0.42,
		"synth-osc2-type": "square"
	},

	{
		"-name": "buzzy bass",
		"synth-envelope-attack": 0.42,
		"synth-envelope-release": 11.64,
		"synth-envelope-sustain": 0.8,
		"synth-filter-frequency": 2.08,
		"synth-filter-quality": 6.1,
		"synth-filter-type": "lowpass",
		"synth-osc1-level": 0.75,
		"synth-osc1-type": "sawtooth",
		"synth-osc2-detune": 10,
		"synth-osc2-level": 0.25,
		"synth-osc2-octave": -1,
		"synth-osc2-type": "sawtooth"
	},

	{
		"-name": "buzzy lead",
		"synth-envelope-attack": 5.46,
		"synth-envelope-decay": 3.5,
		"synth-envelope-release": 8.46,
		"synth-envelope-sustain": 0.64,
		"synth-filter-frequency": 3,
		"synth-filter-mod-input": "envelopeMod",
		"synth-filter-mod-value": 2,
		"synth-filter-quality": 5.4,
		"synth-filter-type": "lowpass",
		"synth-mod-envelope-attack": 0,
		"synth-mod-envelope-release": 5.98,
		"synth-mod-envelope-type": "exponential",
		"synth-osc1-level": 0.51,
		"synth-osc1-mod-input": "osc2",
		"synth-osc1-mod-value": 3,
		"synth-osc1-type": "sawtooth",
		"synth-osc2-detune": 10,
		"synth-osc2-level": 0.25,
		"synth-osc2-octave": -2,
		"synth-osc2-type": "sawtooth"
	},

	{
		"-name": "chorded pad",
		"synth-amplifier-gain": 0.8,
		"synth-envelope-attack": 4.92,
		"synth-envelope-decay": 6.44,
		"synth-envelope-release": 8.22,
		"synth-envelope-sustain": 0.63,
		"synth-filter-frequency": 1.98,
		"synth-filter-quality": 12.5,
		"synth-filter-type": "lowpass",
		"synth-osc1-level": 0.5,
		"synth-osc1-type": "sawtooth",
		"synth-osc2-detune": -500,
		"synth-osc2-level": 0.75,
		"synth-osc2-octave": 1,
		"synth-osc2-type": "square",
		"synth-osc3-detune": -400,
		"synth-osc3-level": 0.25,
		"synth-osc3-type": "sawtooth"
	},

	{
		"-name": "clap",
		"synth-amplifier-gain": 1.1,
		"synth-envelope-attack": 1.06,
		"synth-envelope-decay": 5.4,
		"synth-envelope-release": 8.34,
		"synth-envelope-sustain": 0.03,
		"synth-filter-frequency": 2.38,
		"synth-filter-quality": 2.3,
		"synth-filter-type": "bandpass",
		"synth-noise-level": 1,
		"synth-noise-type": "white",
		"synth-osc1-type": "[none]"
	},

	{
		"-name": "clarinet",
		"synth-envelope-attack": 4.92,
		"synth-envelope-decay": 6.44,
		"synth-envelope-release": 6.12,
		"synth-envelope-sustain": 0.63,
		"synth-filter-frequency": 1.78,
		"synth-filter-quality": 9.2,
		"synth-filter-type": "lowpass",
		"synth-osc1-level": 0.75,
		"synth-osc1-type": "square",
		"synth-osc2-level": 0.5,
		"synth-osc2-type": "sawtooth"
	},

	{
		"-name": "ding",
		"synth-amplifier-mod-input": "osc2",
		"synth-amplifier-mod-value": 0.58,
		"synth-envelope-attack": 0.8,
		"synth-envelope-decay": 5.7,
		"synth-envelope-release": 8.86,
		"synth-envelope-sustain": 0.48,
		"synth-filter-frequency": 2.3,
		"synth-filter-quality": 9.1,
		"synth-filter-type": "lowpass",
		"synth-lfo1-frequency": 7.49,
		"synth-lfo1-type": "sine",
		"synth-osc1-level": 0.49,
		"synth-osc1-type": "square",
		"synth-osc2-mod-input": "lfo1",
		"synth-osc2-mod-value": 0.18,
		"synth-osc2-octave": 2,
		"synth-osc2-type": "square"
	},

	{
		"-name": "e-piano",
		"synth-envelope-attack": 0.4,
		"synth-envelope-decay": 4.04,
		"synth-envelope-release": 10.44,
		"synth-envelope-sustain": 0.51,
		"synth-filter-frequency": 1.88,
		"synth-filter-mod-input": "envelopeMod",
		"synth-filter-mod-value": 1.58,
		"synth-filter-quality": 8.6,
		"synth-filter-type": "lowpass",
		"synth-mod-envelope-attack": 0.7,
		"synth-mod-envelope-decay": 3.36,
		"synth-mod-envelope-release": 3.34,
		"synth-mod-envelope-type": "exponential",
		"synth-osc1-level": 0.75,
		"synth-osc1-type": "triangle",
		"synth-osc2-detune": -10,
		"synth-osc2-level": 0.5,
		"synth-osc2-octave": 1,
		"synth-osc2-type": "triangle"
	},

	{
		"-name": "FM pad",
		"synth-envelope-attack": 3.26,
		"synth-envelope-decay": 6.82,
		"synth-envelope-release": 8.36,
		"synth-envelope-sustain": 0.62,
		"synth-filter-frequency": 2.5,
		"synth-filter-mod-input": "envelopeMod",
		"synth-filter-mod-value": 3.1,
		"synth-filter-quality": 5.3,
		"synth-filter-type": "lowpass",
		"synth-mod-envelope-attack": 0,
		"synth-mod-envelope-decay": 7.2,
		"synth-mod-envelope-release": 7.14,
		"synth-mod-envelope-type": "exponential",
		"synth-osc1-mod-input": "osc2",
		"synth-osc1-mod-value": 3,
		"synth-osc1-type": "sine",
		"synth-osc2-octave": 3,
		"synth-osc2-type": "sine"
	},

	{
		"-name": "harmonica",
		"synth-amplifier-gain": 0.8,
		"synth-envelope-attack": 4.92,
		"synth-envelope-decay": 6.44,
		"synth-envelope-release": 6.12,
		"synth-envelope-sustain": 0.63,
		"synth-filter-frequency": 3.54,
		"synth-filter-quality": 8.2,
		"synth-filter-type": "lowpass",
		"synth-osc1-level": 0.75,
		"synth-osc1-type": "square",
		"synth-osc2-detune": 15,
		"synth-osc2-level": 0.5,
		"synth-osc2-type": "sawtooth"
	},

	{
		"-name": "hat cl",
		"synth-envelope-attack": 0,
		"synth-envelope-decay": 3.78,
		"synth-envelope-release": 5.34,
		"synth-envelope-sustain": 0.05,
		"synth-filter-frequency": 5,
		"synth-filter-quality": 12.2,
		"synth-filter-type": "highpass",
		"synth-noise-level": 1,
		"synth-noise-type": "white",
		"synth-osc1-type": "[none]"
	},

	{
		"-name": "hat op",
		"synth-amplifier-gain": 1.1,
		"synth-envelope-attack": 0,
		"synth-envelope-decay": 5.54,
		"synth-envelope-release": 7.92,
		"synth-envelope-sustain": 0.1,
		"synth-filter-frequency": 4.74,
		"synth-filter-mod-input": "envelopeMod",
		"synth-filter-mod-value": 2.84,
		"synth-filter-quality": 12.5,
		"synth-filter-type": "highpass",
		"synth-mod-envelope-attack": 0,
		"synth-mod-envelope-decay": 4.9,
		"synth-mod-envelope-release": 4.88,
		"synth-mod-envelope-type": "exponential",
		"synth-noise-level": 1,
		"synth-noise-type": "white",
		"synth-osc1-type": "[none]"
	},

	{
		"-name": "kick",
		"synth-envelope-attack": 0.4,
		"synth-envelope-decay": 6.84,
		"synth-envelope-release": 8.48,
		"synth-envelope-sustain": 0.06,
		"synth-mod-envelope-attack": 1.22,
		"synth-mod-envelope-type": "exponential",
		"synth-noise-level": 0.1,
		"synth-noise-type": "brown",
		"synth-osc1-mod-input": "envelopeMod",
		"synth-osc1-mod-value": 4.72,
		"synth-osc1-octave": -2,
		"synth-osc1-type": "sine"
	},

	{
		"-name": "lead",
		"synth-envelope-attack": 0.6,
		"synth-envelope-decay": 5.46,
		"synth-envelope-release": 10.54,
		"synth-envelope-sustain": 0.63,
		"synth-filter-frequency": 1.64,
		"synth-filter-mod-input": "envelopeMod",
		"synth-filter-mod-value": -1,
		"synth-filter-type": "lowpass",
		"synth-mod-envelope-attack": 0.78,
		"synth-mod-envelope-decay": 4.76,
		"synth-mod-envelope-release": 4.8,
		"synth-mod-envelope-type": "linear",
		"synth-osc1-type": "sawtooth",
		"synth-osc2-detune": 10,
		"synth-osc2-level": 0.5,
		"synth-osc2-type": "sawtooth"
	},

	{
		"-name": "metallic",
		"synth-envelope-attack": 0.94,
		"synth-envelope-decay": 5.52,
		"synth-envelope-release": 9.06,
		"synth-envelope-sustain": 0.05,
		"synth-filter-frequency": 2.64,
		"synth-filter-mod-input": "envelopeMod",
		"synth-filter-mod-value": 1.02,
		"synth-filter-quality": 13.1,
		"synth-filter-type": "highpass",
		"synth-mod-envelope-attack": 4.52,
		"synth-mod-envelope-decay": 4.48,
		"synth-mod-envelope-release": 4.46,
		"synth-mod-envelope-type": "linear",
		"synth-osc1-level": 0.5,
		"synth-osc1-type": "square",
		"synth-osc2-detune": -140,
		"synth-osc2-level": 0.25,
		"synth-osc2-octave": 1,
		"synth-osc2-type": "square",
		"synth-osc3-detune": -140,
		"synth-osc3-level": 0.25,
		"synth-osc3-octave": 2,
		"synth-osc3-type": "square"
	},

	{
		"-name": "octa bass",
		"synth-envelope-decay": 5.1,
		"synth-envelope-release": 7.66,
		"synth-envelope-sustain": 0.6,
		"synth-filter-mod-input": "envelopeMod",
		"synth-filter-mod-value": 3.66,
		"synth-filter-type": "lowpass",
		"synth-mod-envelope-attack": 0,
		"synth-mod-envelope-type": "exponential",
		"synth-osc1-level": 0.72,
		"synth-osc1-type": "sawtooth",
		"synth-osc2-detune": 500,
		"synth-osc2-level": 0.19,
		"synth-osc2-octave": -1,
		"synth-osc2-type": "square"
	},

	{
		"-name": "organ",
		"synth-envelope-attack": 3.1,
		"synth-envelope-decay": 6.42,
		"synth-envelope-release": 9.56,
		"synth-envelope-sustain": 0.71,
		"synth-filter-frequency": 1.38,
		"synth-filter-quality": 2.7,
		"synth-filter-type": "lowpass",
		"synth-osc1-type": "sawtooth",
		"synth-osc2-detune": -5,
		"synth-osc2-level": 0.75,
		"synth-osc2-octave": 1,
		"synth-osc2-type": "sawtooth",
		"synth-osc3-detune": 10,
		"synth-osc3-level": 0.5,
		"synth-osc3-octave": -1,
		"synth-osc3-type": "sawtooth"
	},

	{
		"-name": "pan flute",
		"synth-envelope-attack": 4.08,
		"synth-envelope-decay": 5.1,
		"synth-envelope-release": 5.98,
		"synth-envelope-sustain": 0.72,
		"synth-filter-frequency": 3.2,
		"synth-filter-quality": 1.8,
		"synth-filter-type": "lowpass",
		"synth-noise-level": 0.05,
		"synth-noise-type": "pink",
		"synth-osc1-type": "triangle"
	},

	{
		"-name": "peak bass",
		"synth-envelope-release": 5.96,
		"synth-filter-mod-input": "envelopeMod",
		"synth-filter-mod-value": 1.48,
		"synth-filter-quality": 31,
		"synth-filter-type": "lowpass",
		"synth-mod-envelope-attack": 0,
		"synth-mod-envelope-decay": 7.48,
		"synth-mod-envelope-release": 7.46,
		"synth-mod-envelope-type": "exponential",
		"synth-osc1-level": 0.38,
		"synth-osc1-octave": -1,
		"synth-osc1-type": "sawtooth"
	},

	{
		"-name": "piano",
		"synth-envelope-attack": 0.3,
		"synth-envelope-decay": 4,
		"synth-envelope-release": 9.34,
		"synth-envelope-sustain": 0.45,
		"synth-filter-frequency": 1.74,
		"synth-filter-quality": 6.7,
		"synth-filter-type": "lowpass",
		"synth-osc1-level": 0.62,
		"synth-osc1-type": "square",
		"synth-osc2-detune": 10,
		"synth-osc2-level": 0.38,
		"synth-osc2-octave": 1,
		"synth-osc2-type": "square"
	},

	{
		"-name": "siren a",
		"synth-filter-frequency": 0.7,
		"synth-filter-mod-input": "envelopeMod",
		"synth-filter-mod-value": 2,
		"synth-filter-quality": 5.1,
		"synth-filter-type": "lowpass",
		"synth-lfo1-frequency": 6.62,
		"synth-lfo1-type": "triangle",
		"synth-mod-envelope-attack": 10.36,
		"synth-mod-envelope-decay": 10.36,
		"synth-mod-envelope-release": 0,
		"synth-mod-envelope-type": "linear",
		"synth-osc1-mod-input": "lfo1",
		"synth-osc1-mod-value": 2.32,
		"synth-osc1-type": "square"
	},

	{
		"-name": "siren b",
		"synth-filter-frequency": 1.22,
		"synth-filter-mod-input": "envelopeMod",
		"synth-filter-mod-value": 2,
		"synth-filter-quality": 5.1,
		"synth-filter-type": "lowpass",
		"synth-lfo1-frequency": 4.55,
		"synth-lfo1-type": "square",
		"synth-mod-envelope-attack": 10.36,
		"synth-mod-envelope-decay": 10.36,
		"synth-mod-envelope-release": 0,
		"synth-mod-envelope-type": "linear",
		"synth-osc1-mod-input": "lfo1",
		"synth-osc1-mod-value": 1.62,
		"synth-osc1-type": "square"
	},

	{
		"-name": "snap",
		"synth-envelope-attack": 2.84,
		"synth-envelope-decay": 5.26,
		"synth-envelope-release": 7.98,
		"synth-envelope-sustain": 0.03,
		"synth-filter-frequency": 3.32,
		"synth-filter-quality": 4.9,
		"synth-filter-type": "bandpass",
		"synth-noise-level": 1,
		"synth-noise-type": "white",
		"synth-osc1-type": "[none]"
	},

	{
		"-name": "snare",
		"synth-amplifier-gain": 0.85,
		"synth-envelope-attack": 0,
		"synth-envelope-decay": 5.7,
		"synth-envelope-release": 8.26,
		"synth-envelope-sustain": 0.03,
		"synth-filter-frequency": 3.38,
		"synth-filter-mod-input": "envelopeMod",
		"synth-filter-mod-value": 4,
		"synth-filter-quality": 7.9,
		"synth-filter-type": "lowpass",
		"synth-mod-envelope-attack": 0,
		"synth-mod-envelope-decay": 4.78,
		"synth-mod-envelope-release": 4.68,
		"synth-mod-envelope-type": "exponential",
		"synth-noise-level": 1,
		"synth-noise-type": "white",
		"synth-osc1-type": "[none]"
	},

	{
		"-name": "square bass",
		"synth-envelope-decay": 6.66,
		"synth-envelope-release": 8.22,
		"synth-envelope-sustain": 0.5,
		"synth-filter-mod-input": "envelopeMod",
		"synth-filter-mod-value": 4.74,
		"synth-filter-type": "lowpass",
		"synth-mod-envelope-attack": 0,
		"synth-mod-envelope-release": 5.8,
		"synth-mod-envelope-type": "exponential",
		"synth-osc1-octave": -1,
		"synth-osc1-type": "square"
	},

	{
		"-name": "strings",
		"synth-envelope-attack": 9.62,
		"synth-envelope-decay": 3.5,
		"synth-envelope-release": 8.46,
		"synth-envelope-sustain": 0.85,
		"synth-filter-frequency": 3,
		"synth-filter-quality": 9.8,
		"synth-filter-type": "lowpass",
		"synth-osc1-type": "sawtooth",
		"synth-osc2-detune": 10,
		"synth-osc2-level": 0.69,
		"synth-osc2-type": "sawtooth"
	},

	{
		"-name": "tick",
		"synth-amplifier-gain": 0.9,
		"synth-envelope-attack": 0,
		"synth-envelope-decay": 2.96,
		"synth-envelope-release": 2.86,
		"synth-envelope-sustain": 0,
		"synth-filter-frequency": 3.18,
		"synth-filter-type": "highpass",
		"synth-noise-level": 0.74,
		"synth-noise-type": "white",
		"synth-osc1-type": "[none]"
	},

	{
		"-name": "tom",
		"synth-envelope-attack": 0.4,
		"synth-envelope-decay": 6.1,
		"synth-envelope-release": 6.84,
		"synth-envelope-sustain": 0,
		"synth-mod-envelope-attack": 0,
		"synth-mod-envelope-type": "exponential",
		"synth-osc1-mod-input": "envelopeMod",
		"synth-osc1-mod-value": 3.92,
		"synth-osc1-octave": -1,
		"synth-osc1-type": "sine"
	},

	{
		"-name": "tuba",
		"synth-envelope-attack": 4.72,
		"synth-envelope-decay": 5.62,
		"synth-envelope-release": 9,
		"synth-envelope-sustain": 0.57,
		"synth-filter-frequency": 2,
		"synth-filter-mod-input": "envelopeMod",
		"synth-filter-mod-value": -1.34,
		"synth-filter-quality": 3.2,
		"synth-filter-type": "lowpass",
		"synth-mod-envelope-attack": 0,
		"synth-mod-envelope-decay": 5.5,
		"synth-mod-envelope-release": 5.62,
		"synth-mod-envelope-type": "linear",
		"synth-osc1-level": 0.70,
		"synth-osc1-type": "sawtooth",
		"synth-osc2-detune": -20,
		"synth-osc2-level": 0.95,
		"synth-osc2-type": "triangle"
	},

	{
		"-name": "wind",
		"synth-envelope-attack": 8.84,
		"synth-envelope-release": 11.46,
		"synth-filter-frequency": 1.78,
		"synth-filter-mod-input": "lfo1",
		"synth-filter-mod-value": 0.98,
		"synth-filter-type": "lowpass",
		"synth-lfo1-frequency": 3.01,
		"synth-lfo1-type": "sine",
		"synth-noise-level": 0.75,
		"synth-noise-type": "pink",
		"synth-osc1-type": "[none]"
	},

	{
		"-name": "wow bass",
		"synth-amplifier-gain": 0.9,
		"synth-envelope-attack": 1.48,
		"synth-envelope-release": 10.46,
		"synth-filter-frequency": 0.98,
		"synth-filter-mod-input": "envelopeMod",
		"synth-filter-mod-value": 1,
		"synth-filter-quality": 17.2,
		"synth-filter-type": "lowpass",
		"synth-mod-envelope-attack": 3.88,
		"synth-mod-envelope-decay": 8.04,
		"synth-mod-envelope-release": 8.08,
		"synth-mod-envelope-type": "exponential",
		"synth-osc1-octave": -1,
		"synth-osc1-type": "sawtooth"
	},

	{
		"-name": "x-mod bass",
		"synth-envelope-attack": 0,
		"synth-envelope-decay": 3.14,
		"synth-envelope-release": 7.66,
		"synth-envelope-sustain": 0.6,
		"synth-filter-frequency": 1.28,
		"synth-filter-mod-input": "envelopeMod",
		"synth-filter-mod-value": 1.86,
		"synth-filter-quality": 13.3,
		"synth-filter-type": "lowpass",
		"synth-mod-envelope-attack": 0,
		"synth-mod-envelope-decay": 7.2,
		"synth-mod-envelope-release": 7.16,
		"synth-mod-envelope-type": "exponential",
		"synth-osc1-level": 0.61,
		"synth-osc1-mod-input": "osc2",
		"synth-osc1-mod-value": 1.98,
		"synth-osc1-octave": -1,
		"synth-osc1-type": "square",
		"synth-osc2-detune": -5,
		"synth-osc2-level": 1,
		"synth-osc2-octave": -1,
		"synth-osc2-type": "triangle"
	},

	{
		"-name": "x-mod lead",
		"synth-envelope-decay": 4.86,
		"synth-envelope-release": 8.3,
		"synth-envelope-sustain": 0.44,
		"synth-filter-frequency": 2.2,
		"synth-filter-mod-input": "envelopeMod",
		"synth-filter-mod-value": 4.52,
		"synth-filter-quality": 8.2,
		"synth-filter-type": "lowpass",
		"synth-mod-envelope-attack": 0,
		"synth-mod-envelope-decay": 5.38,
		"synth-mod-envelope-release": 10.4,
		"synth-mod-envelope-sustain": 0.38,
		"synth-mod-envelope-type": "exponential",
		"synth-osc1-level": 0.5,
		"synth-osc1-mod-input": "osc2",
		"synth-osc1-mod-value": 3,
		"synth-osc1-type": "square",
		"synth-osc2-detune": -15,
		"synth-osc2-level": 0.5,
		"synth-osc2-type": "sawtooth"
	},

	{
		"-name": "zap",
		"synth-envelope-attack": 0,
		"synth-envelope-decay": 7.56,
		"synth-envelope-release": 7.56,
		"synth-envelope-sustain": 0,
		"synth-filter-frequency": 0.68,
		"synth-filter-mod-input": "envelopeMod",
		"synth-filter-mod-value": 4,
		"synth-filter-quality": 3.7,
		"synth-filter-type": "lowpass",
		"synth-mod-envelope-attack": 0,
		"synth-mod-envelope-decay": 6.26,
		"synth-mod-envelope-release": 6.26,
		"synth-mod-envelope-type": "exponential",
		"synth-osc1-level": 0.95,
		"synth-osc1-mod-input": "envelopeMod",
		"synth-osc1-mod-value": 6,
		"synth-osc1-type": "square"
	}
];