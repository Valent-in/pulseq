// https://www.russellgood.com/how-to-convert-audiobuffer-to-audio-file/

function bufferToWave(abuffer, len) {
	var numOfChan = abuffer.numberOfChannels,
		length = len * numOfChan * 2 + 44,
		buffer = new ArrayBuffer(length),
		view = new DataView(buffer),
		channels = [], i, sample,
		offset = 0,
		pos = 0;

	setUint32(0x46464952);
	setUint32(length - 8);
	setUint32(0x45564157);

	setUint32(0x20746d66);
	setUint32(16);
	setUint16(1);
	setUint16(numOfChan);
	setUint32(abuffer.sampleRate);
	setUint32(abuffer.sampleRate * 2 * numOfChan);
	setUint16(numOfChan * 2);
	setUint16(16);

	setUint32(0x61746164);
	setUint32(length - pos - 4);

	for (i = 0; i < abuffer.numberOfChannels; i++)
		channels.push(abuffer.getChannelData(i));

	while (pos < length) {
		for (i = 0; i < numOfChan; i++) {
			sample = Math.max(-1, Math.min(1, channels[i][offset]));
			sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
			view.setInt16(pos, sample, true);
			pos += 2;
		}
		offset++
	}

	return new Blob([buffer], { type: "audio/wav" });

	function setUint16(data) {
		view.setUint16(pos, data, true);
		pos += 2;
	}

	function setUint32(data) {
		view.setUint32(pos, data, true);
		pos += 4;
	}
}