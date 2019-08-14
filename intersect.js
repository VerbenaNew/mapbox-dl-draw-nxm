const turf = require("@turf/turf");

var spliter = turf.lineString([[108.95254433610091, 34.29714637530542],[108.95734119747755, 34.29511139231107]]);
var line2 = turf.lineString([ [ 108.949659,34.29268],[108.955619,34.297834],[108.955793,34.293391],[108.949659,34.29268]]);
var intersects = turf.lineIntersect(spliter, line2);
console.log(JSON.stringify(intersects) );

var pt1 = intersects.features[0];
var pt2 = intersects.features[1];
// var line = turf.lineString([[-1, -1],[1, 1],[1.5, 2.2]]);
var isP1 = turf.booleanPointOnLine(pt1, line2);
var isP2 = turf.booleanPointOnLine(pt2, line2);

console.log(isP1);
console.log(isP2);