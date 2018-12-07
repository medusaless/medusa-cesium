import Cesium from 'cesium/Cesium';
/**
 * 工具统一管理
 */
export default class LayerManager {
    constructor(AppCesium) {
        this.entityManager = AppCesium.entityManager;
        this.viewer = AppCesium.viewer;
    }

    setVisibility(id, visible) {
        var { layer, type } = this.findLayerById(id);
        if (type === 'ENTITYLAYER') {
            visible
                ? this.entityManager.showCollection(id)
                : this.entityManager.hideCollection(id)
        } else if (type === 'IMAGERYLAYER') {
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
                type: 'ENTITYLAYER'
            };
        }

        layer = this.getImageryLayerByName(id);
        if (layer) {
            return {
                layer,
                type: 'IMAGERYLAYER'
            }
        }

        return {
            layer: undefined,
            type: 'NOTFOUND'
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
