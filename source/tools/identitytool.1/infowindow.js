/**
 * 地图Popup
 */
import InfoWindowTemplate from '../../template/infowindow.html';

export default class InfoWindow {
    constructor(el) {
     
        this.$maxBtn = undefined;
        this.$closeBtn = undefined;
        this.$content = undefined;

           // Popup的JQuery对象
        this.$popup = $(InfoWindowTemplate);

        this.setParent(el);
        this.setHtmlVariable();
        this.bindEvents();
    }

    set showMaxBtn(show) {
        (show && this.$maxBtn) ? this.$maxBtn.show() : this.$maxBtn.hide();
    }
    
    setHtmlVariable() {
        this.$maxBtn = this.$popup.find('.skywaycesium-popup-max-button');
        this.$closeBtn = this.$popup.find('.skywaycesium-popup-close-button');
        this.$content = this.$popup.find('.skywaycesium-popup-content');
    }

    bindEvents() {
        this.$closeBtn.on('click', function () {
            this.hide();
        }.bind(this));

        this.$maxBtn.on('click', function () {
            this.showLayerWindow();
        }.bind(this));
    }

    setParent(el) {
        var $parent = $(el);
        if ($parent) {
            $parent.append(this.$popup);
        } else {
            throw new Error('popupwindow parent not found');
        }
    }

    setPosition(x, y) {
        this.$popup.css({
            left: x - this.$popup.width() / 2,
            top: y - this.$popup.height() - 20 // place above the entity
        })
    }

    setContent(htmlContent) {
        this.$content.html(htmlContent);
    }

    hide() {
        this.$popup.addClass('skywaycesium-popup-hide');
    }
    
    show() {
        // var $childIframe = this.$popup.find('iframe');
        // $childIframe.length > 0 ? this.$maxBtn.show() : this.$maxBtn.hide();
        this.$popup.removeClass('skywaycesium-popup-hide');
    }

    showLayerWindow() {
        // var $childIframe = this.$popup.find('iframe');
        // if ($childIframe && $childIframe.length > 0) {
        //     var index = layer.open({
        //         type: 2,
        //         title: '三维全景图',
        //         content: $childIframe[0].src
        //     });
        //     layer.full(index);
        // }
    }
}

