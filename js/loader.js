"use strict";

const loader = {};

loader.loadSynth = function (synthParams, targetSynth) {
    let newParams = {};
    let paramCount = 0;

    let defaultState = DEFAULT_PARAMS.synthState;
    if (synthParams.pluginState) {
        newParams.pluginState = synthParams.pluginState;
        defaultState = DEFAULT_PARAMS.synthPluginState;
    }

    for (let key in defaultState) {
        if (key in synthParams) {
            newParams[key] = synthParams[key];
            paramCount++;
        } else {
            newParams[key] = defaultState[key];
        }
    }

    // Convert modulation envelope settings (previous versions)
    if (synthParams["synth-mod-envelope-state"] == "enabled") {
        newParams["synth-mod-envelope-type"] = "exponential";
    }

    if (synthParams["synth-mod-envelope-state"] == "lock") {
        newParams["synth-mod-envelope-type"] = "exponential";
        newParams["synth-mod-envelope-attack"] = newParams["synth-envelope-attack"];
        newParams["synth-mod-envelope-decay"] = newParams["synth-envelope-decay"];
        newParams["synth-mod-envelope-release"] = newParams["synth-envelope-release"];
        newParams["synth-mod-envelope-sustain"] = newParams["synth-envelope-sustain"];
    }

    // Convert modulation intensity
    for (let param in newParams) {
        if (newParams[param] == "envelopeModRev") {
            newParams[param] = "envelopeMod";
            let valueKey = param.replace("-input", "-value");
            newParams[valueKey] = -newParams[valueKey];
        }
    }

    for (let key in newParams) {
        synthParamApply(key, newParams[key], targetSynth);
    }

    if (paramCount == 0)
        showToast("Invalid synth config");

    return newParams;
}

loader.importSong = function (songObj, expObj, isOffline) {
    if (!expObj.songFormatVersion) {
        showAlert("Can not load data");
        return false;
    }

    if (Number(expObj.songFormatVersion) > Number(DEFAULT_PARAMS.fileFormatVersion))
        showAlert("WARNING:\nFile was created in more recent PulseQuaver version.");

    songObj.title = expObj.title || "";
    songObj.synthParams = [];
    songObj.synthNames = expObj.synthNames;

    songObj.synths.forEach(e => e.destroy());
    songObj.synths = [];

    songObj.bpm = expObj.bpm || 120;
    Tone.Transport.bpm.value = songObj.bpm;
    songObj.swing = expObj.swing || 0;

    songObj.barSteps = expObj.barSteps || 16;

    songObj.compressorThreshold = expObj.compressorThreshold || 0;
    songObj.compressorRatio = expObj.compressorRatio || 1;
    songObj.compressor.threshold.value = songObj.compressorThreshold;
    songObj.compressor.ratio.value = songObj.compressorRatio;

    if (isOffline) {
        songObj.synthParams = expObj.synthParams;
        for (let i = 0; i < expObj.synthParams.length; i++)
            songObj.synths.push({mute: function(isMuted) {this.isMuted = isMuted}});
    } else {
        for (let i = 0; i < expObj.synthParams.length; i++) {
            let synth;
            if (expObj.synthParams[i].pluginState)
                synth = new WamSynth(songObj.compressor, songObj.bpm);
            else
                synth = new Synth(songObj.compressor, songObj.bpm);

            songObj.synths.push(synth);
            let newParams = this.loadSynth(expObj.synthParams[i], songObj.synths[i]);
            songObj.synthParams.push(newParams);
        }
    }

    songObj.pluginStates = expObj.pluginStates || [];
    songObj.sends = expObj.sends || new Array(songObj.synths.length).fill(null);

    if (!isOffline)
        songObj.restorePlugins();

    songObj.patterns = [];
    for (let i = 0; i < expObj.patterns.length; i++) {
        let ptrn = new Pattern(expObj.patternNames[i]);
        ptrn.patternData = expObj.patterns[i];

        // Create automation if file does not contain it
        ptrn.patternData.forEach(e => {
            if (!e.filtQ) {
                e.filtQ = [];
                e.filtF = [];
            }

            if (!e.fxWet) {
                e.fxWet = [];
            }
        });

        if (expObj.patternLengths)
            ptrn.length = expObj.patternLengths[i];

        if (expObj.patternColors)
            ptrn.colorIndex = expObj.patternColors[i];

        songObj.patterns.push(ptrn);
    }

    songObj.song = expObj.song;

    if (expObj.appState) {
        console.log("Restoring app state");
        let appState = expObj.appState;
        songObj.setCurrentPattern(appState.activePattern || 0);
        songObj.arrangeStartPoint = appState.startPoint || 0;
        songObj.currentSynthIndex = appState.activeSynth || 0;

        for (let i = 0; i < songObj.synths.length; i++)
            songObj.synths[i].mute(appState.muteStatus[i]);

    } else {
        songObj.setCurrentPattern(0);
        songObj.arrangeStartPoint = 0;
        songObj.currentSynthIndex = 0;
    }

    songObj.calculateSynthFill();

    return true;
}

loader.exportSong = function (songObj, isCleanup, selectors) {
    let expObj = {};

    expObj.songFormatVersion = DEFAULT_PARAMS.fileFormatVersion;

    if (isCleanup) {
        expObj.synthParams = [];
        for (let i = 0; i < songObj.synthParams.length; i++)
            expObj.synthParams.push(songObj.getCleanSynthParams(i))
    } else {
        expObj.synthParams = songObj.synthParams;

        let appState = {};
        appState.activePattern = songObj.currentPatternIndex;
        appState.activeSynth = songObj.currentSynthIndex;
        appState.startPoint = songObj.arrangeStartPoint;
        appState.rootIndex = selectors.selectRoot;
        appState.scaleIndex = selectors.selectScale;

        appState.muteStatus = [];
        songObj.synths.forEach(e => { appState.muteStatus.push(e.isMuted) });

        expObj.appState = appState;
    }

    expObj.synthNames = songObj.synthNames;
    expObj.song = songObj.song;
    expObj.patterns = [];
    expObj.patternLengths = [];
    expObj.patternNames = [];
    expObj.patternColors = [];
    expObj.compressorThreshold = songObj.compressorThreshold;
    expObj.compressorRatio = songObj.compressorRatio;
    expObj.bpm = songObj.bpm;
    expObj.barSteps = songObj.barSteps;
    expObj.title = songObj.title;
    expObj.swing = songObj.swing;

    expObj.pluginStates = songObj.pluginStates;
    expObj.sends = songObj.sends;

    for (let i = 0; i < songObj.patterns.length; i++) {
        expObj.patterns.push(songObj.patterns[i].patternData);
        expObj.patternLengths.push(songObj.patterns[i].length);
        expObj.patternNames.push(songObj.patterns[i].name);
        expObj.patternColors.push(songObj.patterns[i].colorIndex);
    }

    return JSON.stringify(expObj, null, isCleanup ? 1 : 0);
}