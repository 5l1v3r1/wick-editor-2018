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
    
var InteractiveCanvas = function (wickEditor) {

    var self = this;

    var paperCanvas;

    self.setup = function () {
        self.needsUpdate = true;

        // Create the canvas to be used with paper.js and init the paper.js instance.
        paperCanvas = document.createElement('canvas');
        paperCanvas.className = 'paperCanvas';
        paperCanvas.style.backgroundColor = "rgb(0,0,0,0)";
        paperCanvas.style.position = 'absolute';
        paperCanvas.style.top = "0px";
        paperCanvas.style.left = "0px";
        paperCanvas.style.width  = window.innerWidth+'px';
        paperCanvas.style.height = window.innerHeight+'px';
        paper.setup(paperCanvas);
        
        paper.view.viewSize.width  = window.innerWidth;
        paper.view.viewSize.height = window.innerHeight;
        window.addEventListener('resize', function () {
            paperCanvas.style.width  = window.innerWidth+'px';
            paperCanvas.style.height = window.innerHeight+'px';
            paper.view.viewSize.width  = window.innerWidth;
            paper.view.viewSize.height = window.innerHeight;
        }, false);
        paper.view.viewSize.width  = window.innerWidth;
        paper.view.viewSize.height = window.innerHeight;
        document.getElementById('editorCanvasContainer').appendChild(paperCanvas);

    }

    self.show = function () {
        paperCanvas.style.display = 'block'
    }

    self.hide = function () {
        paperCanvas.style.display = 'none'
    }

    self.update = function () {

        self.updateViewTransforms();

        if(wickEditor.currentTool.paperTool) wickEditor.currentTool.paperTool.activate();
        self.show();

        if(self.needsUpdate) {
            function createPathForWickobject (wickObject) {
                if(wickObject.isPath) {
                    var xmlString = wickObject.pathData
                      , parser = new DOMParser()
                      , doc = parser.parseFromString(xmlString, "text/xml");
                    wickObject.paper = paper.project.importSVG(doc, {insert:false});
                } else if (wickObject.isImage) {
                    
                    //var raster = new paper.Raster(wickObject.asset.data);
                    /*var xmlString = wickObject.pathData
                      , parser = new DOMParser()
                      , doc = parser.parseFromString(xmlString, "text/xml");
                    var mask = paper.project.importSVG(doc, {insert:false});*/
                    /*var mask = new paper.Path.Rectangle([0,0],[80,80])
                    wickObject.paper = new paper.Group(mask,raster);
                    wickObject.paper.clipped = true;
                    wickObject.paper.fillColor = 'red';*/
                    
                    var raster = new paper.Raster(wickObject.asset.data);
                    wickObject.paper = new paper.Group();
                    wickObject.paper.addChild(raster);
                } else if (wickObject.isSymbol) {
                    wickObject.paper = new paper.Group();
                    wickObject.getAllActiveChildObjects().forEach(function (child) {
                        createPathForWickobject(child)
                        wickObject.paper.addChild(child.paper);
                        child.paper._isPartOfGroup = true;
                    });
                    wickObject.paper.pivot = new paper.Point(wickObject.x,wickObject.y);
                }

                var absPos = wickObject.getAbsolutePosition();
                wickObject.paper.position.x = absPos.x;
                wickObject.paper.position.y = absPos.y;
                //wickObject.paper.rotate(wickObject.rotation);
                //wickObject.paper.scale(wickObject.scaleX, wickObject.scaleY);
                wickObject.paper.applyMatrix = false;
                wickObject.paper.rotation = wickObject.rotation;
                wickObject.paper.scaling.x = wickObject.scaleX;
                wickObject.paper.scaling.y = wickObject.scaleY;

                wickObject.paper.opacity = wickObject.opacity;
                wickObject.svgStrokeWidth = wickObject.paper.strokeWidth;
                
                wickObject.paper.wick = wickObject;
            }

            paper.project.activeLayer.removeChildren();

            var currentObj = wickEditor.project.getCurrentObject();
            if(!currentObj.isRoot) {
                var fullscreenRect = new paper.Path.Rectangle(
                    new paper.Point(-10000,-10000),
                    new paper.Point(10000,10000))
                fullscreenRect.fillColor = 'rgba(0,0,0,0.2)';
                fullscreenRect._isGUI = 'gui';

                var originPos = currentObj.getAbsolutePosition();
                var path = new paper.Path([100, 100], [100, 200]);
                var path2 = new paper.Path([50, 150], [150, 150]);
                var group = new paper.Group([path, path2]);
                group.strokeColor = '#777777';
                group._isGUI = 'gui';
                path._isGUI = 'gui';
                path2._isGUI = 'gui';

                group.position.x = originPos.x;
                group.position.y = originPos.y;
            }

            var activeObjects = wickEditor.project.getCurrentObject().getAllActiveChildObjects();
            activeObjects.forEach(function (wickObject) {
                if(!wickObject.isSymbol && !wickObject.isPath && !wickObject.isImage) return;

                var layer = wickObject.parentFrame.parentLayer;
                if(layer.locked || layer.hidden) return;

                var newPath = createPathForWickobject(wickObject);
                paper.project.activeLayer.addChild(wickObject.paper);
                wickObject.paper._isPartOfGroup = false;
            });
        }

        wickEditor.project.getCurrentObject().getAllActiveChildObjects().forEach(function (wickObject) {
            if(wickEditor.project.isObjectSelected(wickObject)) {
                if(wickEditor.currentTool == wickEditor.tools.vectorcursor) {
                    wickObject.paper.selected = true;
                } else if(wickEditor.currentTool == wickEditor.tools.selectioncursor) {
                    wickEditor.tools.selectioncursor.forceUpdateSelection();
                }
            }
        });
        
        self.needsUpdate = false;
    }

    self.updateViewTransforms = function () {
        var zoom = wickEditor.canvas.getZoom();
        var pan = wickEditor.canvas.getPan();
        paper.view.matrix = new paper.Matrix();
        paper.view.matrix.translate(new paper.Point(pan.x,pan.y))
        paper.view.matrix.scale(zoom)
    }

    self.getItemAtPoint = function (point, args) {
        if(!args) args = {};
        if(args.tolerance === undefined) args.tolerance = 5;
        var zoom = wickEditor.canvas.getZoom()

        var hitOptions = {
            segments: true,
            fill: true,
            curves: true,
            handles: false,
            stroke: true,
            tolerance: args.tolerance / zoom
        }

        var hitResult = paper.project.hitTest(point, hitOptions);

        if(hitResult && hitResult.item.parent._isPartOfGroup) {
            if(args.allowGroups) {
                hitResult.item = hitResult.item.parent;
            } else {
                hitResult = null;
            }
        }

        if(hitResult && hitResult.item && hitResult.item._isGUI) {
            hitResult = null;
        }

        return hitResult;
    }

 }
