"use strict";

class Synth {
	/* 
	 * Main audio chain:
	 * VCO1+VCO2+O3+Noise -> Mixer -> Envelope -> VC Filter -> VC Amplifier -> Pan -> Amplifier -> FX ->
	 */
	constructor(outputNode, transportBPM) {
		console.log(">> CREATE SYNTH <<");

		this.out = {}; // Exclude from destroying
		this.out.outputNode = outputNode;
		this.bpm = transportBPM;
		this.isMuted = false;

		this.envelope = new Tone.AmplitudeEnvelope();
		this.ampAM = new Tone.Gain(1);
		this.ampout = new Tone.Gain(1);

		this.values = {
			osc1detuneValue: 0,
			osc1octaveValue: 0,
			osc2detuneValue: 0,
			osc2octaveValue: 0,
			osc3detuneValue: 0,
			osc3octaveValue: 0,

			filterFreqValue: 0,
			filterQValue: 0,
			noiseValue: 0,
			osc1gainValue: 0,
			osc2gainValue: 0,
			osc3gainValue: 0,
			lfo1Value: 0,
			lfo2Value: 0,
			panValue: 0,
			volumeValue: 0,

			envAttackValue: 0,
			envDecayValue: 0,
			envSustainValue: 0,
			envReleaseValue: 0,

			envModAttackValue: 0,
			envModDecayValue: 0,
			envModSustainValue: 0,
			envModReleaseValue: 0,

			FXAmountValue: 0,
			FXRateValue: 0,
			FXWetValue: 0,
		};

		this.modulators = {
			osc1_modgain: null,
			osc2_modgain: null,
			filter_modgain: null,
			ampAM_modgain: null
		};

		this.modulatorValues = {
			osc1_modgain: 0,
			osc2_modgain: 0,
			filter_modgain: 0,
			ampAM_modgain: 0
		};

		this.partials = {
			osc1: [],
			osc2: [],
			osc3: []
		}

		this.modEnvelopeType = "[none]";
		this.FXType = "[none]";
		this.lastFXType = null;
		this.FXsync = false;
		this.glide = 0;
		this.porta = false;
		this.lfo1sync = false;
		this.lfo2retrig = false;

		this.envelope.chain(this.ampAM);
		this.ampAM.chain(this.ampout);
		this.ampout.chain(this.out.outputNode);

		this.filterFreqInput = 0;
		this.filterFreqSweep = 0;
		this.filterQSweep = 0;

		this.freqSignal = new Tone.Signal({ units: "frequency" });
		this.lastVolumeMod = 0;
		this.lastNote = "";
	}

	filterExp(x) {
		let absX = Math.abs(x);
		let mod = x > 0 ? 1 : -1;
		return (2 ** absX - 1) * 320 * mod;
	};

	triggerAttack(note, volumeMod, time, duration) {
		if (this.porta && this.lastNote) {
			if (note != this.lastNote) {
				let freq = Tone.Frequency(note).toFrequency();
				this.freqSignal.linearRampTo(freq, duration * this.glide, time);
			}
		} else {
			this.freqSignal.setValueAtTime(note, time);
		}

		this.lastNote = note;

		if (volumeMod != this.lastVolumeMod) {
			if (this.lastVolumeMod < volumeMod) {
				this.lastVolumeMod = volumeMod;
				let attackMod = Math.min(this.values.envAttackValue, duration);
				this.ampout.gain.linearRampTo(this.calculateVolume(), attackMod, time);
			} else {
				this.lastVolumeMod = volumeMod;
				// Reduce volume before triggerAttack
				this.ampout.gain.linearRampTo(this.calculateVolume(), 0.01, time - 0.011);
			}
		}

		this.envelope.triggerAttack(time);

		if (this.envelopeMod)
			this.envelopeMod.triggerAttack(time);

		if (this.lfo2 && this.lfo2retrig) {
			this.lfo2.stop(time);
			this.lfo2.start(time);
		}
	}

	triggerRelease(time) {
		this.envelope.triggerRelease(time);

		if (this.envelopeMod)
			this.envelopeMod.triggerRelease(time);
	}

	glideTo(note, volumeMod, time, duration) {
		if (note != this.lastNote) {
			this.lastNote = note;
			let freq = Tone.Frequency(note).toFrequency();
			this.freqSignal.linearRampTo(freq, duration * this.glide, time);
		}

		if (volumeMod != this.lastVolumeMod) {
			this.lastVolumeMod = volumeMod;
			let glideTime = Math.max(duration * this.glide, 0.01);
			this.ampout.gain.linearRampTo(this.calculateVolume(), glideTime, time);
		}
	}

	calculateVolume() {
		let volume = (1 + this.lastVolumeMod / 100) * this.values.volumeValue;
		return (Math.exp(volume * 5.76) - 1) / 1000 * 3.1611;
	}

	setVolume(value) {
		this.values.volumeValue = value
		this.ampout.gain.value = this.calculateVolume();
	}

	filterSweep(freq, q, time, duration) {
		if (!this.filter)
			return;

		let glideTime = Math.max(duration * this.glide, 0.01);
		let qRamp, fInput;

		if (q || q === 0) {
			qRamp = q;
			fInput = freq;
		} else {
			qRamp = this.values.filterQValue;
			fInput = this.filterFreqInput;
		}

		if (qRamp != this.filterQSweep) {
			this.filter.Q.linearRampTo(qRamp, glideTime, time);
			this.filterQSweep = qRamp;
		}

		if (fInput != this.filterFreqSweep) {
			let fRamp = this.filterExp(fInput);
			this.filter.frequency.linearRampTo(fRamp, glideTime, time);
			this.filterFreqSweep = fInput;
		}
	}

	resetFilter() {
		if (!this.filter)
			return;

		this.filter.frequency.value = this.values.filterFreqValue;
		this.filter.Q.value = this.values.filterQValue;
		this.filterFreqSweep = this.filterFreqInput;
		this.filterQSweep = this.values.filterQValue
	}

	resetPorta() {
		this.lastNote = "";
	}

	mute(isMute) {
		if (isMute && !this.isMuted) {
			if (this.FX)
				this.FX.disconnect();
			else
				this.ampout.disconnect();
		} else if (!isMute && this.isMuted) {
			if (this.FX)
				this.FX.chain(this.out.outputNode);
			else
				this.ampout.chain(this.out.outputNode);
		}

		this.isMuted = isMute;
	}

	addOsc1(isOsc) {
		if (isOsc) {
			if (this.osc1)
				return;

			this.osc1 = new Tone.Oscillator();
			this.osc1.detune.value = this.values.osc1octaveValue + this.values.osc1detuneValue;
			this.gain1 = new Tone.Gain(0);
			this.gain1.gain.value = this.values.osc1gainValue;

			this.osc1.start();
			this.osc1.chain(this.gain1);
			this.gain1.chain(this.envelope);
			this.restoreModulator("osc1");

			if (this.osc1_modgain)
				this.osc1_modgain.connect(this.osc1.frequency);

			console.log("add osc1");
		} else {
			if (!this.osc1)
				return;

			if (this.osc1_modgain)
				this.osc1_modgain.disconnect();

			this.osc1.stop();
			this.osc1.disconnect();
			this.osc1.dispose();
			this.osc1 = null;
			this.gain1.disconnect();
			this.gain1.dispose();
			this.gain1 = null;
			console.log("remove osc1");
		}
		this.freqSignalReconnect();
	}

	addOsc2(isOsc) {
		if (isOsc) {
			if (this.osc2)
				return;

			this.osc2 = new Tone.Oscillator();
			this.osc2.detune.value = this.values.osc2octaveValue + this.values.osc2detuneValue;
			this.gain2 = new Tone.Gain(0);
			this.gain2.gain.value = this.values.osc2gainValue;

			this.osc2.start();
			this.osc2.chain(this.gain2);
			this.gain2.chain(this.envelope);
			this.restoreModulator("osc2");

			if (this.osc2_modgain)
				this.osc2_modgain.connect(this.osc2.frequency);

			console.log("add osc2");
		} else {
			if (!this.osc2)
				return;

			if (this.osc2_modgain)
				this.osc2_modgain.disconnect();

			this.osc2.stop();
			this.osc2.disconnect();
			this.osc2.dispose();
			this.osc2 = null;
			this.gain2.disconnect();
			this.gain2.dispose();
			this.gain2 = null;
			console.log("remove osc2");
		}
		this.freqSignalReconnect();
	}

	addOsc3(isOsc) {
		if (isOsc) {
			if (this.osc3)
				return;

			this.osc3 = new Tone.Oscillator();
			this.osc3.detune.value = this.values.osc3octaveValue + this.values.osc3detuneValue;
			this.gain3 = new Tone.Gain(0);
			this.gain3.gain.value = this.values.osc3gainValue;

			this.osc3.start();
			this.osc3.chain(this.gain3);
			this.gain3.chain(this.envelope);
			this.restoreModulator("osc3");
			console.log("add osc3");
		} else {
			if (!this.osc3)
				return;

			this.osc3.stop();
			this.gain3.disconnect();
			this.osc3.disconnect();
			this.gain3.dispose();
			this.osc3.dispose();
			this.gain3 = null;
			this.osc3 = null;
			console.log("remove osc3");
		}
		this.freqSignalReconnect();
	}

	freqSignalReconnect() {
		this.freqSignal.disconnect();

		if (this.osc1)
			this.freqSignal.connect(this.osc1.frequency);
		if (this.osc2)
			this.freqSignal.connect(this.osc2.frequency);
		if (this.osc3)
			this.freqSignal.connect(this.osc3.frequency);
	}

	addNoise(isNoise) {
		if (isNoise) {
			if (this.noise)
				return;

			this.noise = new Tone.Noise();
			this.noise.channelCount = 1;
			this.noise.channelCountMode = "explicit";
			this.noisegain = new Tone.Gain(0);
			this.noisegain.gain.value = this.values.noiseValue;

			this.noise.chain(this.noisegain);
			this.noisegain.chain(this.envelope);
			this.noise.start();
			this.restoreModulator("noise");
			console.log("add noise");
		} else {
			if (!this.noise)
				return;

			this.noise.stop();
			this.noisegain.disconnect();
			this.noise.disconnect();
			this.noisegain.dispose();
			this.noise.dispose();
			this.noisegain = null;
			this.noise = null;
			console.log("remove noise");
		}
	}

	addFilter(filterType) {
		if (filterType == "[none]") {
			if (!this.filter)
				return;

			if (this.filter_modgain)
				this.filter_modgain.disconnect();

			this.envelope.disconnect(this.filter);
			this.filter.disconnect(this.ampAM);
			this.filter.dispose();
			this.filter = null;

			this.envelope.chain(this.ampAM);
			console.log("remove filter");
		} else {
			if (this.filter) {
				this.filter.type = filterType;
			} else {
				this.filter = new Tone.BiquadFilter(this.values.filterFreqValue, filterType);

				this.envelope.disconnect(this.ampAM);
				this.envelope.chain(this.filter);
				this.filter.chain(this.ampAM);

				if (this.filter_modgain)
					this.filter_modgain.connect(this.filter.frequency);

				console.log("add filter");
			}
			this.resetFilter();
		}
	}

	setFilterQ(value) {
		this.filterQSweep = value;
		this.values.filterQValue = value;
		if (this.filter)
			this.filter.Q.value = value;
	}

	setFilterFrequency(value) {
		this.filterFreqSweep = value;
		this.filterFreqInput = value;
		this.values.filterFreqValue = this.filterExp(value);
		if (this.filter)
			this.filter.frequency.value = this.values.filterFreqValue;
	}

	setFilterModAmount(value) {
		this.modulatorValues.filter_modgain = this.filterExp(value);
		if (this.filter_modgain)
			this.filter_modgain.gain.value = this.modulatorValues.filter_modgain;
	}

	addFX(type) {
		if (this.FX) {
			this.ampout.disconnect();
			this.FX.disconnect();
			this.FX.dispose();
			this.FX = null;

			if (!this.isMuted)
				this.ampout.chain(this.out.outputNode);

			console.log("remove FX");
		}

		this.FXType = type;
		if (type == "[none]")
			return

		this.lastFXType = type;

		switch (type) {
			case "distort":
				this.FX = new Tone.Distortion();
				break;

			case "delay":
				this.FX = new Tone.FeedbackDelay();
				break;

			case "pingpong":
				this.FX = new Tone.PingPongDelay();
				break;

			case "panner":
				this.FX = new Tone.AutoPanner();
				this.FX.start();
				break;

			case "reverb":
				this.FX = new Tone.Reverb();
				break;

			case "chorus":
				this.FX = new Tone.Chorus(0.5);
				this.FX.start();
				break;

			case "stereo":
				this.FX = new Tone.StereoWidener();
				break;

			case "phaser":
				this.FX = new Tone.Phaser({ baseFrequency: 440 });
				break;

			case "tremolo":
				this.FX = new Tone.Tremolo();
				this.FX.start();
				break;

			case "vibrato":
				this.FX = new Tone.Vibrato();
				break;
		}

		if (!this.FX)
			return;

		this.ampout.disconnect();
		this.ampout.chain(this.FX);

		if (!this.isMuted)
			this.FX.chain(this.out.outputNode);

		this.setFXValue();
		this.setFXRate();
		this.FX.wet.value = this.values.FXWetValue;
		console.log("add FX - " + type);
	}

	setFXValue(value) {
		if (value !== undefined)
			this.values.FXAmountValue = value;

		if (!this.FX)
			return;

		switch (this.FXType) {
			case "distort":
				this.FX.distortion = this.values.FXAmountValue;
				break;

			case "delay":
			case "pingpong":
				this.FX.feedback.value = this.values.FXAmountValue * 0.9;
				break;

			case "panner":
				this.FX.depth.value = this.values.FXAmountValue;
				break;

			case "reverb":
				this.FX.ready.then(() => {
					this.FX.decay = this.values.FXAmountValue * 4 + 0.001;
				}).catch(() => console.log("async reverb deletion"));
				break;

			case "chorus":
				this.FX.depth = this.values.FXAmountValue;
				break;

			case "stereo":
				this.FX.width.value = this.values.FXAmountValue;
				break;

			case "phaser":
				this.FX.octaves = this.values.FXAmountValue * 5;
				break;

			case "tremolo":
			case "vibrato":
				this.FX.depth.value = this.values.FXAmountValue;
				break;
		}
	}

	setFXRate(value) {
		if (value !== undefined)
			this.values.FXRateValue = value;

		if (!this.FX)
			return;

		switch (this.FXType) {
			case "delay":
			case "pingpong":
				if (this.FXsync) {
					let wholeNoteTime = 4 * 60 / this.bpm;
					let step = 5 - Math.floor(this.values.FXRateValue * 5);
					let divisor = 2 ** Math.max(1, step);

					this.FX.delayTime.value = Math.min(1, wholeNoteTime / divisor);
				} else {
					this.FX.delayTime.value = this.values.FXRateValue;
				}
				break;

			case "panner":
				this.FX.frequency.value = this.values.FXRateValue * 12;
				break;

			case "chorus":
				this.FX.delayTime = this.values.FXRateValue * 18 + 2;
				break;

			case "phaser":
				this.FX.frequency.value = this.values.FXRateValue * 20;
				break;

			case "tremolo":
			case "vibrato":
				this.FX.frequency.value = this.values.FXRateValue * 50;
				break;
		}
	}

	addPan(isPan) {
		if (isPan) {
			if (this.pan)
				return;

			this.pan = new Tone.Panner(0);
			this.pan.pan.value = this.values.panValue;
			this.ampAM.disconnect();
			this.ampAM.chain(this.pan);
			this.pan.chain(this.ampout);

			console.log("add pan");
		} else {
			if (!this.pan)
				return;

			this.ampAM.disconnect();
			this.pan.disconnect();
			this.pan.dispose();
			this.pan = null;
			this.ampAM.chain(this.ampout);
			console.log("remove pan");
		}
	}

	addLfo1(isLfo) {
		if (isLfo) {
			if (this.lfo1)
				return;

			this.lfo1 = new Tone.Oscillator(this.values.lfo1Value);

			if (this.values.lfo1Value > 0)
				this.setLfo1Frequency();

			this.lfo1.start();
			this.restoreModulator("lfo1");
			console.log("add lfo1");
		} else {
			if (!this.lfo1)
				return;

			this.lfo1.stop();
			this.lfo1.disconnect();
			this.lfo1.dispose();
			this.lfo1 = null;
			console.log("remove lfo1");
		}
	}

	setLfo1Frequency(frequency) {
		if (frequency != undefined)
			this.values.lfo1Value = frequency;

		if (!this.lfo1)
			return;

		if (this.lfo1sync) {
			this.lfo1.frequency.value = syncFreqToBpm(this.values.lfo1Value, this.bpm);
		} else {
			this.lfo1.frequency.value = this.values.lfo1Value;
		}

		function syncFreqToBpm(freq, bpm) {
			if (freq == 0 || bpm == 0)
				return 0;

			let freqPerMin = freq * 60;

			if (freqPerMin >= bpm) {
				return Math.round(freqPerMin / bpm) * bpm / 60;
			} else {
				let bpmInHz = bpm / 60;
				return bpmInHz / Math.round(bpmInHz / freq);
			}
		}
	}

	setBpm(bpm) {
		this.bpm = bpm;
		this.setLfo1Frequency(this.values.lfo1Value);
		this.addFX(this.FXType);
	}

	addLfo2(isLfo) {
		if (isLfo) {
			if (this.lfo2)
				return;

			this.lfo2 = new Tone.Oscillator(this.values.lfo2Value);
			this.lfo2.start();
			this.restoreModulator("lfo2");
			console.log("add lfo2");
		} else {
			if (!this.lfo2)
				return;

			this.lfo2.stop();
			this.lfo2.disconnect();
			this.lfo2.dispose();
			this.lfo2 = null;
			console.log("remove lfo2");
		}
	}

	addModEnvelope(type) {
		if (type == "[none]") {
			if (!this.envelopeMod)
				return

			this.envelopeMod.disconnect();
			this.envelopeMod.dispose();
			this.envelopeMod = null;

			console.log("remove mod envelope");
		} else if (!this.envelopeMod) {
			this.envelopeMod = new Tone.Envelope();
			console.log("add mod envelope");
		}

		if (this.modEnvelopeType == "[none]" && type != "[none]") {
			this.restoreModulator("envelopeMod");
		}

		this.modEnvelopeType = type;
	}

	syncModEnvelope() {
		if (!this.envelopeMod)
			return;

		this.envelopeMod.decayCurve = this.modEnvelopeType;
		this.envelopeMod.releaseCurve = this.modEnvelopeType;

		this.envelopeMod.attack = this.values.envModAttackValue;
		this.envelopeMod.decay = this.values.envModDecayValue;
		this.envelopeMod.sustain = this.values.envModSustainValue;
		this.envelopeMod.release = this.values.envModReleaseValue;

		console.log("envelope sync");
	}

	setModulator(modulatorStr, carrierGainStr) {
		let carrierGain = this[carrierGainStr];
		let previousModulator = this[this.modulators[carrierGainStr]];

		if (previousModulator && carrierGain) {
			previousModulator.disconnect(carrierGain);
		}

		if (modulatorStr == "[none]") {
			if (carrierGain && carrierGain.disconnect) {
				carrierGain.disconnect();
				carrierGain.dispose();
				this[carrierGainStr] = null;
			}
		} else {
			if (!carrierGain) {
				// Get carrier name - remove "_modgain" from "carrier_modgain"
				let targetStr = carrierGainStr.substr(0, carrierGainStr.indexOf("_"));
				this[carrierGainStr] = new Tone.Gain(this.modulatorValues[carrierGainStr]);

				if (this[targetStr]) {
					if (this[targetStr].frequency)
						this[carrierGainStr].connect(this[targetStr].frequency);
					else
						this[carrierGainStr].connect(this[targetStr].gain);
				}
			}

			if (this[modulatorStr]) {
				this[modulatorStr].connect(this[carrierGainStr]);
			}
		}

		this.modulators[carrierGainStr] = modulatorStr == "[none]" ? null : modulatorStr;
	}

	restoreModulator(modulatorStr) {
		let modulator = this[modulatorStr];
		if (!modulator)
			return;

		for (let key in this.modulators) {
			if (this.modulators[key] == modulatorStr)
				modulator.connect(this[key]);
		}
	}

	destroy() {
		for (let key in this)
			if (this[key] && this[key].disconnect)
				this[key].disconnect();

		for (let key in this)
			if (this[key] && this[key].dispose) {
				this[key].dispose();
				this[key] = null;
			}
	}
}