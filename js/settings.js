"use strict";

{
	// Application settings
	let appSettings;
	const settingsStorage = "pulseq-settings";

	window.getAppSettings = function (key) {
		if (appSettings)
			return appSettings[key];

		let str = localStorage.getItem(settingsStorage);
		if (!str) {
			console.log("No settings in storage. Requested " + key);
			return;
		}

		try {
			appSettings = JSON.parse(str);
		} catch {
			console.log("Can not parse settings from local storage");
			localStorage.removeItem(settingsStorage);
			appSettings = {};
		}

		return appSettings[key];
	}

	window.setAppSettings = function (key, value) {
		if (!appSettings)
			appSettings = {};

		appSettings[key] = value;
		localStorage.setItem(settingsStorage, JSON.stringify(appSettings));
	}
}

{
	// Set UI zoom on startup
	let zoom = getAppSettings("zoom");
	if (zoom)
		document.body.style.zoom = zoom + "%";
}

{
	let sampleRate = getAppSettings("samplerate");
	let latency = getAppSettings("latency");

	if (sampleRate || latency) {
		console.log("WARNING! Monkey-patching AudioContext constructor!");

		const OriginalContext = window.AudioContext || window.webkitAudioContext;

		window.AudioContext = function (options = {}) {
			let altOptions = { ...options };

			if (latency)
				altOptions.latencyHint = latency;

			if (sampleRate)
				altOptions.sampleRate = sampleRate;

			console.log("AudioContext options", altOptions)
			return new OriginalContext(altOptions);
		};

		window.AudioContext.prototype = OriginalContext.prototype;
	} else {
		console.log("No settings for AudioContext patching. Skipping.")
	}
}