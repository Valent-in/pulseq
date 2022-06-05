"use strict"

function Scheduler(songObj) {
	Tone.Transport.bpm.value = songObj.bpm;

	let isPlaying = false;

	this.stop = function () {
		if (!isPlaying)
			return;

		Tone.Transport.stop();
		Tone.Transport.cancel();
		isPlaying = false;
		console.log("STOP Playback");

		for (let i = 0; i < songObj.synths.length; i++)
			songObj.synths[i].triggerRelease();
	}

	this.playSong = () => {
		this.stop();

		isPlaying = true;
		scheduleSong();
		Tone.Transport.start();
		console.log("Play SONG");
	}

	this.playPattern = () => {
		this.stop();

		isPlaying = true;
		schedulePattern();
		Tone.Transport.start();
		console.log("Play PATTERN");
	}

	this.renderSong = (renderLength) => {
		this.stop();

		let schedulerData = {
			stepIndex: 0,
			barIndex: 0,
			queue: []
		};

		console.log("Render SONG: " + length + "sec.");
		let lSynths = [];

		// Promise
		return Tone.Offline(({ transport }) => {
			let compressor = new Tone.Compressor(songObj.compressorThreshold, songObj.compressorRatio);
			compressor.toDestination();

			for (let i = 0; i < songObj.synthParams.length; i++) {
				console.log(" >> >> Offline synth " + i);
				lSynths[i] = new Synth(compressor, songObj.bpm);

				for (let key in songObj.synthParams[i])
					synthParamApply(key, songObj.synthParams[i][key], lSynths[i]);
			}

			let synced = false;
			transport.scheduleRepeat(function (time) {
				if (!synced) {
					syncLfos(lSynths, time);
					synced = true;
				}

				performSchedulerStep(schedulerData, lSynths, time);
			}, "16n");

			transport.bpm.value = songObj.bpm;
			transport.start(0.2);

		}, renderLength);
	};

	function syncLfos(synths, time) {
		for (let i = 0; i < synths.length; i++) {
			if (synths[i].lfo1) {
				synths[i].lfo1.stop(time);
				synths[i].lfo1.start(time);
			}
		}
	}

	function schedulePattern() {
		let sequenceIndex = 0;
		let synced = false;

		Tone.Transport.scheduleRepeat(function (time) {
			if (!synced) {
				syncLfos(songObj.synths, time);
				synced = true;
			}

			playPatternStep(sequenceIndex, songObj.currentPattern, songObj.synths, time);

			sequenceIndex++;
			if (sequenceIndex >= songObj.currentPattern.length)
				sequenceIndex = 0;
		}, "16n");
	}

	function scheduleSong() {
		let schedulerData = {
			stepIndex: 0,
			barIndex: songObj.arrangeStartPoint,
			queue: []
		};
		let synced = false;

		Tone.Transport.scheduleRepeat(function (time) {
			if (!synced) {
				syncLfos(songObj.synths, time);
				synced = true;
			}

			performSchedulerStep(schedulerData, songObj.synths, time);
		}, "16n");
	}

	function performSchedulerStep(data, synths, time) {
		if (data.stepIndex % 16 == 0 && songObj.song[data.barIndex]) {
			for (let i = 0; i < songObj.song[data.barIndex].length; i++) {
				if (songObj.song[data.barIndex][i])
					data.queue.push({ pattern: i, index: 0 });
			}
			data.barIndex++;
		}

		for (let i = 0; i < data.queue.length; i++) {
			let stepIndex = data.queue[i].index;
			let pind = data.queue[i].pattern;
			let pattern = songObj.patterns[pind];

			playPatternStep(stepIndex, pattern, synths, time);
			data.queue[i].index++;
		}

		for (let i = data.queue.length - 1; i >= 0; i--) {
			if (songObj.patterns[data.queue[i].pattern].length <= data.queue[i].index)
				data.queue.splice(i, 1);
		}

		data.stepIndex++
	}

	function playPatternStep(stepIndex, pattern, synths, time) {
		for (let j = 0; j < pattern.patternData.length; j++) {
			let notes = pattern.patternData[j].notes;
			let lengths = pattern.patternData[j].lengths;
			let note = notes[stepIndex];
			let synthIndex = pattern.patternData[j].synthIndex;

			if (note && synthIndex !== null) {
				let synth = synths[synthIndex];

				let lenCoef = lengths[stepIndex] / 100;
				let stepLen = (60 / songObj.bpm) / 4;

				if (stepIndex > 0 && lengths[stepIndex - 1] > 100)
					synth.glideTo(note, time, stepLen)
				else
					synth.triggerAttack(note, time);

				let stopTime = time + lenCoef * stepLen - 0.001;

				if (lengths[stepIndex] <= 100 || stepIndex == pattern.length - 1 || !notes[stepIndex + 1])
					synth.triggerRelease(stopTime);
			}
		}
	}
};
