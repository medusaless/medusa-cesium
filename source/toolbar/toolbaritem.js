var defaultIconClass = '';

export default class ToolBarItem {
    constructor(toolName, caption, template, iconClass) {
        this.toolName = toolName;
        this.caption = caption;
        this.template = template;
        this.iconClass = iconClass;
    }

    getHtmlContent() {
        return `<div class="skywaycesium-toolbar-item" data-toolname="${this.toolName}" title='${this.caption}'>
                     ${this.template.replace(/{caption}/g, this.caption)
                                    .replace(/{iconClass}/g, this.iconClass || defaultIconClass)}
                </div>`;
    }
}