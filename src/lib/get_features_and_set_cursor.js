const featuresAt = require('./features_at');
const Constants = require('../constants');

module.exports = function getFeatureAtAndSetCursors(event, ctx) {
  const features = featuresAt.click(event, null, ctx);
  const classes = {
    mouse: Constants.cursors.NONE
  };

  if (features[0]) {
    classes.mouse = (features[0].properties.active === Constants.activeStates.ACTIVE) ?
      Constants.cursors.MOVE : Constants.cursors.POINTER;
    classes.feature = features[0].properties.meta;
  }

  if (ctx.events.currentModeName().indexOf('draw') !== -1) {
    classes.mouse = Constants.cursors.ADD;
  }

  ctx.ui.queueMapClasses(classes);
  ctx.ui.updateMapClasses();
  event.featureTarget = features[0];
  event.featureTarget2 = features;
  return features;
};