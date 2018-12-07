import DRAWTYPE from '../constants/drawtype';
import MEASUREMODE from '../constants/measuremode.js';
import COLLECTIONNAME from '../constants/entitycollectionname';

import Cesium from 'cesium/Cesium';

export default class DrawTool {
    constructor(app, options) {
        this.App = app;

        this._isDrawingStart = true;
        this._isDrawingFinish = false;

        this.mode = options.mode;
        this.drawType = options.drawType;

        this.geometryPool = { POLYLINE: [], POLYGON: [] };
        this.currGeometryObj = undefined;
        this.geometryIndex = -1;

        this.vertexOptions = {
            color: Cesium.Color.WHITE,
            pixelSize: 10,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 1,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
        };

        this.lineOptions = {
            width: 2,
            material: new Cesium.ColorMaterialProperty(Cesium.Color.WHITE)
        }

        this.polygonOptions = {
            outline: true,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 3,
            material: new Cesium.ColorMaterialProperty(Cesium.Color.WHITE.withAlpha(0.7))
        };

        this.drawStartEvent = new Cesium.Event();
        this.drawEndEvent = new Cesium.Event();
        this.leftClickEvent = new Cesium.Event();
        this.rightClickEvent = new Cesium.Event();
        this.mouseMoveEvent = new Cesium.Event();

        this.eventHandler = null;
        this._onLeftClickHandler = this._onLeftClickHandler.bind(this);
        this._onRightClickHandler = this._onRightClickHandler.bind(this);
        this._onMouseMoveHandler = this._onMouseMoveHandler.bind(this);
    }

    bindEvent() {
        this.eventHandler = new Cesium.ScreenSpaceEventHandler(this.App.viewer.canvas);
        this.eventHandler.setInputAction(this._onLeftClickHandler, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        this.eventHandler.setInputAction(this._onRightClickHandler, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
        this.eventHandler.setInputAction(this._onMouseMoveHandler, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    }

    activate() {
        this.deActivate();
        this.bindEvent();
    }

    deActivate() {
        this.currGeometryObj = undefined;
        if (this.eventHandler) {
            this.eventHandler.destroy();
            this.eventHandler = null;
        }
    }

    _onLeftClickHandler(event) {
        var point = this.App.getGroundPoint(event.position, this.mode);
        if (this._isDrawingStart) {
            var geometryObj = {
                vertexes: [],
                vertexCnt: 0,
                entity: null
            };

            if (this.drawType === DRAWTYPE.POLYLINE) {
                var entity = getPolylineEntity(geometryObj, this.mode, this.lineOptions);
                geometryObj.vertexes.push(point);
                this.App.entityManager.addEntity(COLLECTIONNAME.DISTANCE, entity);
            } else if (this.drawType === DRAWTYPE.POLYGON) {
                var entity = getPolygonEntity(geometryObj, this.mode, this.polygonOptions);
                geometryObj.vertexes.push(point);
                this.App.entityManager.addEntity(COLLECTIONNAME.AREA, entity);
            }

            geometryObj.vertexCnt++;
            geometryObj.entity = entity;
            
            this.geometryPool[this.drawType].push(geometryObj);
            this.currGeometryObj = geometryObj;
            this._isDrawingStart = false;
            this._isDrawingFinish = false;
            this.drawStartEvent.raiseEvent(event, $.extend(true, {}, this.currGeometryObj))
        } else {
            this.currGeometryObj.vertexCnt++;
            if (this.drawType === DRAWTYPE.POLYLINE) {
                this.currGeometryObj.vertexes.push(point);
            } else if (this.drawType === DRAWTYPE.POLYGON) {
                this.currGeometryObj.vertexes.push(point);
            }
        }

        this.leftClickEvent.raiseEvent(event, $.extend(true, {}, this.currGeometryObj))
    }

    _onRightClickHandler(event) {
        if(this._isDrawingFinish){
            return;
        }
        this.currGeometryObj.vertexCnt++;
        this._isDrawingStart = true;
        this._isDrawingFinish = true;
        this.rightClickEvent.raiseEvent(event, $.extend(true, {}, this.currGeometryObj))
        this.drawEndEvent.raiseEvent(event, $.extend(true, {}, this.currGeometryObj))
    }

    _onMouseMoveHandler(event) {
        if (this._isDrawingFinish || !this.currGeometryObj) {
            return;
        }

        var point = this.App.getGroundPoint(event.endPosition, this.mode);
        var vertexes = this.currGeometryObj.vertexes;
        if (this.drawType === DRAWTYPE.POLYLINE) {
            if (vertexes.length === 1) {
                vertexes.push(point);
            } else {
                vertexes[vertexes.length - 1] = point;
            }
        } else if (this.drawType === DRAWTYPE.POLYGON) {
            if (vertexes.length == 2) {
                vertexes.push(point);
            } else if (vertexes.length > 2) {
                vertexes.pop();
                vertexes.push(point);
            }
        }

        this.mouseMoveEvent.raiseEvent(event, $.extend(true, {}, this.currGeometryObj))
    }
}

function getPolylineEntity(polylineObj, mode, polylineOptions) {
    var positions = new Cesium.CallbackProperty(function () {
        return polylineObj.vertexes;
    }, false);

    var _option = {};
    if (mode === MEASUREMODE.TERRAIN) {
        _option = $.extend(true, {}, polylineOptions, { positions, clampToGround: true })
    } else if (mode === MEASUREMODE.ELLIPSOID) {
        _option = $.extend(true, {}, polylineOptions, { positions })
    }

    return new Cesium.Entity({
        polyline: _option
    });
}

function getPolygonEntity(polygonObj, mode, polygonOptions) {
    var positions = new Cesium.CallbackProperty(function () {
        return polygonObj.vertexes;
    }, false);

    var option = $.extend(true, {}, polygonOptions);
    option.hierarchy = positions;

    return new Cesium.Entity({
        polygon: option
    });
}