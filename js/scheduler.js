"use strict"

function Scheduler(songObj, barCallback, stepCallback) {
	Tone.Transport.bpm.value = songObj.bpm;

	let isPlaying = false;
	let isPatternPlaying = false;
	let onInnerStopCallback = null;
	let schedulerId = null;

	this.stop = () => {
		stop();
	}

	this.playSong = () => {
		stop();

		isPlaying = true;
		isPatternPlaying = false;
		scheduleSong();
		Tone.Transport.start();
		console.log("Play SONG");
	}

	this.playLoop = (callback, barsInLoop) => {
		stop();

		onInnerStopCallback = callback;

		isPlaying = true;
		isPatternPlaying = false;
		scheduleLoop(barsInLoop * songObj.barSteps);
		Tone.Transport.start();
		console.log("Play LOOP");

		return songObj.arrangeStartPoint;
	}

	this.playPattern = () => {
		stop();

		isPlaying = true;
		isPatternPlaying = true;
		schedulePattern();
		Tone.Transport.start();
		console.log("Play PATTERN");
	}

	this.release = () => {
		for (let i = 0; i < songObj.synths.length; i++)
			songObj.synths[i].triggerRelease();
	}

	this.releasePattern = () => {
		if (isPatternPlaying)
			this.release();
	}

	this.playStopSong = (callback) => {
		onInnerStopCallback = callback;

		if (isPlaying) {
			stop();
			return false;
		} else {
			this.playSong();
			return true;
		}
	}

	this.playStopPattern = (callback) => {
		onInnerStopCallback = callback;

		if (isPlaying || !songObj.currentPattern) {
			stop();
			return false;
		} else {
			this.playPattern();
			return true;
		}
	}

	this.renderSong = (renderLength) => {
		stop();

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
				lSynths[i].mute(songObj.synths[i].isMuted);

				for (let key in songObj.synthParams[i])
					synthParamApply(key, songObj.synthParams[i][key], lSynths[i]);
			}

			let synced = false;
			transport.scheduleRepeat(function (time) {
				if (!synced) {
					syncLfos(lSynths, time);
					synced = true;
				}

				performSchedulerStep(schedulerData, lSynths, time, null);
			}, "16n");

			transport.bpm.value = songObj.bpm;
			transport.start(0.2);

		}, renderLength);
	};

	function stop() {
		if (!isPlaying)
			return;

		if (schedulerId !== null) {
			Tone.Transport.clear(schedulerId);
			schedulerId = null;
		}
		Tone.Transport.cancel();
		Tone.Transport.stop();

		isPlaying = false;
		isPatternPlaying = false;
		console.log("STOP Playback");

		scheduleCall(stepCallback, -1, Tone.now());
		scheduleCall(barCallback, -1, Tone.now());

		for (let i = 0; i < songObj.synths.length; i++)
			songObj.synths[i].triggerRelease();
	}

	function syncLfos(synths, time) {
		for (let synth of synths) {
			if (synth.lfo1) {
				synth.lfo1.stop(time);
				synth.lfo1.start(time);
			}

			if (synth.lfo2) {
				synth.lfo2.stop(time);
				synth.lfo2.start(time);
			}
		}
	}

	function scheduleCall(callback, param, time) {
		Tone.Draw.schedule(() => { callback(param) }, time)
	}

	function schedulePattern() {
		let sequenceIndex = 0;
		let synced = false;

		schedulerId = Tone.Transport.scheduleRepeat(function (time) {
			if (!synced) {
				syncLfos(songObj.synths, time);
				synced = true;
			}

			playPatternStep(sequenceIndex, songObj.currentPattern, songObj.synths, time);

			scheduleCall(stepCallback, sequenceIndex, time);

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

		schedulerId = Tone.Transport.scheduleRepeat(function (time) {
			if (!synced) {
				syncLfos(songObj.synths, time);
				synced = true;
			}

			performSchedulerStep(schedulerData, songObj.synths, time, barCallback);
		}, "16n");
	}

	function scheduleLoop(steps) {
		let startPoint = songObj.arrangeStartPoint;
		let schedulerData = {
			stepIndex: 0,
			barIndex: startPoint,
			queue: []
		};
		let synced = false;

		schedulerId = Tone.Transport.scheduleRepeat(function (time) {
			if (!synced) {
				syncLfos(songObj.synths, time);
				synced = true;
			}

			if (schedulerData.stepIndex >= steps) {
				schedulerData.stepIndex = 0;
				schedulerData.barIndex = startPoint;
				schedulerData.queue = [];
				for (let i = 0; i < songObj.synths.length; i++)
					songObj.synths[i].triggerRelease(time);
			}

			performSchedulerStep(schedulerData, songObj.synths, time, barCallback);
		}, "16n");
	}

	function performSchedulerStep(data, synths, time, realtimeBarCallback) {
		if (data.stepIndex % songObj.barSteps == 0) {
			if (data.barIndex >= songObj.song.length) {

				if (realtimeBarCallback) {
					console.log("Song END");
					stop();
					if (onInnerStopCallback)
						onInnerStopCallback();
				}

				return;
			}

			if (realtimeBarCallback)
				scheduleCall(realtimeBarCallback, data.barIndex, time);

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
			let volume = pattern.patternData[j].volumes[stepIndex];
			let synthIndex = pattern.patternData[j].synthIndex;

			if (note && synthIndex !== null) {
				let synth = synths[synthIndex];

				let lenCoef = lengths[stepIndex] / 100;
				let stepLen = (60 / songObj.bpm) / 4 - 0.001;

				if (stepIndex > 0 && lengths[stepIndex - 1] >= 100)
					synth.glideTo(note, volume, time, stepLen)
				else
					synth.triggerAttack(note, volume, time, stepLen);

				let stopTime = time + lenCoef * stepLen;

				if (lengths[stepIndex] < 100 || stepIndex == pattern.length - 1 || !notes[stepIndex + 1])
					synth.triggerRelease(stopTime);
			}
		}
	}
};
