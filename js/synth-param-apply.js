function synthParamApply(paramId, controlValue, synth) {
    let value = Number(controlValue);
    let envValue = null;
    let lfoValue;

    switch (paramId) {
        // Oscillator 1
        case "synth-osc1-octave":
            synth.values.osc1octaveValue = controlValue * 1200;
            //console.log("osc1 detune", value);
            if (synth.osc1)
                synth.osc1.detune.value = synth.values.osc1octaveValue + synth.values.osc1detuneValue;
            break;

        case "synth-osc1-detune":
            synth.values.osc1detuneValue = Number(controlValue);
            //console.log("osc1 detune", value);
            if (synth.osc1)
                synth.osc1.detune.value = synth.values.osc1octaveValue + synth.values.osc1detuneValue;
            break;

        case "synth-osc1-reset-detune":
            synth.values.osc1detuneValue = 0;
            value = 0;
            paramId = "synth-osc1-detune"
            //console.log("osc1 detune", value);
            if (synth.osc1)
                synth.osc1.detune.value = synth.values.osc1octaveValue + synth.values.osc1detuneValue;
            document.getElementById("synth-osc1-detune").value = 0;
            break;

        case "synth-osc1-level":
            synth.values.osc1gainValue = controlValue;
            if (synth.gain1)
                synth.gain1.gain.value = controlValue;
            //console.log("osc1 gain", controlValue);
            break;

        case "synth-osc1-type":
            value = controlValue;
            if (value == "[none]") {
                synth.addOsc1(false);
            } else {
                synth.addOsc1(true);
                synth.osc1.type = controlValue;
            }
            //console.log("osc1 type", controlValue);
            break;

        // Oscillator 2
        case "synth-osc2-octave":
            synth.values.osc2octaveValue = controlValue * 1200;
            //console.log("osc2 detune", value);
            if (synth.osc2)
                synth.osc2.detune.value = synth.values.osc2octaveValue + synth.values.osc2detuneValue;
            break;

        case "synth-osc2-detune":
            synth.values.osc2detuneValue = Number(controlValue);
            //console.log("osc2 detune", value);
            if (synth.osc2)
                synth.osc2.detune.value = synth.values.osc2octaveValue + synth.values.osc2detuneValue;
            break;

        case "synth-osc2-reset-detune":
            synth.values.osc2detuneValue = 0;
            value = 0;
            paramId = "synth-osc2-detune"
            //console.log("osc2 detune", value);
            if (synth.osc2)
                synth.osc2.detune.value = synth.values.osc2octaveValue + synth.values.osc2detuneValue;
            document.getElementById("synth-osc2-detune").value = 0;
            break;

        case "synth-osc2-level":
            synth.values.osc2gainValue = controlValue;
            if (synth.gain2)
                synth.gain2.gain.value = controlValue;
            //console.log("osc2 gain", controlValue);
            break;

        case "synth-osc2-type":
            value = controlValue;
            if (value == "[none]") {
                synth.addOsc2(false);
            } else {
                synth.addOsc2(true);
                synth.osc2.type = controlValue;
            }
            //console.log("osc2 type", controlValue);
            break;


        // Oscillator 3
        case "synth-osc3-octave":
            synth.values.osc3octaveValue = controlValue * 1200;
            //console.log("osc3 detune", value);
            if (synth.osc3)
                synth.osc3.detune.value = synth.values.osc3octaveValue + synth.values.osc3detuneValue;

            break;

        case "synth-osc3-detune":
            synth.values.osc3detuneValue = Number(controlValue);
            //console.log("osc3 detune", value);
            if (synth.osc3)
                synth.osc3.detune.value = synth.values.osc3octaveValue + synth.values.osc3detuneValue;;

            break;

        case "synth-osc3-reset-detune":
            synth.values.osc3detuneValue = 0;
            value = 0;
            paramId = "synth-osc3-detune"
            //console.log("osc3 detune", value);
            if (synth.osc3)
                synth.osc3.detune.value = synth.values.osc3octaveValue + synth.values.osc3detuneValue;
            document.getElementById("synth-osc3-detune").value = 0;
            break;

        case "synth-osc3-level":
            synth.values.osc3gainValue = controlValue;
            if (synth.osc3)
                synth.gain3.gain.value = controlValue;
            //console.log("osc3 gain", controlValue);
            break;

        case "synth-osc3-type":
            value = controlValue;
            if (value == "[none]") {
                synth.addOsc3(false);
            } else {
                synth.addOsc3(true);
                synth.osc3.type = controlValue;
            }
            //console.log("osc3 type", controlValue);
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
            //console.log("osc1 gain", value);
            break;

        // Amplitude envelope
        case "synth-envelope-attack":
            envValue = (2 ** value) / 1000;
            synth.values.envAttackValue = envValue;
            synth.syncEnvelope();
            //console.log("Envelope Attack", envValue);
            synth.envelope.attack = envValue;
            break;

        case "synth-envelope-decay":
            envValue = (2 ** value) / 1000;
            synth.values.envDecayValue = envValue;
            synth.syncEnvelope();
            //console.log("Envelope Decay", envValue);
            synth.envelope.decay = envValue;
            break;

        case "synth-envelope-sustain":
            //console.log("Envelope Sustain", value);
            synth.values.envSustainValue = value;
            synth.syncEnvelope();
            synth.envelope.sustain = value;
            break;

        case "synth-envelope-release":
            envValue = (2 ** value) / 1000;
            synth.values.envReleaseValue = envValue;
            synth.syncEnvelope();
            //console.log("Envelope Release", envValue);
            synth.envelope.release = envValue;
            break;

        // Filter
        case "synth-filter-type":
            value = controlValue;
            if (value == "[none]") {
                synth.addFilter(false);
            } else {
                synth.addFilter(true);
                synth.filter.type = controlValue;
            }
            //console.log("filter type", controlValue);
            break;

        case "synth-filter-frequency":
            synth.values.filterFreqValue = value;
            if (synth.filter)
                synth.filter.frequency.value = value;
            //console.log("Filter freq", value);
            break;

        case "synth-filter-quality":
            synth.values.filterQValue = value;
            if (synth.filter)
                synth.filter.Q.value = value;
            //console.log("Filter Q", value);
            break;


        // Amplifier
        case "synth-amplifier-gain":
            let amp = controlValue;
            //console.log("Amplifier", amp);
            synth.ampout.gain.value = amp;
            break;

        //Glide
        case "synth-glide":
            synth.glide = value;
            //console.log("glide", value);
            break;

        // Panner
        case "synth-pan":
            synth.addPan(!!value);
            synth.values.panValue = value;
            if (synth.pan)
                synth.pan.pan.value = value;
            //console.log("pan", value);
            break;

        case "synth-pan-reset":
            value = 0;
            paramId = "synth-pan"

            synth.addPan(false);
            synth.values.panValue = 0;
            if (synth.pan)
                synth.pan.pan.value = 0;

            document.getElementById("synth-pan").value = 0;
            //console.log("pan reset");
            break;

        //LFO1
        case "synth-lfo1-frequency":
            lfoValue = 0.03 * (2 ** Number(controlValue));

            synth.values.lfo1Value = lfoValue;
            if (synth.lfo1)
                synth.lfo1.frequency.value = lfoValue;
            //console.log("lfo1 freq", lfoValue);
            break;

        case "synth-lfo1-type":
            value = controlValue;
            if (value == "[none]") {
                synth.addLfo1(false);
            } else {
                synth.addLfo1(true);
                synth.lfo1.type = controlValue;
            }
            //console.log("lfo1 type", controlValue);
            break;

        // Modulation envelope
        case "synth-mod-envelope-state":
            value = controlValue;
            //console.log("Envelope Mod Attack", envValue);
            synth.addModEnvelope(value);
            synth.syncEnvelope();
            break;

        case "synth-mod-envelope-attack":
            envValue = (2 ** value) / 1000;
            synth.values.envModAttackValue = envValue;
            synth.syncEnvelope();
            //console.log("Envelope Mod Attack", envValue);
            break;

        case "synth-mod-envelope-decay":
            envValue = (2 ** value) / 1000;
            synth.values.envModDecayValue = envValue;
            synth.syncEnvelope();
            //console.log("Envelope Mod Decay", envValue);
            break;

        case "synth-mod-envelope-sustain":
            synth.values.envModSustainValue = value;
            synth.syncEnvelope();
            //console.log("Envelope Mod Sustain", value);
            break;

        case "synth-mod-envelope-release":
            envValue = (2 ** value) / 1000;
            synth.values.envModReleaseValue = envValue;
            synth.syncEnvelope();
            //console.log("Envelope Mod Release", envValue);
            break;


        // Modulators
        case "synth-osc1-mod-input":
            value = controlValue;
            synth.setModulator(value, "osc1_modgain");
            break;

        case "synth-osc1-mod-value":
            synth.modulatorValues.osc1_modgain = value;
            if (synth.osc1_modgain)
                synth.osc1_modgain.gain.value = value;
            //console.log("Osc1 mod", controlValue);
            break;

        case "synth-osc2-mod-input":
            value = controlValue;
            synth.setModulator(value, "osc2_modgain");
            break;

        case "synth-osc2-mod-value":
            synth.modulatorValues.osc2_modgain = value;
            if (synth.osc2_modgain)
                synth.osc2_modgain.gain.value = value;
            //console.log("Osc2 mod", controlValue);
            break;

        case "synth-filter-mod-input":
            value = controlValue;
            synth.setModulator(value, "filter_modgain");
            break;

        case "synth-filter-mod-value":
            synth.modulatorValues.filter_modgain = value;
            if (synth.filter_modgain)
                synth.filter_modgain.gain.value = value;
            //console.log("Filter mod", controlValue);
            break;

        case "synth-amplifier-mod-input":
            value = controlValue;
            synth.setModulator(value, "ampAM_modgain");
            break;

        case "synth-amplifier-mod-value":
            synth.modulatorValues.ampAM_modgain = value;
            if (synth.ampAM_modgain)
                synth.ampAM_modgain.gain.value = value;
            //console.log("Amp mod", controlValue);
            break;

        case "synth-fx-type":
            value = controlValue;
            synth.addFX(value);
            //console.log("FX type", controlValue);
            break;

        case "synth-fx-amount":
            synth.setFXValue(value);
            //console.log("FX amount", controlValue);
            break;

        case "synth-fx-ratio":
            synth.setFXRatio(value);
            //console.log("FX amount", controlValue);
            break;


        case "synth-fx-sync":
            value = controlValue;
            synth.FXsync = value;
            synth.setFXRatio();
            //console.log("FX amount", controlValue);
            break;


        default:
        //console.log("Function not implemented for : " + paramId);
    }

    return value;
};