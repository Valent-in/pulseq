"use strict";

function synthParamApply(paramId, controlValue, synth) {
	let value = Number(controlValue);

	const envelopeExp = (x) => (2 ** x - 1) / 255;

	const lfoExp = (x) => (2 ** x) / 32;

	const freqModExp = (x) => {
		let absX = Math.abs(x);
		let mod = x > 0 ? 1 : -1;
		return (2 ** absX - 1) * 20 * mod;
	}

	switch (paramId) {
		// Oscillator 1
		case "synth-osc1-octave":
			synth.values.osc1octaveValue = controlValue * 1200;
			if (synth.osc1)
				synth.osc1.detune.value = synth.values.osc1octaveValue + synth.values.osc1detuneValue;
			break;

		case "synth-osc1-detune":
			synth.values.osc1detuneValue = value;
			if (synth.osc1)
				synth.osc1.detune.value = synth.values.osc1octaveValue + synth.values.osc1detuneValue;
			break;

		case "synth-osc1-reset-detune":
			synth.values.osc1detuneValue = 0;
			value = 0;
			paramId = "synth-osc1-detune"
			if (synth.osc1)
				synth.osc1.detune.value = synth.values.osc1octaveValue + synth.values.osc1detuneValue;
			break;

		case "synth-osc1-level":
			synth.values.osc1gainValue = value;
			if (synth.gain1)
				synth.gain1.gain.value = synth.values.osc1gainValue;
			break;

		case "synth-osc1-type":
			value = controlValue;
			if (value == "[none]") {
				synth.addOsc1(false);
			} else {
				synth.addOsc1(true);
				synth.osc1.type = controlValue;
			}
			break;

		// Oscillator 2
		case "synth-osc2-octave":
			synth.values.osc2octaveValue = controlValue * 1200;
			if (synth.osc2)
				synth.osc2.detune.value = synth.values.osc2octaveValue + synth.values.osc2detuneValue;
			break;

		case "synth-osc2-detune":
			synth.values.osc2detuneValue = value;
			if (synth.osc2)
				synth.osc2.detune.value = synth.values.osc2octaveValue + synth.values.osc2detuneValue;
			break;

		case "synth-osc2-reset-detune":
			synth.values.osc2detuneValue = 0;
			value = 0;
			paramId = "synth-osc2-detune"
			if (synth.osc2)
				synth.osc2.detune.value = synth.values.osc2octaveValue + synth.values.osc2detuneValue;
			break;

		case "synth-osc2-level":
			synth.values.osc2gainValue = value;
			if (synth.gain2)
				synth.gain2.gain.value = synth.values.osc2gainValue;
			break;

		case "synth-osc2-type":
			value = controlValue;
			if (value == "[none]") {
				synth.addOsc2(false);
			} else {
				synth.addOsc2(true);
				synth.osc2.type = controlValue;
			}
			break;

		// Oscillator 3
		case "synth-osc3-octave":
			synth.values.osc3octaveValue = controlValue * 1200;
			if (synth.osc3)
				synth.osc3.detune.value = synth.values.osc3octaveValue + synth.values.osc3detuneValue;
			break;

		case "synth-osc3-detune":
			synth.values.osc3detuneValue = value;
			if (synth.osc3)
				synth.osc3.detune.value = synth.values.osc3octaveValue + synth.values.osc3detuneValue;;
			break;

		case "synth-osc3-reset-detune":
			synth.values.osc3detuneValue = 0;
			value = 0;
			paramId = "synth-osc3-detune"
			if (synth.osc3)
				synth.osc3.detune.value = synth.values.osc3octaveValue + synth.values.osc3detuneValue;
			break;

		case "synth-osc3-level":
			synth.values.osc3gainValue = value;
			if (synth.osc3)
				synth.gain3.gain.value = synth.values.osc3gainValue;
			break;

		case "synth-osc3-type":
			value = controlValue;
			if (value == "[none]") {
				synth.addOsc3(false);
			} else {
				synth.addOsc3(true);
				synth.osc3.type = controlValue;
			}
			break;

		// Noise
		case "synth-noise-type":
			value = controlValue;
			if (value == "[none]") {
				synth.addNoise(false);
			} else {
				synth.addNoise(true);
				synth.noise.type = value;
			}
			break;

		case "synth-noise-level":
			synth.values.noiseValue = value;
			if (synth.noisegain)
				synth.noisegain.gain.value = value;
			break;

		// Amplitude envelope
		case "synth-envelope-attack":
			synth.values.envAttackValue = envelopeExp(value);
			synth.envelope.attack = synth.values.envAttackValue;
			break;

		case "synth-envelope-decay":
			synth.values.envDecayValue = envelopeExp(value) + 0.001;
			synth.envelope.decay = synth.values.envDecayValue;
			break;

		case "synth-envelope-sustain":
			synth.values.envSustainValue = value;
			synth.envelope.sustain = synth.values.envSustainValue;
			break;

		case "synth-envelope-release":
			synth.values.envReleaseValue = envelopeExp(value) + 0.001;
			synth.envelope.release = synth.values.envReleaseValue;
			break;

		case "synth-envelope-type":
			value = controlValue;
			synth.envelope.decayCurve = value;
			synth.envelope.releaseCurve = value;
			break;

		// Filter
		case "synth-filter-type":
			value = controlValue;
			synth.addFilter(value);
			break;

		case "synth-filter-frequency":
			synth.setFilterFrequency(value);
			break;

		case "synth-filter-quality":
			synth.setFilterQ(value);
			break;

		// Amplifier
		case "synth-amplifier-gain":
			synth.setVolume(value);
			break;

		//Glide
		case "synth-glide":
			synth.glide = value;
			break;

		// Panner
		case "synth-pan":
			synth.addPan(!!value);
			synth.values.panValue = value;
			if (synth.pan)
				synth.pan.pan.value = value;
			break;

		case "synth-pan-reset":
			value = 0;
			paramId = "synth-pan"

			synth.addPan(false);
			synth.values.panValue = 0;
			if (synth.pan)
				synth.pan.pan.value = 0;
			break;

		//LFO1
		case "synth-lfo1-frequency":
			synth.setLfo1Frequency(lfoExp(value));
			break;

		case "synth-lfo1-sync":
			value = controlValue;
			synth.lfo1sync = value;
			synth.setLfo1Frequency();
			break;

		case "synth-lfo1-type":
			value = controlValue;
			if (value == "[none]") {
				synth.addLfo1(false);
			} else {
				synth.addLfo1(true);
				synth.lfo1.type = controlValue;
			}
			break;

		//LFO2
		case "synth-lfo2-frequency":
			synth.values.lfo2Value = lfoExp(value);
			if (synth.lfo2)
				synth.lfo2.frequency.value = synth.values.lfo2Value;
			break;

		case "synth-lfo2-type":
			value = controlValue;
			if (value == "[none]") {
				synth.addLfo2(false);
			} else {
				synth.addLfo2(true);
				synth.lfo2.type = controlValue;
			}
			break;

		// Modulation envelope
		case "synth-mod-envelope-type":
			value = controlValue;
			synth.addModEnvelope(value);
			synth.syncModEnvelope();
			break;

		case "synth-mod-envelope-attack":
			synth.values.envModAttackValue = envelopeExp(value);
			synth.syncModEnvelope();
			break;

		case "synth-mod-envelope-decay":
			synth.values.envModDecayValue = envelopeExp(value) + 0.001;
			synth.syncModEnvelope();
			break;

		case "synth-mod-envelope-sustain":
			synth.values.envModSustainValue = value;
			synth.syncModEnvelope();
			break;

		case "synth-mod-envelope-release":
			synth.values.envModReleaseValue = envelopeExp(value) + 0.001;
			synth.syncModEnvelope();
			break;

		// Modulators
		case "synth-osc1-mod-input":
			value = controlValue;
			synth.setModulator(value, "osc1_modgain");
			break;

		case "synth-osc1-mod-value":
			synth.modulatorValues.osc1_modgain = freqModExp(value);
			if (synth.osc1_modgain)
				synth.osc1_modgain.gain.value = synth.modulatorValues.osc1_modgain;
			break;

		case "synth-osc2-mod-input":
			value = controlValue;
			synth.setModulator(value, "osc2_modgain");
			break;

		case "synth-osc2-mod-value":
			synth.modulatorValues.osc2_modgain = freqModExp(value);
			if (synth.osc2_modgain)
				synth.osc2_modgain.gain.value = synth.modulatorValues.osc2_modgain;
			break;

		case "synth-filter-mod-input":
			value = controlValue;
			synth.setModulator(value, "filter_modgain");
			break;

		case "synth-filter-mod-value":
			synth.setFilterModAmount(value);
			break;

		case "synth-amplifier-mod-input":
			value = controlValue;
			synth.setModulator(value, "ampAM_modgain");
			break;

		case "synth-amplifier-mod-value":
			synth.modulatorValues.ampAM_modgain = value;
			if (synth.ampAM_modgain)
				synth.ampAM_modgain.gain.value = value;
			break;

		// FX
		case "synth-fx-type":
			value = controlValue;
			synth.addFX(value);
			break;

		case "synth-fx-amount":
			synth.setFXValue(value);
			break;

		case "synth-fx-rate":
			synth.setFXRate(value);
			break;

		case "synth-fx-sync":
			value = controlValue;
			synth.FXsync = value;
			synth.setFXRate();
			break;

		case "synth-fx-wet":
			synth.values.FXWetValue = value;
			if (synth.FX)
				synth.FX.wet.value = synth.values.FXWetValue;
			break;

		default:
			console.log("Function not implemented for : " + paramId);
			return null;
	}

	return { id: paramId, value: value };
};