module.exports = [
  //未匹配过的
  {
    'id': 'gl-draw-polygon-fill-matched-inactive',
    'type': 'fill',
    'filter': ['all', ['==', 'active', 'false'],
      ['==', '$type', 'Polygon'],
      ['!=', 'mode', 'static'],
      ['!=', 'meta0', 'snapbbox'],
      ['==', 'user_state', 1],
    ],
    'paint': {
      'fill-color': '#fbff00',
      'fill-outline-color': '#fbff00',
      'fill-opacity': 0
    }
  }, {
    'id': 'gl-draw-polygon-fill-inactive',
    'type': 'fill',
    'filter': ['all', ['==', 'active', 'false'],
      ['==', '$type', 'Polygon'],
      ['!=', 'mode', 'static'],
      ['!=', 'meta0', 'snapbbox'],
    ],
    'paint': {
      'fill-color': '#3bb2d0',
      'fill-outline-color': '#3bb2d0',
      'fill-opacity': 0
    }
  },
  {
    'id': 'gl-draw-polygon-fill-active',
    'type': 'fill',
    'filter': ['all', ['==', 'active', 'true'],
      ['==', '$type', 'Polygon']
    ],
    'paint': {
      'fill-color': '#fbb03b',
      'fill-outline-color': '#fbb03b',
      'fill-opacity': 0
    }
  },
  {
    'id': 'gl-draw-polygon-midpoint',
    'type': 'circle',
    'filter': ['all', ['==', '$type', 'Point'],
      ['==', 'meta', 'midpoint']
    ],
    'paint': {
      'circle-radius': 3,
      'circle-color': '#fbb03b'
    }
  },
  {
    'id': 'gl-draw-polygon-stroke-inactive',
    'type': 'line',
    'filter': ['all', ['==', 'active', 'false'],
      ['==', '$type', 'Polygon'],
      ['!=', 'mode', 'static'],
      ['!=', 'meta0', 'snapbbox'],
      ['==', 'user_state', 2]
    ],
    'layout': {
      'line-cap': 'round',
      'line-join': 'round'
    },
    'paint': {
      'line-color': '#3bb2d0',
      'line-width': 2
    }
  },
  {
    'id': 'gl-draw-polygon-finished-stroke-inactive',
    'type': 'line',
    'filter': ['all', ['==', 'active', 'false'],
      ['==', '$type', 'Polygon'],
      ['!=', 'mode', 'static'],
      ['!=', 'meta0', 'snapbbox'],
      ['==', 'user_state', 3]
    ],
    'layout': {
      'line-cap': 'round',
      'line-join': 'round'
    },
    'paint': {
      'line-color': '#a53a05',
      'line-width': 2
    }
  },
  {
    'id': 'gl-draw-polygon-stroke-matched-inactive',
    'type': 'line',
    // 'type': 'fill',
    'filter': ['any', ['all', ['==', 'active', 'false'],
        ['==', '$type', 'Polygon'],
        ['!=', 'mode', 'static'],
        ['!=', 'meta0', 'snapbbox'],
        ['==', 'user_state', 1],
      ],
      ["!has", 'user_state']
    ],
    'layout': {
      'line-cap': 'round',
      'line-join': 'round'
    },
    // 'paint': {
    //   'fill-color': '#a821ed',
    //   'fill-outline-color': '#a821ed',
    //   'fill-opacity': 0.6
    // }
    'paint': {
      'line-color': '#a821ed',
      'line-dasharray': [0.2, 2],
      'line-width': 4
    }
  },
  {
    'id': 'gl-draw-line-inactive',
    'type': 'line',
    'filter': ['all', ['==', 'active', 'false'],
      ['==', '$type', 'LineString'],
      ['!=', 'mode', 'static'],
    ],
    'layout': {
      'line-cap': 'round',
      'line-join': 'round'
    },
    'paint': {
      'line-color': '#3bb2d0',
      'line-width': 2
    }
  },
  {
    'id': 'gl-draw-line-active',
    'type': 'line',
    'filter': ['all', ['==', '$type', 'LineString'],
      ['==', 'active', 'true']
    ],
    'layout': {
      'line-cap': 'round',
      'line-join': 'round'
    },
    'paint': {
      'line-color': '#fbb03b',
      'line-dasharray': [0.2, 2],
      'line-width': 3
    }
  },
  {
    'id': 'gl-draw-polygon-stroke-active',
    'type': 'line',
    'filter': ['all', ['==', 'active', 'true'],
      ['==', '$type', 'Polygon']
    ],
    'layout': {
      'line-cap': 'round',
      'line-join': 'round'
    },
    'paint': {
      'line-color': '#00ffff',
      'line-dasharray': [0.2, 2],
      'line-width': 2
    }
  },
  {
    'id': 'gl-draw-polygon-and-line-vertex-stroke-inactive',
    'type': 'circle',
    'filter': ['all', ['==', 'meta', 'vertex'],
      ['==', '$type', 'Point'],
      ['!=', 'mode', 'static']
    ],
    'paint': {
      'circle-radius': 5,
      'circle-color': '#fff'
    }
  },
  {
    'id': 'gl-draw-polygon-and-line-vertex-inactive',
    'type': 'circle',
    'filter': ['all', ['==', 'meta', 'vertex'],
      ['==', '$type', 'Point'],
      ['!=', 'mode', 'static']
    ],
    'paint': {
      'circle-radius': 3,
      'circle-color': '#00ffff'
    }
  },
  // {
  //   'id': 'gl-draw-point-point-stroke-inactive',
  //   'type': 'circle',
  //   'filter': ['all', ['==', 'active', 'false'],
  //     ['==', '$type', 'Point'],
  //     ['==', 'meta', 'feature'],
  //     ['!=', 'mode', 'static']
  //   ],
  //   'paint': {
  //     'circle-radius': 5,
  //     'circle-opacity': 1,
  //     'circle-color': '#fff'
  //   }
  // },
  // {
  //   'id': 'gl-draw-point-b-inactive',
  //   'type': 'symbol',
  //   'filter': ['all', ['==', 'active', 'false'],
  //     ['==', '$type', 'Point'],
  //     ['==', 'meta', 'feature'],
  //     ['!=', 'mode', 'static'],
  //     ['!=', 'meta0', 'snaped'],
  //     ['==', 'user_TYPE', 2],

  //   ],
  //   'layout': {
  //     visibility: "visible",
  //     "icon-image": "参考点",
  //     "icon-size": 1,
  //   }
  // },
  // {
  //   'id': 'gl-draw-point-b-inactive',
  //   'type': 'symbol',
  //   'filter': ['all', ['==', 'active', 'false'],
  //     ['==', '$type', 'Point'],
  //     ['==', 'meta', 'feature'],
  //     ['!=', 'mode', 'static'],
  //     ['!=', 'meta0', 'snaped'],
  //     ['==', 'user_type', '3'],

  //   ],
  //   'layout': {
  //     visibility: "visible",
  //     "icon-image": "县",
  //     "icon-size": 1,
  //   }
  // },
  {
    'id': 'gl-draw-point-b-inactive',
    'type': 'symbol',
    'filter': ['all', ['==', 'active', 'false'],
      ['==', '$type', 'Point'],
      ['==', 'meta', 'feature'],
      ['!=', 'mode', 'static'],
      ['!=', 'meta0', 'snaped'],
      ['==', 'user_type', '4'],

    ],
    'layout': {
      visibility: "visible",
      "icon-image": "乡",
      "icon-size": 1,
    }
  },
  // {
  //   'id': 'gl-draw-point-b-inactive',
  //   'type': 'symbol',
  //   'filter': ['all', ['==', 'active', 'false'],
  //     ['==', '$type', 'Point'],
  //     ['==', 'meta', 'feature'],
  //     ['!=', 'mode', 'static'],
  //     ['!=', 'meta0', 'snaped'],
  //     ['==', 'user_type', '5'],

  //   ],
  //   'layout': {
  //     visibility: "visible",
  //     "icon-image": "村",
  //     "icon-size": 1,
  //   }
  // },
  // {
  //   'id': 'gl-draw-point-stroke-active',
  //   'type': 'circle',
  //   'filter': ['all', ['==', '$type', 'Point'],
  //     ['==', 'active', 'true'],
  //     ['!=', 'meta', 'midpoint']
  //   ],
  //   'paint': {
  //     'circle-radius': 7,
  //     'circle-color': '#fff'
  //   }
  // },
  {
    'id': 'gl-draw-point-active',
    'type': 'circle',
    'filter': ['all', ['==', '$type', 'Point'],
      ['!=', 'meta', 'midpoint'],
      ['==', 'active', 'true'],
      ["!has", 'user_TYPE'],
      ["!has", 'user_error']
    ],
    'paint': {
      'circle-radius': 5,
      'circle-color': '#fbb03b'
    }
  },

  {
    'id': 'gl-draw-point-b-active',
    'type': 'symbol',
    'filter': ['all', ['==', '$type', 'Point'],
      ['!=', 'meta', 'midpoint'],
      ['==', 'active', 'true'],
      ['==', 'user_TYPE', 2],

    ],
    'layout': {
      visibility: "visible",
      "icon-image": "参考点选中",
      "icon-size": 1,
    }
  },
  {
    'id': 'gl-draw-polygon-fill-static',
    'type': 'fill',
    'filter': ['all', ['==', 'mode', 'static'],
      ['==', '$type', 'Polygon']
    ],
    'paint': {
      'fill-color': '#404040',
      'fill-outline-color': '#404040',
      'fill-opacity': 0
    }
  },
  {
    'id': 'gl-draw-polygon-stroke-static',
    'type': 'line',
    'filter': ['all', ['==', 'mode', 'static'],
      ['==', '$type', 'Polygon']
    ],
    'layout': {
      'line-cap': 'round',
      'line-join': 'round'
    },
    'paint': {
      'line-color': '#404040',
      'line-width': 2
    }
  },
  {
    'id': 'gl-draw-line-static',
    'type': 'line',
    'filter': ['all', ['==', 'mode', 'static'],
      ['==', '$type', 'LineString']
    ],
    'layout': {
      'line-cap': 'round',
      'line-join': 'round'
    },
    'paint': {
      'line-color': '#404040',
      'line-width': 2
    }
  },
  {
    'id': 'gl-draw-point-static',
    'type': 'circle',
    'filter': ['all', ['==', 'meta', 'static'],
      ['==', '$type', 'Point']
    ],
    'paint': {
      'circle-radius': 5,
      'circle-color': '#404040'
    }
  },
  {
    'id': 'gl-draw-snap-polygon-fill',
    'type': 'fill',
    'filter': ['all', ['==', 'meta0', 'snapbbox'],
      ['==', '$type', 'Polygon'],
      ['!=', 'mode', 'static']
    ],
    'paint': {
      'fill-color': '#ff0',
      'fill-outline-color': '#3bb2d0',
      'fill-opacity': 0
    }
  },
  {
    'id': 'gl-draw-snap-point',
    'type': 'circle',
    'filter': ['all', ['==', 'meta0', 'snaped'],
      ['==', '$type', 'Point']
    ],
    'paint': {
      'circle-radius': 8,
      'circle-blur': 0.6,
      'circle-opacity': 0.5,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ff0000'
    }
  },
  //错误建筑物点
  {
    'id': 'gl-draw-point-error-inactive',
    'type': 'symbol',
    'filter': ['all', ['==', 'active', 'false'],
      ['==', '$type', 'Point'],
      ['==', 'meta', 'feature'],
      ['!=', 'mode', 'static'],
      ['!=', 'meta0', 'snaped'],
      ['!=', 'user_error', 0]
    ],
    'layout': {
      visibility: "visible",
      "icon-image": "3",
      "icon-size": 1,
    }
  },
  //错误建筑物点-选中
  {
    'id': 'gl-draw-point-error-active',
    'type': 'symbol',
    'filter': ['all', ['==', '$type', 'Point'],
      ['!=', 'meta', 'midpoint'],
      ['==', 'active', 'true'],
      ['!=', 'user_error', 0]
    ],
    'layout': {
      visibility: "visible",
      "icon-image": "1",
      "icon-size": 1,
    }
  },

  //建筑物点
  {
    'id': 'gl-draw-point-bu-inactive',
    'type': 'symbol',
    'filter': ['all', ['==', 'active', 'false'],
      ['==', '$type', 'Point'],
      ['==', 'meta', 'feature'],
      ['!=', 'mode', 'static'],
      ['!=', 'meta0', 'snaped'],
      ['==', 'user_TYPE', 1],
    ],
    'layout': {
      visibility: "visible",
      "icon-image": "建筑物",
      "icon-size": 1,
    }
  },

  {
    'id': 'gl-draw-point-bu-active',
    'type': 'symbol',
    'filter': ['all', ['==', '$type', 'Point'],
      ['!=', 'meta', 'midpoint'],
      ['==', 'active', 'true'],
      ['==', 'user_TYPE', 1],
    ],
    'layout': {
      visibility: "visible",
      "icon-image": "建筑物选中",
      "icon-size": 1,
    }

  },
  //注记图层
  {
    'id': 'gl-draw-point-point-matched-inactive',
    'type': 'symbol',
    'filter': ['all', ['==', 'active', 'false'],
      ['==', '$type', 'Polygon'],
      ['!=', 'mode', 'static'],
      ['!=', 'meta0', 'snapbbox'],
      ['==', 'user_state', 2]
    ],
    "layout": {
      "visibility": "visible",
      "icon-image": "",
      "icon-size": 1.2,
      "icon-offset": [
        0,
        0
      ],
      "icon-rotate": 0,
      "icon-allow-overlap": false,
      "icon-ignore-placement": false,
      "text-field": "{user_NAME}",
      "text-font": [
        "SimHei Regular"
      ],
      "text-size": 13,
      "text-max-width": 10,
      "text-line-height": 1.2,
      "text-letter-spacing": 0,
      "text-anchor": "center",
      "text-rotate": 0,
      "text-offset": [
        0,
        0
      ],
      "text-allow-overlap": false,
      "text-ignore-placement": false,
    },
    "paint": {
      "icon-opacity": 1,
      "icon-color": "#000000",
      "icon-halo-color": "#ffffff",
      "icon-halo-width": 0,
      "icon-halo-blur": 0,
      "text-opacity": 1,
      "text-color": "#3bb2d0",
      "text-halo-color": "#ffffff",
      "text-halo-width": 0,
      "text-halo-blur": 0
    }
  },
  {
    'id': 'gl-draw-point-point-finished-inactive',
    'type': 'symbol',
    'filter': ['all', ['==', 'active', 'false'],
      ['==', '$type', 'Polygon'],
      ['!=', 'mode', 'static'],
      ['!=', 'meta0', 'snapbbox'],
      ['==', 'user_state', 3]
    ],
    "layout": {
      "visibility": "visible",
      "icon-image": "",
      "icon-size": 1.2,
      "icon-offset": [
        0,
        0
      ],
      "icon-rotate": 0,
      "icon-allow-overlap": false,
      "icon-ignore-placement": false,
      "text-field": "{user_NAME}",
      "text-font": [
        "SimHei Regular"
      ],
      "text-size": 13,
      "text-max-width": 10,
      "text-line-height": 1.2,
      "text-letter-spacing": 0,
      "text-anchor": "center",
      "text-rotate": 0,
      "text-offset": [
        0,
        0
      ],
      "text-allow-overlap": false,
      "text-ignore-placement": false,
    },
    "paint": {
      "icon-opacity": 1,
      "icon-color": "#000000",
      "icon-halo-color": "#ffffff",
      "icon-halo-width": 0,
      "icon-halo-blur": 0,
      "text-opacity": 1,
      "text-color": "#a53a05",
      "text-halo-color": "#ffffff",
      "text-halo-width": 0,
      "text-halo-blur": 0
    }
  },
];