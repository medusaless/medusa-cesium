import Cesium from 'cesium/Cesium';
import MEASUREMODE from '../constants/measuremode';

var DEFAULT_OPTIONS = {
    POINT: {
        color: Cesium.Color.fromRandom({
            red: 255,
            alpha: 1
        }),
        pixelSize: 11
    },
    POLYLINE: {
        width: 2,
        material: new Cesium.ColorMaterialProperty(Cesium.Color.fromRandom({
            red: 255,
            alpha: 0.7
        }))
    },
    POLYGON: {
        material: new Cesium.ColorMaterialProperty(Cesium.Color.fromRandom({
            red: 255,
            alpha: 0.7
        }))
    },
    BILLBOARD: function (iconUrl) {
        return {
            image: require('../assets/' + (iconUrl || this.defaultIconUrl)),
            scale: 0.6
        };
    }
}

export default {
    DEFAULT_OPTIONS,
    
    getClampPoints(cartographicArr, pointHeightLevel) {
        var pointHeightLevel = pointHeightLevel || this.options.terrain.pointHeightLevel;
        if (typeof pointHeightLevel === 'undefined') {
            throw new Error('pointHeightLevel is not defined neither in function parameter or terrain config');
        }

        return Cesium.sampleTerrain(
            this.viewer.terrainProvider,
            pointHeightLevel || this.options.terrain.pointHeightLevel,
            cartographicArr
        ).then(function (updatedCartographics) {
            return updatedCartographics;
        });
    },

    zoomToExtent(west, south, east, north) {
        east += 0.0000001;
        north += 0.0000001;
        west -= 0.0000001;
        south -= 0.0000001;

        this.viewer.camera.setView({
            destination: Cesium.Rectangle.fromDegrees(west, south, east, north)
        });
    },

    /**
 * 获取鼠标点击处的最薄
 * @param {*} position Cartesian2：屏幕坐标
 * @param {*} mode 地形/平面
 */

    getGroundPoint(position, mode) {
        var point = null;
        switch (mode) {
            case MEASUREMODE.TERRAIN:
                var ray = this.viewer.camera.getPickRay(position);
                point = this.viewer.scene.globe.pick(ray, this.viewer.scene);
                break;
            case MEASUREMODE.ELLIPSOID:
                point = this.viewer.camera.pickEllipsoid(position);
                break;
        }
        return point;
    },

    /**
            * 
            * @param {*} points 经纬度数组：[[lng,lat], [lng,lat]]
            */
    zoomToPoints(points, mode) {
        var length = points.length;
        var destination;
        var mode = mode || 'ZOOM';
        if (length === 1) {
            var lon = points[0][0];
            var lat = points[0][1];
            var height = points[0][2];
            destination = Cesium.Cartesian3.fromDegrees(lon, lat, height);
        } else {
            var maxLat = 0;
            var maxLon = 0;
            var minLon = 0;
            var minLat = 0;

            // sort longitude
            points.sort(function (currPoint, nextPoint) {
                var currLon = currPoint[0] - 0;
                var nextLon = nextPoint[0] - 0;
                return currLon - nextLon;
            });
            minLon = points[0][0];
            maxLon = points[length - 1][0];

            // sort latitude
            points.sort(function (currPoint, nextPoint) {
                var currLon = currPoint[1] - 0;
                var nextLon = nextPoint[1] - 0;
                return currLon - nextLon;
            });
            minLat = points[0][1];
            maxLat = points[length - 1][1];

            minLon -= 0.01;
            maxLon += 0.01;
            minLat -= 0.01;
            maxLat += 0.01;

            var rectangle = Cesium.Rectangle.fromDegrees(minLon, minLat, maxLon, maxLat);
            destination = rectangle;
        }

        if (mode === 'ZOOM') {
            this.viewer.camera.setView({
                destination: destination
            });
        } else if (mode === 'FLY') {
            this.viewer.camera.flyTo({
                destination: destination
            });
        }
    },

    /**
        * @param {*} cartographicPoints Cartesian2：弧度数组
        * @param {*} datasourceId datasource的id
        * @param {*} options 
        * {
        *    clampToGround, pointHeightLvel, iconUrl
        * }
        */
    async drawPoint(cartographicPoints, datasourceId, options = {}) {
        var { clampToGround, pointHeightLevel } = options;
        var _options = $.extend(DEFAULT_OPTIONS.POINT, options);

        var _c2points = $.extend(true, [], cartographicPoints);
        if (clampToGround) {
            _c2points = await this.getClampPoints(_c2points, pointHeightLevel);
        }

        var entities = [];
        for (var i = 0; i < _c2points.length; i++) {
            var entity = new Cesium.Entity({
                position: Cesium.Cartesian3.fromRadians(
                    _c2points[i].longitude,
                    _c2points[i].latitude,
                    _c2points[i].height),
                point: _options
            });
            entities.push(this.entityManager.addEntity(datasourceId, entity))
        };
        return entities;
    },

    async drawBillboard(cartographicPoints, datasourceId, options = {}) {
        var { clampToGround, pointHeightLevel, iconUrl } = options;
        var _options = $.extend(DEFAULT_OPTIONS.BILLBOARD(iconUrl), options);

        var _c2points = $.extend(true, [], cartographicPoints);
        if (clampToGround) {
            _c2points = await this.getClampPoints(_c2points, pointHeightLevel);
        }

        var entities = [];
        for (var i = 0; i < _c2points.length; i++) {
            var entity = new Cesium.Entity({
                position: Cesium.Cartesian3.fromRadians(
                    _c2points[i].longitude,
                    _c2points[i].latitude,
                    _c2points[i].height),
                billboard: _options
            });
            entities.push(this.entityManager.addEntity(datasourceId, entity))
        }
        return entities;
    },

    /**
     * 
     * @param {*} cartographicPoints  [[polyline1 points],[polyline2 points], ...]
     * @param {*} datasourceId 
     * @param {*} options 
     */
    async drawPolyline(cartographicPoints, datasourceId, options) {
        var { clampToGround, pointHeightLevel } = options;
        var _options = $.extend(DEFAULT_OPTIONS.POLYLINE, options);

        var _c2points = $.extend(true, [], cartographicPoints);
        var _c2points = _c2points.reduce((prev, curr) => {
            return prev.concat(curr);
        });
        if (clampToGround) {
            _c2points = await this.getClampPoints(_c2points, pointHeightLevel);
        }

        var startIndex = 0;
        var endIndex = 0;
        var entities = [];
        for (var i = 0; i < cartographicPoints.length; i++) {
            startIndex += endIndex;
            endIndex = startIndex + cartographicPoints[i].length;
            var lineCartesian3s = [];
            for (var j = startIndex; j < endIndex; j++) {
                lineCartesian3s.push(_c2points[j].longitude, _c2points[j].latitude, _c2points[j].height);
            }
            _options.positions = Cesium.Cartesian3.fromRadiansArrayHeights(lineCartesian3s)
            var entity = new Cesium.Entity({
                polyline: _options
            });
            entities.push(this.entityManager.addEntity(datasourceId, entity));
        }
        return entities;
    },
    /**
     * 
     * @param {*} cartographicPoints [[polygon1 points],[[polygon2 points], ...]
     * @param {*} datasourceId 
     * @param {*} options 
     */
    async drawPolygon(cartographicPoints, datasourceId, options) {
        var { clampToGround, pointHeightLevel } = options;
        var _options = $.extend(DEFAULT_OPTIONS.POLYGON, options);

        var _c2points = $.extend(true, [], cartographicPoints)
            .reduce((prev, curr) => {
                return prev.concat(curr);
            });


        if (clampToGround) {
            _c2points = await this.getClampPoints(_c2points, pointHeightLevel);
        }

        var startIndex = 0;
        var endIndex = 0;
        var entities = [];
        for (var i = 0; i < cartographicPoints.length; i++) {
            startIndex += endIndex;
            endIndex = startIndex + cartographicPoints[i].length;
            var lineCartesian3s = [];
            for (var j = startIndex; j < endIndex; j++) {
                lineCartesian3s.push(_c2points[j].longitude, _c2points[j].latitude, _c2points[j].height);
            }
            _options.hierarchy = Cesium.Cartesian3.fromRadiansArrayHeights(lineCartesian3s);
            var entity = new Cesium.Entity({
                polygon: _options
            });
            entities.push(this.entityManager.addEntity(datasourceId, entity));
        }
        return entities;
    }
}