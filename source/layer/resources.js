import Cesium from 'cesium/Cesium';
import LAYERS from '../constants/layername.js'
/**
 * 
 */
export default {
    [LAYERS.GoogleBaseMap]: new Cesium.UrlTemplateImageryProvider({
        url: 'http://www.google.cn/maps/vt?lyrs=s@748&gl=en&x={x}&y={y}&z={z}'
    }),
    [LAYERS.GoogleMapLabel]: new Cesium.UrlTemplateImageryProvider({
        url: 'http://www.google.cn/maps/vt/lyrs=h@177000000&hl=zh-CN&gl=en&x={x}&y={y}&z={z}'
    }),
    [LAYERS.GoogleTerrain]: new Cesium.UrlTemplateImageryProvider({
        url: 'http://mt2.google.cn/vt/lyrs=t@132,r@249000000&hl=zh-CN&src=app&s=Galileo&x={x}&y={y}&z={z}'
    }),
    [LAYERS.TiandituImagery]: new Cesium.UrlTemplateImageryProvider({
        url: 'http://t4.tianditu.com/DataServer?T=img_w&X={x}&Y={y}&L={z}'
    }),
    [LAYERS.TiandituVector]: new Cesium.UrlTemplateImageryProvider({
        url: 'http://t4.tianditu.cn/DataServer?T=cia_w&X={x}&Y={y}&L={z}'
    }),
    [LAYERS.TiandituTerrain]: new Cesium.UrlTemplateImageryProvider({
        url: 'http://t4.tianditu.com/DataServer?T=ter_w&X={x}&Y={y}&L={z}'
    }),
    [LAYERS.TiandituStreet]: new Cesium.UrlTemplateImageryProvider({
        url: 'http://t4.tianditu.com/DataServer?T=vec_w&X={x}&Y={y}&L={z}'
    }),
    [LAYERS.OpenStreetMap]: new Cesium.UrlTemplateImageryProvider({
        url: 'http://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    })
}