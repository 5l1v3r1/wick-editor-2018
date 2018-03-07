/* Wick - (c) 2017 Zach Rispoli, Luca Damasco, and Josh Rispoli */

/*  This file is part of Wick. 
    
    Wick is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Wick is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Wick.  If not, see <http://www.gnu.org/licenses/>. */

var WickHowlerAudioPlayer = function () {

    var self = this;

    var howlSoundInstances = {};
    var frameSoundsMappings = {};
    var frameWaveforms = {};
    var framesActiveSoundID = {};

    var muted;

    var projectFramerateForSeekAmt;

    self.setup = function () {
        muted = false;
    }

    self.reloadSoundsInProject = function (project) {
        projectFramerateForSeekAmt = project.framerate;

        project.library.getAllAssets('audio').forEach(function (asset) {
            if(howlSoundInstances[asset.uuid]) return;

            var audioData = asset.getData();

            howlSoundInstances[asset.uuid] = new Howl({
                src: [audioData],
                loop: false,
                volume: 1.0
            });
        });

        project.getAllFrames().filter(function (frame) {
            return frame.hasSound() && !frameSoundsMappings[frame.uuid];
        }).forEach(function (frame) {
            var howlerSound = howlSoundInstances[frame.audioAssetUUID];
            frameSoundsMappings[frame.uuid] = howlerSound;
            framesActiveSoundID[frame.uuid] = null;

            if(window.WickEditor) {
                var asset = wickEditor.project.library.getAsset(frame.audioAssetUUID);
                var src = asset.getData();
                var scwf = new SCWF();
                scwf.generate(src, {
                    onComplete: function(png, pixels) {
                        frameWaveforms[frame.uuid] = png;
                        window.wickEditor.syncInterfaces();
                    }
                });
            }
        });
    }

    self.playSoundFromLibrary = function (asset) {
        if(!muted) {
            var howlerSound = howlSoundInstances[asset.uuid];
            var howlerID = howlerSound.play();
        }
    }

    self.playSoundOnFrame = function (frame) {
        if(!muted) {
            var howlerSound = frameSoundsMappings[frame.uuid];
            var howlerID = howlerSound.play();
            
            var seekAmtFrames = frame.parentObject.playheadPosition - frame.playheadPosition;
            var seekAmtSeconds = seekAmtFrames / projectFramerateForSeekAmt;
            howlerSound.volume(frame.volume);
            howlerSound.seek(seekAmtSeconds, howlerID);
            framesActiveSoundID[frame.uuid] = howlerID;
        }
    }

    self.stopSoundOnFrame = function (frame) {
        if(!muted) {
            var howlerSound = frameSoundsMappings[frame.uuid];
            var howlerID = framesActiveSoundID[frame.uuid];
            howlerSound.stop(howlerID);
        }
    }

    this.stopAllSounds = function () {
        for(uuid in howlSoundInstances) {
            howlSoundInstances[uuid].stop();
        }
    }

    this.cleanup = function () {
        // todo
    }

    this.getWaveformOfFrame = function (frame) {
        if(frameWaveforms[frame.uuid]) {
            return {
                src: frameWaveforms[frame.uuid],
                length: frameSoundsMappings[frame.uuid].duration()
            }
        }
    }

    /* Wick player API functions */

    window.playSound = function (assetFilename) {
        var asset = (wickPlayer || wickEditor).project.library.getAssetByName(assetFilename);
        if(asset) {
            self.playSoundFromLibrary(asset);
        }
    }

    window.stopAllSounds = function () {
        self.stopAllSounds();
    }

    window.mute = function () {
        self.stopAllSounds();
        muted = true;
    }

    window.unmute = function () {
        muted = false;
    }
}
