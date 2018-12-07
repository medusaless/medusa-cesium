import ToolBarContainerTemplate from '../template/toolbarcontainertemplate.html';

export default class ToolBarContainer {
    constructor(toolManager, viewerDomId) {
        this.toolManager = toolManager;
        this.htmlContent = ToolBarContainerTemplate;
        this.childItems = [];
        this.viewerDomId = viewerDomId;
        this.domEL = '#' + this.viewerDomId + '  .skywaycesium-toolbar-container';

        this._onItemClickHandler = this._onItemClickHandler.bind(this);

        $(`#${this.viewerDomId}`).append(this.getHtmlContent());

        this.bindEvents();
    }

    bindEvents() {
        var self = this;
        $(this.domEL).on('click', '.skywaycesium-toolbar-item', function () {
            var $toolBarItem = $(this);
            $(self.domEL + ' .skywaycesium-toolbar-item').removeClass('active');
            $toolBarItem.addClass('active');
            self._onItemClickHandler($toolBarItem.attr('data-toolname'));
        })
    }

    addItem(toolbarItem) {
        this.childItems.push(toolbarItem);
        $(this.domEL).append(toolbarItem.getHtmlContent());
        this.htmlContent = $(this.domEL).html().toString();
    }

    removeItem(toolName) {
        $(this.domEL).find(`div[data-toolname="${toolName}"]`).remove();
        this.childItems = this.childItems.filter((toolBarItem) => {
            return toolBarItem.toolName !== toolName;
        });
        this.htmlContent = $(this.domEL).html().toString();
    }

    _onItemClickHandler(toolName) {
        var toolBarItem = this.childItems.find(toolBarItem => toolBarItem.toolName === toolName);
        if (toolBarItem && toolBarItem.toolName) {
            var toolName = toolBarItem.toolName;
            if (typeof toolName === 'string') {
                this.toolManager.activate(toolName);
            } else if (typeof toolName === 'function') {
                toolName();
            }
        }
    }

    getHtmlContent() {
        return this.htmlContent;
    }
}