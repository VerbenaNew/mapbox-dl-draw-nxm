module.exports = {
  classes: {
    CONTROL_BASE: 'mapboxgl-ctrl',
    CONTROL_PREFIX: 'mapboxgl-ctrl-',
    CONTROL_BUTTON: 'mapbox-gl-draw_ctrl-draw-btn',
    CONTROL_BUTTON_LINE: 'mapbox-gl-draw_line',
    CONTROL_BUTTON_POLYGON: 'mapbox-gl-draw_polygon',
    CONTROL_BUTTON_POINT: 'mapbox-gl-draw_point',
    CONTROL_BUTTON_TRASH: 'mapbox-gl-draw_trash',
    CONTROL_BUTTON_COMBINE_FEATURES: 'mapbox-gl-draw_combine',
    CONTROL_BUTTON_UNCOMBINE_FEATURES: 'mapbox-gl-draw_uncombine',
    CONTROL_BUTTON_SNAPED: 'mapbox-gl-draw_snaped',
    CONTROL_BUTTON_PCLIP: 'mapbox-gl-polygon_clip',
    CONTROL_BUTTON_CBUILDING: "mapbox-gl-create_building",
    CONTROL_BUTTON_SBUILDING: "mapbox-gl-save_building",
    CONTROL_BUTTON_RBUILDING: "mapbox-gl-rerote_building",
    CONTROL_BUTTON_TBUILDING: "mapbox-gl-transform_building",

    CONTROL_GROUP: 'mapboxgl-ctrl-group-draw',
    ATTRIBUTION: 'mapboxgl-ctrl-attrib',
    ACTIVE_BUTTON: 'active',
    BOX_SELECT: 'mapbox-gl-draw_boxselect',
    CONTROL_BUTTON_UNDO: 'mapbox-gl-draw_undo',
    CONTROL_BUTTON_REDO: 'mapbox-gl-draw_redo',
    CONTROL_BUTTON_VERTEX_CHANGE: 'mapbox-gl-draw_vertex',
    CONTROL_BUTTON_ADD_VERTEX: 'mapbox-gl-draw_add_vertex',
    CONTROL_BUTTON_SAVE_BOUNDS: 'mapbox-gl-draw_bounds',
  },
  sources: {
    HOT: 'mapbox-gl-draw-hot',
    COLD: 'mapbox-gl-draw-cold'
  },
  cursors: {
    ADD: 'add',
    MOVE: 'move',
    DRAG: 'drag',
    POINTER: 'pointer',
    POLYGONCUT: 'cutp',
    NONE: 'none'
  },
  types: {
    POLYGON: 'polygon',
    LINE: 'line_string',
    POINT: 'point'
  },
  geojsonTypes: {
    FEATURE: 'Feature',
    POLYGON: 'Polygon',
    LINE_STRING: 'LineString',
    POINT: 'Point',
    FEATURE_COLLECTION: 'FeatureCollection',
    MULTI_PREFIX: 'Multi',
    MULTI_POINT: 'MultiPoint',
    MULTI_LINE_STRING: 'MultiLineString',
    MULTI_POLYGON: 'MultiPolygon'
  },
  modes: {
    DRAW_LINE_STRING: 'draw_line_string',
    DRAW_POLYGON: 'draw_polygon',
    DRAW_POINT: 'draw_point',
    SIMPLE_SELECT: 'simple_select',
    DIRECT_SELECT: 'direct_select',
    SNAP_DRAW: 'snap_draw',
    POLYGON_CLIP: 'polygon_clip',
    STATIC: 'static',
    CREATE_BUILDING: "create_building",
    REROTE_BUILDING: "rerote_building"
  },
  events: {
    CREATE: 'draw.create',
    DELETE: 'draw.delete',
    UPDATE: 'draw.update',
    SELECTION_CHANGE: 'draw.selectionchange',
    MODE_CHANGE: 'draw.modechange',
    ACTIONABLE: 'draw.actionable',
    RENDER: 'draw.render',
    COMBINE_FEATURES: 'draw.combine',
    UNCOMBINE_FEATURES: 'draw.uncombine'
  },
  updateActions: {
    MOVE: 'move',
    CHANGE_COORDINATES: 'change_coordinates'
  },
  meta: {
    FEATURE: 'feature',
    MIDPOINT: 'midpoint',
    VERTEX: 'vertex',
    SNAPED: 'snaped'
  },
  activeStates: {
    ACTIVE: 'true',
    INACTIVE: 'false'
  },
  interactions: [
    'scrollZoom',
    'boxZoom',
    'dragRotate',
    'dragPan',
    'keyboard',
    'doubleClickZoom',
    'touchZoomRotate'
  ],
  LAT_MIN: -90,
  LAT_RENDERED_MIN: -85,
  LAT_MAX: 90,
  LAT_RENDERED_MAX: 85,
  LNG_MIN: -270,
  LNG_MAX: 270
};