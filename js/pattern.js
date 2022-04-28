function Pattern() {
    this.length = 16;
    this.activeIndex = 0;

    this.patternData = [
        { notes: [], lengths: [], synthIndex: null }
    ];

    this.addLayer = () => {
        if (this.patternData[this.activeIndex].synthIndex === null) {
            console.log("Layer already created. No synth index.")
        } else {
            this.activeIndex = this.patternData.length;
            this.patternData.push({ notes: [], lengths: [], synthIndex: null });
        }
    }
}