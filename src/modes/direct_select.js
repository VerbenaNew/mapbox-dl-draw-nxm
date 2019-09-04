const {
  noTarget,
  isOfMetaType,
  isInactiveFeature,
  isShiftDown,
  isActiveVertex
} = require('../lib/common_selectors');
const createSupplementaryPoints = require('../lib/create_supplementary_points');
const constrainFeatureMovement = require('../lib/constrain_feature_movement');
const doubleClickZoom = require('../lib/double_click_zoom');
const Constants = require('../constants');
const CommonSelectors = require('../lib/common_selectors');
const moveFeatures = require('../lib/move_features');
const util = require('../util');
var union = require('@turf/union');
var helpers = require('@turf/helpers');
var intersect = require('@turf/intersect');
var booleanContains = require('@turf/boolean-contains');
var booleanOverlap = require('@turf/boolean-overlap');
var unkink = require('@turf/unkink-polygon');
var kinks = require('@turf/kinks');
var computeArea = require('@turf/area');
var buffer = require('@turf/buffer');
// const snapVertex = require('../lib/snap_vertex');


const isVertex = isOfMetaType(Constants.meta.VERTEX);
const isMidpoint = isOfMetaType(Constants.meta.MIDPOINT);

const DirectSelect = {};

// INTERNAL FUCNTIONS

DirectSelect.fireUpdate = function () {
  this.map.fire(Constants.events.UPDATE, {
    action: Constants.updateActions.CHANGE_COORDINATES,
    features: this.getSelected().map(f => f.toGeoJSON())
  });
};

DirectSelect.fireActionable = function (state) {
  this.setActionableState({
    combineFeatures: false,
    uncombineFeatures: false,
    trash: state.selectedCoordPaths.length > 0
  });
};

DirectSelect.startDragging = function (state, e) {
  this.map.dragPan.disable();
  state.canDragMove = true;
  state.dragMoveLocation = e.lngLat;
};

DirectSelect.stopDragging = function (state) {
  this.map.dragPan.enable();
  state.dragMoving = false;
  state.canDragMove = false;
  state.dragMoveLocation = null;
};

DirectSelect.onVertex = function (state, e) {
  // state.bakFeatures = state.features.map(function (fea) {
  //   return JSON.parse(JSON.stringify(fea));
  // })
  var features = this.getSelected();
  var e_featureIds = [];
  var vertex_parents = [];
  var vertex_coords = [];
  // var polygon=features[0].toGeoJSON();
  // var pp=[e.lngLat.lng,e.lngLat.lat];
  // util.addVertex(pp,polygon)
  e.featureTarget2.forEach(fea => {
    if (fea.properties.meta === "feature") {
      e_featureIds.push(fea.properties.id);
    }
  })
  e_featureIds = Array.from(new Set(e_featureIds))
  this._backFeatures(state);
  this.startDragging(state, e);
  const about = e.featureTarget.properties;
  const selectedIndex = state.selectedCoordPaths.indexOf(about.coord_path);
  if (!isShiftDown(e) && selectedIndex === -1) {
    state.selectedCoordPaths = [about.coord_path];
    state.selectedCoordPaths2 = []
    state.featureIds.forEach(id => {
      e.featureTarget2.forEach(fea => {
        if (fea.properties.parent && id == fea.properties.parent && fea.properties.meta == "vertex")
          state.selectedCoordPaths2.push(fea.properties.coord_path);
        vertex_parents.push(fea.properties.parent)
      });
    });

  } else if (isShiftDown(e) && selectedIndex === -1) {
    this.map.fire('noFeatureSelect');
    state.selectedCoordPaths.push(about.coord_path);
  }
 
  //如果选中多个节点。提示返回
  if (state.selectedCoordPaths2.length > state.featureIds.length) {
    this._ctx.options.openMessage('选中多个节点，不可以移动，可按delete删除，或者选择其他节点');
    // this.changeMode(Constants.modes.SIMPLE_SELECT);
    // return
  }
  //如果节点个数小于要素个数
  if (state.selectedCoordPaths2.length < state.featureIds.length) {
    //判断选中要素和target2中是否相同
    var isidSame = state.featureIds.sort().toString() == e_featureIds.sort().toString();
    if (!isidSame) {
      vertex_parents = [];
      state.selectedCoordPaths2 = []
      e_featureIds.forEach(id => {
        e.featureTarget2.forEach(fea => {
          if (fea.properties.parent && id == fea.properties.parent && fea.properties.meta == "vertex") {
            state.selectedCoordPaths2.push(fea.properties.coord_path);
            vertex_parents.push(fea.properties.parent)
          }
        });
      });
      state.featureIds = e_featureIds;
      state.features = []
      state.featureIds.forEach(id => {
        let feature = this.getFeature(id);
        state.features.push(feature);
      });
      if (state.selectedCoordPaths2.length < state.featureIds.length) {
        this.changeMode(Constants.modes.DIRECT_SELECT, {
          featureId: e.featureTarget.properties.parent,
          coordPath: e.featureTarget.properties.coord_path,
          featureIds: state.featureIds, //e.featureTarget.properties.parent,
          coordPaths: state.selectedCoordPaths2,
          startPos: e.lngLat,
          noHightlight: true
        });
        return
      }

    } else {
      vertex_parents = [];
      state.selectedCoordPaths2 = []
      e_featureIds.forEach(id => {
        e.featureTarget2.forEach(fea => {
          if (fea.properties.parent && id == fea.properties.parent && fea.properties.meta == "vertex") {
            state.selectedCoordPaths2.push(fea.properties.coord_path);
            vertex_parents.push(fea.properties.parent);
            vertex_coords.push(fea._geometry.coordinates)
          }
        });
      });
      //如果要素相同，则不共点需要添加节点
      var no_parent = vertex_parents.concat(state.featureIds).filter(v => !vertex_parents.includes(v) || !state.featureIds.includes(v));
      no_parent.filter(item => {
        return item !== undefined
      })
      no_parent = Array.from(new Set(no_parent))
      var features = this.getSelected();
      no_parent.forEach(id => {
        features.forEach(fea => {
          if (fea.id == id) {
            var ff_no = fea.toGeoJSON();
            var ppp = helpers.point(vertex_coords[0]);
            var add_obj_no = util.addVertex(ppp, ff_no);
            var path = add_obj_no.idx + 1
            fea.addCoordinate('0.0.' + path, add_obj_no.point.geometry.coordinates[0], add_obj_no.point.geometry.coordinates[1]);
            state.selectedCoordPaths2.push('0.0.' + path)
          }
        })
      })
      this.doRender();
    }
  }
  // const selectedCoordinates = this.pathsToCoordinates(state.featureId, state.selectedCoordPaths);
  // this.setSelectedCoordinates(selectedCoordinates);
  if (state.featureIds && state.featureIds.length != 0) {
    state.selected = [];
    state.featureIds.forEach((feaId, index) => {
      state.selected.push(...this.pathsToCoordinates(feaId, [state.selectedCoordPaths2[index]]));
    }, this)
  }
  this.setSelectedCoordinates(state.selected);


};
DirectSelect.onKeyUp = function (state, e) {
  if (CommonSelectors.isCtrlKey && CommonSelectors.isZkey) {
    let features = state.features;
    state.selectedCoordPaths2.forEach((coordPath, index) => {
      const selectedCoords = state.bakFeatures[index];
      for (let i = 0; i < selectedCoords.length; i++) {
        const coord = selectedCoords[i];
        features[index].updateCoordinate(state.selectedCoordPaths2[index], coord[0], coord[1]);
      }
    }, this);
  }
}
DirectSelect._backFeatures = function (state) {
  const features = state.features;
  state.bakFeatures = [];
  state.selectedCoordPaths2.forEach((coordPath, index) => {
    // const selectedCoords = [coordPath].map(coord_path => features[index] && features[index].getCoordinate(coord_path));
    if (features[index]) {
      var selectedCoords = [features[index].getCoordinate(coordPath)]
    } else {
      var selectedCoords = []
    }
    if (selectedCoords.length != 0) {
      state.bakFeatures.push(selectedCoords);
    }

  }, this);

}

DirectSelect.onMidpoint = function (state, e) {
  this.startDragging(state, e);
  const about = e.featureTarget.properties;
  state.feature.addCoordinate(about.coord_path, about.lng, about.lat);
  this.fireUpdate();
  state.selectedCoordPaths = [about.coord_path];
};

DirectSelect.pathsToCoordinates = function (featureId, paths) {
  return paths.map(coord_path => {
    // let coord_path = paths;
    return {
      feature_id: featureId,
      coord_path
    };
  });
};

DirectSelect.onFeature = function (state, e) {
  if (state.selectedCoordPaths.length === 0) this.startDragging(state, e);
  else this.stopDragging(state);
};

DirectSelect.dragFeature = function (state, e, delta) {
  moveFeatures(this.getSelected(), delta);
  state.dragMoveLocation = e.lngLat;
};

DirectSelect.dragVertex = function (state, e, delta) {
  // state.selectedCoordPaths2=['0.544','0.33'];
  // state.features = [];
  // debugger
  const features = state.features;

  //如果选中多个节点。提示返回
  if (state.selectedCoordPaths2.length > state.featureIds.length) {
    // this._ctx.options.openMessage('选中多个节点，不可以移动，选择其他节点或请放大后选中节点');
    // this.changeMode(Constants.modes.SIMPLE_SELECT);
    return
  }
  if (state.selectedCoordPaths2.length != features.length) {
    return
  }
  state.selectedCoordPaths2.forEach((coordPath, index) => {
    var selectedCoords = []
    if (features[index]) {
      selectedCoords.push(features[index].getCoordinate(coordPath))
    }
    // const selectedCoords = [coordPath].map(coord_path => features[index] && features[index].getCoordinate(coord_path));
    if (selectedCoords.length != 0) {
      const selectedCoordPoints = selectedCoords.map(coords => ({
        type: Constants.geojsonTypes.FEATURE,
        properties: {},
        geometry: {
          type: Constants.geojsonTypes.POINT,
          coordinates: coords
        }
      }));

      const constrainedDelta = constrainFeatureMovement(selectedCoordPoints, delta);
      for (let i = 0; i < selectedCoords.length; i++) {
        const coord = selectedCoords[i];
        features[index].updateCoordinate(state.selectedCoordPaths2[index], coord[0] + constrainedDelta.lng, coord[1] + constrainedDelta.lat);
        // console.log(features[index].toJSON());
      }
    }

    // console.log(features);
  }, this);
  // const ctx = e.snapCtx;
  // const snapNode = snapVertex(e, ctx);

  //移动过程中显示捕捉效果
  // snapVertex()

};

DirectSelect.clickNoTarget = function () {
  this.changeMode(Constants.modes.SIMPLE_SELECT);
};

DirectSelect.clickInactive = function () {
  this.changeMode(Constants.modes.SIMPLE_SELECT);
};

DirectSelect.clickActiveFeature = function (state) {
  state.selectedCoordPaths = [];
  this.clearSelectedCoordinates();
  state.feature.changed();
};

// EXTERNAL FUNCTIONS

DirectSelect.onSetup = function (opts) {
  const featureId = opts.featureId;
  const feature = this.getFeature(featureId);
  const featureIds = opts.featureIds;
  const features = [];
  const bakFeatures = [];
  if (featureIds && featureIds.length != 0) {
    featureIds.forEach(id => {
      let feature = this.getFeature(id);
      features.push(feature);
    });
  }


  if (!feature) {
    throw new Error('You must provide a featureId to enter direct_select mode');
  }

  if (feature.type === Constants.geojsonTypes.POINT) {
    throw new TypeError('direct_select mode doesn\'t handle point features');
  }

  const state = {
    featureId,
    feature,
    featureIds,
    features,
    bakFeatures,
    dragMoveLocation: opts.startPos || null,
    dragMoving: false,
    canDragMove: false,
    noHightlight: opts.noHightlight || false,
    selectedCoordPaths: opts.coordPath ? [opts.coordPath] : [],
    selectedCoordPaths2: opts.coordPaths ? opts.coordPaths : [],
    selected: []
  };

  // var featureId = featureIds[0];
  //将选中的节点idx和featureId存在state中以便高亮对应
  // var selected = [];
  if (state.featureIds && state.featureIds.length != 0) {
    state.featureIds.forEach((feaId, index) => {
      state.selected.push(...this.pathsToCoordinates(feaId, [state.selectedCoordPaths2[index]]));
    }, this)
  }
  this.setSelectedCoordinates(state.selected); //(this.pathsToCoordinates(featureId, state.selectedCoordPaths));
  // this.setSelected(featureIds);

  doubleClickZoom.disable(this);

  this.setActionableState({
    trash: true
  });
  if (state.noHightlight) {
    this.map.fire("changeVertexClick", {
      ids: state.featureIds
    })
    this._ctx.options.openMessage('已选中新的共边图形')
  }
  return state;
};

DirectSelect.onStop = function () {
  doubleClickZoom.enable(this);
  this.clearSelectedCoordinates();
};

DirectSelect.toDisplayFeatures = function (state, geojson, push) {

  if (state.featureIds) {
    var index = state.featureIds && state.featureIds.findIndex(id => {
      return id == geojson.properties.id
    });
  }
  if (index > -1) {
    geojson.properties.active = Constants.activeStates.ACTIVE;
    var selected_path = state.selected.filter(item => {
      return item.feature_id == geojson.properties.id
    })
    push(geojson);
    if (state.noHightlight) {
      createSupplementaryPoints(geojson, {
        map: this.map,
        midpoints: false, //暂时不计算中点wzy--20180415
        selectedPaths: null //state.selectedCoordPaths2[index]
      }).forEach(push);
    } else {
      createSupplementaryPoints(geojson, {
        map: this.map,
        midpoints: false, //暂时不计算中点wzy--20180415
        selectedPaths: selected_path[0].coord_path //state.selectedCoordPaths2[index]
      }).forEach(push);
    }
  } else {
    geojson.properties.active = Constants.activeStates.INACTIVE;
    // if (state.noHightlight) {
    //   createSupplementaryPoints(geojson, {
    //     map: this.map,
    //     midpoints: false, //暂时不计算中点wzy--20180415
    //     selectedPaths: null //state.selectedCoordPaths2[index]
    //   }).forEach(push);
    //   return
    // }
    push(geojson);

  }
  this.fireActionable(state);
};

DirectSelect.onTrash = function (state) {
  if (state.selectedCoordPaths2.length > 1) {
    state.selectedCoordPaths2.forEach((id, idx) => {
      state.features[idx].removeCoordinate(id)
    })
    this.map.fire(Constants.events.UPDATE, {
      action: Constants.updateActions.CHANGE_COORDINATES,
      features: this.getSelected().map(f => f.toGeoJSON())
    });
    state.selectedCoordPaths = [];
    state.selectedCoordPaths2 = [];
    this.clearSelectedCoordinates();
    this.fireActionable(state);
    if (state.feature.isValid() === false) {
      this.deleteFeature(state.featureIds);
      this.changeMode(Constants.modes.SIMPLE_SELECT, {});
    }
    this.changeMode(Constants.modes.DIRECT_SELECT, {
      featureId: state.featureId,
      coordPath: state.selectedCoordPaths,
      featureIds: state.featureIds, //e.featureTarget.properties.parent,
      coordPaths: state.selectedCoordPaths2,
      noHightlight: false
    });
  } else {
    state.selectedCoordPaths.sort().reverse().forEach(id => state.feature.removeCoordinate(id));
    this.map.fire(Constants.events.UPDATE, {
      action: Constants.updateActions.CHANGE_COORDINATES,
      features: this.getSelected().map(f => f.toGeoJSON())
    });
    state.selectedCoordPaths = [];
    state.selectedCoordPaths2 = [];
    this.clearSelectedCoordinates();
    this.fireActionable(state);
    if (state.feature.isValid() === false) {
      this.deleteFeature([state.featureId]);
      this.changeMode(Constants.modes.SIMPLE_SELECT, {});
    }
  }
};

DirectSelect.onMouseMove = function (state, e) {
  // On mousemove that is not a drag, stop vertex movement.
  const isFeature = CommonSelectors.isActiveFeature(e);
  const onActiveVertex = isActiveVertex(e);
  const onVertex = isVertex(e);
  const noCoords = state.selectedCoordPaths.length === 0;
  if (isFeature && noCoords) this.updateUIClasses({
    mouse: Constants.cursors.MOVE
  });
  else if (onActiveVertex && !noCoords) this.updateUIClasses({
    mouse: Constants.cursors.MOVE
  });
  else if (onVertex && !noCoords) this.updateUIClasses({
    mouse: Constants.cursors.POINTER
  });
  else this.updateUIClasses({
    mouse: Constants.cursors.NONE
  });
  this.stopDragging(state);
};

DirectSelect.onMouseOut = function (state) {
  // As soon as you mouse leaves the canvas, update the feature
  if (state.dragMoving) this.fireUpdate();
};

DirectSelect.onTouchStart = DirectSelect.onMouseDown = function (state, e) {
  if (isVertex(e)) return this.onVertex(state, e);

  if (CommonSelectors.isActiveFeature(e)) return this.onFeature(state, e);
  if (isMidpoint(e)) return this.onMidpoint(state, e);
};

DirectSelect.onDrag = function (state, e) {
  if (state.canDragMove !== true) return;
  state.dragMoving = true;
  e.originalEvent.stopPropagation();

  const delta = {
    lng: e.lngLat.lng - state.dragMoveLocation.lng,
    lat: e.lngLat.lat - state.dragMoveLocation.lat
  };
  if (state.selectedCoordPaths.length > 0) this.dragVertex(state, e, delta);
  else this.dragFeature(state, e, delta);

  state.dragMoveLocation = e.lngLat;
};

DirectSelect.onClick = function (state, e) {
  debugger
  state.noHightlight = false;
  if (noTarget(e)) return this.clickNoTarget(state, e);
  if (CommonSelectors.isActiveFeature(e)) return this.clickActiveFeature(state, e);
  if (isInactiveFeature(e)) return this.clickInactive(state, e);
  this.stopDragging(state);
};

DirectSelect.onTap = function (state, e) {
  state.noHightlight = false;
  if (noTarget(e)) return this.clickNoTarget(state, e);
  if (CommonSelectors.isActiveFeature(e)) return this.clickActiveFeature(state, e);
  if (isInactiveFeature(e)) return this.clickInactive(state, e);
};

DirectSelect.onTouchEnd = DirectSelect.onMouseUp = function (state) {
  state.noHightlight = false;
  if (state.dragMoving) {
    this.fireUpdate();
  }
  this.stopDragging(state);
};



module.exports = DirectSelect;