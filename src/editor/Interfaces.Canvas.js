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

var CanvasInterface = function (wickEditor) {

    var self = this;

    var pan;
    var zoom;

    var interactiveCanvas;
    var fastCanvas;

    var imageRenderer;

    var canvasBackdrop;
    var canvasContainer;

    self.setup = function () {
        canvasContainer = document.getElementById('editorCanvasContainer')

        canvasBackdrop = new CanvasBackdrop(wickEditor, canvasContainer);
        canvasBackdrop.setup();

        interactiveCanvas = new PaperCanvas(wickEditor);
        fastCanvas = new PixiCanvas(wickEditor);

        fastCanvas.setup();
        interactiveCanvas.setup();

        imageRenderer = new ImageRenderer();

        pan = {x:0,y:0};
        zoom = 1.0;
        window.addEventListener('resize', self.recenterCanvas, false);
    }

    self.syncWithEditorState = function () {
        interactiveCanvas.update();
        fastCanvas.update();
        canvasBackdrop.update();
    }

    self.getCanvasContainer = function () {
        return canvasContainer;
    }

    self.getInteractiveCanvas = function () {
        return interactiveCanvas;
    }

    self.getFastCanvas = function () {
        return fastCanvas;
    }

    self.getBackdrop = function () {
        return canvasBackdrop;
    }

    self.getZoom = function () {
        return zoom;
    }

    self.getPan = function () {
        return pan;
    }

    self.updateCursor = function () {
        document.body.style.cursor = wickEditor.currentTool.getCursorImage();
    }

    self.recenterCanvas = function () {
        var guiOffsetX = -85;
        var guiOffsetY = 47;
        var windowW = window.innerWidth;
        var windowH = window.innerHeight;
        var projectW = wickEditor.project.width
        var projectH = wickEditor.project.height
        var centerX = (windowW/2) - (projectW/2) + guiOffsetX;
        var centerY = (windowH/2) - (projectH/2) + guiOffsetY;

        pan.x = centerX;
        pan.y = centerY;
        zoom = 1.0;

        interactiveCanvas.updateViewTransforms();
        fastCanvas.updateViewTransforms();
        canvasBackdrop.updateViewTransforms();
    }

    self.panByAmount = function (x, y) {
        pan.x += x;
        pan.y += y;

        interactiveCanvas.updateViewTransforms();
        fastCanvas.updateViewTransforms();
        canvasBackdrop.updateViewTransforms();
    }

    self.zoomToPoint = function (zoomAmount, x, y) {
        zoom *= zoomAmount;

        pan.x += (x-pan.x)*(1-zoomAmount);
        pan.y += (y-pan.y)*(1-zoomAmount);

        interactiveCanvas.updateViewTransforms();
        fastCanvas.updateViewTransforms();
        canvasBackdrop.updateViewTransforms();
    }

}