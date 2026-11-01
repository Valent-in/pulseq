"use strict";

class SynthProto {
	constructor(outputNode, transportBPM) {
		console.log(">> CREATE SYNTH <<");

		this.out = {}; // Exclude from destroying
		this.out.outputNode = outputNode;

		this.ampout = new Tone.Gain(1);
		this.ampout.chain(outputNode);

		this.bpm = transportBPM;
		this.isMuted = false;

		this.FXType = "[none]";
		this.lastFXType = null;
		this.FXsync = false;
		this.glide = 0;

		this.fxWetSweep = 0;
		this.lastVolumeMod = 0;

		this.values = {
			volumeValue: 0,
			panValue: 0,
			FXAmountValue: 0,
			FXRateValue: 0,
			FXWetValue: 0,
		}
	}

	reconnect(newOutNode) {
		this.out.outputNode = newOutNode;

		let preOut = this.FX || this.ampout;
		preOut.disconnect();
		preOut.chain(newOutNode);
	}

	calculateVolume() {
		if (this.isMuted)
			return 0;

		let volume = (1 + this.lastVolumeMod / 100) * this.values.volumeValue;
		return (Math.exp(volume * 5.76) - 1) / 1000 * 3.1611;
	}

	setVolume(value) {
		this.values.volumeValue = value;
		this.ampout.gain.value = this.calculateVolume();
	}

	fxSweep(wet, time, duration) {
		if (!this.FX || this.isMuted)
			return;

		let glideTime = Math.max(duration * this.glide, 0.01);
		let wetRamp;

		if (wet || wet === 0) {
			wetRamp = wet;
		} else {
			wetRamp = this.values.FXWetValue;
		}

		if (wetRamp != this.fxWetSweep) {
			this.FX.wet.linearRampTo(wetRamp, glideTime, time);
			this.fxWetSweep = wetRamp;
		}
	}

	setFxWet(value) {
		if (value !== undefined)
			this.values.FXWetValue = value;

		if (this.FX && !this.isMuted)
			this.FX.wet.value = this.values.FXWetValue;
	}

	mute(isMute) {
		this.isMuted = isMute;

		if (isMute) {
			this.ampout.gain.value = 0;
			if (this.FX)
				this.FX.wet.value = 0;
		} else {
			this.ampout.gain.value = this.calculateVolume();
			this.setFxWet();
		}
	}

	addFX(type) {
		if (this.FX) {
			this.ampout.disconnect();
			this.FX.disconnect();
			this.FX.dispose();
			this.FX = null;

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

		this.FX.chain(this.out.outputNode);

		this.setFXValue();
		this.setFXRate();
		this.setFxWet();
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

	addPan(isPan, input, output) {
		if (isPan) {
			if (this.pan)
				return;

			this.pan = new Tone.Panner(0);
			this.pan.pan.value = this.values.panValue;
			input.disconnect();
			input.chain(this.pan);
			this.pan.chain(output);

			console.log("add pan");
		} else {
			if (!this.pan)
				return;

			input.disconnect();
			this.pan.disconnect();
			this.pan.dispose();
			this.pan = null;
			input.chain(output);
			console.log("remove pan");
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