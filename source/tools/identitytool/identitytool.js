import Cesium from 'cesium/Cesium';
import BaseTool from '../basetool';
import InfoWindowContentCreator from './infowindowcontentcreator';
import InfoWindowItemTemplate from '../../template/infowindowitem.html';

export default class IdentityTool extends BaseTool {
    constructor(AppCesium) {
        super(AppCesium);
        this.app = AppCesium;
        this.scene = this.app.viewer.scene;
        this.identityHelper = AppCesium.identityHelper;
        this.identityConfigs = AppCesium.identityConfigs;
        
        this._popupCartesian3;
        this._infoWindow = AppCesium.infoWindow;
        this.preRenderHandler = this.preRenderHandler.bind(this);

        this._activated = false;
        this._removalPrerenderCallback = function(){};
        this.init();
    }

    init() {
        this.identityConfigs.forEach(
            (config) => {
                this.bindReaction(config.id, this._defaultReaction);
            }
        );

        this._removalPrerenderCallback = this.scene.preRender.addEventListener(this.preRenderHandler);
    }

    bindReaction(id, callback) {
        this.identityHelper.addTarget({ id, callback, context: this })
    }

    _defaultReaction(layerId, result) {
        if (!this._activated) {
            return;
        }

        var self = this;
        var identityConfig = self.identityConfigs.find(
            (config) => config.id === layerId
        );

        InfoWindowContentCreator.getContent(
            result.attributes,
            identityConfig,
            InfoWindowItemTemplate
        ).then(function (infoWindowContent) {
            if (infoWindowContent) {
                self._infoWindow.setContent(infoWindowContent);
                self._infoWindow.show();
                self._popupCartesian3 = result.position;
            }
        });
    }

    activate() {
        this.deActivate();
        this.identityHelper.activate();
        this._removalPrerenderCallback = this.scene.preRender.addEventListener(this.preRenderHandler);
        this._activated = true;
    }

    deActivate() {
        this._activated = false;
        this._removalPrerenderCallback();
    }

    preRenderHandler() {
        if (this._popupCartesian3 && this._activated) {
            var canvasPosition = this.scene.cartesianToCanvasCoordinates(this._popupCartesian3, new Cesium.Cartesian2());
            if (canvasPosition) {
                this._infoWindow.setPosition(canvasPosition.x, canvasPosition.y)
            }
        }
    }
}