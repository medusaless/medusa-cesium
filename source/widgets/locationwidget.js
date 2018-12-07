import LocationWidgetHtml from '../template/locationwidget.html';
import WidgetFrame from './widgetframe';
import comLib from '../utils/comLib';

import COLLECTIONNAME from '../constants/entitycollectionname';

import Cesium from 'cesium/Cesium';

/***
 * options:{
 *    position:{
 *        top,left
 *    }
 * }
 */
export default class LocationWidget extends WidgetFrame {
    constructor(app, options) {
        super(app, options);
        this.app = app;
        this.setWidgetContent();
        this.bindEvents();
    }

    setWidgetContent() {
        this.$widgetInstance.addClass('locationwidget');
        this.$widgetInstance.find('.skywaycesium-widget-content').append(LocationWidgetHtml);
    }

    bindEvents() {
        var self = this;
        this.$widgetInstance.find('#btnLocate').click(function () {
            self._locate(5000);
        });
    }

    _locate(height) {
        var lng = Number(this.$widgetInstance.find('input.lng').val());
        var lat = Number(this.$widgetInstance.find('input.lat').val());
        if (comLib.isNumbr(lng) && comLib.isNumbr(lat)) {
            this.app.zoomToPoints([[lng, lat, height]], 'FLY');
            this.app.drawBillboard(
                [Cesium.Cartographic.fromDegrees(lng, lat)],
                COLLECTIONNAME.LOCATION,
                {
                    clampToGround: true,
                    iconUrl: 'entityicon/loc.png'
                });
        }
    }
}