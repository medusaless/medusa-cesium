import './css/skywaycesium.css';

import Cesium from 'cesium/Cesium';

import EntityManager from './manager/entitymanager.js';

import DistanceTool from './tools/distancetool.js';
import AreaTool from './tools/areatool.js';
import HeightTool from './tools/heighttool.js';
import MapClearTool from './tools/mapcleartool.js';

import ToolBar from './toolbar/toolbarcontainer.js';
import ToolBarItem from './toolbar/toolbaritem.js'
import ToolManager from './manager/toolmanager.js';
import ToolBarItemTemplate from './template/toolbaritemtemplate.html';

import LayerManager from './manager/layermanager';
import LayerWidget from './widgets/layerwidget';

import MEASUREMODE from './constants/measuremode.js';
import ENTITYCOLLECTION from './constants/entitycollectionname';

import LayerLoader from './layer/layerloader.js';

import IdGenerator from './utils/idgenerator.js';

import viewerCesiumNavigationMixin from './widgets/viewerCesiumNavigationMixin.min.js';


export default class SkywayCesium {
    constructor(domId, options) {
        var ___defaultOptions = {
            fullscreenButton: false,
            homeButton: false,
            geocoder: false,
            sceneModePicker: false,
            baseLayerPicker: false,
            sceneModePicker: false,
            navigationHelpButton: false,
            timeline: false,
            animation: false,
            shouldAnimate: false,
            sceneModePicker: false,
            selectionIndicator: false,
            infoBox: true,
        };
        Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmYjhjMzY4MS0wMDRiLTQ0NjMtYWE2Yy02ODA0YTE1MTI4ZWYiLCJpZCI6NDU4Nywic2NvcGVzIjpbImFzciIsImdjIl0sImlhdCI6MTU0MTE0NTgxNn0.yG4tdclQYsSpguL_I523GyLyBap8-y3jduGTuHQ7jKM';

        this.domId = domId;
        this.viewer = undefined;
        this.entityManager = undefined;
        this.eventManager = undefined;
        this.toolBar = undefined;
        this.toolManager = undefined;
        this.layerLoader = undefined;

        this.layerWidget = undefined;

        // 默认加载哪些工具
        this.options = $.extend({ viewerOption: ___defaultOptions }, options);
    }

    init() {
        // 顺序必须如此

        this.initViewer();
        this.setInitialExtent();
        this.createTerrain(this.options.terrain);
        this.initEntityManager();
        this.initToolManager();
        this.initToolBar();

        this.initLayerManager();
        this.initLayerLoader();
        this.initLayerWidget();

        this.addDefaultCustomTool();
    }

    initViewer() {
        this.viewer = new Cesium.Viewer(this.domId, this.options.viewerOption);
        $('#' + this.domId).css({ position: 'relative', overflow: 'hidden' });
        this.viewer.scene.imageryLayers.removeAll();      // 防止加载virtualearth影像
    }

    setInitialExtent() {
        console.log(viewerCesiumNavigationMixin);
        var { west, south, east, north } = this.options.initialExtent;
        if (west && south && east && north) {
            this.zoomToExtent(west, south, east, north);
            this.viewer.extend(viewerCesiumNavigationMixin, {
                defaultResetView: Cesium.Rectangle.fromDegrees(
                    west, south, east, north
                )
            });
        }
    }

    createTerrain(terrainObj) {
        if (terrainObj.url) {
            this.viewer.terrainProvider = new Cesium.CesiumTerrainProvider({
                url: terrainObj.url
            })
        }
    }

    initEntityManager() {
        this.entityManager = new EntityManager(this.viewer);
    }

    initToolBar() {
        this.toolBar = new ToolBar(this.toolManager, this.domId);
    }

    initToolManager() {
        this.toolManager = new ToolManager();
    }

    initLayerLoader() {
        this.layerLoader = new LayerLoader(this, this.options.layers);
        this.layerLoader.init();
    }

    initLayerManager() {
        this.layerManager = new LayerManager(this);
    }

    initLayerWidget() {
        this.layerWidget = new LayerWidget(this.layerManager, this.options.layers, this.domId);
        this.layerWidget.renderInitLayers();
    }

    addCustomTool(tool, addToToolBar, captionName, iconClass) {
        var toolName = IdGenerator.getNextId('tool');
        tool.uniqueName = toolName;

        this.toolManager.addTool(toolName, tool)
        if (addToToolBar) {
            if (typeof captionName === 'undefined') {
                throw new Error('missing captionName in function addCustomTool');
            }

            this.toolBar.addItem(new ToolBarItem(toolName, captionName, ToolBarItemTemplate, iconClass));
        }
    }

    addDefaultCustomTool() {
        this.addCustomTool(new DistanceTool(this, MEASUREMODE.TERRAIN), true, '距离量算');
        this.addCustomTool(new AreaTool(this, MEASUREMODE.TERRAIN), true, '面积量算');
        this.addCustomTool(new HeightTool(this), true, '高度量算');
        this.addCustomTool(new MapClearTool(this, `${ENTITYCOLLECTION.AREA},${ENTITYCOLLECTION.DISTANCE},${ENTITYCOLLECTION.HEIGHT}`), true, '清理地图', 'fa-trash-o');
    }

    getClampPoints(cartographicArr, pointHeightLevel) {
        var pointHeightLevel = pointHeightLevel || this.options.terrain.pointHeightLevel;
        if (typeof pointHeightLevel === 'undefined') {
            throw new Error('pointHeightLevel is not defined neither in function parameter or terrain config');
        }

        return Cesium.sampleTerrain(
            this.viewer.terrainProvider,
            pointHeightLevel || this.options.terrain.pointHeightLevel,
            cartographicArr
        ).then(function (updatedCartographics) {
            return updatedCartographics;
        });
    }

    zoomToExtent(west, south, east, north) {
        east += 0.0000001;
        north += 0.0000001;
        west -= 0.0000001;
        south -= 0.0000001;

        var rectangle = Cesium.Rectangle.fromDegrees(west, south, east, north);
        this.viewer.camera.setView({
            destination: rectangle
        });
    }

    /**
     * 获取鼠标点击处的经纬度
     * @param {*} position Cartesian2：屏幕坐标
     * @param {*} mode 地形/平面
     */
    getGroundPoint(position, mode) {
        var point = null;
        switch (mode) {
            case MEASUREMODE.TERRAIN:
                var ray = this.viewer.camera.getPickRay(position);
                point = this.viewer.scene.globe.pick(ray, this.viewer.scene);
                break;
            case MEASUREMODE.ELLIPSOID:
                point = this.viewer.camera.pickEllipsoid(position);
                break;
        }
        return point;
    }
}