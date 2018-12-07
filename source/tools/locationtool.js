
/**
 * 高度量算工具
 */
import Cesium from 'cesium/Cesium';
import BaseTool from './basetool.js';

export default class LocationTool extends BaseTool {
    constructor(AppCesium, ) {
        super(AppCesium);
        this.skywayCesium = AppCesium;
    }

    activate() {
        this.skywayCesium.setInitialExtent();
    }

    deActivate() {
    }
}
