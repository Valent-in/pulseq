"use strict";

// Synth compatibility layer for WAMs
class WamSynth extends SynthProto {
	constructor(outputNode, transportBPM) {
		super(outputNode, transportBPM);
		this._overlap = 128 / Tone.context.sampleRate;
	}

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
		let velocity = Math.round((100 + volumeMod) * 1.27);

		const wamMidiEvent = {
			type: "wam-midi",
			time: time,
			data: { bytes: [0x90, this.lastNote, velocity] }
		};

		this.plugin.wamInstance.audioNode.scheduleEvents(wamMidiEvent);
	}

	_release(time, note) {
		let offNote = Tone.Frequency(note).toMidi();

		const wamMidiEvent = {
			type: "wam-midi",
			time: time,
			data: { bytes: [0x80, offNote, 127] }
		};

		this.plugin.wamInstance.audioNode.scheduleEvents(wamMidiEvent);
	}

	_releaseAll(time) {
		time = time || Tone.now();
		for (let note of DEFAULT_PARAMS.noteSet)
			this._release(time, note);

		const wamMidiEvent = {
			type: "wam-midi",
			time: time,
			data: { bytes: [0xB0, 123, 0] }
		};

		this.plugin.wamInstance.audioNode.scheduleEvents(wamMidiEvent);
	}

	triggerRelease(time, note) {
		if (!this.plugin)
			return;

		if (note)
			this._release(time, note);
		else
			this._releaseAll(time);
	}

	glideTo(note, volumeMod, time, duration, noteFrom) {
		if (note == noteFrom)
			return;

		this.triggerAttack(note, volumeMod, time, duration);
		this.triggerRelease(time + this._overlap, noteFrom);
	}

	destroy() {
		if (this.plugin)
			this.plugin.destroy();

		super.destroy();
	}
}