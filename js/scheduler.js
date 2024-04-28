"use strict";

function Scheduler(songObj, barCallback, stepCallback) {
	Tone.Transport.bpm.value = songObj.bpm;

	let isPlaying = false;
	let isPatternPlaying = false;
	let onInnerStopCallback = null;
	let schedulerId = null;

	this.stop = () => {
		stop();

		if (onInnerStopCallback) {
			onInnerStopCallback();
			onInnerStopCallback = null;
		}
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
		if (isPlaying) {
			stop();
			return false;
		} else {
			onInnerStopCallback = callback;
			this.playSong();
			return true;
		}
	}

	this.playStopPattern = (callback) => {
		if (isPlaying || !songObj.currentPattern) {
			stop();
			return false;
		} else {
			onInnerStopCallback = callback;
			this.playPattern();
			return true;
		}
	}

	this.renderSong = (renderLength) => {
		this.stop();

		let schedulerData = {
			stepIndex: 0,
			barIndex: 0,
			swingedStep: false,
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

				performSchedulerStep(schedulerData, lSynths, time, null, songObj.song.length);
			}, "16n");

			transport.bpm.value = songObj.bpm;
			transport.start(0.2);

		}, renderLength);
	};

	this.exportMidiSequence = (isOverlap, isExpand, velocityType) => {
		console.log("Export MIDI");

		let lSynths = [];
		for (let i = 0; i < songObj.synthParams.length; i++)
			lSynths[i] = new MidSynth(songObj, i, { isOverlap, isExpand, velocityType });

		let schedulerData = {
			stepIndex: 0,
			barIndex: 0,
			swingedStep: false,
			queue: []
		};

		let len = songObj.song.length * songObj.barSteps;
		let stepDuration = (60 / songObj.bpm) / 4;

		for (let i = 0; i < len; i++) {
			performSchedulerStep(schedulerData, lSynths, i * stepDuration, null, songObj.song.length);

			if (i % songObj.barSteps == 0)
				lSynths.forEach((e) => { e.setBarMarker(i * stepDuration) });
		}

		let tracks = [];
		for (let i = 0; i < lSynths.length; i++) {
			let e = lSynths[i];
			if (e.isEmpty) {
				console.log("empty track >>", songObj.synthNames[i]);
			} else {
				e.finish();
				tracks.push(e.track);
			}
		}

		return { tracks };
	};

	function stop() {
		if (!isPlaying)
			return;

		if (schedulerId !== null) {
			Tone.Transport.clear(schedulerId);
			schedulerId = null;
		}
		Tone.Transport.cancel(Tone.now());
		Tone.Transport.stop(Tone.now());

		isPlaying = false;
		isPatternPlaying = false;
		console.log("STOP Playback");

		scheduleCall(stepCallback, -1, Tone.now());
		scheduleCall(barCallback, -1, Tone.now());

		for (let i = 0; i < songObj.synths.length; i++)
			songObj.synths[i].triggerRelease(Tone.now());
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
		let isSwingedStep = false;

		schedulerId = Tone.Transport.scheduleRepeat(function (time) {
			if (!synced) {
				syncLfos(songObj.synths, time);
				synced = true;
			}

			playPatternStep(sequenceIndex, songObj.currentPattern, songObj.synths, time, isSwingedStep);
			isSwingedStep = !isSwingedStep;

			scheduleCall(stepCallback, sequenceIndex, time);

			sequenceIndex++;
			if (sequenceIndex >= songObj.currentPattern.length)
				sequenceIndex = 0;

			if (sequenceIndex % songObj.barSteps == 0)
				isSwingedStep = false;
		}, "16n");
	}

	function scheduleSong() {
		let schedulerData = {
			stepIndex: 0,
			barIndex: songObj.arrangeStartPoint,
			swingedStep: false,
			queue: []
		};
		let synced = false;

		schedulerId = Tone.Transport.scheduleRepeat(function (time) {
			if (!synced) {
				syncLfos(songObj.synths, time);
				synced = true;
			}

			performSchedulerStep(schedulerData, songObj.synths, time, barCallback, songObj.playableLength + 1);
		}, "16n");
	}

	function scheduleLoop(steps) {
		let startPoint = songObj.arrangeStartPoint;
		let schedulerData = {
			stepIndex: 0,
			barIndex: startPoint,
			swingedStep: false,
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

			performSchedulerStep(schedulerData, songObj.synths, time, barCallback, songObj.song.length);
		}, "16n");
	}

	function performSchedulerStep(data, synths, time, realtimeBarCallback, stopPoint) {
		if (data.stepIndex % songObj.barSteps == 0) {
			if (data.barIndex >= stopPoint) {

				if (realtimeBarCallback) {
					console.log("Song END");
					stop();
					if (onInnerStopCallback) {
						onInnerStopCallback();
						onInnerStopCallback = null;
					}
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
			data.swingedStep = false;
		}

		for (let i = 0; i < data.queue.length; i++) {
			let stepIndex = data.queue[i].index;
			let pind = data.queue[i].pattern;
			let pattern = songObj.patterns[pind];

			playPatternStep(stepIndex, pattern, synths, time, data.swingedStep);
			data.queue[i].index++;
		}

		for (let i = data.queue.length - 1; i >= 0; i--) {
			if (songObj.patterns[data.queue[i].pattern].length <= data.queue[i].index)
				data.queue.splice(i, 1);
		}

		data.stepIndex++;
		data.swingedStep = !data.swingedStep;
	}

	function playPatternStep(stepIndex, pattern, synths, time, isSwingedStep) {
		for (let j = 0; j < pattern.patternData.length; j++) {
			let notes = pattern.patternData[j].notes;
			let lengths = pattern.patternData[j].lengths;
			let note = notes[stepIndex];
			let volume = pattern.patternData[j].volumes[stepIndex];
			let synthIndex = pattern.patternData[j].synthIndex;

			let filterF = pattern.patternData[j].filtF[stepIndex];
			let filterQ = pattern.patternData[j].filtQ[stepIndex];

			if (synthIndex !== null) {
				let synth = synths[synthIndex];

				let attackTime = time;
				let lenCoef = lengths[stepIndex] / 100;
				let stepLen = (60 / songObj.bpm) / 4 - 0.001;
				let stopTime = time + lenCoef * stepLen;

				synth.filterSweep(filterF, filterQ, time, stepLen);

				if (!note)
					continue;

				if (songObj.swing && isSwingedStep) {
					attackTime = time + stepLen * songObj.swing / 200;
					stopTime = Math.min(attackTime + lenCoef * stepLen, time + stepLen);
				}

				if (stepIndex > 0 && lengths[stepIndex - 1] >= 100)
					synth.glideTo(note, volume, time, stepLen)
				else
					synth.triggerAttack(note, volume, attackTime, stepLen);

				if (lengths[stepIndex] < 100 || stepIndex == pattern.length - 1 || !notes[stepIndex + 1])
					synth.triggerRelease(stopTime);
			}
		}
	}
}