"use strict";

// Fake synth constructor for MIDI export
function MidSynth(songObj, index, exportParams) {
    let { isExpand, isOverlap, velocityType } = exportParams;

    let track = [];
    this.track = track;

    let lastNote;
    let lastTick = 0;
    let lastVelo = 0;
    let pitchRepeats = 0;

    let barMarkerTick = 0;

    this.isEmpty = true;

    track.push({
        type: "trackName",
        deltaTime: 0,
        text: songObj.synthNames[index]
    });

    let denominator;
    switch (songObj.barSteps % 4) {
        case 0:
            denominator = 4;
            break;

        case 2:
            denominator = 8;
            break;

        default:
            denominator = 16;
    }

    let numerator = Math.round(songObj.barSteps * denominator / 16);

    track.push({
        type: "timeSignature",
        deltaTime: 0,
        numerator: numerator,
        denominator: denominator
    });

    let bps = songObj.bpm / 60;
    let mkspb = Math.round(1000000 / bps);
    track.push({
        type: "setTempo",
        deltaTime: 0,
        microsecondsPerBeat: mkspb
    });

    this.triggerAttack = function (note, volumeMod, time, duration) {
        let tick = getTick(time);
        lastVelo = toVelocity(volumeMod);
        lastNote = note;

        track.push(noteOn(note, tick - lastTick, lastVelo));

        lastTick = tick;
        this.isEmpty = false;
    }

    this.triggerRelease = function (time) {
        let tick = getTick(time);

        if (isExpand)
            tick = Math.ceil(tick / 32) * 32;

        track.push(noteOff(lastNote, tick - lastTick));

        for (let i = 0; i < pitchRepeats; i++)
            track.push(noteOff(lastNote, 0))
        pitchRepeats = 0;

        lastTick = tick;
    }

    this.glideTo = function (note, volumeMod, time, duration) {
        let velo = toVelocity(volumeMod);

        if (note == lastNote && velo == lastVelo)
            return;

        let tick = getTick(time);

        if (note == lastNote) {
            if (isOverlap) {
                track.push(noteOn(note, tick - lastTick, velo));
                lastTick = tick;
                pitchRepeats++;
            }
        } else {
            if (isOverlap) {
                track.push(noteOn(note, tick - lastTick, velo));
                track.push(noteOff(lastNote, 3));

                for (let i = 0; i < pitchRepeats; i++)
                    track.push(noteOff(lastNote, 0));
                pitchRepeats = 0;

                lastTick = tick + 3;
            } else {
                track.push(noteOff(lastNote, tick - lastTick));
                track.push(noteOn(note, 0, velo));
                lastTick = tick;
            }
        }

        lastNote = note;
        lastVelo = velo;
    }

    // Dummy
    this.filterSweep = function () { }

    this.setBarMarker = function (time) {
        if (barMarkerTick < lastTick)
            barMarkerTick = getTick(time);
    }

    this.finish = function () {
        if (barMarkerTick < lastTick)
            barMarkerTick = lastTick;

        track.push({ type: "endOfTrack", deltaTime: barMarkerTick - lastTick });
    }

    function noteOn(note, delta, velocity) {
        return {
            type: "noteOn",
            deltaTime: delta,
            noteNumber: Tone.Frequency(note).toMidi(),
            velocity: velocity
        }
    }

    function noteOff(note, delta, velocity) {
        return {
            type: "noteOff",
            deltaTime: delta,
            noteNumber: Tone.Frequency(note).toMidi()
        }
    }

    function getTick(time) {
        let beatLength = 60 / songObj.bpm;
        return Math.round((time / beatLength) * 128);
    }

    function toVelocity(volumeMod) {
        switch (velocityType) {
            case 0: // exponential
                let volume = (100 + volumeMod) / 100;
                let ret = Math.ceil((Math.exp(volume * 5.76) - 1) / 10 * 3.1611 * 1.27);
                return Math.min(ret, 127);

            case 1: // linear
                return Math.round((100 + volumeMod) * 1.27);

            default: // fixed value
                return 127;
        }
    }
}