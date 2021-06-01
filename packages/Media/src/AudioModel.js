import canEmitEvents from '../../../src/shared/canEmitEvents.mjs';

/**
 * Abstraction of HTML Audio element that is shared between all components.
 */
class AudioModel {

    /**
     * Audio's loading state, either null, 'loading' or 'loaded'
     */
    loadingState = null;
    /**
     * Audio's playing state; separate from loadingState to play audio after it was loaded *if*
     * user has started playing and not paused audio afterwards. Separate from audio's play state
     * for the same reason.
     */
    playing = false;

    constructor() {
        Object.assign(this, canEmitEvents());
    }

    setURL(url) {
        this.url = url;
    }

    load() {
        this.loadingState = 'loading';
        this.emit('load');
        /* global Audio */
        this.audio = new Audio(this.url);
        this.setupAudioListeners();
    }

    getDuration() {
        return this.audio && this.audio.duration;
    }

    getVolume() {
        return this.audio && this.audio.volume;
    }

    getCurrentTime() {
        return this.audio && this.audio.currentTime;
    }

    /**
     * Maps events from Audio instance to internal EventEmitter events that are listened to by
     * components
     * @private
     */
    setupAudioListeners() {
        this.audio.addEventListener('play', () => {
            this.emit('play');
            this.playing = true;
        });
        this.audio.addEventListener('timeupdate', (ev) => {
            this.emit('timeupdate', ev.timeStamp);
        })
        this.audio.addEventListener('pause', () => {
            this.emit('pause');
            this.playing = false;
        });
        this.audio.addEventListener('volumechange', (ev) => {
            this.emit('volumechange', this.getVolume());
        });
        this.audio.addEventListener('canplaythrough', async() => {
            // Timeout is needed to test loading state on AudioComponent; loads too fast to see
            // data-state="loading" in the DOM without the Timeout
            // await new Promise(resolve => setTimeout(resolve, 1000));
            this.emit('canplaythrough');
            this.loadingState = 'loaded';
            // If user clicked play to load audio and did not pause afterwards, play audio
            if (this.playing) this.play();
        });
    }

    play() {
        this.playing = true;
        if (this.loadingState !== 'loaded') return;
        this.audio.play();
    }

    pause() {
        this.playing = false;
        if (this.loadingState !== 'loaded') return;
        this.audio.pause();
    }

    setVolume(volume) {
        this.audio.volume = volume;
    }

    setCurrentTime(time) {
        this.audio.currentTime = time;
    }

}

export default AudioModel;
