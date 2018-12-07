import SkywayCesium from '../source/index';

import 'cesium/Widgets/widgets.css';

import './css/main.css';

import Cesium from 'cesium/Cesium';

import $ from 'jquery';
window.$ = $;

var options = {
    layerConfigs: [
        {
            id: "animalLyr",
            name: "动物多样性",
            url: "http://101.200.232.210:6080/arcgis/rest/services/WEBGISSERVICE/WEBGISXUNHU/FeatureServer/18",
            layers: "",
            fields: "JINGDU,WEIDU,DONGWU_LX,DONGWU_DM,GUANLIZHAN,MIAOSHU",
            iconUrl: 'entityicon/fire.png',
            displayType: "ARCGISFEATURE",
            clampToGround: true,
            addToLayerWidget: true,
            show: true
        }, {
            id: 'googleLyr',
            name: "google地图",
            url: "http://www.google.cn/maps/vt?lyrs=s@748&gl=en&x={x}&y={y}&z={z}",
            layers: '',
            displayType: "URLTEMPLATELAYER",
            addToLayerWidget: true,
            show: true
        }, {
            id: 'wmsLyr',
            name: "WMS测试",
            url: "http://39.105.11.71:8081/geoserver/text/wms",
            layers: "text:T_GIS_GONGYILIN_PY",
            iconUrl: "",
            displayType: "WMSLAYER",
            addToLayerWidget: true,
            show: false,
            layerOptions: {
                parameters: {
                    FORMAT: 'image/png',
                    TRANSPARENT: true
                }
            }
        }, {
            id: 'labelLyr',
            name: "google标注",
            resourceName: 'GoogleMapLabel',
            show: true,
            addToLayerWidget: true,
        }, {
            id: 'sbLyr',
            name: "一行地图",
            url: "http://119.3.56.4:8081/earth/evts?format=image/jpg&scene=default&ds=1&type=edom&x={x}&y={y}&l={z}",
            layers: "",
            displayType: "URLTEMPLATELAYER",
            addToLayerWidget: true,
            show: true
        }],
    identityConfigs: [
        {
            id: 'animalLyr',
            fields: "JINGDU,WEIDU,DONGWU_LX,DONGWU_DM,GUANLIZHAN,MIAOSHU",
            translationConfig: {
                simpleTranslate: {
                    translateKey: true,
                    translateValue: false,
                    keydictionary: {
                        JINGDU: '经度',
                        WEIDU: '纬度'
                    }
                },
                // webserviceTranslate: {
                //     url: "http://101.200.232.210:6080/arcgis/rest/services/WEBGISSERVICE/WEBGISYEWU/MapServer/1/query?where=OBJECTID%3D9609&text=&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=*&returnGeometry=true&maxAllowableOffset=&geometryPrecision=&outSR=&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&returnDistinctValues=false&f=pjson",
                //     param: {
                //     }
                // }
            }
        }, {
            id: 'wmsLyr',
            fields: "SJHS,SLJKD,SLLB,SMHCD",
        }
    ],
    terrain: {
        url: 'http://101.200.232.210:8123/ctb_china_alldem',
        pointHeightLevel: 12
    },
    initialExtent: {
        west: 107.65229,
        south: 25.11676,
        east: 108.31112,
        north: 25.35186
    }
}

var app = new SkywayCesium('cesiumContainer', options);
app.init();

var polygons = [
    [
        Cesium.Cartographic.fromDegrees(104, 32),
        Cesium.Cartographic.fromDegrees(104, 34),
        Cesium.Cartographic.fromDegrees(105, 33)
    ],
    [
        Cesium.Cartographic.fromDegrees(106, 36),
        Cesium.Cartographic.fromDegrees(107, 38),
        Cesium.Cartographic.fromDegrees(108, 37)
    ]
];

app.drawPolygon(polygons, '__TEST', { clampToGround: true, pointHeightLevel: 11 })
    .then(function () {
        console.log('draw end1')
    })

var polylines = [
    [
        Cesium.Cartographic.fromDegrees(105, 32),
        Cesium.Cartographic.fromDegrees(105, 34),
    ],
    [
        Cesium.Cartographic.fromDegrees(106, 40),
        Cesium.Cartographic.fromDegrees(107, 42),
        Cesium.Cartographic.fromDegrees(108, 42),
    ]
];

app.drawPolyline(polylines, '__TEST', { clampToGround: true, pointHeightLevel: 11 })
    .then(function () {
        console.log('draw end2')
    })