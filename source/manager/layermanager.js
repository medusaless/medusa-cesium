import LayerResources from '../layer/resources';
import LAYERTYPE from '../constants/layertype';
import LAYERBASETYPE from '../constants/layerbasetype';
import comLib from '../utils/comLib';
import Cesium from 'cesium/Cesium';

export default class LayerManager {
    constructor(app) {
        this.app = app;
        this.layerConfigs = app.layerConfigs;
        this.entityManager = app.entityManager;
        this.viewer = app.viewer;
    }

    init() {
        this.layerConfigs.forEach(layerConfig => {
            this.addLayer(layerConfig);
        });
    }

    addLayer(layerConfig) {
        var { displayType, layers, url, id, show, layerOptions } = layerConfig;

        if (this.validateLayerId(id) === false) {
            throw new Error('duplicate layer id or undefined when called addLayer');
        }

        if (!this.app.getLayerConfigById(id)) {
            this.layerConfigs.push(layerConfig);
        }

        if (displayType === LAYERTYPE.RESOURCELAYER) {
            this.addResourceLayer(layerConfig);
        } else if (displayType === LAYERTYPE.ARCGISQUERYLAYER) {
            this.addArcgisEntityLayer(layerConfig);
        } else if (displayType === LAYERTYPE.ARCGISLAYER) {
            this.addArgcisLayer(id, url, layers, show, layerOptions);
        } else if (displayType === LAYERTYPE.URLTEMPLATELAYER) {
            this.addUrlTemplateLayer(id, url, show, layerOptions);
        } else if (displayType === LAYERTYPE.WMSLAYER) {
            this.addWMSLayer(id, url, layers, show, layerOptions);
        }
    }

    removeLayer(id) {
        var layerConfig = this.app.getLayerConfigById(id);
        var { layer, type } = this.findLayerById(id);

        if (type === LAYERBASETYPE.ENTITYLAYER) {

            this.entityManager.removeEntities(id)

        } else if (type === LAYERBASETYPE.IMAGERYLAYER) {

            this.viewer.imageryLayers.remove(layer);

        } else {

            console.info('layer not found');
        }

        layerConfig && comLib.removeArray(this.app.layerConfigs, layerConfig);
    }

    addResourceLayer(layerConfig) {
        var resourceLayer = LayerResources[layerConfig.resourceName];
        if (resourceLayer) {
            var layer = this.viewer.imageryLayers.addImageryProvider(resourceLayer);
            layer._layerId = layerConfig.id;
        }
    }

    addArcgisEntityLayer(layerConfig) {
        var { id, url, displayType, show, url } = layerConfig
        var self = this;
        this.entityManager.addCollection(id);
        if (!show) {
            this.entityManager.hideCollection(id);
        }

        $.ajax({
            url: this.reduceQueryFields(id, url),
            dataType: 'json'
        }).done(function (queryResult) {
            self.fillArcgisEntityCollection(
                id,
                queryResult.geometryType,
                queryResult.features
            )
        }).fail(function () {
            console.log('arcgis feature query fail');
        });
    }

    fillArcgisEntityCollection(id, geometryType, features) {
        switch (geometryType) {
            case 'esriGeometryPoint':
                var { iconUrl, clampToGround } = this.app.getLayerConfigById(id);
                var cartographicFeatures = features.map((feature) => {
                    return {
                        geometry: Cesium.Cartographic.fromDegrees(feature.geometry.x, feature.geometry.y),
                        attributes: feature.attributes
                    }
                });
                this.drawArcgisPointEntities(id, iconUrl, clampToGround, cartographicFeatures);
                break;
            case 'esriGeometryPolygon':
                //  drawArcgisPolygonEntity(layerName, geometryType, features, false);
                break;
            case 'esriGeometryPolyline':
                //  drawArcgisPolylineEntity(layerName, geometryType, features);
                break;
        }
    }

    drawArcgisPointEntities(id, iconUrl, clampToGround, cartographicFeatures) {
        this.entityManager.addCollection(id);
        var cartographicPoints = cartographicFeatures.map(cartographicFeatures => cartographicFeatures.geometry);
        if (clampToGround) {
            this.app
                .drawBillboard(cartographicPoints, id, { clampToGround: true, iconUrl })
                .then(entities => {

                    /**
                     * add arcgis feature attributes to entity
                     * 
                     * optimize:loop twice?
                     */
                    entities.forEach(function (entity, idx) {
                        entity._eAttribute = cartographicFeatures[idx].attributes;
                        entity._layerId = id;
                    });
                });
        }
    }

    getImageryLayerById(id) {
        var layer;
        var imageryLayers = this.viewer.imageryLayers;
        for (var i = 0; i < imageryLayers.length; i++) {
            layer = imageryLayers.get(i);
            if (layer._layerId === id) {
                break;
            }
        }
        return layer;
    }

    getImageryLayerByConstructorName(name) {
        var results = [];
        var imageryLayers = this.viewer.imageryLayers;
        for (var i = 0; i < imageryLayers.length; i++) {
            var imageryLayer = imageryLayers.get(i);
            var constructorName = imageryLayer.imageryProvider.constructor.name;
            if (constructorName === name) {
                results.push(imageryLayer);
            }
        }
        return results;
    }

    addArgcisLayer(id, url, layers, show, options) {
        var layerOption = $.extend({
            url,
            layers
        }, options);

        var layer = this.viewer.imageryLayers.addImageryProvider(new Cesium.ArcGisMapServerImageryProvider(layerOption));
        layer._layerId = id;
        layer.show = show;
        return layer;
    }

    addUrlTemplateLayer(id, url, show, options) {
        var layerOption = $.extend({
            url
        }, options);

        var layer = this.viewer.imageryLayers.addImageryProvider(new Cesium.UrlTemplateImageryProvider(layerOption));
        layer._layerId = id;
        layer.show = show;
        return layer;
    }

    addWMSLayer(id, url, layers, show, options) {
        var layerOption = $.extend({
            url,
            layers
        }, options);

        var layerProvider = new Cesium.WebMapServiceImageryProvider(layerOption);
        var layer = this.viewer.imageryLayers.addImageryProvider(layerProvider);
        layer._layerId = id;
        layer.show = show;
        return layer;
    }

    /**
     * 根据配置信息的fields字段，指定arcgis server返回哪些字段
     * @param {*} layerConfig 
     */

    validateLayerId(id) {
        return id && !Object.keys(this.layerConfigs).includes(id);
    }

    reduceQueryFields(layerId, url) {
        var identityConfigs = this.app.identityConfigs;

        if (identityConfigs) {
            var config = identityConfigs.find(cfg => cfg.id == layerId) || {};
            return `${url}/query?where=1%3D1&outFields=${config.fields || ''}&f=json`;
        } else {
            return `${url}/query?where=1%3D1&outFields=&f=json`;
        }
    }

    setVisibility(id, visible) {
        var { layer, type } = this.findLayerById(id);

        if (type === LAYERBASETYPE.ENTITYLAYER) {

            visible
                ? this.entityManager.showCollection(id)
                : this.entityManager.hideCollection(id)

        } else if (type === LAYERBASETYPE.IMAGERYLAYER) {

            layer.show = visible;

        } else {
            console.info('layer not found');
        }
    }

    findLayerById(id) {
        var layer = this.entityManager.getCollection(id);
        if (layer) {
            return {
                layer,
                type: LAYERBASETYPE.ENTITYLAYER
            };
        }

        layer = this.getImageryLayerByName(id);
        if (layer) {
            return {
                layer,
                type: LAYERBASETYPE.IMAGERYLAYER
            }
        }

        return {
            layer: undefined,
            type: ''
        }
    }

    getImageryLayerByName(id) {
        var layer = undefined;
        var imageryLayers = this.viewer.imageryLayers;
        for (var i = 0; i < imageryLayers.length; i++) {
            var tempLayer = imageryLayers.get(i);
            if (tempLayer._layerId && tempLayer._layerId === id) {
                layer = tempLayer;
                break;
            }
        }
        
        return layer;
    }
}