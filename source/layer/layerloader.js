import LayerResources from '../layer/resources';

import InfoWindowItemTemplate from '../template/infowindowitem.html'
import InfoWindowContentCreator from '../tools/identitytool/infowindowcontentcreator';
import Cesium from 'cesium/Cesium';

function getLevel(height) {
    if (height > 48000000) {
        return 0;
    } else if (height > 24000000) {
        return 1;
    } else if (height > 12000000) {
        return 2;
    } else if (height > 6000000) {
        return 3;
    } else if (height > 3000000) {
        return 4;
    } else if (height > 1500000) {
        return 5;
    } else if (height > 750000) {
        return 6;
    } else if (height > 375000) {
        return 7;
    } else if (height > 187500) {
        return 8;
    } else if (height > 93750) {
        return 9;
    } else if (height > 46875) {
        return 10;
    } else if (height > 23437.5) {
        return 11;
    } else if (height > 11718.75) {
        return 12;
    } else if (height > 5859.38) {
        return 13;
    } else if (height > 2929.69) {
        return 14;
    } else if (height > 1464.84) {
        return 15;
    } else if (height > 732.42) {
        return 16;
    } else if (height > 366.21) {
        return 17;
    } else {
        return 18;
    }
}

export default class LayerLoader {
    constructor(app, layerConfigs) {
        this.layerConfigs = layerConfigs;
        this.entityManager = app.entityManager;
        this.viewer = app.viewer;
        this.skywayCesium = app;
    }

    init() {
        this.layerConfigs.forEach(layerConfig => {
            this.createLayer(layerConfig);
        });
    }

    createLayer(layerConfig) {
        var { displayType, layers, url, id, show, layerOptions, resourceName } = layerConfig;
        var resourceLayer = LayerResources[resourceName];
        if (resourceLayer) {
            var layer = this.viewer.imageryLayers.addImageryProvider(resourceLayer);
            layer._layerId = id;
            return;
        }

        if (displayType === 'ARCGISFEATURE') {
            this.changeFeatureQueryUrl(layerConfig);
            this.addEntityLayer(layerConfig);
        } else if (displayType === "ARCGISLAYER") {
            this.addArgcisLayer(id, url, layers, show, layerOptions);
        } else if (displayType === 'URLTEMPLATELAYER') {
            this.addUrlTemplateLayer(id, url, show, layerOptions);
        } else if (displayType === 'WMSLAYER') {
            this.addWMSLayer(id, url, layers, show, layerOptions);
        }
    }

    addEntityLayer(layerConfig) {
        var { id, url, displayType, show } = layerConfig
        var self = this;
        this.entityManager.addCollection(id);
        if (!show) {
            this.entityManager.hideCollection(id);
        }
        $.ajax({
            url: url,
            dataType: 'json'
        }).done(function (queryResult) {
            debugger;
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
            this.skywayCesium
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
        var self = this;
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
    changeFeatureQueryUrl(layerConfig) {
        if (layerConfig.displayType === 'ARCGISFEATURE') {
            layerConfig.url = `${layerConfig.url}/query?where=1%3D1&outFields=${layerConfig.fields}&f=json`;
        }
    }
}