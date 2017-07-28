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
    
var WickPlayer = function () {

    var self = this;

    self.project;

    self.inputHandler;
    self.audioPlayer;

    self.canvasContainer;

    self.running = false;

    var initialStateProject;

    var ticksElapsed;

    self.runProject = function (projectJSON) {

        if(window.parent && window.parent.wickEditor) window.wickEditor = window.parent.wickEditor;
        
        self.running = true;

        window.rendererCanvas = document.getElementById('playerCanvasContainer');
        self.canvasContainer = window.rendererCanvas;

        ticksElapsed = 0;
        window.elapsedTicks = function () { return ticksElapsed; }
        resetElapsedTime();

        // Load the project!
        self.project = WickProject.fromJSON(projectJSON);
        initialStateProject = WickProject.fromJSON(projectJSON);
        self.project.fitScreen = bowser.tablet || bowser.mobile;
        initialStateProject.fitScreen = bowser.tablet || bowser.mobile;

        self.project.rootObject.generateObjectNameReferences(self.project.rootObject);
        initialStateProject.rootObject.generateObjectNameReferences(initialStateProject.rootObject);

        self.project.prepareForPlayer();
        initialStateProject.prepareForPlayer();

        // Setup renderer/input/audio player
        if(!window.wickRenderer) {
            window.wickRenderer = new WickPixiRenderer(self.canvasContainer);
            window.wickRenderer.setProject(self.project);
            window.wickRenderer.setup();
        }
        window.wickRenderer.setProject(self.project);
        self.inputHandler = new WickPlayerInputHandler(this, self.canvasContainer);
        self.audioPlayer = new WickHowlerAudioPlayer(self.project);
        self.htmlElemInjector = new WickHTMLElemInjector(self.project);

        self.inputHandler.setup();
        if(!bowser.mobile && !bowser.tablet) self.audioPlayer.setup();
        self.htmlElemInjector.setup();
        window.wickRenderer.refresh(self.project.rootObject);

        var preloader = new WickPreloader();

        window.wickRenderer.render([]);
        update(false);

    }

    self.stopRunningProject = function () {

        self.running = false;

        update();
        clearTimeout(loopTimeout);

        self.project = null;

        self.inputHandler.cleanup();
        self.audioPlayer.cleanup();
        //window.wickRenderer.cleanup();

    }

    self.requestFullscreen = function () {
        window.wickRenderer.requestFullscreen();
    }

    self.enterFullscreen = function () {
        window.wickRenderer.enterFullscreen();
    }

    var loopTimeout;
    var update = function (firstTick) {

        if(!self.running) return;

        if(self.project.framerate < 60) {
            loopTimeout = setTimeout(function() {

                if(self.running) {

                    if(!firstTick) self.project.tick();
                    if(self.project) window.wickRenderer.render(self.project.rootObject.getAllActiveChildObjects());
                    if(self.project) self.htmlElemInjector.update();
                    self.inputHandler.update(false);

                    update();
                }
            }, 1000 / self.project.framerate);

        } else {

            if(self.running) {
                requestAnimationFrame(function () { update(false) });
            }
            if(!firstTick) self.project.tick();
            window.wickRenderer.render(self.project.rootObject.getAllActiveChildObjects());
            self.htmlElemInjector.update();
            self.inputHandler.update();

        }

        ticksElapsed++;

    }





///////////// DEPRACTAETION ZOOOOEN!!!!!!!!!!!!!!!!!!!!!!!

    self.cloneObject = function (wickObj) {
        var clone = wickObj.copy();
        clone.isClone = true;

        clone.prepareForPlayer()

        clone.parentObject = wickObj.parentObject;
        clone.parentObject.getCurrentLayer().getCurrentFrame().wickObjects.push(clone);
        self.project.rootObject.generateParentObjectReferences();

        window.wickRenderer.refresh(clone);

        return clone;
    }

    self.deleteObject = function (wickObj) {
        //project.currentObject.removeChildByID(wickObj.id);
        // So for now don't actually delete it, just make it go away somehow cos i'm lazy
        wickObj._deleted = true;
        // JUST GET IT OUTTA HERE I DONT CARE ................. 
        // it's like 8am pls forgive me for this
        wickObj.x = 80608060 + Math.random()*10000;
        wickObj.y = 80608060 + Math.random()*10000;
        wickObj.name = undefined;
    }

    self.resetStateOfObject = function (wickObject) {

        // Clones go away because they have no original state! :O
        if(wickObject.isClone) {
            project.currentObject.removeChild(wickObject);
            return;
        }

        var initialStateObject = initialStateProject.getObjectByUUID(wickObject.uuid);
        if(!initialStateObject) return;

        // TOXXXIC
        //console.log("-------------");
        var blacklist = ['asset', 'alphaMask', 'pixiSprite', 'pixiContainer', 'pixiText', 'audioData', 'wickScripts', 'parentObject', 'layers', '_active', '_wasActiveLastTick', '_scopeWrapper', 'parentFrame', 'bbox', 'tweens'];
        for (var name in wickObject) {
            if (name !== 'undefined' && wickObject.hasOwnProperty(name) && blacklist.indexOf(name) === -1) {
                if(initialStateObject[name] !== wickObject[name]) {
                    wickObject[name] = initialStateObject[name];
                }
            }
        }
        
        wickObject.hoveredOver = false;
        wickObject.playheadPosition = 0;
        wickObject._playing = true;

        // Don't forget to reset the childrens states
        if(wickObject.isSymbol) {
            wickObject.getAllChildObjects().forEach(function (child) {
                wickPlayer.resetStateOfObject(child);
            });
        }

    }

}

function runProject (json) {
    window.wickPlayer = new WickPlayer(); 
    window.wickPlayer.runProject(json);
}