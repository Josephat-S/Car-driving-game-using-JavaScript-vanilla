// ZzFX - Zuper Zmall Zound Zynth - Micro Edition
// MIT License - Copyright 2019 Frank Force
// https://github.com/KilledByAPixel/ZzFX

// This is a modified version of ZzFX for this project

'use strict';

// Global audio context
let zzfxX;

// Initialize or get audio context
const getAudioContext = () => {
    if (!zzfxX) {
        try {
            zzfxX = new (window.AudioContext || webkitAudioContext)();
        } catch (error) {
            console.error('Failed to create AudioContext:', error);
            return null;
        }
    }
    return zzfxX;
};

// Play sound
const zzfx = async (...z) => {
    const audioContext = getAudioContext();
    if (!audioContext) return null;
    
    // Ensure context is running
    if (audioContext.state === 'suspended') {
        try {
            await audioContext.resume();
        } catch (error) {
            console.error('Failed to resume AudioContext:', error);
            return null;
        }
    }
    
    return zzfxP(zzfxG(...z));
};

// Play samples
const zzfxP = (...samples) => {
    const audioContext = getAudioContext();
    if (!audioContext) return null;

    try {
        const buffer = samples.length > 1 ? 
            _ => { samples = samples.concat(...samples.splice(1)), samples[0] = samples[0] || [] } :
            _ => 0;

        const node = audioContext.createBufferSource();
        const buffer2 = audioContext.createBuffer(samples.length, samples[0].length, 44100);
        
        samples.map((d,i) => buffer2.getChannelData(i).set(d));
        node.buffer = buffer2;
        node.connect(audioContext.destination);
        node.start();
        return node;
    } catch (error) {
        console.error('Failed to play audio:', error);
        return null;
    }
};

// Generate samples
const zzfxG = (
    // parameters
    volume = 1, randomness = .05, frequency = 220, attack = 0, sustain = 0,
    release = .1, shape = 0, shapeCurve = 1, slide = 0, deltaSlide = 0,
    pitchJump = 0, pitchJumpTime = 0, repeatTime = 0, noise = 0, modulation = 0,
    bitCrush = 0, delay = 0, sustainVolume = 1, decay = 0, tremolo = 0
) => {
    // init parameters
    let PI2 = Math.PI*2,
    sign = v => v>0?1:-1,
    startSlide = slide *= 500 * PI2 / 44100 / 44100,
    startFrequency = frequency *= (1 + randomness*2*Math.random() - randomness) * PI2 / 44100,
    b=[], t=0, tm=0, i=0, j=1, r=0, c=0, s=0, f, length;
    
    // scale by sample rate
    attack = attack * 44100 + 9; // minimum attack to prevent pop
    decay *= 44100;
    sustain *= 44100;
    release *= 44100;
    delay *= 44100;
    
    length = attack + decay + sustain + release + delay | 0;
    
    try {
        // generate waveform
        for(; i < length; b[i++] = s) {
            if (++c >= delay) {                      // time after delay
                if (pitchJump && ++tm >= pitchJumpTime) {
                    frequency *= pitchJump;           // apply pitch jump
                    pitchJump = 0;
                }
                
                // apply slide
                if (slide) frequency += deltaSlide;
                
                // apply modulation
                if (modulation) frequency *= 1 + Math.sin(tm * modulation) * .5;
                
                f = frequency;                       // current frequency
                
                // apply vibrato
                if (tremolo) f *= 1 + Math.sin(tm * tremolo) * .5;
                
                // update time
                t += f;
                
                // bitcrush
                if (bitCrush) t = t*bitCrush & 1/bitCrush;
                
                // calculate sample
                s = t & 1;                          // square wave
                s *= shape || 1;                    // apply shape
                s = Math.abs(s);                    // absolute value
                s = s**shapeCurve;                  // curve 0=square, 2=pointy
                
                // calculate envelope
                j && (s *= j);
                
                // apply envelope
                if (c < attack)                     // attack
                    j = c/attack;
                else if (c < attack + decay)        // decay
                    j = 1 - ((c - attack) / decay) * (1 - sustainVolume);
                else if (c < attack + decay + sustain) // sustain
                    j = sustainVolume;              
                else if (c < length - delay)        // release
                    j = sustainVolume * (1 - ((c - attack - decay - sustain) / release));
                else                                // post release
                    j = 0;
                
                // apply noise
                if (noise) s *= 2*Math.random()-1;
            }
        }
        
        return b;
    } catch (error) {
        console.error('Failed to generate audio:', error);
        return [];
    }
}; 