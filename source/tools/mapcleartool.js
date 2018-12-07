
/**
 * 高度量算工具
 */
import Cesium from 'cesium/Cesium';
import BaseTool from './basetool.js';
import * as COLLECTIONNAME from '../constants/entitycollectionname.js';

/**
 * 可能有问题，目前暂时清除地图上画的所有对象
 */
export default class MapClearTool extends BaseTool {
    constructor(AppCesium, layerNames) {
        super(AppCesium);
        this.layerNames = layerNames ? layerNames.split(',') : [];
        this.entityManager = AppCesium.entityManager;
        this.viewer = AppCesium.viewer;
    }

    addLayer(layerName) {
        var exists = this.layerNames.some(name => name === layerName);
        if (!exists) {
            this.layerNames.push(name);
        }
    }

    removeLayer(layerName) {
        this.layerNames = this.layerNames.filter(name => name !== layerName);
    }

    activate() {
        debugger;
        this.layerNames.forEach(name => {
            this.entityManager.removeEntities(name);
        });
    }

    deActivate() {
    }
}
