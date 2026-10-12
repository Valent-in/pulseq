"use strict";

// Synth compatibility layer for WAMs
function WamSynth(outputNode) {

	this.out = {}; // Exclude from destroying
	this.out.outputNode = outputNode;

	this.isMuted = false;

	this.ampout = new Tone.Gain(1);
	this.ampout.connect(outputNode);


	this.values = {
		filterFreqValue: 0,
		filterQValue: 0,
		FXWetValue: 0,
	};

	this.setPlugin = function (plugin) {
		this.plugin = plugin;
		this.plugin.node.connect(this.ampout);
	}

	this.reconnect = function (newOutNode) {
		this.out.outputNode = newOutNode;
		if (this.isMuted)
			return;

		this.ampout.disconnect();
		this.ampout.connect(newOutNode);
	}


	let lastNote;


	this.triggerAttack = function (note, volumeMod, time, duration) {
		if (!this.plugin)
			return;

		lastNote = Tone.Frequency(note).toMidi();
		let velo = Math.round((100 + volumeMod) * 1.27);
		const midiData = [0x90, lastNote, velo];

		const wamMidiEvent = {
			type: "wam-midi",
			time: time,
			data: {
				bytes: midiData
			}
		};

		this.plugin.wamInstance.audioNode.scheduleEvents(wamMidiEvent);
	}

	this.triggerRelease = function (time) {
		if (!this.plugin)
			return;

		const midiData = [0x80, lastNote, 127];

		const wamMidiEvent = {
			type: "wam-midi",
			time: time,
			data: {
				bytes: midiData
			}
		};

		this.plugin.wamInstance.audioNode.scheduleEvents(wamMidiEvent);
	}

	this.glideTo = function (note, volumeMod, time, duration) { }
	this.filterSweep = function () { }
	this.fxSweep = function () { }
	this.resetFilter = function () { }
	this.resetPorta = function () { }

	this.destroy = function () {
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