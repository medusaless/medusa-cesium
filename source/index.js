import './css/skywaycesium.css';

import EntityManager from './manager/entitymanager.js';

import DistanceTool from './tools/distancetool.js';
import AreaTool from './tools/areatool.js';
import HeightTool from './tools/heighttool.js';
import FullMapTool from './tools/fullmaptool'
import MapClearTool from './tools/mapcleartool.js';
import LocationWidgetTool from './tools/locationwidgettool';
import IdentityHelper from './tools/identitytool/identityhelper';
import IdentityTool from './tools/identitytool/identitytool';

import ToolBar from './toolbar/toolbarcontainer.js';
import ToolBarItem from './toolbar/toolbaritem.js'
import ToolManager from './manager/toolmanager.js';
import ToolBarItemTemplate from './template/toolbaritemtemplate.html';

import LayerManager from './manager/layermanager';
import LayerWidget from './widgets/layerwidget';
import LocationWidget from './widgets/locationwidget';

import MEASUREMODE from './constants/measuremode.js';
import ENTITYCOLLECTION from './constants/entitycollectionname';


import IdGenerator from './utils/idgenerator.js';

import Cesium from 'cesium/Cesium';

import SkywayCesiumHelper from './utils/cesiumhelper';

import DrawTool from './tools/drawtool';

import comLib from './utils/comLib';
import InfoWindow from './tools/identitytool/infowindow';

// import viewerCesiumNavigationMixin from './widgets/viewerCesiumNavigationMixin.min.js'

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
            infoBox: false,
        };
        Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmYjhjMzY4MS0wMDRiLTQ0NjMtYWE2Yy02ODA0YTE1MTI4ZWYiLCJpZCI6NDU4Nywic2NvcGVzIjpbImFzciIsImdjIl0sImlhdCI6MTU0MTE0NTgxNn0.yG4tdclQYsSpguL_I523GyLyBap8-y3jduGTuHQ7jKM';

        this._infoWindowShown = false;
        this.domId = domId;
        this.viewer = undefined;
        this.entityManager = undefined;
        this.toolBar = undefined;
        this.toolManager = undefined;

        this.locationWidget = undefined;
        this.layerWidget = undefined;

        this.defaultIconUrl = undefined;
        this.layerConfigs = undefined;

        this.identityConfigs = undefined;

        this.options = $.extend(true, { viewerOption: ___defaultOptions }, options);
    }

    init() {
        this.initViewer();
        this.drawTool = new DrawTool(this, {}); 
        this.identityConfigs = this.options.identityConfigs;
        this.identityHelper = new IdentityHelper(this, this.identityConfigs);
        this.infoWindow = new InfoWindow('#' + this.domId);
        // 顺序必须如此
        this.defaultIconUrl = this.options.defaultIconUrl || 'entityicon/fire.png';
        this.setInitialExtent();
        this.createTerrain(this.options.terrain);
        this.initEntityManager();
        this.initToolManager();
        this.initToolBar();

        this.initLayerManager();
        this.initLayerWidget();

        // this.viewer.extend(viewerCesiumNavigationMixin, {
        //     defaultResetView: Cesium.Rectangle.fromDegrees(
        //         west, south, east, north
        //     )
        // });

        this.addDefaultCustomTool();
    }

    initViewer() {
        this.viewer = new Cesium.Viewer(this.domId, this.options.viewerOption);
        this.viewer.scene.imageryLayers.removeAll();      // 防止加载virtualearth影像
    }

    setInitialExtent() {
        var { west, south, east, north } = this.options.initialExtent;
        if (west && south && east && north) {
            this.zoomToExtent(west, south, east, north);
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
        this.entityManager.addCollection(ENTITYCOLLECTION.AREA);
        this.entityManager.addCollection(ENTITYCOLLECTION.DISTANCE);
        this.entityManager.addCollection(ENTITYCOLLECTION.HEIGHT);
        this.entityManager.addCollection(ENTITYCOLLECTION.LOCATION);
    }

    initToolBar() {
        this.toolBar = new ToolBar(this.toolManager, this.domId);
    }

    initToolManager() {
        this.toolManager = new ToolManager();
    }

    initLayerManager() {
        this.layerConfigs = this.options.layerConfigs;
        this.layerManager = new LayerManager(this);
        this.layerManager.init();
    }

    initLayerWidget() {
        this.layerWidget = new LayerWidget(this, {
            position: { left: 10, top: 10 },
            title: '图层控制',
            id: '_layerWidget'
        });
        this.layerWidget.renderInitLayers();

        this.locationWidget = new LocationWidget(this, {
            position: { right: 20, top: 70 },
            title: '地图定位',
            id: '_locationWidget',
            showCloseButton: true
        });
        this.locationWidget.setState('CLOSE');
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
        this.addCustomTool(new LocationWidgetTool(this), true, '地图定位');
        this.addCustomTool(new FullMapTool(this), true, '全图');
        this.addCustomTool(new IdentityTool(this), true, '一键查询');
        this.addCustomTool(new MapClearTool(this, `${ENTITYCOLLECTION.AREA},${ENTITYCOLLECTION.DISTANCE},${ENTITYCOLLECTION.HEIGHT},${ENTITYCOLLECTION.LOCATION}`),
            true,
            '清理地图',
            'fa-trash-o'
        );
    }

    /**
     * Promise 
     * @param {*} cartographicArr 
     * @param {*} pointHeightLevel 
     */
    getClampPoints(cartographicArr, pointHeightLevel) {
        return SkywayCesiumHelper.getClampPoints.apply(this, arguments);
    }

    zoomToExtent(west, south, east, north) {
        SkywayCesiumHelper.zoomToExtent.apply(this, arguments);
    }

    /**
 * 获取鼠标点击处的经纬度
 * @param {*} position Cartesian2：屏幕坐标
 * @param {*} mode 地形/平面
 */

    getGroundPoint(position, mode) {
        return SkywayCesiumHelper.getGroundPoint.apply(this, arguments);
    }

    /**
            * 
            * @param {*} points 经纬度数组：[[lng,lat], [lng,lat]]
            */
    zoomToPoints(points, mode) {
        SkywayCesiumHelper.zoomToPoints.apply(this, arguments);
    }

    /** Promise
        * @param {*} cartographicPoints Cartesian2：弧度数组
        * @param {*} datasourceId datasource的id
        * @param {*} options 
        * {
        *    clampToGround, pointHeightLvel, iconUrl
        * }
        */
    drawPoint(cartographicPoints, datasourceId, options = {}) {
        return SkywayCesiumHelper.drawPoint.apply(this, arguments);
    }

    //Promise
    drawBillboard(cartographicPoints, datasourceId, options = {}) {
        return SkywayCesiumHelper.drawBillboard.apply(this, arguments);
    }

    getImageryLayerById(id) {
        return LayerManager.prototype.getImageryLayerById.call(this, id);
    }


    getImageryLayerByConstructorName(name) {
        return LayerManager.prototype.getImageryLayerByConstructorName.call(this, name);
    }

    /**
     *  Promise
     * @param {*} cartographicPoints  [[polyline1 points],[polyline2 points], ...]
     * @param {*} datasourceId 
     * @param {*} options 
     */
    drawPolyline(cartographicPoints, datasourceId, options) {
        return SkywayCesiumHelper.drawPolyline.apply(this, arguments);
    }
    /**
     * Promise
     * @param {*} cartographicPoints [[polygon1 points],[[polygon2 points], ...]
     * @param {*} datasourceId 
     * @param {*} options 
     */
    drawPolygon(cartographicPoints, datasourceId, options) {
        return SkywayCesiumHelper.drawPolygon.apply(this, arguments);
    }

    addLayer(layerConfig) {
        this.layerManager.addLayer(layerConfig);
    }

    removeLayer(id) {
        this.layerManager.removeLayer(id);
    }

    getLayerConfigById(id){
        return this.layerConfigs.find(obj => obj.id === id);
    }

    getIdentityConfigById(id){
        return this.identityConfigs.find(obj => obj.id === id);
    }
}