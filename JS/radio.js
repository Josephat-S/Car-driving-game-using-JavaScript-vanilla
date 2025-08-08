class Radio {
    constructor() {
        this.currentTrack = null;
        this.isPlaying = false;
        this.tracks = {
            1: {
                name: "Cruising Beats",
                song: [
                    [                                     
                        [.5,0,270,,,.3,,.4,,,570,.03,,,,,.1,,.8,.02],     
                        [.5,0,270,,,.3,,.4,,,500,.03,,,,,.1,,.8,.02],     
                        [2,0,23,,,.3,2,.2,,,,,,,,,.1,,.7,.02],            
                        [1.5,0,11,,,.3,3,.3,,,,,,,,,.1,,.7,.02,.2],       
                        [2,0,3,,,.3,2,.2,,,,,,,,,.1,,.7,.02],             
                    ],                                    
                    [
                        [1,-1,1,1,1,1,1,1],                               
                        [1,1,1,-1,1,1,1,1],                               
                        [1,1,1,1,1,-1,1,1],                               
                        [1,1,1,1,1,1,1,-1],                               
                        [1,1,1,1,-1,1,1,1],                               
                    ],
                    90
                ]
            },
            2: {
                name: "Night Drive",
                song: [
                    [
                        [1,0,320,,,.3,,.5,,,550,.05,,,,,.1,,.9,.03],     
                        [1,0,180,,,.2,,.6,,,600,.04,,,,,.1,,.8,.02],     
                        [2,0,40,,,.4,2,.3,,,,,,,,,.1,,.7,.04],           
                        [1.5,0,20,,,.3,3,.4,,,,,,,,,.1,,.8,.03],         
                    ],
                    [
                        [1,1,-1,1,1,1,-1,1],                             
                        [1,-1,1,1,-1,1,1,1],                             
                        [1,1,1,-1,1,1,1,-1],                             
                        [-1,1,1,1,1,-1,1,1],                             
                    ],
                    110
                ]
            },
            3: {
                name: "Magic Garden Theme",
                song: [
                    [
                        [2,0,200,,,.2,,.7,,,600,.06,,,,,.1,,.95,.04],    
                        [2,0,300,,,.25,,.6,,,500,.05,,,,,.1,,.9,.03],    
                        [1.5,0,50,,,.3,2,.4,,,,,,,,,.1,,.8,.02],         
                        [1,0,30,,,.35,3,.5,,,,,,,,,.1,,.85,.03],         
                    ],
                    [
                        [1,1,1,-1,1,1,-1,1],                             
                        [-1,1,1,1,1,-1,1,1],                             
                        [1,-1,1,1,1,1,1,-1],                             
                        [1,1,-1,1,1,1,1,1],                              
                    ],
                    95
                ]
            }
        };

        this.setupEventListeners();
        this.updateInterface();
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (this.isGamePlaying()) {
                switch(e.key) {
                    case '1':
                    case '2':
                    case '3':
                        this.playTrack(parseInt(e.key));
                        break;
                    case '0':
                        this.stopMusic();
                        break;
                }
            }
        });

        // Button controls
        document.querySelectorAll('.radio-button').forEach(button => {
            button.addEventListener('click', () => {
                if (this.isGamePlaying()) {
                    const track = button.dataset.track;
                    if (track === 'off') {
                        this.stopMusic();
                    } else {
                        this.playTrack(parseInt(track));
                    }
                }
            });
        });
    }

    isGamePlaying() {
        // Check if game is in playing state
        return window.game && window.game.gameState === 'playing';
    }

    playTrack(trackNumber) {
        if (!this.tracks[trackNumber]) return;

        // Stop current track if playing
        this.stopMusic();

        // Start new track
        this.currentTrack = trackNumber;
        this.isPlaying = true;
        
        // Play the ZZFXM song
        zzfxM(...this.tracks[trackNumber].song);

        this.updateInterface();
    }

    stopMusic() {
        // Stop all audio
        zzfxX.stop();
        
        this.currentTrack = null;
        this.isPlaying = false;
        this.updateInterface();
    }

    updateInterface() {
        // Update track display
        const trackDisplay = document.getElementById('current-track');
        if (this.currentTrack && this.isPlaying) {
            trackDisplay.textContent = this.tracks[this.currentTrack].name;
        } else {
            trackDisplay.textContent = 'No Track Playing';
        }

        // Update button states
        document.querySelectorAll('.radio-button').forEach(button => {
            button.classList.remove('active');
            if (this.currentTrack && button.dataset.track === this.currentTrack.toString()) {
                button.classList.add('active');
            }
        });
    }
} 