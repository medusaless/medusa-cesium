/**
 * Identity
 */
import Cesium from 'cesium/Cesium'
import InfoWindow from './infowindow';
import InfoWindowContentCreator from './infowindowcontentcreator';
import InfoWindowItemTemplate from '../../template/infowindowitem.html';

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

export default class IdentytyTool {
    constructor(app, identityConfigs) {
        this.app = app;
        this.viewer = app.viewer;
        this.identityConfigs = identityConfigs;
        this.targets = new Map();

        this.infoWindow = new InfoWindow('#' + this.app.domId);
        this.app._infoWindow = this.infoWindow;
        this.preRenderHandler = this.preRenderHandler.bind(this);
        this.onLeftClickHandler = this.onLeftClickHandler.bind(this);
        this.init();
    }

    init() {
        this.identityConfigs.forEach(
            (config) => {
                this.addTarget(config);
            }
        );
    }

    addTarget(options) {
        var { id, callback } = options;
        var targetCallbacks = this.targets.get(id);
        if (targetCallbacks) {
            targetCallbacks.push(callback);
        } else {
            this.targets.set(id, [callback]);
        }
    }

    activate() {
        this.deActivate();
        this.bindEvent();
    }

    bindEvent() {
        // change infowindow position every moments
        this.viewer.scene.preRender.addEventListener(this.preRenderHandler);
        this.eventHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
        this.eventHandler.setInputAction(this.onLeftClickHandler, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    deActivate() {
        //  this.infoWindow.hide();
        if (this.eventHandler) {
            this.eventHandler.destroy();
            this.eventHandler = null;
        }
        this.preRenderHandler && this.viewer.scene.preRender.removeEventListener(this.preRenderHandler);
    }

    onLeftClickHandler(event) {
        var pickedEntity = this.viewer.scene.pick(event.position);

        // If a entity is picked
        if (Cesium.defined(pickedEntity)) {
            this.identifyArcgisFeature(pickedEntity);
        } else {

            // If nothing is picked, test WMS getFeatureInfo
            var cartesian3 = this.app.getGroundPoint(event.position, 'TERRAIN');
            this.identifyWMSFeature(cartesian3);
        }
    }

    identifyArcgisFeature(pickedEntity) {
        var entityCartesian3;
        var layerName;
        var attributes;

        if (pickedEntity.id && typeof pickedEntity.id !== 'Array') {
            entityCartesian3 = pickedEntity.id.position._value;
            layerName = pickedEntity.id._layerName;
            attributes = pickedEntity.id._eAttributes;
        } else {
            return;
        }

        if (layerName && this.shouldIdentity(layerName) && attributes) {
            var layerConfig = this.app.layerConfigs.find(function (layerConfig) {
                return layerConfig.name === layerName;
            });

            this.renderInfoWindow(attributes, layerConfig, InfoWindowItemTemplate, entityCartesian3)
        }
    }

    identifyWMSFeature(cartesian3) {
        var self = this;
        var _app = this.app;
        var cartographiPoint = Cesium.Cartographic.fromCartesian(cartesian3);
        var height = _app.viewer.camera.positionCartographic.height;
        var targetLayers = this.app.getImageryLayerByConstructorName('WebMapServiceImageryProvider');
        targetLayers = targetLayers.map(function (targetLayer) {
            if (self.shouldIdentity(targetLayer._layerName)) {
                return targetLayer;
            }
        });

        var targetLayerPromise = this.getWMSIdentifyPromise(targetLayers, height, cartographiPoint);

        /***
         * There maybe many WMS layers to be identified at this coordinate, but only one will popup.
         * So race all GetFeatureInfo Promise
         */
        Promise.race(targetLayerPromise)
            .then(function (featureInfo) {
                if (featureInfo.length == 0) {
                    return;
                }

                var attributes = featureInfo[0].data.properties;

                // Layer name from ImageryFeatureInfo  layerName:id
                var fakeLayerName = featureInfo[0].data.id.split('.')[0];
                var layerConfig = _app.layerConfigs.find(function (layerConfig) {
                    return layerConfig.layers.indexOf(fakeLayerName) !== -1;
                });

                self.renderInfoWindow(attributes, layerConfig, InfoWindowItemTemplate, cartesian3)
            });
    }

    getWMSIdentifyPromise(imageryLayers, height, cartographiPoint) {
        return imageryLayers.map(function (imageryLayer) {
            var imageryProvider = imageryLayer.imageryProvider;
            var tileCartesian2 = imageryProvider.tilingScheme.positionToTileXY(cartographiPoint, getLevel(height));

            // Cesium already implements WMS.GetFeatureInfo in Class WebMapServiceImageryProvider
            // with a different name
            return imageryProvider.pickFeatures(
                tileCartesian2.x,
                tileCartesian2.y,
                getLevel(height),
                cartographiPoint.longitude,
                cartographiPoint.latitude
            )
        });
    }

    renderInfoWindow(attributes, layerConfig, itemTempate, entityCartesian3) {
        var self = this;
        InfoWindowContentCreator.getContent(
            attributes,
            layerConfig,
            itemTempate
        ).then(function (infoWindowContent) {
            if (infoWindowContent) {
                var entityCartographic = Cesium.Cartographic.fromCartesian(entityCartesian3);
                var entityHeight = entityCartographic.height;
                var popupLonDegree = Cesium.Math.toDegrees(entityCartographic.longitude);
                var popupLatDegree = Cesium.Math.toDegrees(entityCartographic.latitude);
                self.infoWindow.setContent(infoWindowContent);
                self.infoWindow.show();
                self._popupCartesian3 = Cesium.Cartesian3.fromDegrees(popupLonDegree, popupLatDegree, entityHeight);
            }
        });
    }

    shouldIdentity(layerName) {
        return this.layerNames.indexOf(layerName) !== -1;
    }

    preRenderHandler() {
        if (this._popupCartesian3) {
            var canvasPosition = this.viewer.scene.cartesianToCanvasCoordinates(this._popupCartesian3, new Cesium.Cartesian2());
            if (canvasPosition) {
                this.infoWindow.setPosition(canvasPosition.x, canvasPosition.y)
            }
        }
    }
}

