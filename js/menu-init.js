function menuInit(songObj, onSongChangeCallback, loadSynthCallback, showSequenceCallback, renderCallback) {

    let isCreateNewLayer = false;
    document.getElementById("button-add-pattern-layer").onclick = () => {
        isCreateNewLayer = true;
        showSynthSelectList();
    };

    /*
     * Arrange modal menu
     */
    document.getElementById("button-arrange-menu-open").onclick = () => {
        let menu = document.getElementById("arrange-modal-menu");
        menu.classList.remove("modal-hidden");

        document.getElementById("input-song-title").value = songObj.title;
        document.getElementById("input-bpm-value").value = songObj.bpm;
        document.getElementById("range-compressor-threshold").value = -songObj.compressorThreshold;
        document.getElementById("range-compressor-ratio").value = songObj.compressorRatio;
    };

    document.getElementById("input-song-title").onchange = (event) => {
        let value = event.target.value;
        songObj.title = value;
        showSongTitle();
    };

    document.getElementById("button-bpm-set").onclick = () => {
        let bpmValue = document.getElementById("input-bpm-value").value;
        songObj.bpm = Number(bpmValue);
        Tone.Transport.bpm.value = songObj.bpm;
        songObj.synths.forEach(e => e.setBpm(songObj.bpm));
    };

    document.getElementById("range-compressor-threshold").onchange = (event) => {
        let value = -event.target.value;
        songObj.compressorThreshold = value;
        songObj.compressor.threshold.value = value;
    };

    document.getElementById("range-compressor-ratio").onchange = (event) => {
        let value = event.target.value;
        songObj.compressorRatio = value;
        songObj.compressor.ratio.value = value;
    };

    document.getElementById("link-song-download").onclick = (event) => {
        let file = new Blob([exportSong()], { type: 'text/json' });
        event.target.href = URL.createObjectURL(file);
        let name = songObj.title || "song";
        event.target.download = name + ".json";
    };

    document.getElementById("button-export-menu-open").onclick = () => {
        let menu = document.getElementById("export-modal-menu");
        menu.classList.remove("modal-hidden");
    };

    document.getElementById("button-arrange-menu-close").onclick = () => {
        let menu = document.getElementById("arrange-modal-menu");
        menu.classList.add("modal-hidden");
    };

    /*
     * Export WAV modal menu
     */
    document.getElementById("button-render").onclick = () => {
        let renderLengthInput = document.getElementById("input-render-length");
        let renderLength = Number(renderLengthInput.value) || 5;

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

            var newFile = URL.createObjectURL(expData);

            var downloadLink = document.getElementById("link-wav-download");
            downloadLink.href = newFile;
            let name = songObj.title || "export";
            downloadLink.download = name + ".wav";
        })
    };

    document.getElementById("button-export-menu-close").onclick = () => {
        let menu = document.getElementById("export-modal-menu");
        menu.classList.add("modal-hidden");
    };

    /*
     * Pattern modal menu
     */
    document.getElementById("button-pattern-menu-open").onclick = () => {
        document.getElementById("input-pattern-name").value = songObj.currentPattern.name;
        document.getElementById("input-pattern-length").value = songObj.currentPattern.length;

        let synthName = songObj.getCurrentLayerSynthName();
        let synthSelect = document.getElementById("button-synth-select");
        synthSelect.innerHTML = "";
        synthSelect.appendChild(document.createTextNode(synthName || "[none]"));

        let menu = document.getElementById("pattern-modal-menu");
        menu.classList.remove("modal-hidden");
    };

    document.getElementById("input-pattern-name").onchange = (event) => {
        let value = event.target.value;

        if (value) {
            songObj.currentPattern.name = value;

            let patternName = document.getElementById("pattern-name-area");
            patternName.innerHTML = "";
            patternName.appendChild(document.createTextNode(value));
            onSongChangeCallback(false);
        }
    };

    document.getElementById("button-synth-select").onclick = () => {
        isCreateNewLayer = false;
        showSynthSelectList();
    };

    document.getElementById("button-delete-pattern").onclick = () => {
        if (songObj.patterns.length == 1) {
            g_showAlert("Can not delete last pattern");
            return;
        }

        g_showConfirm("Delete current pattern?", (isOk) => {
            if (!isOk)
                return;

            songObj.deleteCurrentPattern();
            onSongChangeCallback(false);
            document.getElementById("pattern-modal-menu").classList.add("modal-hidden");
            g_switchTab("arrange");
        });
    };

    document.getElementById("button-delete-layer").onclick = () => {
        if (songObj.currentPattern.patternData.length == 1) {
            g_showAlert("Can not delete last layer");
            return;
        }

        g_showConfirm("Delete current layer?", (isOk) => {
            if (!isOk)
                return;

            songObj.currentPattern.deleteActiveLayer();
            onSongChangeCallback(false);
            document.getElementById("pattern-modal-menu").classList.add("modal-hidden");
        });
    };

    document.getElementById("button-pattern-menu-close").onclick = () => {
        let menu = document.getElementById("pattern-modal-menu");
        menu.classList.add("modal-hidden");
    };

    /*
     * Synth-select modal menu
     */
    document.getElementById("menu-synth-list-container").onclick = (event) => {
        if (!event.target.classList.contains("js-synth-list-entry"))
            return;

        if (isCreateNewLayer) {
            songObj.currentPattern.addLayer();
            isCreateNewLayer = false;
        }

        let index = Number(event.target.dataset.index);
        songObj.setCurrentLayerSynthIndex(index >= 0 ? index : null);

        let synthName = songObj.getCurrentLayerSynthName() || "[none]";
        let synthSelect = document.getElementById("button-synth-select");
        synthSelect.innerHTML = "";
        synthSelect.appendChild(document.createTextNode(synthName));

        onSongChangeCallback(false);
        document.getElementById("synth-select-modal-menu").classList.add("modal-hidden");
    };

    document.getElementById("button-synth-select-close").onclick = () => {
        document.getElementById("synth-select-modal-menu").classList.add("modal-hidden");
    };

    /*
     * Settings (temporal) modal menu
     */
    document.getElementById("button-settings-open").onclick = () => {
        document.getElementById("settings-modal-menu").classList.remove("modal-hidden");
    };

    document.getElementById("button-export-song").onclick = () => {
        let outText = document.getElementById("text-export-data");
        outText.value = exportSong();
    };

    document.getElementById("button-import-song").onclick = () => {
        let outText = document.getElementById("text-export-data");
        let expObj = JSON.parse(outText.value);

        songObj.title = expObj.title || "";
        songObj.synthParams = expObj.synthParams;
        songObj.synthNames = expObj.synthNames;

        songObj.synths.forEach(e => e.destroy());
        songObj.synths = [];

        songObj.bpm = expObj.bpm || 120;
        Tone.Transport.bpm.value = songObj.bpm;

        songObj.compressorThreshold = expObj.compressorThreshold || 0;
        songObj.compressorRatio = expObj.compressorRatio || 1;
        songObj.compressor.threshold.value = songObj.compressorThreshold;
        songObj.compressor.ratio.value = songObj.compressorRatio;

        for (let i = 0; i < songObj.synthParams.length; i++) {
            let synth = new Synth(songObj.compressor, songObj.bpm);
            songObj.synths.push(synth);
            loadSynthCallback(songObj.synthParams[i], songObj.synths[i]);
        }

        songObj.patterns = [];
        for (let i = 0; i < expObj.patterns.length; i++) {
            let ptrn = new Pattern(expObj.patternNames[i]);
            ptrn.patternData = expObj.patterns[i];

            if (expObj.patternLengths)
                ptrn.length = expObj.patternLengths[i];

            songObj.patterns.push(ptrn);
        }

        songObj.song = expObj.song;
        songObj.currentPattern = songObj.patterns[0];
        songObj.arrangeStartPoint = 0;
        onSongChangeCallback(true);
        showSongTitle();
    };

    document.getElementById("button-export-pattern").onclick = () => {
        let text = document.getElementById("text-export-data");
        let expObj = {
            notes: songObj.currentPattern.patternData[songObj.currentPattern.activeIndex].notes,
            lengths: songObj.currentPattern.patternData[songObj.currentPattern.activeIndex].lengths
        };
        text.value = JSON.stringify(expObj, null, 1);
    };

    document.getElementById("button-import-pattern").onclick = () => {
        let text = document.getElementById("text-export-data");
        let data = JSON.parse(text.value);

        songObj.currentPattern.patternData[songObj.currentPattern.activeIndex].notes = data.notes;
        songObj.currentPattern.patternData[songObj.currentPattern.activeIndex].lengths = data.lengths;
        showSequenceCallback(songObj.currentPattern);
    };

    document.getElementById("button-export-full-pattern").onclick = () => {
        let text = document.getElementById("text-export-data");
        text.value = JSON.stringify(songObj.currentPattern.patternData, null, 1);
    };

    document.getElementById("button-import-full-pattern").onclick = () => {
        let text = document.getElementById("text-export-data");
        let data = JSON.parse(text.value);

        songObj.currentPattern.patternData = data;
        //sequencer.importData(data);
    };

    document.getElementById("button-settings-close").onclick = () => {
        document.getElementById("settings-modal-menu").classList.add("modal-hidden");
    };

    /*
     * Auxility
     */
    function showSongTitle() {
        let songTitle = document.getElementById("song-title-area");
        songTitle.innerHTML = "";
        songTitle.appendChild(document.createTextNode(songObj.title));
    }

    function exportSong() {
        let expObj = {};

        expObj.synthParams = songObj.synthParams;
        expObj.synthNames = songObj.synthNames;
        expObj.song = songObj.song;
        expObj.patterns = [];
        expObj.patternLengths = [];
        expObj.patternNames = [];
        expObj.compressorThreshold = songObj.compressorThreshold;
        expObj.compressorRatio = songObj.compressorRatio;
        expObj.bpm = songObj.bpm;
        expObj.title = songObj.title;

        for (let i = 0; i < songObj.patterns.length; i++) {
            expObj.patterns.push(songObj.patterns[i].patternData);
            expObj.patternLengths.push(songObj.patterns[i].length);
            expObj.patternNames.push(songObj.patterns[i].name);
        }

        return JSON.stringify(expObj, null, 1);
    }

    function showSynthSelectList() {
        document.getElementById("synth-select-modal-menu").classList.remove("modal-hidden");

        let listContainer = document.getElementById("menu-synth-list-container");
        listContainer.innerHTML = "";

        let noneEntry = document.createElement("DIV");
        noneEntry.classList.add("js-synth-list-entry");
        noneEntry.dataset.index = -1;
        noneEntry.appendChild(document.createTextNode("[none]"));
        listContainer.appendChild(noneEntry);

        for (let i = 0; i < songObj.synthNames.length; i++) {
            let entry = document.createElement("DIV");
            entry.classList.add("js-synth-list-entry");
            entry.dataset.index = i;
            entry.appendChild(document.createTextNode(songObj.synthNames[i]));
            listContainer.appendChild(entry);
        }
    }

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