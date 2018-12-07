function addWMSLayer(name, url, layers, show, options) {
    var self = this;
    var layerOption = $.extend({
        url,
        layers
    }, options);

    var layerProvider = new Cesium.WebMapServiceImageryProvider(layerOption);
    var layer = this.viewer.imageryLayers.addImageryProvider(layerProvider);

    // var eventHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
    // eventHandler.setInputAction(function (event) {
    //     self.skywayCesium._infoWindowShown = false;

    //     var tileCartesian2 = undefined;
    //     var cartesian3 = self.skywayCesium.getGroundPoint(event.position, 'TERRAIN');
    //     var cartographiPoint = Cesium.Cartographic.fromCartesian(cartesian3);
    //     var height = self.viewer.camera.positionCartographic.height;
    //     tileCartesian2 = layerProvider.tilingScheme.positionToTileXY(cartographiPoint, getLevel(height))
    //     layerProvider.pickFeatures(
    //         tileCartesian2.x,
    //         tileCartesian2.y,
    //         getLevel(height),
    //         cartographiPoint.longitude,
    //         cartographiPoint.latitude
    //     ).then(function (res) {
    //         layer.onFeaturePickCallback && layer.onFeaturePickCallback(res);
    //     });
    // }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // layer.onFeaturePickCallback = function (res) {
    //     var _skywayCesium = self.skywayCesium;
    //     if (_skywayCesium._infoWindowShown === false && res.length > 0) {
    //         var eAttributes = res[0].data.properties;
    //         var layerName = layer._layerName;

    //         if (layerName && eAttributes) {
    //             var layerConfig = _skywayCesium.options.layers.find(function (layerObj) {
    //                 return layerObj.name === layerName;
    //             });

    //             var infoWindowContent = InfoWindowContentCreator.getContent(
    //                 eAttributes,
    //                 layerConfig,
    //                 InfoWindowItemTemplate
    //             );

    //             debugger;
    //             if (infoWindowContent && !_skywayCesium._infoWindowShown) {
    //                 _skywayCesium._infoWindowShown = true;
    //                 _skywayCesium._infoWindow.setContent(infoWindowContent);

    //                 _skywayCesium._infoWindow.show();

    //             } else {
    //                 console.error('infowindow内容无法找到')
    //             }
    //         }
    //     }
    // }

    layer._layerName = name;
    layer.show = show;
    return layer;
}