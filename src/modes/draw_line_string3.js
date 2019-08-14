const CommonSelectors = require('../lib/common_selectors');
const isEventAtCoordinates = require('../lib/is_event_at_coordinates');
const doubleClickZoom = require('../lib/double_click_zoom');
const Constants = require('../constants');
const createVertex = require('../lib/create_vertex');
var turf_kinks = require('@turf/kinks');
var helpers = require('@turf/helpers');
var area=require('@turf/area')
const polygonSlice = require('../turf-polygon-slice'); //引入面切割模块
// const polygonSlice = require('../turf-cut'); 
const DrawLineString = {};

DrawLineString.onSetup = function (opts) {
  opts = opts || {};
  const featureId = opts.featureId;

  let line, currentVertexPosition;
  let direction = 'forward';
  var undo_arr = []; //画线过程中撤销数组
  var redo_arr = []; //画线过程中恢复数组
  var undo_stack = []; //编辑结束撤销数组
  var redo_stack = []; //编辑结束恢复数组
  if (featureId) {
    line = this.getFeature(featureId);
    if (!line) {
      throw new Error('Could not find a feature with the provided featureId');
    }
    let from = opts.from;
    if (from && from.type === 'Feature' && from.geometry && from.geometry.type === 'Point') {
      from = from.geometry;
    }
    if (from && from.type === 'Point' && from.coordinates && from.coordinates.length === 2) {
      from = from.coordinates;
    }
    if (!from || !Array.isArray(from)) {
      throw new Error('Please use the `from` property to indicate which point to continue the line from');
    }
    const lastCoord = line.coordinates.length - 1;
    if (line.coordinates[lastCoord][0] === from[0] && line.coordinates[lastCoord][1] === from[1]) {
      currentVertexPosition = lastCoord + 1;
      // add one new coordinate to continue from
      line.addCoordinate(currentVertexPosition, ...line.coordinates[lastCoord]);
    } else if (line.coordinates[0][0] === from[0] && line.coordinates[0][1] === from[1]) {
      direction = 'backwards';
      currentVertexPosition = 0;
      // add one new coordinate to continue from
      line.addCoordinate(currentVertexPosition, ...line.coordinates[0]);
    } else {
      throw new Error('`from` should match the point at either the start or the end of the provided LineString');
    }
  } else {
    line = this.newFeature({
      type: Constants.geojsonTypes.FEATURE,
      properties: {},
      geometry: {
        type: Constants.geojsonTypes.LINE_STRING,
        coordinates: []
      }
    });
    currentVertexPosition = 0;
    this.addFeature(line);
  }

  // this.clearSelectedFeatures();//如果是由选择切换到线切割则不清除已选要素--wzy20180228
  doubleClickZoom.disable(this);
  this.updateUIClasses({
    mouse: Constants.cursors.ADD
  });
  this.activateUIButton(Constants.types.LINE);
  this.setActionableState({
    trash: true
  });

  return {
    line,
    currentVertexPosition,
    direction,
    undo_arr,
    redo_arr,
    undo_stack,
    redo_stack,
  };
};

DrawLineString.clickAnywhere = function (state, e) {
  if (state.currentVertexPosition > 0 && isEventAtCoordinates(e, state.line.coordinates[state.currentVertexPosition - 1]) ||
    state.direction === 'backwards' && isEventAtCoordinates(e, state.line.coordinates[state.currentVertexPosition + 1])) {

    this.changeMode(Constants.modes.SIMPLE_SELECT, {
      featureIds: [state.line.id]
    });
    this.clearSelectedFeatures();
  }
  this.updateUIClasses({
    mouse: Constants.cursors.ADD
  });
  //判断新加的点是否会造成自相交
  var point_arr = state.line.coordinates.slice(0);
  point_arr.push([e.lngLat.lng, e.lngLat.lat])
  var new_line = helpers.lineString(point_arr);
  var kinks = turf_kinks(new_line);
  if (kinks.features.length == 0) {
    state.line.updateCoordinate(state.currentVertexPosition, e.lngLat.lng, e.lngLat.lat);
    if (state.direction === 'forward') {
      state.currentVertexPosition++;
      state.line.updateCoordinate(state.currentVertexPosition, e.lngLat.lng, e.lngLat.lat);
    } else {
      state.line.addCoordinate(0, e.lngLat.lng, e.lngLat.lat);
    }
  } else {
    this._ctx.options.openMessage('此点会使线自相交，不可添加！');
    this.changeMode(Constants.modes.SIMPLE_SELECT);
    return
  }

};

DrawLineString.clickOnVertex = function (state) {
  // console.log('bb')
  return this.changeMode(Constants.modes.SIMPLE_SELECT, {
    featureIds: [state.line.id]
  });
};

DrawLineString.onMouseMove = function (state, e) {
  state.line.updateCoordinate(state.currentVertexPosition, e.lngLat.lng, e.lngLat.lat);
  if (CommonSelectors.isVertex(e)) {
    this.updateUIClasses({
      mouse: Constants.cursors.POINTER
    });
  }
  // console.log(state.line);
  // console.log("cc",state.line.coordinates.length);
  // console.log(state.currentVertexPosition);
  // console.log('cc',state.undo_arr[state.undo_arr.length-1].coordinates);
};

DrawLineString.onTap = DrawLineString.onClick = function (state, e) {
  // console.log('cc')
  // if (CommonSelectors.isVertex(e)) return this.clickOnVertex(state, e);
  this.clickAnywhere(state, e);
};

DrawLineString.onKeyUp = function (state, e) {
  if (CommonSelectors.isEnterKey(e)) {
    this.changeMode(Constants.modes.SIMPLE_SELECT, {
      featureIds: [state.line.id]
    });
  } else if (CommonSelectors.isEscapeKey(e)) {
    this.deleteFeature([state.line.id], {
      silent: true
    });
    this.changeMode(Constants.modes.SIMPLE_SELECT);
  } else if (event.ctrlKey == true && event.keyCode == 90) {
    //按住ctrl+z删除一个节点
    var len = state.line.coordinates.length;
    if (len == 0) {
      return
    }
    var obj = {
      path: len - 1,
      coordinates: JSON.parse(JSON.stringify(state.line.getCoordinate(len - 1)))
    }
    state.undo_arr.push(obj);
    state.line.removeCoordinate(len - 1);
    state.currentVertexPosition--;
  } else if (event.ctrlKey == true && event.keyCode == 89) {
    //按住ctrl+Y恢复一步
    var len = state.undo_arr.length;
    if (len == 0) {
      return
    }
    state.currentVertexPosition++;
    state.line.updateCoordinate(state.currentVertexPosition, state.undo_arr[len - 1].coordinates[0], state.undo_arr[len - 1].coordinates[1]);
    state.undo_arr.splice(len - 1, 1);
  }
};

DrawLineString.onStop = function (state) {
  doubleClickZoom.enable(this);
  this.activateUIButton();

  // check to see if we've deleted this feature
  if (this.getFeature(state.line.id) === undefined) return;

  //remove last added coordinate
  state.line.removeCoordinate(`${state.currentVertexPosition}`);
  if (state.line.isValid()) {
    this.map.fire(Constants.events.CREATE, {
      features: [state.line.toGeoJSON()]
    });
  } else {
    this.deleteFeature([state.line.id], {
      silent: true
    });
    this.changeMode(Constants.modes.SIMPLE_SELECT, {}, {
      silent: true
    });
  }
};

DrawLineString.onTrash = function (state) {
  this.deleteFeature([state.line.id], {
    silent: true
  });
  this.changeMode(Constants.modes.SIMPLE_SELECT);
};

DrawLineString.toDisplayFeatures = function (state, geojson, display) {
  const isActiveLine = geojson.properties.id === state.line.id;
  geojson.properties.active = (isActiveLine) ? Constants.activeStates.ACTIVE : Constants.activeStates.INACTIVE;
  if (!isActiveLine) return display(geojson);
  // Only render the line if it has at least one real coordinate
  if (geojson.geometry.coordinates.length < 2) return;
  geojson.properties.meta = Constants.meta.FEATURE;
  display(createVertex(
    state.line.id,
    geojson.geometry.coordinates[state.direction === 'forward' ? geojson.geometry.coordinates.length - 2 : 1],
    `${state.direction === 'forward' ? geojson.geometry.coordinates.length - 2 : 1}`,
    false
  ));

  display(geojson);
};
DrawLineString.undo = function () {
  //画线过程中不可用
  if (state.undo_stack.length == 0) return
  var fea = state.undo_stack.pop();
  var del_ids = this.getChangedIds();
  var del_arr = [];
  var len1 = del_ids.length;
  var len2 = fea.length;
  // if (len === 0) return;
  for (var i = 0; i < len1; i++) {
    var ff = this.getFeature(del_ids[i]);
    del_arr.push(ff);
    this.deleteFeature(del_ids[i]);
  }
  for (var i = 0; i < len2; i++) {
    Draw.addFeature(fea[i]);
  }
  state.redo_stack.push(del_arr);
}
DrawLineString.redo = function () {
  //画线过程中不可用
  if (state.isDraw || state.redo_stack.length == 0) return
  var fea = state.redo_stack.pop();
  var del_ids = this.getChangedIds();
  var del_arr = [];
  var len1 = del_ids.length;
  var len2 = fea.length;
  // if (len === 0) return;
  for (var i = 0; i < len1; i++) {
    var ff = this.getFeature(del_ids[i]);
    del_arr.push(ff);
    this.deleteFeature(del_ids[i]);
  }
  for (var i = 0; i < len2; i++) {
    Draw.addFeature(fea[i]);
  }
  state.undo_stack.push(del_arr);
}
module.exports = DrawLineString;