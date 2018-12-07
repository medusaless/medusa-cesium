import BaseTool from './basetool.js';
import MEASUREMODE from '../constants/measuremode.js';
import COLLECTIONNAME from '../constants/entitycollectionname';

import DRAWTYPE from '../constants/drawtype';

import Cesium from 'cesium/Cesium';

export default class DistanceTool extends BaseTool {
    constructor(AppCesium, mode) {
        super(AppCesium, mode)
        this.App = AppCesium;
        this.viewer = AppCesium.viewer;
        this.drawTool = AppCesium.drawTool;

        this.mode = mode || MEASUREMODE.TERRAIN;
        this.entityManager = AppCesium.entityManager;
        this.collectionName = COLLECTIONNAME.DISTANCE;
        this.calculationFunc = undefined;
        this._removeLeftClickCallback = function () { };
        this._removeRightClickCallback = function () { };

        this.labelOptions = {
            font: '12pt sans-serif',
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
            verticalOrigin: Cesium.VerticalOrigin.BASELINE,
            fillColor: Cesium.Color.BLACK,
            showBackground: true,
            backgroundColor: new Cesium.Color(1, 1, 1, 0.7),
            backgroundPadding: new Cesium.Cartesian2(8, 4),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
        };

        this.vertexOptions = {
            color: Cesium.Color.WHITE,
            pixelSize: 10,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 1,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
        };
    }

    activate() {
        this.deActivate();
        this._removeLeftClickCallback = this.drawTool.leftClickEvent.addEventListener(this.onLeftClick, this);
        this._removeRightClickCallback = this.drawTool.rightClickEvent.addEventListener(this.onRightClick, this);
        this.drawTool.mode = this.mode;
        this.drawTool.drawType = DRAWTYPE.POLYLINE;
        this.drawTool.activate();
    }

    
    deActivate() {
        this._removeLeftClickCallback();
        this._removeRightClickCallback();
        this.drawTool.deActivate();
    }

    onLeftClick(event, geometryObj) {
        debugger;
        var point = this.App.getGroundPoint(event.position, this.mode);
        var labelText;
        var distance;
        var startPoint;
        var endPoint;
        var vertexes = geometryObj.vertexes;
        if (geometryObj.vertexCnt >= 2) {
            startPoint = vertexes[geometryObj.vertexCnt - 2];
            endPoint = vertexes[geometryObj.vertexCnt - 1];
            distance = this.getDistance(startPoint, endPoint);
            labelText = distance < 1000
                ? distance.toFixed(3) + '米'
                : (distance / 1000).toFixed(3) + '公里';

            this.addLabel(point, labelText)
        }
        this.addVertex(point);
    }

    onRightClick(event, geometryObj) {
        debugger;
        var point;
        var labelText;
        var distance = 0;
        var vertexes = geometryObj.vertexes;

        if (vertexes.length >= 2) {
            for (var i = 0; i < vertexes.length - 1; i++) {
                distance += this.getDistance(vertexes[i], vertexes[i + 1]);
                if (i == vertexes.length - 2) {
                    point = vertexes[i + 1];
                }
            }
            labelText = '总距离:' + (distance < 1000
                ? distance.toFixed(3) + '米'
                : (distance / 1000).toFixed(3) + '公里');
            this.addLabel(point, labelText)
            this.addVertex(point);
        } 
    }


    addVertex(position) {
        var entity = new Cesium.Entity({
            position: position,
            point: this.vertexOptions
        });

        this.entityManager.addEntity(this.collectionName, entity);
        return entity;
    }

    addLabel(position, text) {
        var option = $.extend(true, {}, this.labelOptions, { text });
        var entity = new Cesium.Entity({
            position: position,
            label: option
        });
        this.entityManager.addEntity(this.collectionName, entity);
    }

    getDistance(startPoint, endPoint) {
        if (this.calculationFunc) {
            return this.calculationFunc(startPoint, endPoint);
        }

        var totalDistanceInMeters = 0;
        var positions = [startPoint, endPoint];
        var surfacePositions = Cesium.PolylinePipeline.generateArc({
            positions: positions
        });
        var scratchCartesian3 = new Cesium.Cartesian3();
        var surfacePositionsLength = surfacePositions.length;

        for (var i = 3; i < surfacePositionsLength; i += 3) {
            scratchCartesian3.x = surfacePositions[i] - surfacePositions[i - 3];
            scratchCartesian3.y = surfacePositions[i + 1] - surfacePositions[i - 2];
            scratchCartesian3.z = surfacePositions[i + 2] - surfacePositions[i - 1];
            totalDistanceInMeters += Cesium.Cartesian3.magnitude(scratchCartesian3);
        }

        return totalDistanceInMeters;
    }
}
