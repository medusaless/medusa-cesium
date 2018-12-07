import LayerResources from '../layer/resources';
import LAYERTYPE from '../constants/layertype';
import comLib from '../utils/comLib';
import Cesium from 'cesium/Cesium';

export default class LayerLoader {
    constructor(app, layerConfigs) {
        this.layerConfigs = layerConfigs;
        this.entityManager = app.entityManager;
        this.viewer = app.viewer;
        this.app = app;
    }

    init() {
        this.layerConfigs.forEach(layerConfig => {
            this.addLayer(layerConfig);
        });
    }

    removeLayer(id){
        var layer = this.getImageryLayerById(id);
        var layerConfig = this.app.getLayerConfigById(id);

        layer && this.app.viewer.imageryLayers.remove(layer);
        layerConfig && comLib.removeArray(this.app.layerConfigs, layerConfig);
    }

    addLayer(layerConfig) {
        var { displayType, layers, url, id, show, layerOptions, resourceName } = layerConfig;

        if (this.validateLayerId(id) === false) {
            throw new Error('duplicate layer id or undefined when called addLayer');
        }

        if (displayType === LAYERTYPE.RESOURCELAYER) {
            this.addResourceLayer(layerConfig);
        } else if (displayType === LAYERTYPE.ARCGISQUERYLAYER) {
            this.addEntityLayer(layerConfig);
        } else if (displayType === LAYERTYPE.ARCGISLAYER) {
            this.addArgcisLayer(id, url, layers, show, layerOptions);
        } else if (displayType === LAYERTYPE.URLTEMPLATELAYER) {
            this.addUrlTemplateLayer(id, url, show, layerOptions);
        } else if (displayType === LAYERTYPE.WMSLAYER) {
            this.addWMSLayer(id, url, layers, show, layerOptions);
        }
    }

    addResourceLayer(layerConfig) {
        var resourceLayer = LayerResources[layerConfig.resourceName];
        if (resourceLayer) {
            var layer = this.viewer.imageryLayers.addImageryProvider(resourceLayer);
            layer._layerId = layerConfig.id;
        }
    }

    addEntityLayer(layerConfig) {
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
            if (displayType === 'ARCGISFEATURE') {
                self.fillArcgisEntityCollection(
                    id,
                    queryResult.geometryType,
                    queryResult.features
                );
            } else {

            }
        }).fail(function () {
            console.log('arcgis feature query fail');
        });
    }

    fillArcgisEntityCollection(id, geometryType, features) {
        switch (geometryType) {
            case 'esriGeometryPoint':
                var { iconUrl, clampToGround } = this.getlayerConfigById(id);
                var cartographicFeatures = features.map((feature) => {
                    return {
                        geometry: Cesium.Cartographic.fromDegrees(feature.geometry.x, feature.geometry.y),
                        attributes: feature.attributes
                    }
                });
                this.drawPointEntities(id, iconUrl, clampToGround, cartographicFeatures);
                break;
            case 'esriGeometryPolygon':
                //  drawArcgisPolygonEntity(layerName, geometryType, features, false);
                break;
            case 'esriGeometryPolyline':
                //  drawArcgisPolylineEntity(layerName, geometryType, features);
                break;
        }
    }

    getlayerConfigById(id) {
        return this.layerConfigs.find(layerConfig => layerConfig.id == id);
    }

    drawPointEntities(id, iconUrl, clampToGround, cartographicFeatures) {
        var self = this;
        var dataSource = this.entityManager.getCollection(id) ?
            this.entityManager.getCollection(id).dataSource :
            this.entityManager.getDefaultCollection().dataSource;

        var cartographicPoints = cartographicFeatures.map(cartographicFeatures => cartographicFeatures.geometry);
        if (clampToGround) {
            this.app
                .getClampPoints(cartographicPoints)
                .then(updatedCartographics => {
                    for (var i = 0; i < updatedCartographics.length; i++) {
                        var attributes = cartographicFeatures[i].attributes;
                        var entity = new Cesium.Entity({
                            position: Cesium.Cartesian3.fromRadians(
                                updatedCartographics[i].longitude,
                                updatedCartographics[i].latitude,
                                updatedCartographics[i].height
                            ),
                            billboard: {
                                // 路径解析暂时这样处理，因为require如果传入变量则无法解析图片
                                image: require('../assets/' + iconUrl),
                                scale: 0.6
                            },
                            // Entity的属性数据
                            eAttributes: attributes,
                            // layerName:关联点击后显示的模板
                            _layerId: id,
                        });

                        dataSource.entities.add(entity);
                    }
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
}