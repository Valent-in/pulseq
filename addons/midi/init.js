"use strict"

function Synth() {
	//dummy
	this.destroy = function () { };
}

const Tone = {
	//dummy
	Compressor: function () {
		this.toDestination = function () { };
	}
}

const songObj = new SongObject();
const converter = new Converter(songObj);

let optionsView = document.getElementById("convert-options");
let midi = document.getElementById("midi-download");

let exportGlide = document.getElementById("export-glide");
let exportExpand = document.getElementById("export-expand");
let exportVelocity = document.getElementById("velocity-scale");

midi.onclick = () => {
	midi.href = converter.exportMidi(
		exportGlide.checked,
		exportExpand.checked,
		exportVelocity.selectedIndex
	);
	midi.download = (songObj.title || "export") + ".mid";
}

let importTrackInput = document.getElementById("input-import-track");
importTrackInput.onchange = (e) => {
	let file = e.target.files[0];
	if (!file)
		return;

	let reader = new FileReader();
	reader.onload = function (ev) {
		let songStr = ev.target.result;
		if (importSong(songStr)) {
			optionsView.style.display = "block";
		} else {
			optionsView.style.display = "none";
		}
	};
	reader.readAsText(file);
}

function importSong(songStr) {
	let expObj;
	try {
		expObj = JSON.parse(songStr);
	} catch {
		alert("JSON parsing error");
		return false;
	}

	if (!expObj.songFormatVersion) {
		alert("Can not load data");
		return false;
	}

	songObj.title = expObj.title || "";
	songObj.synthParams = [];
	songObj.synthNames = expObj.synthNames;

	songObj.synths.forEach(e => e.destroy());
	songObj.synths = [];

	songObj.bpm = expObj.bpm || 120;
	//Tone.Transport.bpm.value = songObj.bpm;
	songObj.swing = expObj.swing || 0;

	songObj.barSteps = expObj.barSteps || 16;

	songObj.compressorThreshold = expObj.compressorThreshold || 0;
	songObj.compressorRatio = expObj.compressorRatio || 1;
	//songObj.compressor.threshold.value = songObj.compressorThreshold;
	//songObj.compressor.ratio.value = songObj.compressorRatio;

	for (let i = 0; i < expObj.synthParams.length; i++) {
		let synth = new Synth(songObj.compressor, songObj.bpm);
		songObj.synths.push(synth);
		//let newParams = loadSynthCallback(expObj.synthParams[i], songObj.synths[i]);
		//songObj.synthParams.push(newParams);
		songObj.synthParams.push({});
	}

	songObj.patterns = [];
	for (let i = 0; i < expObj.patterns.length; i++) {
		let ptrn = new Pattern(expObj.patternNames[i]);
		ptrn.patternData = expObj.patterns[i];

		if (expObj.patternLengths)
			ptrn.length = expObj.patternLengths[i];

		if (expObj.patternColors)
			ptrn.colorIndex = expObj.patternColors[i];

		songObj.patterns.push(ptrn);
	}

	songObj.song = expObj.song;
	songObj.setCurrentPattern(0);
	songObj.arrangeStartPoint = 0;
	//onSongChangeCallback(true);
	showSongTitle();

	if (songObj.calculateSynthFill() > 0)
		alert("WARNING: Patterns overlap in imported file!");

	return true;
}

function showSongTitle() {
	let titlespan = document.getElementById("song-title");
	titlespan.textContent = songObj.title;
}