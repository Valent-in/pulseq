"use strict"

function Synth(outputNode) {
	console.log(">> CREATE SYNTH <<");

	/* 
	 * Main audio chain:
	 * VCO1+VCO2+O3+Noise -> Mixer -> Envelope -> VC Filter -> VC Amplifier -> FX -> Amplifier -> Pan
	 * Envelope comes before filter to avoid cracking at 0 Attack
	 */

	this.envelope = new Tone.AmplitudeEnvelope(0.5, 0.5, 0.5, 0.5);
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
		driveVlaue: 0,
		noiseValue: 0,
		osc1gainValue: 0,
		osc2gainValue: 0,
		osc3gainValue: 0,
		lfo1Value: 0,
		panValue: 0,

		envAttackValue: 0,
		envDecayValue: 0,
		envSustainValue: 0,
		envReleaseValue: 0,

		envModAttackValue: 0,
		envModDecayValue: 0,
		envModSustainValue: 0,
		envModReleaseValue: 0,

		FXAmountValue: 0,
		FXRatioValue: 0
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

	this.modEnvelopeState = "disabled";
	this.FXType = "[none]";
	this.FXsync = false;
	this.glide = 0;

	this.envelope.chain(this.ampAM);
	this.ampAM.chain(this.ampout);
	this.ampout.connect(outputNode);

	let freqSignal = new Tone.Signal({
		value: "A4",
		units: "frequency"
	});

	this.triggerAttack = function (note, time) {
		freqSignal.setValueAtTime(note, time);

		this.envelope.triggerAttack(time);

		if (this.envelopeMod)
			this.envelopeMod.triggerAttack(time);
	}

	this.triggerRelease = function (time) {
		this.envelope.triggerRelease(time);

		if (this.envelopeMod)
			this.envelopeMod.triggerRelease(time);
	}

	this.glideTo = function (note, time, duration) {
		let freq = Tone.Frequency(note).toFrequency();
		freqSignal.linearRampTo(freq, duration * this.glide, time)
	}

	this.addFilter = function (isFilter) {
		if (isFilter) {
			if (this.filter)
				return;

			this.filter = new Tone.Filter(0, "highpass");
			this.filter.frequency.value = this.values.filterFreqValue;
			this.filter.Q.value = this.values.filterQValue;

			this.envelope.disconnect(this.ampAM);

			this.envelope.chain(this.filter);
			this.filter.chain(this.ampAM);

			if (this.filter_modgain)
				this.filter_modgain.connect(this.filter.frequency);

			console.log("add filter");
		} else {
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
		}
	}

	this.addNoise = function (isNoise) {
		if (isNoise) {
			if (this.noise)
				return;

			this.noise = new Tone.Noise("white");
			this.noisegain = new Tone.Gain(0);
			this.noisegain.gain.value = this.values.noiseValue;

			this.noise.chain(this.noisegain);
			this.noisegain.chain(this.envelope);
			this.noise.start();
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

	this.addFX = function (type) {
		if (this.FX) {
			this.ampAM.disconnect();
			this.FX.disconnect();
			this.FX.dispose();
			this.FX = null;
			this.ampAM.chain(this.ampout);
			console.log("remove FX");
		}

		this.FXType = type;
		if (type == "[none]")
			return

		switch (type) {
			case "distort":
				this.FX = new Tone.Distortion(0);
				break;

			case "delay":
				this.FX = new Tone.FeedbackDelay("8n", 0);
				break;

			case "reverb":
				this.FX = new Tone.Reverb(0.1);
				break;

			case "chorus":
				this.FX = new Tone.Chorus(4, 2.5, 0.5);
				this.FX.start();
				break;

			case "stereo":
				this.FX = new Tone.StereoWidener(0.5);
				break;
		}

		if (!this.FX)
			return;

		this.ampAM.disconnect();

		// FX bypass
		if (type == "reverb" || type == "delay")
			this.ampAM.chain(this.ampout);

		this.ampAM.chain(this.FX);
		this.FX.chain(this.ampout);

		console.log("add FX - " + type);

		this.setFXValue();
		this.setFXRatio();
	}

	this.setFXValue = function (value) {
		if (value)
			this.values.FXAmountValue = value;

		if (!this.FX)
			return;

		switch (this.FXType) {
			case "distort":
				this.FX.distortion = this.values.FXAmountValue;
				break;

			case "delay":
				this.FX.feedback.value = this.values.FXAmountValue * 0.9;
				break;

			case "reverb":
				this.FX.decay = this.values.FXAmountValue * 2;
				break;

			case "chorus":
				this.FX.depth = this.values.FXAmountValue;
				break;

			case "stereo":
				this.FX.width.value = this.values.FXAmountValue;
				break;
		}
	}

	this.setFXRatio = function (value) {
		if (value)
			this.values.FXRatioValue = value;

		if (!this.FX)
			return;

		switch (this.FXType) {
			case "delay":
				if (this.FXsync) {
					this.FX.delayTime.value = (2 ** (4 - Math.round(this.values.FXRatioValue * 3))) + "n";
					console.log(this.values.FXRatioValue);
				} else {
					this.FX.delayTime.value = this.values.FXRatioValue;
					console.log("delay: " + this.FX.delayTime.value);
				}
				break;

			case "chorus":
				this.FX.delayTime = this.values.FXRatioValue * 10;
				break;
		}
	}

	this.addOsc1 = function (isOsc) {
		//freqSignal.disconnect();
		if (isOsc) {
			if (this.osc1)
				return;

			this.osc1 = new Tone.Oscillator(400, "sine");
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

	this.addOsc2 = function (isOsc) {
		//freqSignal.disconnect();
		if (isOsc) {
			if (this.osc2)
				return;

			this.osc2 = new Tone.Oscillator(400, "sine");
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

	this.addOsc3 = function (isOsc) {
		//freqSignal.disconnect();
		if (isOsc) {
			if (this.osc3)
				return;

			this.osc3 = new Tone.Oscillator(400, "sine");
			this.osc3.detune.value = this.values.osc3octaveValue + this.values.osc3detuneValue;
			this.gain3 = new Tone.Gain(0);

			this.gain3.gain.value = this.values.osc3gainValue;
			freqSignal.connect(this.osc3.frequency);

			this.osc3.chain(this.gain3);
			this.gain3.chain(this.envelope);
			this.osc3.start();
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

	this.freqSignalReconnect = function () {
		freqSignal.disconnect();

		if (this.osc1)
			freqSignal.connect(this.osc1.frequency);
		if (this.osc2)
			freqSignal.connect(this.osc2.frequency);
		if (this.osc3)
			freqSignal.connect(this.osc3.frequency);
	}

	this.addLfo1 = function (isLfo) {
		if (isLfo) {
			if (this.lfo1)
				return;

			this.lfo1 = new Tone.Oscillator(this.values.lfo1Value, "sine");
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


	this.setModulator = function (modulatorStr, driverStr) {
		for (let key in this.modulators) {
			if (!this.modulators[key])
				this[key] = new Tone.Gain(0);
			this[key].gain.value = this.modulatorValues[key];

			let target = key.substr(0, key.indexOf("_"));
			//console.log("GAIN: ", key, " TARGET: ", target);

			if (this[target] && this[key]) {
				if (this[target].frequency)
					this[key].connect(this[target].frequency);
				else
					this[key].connect(this[target].gain);
			}
		}

		let driver = this[driverStr];
		let prevMod = this[this.modulators[driverStr]];
		let nextMod = modulatorStr == "[none]" ? null : this[modulatorStr];

		//console.log(this.modulators[driverStr], driverStr, "  --- next: " + modulatorStr);
		if (driver) {
			if (prevMod) {
				prevMod.disconnect(driver);
			}

			if (nextMod) {
				nextMod.connect(driver);
			}
		}

		this.modulators[driverStr] = modulatorStr == "[none]" ? null : modulatorStr;

		for (let key in this.modulators) {
			if (!this.modulators[key])
				if (this[key] && this[key].disconnect) {
					this[key].disconnect();
					this[key].dispose();
					this[key] = null;
				}
		}
	}

	this.restoreModulator = function (modulatorStr) {
		let modulator = this[modulatorStr];
		if (!modulator)
			return;

		for (let key in this.modulators) {
			if (this.modulators[key] == modulatorStr)
				modulator.connect(this[key]);
		}
	}

	this.addPan = function (isPan) {
		if (isPan) {
			if (this.pan)
				return;

			this.pan = new Tone.Panner(0);
			this.pan.pan.value = this.values.panValue;
			this.ampout.disconnect();
			this.ampout.chain(this.pan);
			this.pan.connect(outputNode);
			console.log("add pan");

		} else {
			if (!this.pan)
				return;

			this.ampout.disconnect();
			this.pan.disconnect();
			this.pan.dispose();
			this.pan = null;
			this.ampout.connect(outputNode);
			console.log("remove pan");
		}
	}

	this.addModEnvelope = function (state) {
		if (state == "disabled") {
			if (!this.envelopeMod)
				return

			this.envelopeMod.disconnect();
			this.envelopeModRev.disconnect();

			this.envelopeMod.dispose();
			this.envelopeModRev.dispose();

			this.envelopeMod = null;
			this.envelopeModRev = null;
			console.log("remove mod envelope");
		} else if (!this.envelopeMod) {
			this.envelopeMod = new Tone.Envelope(0.5, 0.5, 0.5, 0.5);
			this.envelopeModRev = new Tone.Negate();

			this.envelopeMod.connect(this.envelopeModRev);
			console.log("add mod envelope");
		}

		if (this.modEnvelopeState == "disabled" && state != "disabled") {
			this.restoreModulator("envelopeMod");
			this.restoreModulator("envelopeModRev");
		}

		this.modEnvelopeState = state;
	}

	this.syncEnvelope = function () {
		if (!this.envelopeMod)
			return;

		if (this.modEnvelopeState == "lock") {
			this.envelopeMod.attack = this.values.envAttackValue;
			this.envelopeMod.decay = this.values.envDecayValue;
			this.envelopeMod.sustain = this.values.envSustainValue;
			this.envelopeMod.release = this.values.envReleaseValue;
		} else {
			this.envelopeMod.attack = this.values.envModAttackValue;
			this.envelopeMod.decay = this.values.envModDecayValue;
			this.envelopeMod.sustain = this.values.envModSustainValue;
			this.envelopeMod.release = this.values.envModReleaseValue;
		}

		console.log("envelope sync");
	}

	this.destroy = () => {
		for (let key in this)
			if (this[key] && this[key].disconnect)
				this[key].disconnect();

		freqSignal.disconnect();

		for (let key in this)
			if (this[key] && this[key].dispose) {
				this[key].dispose();
				this[key] = null;
			}

		freqSignal.dispose();
		freqSignal = null;
	}
}
