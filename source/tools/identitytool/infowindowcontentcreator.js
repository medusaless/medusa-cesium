'use strict'; /**
              * InfoWindow模板
              */
var getContentFromHTMLString = function (template, entityAttributes) {
  Object.keys(entityAttributes).forEach(function (key) {
    template = template.replace(new RegExp('{' + key + '}', 'g'), entityAttributes[key]);
  });
  return template;
};

var getContentFromObject = function (template, entityAttributes) {
  var result = '';
  Object.keys(entityAttributes).forEach(function (key) {
    result += template
      .replace(/{key}/g, key)
      .replace(/{value}/g, entityAttributes[key]);
  });
  return result;
}


function filterFields(attributes, fields) {
  var result = {};
  Object.keys(attributes).forEach(function (key) {
    if (fields.indexOf(key) !== -1) {
      result[key] = attributes[key];
    }
  });
  return result;
}

function webserviceTranslate(attributes, config) {
  return $.ajax({
    url: config.url
  }).then(function (res) {
    return res;
  }).catch(function () {
    return 'error';
  });
}

function simpleTranslate(attributes, config) {
  var { translateKey, translateValue, keydictionary, valuedicionary } = config;

  // must translate value first
  if (translateValue) {
    attributes = _doSimpleTranslation(attributes, valuedicionary, 'value')
  }

  if (translateKey) {
    attributes = _doSimpleTranslation(attributes, keydictionary, 'key')
  }
  return attributes;
}

function _doSimpleTranslation(sourceAttributes, translatedAttributes, keyOrValue) {
  var result = {};
  $.extend(true, result, sourceAttributes);

  if (keyOrValue === 'key') {
    Object.keys(sourceAttributes).forEach(sourceKey => {
      var translatedKey = translatedAttributes[sourceKey];
      if (typeof translatedKey !== 'undefined') {
        result[translatedKey] = sourceAttributes[sourceKey]
        delete result[sourceKey];
      }
    });
  } else if (keyOrValue === 'value') {
    Object.keys(sourceAttributes).forEach(sourcekey => {
      var sourceValue = sourceAttributes[sourcekey];
      var translatedValue = translatedAttributes[sourceValue];
      if (typeof translatedValue !== 'undefined') {
        result[sourcekey] = translatedValue;
      }
    });
  }
  return result;
}

// the sequence of filterFields and doTranslation cannot be changed
var InfoWindowContentCreator = {
  getContent: async function (entityAttributes, identityConfig, itemTemplate) {
    var _identityConfig = $.extend(true, {}, identityConfig);
    var fields = _identityConfig.fields;
    var translationConfig = _identityConfig.translationConfig || {};
    var simpleTranslateConfig = translationConfig.simpleTranslate;
    var webserviceTranslateConfig = translationConfig.webserviceTranslate;
    var _attributes = $.extend(true, {}, entityAttributes);

    if (fields) {
      _attributes = filterFields(entityAttributes, fields);
    }

    if (webserviceTranslateConfig) {
      _attributes = await webserviceTranslate(_attributes, webserviceTranslateConfig);
    } else if (simpleTranslateConfig) {
      _attributes = await simpleTranslate(_attributes, simpleTranslateConfig);
    }

    return getContentFromObject(itemTemplate, _attributes, fields);
  }
}

export default InfoWindowContentCreator;
