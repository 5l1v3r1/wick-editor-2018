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

if(!window.Tools) Tools = {};

Tools.SelectionCursor = function (wickEditor) {

    var self = this;

    var makingSelectionSquare = false;
    var selectionSquare = null;
    var selectionSquareTopLeft;
    var selectionSquareBottomRight;

    var selectionRect;
    var selectionBoundsRect;
    var scaleBR;
    var scaleTR;
    var scaleTL;
    var scaleBL;
    var scaleT;
    var scaleB;
    var scaleL;
    var scaleR;
    var rotate;

    var GUI_DOTS_SIZE = 5;
    var GUI_DOTS_FILLCOLOR = 'rgba(255,255,255,0.3)';
    var GUI_DOTS_STROKECOLOR = 'rgba(100,150,255,1.0)'

    var hitResult;
    var addedPoint;

    var lastEvent;
    var transformMode;

    this.getCursorImage = function () {
        return "auto"
    };

    this.getToolbarIcon = function () {
        return "resources/tools/Cursor.svg";
    }

    this.getTooltipName = function () {
        return "Selection Cursor (C)";
    }

    this.setup = function () {
        
    }

    this.onSelected = function () {
        wickEditor.canvas.getInteractiveCanvas().needsUpdate = true;
        wickEditor.project.clearSelection();
    }

    this.paperTool = new paper.Tool();

    this.paperTool.onMouseMove = function(event) {
        updateSelection()

        hitResult = wickEditor.canvas.getInteractiveCanvas().getItemAtPoint(event.point, {allowGroups:true});

        if(hitResult && hitResult.item._cursor)
            document.body.style.cursor = hitResult.item._cursor;
        else if (hitResult && !hitResult.item._wickInteraction)
            document.body.style.cursor = 'move';
        else
            wickEditor.canvas.updateCursor();
    }

    this.paperTool.onMouseDown = function(event) {

        if(lastEvent 
        && event.timeStamp-lastEvent.timeStamp<300 
        && event.point.x===lastEvent.point.x
        && event.point.y===lastEvent.point.y) {
            self.paperTool.onDoubleClick(event);
            return;
        }
        lastEvent = event;
        
        hitResult = wickEditor.canvas.getInteractiveCanvas().getItemAtPoint(event.point, {allowGroups:true});

        if(hitResult && hitResult.item && hitResult.item._wickInteraction) {
            transformMode = hitResult.item._wickInteraction
            return;
        }

        if(hitResult && !hitResult.item._wickInteraction) {

            var selectCheckWickObj = hitResult.item.parent.wick;
            var newlySelected = false;
            if(selectCheckWickObj)
                newlySelected = !wickEditor.project.isObjectSelected(selectCheckWickObj)

            var wickObj = hitResult.item.parent.wick;
            if(wickObj) {
                if(!wickEditor.project.isObjectSelected(wickObj)) {
                    if(!event.modifiers.shift) {
                        wickEditor.project.clearSelection();
                    }
                    wickEditor.project.selectObject(wickObj);
                }
                wickEditor.syncInterfaces();
            }

        } else {

            if(!event.modifiers.shift) {
                wickEditor.project.clearSelection();
            }
            wickEditor.syncInterfaces();

            makingSelectionSquare = true;
            selectionSquareTopLeft = event.point;
            selectionSquareBottomRight = event.point
            
        }

        updateSelection()

    }

    this.paperTool.onDoubleClick = function (event) {
        if(hitResult) {
            wickEditor.guiActionHandler.doAction('editObject');
        } else {
            wickEditor.guiActionHandler.doAction('finishEditingObject');
        }
    }

    this.paperTool.onMouseDrag = function(event) {

        if(transformMode === 'scaleBR') {
            var rect = selectionBoundsRect
            wickEditor.project.getSelectedObjects().forEach(function (o) {
                var resizeRatio = event.point.subtract(rect.topLeft);
                resizeRatio.x /= rect.width;
                resizeRatio.y /= rect.height;
                o.paper.scale(resizeRatio.x, resizeRatio.y, rect.topLeft);
                updateSelection()
            });
            return;
        }
        if(transformMode === 'scaleTL') {
            var rect = selectionBoundsRect
            wickEditor.project.getSelectedObjects().forEach(function (o) {
                var resizeRatio = rect.bottomRight.subtract(event.point);
                resizeRatio.x /= rect.width;
                resizeRatio.y /= rect.height;
                o.paper.scale(resizeRatio.x, resizeRatio.y, rect.bottomRight);
                updateSelection()
            });
            return;
        }
        if(transformMode === 'scaleBL') {
            var rect = selectionBoundsRect
            wickEditor.project.getSelectedObjects().forEach(function (o) {
                var resizeRatio = {
                    x: rect.topRight.x - event.point.x,
                    y: event.point.y - rect.topRight.y,
                }
                resizeRatio.x /= rect.width;
                resizeRatio.y /= rect.height;
                o.paper.scale(resizeRatio.x, resizeRatio.y, rect.topRight);
                updateSelection()
            });
            return;
        }
        if(transformMode === 'scaleTR') {
            var rect = selectionBoundsRect
            wickEditor.project.getSelectedObjects().forEach(function (o) {
                var resizeRatio = {
                    x: event.point.x - rect.bottomLeft.x,
                    y: rect.bottomLeft.y - event.point.y,
                }
                resizeRatio.x /= rect.width;
                resizeRatio.y /= rect.height;
                o.paper.scale(resizeRatio.x, resizeRatio.y, rect.bottomLeft);
                updateSelection()
            });
            return;
        }
        if(transformMode === 'scaleT') {
            var rect = selectionBoundsRect
            wickEditor.project.getSelectedObjects().forEach(function (o) {
                var resizeY = rect.bottomCenter.y - event.point.y
                resizeY /= rect.height;
                o.paper.scale(1, resizeY, rect.bottomCenter);
                updateSelection()
            });
            return;
        }
        if(transformMode === 'scaleB') {
            var rect = selectionBoundsRect
            wickEditor.project.getSelectedObjects().forEach(function (o) {
                var resizeY = event.point.y - rect.topCenter.y
                resizeY /= rect.height;
                o.paper.scale(1, resizeY, rect.topCenter);
                updateSelection()
            });
            return;
        }
        if(transformMode === 'scaleR') {
            var rect = selectionBoundsRect
            wickEditor.project.getSelectedObjects().forEach(function (o) {
                var resizeX = event.point.x - rect.leftCenter.x
                resizeX /= rect.width;
                o.paper.scale(resizeX, 1, rect.leftCenter);
                updateSelection()
            });
            return;
        }
        if(transformMode === 'scaleL') {
            var rect = selectionBoundsRect
            wickEditor.project.getSelectedObjects().forEach(function (o) {
                var resizeX = rect.rightCenter.x - event.point.x
                resizeX /= rect.width;
                o.paper.scale(resizeX, 1, rect.rightCenter);
                updateSelection()
            });
            return;
        }
        if(transformMode === 'rotate') {
            var rect = selectionBoundsRect
            var pivot = rect.center;
            var oldAngle = event.lastPoint.subtract(pivot).angle;
            var newAngle = event.point.subtract(pivot).angle;
            var rotationAmount = newAngle-oldAngle;
            wickEditor.project.getSelectedObjects().forEach(function (o) {
                o.paper.rotate(rotationAmount, pivot);
                //updateSelection()
            });
            selectionRect.rotate(rotationAmount, pivot);
            rotate.rotate(rotationAmount, pivot);
            scaleBR.rotate(rotationAmount, pivot);
            scaleBL.rotate(rotationAmount, pivot);
            scaleTR.rotate(rotationAmount, pivot);
            scaleTL.rotate(rotationAmount, pivot);
            scaleT.rotate(rotationAmount, pivot);
            scaleB.rotate(rotationAmount, pivot);
            scaleL.rotate(rotationAmount, pivot);
            scaleR.rotate(rotationAmount, pivot);
            return;
        }

        if(makingSelectionSquare) {
            selectionSquareBottomRight = event.point;

            if(selectionSquare) {
                selectionSquare.remove();
            }

            selectionSquare = new paper.Path.Rectangle(
                    new paper.Point(selectionSquareTopLeft.x, selectionSquareTopLeft.y), 
                    new paper.Point(selectionSquareBottomRight.x, selectionSquareBottomRight.y));
            selectionSquare.strokeColor = 'rgba(100,100,255,0.7)';
            selectionSquare.strokeWidth = 1/wickEditor.canvas.getZoom();
            selectionSquare.fillColor = 'rgba(100,100,255,0.15)';
        } else {
            if(hitResult && hitResult.item) {
                wickEditor.project.getSelectedObjects().forEach(function (o) {
                    o.paper.position = new paper.Point(
                        o.paper.position.x + event.delta.x,
                        o.paper.position.y + event.delta.y
                    );
                });
                updateSelection()
            }
        }

    }

    this.paperTool.onMouseUp = function (event) {

        transformMode = null;

        if(makingSelectionSquare) {
            if(!selectionSquare) {
                selectionSquare = null;
                makingSelectionSquare = false;
                return;
            }

            if(!event.modifiers.shift) {
                wickEditor.project.clearSelection()
            }
            wickEditor.project.getCurrentObject().getAllActiveChildObjects().forEach(function (wickObject) {
                if(selectionSquare.bounds.contains(wickObject.paper.bounds)) {
                    wickEditor.project.selectObject(wickObject)
                }
            });
            wickEditor.syncInterfaces()

            if(selectionSquare) {
                selectionSquare.remove();
            }
            selectionSquare = null;
            makingSelectionSquare = false;
            return;
        }

        if(!hitResult) return;
        if(!hitResult.item) return;

        var objs = wickEditor.project.getSelectedObjects();
        var modifiedStates = [];
        objs.forEach(function (wickObject) {
            var parentAbsPos;
            if(wickObject.parentObject)
                parentAbsPos = wickObject.parentObject.getAbsolutePosition();
            else 
                parentAbsPos = {x:0,y:0};

            if(wickObject.isSymbol) {
                modifiedStates.push({
                    rotation: wickObject.paper.rotation,
                    x: wickObject.paper.position.x,
                    y: wickObject.paper.position.y,
                    scaleX: wickObject.paper.scaling.x,
                    scaleY: wickObject.paper.scaling.y,
                });
            } else if (wickObject.isPath) {
                wickObject.paper.applyMatrix = true;

                wickObject.rotation = 0;
                wickObject.scaleX = 1;
                wickObject.scaleY = 1;
                wickObject.flipX = false;
                wickObject.flipY = false;

                modifiedStates.push({
                    x : wickObject.paper.position.x - parentAbsPos.x,
                    y : wickObject.paper.position.y - parentAbsPos.y,
                    svgX : wickObject.paper.bounds._x,
                    svgY : wickObject.paper.bounds._y,
                    width : wickObject.paper.bounds._width,
                    height : wickObject.paper.bounds._height,
                    pathData : wickObject.paper.exportSVG({asString:true}),
                });
            } else if (wickObject.isImage) {
                modifiedStates.push({
                    x : wickObject.paper.position.x - parentAbsPos.x,
                    y : wickObject.paper.position.y - parentAbsPos.y,
                    scaleX : wickObject.paper.scaling.x,
                    scaleY : wickObject.paper.scaling.y,
                    rotation : wickObject.paper.rotation,
                })
            }
        });
        wickEditor.actionHandler.doAction('modifyObjects', {
            objs: objs,
            modifiedStates: modifiedStates
        });
    }

    self.forceUpdateSelection = function () {
        updateSelection();
    }

    function updateSelection () {
        paper.settings.handleSize = 10;
        paper.project.activeLayer.children.forEach(function (child) {
            if(!child.wick) return;
            if(wickEditor.project.isObjectSelected(child.wick)) {
                if(!selectionBoundsRect) {
                    selectionBoundsRect = child.bounds.clone()
                } else {
                    selectionBoundsRect = selectionBoundsRect.unite(child.bounds);
                }
            }
        });

        selectionBoundsRect = null;

        paper.project.activeLayer.children.forEach(function (child) {
            if(!child.wick) return;
            if(wickEditor.project.isObjectSelected(child.wick)) {
                if(!selectionBoundsRect) {
                    selectionBoundsRect = child.bounds.clone()
                } else {
                    selectionBoundsRect = selectionBoundsRect.unite(child.bounds);
                }
            }
        });

        if(selectionRect) selectionRect.remove();
        if(scaleBR) scaleBR.remove();
        if(scaleBL) scaleBL.remove();
        if(scaleTL) scaleTL.remove();
        if(scaleTR) scaleTR.remove();
        if(scaleT) scaleT.remove();
        if(scaleB) scaleB.remove();
        if(scaleL) scaleL.remove();
        if(scaleR) scaleR.remove();
        if(rotate) rotate.remove();

        if(selectionBoundsRect) {
            //selectionBoundsRect = selectionBoundsRect.expand(10);

            selectionRect = new paper.Path.Rectangle(selectionBoundsRect);
            selectionRect.strokeColor = GUI_DOTS_STROKECOLOR;
            selectionRect.strokeWidth = 1/wickEditor.canvas.getZoom();
            selectionRect._wickInteraction = 'selectionRect';
            selectionRect.locked = true;

            var dotSize = GUI_DOTS_SIZE/wickEditor.canvas.getZoom();

            scaleBR = new paper.Path.Circle(selectionBoundsRect.bottomRight, dotSize);
            scaleBR.fillColor = GUI_DOTS_FILLCOLOR;
            scaleBR.strokeColor = GUI_DOTS_STROKECOLOR;
            scaleBR._wickInteraction = 'scaleBR';
            scaleBR._cursor = 'nwse-resize';

            scaleBL = new paper.Path.Circle(selectionBoundsRect.bottomLeft, dotSize);
            scaleBL.fillColor = GUI_DOTS_FILLCOLOR;
            scaleBL.strokeColor = GUI_DOTS_STROKECOLOR;
            scaleBL._wickInteraction = 'scaleBL';
            scaleBL._cursor = 'nesw-resize';

            scaleTL = new paper.Path.Circle(selectionBoundsRect.topLeft, dotSize);
            scaleTL.fillColor = GUI_DOTS_FILLCOLOR;
            scaleTL.strokeColor = GUI_DOTS_STROKECOLOR;
            scaleTL._wickInteraction = 'scaleTL';
            scaleTL._cursor = 'nwse-resize';

            scaleTR = new paper.Path.Circle(selectionBoundsRect.topRight, dotSize);
            scaleTR.fillColor = GUI_DOTS_FILLCOLOR;
            scaleTR.strokeColor = GUI_DOTS_STROKECOLOR;
            scaleTR._wickInteraction = 'scaleTR';
            scaleTR._cursor = 'nesw-resize';

            scaleT = new paper.Path.Circle(selectionBoundsRect.topCenter, dotSize);
            scaleT.fillColor = GUI_DOTS_FILLCOLOR;
            scaleT.strokeColor = GUI_DOTS_STROKECOLOR;
            scaleT._wickInteraction = 'scaleT';
            scaleT._cursor = 'ns-resize';

            scaleB = new paper.Path.Circle(selectionBoundsRect.bottomCenter, dotSize);
            scaleB.fillColor = GUI_DOTS_FILLCOLOR;
            scaleB.strokeColor = GUI_DOTS_STROKECOLOR;
            scaleB._wickInteraction = 'scaleB';
            scaleB._cursor = 'ns-resize';

            scaleL = new paper.Path.Circle(selectionBoundsRect.leftCenter, dotSize);
            scaleL.fillColor = GUI_DOTS_FILLCOLOR;
            scaleL.strokeColor = GUI_DOTS_STROKECOLOR;
            scaleL._wickInteraction = 'scaleL';
            scaleL._cursor = 'ew-resize';

            scaleR = new paper.Path.Circle(selectionBoundsRect.rightCenter, dotSize);
            scaleR.fillColor = GUI_DOTS_FILLCOLOR;
            scaleR.strokeColor = GUI_DOTS_STROKECOLOR;
            scaleR._wickInteraction = 'scaleR';
            scaleR._cursor = 'ew-resize';

            rotate = new paper.Path.Circle(selectionBoundsRect.topCenter.add(new paper.Point(0,-20/wickEditor.canvas.getZoom())), GUI_DOTS_SIZE/wickEditor.canvas.getZoom());
            rotate.fillColor = GUI_DOTS_FILLCOLOR
            rotate.strokeColor = GUI_DOTS_STROKECOLOR
            rotate._wickInteraction = 'rotate';
            rotate._cursor = 'url("resources/cursor-rotate.png") 32 32,default';
        }
    }

}