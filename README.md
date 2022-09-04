# PulseQueue

Simple web-based application for creating electronic music.

Using Web Audio API and [Tone.js](https://github.com/Tonejs/Tone.js)

**https://valent-in.github.io/pulseq/**

## Features:
- Virtual analog synthesizers.
- Multi-layered step sequencer.
- Unlimited track length (auto-expand grid on fill).
- WAV export.

### Program tabs:
**LIST**  
Contains list of synthesizers.

**SYNTH**  
Configuration panel for selected synthesizer.  
_Node routing:_ VCO1+VCO2+O3+Noise -> Mixer -> ADSR Envelope -> VC Filter -> VC Amplifier -> Panner -> Amplifier -> FX ->  
VC-prefixed nodes can be modulated with LFO1/2 or modulation envelope.

**PATTERN**  
This is sequencer. Place notes here. Additional synths can be included in new layers.  
In top corners are step controls - length (left) and volume (right).

**ARRANGE**  
Combine patterns into complete music track.

---
This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License version 3.  
This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY.