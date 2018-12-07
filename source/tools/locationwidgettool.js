import BaseTool from "./basetool";
import COLLECTIONNAME from '../constants/entitycollectionname';

export default class LocationWidgetTool extends BaseTool {
    constructor(app) {
        super(app);
        this.app = app;
        this._widget = app.locationWidget;
    }

    activate() {
        this._widget.setState('OPEN');
    }

    deActivate() {
        this._widget.setState('CLOSE');
        this.app.entityManager.removeEntities(COLLECTIONNAME.LOCATION)
    }
}