"use strict";

function waveformEditor(songObj) {
    const padding = 12;
    let oscName = "osc1";
    let partials = [];

    let oscCopyOptions = {};
    for (let el of ["osc1", "osc2", "osc3"])
        oscCopyOptions[el] = document.getElementById("opt-copy-" + el);

    let canvas = document.getElementById("canvas-osc-editor");
    let ctx = canvas.getContext("2d");

    let drawWidth = canvas.width - padding * 2;
    let drawHeight = canvas.height - padding * 2;

    let pressed = false;
    canvas.addEventListener("pointerdown", (e) => { pressed = true; pointerListener(e) });
    canvas.addEventListener("pointermove", pointerListener);

    canvas.addEventListener("pointerup", pointerOffListener);
    canvas.addEventListener("pointercancel", pointerOffListener);
    canvas.addEventListener("pointerleave", pointerOffListener);

    let selectOscHarmonics = document.getElementById("select-osc-harmonics");

    selectOscHarmonics.onchange = (e) => {
        partials.length = Number(e.target.value);

        for (let i = 0; i < partials.length; i++)
            if (!partials[i])
                partials[i] = 0;

        applyPartialsToSynth();
        drawBars();
        drawPlot();
    }

    document.getElementById("osc1-menu-open").onclick = () => {
        oscName = "osc1";
        openEditor();
    };

    document.getElementById("osc2-menu-open").onclick = () => {
        oscName = "osc2";
        openEditor();
    };

    document.getElementById("osc3-menu-open").onclick = () => {
        oscName = "osc3";
        openEditor();
    };

    document.getElementById("button-osc-menu-close").onclick = () => {
        hideModal("oscillator-modal-menu");
    };

    function openEditor() {
        showModal("oscillator-modal-menu");
        let synth = songObj.synths[songObj.currentSynthIndex];

        readPartials(synth.partials[oscName]);
        selectOscHarmonics.value = partials.length;

        for (let key in oscCopyOptions)
            oscCopyOptions[key].hidden = (synth.partials[key].length <= 1)

        oscCopyOptions[oscName].hidden = true;
    }

    function readPartials(oscPartials) {
        partials = oscPartials.slice();

        if (partials.length <= 1)
            while (partials.length < 16)
                partials.push(0);

        drawBars();
        drawPlot();
    }

    document.getElementById("select-harmonics-templates").onchange = (e) => {
        switch (e.target.value) {
            case "sine":
                partials.fill(0);
                partials[0] = 1;
                break;

            case "softsaw":
                partials = mkSaw(partials.length, true);
                break;

            case "triangle":
                partials = mkSaw(partials.length, true);
                sparse(partials, 1, 2);
                break;

            case "sawtooth":
                partials = mkSaw(partials.length, false);
                break;

            case "square":
                partials = mkSaw(partials.length, false);
                sparse(partials, 1, 2);
                break;

            case "pulse33":
                partials = mkSaw(partials.length, false);
                sparse(partials, 2, 3);
                break;

            case "pulse25":
                partials = mkSaw(partials.length, false);
                sparse(partials, 3, 4);
                break;

            case "pulse20":
                partials = mkSaw(partials.length, false);
                sparse(partials, 4, 5);
                break;

            case "strings1":
                partials = mkSaw(partials.length, false);
                sparse(partials, 2, 4);
                sparse(partials, 3, 4);
                break;

            case "strings2":
                partials = mkSaw(partials.length, false);
                sparse(partials, 2, 5);
                sparse(partials, 4, 5);
                break;

            case "linear":
                for (let i = 0; i < partials.length; i++)
                    partials[i] = 1 - (i / partials.length)
                break;

            case "osc1":
            case "osc2":
            case "osc3":
                let synth = songObj.synths[songObj.currentSynthIndex];
                partials = synth.partials[e.target.value].slice();
                selectOscHarmonics.value = partials.length;
                break;

        }

        e.target.value = "template";
        applyPartialsToSynth();
        drawBars();
        drawPlot();

        function mkSaw(len, soft) {
            let wave = new Array(len);
            for (let i = 1; i <= len; i++)
                wave[i - 1] = 1 / (soft ? i * i : i);

            return wave;
        }

        function sparse(arr, start, step) {
            for (let i = start; i < arr.length; i += step)
                arr[i] = 0;
        }
    }

    function applyPartialsToSynth() {
        let synth = songObj.synths[songObj.currentSynthIndex];
        let synthParams = songObj.synthParams[songObj.currentSynthIndex];
        let paramId = "synth-" + oscName + "-partials";
        synthParams[paramId] = partials.join(",");
        synth[oscName].partials = partials.slice();
        synth.partials[oscName] = partials.slice();
    }

    function pointerOffListener() {
        if (pressed) {
            pressed = false;
            drawPlot();
            applyPartialsToSynth();
        }
    }

    function pointerListener(e) {
        if (!pressed)
            return;

        let wdth = canvas.getBoundingClientRect().width;
        let hght = canvas.getBoundingClientRect().height;

        let x = e.offsetX / wdth * canvas.width - padding - 1;
        let y = e.offsetY / hght * canvas.height - padding - 1;

        let step = drawWidth / partials.length;
        let partialsIndex = Math.floor(x / step);
        if (partialsIndex < 0 || partialsIndex >= partials.length)
            return;

        let partial = 1 - y / drawHeight;
        partial = Math.min(1, partial);
        partial = Math.max(0, partial);
        partials[partialsIndex] = partial * partial;

        drawBars();
    }

    function drawBars() {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        drawDecorations(ctx, canvas.width, canvas.height, padding, partials.length, oscName.toUpperCase());

        ctx.fillStyle = "#347234";
        let barWidth = drawWidth / partials.length;
        for (let i = 0; i < partials.length; i++) {
            let barHeight = Math.sqrt(partials[i]) * drawHeight;
            ctx.fillRect(padding + i * barWidth + 1, padding + drawHeight - barHeight, barWidth - 2, barHeight)
        }

        ctx.fillStyle = "#3e883e";
        for (let i = 0; i < partials.length; i++) {
            let barHeight = partials[i] * drawHeight;
            ctx.fillRect(padding + i * barWidth + 2, padding + drawHeight - barHeight, barWidth - 4, barHeight)
        }
    }

    function drawPlot() {
        let [rr, ii] = _getRealImaginary(0, partials);
        let plotLine = new Array(drawWidth);
        let maxV = 0;
        for (let i = 0; i < drawWidth; i++) {
            plotLine[i] = _inverseFFT(rr, ii, i / drawWidth * 360 / (180 / Math.PI));
            maxV = Math.max(maxV, plotLine[i])
        }

        ctx.strokeStyle = "white";
        ctx.beginPath();

        ctx.moveTo(padding, drawHeight / 2 + padding);
        for (let i = 0; i < drawWidth; i++) {
            let yy = drawHeight / 2 + drawHeight / 2 * plotLine[i] / maxV;
            ctx.lineTo(padding + i, padding + yy);
        }

        ctx.lineTo(canvas.width - padding, drawHeight / 2 + padding);
        ctx.stroke();
    }

    function drawDecorations(context, width, height, padding, divideTo, title) {
        let dwid = width - padding * 2;
        let dhei = height - padding * 2;
        let y, dy;

        context.strokeStyle = "#555";
        context.strokeRect(1, 1, width - 2, height - 2);

        context.font = "34px sans-serif";
        context.fillStyle = "#555";
        context.fillText(title, padding + dwid / 4 * 3, padding + 32);

        context.font = "12px sans-serif";
        context.fillStyle = "darkcyan";
        dy = Math.sqrt(0.5);
        context.fillText(".50", width - padding - 20, padding + dhei - dhei * dy - 2);
        dy = Math.sqrt(0.75);
        context.fillText(".75", width - padding - 20, padding + dhei - dhei * dy - 2);
        dy = Math.sqrt(0.25);
        context.fillText(".25", width - padding - 20, padding + dhei - dhei * dy - 2);

        context.strokeStyle = "cyan";
        context.beginPath();

        dy = Math.sqrt(0.5);
        y = dhei - dhei * dy
        line(-10, y, dwid + 10, y)

        dy = Math.sqrt(0.75);
        y = dhei - dhei * dy
        line(15, y, dwid - 15, y)

        context.stroke();

        context.strokeStyle = "darkcyan";
        context.strokeRect(padding, padding, dwid, dhei);

        context.beginPath();
        for (let i = 0; i <= divideTo; i++) {
            let len = width - padding * 2;
            let div = len / divideTo;
            if (i % 4 == 0) {
                line(div * i, dhei, div * i, dhei + 10);
            }
        }

        dy = Math.sqrt(0.125);
        y = dhei - dhei * dy
        line(40, y, dwid - 40, y)

        dy = Math.sqrt(0.625);
        y = dhei - dhei * dy
        line(40, y, dwid - 40, y)

        dy = Math.sqrt(0.375);
        y = dhei - dhei * dy
        line(40, y, dwid - 40, y)

        dy = Math.sqrt(0.875);
        y = dhei - dhei * dy
        line(40, y, dwid - 40, y)

        context.stroke();

        context.strokeStyle = "#f88";
        context.beginPath();

        dy = 0.5; //Math.sqrt(0.25);
        y = dhei - dhei * dy
        line(0, y, dwid, y)
        context.stroke();

        context.strokeStyle = "brown";
        context.beginPath();

        let dx = 0.5;
        let x = dwid - dwid * dx
        line(x, 0, x, dhei);

        line(dwid / 2 - 20, dhei / 4, dwid / 2 + 20, dhei / 4);
        line(dwid / 2 - 20, dhei / 4 * 3, dwid / 2 + 20, dhei / 4 * 3);

        line(dwid / 4, dhei / 2 - 20, dwid / 4, dhei / 2 + 20);
        line(dwid / 4 * 3, dhei / 2 - 20, dwid / 4 * 3, dhei / 2 + 20);

        context.stroke();

        function line(x1, y1, x2, y2) {
            context.moveTo(Math.round(x1) + padding, Math.round(y1) + padding);
            context.lineTo(Math.round(x2) + padding, Math.round(y2) + padding);
        }
    }

    /*
     * Private functions from Tone.js (for drawing waveform on canvas)
     * https://github.com/Tonejs/Tone.js/blob/dev/Tone/source/oscillator/Oscillator.ts
     */
    function _inverseFFT(real, imag, phase) {
        let sum = 0;
        const len = real.length;
        for (let i = 0; i < len; i++) {
            sum +=
                real[i] * Math.cos(i * phase) + imag[i] * Math.sin(i * phase);
        }
        return sum;
    }

    function _getRealImaginary(phase, _partials) {
        let periodicWaveSize = _partials.length + 1;

        const real = new Float32Array(periodicWaveSize);
        const imag = new Float32Array(periodicWaveSize);

        if (_partials.length === 0) {
            return [real, imag];
        }

        for (let n = 1; n < periodicWaveSize; ++n) {
            let b = _partials[n - 1];

            if (b !== 0) {
                real[n] = -b * Math.sin(phase * n);
                imag[n] = b * Math.cos(phase * n);
            } else {
                real[n] = 0;
                imag[n] = 0;
            }
        }
        return [real, imag];
    }
}