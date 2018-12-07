import BaseTool from './basetool.js';
import MEASUREMODE from '../constants/measuremode.js';
import COLLECTIONNAME from '../constants/entitycollectionname';

import DRAWTYPE from '../constants/drawtype';

import Cesium from 'cesium/Cesium';

export default class AreaTool extends BaseTool {
    constructor(AppCesium, mode) {
        super(AppCesium, mode)
        this.App = AppCesium;
        this.viewer = AppCesium.viewer;
        this.drawTool = AppCesium.drawTool;

        // Ellipsoid平面测量，Terrain地形测量
        this.mode = mode || MEASUREMODE.TERRAIN;
        this.entityManager = AppCesium.entityManager;
        this.collectionName = COLLECTIONNAME.AREA;

        this._vertexEntities = [];
        this.calculationFunc = undefined;
        this._removeLeftClickCallback = function () { };
        this._removeRightClickCallback = function () { };

        this.collectionName = COLLECTIONNAME.AREA;

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
        this.drawTool.drawType = DRAWTYPE.POLYGON;
        this.drawTool.mode = this.mode;
        this.drawTool.activate();
    }
    
    deActivate() {
        this._removeLeftClickCallback();
        this._removeRightClickCallback();
        this.drawTool.deActivate();
    }

    onLeftClick(event, geometryObj) {
        var point = this.App.getGroundPoint(event.position, this.mode);
        var entity = this.addVertex(point)
        if(geometryObj.vertexCnt <= 2){
            this._vertexEntities.push(entity);
        }
    }

    onRightClick(event, geometryObj) {
        var point;
        var labelText;
        var area = 0;
        var vertexes = geometryObj.vertexes;
        if (vertexes.length >= 3) {
            point = vertexes[vertexes.length - 1];
            area = this.getArea(vertexes);
            labelText = '总面积:' + area < 1000000
                ? area.toFixed(3) + '平方米'
                : (area / 1000000).toFixed(3) + '平方公里';
            this.addLabel(point, labelText)
            this.addVertex(point);
        } else {
            this.App.entityManager.removeEntity(this.collectionName, this._vertexEntities[0])
            this.App.entityManager.removeEntity(this.collectionName, this._vertexEntities[1])
        }
        this._vertexEntities = [];
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

    // 经纬度计算球面坐标
    getArea(points) {
        if (this.calculationFunc) {
            return this.calculationFunc(points);
        }

        var metersPerDegree = 2.0 * Math.PI * 6371000 / 360.0;
        var radiansPerDegree = Math.PI / 180.0;
        var area = 0;
        var points = Cesium.Ellipsoid.WGS84.cartesianArrayToCartographicArray(points);
        points = points.map(function (point) {
            var lon = Cesium.Math.toDegrees(point.longitude);
            var lat = Cesium.Math.toDegrees(point.latitude);
            return {
                lon: lon,
                lat: lat
            }
        });

        for (var i = 0; i < points.length; ++i) {
            var j = (i + 1) % points.length;
            var xi = points[i].lon * metersPerDegree * Math.cos(points[i].lat * radiansPerDegree);
            var yi = points[i].lat * metersPerDegree;
            var xj = points[j].lon * metersPerDegree * Math.cos(points[j].lat * radiansPerDegree);
            var yj = points[j].lat * metersPerDegree;
            area += xi * yj - xj * yi;
        }
        return Math.abs(area / 2);
    }
}
