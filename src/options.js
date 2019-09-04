const xtend = require('xtend');
const Constants = require('./constants');

const defaultOptions = {
  defaultMode: Constants.modes.SIMPLE_SELECT,
  keybindings: true,
  touchEnabled: true,
  clickBuffer: 2,
  touchBuffer: 25,
  boxSelect: true,
  displayControlsDefault: true,
  styles: require('./lib/theme'),
  modes: require('./modes'),
  controls: {},
  userProperties: false,
  openMessage: function (msg) {
    alert(msg)
  },
  openModal: function () {}
};
const showControls = {
  point: false,
  line_string: true,
  polygon: false,
  trash: false,
  snaped: true,
  combine_features: true,
  uncombine_features: false,
  polygon_clip: true,
  change_vertex: true,
  add_vertex: true,
  save_bounds: true,
  undo: false,
  redo: false,
  // 新建
  createBuilding: false,
  // 保存
  saveBuilding: false,
  // 旋转
  reroteBuilding: false,
  // 平移
  transformBuilding: false

};

const hideControls = {
  point: false,
  line_string: false,
  polygon: false,
  trash: false,
  snaped: false,
  combine_features: false,
  uncombine_features: false
};

function addSources(styles, sourceBucket) {
  return styles.map(style => {
    if (style.source) return style;
    return xtend(style, {
      id: `${style.id}.${sourceBucket}`,
      source: (sourceBucket === 'hot') ? Constants.sources.HOT : Constants.sources.COLD
    });
  });
}

module.exports = function (options = {}) {
  let withDefaults = xtend(options);

  if (!options.controls) {
    withDefaults.controls = {};
  }

  if (options.displayControlsDefault === false) {
    withDefaults.controls = xtend(hideControls, options.controls);
  } else {
    withDefaults.controls = xtend(showControls, options.controls);
  }

  withDefaults = xtend(defaultOptions, withDefaults);

  // Layers with a shared source should be adjacent for performance reasons
  withDefaults.styles = addSources(withDefaults.styles, 'cold').concat(addSources(withDefaults.styles, 'hot'));

  return withDefaults;
};