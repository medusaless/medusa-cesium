
/**
 * 工具统一管理
 */
export default class ToolManager {
    constructor() {
        this.tools = new Map();
        this.activatedToolName = '';
    }

    addTool(name, tool) {
        this.tools.set(name, tool);
    }

    removeTool(name) {
        this.tools.delete(name);
    }

    getActivatedTool() {
        if (this.activatedToolName) {
            return this.tools.get(this.activatedToolName);
        }
    }

    activate(name) {
        var self = this;
        var currTool;
        debugger;
        self.tools.forEach(function (tool, toolName) {
            if (name === toolName) {
                tool.activate && tool.activate();
                self.activatedToolName = name;
                currTool = tool;
            } else {
                tool.deActivate && tool.deActivate();
            }
        });
        // ensure active at the end
        // for drawing tool ,there are bugs when activate them at the middle
        currTool.activate && currTool.activate();
        return currTool;
    }
    
    deActivate(name) {
        if (typeof name === 'string') {
            var tool = this.tools.get(name);
            tool && tool.deActivate && tool.deActivate();
        } else if (typeof name === 'boolean' && name) {
            this.tools.forEach(function (tool, toolName) {
                tool.deActivate && tool.deActivate();
            });
        }
    }
}
