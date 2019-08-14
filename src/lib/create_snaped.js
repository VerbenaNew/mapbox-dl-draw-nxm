const Constants = require('../constants');
const hat = require('hat');

/**
 * Returns GeoJSON for a Point representing the
 * vertex of another feature.
 *
 * @param {string} parentId
 * @param {Array<number>} coordinates
 * @param {string} path - Dot-separated numbers indicating exactly
 *   where the point exists within its parent feature's coordinates.
 * @param {boolean} selected
 * @return {GeoJSON} Point
 */
module.exports = function (parentId, coordinates, path) {
    return {
        type: Constants.geojsonTypes.FEATURE,
        properties: {
            meta: Constants.meta.SNAPED,
            id: "我是捕捉点",
            parent: parentId,
            coord_path: path,
        },
        // meta: 'snaped',
        id: 'snapedid',
        geometry: {
            type: Constants.geojsonTypes.POINT,
            coordinates: coordinates
        }
    };
};