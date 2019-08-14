

const CommonSelectors = require('../lib/common_selectors');
const isEventAtCoordinates = require('../lib/is_event_at_coordinates');
const doubleClickZoom = require('../lib/double_click_zoom');
const Constants = require('../constants');
const createVertex = require('../lib/create_vertex');
const polygonSlice = require('../turf-polygon-slice'); //引入面切割模块
const util = require('../util');

var SnapDrawMode = {};
// When the mode starts this function will be called.
// The `opts` argument comes from `draw.changeMode('lotsofpoints', {count:7})`.
// The value returned should be an object and will be passed to all other lifecycle functions
SnapDrawMode.onSetup = function (opts) {
  var state = {};
  state.count = opts.count || 0;
  state.layerIds = opts.layerIds || null;

  let line, currentVertexPosition;
  line = this.newFeature({
    type: 'Feature', //Constants.geojsonTypes.FEATURE,
    properties: {},
    geometry: {
      type: 'LineString', //Constants.geojsonTypes.LINE_STRING,
      coordinates: []
    }
  });
  currentVertexPosition = 0;
  this.addFeature(line);
  state.line = line;
  state.currentPointOnline = null;
  state.currentVertexPosition = currentVertexPosition;

  //用于记录已有点
  state.linePointsDic = {};
  return state;
};

SnapDrawMode.clickAnywhere = function (state, e) {
  if (state.currentVertexPosition > 0 && isEventAtCoordinates(e, state.line.coordinates[state.currentVertexPosition - 1])
    // || state.direction === 'backwards' && isEventAtCoordinates(e, state.line.coordinates[state.currentVertexPosition + 1])
  ) {
    return this.changeMode(Constants.modes.SIMPLE_SELECT, {
      featureIds: [state.line.id]
    });
  }
  var snapped = util.findPoint(state, this.map, e.point, e.lngLat);
  if (!snapped) return;
  var newPoint = this.newFeature(snapped);

  // state.currentPointOnline = newPoint;
  state.line.updateCoordinate(state.currentVertexPosition, newPoint.coordinates[0], newPoint.coordinates[1]);
  state.currentVertexPosition++;
  // this.addFeature(newPoint);
};
// Whenever a user clicks on the map, Draw will call `onClick`
SnapDrawMode.onClick = function (state, e) {
  if (e.originalEvent.button == 2) {
    //右键结束
    return this.changeMode(Constants.modes.SIMPLE_SELECT, {
      featureIds: [state.line.id]
    });
  } else {
    this.clickAnywhere(state, e);
  }
  // if (state.currentVertexPosition > 0) {
  //   var kk = isEventAtCoordinates(e, state.line.coordinates[state.currentVertexPosition - 1]);
  //   console.log(kk);
  // }
  // // isEventAtCoordinates(e, state.line.coordinates[state.currentVertexPosition - 1]);
  // if (state.currentVertexPosition > 0 && isEventAtCoordinates(e, state.line.coordinates[state.currentVertexPosition - 1])
  //   // || state.direction === 'backwards' && isEventAtCoordinates(e, state.line.coordinates[state.currentVertexPosition + 1])
  // ) {
  //   return this.changeMode(Constants.modes.SIMPLE_SELECT, {
  //     featureIds: [state.line.id]
  //   });
  // }
  // var snapped = util.findPoint(state, this.map, e.point, e.lngLat);
  // if (!snapped) return;
  // var newPoint = this.newFeature(snapped);

  // // state.currentPointOnline = newPoint;
  // state.line.updateCoordinate(state.currentVertexPosition, newPoint.coordinates[0], newPoint.coordinates[1]);
  // state.currentVertexPosition++;
  // this.addFeature(newPoint);
};
// This is the only required function for a mode.
// It decides which features currently in Draw's data store will be rendered on the map.
// All features passed to `display` will be rendered, so you can pass multiple display features per internal feature.
// See `styling-draw` in `API.md` for advice on making display features
SnapDrawMode.toDisplayFeatures = function (state, geojson, display) {
  display(geojson);
};
SnapDrawMode.onMouseMove = function (state, e) {
  // if (state.currentPointOnline) {
  //   console.log(state.currentPointOnline);
  //   state.line.updateCoordinate(state.currentVertexPosition, e.lngLat.lng, e.lngLat.lat);
  //   // state.line.updateCoordinate(state.currentVertexPosition, state.currentPointOnline.coordinates[0], state.currentPointOnline.coordinates[1]);
  // }
  var snapped = util.findPoint(state, this.map, e.point, e.lngLat);
  if (!snapped) return;
  var newPoint = this.newFeature(snapped);
  // if (!state.linePointsDic[newPoint.coordinates]) {
    // this.addFeature(newPoint);
    console.log('增点')
    // state.linePointsDic[newPoint.coordinates] = 1;
    state.line.updateCoordinate(state.currentVertexPosition, newPoint.coordinates[0], newPoint.coordinates[1]);
    state.currentVertexPosition++;
  // }

  // state.line.updateCoordinate(state.currentVertexPosition, e.lngLat.lng, e.lngLat.lat);
};
// SnapDrawMode
module.exports = SnapDrawMode;
