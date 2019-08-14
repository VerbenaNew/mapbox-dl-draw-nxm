var helpers = require('@turf/helpers');
var 
	inside = require('./turf-inside'),
	point = helpers.point,
	buffer = require('@turf/buffer'),
	erase = require('@turf/difference'),
	fc = helpers.featureCollection,
	pol = helpers.polygon;

/**
*	Function that cuts a {@link Polygon} with a {@link Linestring}
* @param {Feature<(Polygon)>} poly - single Polygon Feature
* @param {Feature<(Polyline)>} line - single Polyline Feature
* @return {FeatureCollection<(Polygon)>} 
* @author	Abel Vázquez
* @version 1.0.0
*/
module.exports = function cutPolygon(poly, line){

	if (poly.geometry === void 0 || poly.geometry.type !== 'Polygon' ) throw('"turf-cut" only accepts Polygon type as victim input');
	if (line.geometry === void 0 || line.geometry.type !== 'LineString' ) throw('"turf-cut" only accepts LineString type as axe input');
	if(inside(point(line.geometry.coordinates[0]), poly) || inside (point(line.geometry.coordinates[line.geometry.coordinates.length-1]), poly)) throw('Both first and last points of the polyline must be outside of the polygon');
	
	var 
		// _axe = buffer(line, 0.000000001, {units: 'meters'}).features[0],		// turf-buffer issue #23
        // _body = erase(poly, _axe),
        _body = poly,
		pieces = [];
        _body.geometry.coordinates[0].push(_body.geometry.coordinates[0][0]);
	if (_body.geometry.type == 'Polygon' ){
		pieces.push( pol(_body.geometry.coordinates));
	}else{
		_body.geometry.coordinates.forEach(function(a){pieces.push( pol(a))});
	}

	pieces.forEach(function(a){a.properties = poly.properties});
	
	return fc(pieces);
	
}