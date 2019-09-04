import {
  feature
} from '@turf/turf';
import {
  polygon
} from '@turf/union/node_modules/@turf/helpers';

const CommonSelectors = require('../lib/common_selectors');
const mouseEventPoint = require('../lib/mouse_event_point');
const createSupplementaryPoints = require('../lib/create_supplementary_points');
const StringSet = require('../lib/string_set');
const doubleClickZoom = require('../lib/double_click_zoom');
const moveFeatures = require('../lib/move_features');
const Constants = require('../constants');
const snapVertex = require('../lib/snap_vertex');
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
  state.dragMoving = true;
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
  if (state.isAddVertex) {
    this.updateUIClasses({
      mouse: Constants.cursors.ADD
    });
  }
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
  if (state.isAddVertex) {
    this.updateUIClasses({
      mouse: Constants.cursors.ADD
    });
  }

  const isShiftClick = CommonSelectors.isShiftDown(e);
  if (!isShiftClick && !state.isAddVertex) {
    this.clearSelectedFeatures()
  }
  if (CommonSelectors.isFeature(e) && e.featureTarget._geometry.type == 'Point') {
    if (e.featureTarget2.length == 1 && !isShiftClick) {
      this.map.fire('PointSelect', {
        obj: e.featureTarget,
        mapEvent: e
      });
    }

  } else if (CommonSelectors.isFeature(e) && (e.featureTarget._geometry.type == 'Polygon' || e.featureTarget._geometry.type == 'MultiPolygon')) {
    if (e.featureTarget2.length == 1) {
      this.map.fire('PolygonSelect', {
        obj: e.featureTarget,
        mapEvent: e
      });
    }
    if (e.featureTarget2.length > 1) {
      // this._ctx.options.openMessage('选择了多个面，不可匹配和切割');
      this.map.fire('noFeatureSelect');
    }

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
    if (target2.length == 0) {
      state.isAddVertex = false;
      this.clearSelectedFeatures()
    }
    var pp = helpers.point([e.lngLat.lng, e.lngLat.lat]);
    target2.forEach(fea => {
      if (fea.properties.meta === "feature") {
        ids.push(fea.properties.id);
      }
    })
    ids = Array.from(new Set(ids))
    ids.forEach(id => {
      target2.forEach(fea => {
        if (fea.properties.parent && id == fea.properties.parent && fea.properties.meta == "vertex")
          vertexs.push(fea);
      });
    });
    //如果查到的要素个数少于被选中的要素个数则不做事情
    var features = this.getSelected();
    var selectedIds = this.getSelectedIds().sort();
    var isFeatureSame = selectedIds.join(',') == ids.sort().join(',') ? true : false;
    if (ids.length < features.length || !isFeatureSame) {
      state.isAddVertex = false;
      this.clearSelectedFeatures();
      this._ctx.options.openMessage('不在公共边上，不可添加节点');
      return
    }
    //如果没有点到节点，则查看范围内的要素是不是被选中要素，如果是则给被选中要素分别添加点--wzy20180426
    if (vertexs.length == 0) {
      features.forEach(poly => {
        var add_obj = util.addVertex(pp, poly.toGeoJSON());
        var path = add_obj.idx + 1
        console.log(path)
        poly.addCoordinate('0.0.' + path, add_obj.point.geometry.coordinates[0], add_obj.point.geometry.coordinates[1]);
      })
      this.doRender();
    }
    //如果点到节点且所有选择要素都有这个节点则不处理--wzy20180426
    if (vertexs.length == ids.length) {
      state.isAddVertex = false;
      this.clearSelectedFeatures()
    }
    //如果点到节点，但不是所有面上都有这个节点，则给没有节点的那个面添加节点
    if (vertexs.length && vertexs.length != ids.length) {
      var ids_no = [];
      var feature_no = [];
      for (var i = 0; i < ids.length; i++) {
        var id = ids[i];
        for (var j = 0; j < vertexs.length; j++) {
          if (id == vertexs[j].properties.parent) {
            continue
          } else {
            ids_no.push({
              id: id,
              vertex: vertexs[j]
            });
          }
        }

      }
      ids_no.forEach(idObj => {
        var ff_no = Draw.get(idObj.id);
        var ppp = idObj.vertex.toGeoJSON();
        var pploy = ff_no.toGeoJSON();
        var add_obj_no = util.addVertex(ppp, pploy);
        var path = add_obj_no.idx + 1
        poly.addCoordinate('0.0.' + path, add_obj_no.point.geometry.coordinates[0], add_obj_no.point.geometry.coordinates[1]);
      })
      this.doRender();
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
  let featureIds = [];
  let coord_paths = [];
  var vertex_parents = [];
  var vertex_coords = [];
  var target2 = e.featureTarget2;
  target2.forEach(fea => {
    if (fea.properties.meta === "feature") {
      featureIds.push(fea.properties.id);
    }
  })
  featureIds = Array.from(new Set(featureIds))
  featureIds.forEach(id => {
    target2.forEach(fea => {
      if (fea.properties.parent && id == fea.properties.parent && fea.properties.meta == "vertex") {
        coord_paths.push(fea.properties.coord_path);
        vertex_parents.push(fea.properties.parent);
        vertex_coords.push(fea._geometry.coordinates);
      }
    });
  });
  //如果是添加节点则不切换wzy--20180426
  if (!state.isAddVertex) {
    //如果当前选中节点不在公共边上则提示后，返回
    var ids_sele = this.getSelectedIds();
    // var diff_fea=ids_sele.concat(featureIds).filter(v => !ids_sele.includes(v) || !vertex_parents.includes(v));
    if (ids_sele.length != 0) {
      var isidSame = ids_sele.sort().toString() == featureIds.sort().toString();
      //如果选中要素变化了，则不亮起节点
      if (!isidSame) {
        this.changeMode(Constants.modes.DIRECT_SELECT, {
          featureId: e.featureTarget.properties.parent,
          coordPath: e.featureTarget.properties.coord_path,
          featureIds: featureIds, //e.featureTarget.properties.parent,
          coordPaths: coord_paths,
          startPos: e.lngLat,
          noHightlight: true
        });
        return
      }
    }

    //如果选中多个节点。提示返回
    if (coord_paths.length > featureIds.length) {
      this._ctx.options.openMessage('选中多个节点，不可以移动，选择其他节点或请放大后选中节点');
      this.changeMode(Constants.modes.SIMPLE_SELECT);
      return
    }
    //如果选中公共边上节点，但是不共点则给没有点的图形添加节点
    if (coord_paths.length < featureIds.length && isidSame) {
      var no_parent = vertex_parents.concat(featureIds).filter(v => !vertex_parents.includes(v) || !featureIds.includes(v));
      var features = this.getSelected();
      no_parent.forEach(id => {
        features.forEach(fea => {
          if (fea.id == id) {
            var ff_no = fea.toGeoJSON();
            var ppp = helpers.point(vertex_coords[0]);
            var add_obj_no = util.addVertex(ppp, ff_no);
            var path = add_obj_no.idx + 1
            fea.addCoordinate('0.0.' + path, add_obj_no.point.geometry.coordinates[0], add_obj_no.point.geometry.coordinates[1]);
            coord_paths.push('0.0.' + path)
          }
        })
      })
      this.doRender();
      featureIds = vertex_parents.concat(no_parent);
    }
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
  // this.clearSelectedFeatures()
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
      this.map.fire('noFeatureSelect');
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
  if (state.isAddVertex) {
    this.updateUIClasses({
      mouse: Constants.cursors.ADD
    });
  }
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
  if (state.canDragMove) {
    this.map.fire('dragMove');
    return this.dragMove(state, e);
  }
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
    this.map.fire('pointMoveend', {
      cursor: [e.point.x, e.point.y],
      point: {
        "type": "Feature",
        "geometry": {
          type: 'Point',
          "coordinates": [e.lngLat.lng, e.lngLat.lat]
        },
        "properties": {}
      }
    });
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
  this.map.fire('trash', {
    features: selectedFeatures,
  });
  // this.deleteFeature(this.getSelectedIds());
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
};
module.exports = SimpleSelect;