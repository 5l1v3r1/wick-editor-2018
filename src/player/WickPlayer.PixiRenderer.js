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

var WickPixiRenderer = function (canvasContainer) {

    var self = this;

    var SVG_SCALE = 1.5;

    renderer = PIXI.autoDetectRenderer(720, 480, {
        backgroundColor : "#FFFFFF", 
        resolution: window.devicePixelRatio,
        preserveDrawingBuffer: true,
        antialias: true,
    });
    renderer.clearBeforeRender = false;
    renderer.roundPixels = false;
    renderer.view.setAttribute('tabindex', 0);

    canvasContainer.appendChild(renderer.view);
    renderer.view.focus()

    var currentProjectUUID = null;
    var container = new PIXI.Container();
    var pixiSprites = {};

    self.renderWickObjects = function (project, wickObjects) {
        if(currentProjectUUID !== project.uuid) {
            currentProjectUUID = project.uuid;
            preloadAllAssets(project);
        }

        if(renderer.width !== project.width || renderer.height !== project.height) {
            renderer.resize(project.width, project.height);
            renderer.view.style.width  = project.width  + "px";
            renderer.view.style.height = project.height + "px";
        }

        var graphics = new PIXI.Graphics();
        graphics.beginFill(parseInt(project.backgroundColor.replace("#","0x")));
        graphics.drawRect(0, 0, project.width, project.height);
        graphics.endFill();
        renderer.render(graphics);

        for (uuid in pixiSprites) {
            pixiSprites[uuid].visible = false;
        }

        wickObjects.forEach(function (wickObject) {
            renderWickObject(wickObject);
        });
        renderer.render(container);
    }

    function renderWickObject (wickObject) {
        var sprite = pixiSprites[wickObject.uuid];
        if(!sprite) {
            createPixiSprite(wickObject);
        }
        if(sprite) {
            sprite.visible = true;
            sprite.anchor = new PIXI.Point(0.5, 0.5);
            var textureScale = (wickObject.pathData || wickObject.textData ? SVG_SCALE : 1);

            var absTransforms = wickObject.getAbsoluteTransformations();
            sprite.position.x = absTransforms.position.x;
            sprite.position.y = absTransforms.position.y;
            sprite.rotation = absTransforms.rotation/360*2*3.14159;
            sprite.scale.x = absTransforms.scale.x/textureScale;
            sprite.scale.y = absTransforms.scale.y/textureScale;
            sprite.alpha = absTransforms.opacity;
            sprite.scale.x *= (absTransforms.flip.x ? -1 : 1);
            sprite.scale.y *= (absTransforms.flip.y ? -1 : 1);
        }

        wickObject.getAllActiveChildObjects().forEach(function (child) {
            renderWickObject(child);
        });
    }

    function preloadAllAssets (project) {
        project.getAllObjects().forEach(function (wickObject) {
            createPixiSprite(wickObject);
        })
    }

    function createPixiSprite (wickObject) {
        var type;

        if (wickObject.asset && wickObject.asset.type === 'image') {
            type = 'image';
        } else if (wickObject.pathData) {
            type = 'svg';
        } else if (wickObject.textData) {
            type = 'text';
        }

        if(type) {
            var newPixiSprite = WickToPixiSprite[type](wickObject);
            container.addChild(newPixiSprite);
            pixiSprites[wickObject.uuid] = newPixiSprite;
            //wickObject.generateAlphaMask(newPixiSprite.texture.baseTexture.imageUrl);
        }
        
    }

    var WickToPixiSprite = {
        'image': function (wickObject) {
            var pixiSprite = PIXI.Sprite.fromImage(wickObject.asset.getData());
            return pixiSprite;
        },
        'svg': function (wickObject) {
            var parser = new DOMParser();
            var x = (wickObject.svgX || 0);
            var y = (wickObject.svgY || 0);
            if(!wickObject.svgStrokeWidth) wickObject.svgStrokeWidth = 0;
            x -= wickObject.svgStrokeWidth/2;
            y -= wickObject.svgStrokeWidth/2;
            var w = (wickObject.width  + wickObject.svgStrokeWidth*1);
            var h = (wickObject.height + wickObject.svgStrokeWidth*1);
            var svgDoc = parser.parseFromString('<svg id="svg" viewBox="'+x+' '+y+' '+w+' '+h+'" version="1.1" width="'+w+'" height="'+h+'" xmlns="http://www.w3.org/2000/svg">'+wickObject.pathData+'</svg>', "image/svg+xml");
            var s = new XMLSerializer().serializeToString(svgDoc);
            var base64svg = 'data:image/svg+xml;base64,' + window.btoa(s);
            
            var texture = PIXI.Texture.fromImage(base64svg, undefined, undefined, SVG_SCALE);
            var newSprite = new PIXI.Sprite(texture);
            return newSprite;
        },
        'text': function (wickObject) {
            var style = {
                font : wickObject.textData.fontWeight + " " + wickObject.textData.fontStyle + " " + (wickObject.textData.fontSize*SVG_SCALE) + "px " + wickObject.textData.fontFamily,
                fill : wickObject.textData.fill,
                wordWrap : true,
                wordWrapWidth : 1440,
                align: wickObject.textData.textAlign
            };
            var pixiText = new PIXI.Text(wickObject.textData.text, style);
            return pixiText;
        }
    }

};
