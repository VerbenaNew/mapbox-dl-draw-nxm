import {
  feature
} from '@turf/turf';

const CommonSelectors = require('../lib/common_selectors');
const mouseEventPoint = require('../lib/mouse_event_point');
const createSupplementaryPoints = require('../lib/create_supplementary_points');
const StringSet = require('../lib/string_set');
const doubleClickZoom = require('../lib/double_click_zoom');
const moveFeatures = require('../lib/move_features');
const Constants = require('../constants');
const snapVertex = require('../lib/snap_vertex');
var union = require('@turf/union');
var helpers = require('@turf/helpers');
var intersect = require('@turf/intersect');
var booleanContains = require('@turf/boolean-contains');
var booleanOverlap = require('@turf/boolean-overlap');
var unkink = require('@turf/unkink-polygon');
var kinks = require('@turf/kinks');
var computeArea = require('@turf/area');
var buffer = require('@turf/buffer');
const SimpleSelect = {};

SimpleSelect.onSetup = function (opts) {
  // turn the opts into state.
  const state = {
    dragMoveLocation: null,
    boxSelectStartLocation: null,
    boxSelectElement: undefined,
    boxSelecting: false,
    canBoxSelect: false,
    dragMoveing: false,
    canDragMove: false,
    isAddVertex: false,
    initiallySelectedFeatureIds: opts.featureIds || []
  };

  this.setSelected(state.initiallySelectedFeatureIds.filter(id => {
    return this.getFeature(id) !== undefined;
  }));
  this.fireActionable();

  this.setActionableState({
    combineFeatures: true,
    uncombineFeatures: true,
    trash: true
  });

  return state;
};

SimpleSelect.fireUpdate = function () {
  this.map.fire(Constants.events.UPDATE, {
    action: Constants.updateActions.MOVE,
    features: this.getSelected().map(f => f.toGeoJSON())
  });
};

SimpleSelect.fireActionable = function () {
  const selectedFeatures = this.getSelected();

  const multiFeatures = selectedFeatures.filter(
    feature => this.isInstanceOf('MultiFeature', feature)
  );

  let combineFeatures = false;

  if (selectedFeatures.length > 1) {
    combineFeatures = true;
    const featureType = selectedFeatures[0].type.replace('Multi', '');
    selectedFeatures.forEach(feature => {
      if (feature.type.replace('Multi', '') !== featureType) {
        combineFeatures = false;
      }
    });
  }

  const uncombineFeatures = multiFeatures.length > 0;
  const trash = selectedFeatures.length > 0;

  this.setActionableState({
    combineFeatures,
    uncombineFeatures,
    trash
  });
};

SimpleSelect.getUniqueIds = function (allFeatures) {
  if (!allFeatures.length) return [];
  const ids = allFeatures.map(s => s.properties.id)
    .filter(id => id !== undefined)
    .reduce((memo, id) => {
      memo.add(id);
      return memo;
    }, new StringSet());

  return ids.values();
};

SimpleSelect.stopExtendedInteractions = function (state) {
  if (state.boxSelectElement) {
    if (state.boxSelectElement.parentNode) state.boxSelectElement.parentNode.removeChild(state.boxSelectElement);
    state.boxSelectElement = null;
  }

  this.map.dragPan.enable();

  state.boxSelecting = false;
  state.canBoxSelect = false;
  state.dragMoving = false;
  state.canDragMove = false;
};

SimpleSelect.onStop = function () {
  doubleClickZoom.enable(this);
};

SimpleSelect.onMouseUp = function (state, e) {
  // Any mouseup should stop box selecting and dragMoving
  if (CommonSelectors.true(e)) return this.stopExtendedInteractions(state);
};

SimpleSelect.onMouseMove = function (state, e) {
  // On mousemove that is not a drag, stop extended interactions.
  // This is useful if you drag off the canvas, release the button,
  // then move the mouse back over the canvas --- we don't allow the
  // interaction to continue then, but we do let it continue if you held
  // the mouse button that whole time
  let ctx = e.snapCtx;
  // if (ctx.snaped) {

  //   const snapNode = snapVertex(e, ctx);
  // }

  // debugger
  return this.stopExtendedInteractions(state);
};

SimpleSelect.onMouseOut = function (state) {
  // As soon as you mouse leaves the canvas, update the feature
  if (state.dragMoving) return this.fireUpdate();
};

SimpleSelect.onTap = SimpleSelect.onClick = function (state, e) {
  //如果选中面并且至选中1个面时则fire事件featureSelect
  // Click (with or without shift) on no feature
  if (CommonSelectors.isFeature(e) && (e.featureTarget._geometry.type == 'Polygon' || e.featureTarget._geometry.type == 'MultiPolygon') && e.featureTarget2.length == 1) {
    this.map.fire('PolygonSelect', {
      obj: e.featureTarget,
      mapEvent: e
    });
  } else {
    this.map.fire('noFeatureSelect');
  }
  //如果是添加节点，则需要查询后判断后添加--wzy20180426
  if (!state.isAddVertex) {
    if (CommonSelectors.noTarget(e)) return this.clickAnywhere(state, e); // also tap
    if (CommonSelectors.isOfMetaType(Constants.meta.VERTEX)(e)) return this.clickOnVertex(state, e); //tap
    if (CommonSelectors.isFeature(e)) return this.clickOnFeature(state, e);
  } else {
    var ids = [];
    var vertexs = [];
    var target2 = e.featureTarget2;
    target2.forEach(fea => {
      if (fea.properties.meta === "feature") {
        ids.push(fea.properties.id);
      }
    })
    ids = Array.from(new Set(featureIds))
    ids.forEach(id => {
      target2.forEach(fea => {
        if (fea.properties.parent && id == fea.properties.parent && fea.properties.meta == "vertex")
          vertexs.push(fea);
      });
    });
    //如果没有点到节点，则查看范围内的要素是不是被选中要素，如果是则给被选中要素分别添加点--wzy20180426
    if (vertexs.length == 0) {

    }
    //如果已经有节点切所有选择要素的有这个节点则不处理--wzy20180426
    if (vertexs.length == ids.length) {
      this.clearSelectedFeatures();
    }
  }


};

SimpleSelect.clickAnywhere = function (state) {
  // Clear the re-render selection
  const wasSelected = this.getSelectedIds();
  if (wasSelected.length) {
    this.clearSelectedFeatures();
    wasSelected.forEach(id => this.doRender(id));
  }
  doubleClickZoom.enable(this);
  this.stopExtendedInteractions(state);
};

SimpleSelect.clickOnVertex = function (state, e) {
  // Enter direct select mode 
  debugger
  let featureIds = []
  let coord_paths = [];
  var target2 = e.featureTarget2;
  target2.forEach(fea => {
    if (fea.properties.meta === "feature") {
      featureIds.push(fea.properties.id);
    }
  })
  featureIds = Array.from(new Set(featureIds))
  featureIds.forEach(id => {
    target2.forEach(fea => {
      if (fea.properties.parent && id == fea.properties.parent && fea.properties.meta == "vertex")
        coord_paths.push(fea.properties.coord_path);
    });
  });
  //如果是添加节点则不切换wzy--20180426
  if (!state.isAddVertex) {
    this.changeMode(Constants.modes.DIRECT_SELECT, {
      featureId: e.featureTarget.properties.parent,
      coordPath: e.featureTarget.properties.coord_path,
      featureIds: featureIds, //e.featureTarget.properties.parent,
      coordPaths: coord_paths,
      startPos: e.lngLat
    });
  }
  this.updateUIClasses({
    mouse: Constants.cursors.MOVE
  });
};

SimpleSelect.startOnActiveFeature = function (state, e) {
  // Stop any already-underway extended interactions
  this.stopExtendedInteractions(state);


  // Disable map.dragPan immediately so it can't start
  // this.map.dragPan.disable();

  // Re-render it and enable drag move
  this.doRender(e.featureTarget.properties.id);
  // Set up the state for drag moving
  //wzy--修改不可移动面但可以移动地图
  if (!(e.featureTarget._geometry.type === Constants.geojsonTypes.POLYGON || e.featureTarget._geometry.type === Constants.geojsonTypes.MULTI_POLYGON)) {
    this.map.dragPan.disable();
    state.canDragMove = true;
  } else {
    this.map.dragPan.enable();
    state.canDragMove = false;
  }
  state.dragMoveLocation = e.lngLat;
};

SimpleSelect.clickOnFeature = function (state, e) {
  // Stop everything
  doubleClickZoom.disable(this);
  this.stopExtendedInteractions(state);

  const isShiftClick = CommonSelectors.isShiftDown(e);
  const selectedFeatureIds = this.getSelectedIds();

  const featureIds = e.featureTarget2.map(function (fea) {
    return fea.properties.id;
  });
  var len = featureIds.length;
  featureIds.forEach(function (featureId) {
    // const featureId = e.featureTarget.properties.id;
    const isFeatureSelected = this.isSelected(featureId);

    // Click (without shift) on any selected feature but a point
    // if (!isShiftClick && isFeatureSelected && this.getFeature(featureId).type !== Constants.geojsonTypes.POINT) {
    //   // Enter direct select mode
    //   return this.changeMode(Constants.modes.DIRECT_SELECT, {
    //     featureId: featureId
    //   });
    // }

    // Shift-click on a selected feature
    if (isFeatureSelected && isShiftClick) {
      // Deselect it
      this.deselect(featureId);
      this.map.fire('noFeatureSelect');
      this.updateUIClasses({
        mouse: Constants.cursors.POINTER
      });
      if (selectedFeatureIds.length === 1) {
        doubleClickZoom.enable(this);
      }
      // Shift-click on an unselected feature
    } else if (!isFeatureSelected && isShiftClick) {
      // Add it to the selection
      this.select(featureId);
      this.updateUIClasses({
        mouse: Constants.cursors.MOVE
      });
      // Click (without shift) on an unselected feature
    } else if (!isFeatureSelected && !isShiftClick) {
      // Make it the only selected feature
      if (len == 1) {
        selectedFeatureIds.forEach(id => this.doRender(id));
        this.setSelected(featureId);
      } else {
        this.select(featureId);
      }


      this.updateUIClasses({
        mouse: Constants.cursors.MOVE
      });
    }

    // No matter what, re-render the clicked feature
    this.doRender(featureId);
  }, this);
};

SimpleSelect.onMouseDown = function (state, e) {
  if (CommonSelectors.isActiveFeature(e)) return this.startOnActiveFeature(state, e);
  if (this.drawConfig.boxSelect && CommonSelectors.isShiftMousedown(e)) return this.startBoxSelect(state, e);
};

SimpleSelect.startBoxSelect = function (state, e) {
  this.stopExtendedInteractions(state);
  this.map.dragPan.disable();
  // Enable box select
  state.boxSelectStartLocation = mouseEventPoint(e.originalEvent, this.map.getContainer());
  state.canBoxSelect = true;
};

SimpleSelect.onTouchStart = function (state, e) {
  if (CommonSelectors.isActiveFeature(e)) return this.startOnActiveFeature(state, e);
};

SimpleSelect.onDrag = function (state, e) {
  if (state.canDragMove) return this.dragMove(state, e);
  if (this.drawConfig.boxSelect && state.canBoxSelect) return this.whileBoxSelect(state, e);
};

SimpleSelect.whileBoxSelect = function (state, e) {
  state.boxSelecting = true;
  this.updateUIClasses({
    mouse: Constants.cursors.ADD
  });

  // Create the box node if it doesn't exist
  if (!state.boxSelectElement) {
    state.boxSelectElement = document.createElement('div');
    state.boxSelectElement.classList.add(Constants.classes.BOX_SELECT);
    this.map.getContainer().appendChild(state.boxSelectElement);
  }

  // Adjust the box node's width and xy position
  const current = mouseEventPoint(e.originalEvent, this.map.getContainer());
  const minX = Math.min(state.boxSelectStartLocation.x, current.x);
  const maxX = Math.max(state.boxSelectStartLocation.x, current.x);
  const minY = Math.min(state.boxSelectStartLocation.y, current.y);
  const maxY = Math.max(state.boxSelectStartLocation.y, current.y);
  const translateValue = `translate(${minX}px, ${minY}px)`;
  state.boxSelectElement.style.transform = translateValue;
  state.boxSelectElement.style.WebkitTransform = translateValue;
  state.boxSelectElement.style.width = `${maxX - minX}px`;
  state.boxSelectElement.style.height = `${maxY - minY}px`;
};

SimpleSelect.dragMove = function (state, e) {
  // Dragging when drag move is enabled
  state.dragMoving = true;
  e.originalEvent.stopPropagation();

  const delta = {
    lng: e.lngLat.lng - state.dragMoveLocation.lng,
    lat: e.lngLat.lat - state.dragMoveLocation.lat
  };

  moveFeatures(this.getSelected(), delta);

  state.dragMoveLocation = e.lngLat;
};

SimpleSelect.onMouseUp = function (state, e) {
  // End any extended interactions
  if (state.dragMoving) {
    this.fireUpdate();
  } else if (state.boxSelecting) {
    const bbox = [
      state.boxSelectStartLocation,
      mouseEventPoint(e.originalEvent, this.map.getContainer())
    ];
    const featuresInBox = this.featuresAt(null, bbox, 'click');
    const idsToSelect = this.getUniqueIds(featuresInBox)
      .filter(id => !this.isSelected(id));

    if (idsToSelect.length) {
      this.select(idsToSelect);
      idsToSelect.forEach(id => this.doRender(id));
      this.updateUIClasses({
        mouse: Constants.cursors.MOVE
      });
    }
  }
  this.stopExtendedInteractions(state);
};

SimpleSelect.toDisplayFeatures = function (state, geojson, display) {
  geojson.properties.active = (this.isSelected(geojson.properties.id)) ?
    Constants.activeStates.ACTIVE : Constants.activeStates.INACTIVE;
  display(geojson);
  this.fireActionable();
  if (geojson.properties.active !== Constants.activeStates.ACTIVE ||
    geojson.geometry.type === Constants.geojsonTypes.POINT) return;
  createSupplementaryPoints(geojson).forEach(display);
  var point_layer = this.map.getStyle().layers.filter(item => {
    return item.id.indexOf('vertex') != -1
  });
  //wzy-如果是添加节点则不隐藏节点
  if (!state.isAddVertex) {
    point_layer.forEach(item => {
      this.map.setLayoutProperty(item.id, 'visibility', 'none');
    })
  }

};

SimpleSelect.onTrash = function () {
  var selectedFeatures = this.getSelected();
  selectedFeatures.forEach(item => {
    item.toGeoJSON()
  })
  var isProperties = false;
  for (var i = 0; i < selectedFeatures.length; i++) {
    var feature = selectedFeatures[i]
    if (feature.properties && feature.properties.AREA_CODE) {
      isProperties = true;
      break
    }
  }
  if (isProperties) {
    this._ctx.options.openModal(selectedFeatures);
  }
  this.deleteFeature(this.getSelectedIds());
  this.fireActionable();
};

SimpleSelect.onCombineFeatures = function () {
  const selectedFeatures = this.getSelected();
  var len_select = selectedFeatures.length;
  var createdFeatures = [];
  if (len_select === 0 || len_select < 2) return;
  const coordinates = [],
    properties_arr = [],
    featuresCombined = [];
  const featureType = selectedFeatures[0].type.replace('Multi', '');
  var notPoly = false;
  //取出坐标
  for (var i = 0; i < len_select; i++) {
    const feature = selectedFeatures[i];
    //不同类型的要素不可合并
    if (feature.type.replace('Multi', '') !== featureType) {
      return;
    }
    if (!notPoly && feature.type.replace('Multi', '') != 'Polygon') {
      notPoly = true
    }
    if (feature.type.includes('Multi')) {
      feature.getCoordinates().forEach((subcoords) => {
        coordinates.push(subcoords);
        var pp = JSON.parse(JSON.stringify(feature.properties));
        pp.id = feature.id;
        if (feature.getCoordinates().length > 1) {
          pp.isFromMuti = true; //表示从多面中分出来的
        }
        properties_arr.push(pp)
      });
    } else {
      coordinates.push(feature.getCoordinates());
      var pp = JSON.parse(JSON.stringify(feature.properties));
      pp.id = feature.id;
      properties_arr.push(pp)
      properties_arr.push(feature.properties)
    }
  }
  //去除面积是0的面和拆除自相交的面
  var len_coor = coordinates.length;
  for (var j = 0; j < len_coor; j++) {
    var new_poly = helpers.polygon(coordinates[j]);
    new_poly.properties = properties_arr[j];
    var area = computeArea(new_poly);
    if (area == 0) continue
    // debugger
    // if(kinks(new_poly).features.length!=0){
    //   var unkink_feature = unkink(new_poly);
    //   var unkink_len = unkink_feature.features.length;
    //   for (var k = 0; k < unkink_len; k++) {
    //     featuresCombined.push(unkink_feature.features[k]);
    //   }
    // }else{
    // var buffered_poly = buffer(new_poly, 0.00001, {units: 'kilometers'});
    featuresCombined.push(new_poly);
    // }

    // featuresCombined.push(feature.toGeoJSON());
  }
  if (featuresCombined.length >= 2 && !notPoly) {
    this.map.fire(Constants.events.COMBINE_FEATURES, {
      features: selectedFeatures,
    });
    this.fireActionable();
  } else {
    //不是面的就return
    return
  }


}

SimpleSelect.onUncombineFeatures = function () {
  const selectedFeatures = this.getSelected();
  if (selectedFeatures.length === 0) return;

  const createdFeatures = [];
  const featuresUncombined = [];

  for (let i = 0; i < selectedFeatures.length; i++) {
    const feature = selectedFeatures[i];

    if (this.isInstanceOf('MultiFeature', feature)) {
      feature.getFeatures().forEach((subFeature) => {
        this.addFeature(subFeature);
        subFeature.properties = feature.properties;
        createdFeatures.push(subFeature.toGeoJSON());
        this.select([subFeature.id]);
      });
      this.deleteFeature(feature.id, {
        silent: true
      });
      featuresUncombined.push(feature.toGeoJSON());
    }
  }

  if (createdFeatures.length > 1) {
    this.map.fire(Constants.events.UNCOMBINE_FEATURES, {
      createdFeatures: createdFeatures,
      deletedFeatures: featuresUncombined
    });
  }
  this.fireActionable();
};
SimpleSelect.onChangeVertex = function (state) {
  //   debugger
  // state.isAddVertex = true;
  // var selected_ids = this.getSelectedIds();
  // selected_ids.forEach(id => {
  //   this.doRender(id);
  // });
  // this._ctx.store.render()
  state.isAddVertex = false;
  var point_layer = this.map.getStyle().layers.filter(item => {
    return item.id.indexOf('vertex') != -1
  });
  point_layer.forEach(item => {
    this.map.setLayoutProperty(item.id, 'visibility', 'visible');
  })
};
SimpleSelect.onAddVertex = function (state) {
  state.isAddVertex = true;
  this.updateUIClasses({
    mouse: Constants.cursors.ADD
  });
  debugger
};
module.exports = SimpleSelect;