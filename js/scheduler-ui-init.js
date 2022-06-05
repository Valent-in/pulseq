function schedulerUiInit(scheduler) {
    let isPlaying = false;

    let songPlayBtn = document.getElementById("button-arrange-play");
    songPlayBtn.addEventListener("click", () => {
        isPlaying = !isPlaying;
        if (isPlaying) {
            scheduler.playSong();
        } else {
            scheduler.stop();
        }
    });

    let patternPlayBtn = document.getElementById("button-pattern-play");
    patternPlayBtn.addEventListener("click", () => {
        isPlaying = !isPlaying;
        if (isPlaying) {
            scheduler.playPattern();
        } else {
            scheduler.stop();
        }
    });
}