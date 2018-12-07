var defaultIconClass = 'fa-circle';

export default class LayerWidgetItem {
    constructor(layerId, caption, show, template) {
        this.layerId = layerId;
        this.caption = caption;
        this.template = template;
        this.show = show;
    }

    getHtmlContent() {
        return `
                 <li class="skywaycesium-layerwidget-item-wrap" data-layerid="${this.layerId}">
					<input type="checkbox">
                    ${this.template.replace(/{caption}/g, this.caption)}
                 </li>`
    }
}