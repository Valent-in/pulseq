"use strict"

const OldSynth = Synth;

Synth = function (outputNode, transportBPM) {
	OldSynth.call(this, outputNode, transportBPM);

	let osc1signal = new Tone.Signal({ units: "frequency" });
	let osc2signal = new Tone.Signal({ units: "frequency" });
	let osc3signal = new Tone.Signal({ units: "frequency" });

	this.getOscillatorByIndex = function (oscillatorIndex) {
		let oscSignal;
		let oscGain;
		let oscGainValue;

		switch (oscillatorIndex) {
			case 1:
				oscSignal = osc1signal;
				oscGain = this.gain1;
				oscGainValue = this.values.osc1gainValue;
				break;

			case 2:
				oscSignal = osc2signal;
				oscGain = this.gain2;
				oscGainValue = this.values.osc2gainValue;
				break;

			case 3:
				oscSignal = osc3signal;
				oscGain = this.gain3;
				oscGainValue = this.values.osc3gainValue;
				break;
		}

		return { oscSignal, oscGain, oscGainValue }
	}

	this.addPolyVoice = function (note, volumeMod, time, duration, oscillatorIndex) {
		//console.log("oscillatorIndex", oscillatorIndex);
		if (!oscillatorIndex)
			oscillatorIndex = 1;

		let { oscSignal, oscGain, oscGainValue } = this.getOscillatorByIndex(oscillatorIndex);

		oscSignal.setValueAtTime(note, time);

		if (oscGain) {
			oscGain.gain.linearRampTo(oscGainValue, 0.02, time);
		}
	}

	this.releasePolyVoice = function (time, oscillatorIndex) {

		if (!oscillatorIndex)
			oscillatorIndex = 1;

		let { oscSignal, oscGain, oscGainValue } = this.getOscillatorByIndex(oscillatorIndex);

		if (oscGain) {
			oscGain.gain.linearRampTo(0, this.values.envReleaseValue, time);
		}
	}

	this.triggerAttack = function (note, volumeMod, time, duration) {
		osc1signal.setValueAtTime(note, time);
		osc2signal.setValueAtTime(note, time);
		osc3signal.setValueAtTime(note, time);

		this.attackEnvelope(note, volumeMod, time, duration);
	}

	this.triggerPolyAttack = function (note, volumeMod, time, duration) {
		osc1signal.setValueAtTime(note, time);

		if (this.gain1)
			this.gain1.gain.linearRampTo(this.values.osc1gainValue, 0, time);

		if (this.gain2)
			this.gain2.gain.linearRampTo(0, 0, time);

		if (this.gain3)
			this.gain3.gain.linearRampTo(0, 0, time);


		this.attackEnvelope(note, volumeMod, time, duration);
	}

	this.attackEnvelope = function (note, volumeMod, time, duration) {
		this.envelope.triggerAttack(time);

		if (this.envelopeMod)
			this.envelopeMod.triggerAttack(time);
	}

	this.triggerRelease = function (time) {
		this.envelope.triggerRelease(time);

		if (this.envelopeMod)
			this.envelopeMod.triggerRelease(time);
	}

	this.glideTo = function (note, volumeMod, time, duration) {
		let freq = Tone.Frequency(note).toFrequency();
		osc1signal.linearRampTo(freq, duration * this.glide, time);
		osc2signal.linearRampTo(freq, duration * this.glide, time);
		osc3signal.linearRampTo(freq, duration * this.glide, time);
	}

	this.freqSignalReconnect = function () {
		osc1signal.disconnect();
		osc2signal.disconnect();
		osc3signal.disconnect();

		if (this.osc1)
			osc1signal.connect(this.osc1.frequency);
		if (this.osc2)
			osc2signal.connect(this.osc2.frequency);
		if (this.osc3)
			osc3signal.connect(this.osc3.frequency);
	}

}
