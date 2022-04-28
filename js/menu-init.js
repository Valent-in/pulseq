function menuInit(songObj, onSongLoadCallback, loadSynthCallback, showSequenceCallback, renderCallback) {

    let rngComprThreshold = document.getElementById("compressor-threshold");
    rngComprThreshold.value = songObj.comprThreshold;
    rngComprThreshold.addEventListener("change", (event) => {
        let value = event.target.value;

        songObj.comprThreshold = value;
        songObj.compressor.threshold.value = value;
    });

    let rngComprRatio = document.getElementById("compressor-ratio");
    rngComprRatio.value = songObj.comprRatio;
    rngComprRatio.addEventListener("change", (event) => {
        let value = event.target.value;

        songObj.comprRatio = value;
        songObj.compressor.ratio.value = value;
    });

    let btnExportSong = document.getElementById("button-export-song");
    btnExportSong.addEventListener("click", () => {
        let outText = document.getElementById("export-data");
        let expObj = {};

        expObj.synthParams = songObj.synthParams;
        expObj.synthNames = songObj.synthNames;
        expObj.song = songObj.song;
        expObj.patterns = [];
        expObj.patternLengths = [];
        expObj.comprThreshold = songObj.comprThreshold;
        expObj.comprRatio = songObj.comprRatio;
        expObj.bpm = songObj.bpm;

        for (let i = 0; i < songObj.patterns.length; i++) {
            expObj.patterns.push(songObj.patterns[i].patternData);
            expObj.patternLengths.push(songObj.patterns[i].length);
        }

        outText.value = JSON.stringify(expObj, null, 1);
    });


    let btnImportSong = document.getElementById("button-import-song");
    btnImportSong.addEventListener("click", () => {
        let outText = document.getElementById("export-data");
        let expObj = JSON.parse(outText.value);

        songObj.synthParams = expObj.synthParams;
        songObj.synthNames = expObj.synthNames;

        songObj.synths.forEach(e => e.destroy());
        songObj.synths = [];

        songObj.bpm = expObj.bpm || 120;
        Tone.Transport.bpm.value = songObj.bpm;
        document.getElementById("bpm-value").value = songObj.bpm;

        songObj.comprThreshold = expObj.comprThreshold || 0;
        songObj.comprRatio = expObj.comprRatio || 1;
        songObj.compressor.threshold.value = songObj.comprThreshold;
        songObj.compressor.ratio.value = songObj.comprRatio;
        rngComprThreshold.value = songObj.comprThreshold;
        rngComprRatio.value = songObj.comprRatio;

        for (let i = 0; i < songObj.synthParams.length; i++) {
            let synth = new Synth(songObj.compressor);
            songObj.synths.push(synth);
            loadSynthCallback(songObj.synthParams[i], songObj.synths[i]);
        }

        songObj.patterns = [];
        for (let i = 0; i < expObj.patterns.length; i++) {
            let ptrn = new Pattern();
            ptrn.patternData = expObj.patterns[i];

            if (expObj.patternLengths)
                ptrn.length = expObj.patternLengths[i];

            songObj.patterns.push(ptrn);
        }

        //clearSongView();
        songObj.song = expObj.song;
        onSongLoadCallback();
    });

    let btnExportPattern = document.getElementById("button-export-pattern");
    btnExportPattern.addEventListener("click", () => {
        let text = document.getElementById("export-data");
        let expObj = {
            notes: songObj.currentPattern.patternData[songObj.currentPattern.activeIndex].notes,
            lengths: songObj.currentPattern.patternData[songObj.currentPattern.activeIndex].lengths
        };
        text.value = JSON.stringify(expObj, null, 1);
    });

    let btnImportPattern = document.getElementById("button-import-pattern");
    btnImportPattern.addEventListener("click", () => {
        let text = document.getElementById("export-data");
        let data = JSON.parse(text.value);

        songObj.currentPattern.patternData[songObj.currentPattern.activeIndex].notes = data.notes;
        songObj.currentPattern.patternData[songObj.currentPattern.activeIndex].lengths = data.lengths;
        showSequenceCallback(songObj.currentPattern);
    });

    let btnExportFullPattern = document.getElementById("button-export-full-pattern");
    btnExportFullPattern.addEventListener("click", () => {
        let text = document.getElementById("export-data");
        text.value = JSON.stringify(songObj.currentPattern.patternData, null, 1);
    });

    let btnImportFullPattern = document.getElementById("button-import-full-pattern");
    btnImportFullPattern.addEventListener("click", () => {
        let text = document.getElementById("export-data");
        let data = JSON.parse(text.value);

        songObj.currentPattern.patternData = data;
        //sequencer.importData(data);
    });

    let btnSetBpm = document.getElementById("button-set-bpm");
    btnSetBpm.addEventListener("click", () => {
        let bpmValue = document.getElementById("bpm-value").value;
        songObj.bpm = Number(bpmValue);
        Tone.Transport.bpm.value = songObj.bpm;
    });

    let renderLength = 5;
    let renderBtn = document.getElementById("render");
    renderBtn.addEventListener("click", () => {
        let renderLengthInput = document.getElementById("render-length");
        renderLength = Number(renderLengthInput.value) || 5;

        let timer = new Date();
        renderCallback(renderLength).then(buffer => {
            // check offline render time
            let renderTime = Date.now() - timer;

            let player = new Tone.Player(buffer).toDestination();
            player.start();
            console.log(buffer.length);

            let expData = bufferToWave(buffer, buffer.length);

            // check convert time
            let convertTime = Date.now() - timer - renderTime;
            console.log("render time: " + (renderTime / 1000).toFixed(2) + "  convert time: " + (convertTime / 1000).toFixed(2) + "  total: " + ((Date.now() - timer) / 1000).toFixed(2));

            var new_file = URL.createObjectURL(expData);

            var download_link = document.getElementById("download_link");
            download_link.href = new_file;
            download_link.download = "export.wav";
        })
    });

    function bufferToWave(abuffer, len) {
        var numOfChan = abuffer.numberOfChannels,
            length = len * numOfChan * 2 + 44,
            buffer = new ArrayBuffer(length),
            view = new DataView(buffer),
            channels = [], i, sample,
            offset = 0,
            pos = 0;

        // write WAVE header
        setUint32(0x46464952);                         // "RIFF"
        setUint32(length - 8);                         // file length - 8
        setUint32(0x45564157);                         // "WAVE"

        setUint32(0x20746d66);                         // "fmt " chunk
        setUint32(16);                                 // length = 16
        setUint16(1);                                  // PCM (uncompressed)
        setUint16(numOfChan);
        setUint32(abuffer.sampleRate);
        setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
        setUint16(numOfChan * 2);                      // block-align
        setUint16(16);                                 // 16-bit (hardcoded in this demo)

        setUint32(0x61746164);                         // "data" - chunk
        setUint32(length - pos - 4);                   // chunk length

        // write interleaved data
        for (i = 0; i < abuffer.numberOfChannels; i++)
            channels.push(abuffer.getChannelData(i));

        while (pos < length) {
            for (i = 0; i < numOfChan; i++) {             // interleave channels
                sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
                sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
                view.setInt16(pos, sample, true);          // write 16-bit sample
                pos += 2;
            }
            offset++                                     // next source sample
        }

        // create Blob
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
}