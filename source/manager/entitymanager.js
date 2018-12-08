import Cesium from 'cesium/Cesium';
/**
 * Entity统一管理，模拟“图层”的概念
 */

export default class EntityManager {
    constructor(viewer) {
        this._collections = {};
        this.viewer = viewer;
    }

    get collections() {
        return this._collections;
    }

    addCollection(name, pointType, dataSource) {
        if(this.getCollection(name)){
            return this.getCollection(name);
        }

        if (typeof dataSource === 'undefined') {
            if (pointType && pointType === 'MODEL') {
                dataSource = new Cesium.CustomModelDataSource(name);
            } else {
                dataSource = new Cesium.CustomDataSource(name);
            }
        }

        this.viewer.dataSources.add(dataSource);

        return this._collections[name] = {
            dataSource: dataSource
        };
    }

    addEntity(collectionName, entity) {
        var collection = this._collections[collectionName];

        collection = collection || this.addCollection(collectionName);

        return collection.dataSource.entities.add(entity);
    }

    removeAll() {
        Object.keys(this._collections).forEach((collectionName) => {
            this.removeEntities(collectionName);
        });
    }

    removeEntity(collectionName, entity) {
        var collection = this._collections[collectionName];

        collection = collection || this.addCollection(collectionName);

        // 添加至集合
        return collection.dataSource.entities.remove(entity);
    }

    getCollection(collectionName) {
        return this._collections[collectionName];
    }

    removeEntities(collectionName) {
        var dataSource = this._collections[collectionName] && this._collections[collectionName].dataSource;
        dataSource && dataSource.entities && dataSource.entities.removeAll();
    }

    hideCollection(collectionName) {
        this._collections[collectionName] && this._collections[collectionName].dataSource && (this._collections[collectionName].dataSource.show = false);
    }

    showCollection(collectionName) {
        this._collections[collectionName] && this._collections[collectionName].dataSource && (this._collections[collectionName].dataSource.show = true);
    }
}
