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

export default class IdentityHelper {
    constructor(app, identityConfigs) {
        this.app = app;
        this.viewer = app.viewer;
        this.identityConfigs = identityConfigs;
        this.targets = new Map();

        this.infoWindow = new InfoWindow('#' + this.app.domId);
        this.app._infoWindow = this.infoWindow;
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
        var { id, callback, context } = options;
        var targetCallbacks = this.targets.get(id);
        if (targetCallbacks) {
            targetCallbacks.push({ callback, context });
        } else {
            this.targets.set(id, [{ callback, context }]);
        }
    }

    activate() {
        this.deActivate();
        this.bindEvent();
    }

    bindEvent() {
        // change infowindow position every moments
        this.eventHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
        this.eventHandler.setInputAction(this.onLeftClickHandler, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    deActivate() {
        //  this.infoWindow.hide();
        if (this.eventHandler) {
            this.eventHandler.destroy();
            this.eventHandler = null;
        }
    }

    onLeftClickHandler(event) {
        debugger;
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
        var position;  // Cartesian3
        var layerId;
        var attributes;
       

        if (pickedEntity.id && typeof pickedEntity.id !== 'Array') {
            position = pickedEntity.id.position._value;
            layerId = pickedEntity.id._layerId;
            attributes = pickedEntity.id._eAttributes;
        } else {
            return;
        }

        if (this.shouldIdentity('ARCGISFEATURE', layerId)) {
            this.onIdentityHandler(layerId, { position, attributes });
        }
    }

    onIdentityHandler(layerId, result) {
        var callbackObjs = this.targets.get(layerId);
        callbackObjs.forEach(
            (callbackObj) => {
                var callback = callbackObj.callback;
                var context = callbackObj.context;
                callback && callback.call(context, layerId, result);
            }
        );
    }

    identifyWMSFeature(cartesian3) {
        var self = this;
        var _app = this.app;
        var cartographiPoint = Cesium.Cartographic.fromCartesian(cartesian3);
        var height = _app.viewer.camera.positionCartographic.height;
        var targetLayers = this.getTargetImageryLayers();
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
                var layerId = self.getIdentityIdFromLayerConfig(featureInfo[0].data.id.split('.')[0]);

                if (self.shouldIdentity('WMS', layerId) && attributes) {
                    self.onIdentityHandler(layerId, { position: cartesian3, attributes });
                }
            });
    }

    getIdentityIdFromLayerConfig(fakeId) {
        var _id = '';
        var layerConfig = this.app.layerConfigs.find(
            cfg => cfg.layers.indexOf(fakeId) !== -1
        );

        if (layerConfig) {
            _id = layerConfig.id;
        }

        return _id;
    }

    getTargetImageryLayers() {
        var layers = [];
        var imageryLayers = this.app.viewer.imageryLayers;
        for (var i = 0; i < imageryLayers.length; i++) {
            var layer = imageryLayers.get(i);
            if (layer._layerId && this.targets.has(layer._layerId)) {
                layers.push(layer);
                break;
            }
        }
        return layers;
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

    shouldIdentity(type, layerId) {
        if (type === 'ARCGISFEATURE') {
            return this.targets.has(layerId);
        } else {
            return this.targets.has(layerId) && this.app.getImageryLayerById(layerId).show;
        }
    }
}

