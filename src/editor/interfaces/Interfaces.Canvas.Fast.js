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
    
var FastCanvas = function (wickEditor) {

	var self = this;

    var pixiRenderer;
    var canvasContainer;

    var fastRenderIntervalID;
    var previewPlayIntervalID;

    var fastRendering;
    var previewPlaying;

    this.setup = function () {
        fastRendering = false;
        previewPlaying = false;

        canvasContainer = document.createElement('div');
        canvasContainer.id = 'previewRenderContainer';
        canvasContainer.style.width = wickEditor.project.width+'px';
        canvasContainer.style.height = wickEditor.project.height+'px';
        document.getElementById('editorCanvasContainer').appendChild(canvasContainer);
        pixiRenderer = new WickPixiRenderer(canvasContainer);
    }

    this.update = function () {
        updateCanvasTransforms();
        canvasContainer.style.display = 'block';

        var bgRenderObjects = wickEditor.project.currentObject.getAllInactiveSiblings();
        if (wickEditor.project.onionSkinning) {
            var onionSkinObjects = wickEditor.project.currentObject.getNearbyObjects(1,1);
            bgRenderObjects = bgRenderObjects.concat(onionSkinObjects)
        }

        bgRenderObjects = bgRenderObjects.concat(wickEditor.project.currentObject.getAllActiveChildObjects().filter(function (c) {
            return c.parentFrame.parentLayer.locked && !c.parentFrame.parentLayer.hidden;
        }));

        bgRenderObjects.forEach(function (o) {
            o._renderAsBGObject = true;
        })

        pixiRenderer.renderWickObjects(wickEditor.project, bgRenderObjects, 2);
    }

    this.startFastRendering = function () {
        clearInterval(fastRenderIntervalID);
        
        fastRendering = true;

        wickEditor.canvas.getInteractiveCanvas().hide();

        function proceed () {
            wickEditor.project.applyTweens();
            var renderObjects = wickEditor.project.rootObject.getAllActiveChildObjects();
            renderObjects.forEach(function (o) {
                o._renderAsBGObject = true;
            });
            pixiRenderer.renderWickObjects(wickEditor.project, renderObjects, 2);
        }

        proceed();
        fastRenderIntervalID = setInterval(proceed, 1000/60);
    }

    this.stopFastRendering = function () {
        fastRendering = true;

        wickEditor.canvas.getInteractiveCanvas().show();

        clearInterval(fastRenderIntervalID);
    }

    this.startPreviewPlaying = function (loop) {
        clearInterval(previewPlayIntervalID);

        previewPlaying = true;
        self.startFastRendering();

        var currObj = wickEditor.project.currentObject;
        if(currObj.playheadPosition >= currObj.getTotalTimelineLength()-1) {
            currObj.playheadPosition = 0;
        }

        function proceed () {
            var currObj = wickEditor.project.currentObject;
            currObj.playheadPosition ++;

            if(currObj.playheadPosition >= currObj.getTotalTimelineLength()) {
                if(loop) {
                    currObj.playheadPosition = 0;
                } else {
                    currObj.playheadPosition -= 1;
                    self.stopPreviewPlaying();
                }
            }

            wickEditor.timeline.getElem().playhead.update();
        }

        wickEditor.timeline.getElem().playhead.update();
        previewPlayIntervalID = setInterval(proceed, 1000/wickEditor.project.framerate);
    }

    this.stopPreviewPlaying = function () {
        previewPlaying = false;
        self.stopFastRendering();

        clearInterval(previewPlayIntervalID);

        wickEditor.syncInterfaces();
    }

    this.togglePreviewPlaying = function () {
        if(previewPlaying) {
            self.stopPreviewPlaying();
        } else {
            self.startPreviewPlaying();
        }
    }

    this.getRenderer = function () {
        return {
            renderer: pixiRenderer,
            canvasContainer: canvasContainer
        };
    }

    this.updateViewTransforms = function () {
        updateCanvasTransforms();
    }

    function updateCanvasTransforms () {
        var pan = wickEditor.canvas.getPan();
        var zoom = wickEditor.canvas.getZoom();

        var width = wickEditor.project.width;
        var height = wickEditor.project.height;

        //pan = {x:0,y:0}
        var tx = (pan.x)+width *2*(zoom-1)/2;
        var ty = (pan.y)+height*2*(zoom-1)/2;
        tx -= width /2*(zoom);
        ty -= height/2*(zoom);
        var transform = 'translate('+tx+'px,'+ty+'px) scale('+zoom+', '+zoom+')';
        canvasContainer.style.width = (width*2)+'px';
        canvasContainer.style.height = (height*2)+'px';
        canvasContainer.style.paddingLeft = '0px';//(pan.x*zoom)+'px';
        canvasContainer.style.paddingRight = '0px';
        canvasContainer.style.paddingTop = '0px';//(pan.y*zoom)+'px';
        canvasContainer.style.paddingBottom = '0px';
        canvasContainer.style["-ms-transform"] = transform;
        canvasContainer.style["-webkit-transform"] = transform;
        canvasContainer.style["transform"] = transform;
    }
	
}