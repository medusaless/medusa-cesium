import BaseTool from './basetool.js';
import MEASUREMODE from '../constants/measuremode.js';
import COLLECTIONNAME from '../constants/entitycollectionname';

import DRAWTYPE from '../constants/drawtype';

import Cesium from 'cesium/Cesium';

export default class HeightTool extends BaseTool {
    constructor(AppCesium, mode) {
        super(AppCesium, mode)
        this.App = AppCesium;
        this.viewer = AppCesium.viewer;
        this.drawTool = AppCesium.drawTool;

        // Ellipsoid平面测量，Terrain地形测量
        this._vertexEntities = [];

        this.mode = mode || MEASUREMODE.TERRAIN;
        this.entityManager = AppCesium.entityManager;
        this.collectionName = COLLECTIONNAME.HEIGHT;
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
        var vertexes = geometryObj.vertexes;
        if (geometryObj.vertexCnt >= 2) {
            var h1 = this.getHeight(vertexes[geometryObj.vertexCnt - 1]), h2 = this.getHeight(vertexes[geometryObj.vertexCnt - 2]);
            var labelText = '高程差:' + (h1 - h2).toFixed(3) + '米';
            this.addLabel(vertexes[geometryObj.vertexCnt - 1], labelText)
        }
        this.addVertex(vertexes[geometryObj.vertexCnt - 1]);
    }

    onRightClick(event, geometryObj) {
        var labelText;
        var vertexes = geometryObj.vertexes;
        var h1 = this.getHeight(vertexes[geometryObj.vertexCnt - 1]), h2 = this.getHeight(vertexes[geometryObj.vertexCnt - 2]);
        labelText = '高程差:' + (h1 - h2).toFixed(3) + '米';
        this.addLabel(vertexes[geometryObj.vertexCnt - 1], labelText);
        this.addVertex(vertexes[geometryObj.vertexCnt - 1]);
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

    getHeight(point) {
        if (this.calculationFunc) {
            return this.calculationFunc(point);
        }

        return Cesium.Cartographic.fromCartesian(point, Cesium.Ellipsoid.WGS84, new Cesium.Cartographic()).height;
    }
}
