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

Tools.Polygon = function (wickEditor) {

    var that = this;

    this.getCursorImage = function () {
        return "crosshair"
    };

    this.getToolbarIcon = function () {
        return "resources/tools/Polygon.svg";
    }

    this.getTooltipName = function () {
        return "Polygon";
    }

    this.setup = function () {

    }

    this.paperTool = new paper.Tool();

    

    this.paperTool.onMouseDown = function(event) {

    }

    this.paperTool.onMouseMove = function(event) {

    }

    this.paperTool.onMouseDrag = function(event) {

    }

    this.paperTool.onMouseUp = function (event) {

    }

}