import LayerWidgetContainer from '../template/layerwidgetcontainer.html';
import LayerWidgetItem from './layerwidgetitem';
import LayerWidgetItemTemplate from '../template/layerwidgetitemtemplate.html';

import WidgetFrame from './widgetframe';

import Cesium from 'cesium/Cesium';

export default class LayerWidget extends WidgetFrame {
    constructor(app, options = {}) {
        super(app, options);
        this.layerManager = app.layerManager;
        this.initLayers = app.options.layerConfigs;
        this.childItems = [];
        this.setWidgetContent();
        this.bindEvents();
    }

    setWidgetContent(){
        this.$widgetInstance.addClass('layerWidget');
        this.$widgetInstance.find('.skywaycesium-widget-content').append(LayerWidgetContainer);
    }

    renderInitLayers() {
        this.initLayers.forEach(layerConfig => {
            layerConfig.addToLayerWidget && this.addItem(new LayerWidgetItem(layerConfig.id, layerConfig.name, layerConfig.show, LayerWidgetItemTemplate));
        });
    }

    bindEvents() {
        var self = this;
        this._onItemClickHandler = this._onItemClickHandler.bind(this);
        this.$widgetInstance.on('click', 'li.skywaycesium-layerwidget-item-wrap', function () {
            var $item = $(this);
            self._onItemClickHandler($item.attr('data-layerid'), $item.children(':checkbox').is(':checked'));
        })
    }

    addItem(item) {
        this.childItems.push(item);
        this.$widgetInstance.find('ul').append(item.getHtmlContent());
        item.show && $(`${'#' + this.widgetId} ul li[data-layerid="${item.layerId}"]`).children('input:checkbox').attr('checked', item.show)
    }

    removeItem(layerId) {
        this.$widgetInstance.find(`div[data-toolName="${layerId}"]`).remove();
        this.childItems = this.childItems.filter((item) => {
            return item.layerId !== layerId;
        });
    }

    _onItemClickHandler(layerId, visible) {
        var item = this.childItems.find(item => item.layerId === layerId);
        if (item && item.layerId) {
            var layerId = item.layerId;
            if (typeof layerId === 'string') {
                this.layerManager.setVisibility(layerId, visible);
            } else if (typeof layerId === 'function') {
                layerId();
            }
        }
    }
}