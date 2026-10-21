"use strict";

// Synth compatibility layer for WAMs
class WamSynth extends SynthProto {
	constructor(outputNode, transportBPM) {
		super(outputNode, transportBPM);
	}

	glideTo() { }
	filterSweep() { }
	resetFilter() { }
	resetPorta() { }

	setPlugin(plugin) {
		this.plugin = plugin;
		this.plugin.node.connect(this.ampout);
		this.addPan(!!this.panValue);
	}

	addPan(isPan) {
		if (this.plugin)
			super.addPan(isPan, this.plugin.node, this.ampout);
	}

	triggerAttack(note, volumeMod, time, duration) {
		if (!this.plugin)
			return;

		this.lastNote = Tone.Frequency(note).toMidi();
		let velo = Math.round((100 + volumeMod) * 1.27);
		const midiData = [0x90, this.lastNote, velo];

		const wamMidiEvent = {
			type: "wam-midi",
			time: time,
			data: {
				bytes: midiData
			}
		};

		this.plugin.wamInstance.audioNode.scheduleEvents(wamMidiEvent);
	}

	triggerRelease(time) {
		if (!this.plugin)
			return;

		const midiData = [0x80, this.lastNote, 127];

		const wamMidiEvent = {
			type: "wam-midi",
			time: time,
			data: {
				bytes: midiData
			}
		};

		this.plugin.wamInstance.audioNode.scheduleEvents(wamMidiEvent);
	}

	destroy() {
		if (this.plugin)
			this.plugin.destroy();

		super.destroy();
	}
}