// ZzFXM (v2.0.3) - Zuper Zmall Zound Zynth Music Generator
// MIT License - Copyright 2019 Frank Force
// https://github.com/KilledByAPixel/ZzFX

'use strict';

const zzfxM = (instruments, patterns, sequence, BPM = 125) => {
    let instrumentParameters;
    let i;
    let j;
    let k;
    let note;
    let sample;
    let patternChannel;
    let notFirstBeat;
    let stop;
    let instrument;
    let pitch;
    let attenuation;
    let outSampleOffset;
    let isSequenceEnd;
    let sampleOffset = 0;
    let nextSampleOffset;
    let sampleBuffer = [];
    let leftChannelBuffer = [];
    let rightChannelBuffer = [];
    let channelIndex = 0;
    let panning = 0;
    let hasMore = 1;
    let sampleCache = {};
    let beatLength = 125 / BPM * 44100;

    // for each channel in order until there are no more
    for(; hasMore; channelIndex++) {
        // reset current values
        sampleBuffer = [hasMore = notFirstBeat = pitch = outSampleOffset = 0];

        // for each pattern in sequence
        sequence.map((patternIndex, sequenceIndex) => {
            // get pattern for current channel, use empty 1 note pattern if none found
            patternChannel = patterns[patternIndex][channelIndex] || [0, 0, 0];

            // pattern length
            const patternLength = patternChannel.length;

            // for each beat in pattern, generate samples
            for(i = 0; hasMore && i < patternLength; i += 3) {
                // stop if end of sequence
                isSequenceEnd = sequenceIndex + 1 == sequence.length && i + 3 >= patternLength;

                // get instrument and volume
                instrument = patternChannel[i];
                attenuation = patternChannel[i + 1];

                // get note
                note = patternChannel[i + 2];
                if(note) {
                    // if first note of pattern, compute length
                    if(!notFirstBeat) {
                        // set length to next pattern
                        const nextPattern = patterns[sequence[sequenceIndex + 1]] || patterns[0];
                        nextSampleOffset = beatLength * (nextPattern.length || patternLength) / patternLength;
                    }

                    // get cached sample
                    let sampleKey = note + ',' + instrument + ',' + attenuation;
                    if(!sampleCache[sampleKey]) {
                        instrumentParameters = [...instruments[instrument]];
                        instrumentParameters[2] *= 2 ** ((note - 12) / 12);
                        sampleCache[sampleKey] = zzfxG(...instrumentParameters);
                    }
                    sample = sampleCache[sampleKey];

                    // add sample to buffer
                    for(j = 0; j < sample.length; j++) {
                        leftChannelBuffer[outSampleOffset + j] = (leftChannelBuffer[outSampleOffset + j] || 0) + sample[j] * (1 - panning);
                        rightChannelBuffer[outSampleOffset + j] = (rightChannelBuffer[outSampleOffset + j] || 0) + sample[j] * panning;
                    }
                }

                // update position
                outSampleOffset += nextSampleOffset;
                notFirstBeat = 1;

                // if end of sequence, don't generate more
                if(isSequenceEnd) {
                    hasMore = 0;
                }
            }
        });

        // next channel panning
        panning += 0.5;
    }

    // return stereo buffer
    return [leftChannelBuffer, rightChannelBuffer];
}; 