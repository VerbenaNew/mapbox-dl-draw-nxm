const CommonSelectors = require('../lib/common_selectors');
const doubleClickZoom = require('../lib/double_click_zoom');
const Constants = require('../constants');
const isEventAtCoordinates = require('../lib/is_event_at_coordinates');
var transformRotate=require('@turf/transform-rotate')
const ReroteBuilding = {};

ReroteBuilding.onSetup = function () {
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

ReroteBuilding.onStop = function (state) {
  this.updateUIClasses({
    mouse: Constants.cursors.NONE
  });
  doubleClickZoom.enable(this);
  this.activateUIButton();

  // check to see if we've deleted this feature
  if (this.getFeature(state.polygon.id) === undefined) return;

  //remove last added coordinate
  state.polygon.removeCoordinate(`0.${state.currentVertexPosition}`);
console.log(state);
 return
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

module.exports = ReroteBuilding;