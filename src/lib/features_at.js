const sortFeatures = require('./sort_features');
const mapEventToBoundingBox = require('./map_event_to_bounding_box');
const Constants = require('../constants');
const StringSet = require('./string_set');

const META_TYPES = [
  Constants.meta.FEATURE,
  Constants.meta.MIDPOINT,
  Constants.meta.VERTEX
];

// Requires either event or bbox
module.exports = {
  click: featuresAtClick,
  touch: featuresAtTouch
};

function featuresAtClick(event, bbox, ctx, snaped) {
  return featuresAt(event, bbox, ctx, ctx.options.clickBuffer, snaped);
}

function featuresAtTouch(event, bbox, ctx) {
  return featuresAt(event, bbox, ctx, ctx.options.touchBuffer);
}

function featuresAt(event, bbox, ctx, buffer, snaped) {
  if (ctx.map === null) return [];

  const box = (event) ? mapEventToBoundingBox(event, buffer) : bbox;

  const queryParams = {};
  if (ctx.options.styles) {
    queryParams.layers = [];
    ctx.options.styles.map(s => {
      if (s.id.indexOf('snap') < 0)
        queryParams.layers.push(s.id);
    });
  }
  //开启捕捉
  if (snaped) {
    // if (!ctx.options.snapedLayerIds) { console.log('请传入捕捉图层'); return []; }
    // queryParams.layers = ctx.options.snapedLayerIds;
  }

  const features = ctx.map.queryRenderedFeatures(box, queryParams)
    .filter((feature) => {
      return META_TYPES.indexOf(feature.properties.meta) !== -1;
    });

  const featureIds = new StringSet();
  const uniqueFeatures = [];
  features.forEach((feature) => {
    // let featureId;
    // if (feature.properties.meta === 'vertex') {
    //   featureId = feature.properties.parent;
    // } else {
    //   featureId = feature.properties.id;
    // }
    const featureId = feature.properties.id;
    if (featureIds.has(featureId)) return;
    featureIds.add(featureId);
    uniqueFeatures.push(feature);
  });

  return sortFeatures(uniqueFeatures);
}