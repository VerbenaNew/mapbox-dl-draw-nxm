const CommonSelectors = require('../lib/common_selectors');
const doubleClickZoom = require('../lib/double_click_zoom');
const Constants = require('../constants');
const isEventAtCoordinates = require('../lib/is_event_at_coordinates');
const createVertex = require('../lib/create_vertex');
var isContain = require('@turf/boolean-contains');
var helpers = require('@turf/helpers');
const PolygonClip = {};

PolygonClip.onSetup = function () {
  const polygon = this.newFeature({
    type: Constants.geojsonTypes.FEATURE,
    properties: {},
    geometry: {
      type: Constants.geojsonTypes.POLYGON,
      coordinates: [
        []
      ]
    }
  });

  this.addFeature(polygon);

  // this.clearSelectedFeatures();
  doubleClickZoom.disable(this);
  this.updateUIClasses({
    mouse: Constants.cursors.POLYGONCUT
  });
  this.activateUIButton(Constants.types.POLYGON);
  this.setActionableState({
    trash: true
  });

  return {
    polygon,
    currentVertexPosition: 0
  };
};

PolygonClip.clickAnywhere = function (state, e) {
  if (state.currentVertexPosition > 0 && isEventAtCoordinates(e, state.polygon.coordinates[0][state.currentVertexPosition - 1])) {
    //测试面切割--wzy
    var selectedFeatures = this.getSelected();
    var len = selectedFeatures.length;
    //只能切一个
    if (len != 1) {
      this._ctx.options.openMessage('不可切割多个面');
      this.deleteFeature([state.polygon.id]);
      this.changeMode(Constants.modes.SIMPLE_SELECT);
      return
    }
    if (state.currentVertexPosition > 0 && isEventAtCoordinates(e, state.polygon.coordinates[0][state.currentVertexPosition - 1])) {
      this.map.fire('polygonSplit', {
        features: state.polygon.toGeoJSON(),
      });
      return this.changeMode(Constants.modes.SIMPLE_SELECT, {
        featureIds: [state.polygon.id]
      });
      var feature = selectedFeatures[0].toGeoJSON();
      var originType = feature.geometry.type;
      var deleteId = feature.id;
      var corr_new = [];
      if (feature.geometry.type == 'Polygon') {
        var coordinates_outer = feature.geometry.coordinates;
        for (var i = 0; i < coordinates_outer.length; i++) {
          corr_new.push(coordinates_outer[i])
        }
        var feature_outer = feature;
      } else {
        var coordinates_outer = feature.geometry.coordinates[0];
        for (var i = 0; i < coordinates_outer.length; i++) {
          corr_new.push(coordinates_outer[i])
        }
        var feature_outer = helpers.polygon(coordinates_outer)
      }
      if (isContain(feature_outer, state.polygon)) {
        state.polygon.toGeoJSON().geometry.coordinates.reverse();
        if (originType == 'Polygon') {
          corr_new.push(state.polygon.toGeoJSON().geometry.coordinates[0]);
          var json = {
            type: "Feature",
            geometry: {
              "type": "Polygon",
              "coordinates": corr_new,

            },
            "properties": feature.properties
          }
          // Draw.add(json);
          if (json.geometry.coordinates.length >= 2) {
            this.deleteFeature([deleteId]);
          }
        } else {
          corr_new.push(state.polygon.toGeoJSON().geometry.coordinates[0]);
          var json = {
            type: "Feature",
            geometry: {
              "type": "MultiPolygon",
              "coordinates": [
                corr_new
              ]

            },
            "properties": feature.properties
          }
          // Draw.add(json);
          var polygon_new = state.polygon.toGeoJSON();
          polygon_new.geometry.type = 'MultiPolygon';
          polygon_new.geometry.coordinates = [polygon_new.geometry.coordinates];
          polygon_new.properties['ORG_AREA_CODE'] = feature.properties.AREA_CODE;
          polygon_new.properties['NAME'] = feature.properties.NAME;
          // polygon_new.properties['state']=1;
          delete polygon_new.id;
          // Draw.add(polygon_new);
          this.map.fire("polygonSlice", {
            sliced: [json, polygon_new]
          });
          if (json.geometry.coordinates[0].length >= 2) {
            this.deleteFeature([deleteId, state.polygon.id]);
          }
        }

        // console.log(json)

      } else {
        this.deleteFeature([state.polygon.id], {
          silent: true
        });
        this._ctx.options.openMessage('不在所选面内，切割失败！');
        return this.changeMode(Constants.modes.SIMPLE_SELECT, {
          featureIds: [state.polygon.id]
        });
      }

    }

  }
  this.updateUIClasses({
    mouse: Constants.cursors.POLYGONCUT
  });
  state.polygon.updateCoordinate(`0.${state.currentVertexPosition}`, e.lngLat.lng, e.lngLat.lat);
  state.currentVertexPosition++;
  state.polygon.updateCoordinate(`0.${state.currentVertexPosition}`, e.lngLat.lng, e.lngLat.lat);
};

PolygonClip.clickOnVertex = function (state) {

  return this.changeMode(Constants.modes.SIMPLE_SELECT, {
    featureIds: [state.polygon.id]
  });
};

PolygonClip.onMouseMove = function (state, e) {
  state.polygon.updateCoordinate(`0.${state.currentVertexPosition}`, e.lngLat.lng, e.lngLat.lat);
  if (CommonSelectors.isVertex(e)) {
    this.updateUIClasses({
      mouse: Constants.cursors.POLYGONCUT
    });
  }
};

PolygonClip.onTap = PolygonClip.onClick = function (state, e) {
  // if (CommonSelectors.isVertex(e)) return this.clickOnVertex(state, e);//wzy--面切割不需要
  return this.clickAnywhere(state, e);
};

PolygonClip.onKeyUp = function (state, e) {
  if (CommonSelectors.isEscapeKey(e)) {
    this.deleteFeature([state.polygon.id], {
      silent: true
    });
    this.changeMode(Constants.modes.SIMPLE_SELECT);
  } else if (CommonSelectors.isEnterKey(e)) {
    this.changeMode(Constants.modes.SIMPLE_SELECT, {
      featureIds: [state.polygon.id]
    });
  }
};

PolygonClip.onStop = function (state) {
  this.updateUIClasses({
    mouse: Constants.cursors.POLYGONCUT
  });
  doubleClickZoom.enable(this);
  this.activateUIButton();

  // check to see if we've deleted this feature
  if (this.getFeature(state.polygon.id) === undefined) return;

  //remove last added coordinate
  state.polygon.removeCoordinate(`0.${state.currentVertexPosition}`);
  if (state.polygon.isValid()) {
    this.map.fire(Constants.events.CREATE, {
      features: [state.polygon.toGeoJSON()]
    });
  } else {
    this.deleteFeature([state.polygon.id], {
      silent: true
    });
    this.changeMode(Constants.modes.SIMPLE_SELECT, {}, {
      silent: true
    });
  }
};

PolygonClip.toDisplayFeatures = function (state, geojson, display) {

  const isActivePolygon = geojson.properties.id === state.polygon.id;
  geojson.properties.active = (isActivePolygon) ? Constants.activeStates.ACTIVE : Constants.activeStates.INACTIVE;
  if (!isActivePolygon) return display(geojson);

  // Don't render a polygon until it has two positions
  // (and a 3rd which is just the first repeated)
  if (geojson.geometry.coordinates.length === 0) return;

  const coordinateCount = geojson.geometry.coordinates[0].length;
  // 2 coordinates after selecting a draw type
  // 3 after creating the first point
  if (coordinateCount < 3) {
    return;
  }
  geojson.properties.meta = Constants.meta.FEATURE;
  display(createVertex(state.polygon.id, geojson.geometry.coordinates[0][0], '0.0', false));
  if (coordinateCount > 3) {
    // Add a start position marker to the map, clicking on this will finish the feature
    // This should only be shown when we're in a valid spot
    const endPos = geojson.geometry.coordinates[0].length - 3;
    display(createVertex(state.polygon.id, geojson.geometry.coordinates[0][endPos], `0.${endPos}`, false));
  }
  if (coordinateCount <= 4) {
    // If we've only drawn two positions (plus the closer),
    // make a LineString instead of a Polygon
    const lineCoordinates = [
      [geojson.geometry.coordinates[0][0][0], geojson.geometry.coordinates[0][0][1]],
      [geojson.geometry.coordinates[0][1][0], geojson.geometry.coordinates[0][1][1]]
    ];
    // create an initial vertex so that we can track the first point on mobile devices
    display({
      type: Constants.geojsonTypes.FEATURE,
      properties: geojson.properties,
      geometry: {
        coordinates: lineCoordinates,
        type: Constants.geojsonTypes.LINE_STRING
      }
    });
    if (coordinateCount === 3) {
      return;
    }
  }
  // render the Polygon
  return display(geojson);
};

PolygonClip.onTrash = function (state) {
  this.deleteFeature([state.polygon.id], {
    silent: true
  });
  this.changeMode(Constants.modes.SIMPLE_SELECT);
};

module.exports = PolygonClip;