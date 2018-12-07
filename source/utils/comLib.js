// ReSharper disable once NativeTypePrototypeExtending
String.prototype.format = function (args) {
    var result = this;
    if (arguments.length < 1) {
        return result;
    }
    var dataArray = [];
    if (arguments.length == 1) {
        if (typeof (args) == "object") {
            //如果模板参数是对象
            dataArray = [args];
        } else if (args instanceof Array) {
            //如果模板参数是对象数组 
            dataArray = args;
        }
    } else if (arguments.length > 1) {
        dataArray = arguments
    }
    for (let index = dataArray.length - 1; index >= 0; index--) {
        var data = dataArray[index];
        for (var key in data) {
            var value = data[key];
            if (undefined != value) {
                //result = result.replace("{" + key + "}", value);
                result = result.replaceAll("{" + key + "}", value);
            }
        }
    }
    return result;
};
String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

var comLib = {

    isObj: function (obj) {
        return typeof obj === "object" && !Array.isArray(obj);
    },
    isNumbr: function (obj) {
        return typeof obj === "number"
    },
    isArray: function (obj) {
        return obj instanceof Array;
    },
    isFunc: function (obj) {
        return typeof obj === "function"
    },
    isString: function (obj) {
        return typeof obj === "string"
    },
    isDom: function (obj) {
        return obj instanceof Element;
    },
    isJqueryObj: function (obj) {
        return jQuery ? obj instanceof jQuery : false
    },
    isEmptyObj:function(obj){
        return Object.keys(obj).length === 0 && obj.constructor === Object
    },
    inhertProtoype: function (parent, child) {
        var f = Object.create(parent.prototype);
        f.constructor = child;
        child.prototype = f
    },
    inhertObject: function (parent) {
        var _func = function () { }
        _func.prototype = Object.create(parent);
        return new _func();
    },
    removeArray: function (array, compare) {
        var index = array.findIndex(compare)
        if (index > -1) {
            array.splice(index, 1);
        }
    },
    formatArea: function (area) {
        //定义面积变量
        // var area = polygon.getArea();

        //定义输出变量
        var output;
        //当面积大于10000时，转换为平方千米，否则为平方米
        if (area > 10000) {
            output = (Math.round(area / 1000000 * 100) / 100) + ' ' + 'km<sup>2</sup>';
        } else {
            output = (Math.round(area * 100) / 100) + ' ' + 'm<sup>2</sup>';
        }
        return output;
    },
    formatLength: function (lineLength) {
        //定义长度变量
        var length;
        //如果大地测量复选框被勾选，则计算球面距离
        //Return the length of the linestring on projected plane.
        //计算平面距离
        length = Math.round(lineLength * 100) / 100;
        //定义输出变量
        var output;
        //如果长度大于1000，则使用km单位，否则使用m单位
        if (length > 1000) {
            output = (Math.round(length / 1000 * 100) / 100) + ' ' + 'km'; //换算成KM单位
        } else {
            output = (Math.round(length * 100) / 100) + ' ' + 'm'; //m为单位
        }
        return output;
    },
    getRandom:function(rad){
        return  +new Date() + Math.round(Math.random()*(rad||100));
    },
    deepClone(obj){
        return JSON.parse(JSON.stringify(obj));
    }

}

export default comLib
// module.exports = comLib;