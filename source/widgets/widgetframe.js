import WidgetFrameContent from '../template/widgetframe.html'

export default class WidgetFrame {
    constructor(app, options = { showCloseButton: false }) {
        this.domId = app.domId;
        this.options = options;
        // check duplicated id?
        this.widgetId = options.id;
        this.title = options.title;
        this.$widgetInstance = undefined;

        this.initWidget();

        this.setWidgetPosition(options.position);
        // this in parent is child class instance!
        this._framebindEvents();
    }

    set showCloseButton(show) {
        show
            ? this.$widgetInstance.find('.skywaycesium-widget-close').show()
            : this.$widgetInstance.find('.skywaycesium-widget-close').hide();
    }

    _framebindEvents() {
        var self = this;
        this.$widgetInstance.find('.skywaycesium-widget-close').click(function () {
            self.setState('CLOSE');
        });
    }

    setState(state) {
        switch (state) {
            case 'OPEN':
                this.setVisibility(true);
                break;
            case 'CLOSE':
                this.setVisibility(false);
                break;
        }
    }

    initWidget() {
        this.$widgetInstance = $(WidgetFrameContent.replace(/{title}/g, this.title)
            .replace(/{id}/g, this.widgetId));
        $('#' + this.domId).append(this.$widgetInstance);

        var { showCloseButton: _showCloseButton = false } = this.options;
        this.showCloseButton = _showCloseButton;
    }

    setVisibility(show) {
        show ? this.$widgetInstance.show() : this.$widgetInstance.hide();
    }

    // top and bottom both assigned ?
    setWidgetPosition(pos) {
        if (pos) {
            var { top, left, bottom, right } = pos;
            this.$widgetInstance.css({
                top,
                right,
                bottom,
                left
            });
        }
    }
}