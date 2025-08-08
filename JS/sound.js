// Sound Manager for FutureSkillsDrive
class SoundManager {
    constructor() {
        this.musicVolume = 0.5;
        this.sfxVolume = 0.5;
        this.currentMusic = null;
        this.isPlaying = false;

        // Sound effects presets
        this.sounds = {
            engine: [1, 0, 440, .01, .1, .1, 4, 0, 0], // Engine sound
            crash: [2, 0, 160, .01, .3, .9, 4, 0, .1], // Crash sound
            brake: [1, .1, 270, .05, .08, .09, 1, 1.5, .1], // Brake sound
            horn: [1, .05, 220, .05, .2, .2, 2, 2, .2], // Horn sound
            point: [1, .05, 900, .03, .02, .02, 0, 2.5, 0], // Point scoring sound
            menu: [.5, .05, 900, .04, .02, 0, 0, 2.1, .25] // Menu click sound
        };

        // Background music definition using ZzFXM
        this.backgroundMusic = {
            instruments: [
                [2, 0, 100, .05, .4, .3, 2, 0, 0], // Bass
                [1.5, 0, 220, .05, .2, .15, 0, .5, 0], // Lead
                [1, .1, 440, .05, .15, .1, 1, 1, 0] // Pad
            ],
            patterns: [
                [ // Pattern 0 - Intro
                    [0, 1, 36, 0, 1, 0, 0, 1, 43], // Bass line
                    [1, .8, 60, 1, .8, 64, 1, .8, 67], // Lead melody
                    [2, .5, 48, 2, .5, 55, 2, .5, 52] // Pad chords
                ],
                [ // Pattern 1 - Main
                    [0, 1, 38, 0, 1, 0, 0, 1, 45],
                    [1, .8, 62, 1, .8, 65, 1, .8, 69],
                    [2, .5, 50, 2, .5, 57, 2, .5, 54]
                ]
            ],
            sequence: [0, 1, 0, 1] // Play patterns in sequence
        };

        // Initialize volume controls
        this.initVolumeControls();
    }

    initVolumeControls() {
        const musicSlider = document.getElementById('musicVolume');
        const sfxSlider = document.getElementById('sfxVolume');

        if (musicSlider) {
            musicSlider.value = this.musicVolume * 100;
            musicSlider.addEventListener('input', (e) => {
                this.musicVolume = e.target.value / 100;
                if (this.currentMusic) {
                    this.currentMusic.gain.value = this.musicVolume;
                }
            });
        }

        if (sfxSlider) {
            sfxSlider.value = this.sfxVolume * 100;
            sfxSlider.addEventListener('input', (e) => {
                this.sfxVolume = e.target.value / 100;
            });
        }
    }

    async playSound(soundName) {
        if (this.sounds[soundName]) {
            const params = [...this.sounds[soundName]];
            params[0] *= this.sfxVolume; // Apply volume scaling
            try {
                await zzfx(...params);
            } catch (error) {
                console.error(`Failed to play sound ${soundName}:`, error);
            }
        }
    }

    async playMusic() {
        if (!this.isPlaying) {
            try {
                const audioContext = getAudioContext();
                if (!audioContext) return;

                // Ensure context is running
                if (audioContext.state === 'suspended') {
                    await audioContext.resume();
                }

                // Generate the music
                const musicData = zzfxM(...Object.values(this.backgroundMusic));
                
                // Create audio buffer
                const buffer = audioContext.createBuffer(2, musicData[0].length, 44100);
                
                // Set the audio data for both channels
                buffer.getChannelData(0).set(musicData[0]);
                buffer.getChannelData(1).set(musicData[1]);
                
                // Create and configure source node
                const source = audioContext.createBufferSource();
                const gainNode = audioContext.createGain();
                
                source.buffer = buffer;
                source.loop = true;
                
                // Connect nodes
                source.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                // Set volume
                gainNode.gain.value = this.musicVolume;
                
                // Start playback
                source.start();
                
                this.currentMusic = gainNode;
                this.isPlaying = true;
            } catch (error) {
                console.error('Failed to play music:', error);
            }
        }
    }

    stopMusic() {
        if (this.isPlaying && this.currentMusic) {
            this.currentMusic.disconnect();
            this.currentMusic = null;
            this.isPlaying = false;
        }
    }

    toggleMusic() {
        if (this.isPlaying) {
            this.stopMusic();
        } else {
            this.playMusic();
        }
    }

    // Engine sound with pitch based on speed
    async playEngineSound(speed) {
        const engineParams = [...this.sounds.engine];
        engineParams[2] = 440 + (speed * 2); // Adjust frequency based on speed
        engineParams[0] *= this.sfxVolume; // Apply volume scaling
        try {
            await zzfx(...engineParams);
        } catch (error) {
            console.error('Failed to play engine sound:', error);
        }
    }

    // Crash sound with intensity variation
    async playCrashSound(intensity) {
        const crashParams = [...this.sounds.crash];
        crashParams[0] = Math.min(2, intensity * 2); // Adjust volume based on intensity
        crashParams[0] *= this.sfxVolume; // Apply volume scaling
        try {
            await zzfx(...crashParams);
        } catch (error) {
            console.error('Failed to play crash sound:', error);
        }
    }
} 