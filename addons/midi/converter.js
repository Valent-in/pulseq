"use strict"

function Converter(songObj) {
	let onInnerStopCallback = null;

	this.exportMidi = (isOverlap, isExpand, velocityType) => {

		let schedulerData = {
			stepIndex: 0,
			barIndex: 0,
			swingedStep: false,
			queue: []
		};

		console.log("Export MIDI");
		let lSynths = [];

		let beatLength = 60 / songObj.bpm;


		for (let i = 0; i < songObj.synthParams.length; i++) {
			console.log(" MIDI SYNTH " + i);
			lSynths[i] = new MSynth(i);
		}

		let len = songObj.song.length * songObj.barSteps;
		console.log(len)

		let stepDuration = (60 / songObj.bpm) / 4;
		for (let i = 0; i < len; i++) {
			performSchedulerStep(schedulerData, lSynths, i * stepDuration, null, songObj.song.length);
		}

		function MSynth(index) {
			const track = new MidiWriter.Track();

			track.addEvent(new MidiWriter.InstrumentNameEvent({ text: songObj.synthNames[index] }));
			track.addEvent(new MidiWriter.TimeSignatureEvent(Math.round(songObj.barSteps / 4), 4));

			track.setTempo(songObj.bpm, 0);

			this.track = track;
			this.isEmpty = true;

			let lastNote;
			let lastTick = 0;
			let lastVelo = 0;
			let pitchRepeats = 0;

			this.triggerAttack = function (note, volumeMod, time, duration) {
				let tick = addTick(time);
				lastVelo = toVelocity(volumeMod);
				lastNote = note;

				let wait = "T" + (tick - lastTick);
				track.addEvent(new MidiWriter.NoteOnEvent({ pitch: note, wait: wait, velocity: lastVelo }));

				lastTick = tick;
				this.isEmpty = false;

				console.log("attack", note, tick, "time", time);
			}

			this.triggerRelease = function (time) {


				let tick = addTick(time);
				console.log("release", tick, "time", time);

				if (isExpand) {
					tick = Math.ceil(tick / 32) * 32;
					console.log("expand", tick);
				}

				let delta = tick - lastTick;
				console.log("delta", delta)

				track.addEvent(new MidiWriter.NoteOffEvent({ pitch: lastNote, delta: delta }));

				for (let i = 0; i < pitchRepeats; i++) {
					track.addEvent(new MidiWriter.NoteOffEvent({ pitch: lastNote, duration: "T0" }));
					console.log(" # close on release");
				}
				pitchRepeats = 0;

				lastTick = tick;
			}

			this.glideTo = function (note, volumeMod, time, duration) {
				let velo = toVelocity(volumeMod);

				if (note == lastNote && velo == lastVelo)
					return;

				let tick = addTick(time);
				let wait = "T" + (tick - lastTick);

				if (note == lastNote) {
					if (isOverlap) {
						track.addEvent(new MidiWriter.NoteOnEvent({ pitch: note, wait: wait, velocity: velo }));
						lastTick = tick;
						pitchRepeats++;
					}
				} else {
					if (isOverlap) {
						track.addEvent(new MidiWriter.NoteOnEvent({ pitch: note, wait: wait, velocity: velo }));
						track.addEvent(new MidiWriter.NoteOffEvent({ pitch: lastNote, delta: 3 }));

						for (let i = 0; i < pitchRepeats; i++) {
							track.addEvent(new MidiWriter.NoteOffEvent({ pitch: lastNote, duration: "T0" }));
							console.log(" # close on glide");
						}
						pitchRepeats = 0;

						lastTick = tick + 3;
					} else {
						track.addEvent(new MidiWriter.NoteOffEvent({ pitch: lastNote, delta: tick - lastTick }));
						track.addEvent(new MidiWriter.NoteOnEvent({ pitch: note, velocity: velo }));
						lastTick = tick;
					}
				}

				lastNote = note;
				lastVelo = velo;

				console.log("glide", note, time);
			}


			function addTick(time) {
				return Math.round((time / beatLength) * 128);
			}

			function toVelocity(volumeMod) {
				// range  1-100 instead of 0-127
				switch (velocityType) {
					case 0:
						let volume = (100 + volumeMod) / 100;
						let ret = Math.ceil((Math.exp(volume * 5.76) - 1) / 10 * 3.1611);
						return Math.min(ret, 100);
					case 1:
						return 100 + volumeMod;

					default:
						return 100;
				}
			}
		}

		let tracks = [];
		for (let i = 0; i < lSynths.length; i++) {
			let e = lSynths[i];
			if (e.isEmpty) {
				console.log("empty track >>", songObj.synthNames[i]);
			} else {
				tracks.push(e.track);
			}
		}
		const write = new MidiWriter.Writer(tracks);

		return write.dataUri()
	};


	function stopScheduler() {
		console.log("Something went wrong!");
	}


	function performSchedulerStep(data, synths, time, realtimeBarCallback, stopPoint) {
		if (data.stepIndex % songObj.barSteps == 0) {
			if (data.barIndex >= stopPoint) {

				if (realtimeBarCallback) {
					console.log("Song END");
					stopScheduler();
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

			if (note && synthIndex !== null) {
				let synth = synths[synthIndex];

				let attackTime = time;
				let lenCoef = lengths[stepIndex] / 100;
				let stepLen = (60 / songObj.bpm) / 4 - 0.001;
				let stopTime = time + lenCoef * stepLen;

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
};
