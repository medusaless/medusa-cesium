export default class BaseTool {
    constructor(AppCesium, mode){
    }

    activate(){
        throw new Error('method active is not implemented by BaseTool subclass')
    }

    deactivate(){
        throw new Error('method deactivate is not implemented by BaseTool subclass')
    }
}