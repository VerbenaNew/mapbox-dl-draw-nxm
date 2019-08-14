var helpers = require('@turf/helpers');
var lineSplit = require('@turf/line-split');
var getCoords = require('@turf/invariant').getCoords;
var featureEach = require('@turf/meta').featureEach;
var featureCollection = helpers.featureCollection;
var lineString = helpers.lineString;
var isContain = require('@turf/boolean-contains');
var isCross = require('@turf/boolean-crosses');
var isPointOnLine = require('@turf/boolean-point-on-line');
var isEqual = require('@turf/boolean-equal');
var lineIntereat = require('@turf/line-intersect');
var nearestPointOnLine = require('@turf/nearest-point-on-line');
var pointToLineDistance = require('@turf/point-to-line-distance');
var lineToPolygon = require('@turf/line-to-polygon');
var point = helpers.point;
var polygon = helpers.polygon;
var store = require('./store');
const buildPolygonFromLines = require('./lib/build-polygon-from-lines');
import {
  pointOnLine
} from "@turf/turf";
/**
 * Slices {@link Polygon} using a {@link Linestring}.
 *
 * @name polygonSlice
 * @param {Feature<Polygon>} poly Polygon to slice
 * @param {Feature<LineString>} splitter LineString used to slice Polygon
 * @returns {FeatureCollection<Polygon>} Sliced Polygons
 * @example
 * var polygon = {
 *   "geometry": {
 *     "type": "Polygon",
 *     "coordinates": [[
 *         [0, 0],
 *         [0, 10],
 *         [10, 10],
 *         [10, 0],
 *         [0, 0]
 *     ]]
 *   }
 * };
 * var linestring =  {
 *     "type": "Feature",
 *     "properties": {},
 *     "geometry": {
 *       "type": "LineString",
 *       "coordinates": [
 *         [5, 15],
 *         [5, -15]
 *       ]
 *     }
 *   }
 * var sliced = turf.polygonSlice(polygon, linestring);
 * //=sliced
 */
module.exports = function polygonSlice(poly, splitter) {
  var results_splitter = []; //切割线分段结果
  var results_outer = []; //面边框分段结果
  var contain_lines = []; //在面中的切割线段
  var originType = poly.geometry.type;
  //单面
  if (poly.geometry.type == 'Polygon') {
    var coords = getCoords(poly);
    var outer = lineString(coords[0]);
  } else {
    var coords = getCoords(poly)[0];
    poly = polygon(coords);
    var outer = lineString(coords[0]);
  }
  //取出面的首尾点
  var len_outer=getCoords(outer).length;
  var outer_s=getCoords(outer)[0];
  var outer_e=getCoords(outer)[len_outer-1];
  if(!isCoorEqual(outer_s,outer_e)){
    console.log('面的线框首尾不闭合！')
    return
  }
  //var inners = innerLineStrings(poly);//---不考虑带洞情况先注释

  // Split outers
  featureEach(lineSplit(outer, splitter), function (line) {
    results_outer.push(line);
  });

  // Split inners---不考虑带洞情况先注释
  // featureEach(inners, function (inner) {
  //   featureEach(lineSplit(inner, splitter), function (line) {
  //     results.push(line);
  //   });
  // });

  // Split splitter
  featureEach(lineSplit(splitter, outer), function (line) {
    results_splitter.push(line);
  });

  //判断交点在不在线上--结果不在
  // var intersects=lineIntereat(outer,splitter);
  // console.log('intersect',intersects);
  // for(var j=0;j<intersects.features.length;j++){
  //   var pp=point(intersects.features[j].geometry.coordinates);
  //   console.log(pointOnLine(pp,outer));
  // }

  //求出多边形内的分割线
  var len = results_splitter.length;
  for (var i = 0; i < len; i++) {
    var tt = isContain(poly, results_splitter[i]);
    if (isContain(poly, results_splitter[i])) {
      contain_lines.push(results_splitter[i]);
      continue
    }
  }
  var new_line = results_outer.concat(contain_lines);
  var len2 = contain_lines.length;
  var len3 = results_outer.length;
  var contain_lines_old = JSON.parse(JSON.stringify(contain_lines));
  //交点如果不在多变形线框则重新调整切割线
  for (var i = 0; i < len2; i++) {
    var splitter_coor = getCoords(contain_lines[i]);
    var len4 = splitter_coor.length;
    var p_s_s = point(splitter_coor[0]);
    var p_e_s = point(splitter_coor[len4 - 1]);
    //重置起始点为临近点
    var p_new_s = pointOnLine(outer, p_s_s);
    contain_lines[i].geometry.coordinates[0] = p_new_s.geometry.coordinates;
    //重置终点纬临近点
    var p_new_e = pointOnLine(outer, p_e_s);
    contain_lines[i].geometry.coordinates[len4 - 1] = p_new_e.geometry.coordinates;
  }
  // var new_line = results_outer.concat(contain_lines);
  // console.log(contain_lines)
  //调整分线段的端点
  for (var i = 0; i < len3; i++) {
    var pp = getCoords(results_outer[i]);
    var len5 = pp.length;
    var p_s = point(pp[0]);
    var p_e = point(pp[len5 - 1]);
    // console.log(i)
    for (var k = 0; k < len2; k++) {
      var line_splitter_coor = getCoords(contain_lines_old[k]);
      var p_s_o = point(line_splitter_coor[0]);
      var p_e_o = point(line_splitter_coor[line_splitter_coor.length - 1]);
      if (isEqual(p_s, p_s_o)) {
        // console.log('p_s, p_s_o')
        results_outer[i].geometry.coordinates[0] = contain_lines[k].geometry.coordinates[0];
      }
      if (isEqual(p_e, p_s_o)) {
        // console.log('p_e, p_s_o')
        results_outer[i].geometry.coordinates[len5 - 1] = contain_lines[k].geometry.coordinates[0];
      }
      if (isEqual(p_s, p_e_o)) {
        // console.log('p_s, p_e_o')
        results_outer[i].geometry.coordinates[0] = contain_lines[k].geometry.coordinates[line_splitter_coor.length - 1];
      }
      if (isEqual(p_e, p_e_o)) {
        // console.log('p_e, p_e_o')
        results_outer[i].geometry.coordinates[len5 - 1] = contain_lines[k].geometry.coordinates[line_splitter_coor.length - 1];
      }
    }

  }
  results_outer.forEach((f, i) => {
    f.usedTotal = 1;
    f.usedCount = 0;
    f.index = i;
  });

  contain_lines.forEach((f, i) => {
    f.usedTotal = 2;
    f.usedCount = 0;
    f.index = i;
  })
  var polygons = buildPolygonFromLines({
    features: results_outer
  }, {
      features: contain_lines
    });
  // return featureCollection(new_line);
  // return featureCollection(results_outer);

  if (originType == 'Polygon') {
    return featureCollection(polygons);
  } else {
    polygons.forEach(item => {
      item.geometry.type = 'MultiPolygon';
      item.geometry.coordinates = [item.geometry.coordinates];
    });
    return featureCollection(polygons);
  }
  // return featureCollection(polygons);
};

/**
 * Retrieve inner linestrings from polygon
 *
 * @private
 * @param {Feature<Polygon>} poly Feature Polygon
 * @returns {FeatureCollection<LineString>} inner lines from polygon
 */
function innerLineStrings(poly) {
  var results = [];
  var coords = getCoords(poly);
  coords.slice(1, coords.length).forEach(function (coord) {
    results.push(lineString(coord));
  });
  return featureCollection(results);
}

//判断点坐标是否相等
function isCoorEqual(p1,p2){
  if (!Array.isArray) {
    Array.isArray = function(arg) {
      return Object.prototype.toString.call(arg) === '[object Array]';
    };
  }
  if (Array.isArray(p1)&&Array.isArray(p2)) {
    if(p1[0]==p2[0]&&p1[1]==p2[1]){
      return true
    }else{
      return false
    }
  }else{
    throw new Error('传入参数不是两个点坐标');
  }
}
function createPolygons(outer, splitter) {
  var polygons = [];
  var len1 = outer.length;
  var len2 = splitter.length;
  if (len1 == 0 || len2 == 0) return
  for (var i = 0; i < len2; i++) {
    //查找和当前切割线相交的分割线
    for (var j = 0; j < len1; j++) {
      if (outer[j].properties.isUse) {
        continue
      }
      var isClose = isClosed(outer[j], splitter[i]);
      //直接和分割线生成闭合面的先生成闭合面
      if (isClose == 2) {
        outer[j].properties.isUse = true;
        var line_out = lineString(getCoords(outer[j]));
        var line_sp = lineString(getCoords(splitter[i]))
        polygons.push(lineToPolygon(line_out, line_sp))
      } else {
        if (isClose) {
          outer[j].properties.isJoin = isClose;
        } else {
          outer[j].properties.isJoin = false;
        }
      }
    }
    //只有一个交点的线段
    var join_arr_3 = outer.filter(item => {
      return item.properties.isJoin === 3
    })
    var join_arr_4 = outer.filter(item => {
      return item.properties.isJoin === 4
    });
    for (var u = 0; u < join_arr_3.length; u++) {
      var coor_u = getCoords(join_arr_3[u]);
      var p_3 = point(coor_u[0]);
      console.log('p_3', p_3);
      for (var v = 0; v < join_arr_4.length; v++) {
        var coor_v = getCoords(join_arr_4[v]);
        var p_4 = point(coor_v[coor_v.length - 1]);
        console.log('p_4', p_4)
        if (isEqual(p_3, p_4)) {
          var line3 = lineString(coor_u);
          console.log('line3', coor_u);
          var line4 = lineString(getCoords(coor_v));
          console.log('line4', coor_v);
          // polygons.push(lineToPolygon(line4 , line_sp));
          polygons.push(lineToPolygon(line4, line3, line_sp));
        }
      }
    }

  }
  return polygons;
}
//判断线是否闭合
function isClosed(line1, line2) {
  var coor1 = getCoords(line1);
  var coor2 = getCoords(line2);
  var len1 = coor1.length;
  var len2 = coor2.length;
  var p_s_1 = point(coor1[0]); //线1的起点
  var p_e_1 = point(coor1[len1 - 1]); //线1终点
  var p_s_2 = point(coor2[0]); //线2的起点
  var p_e_2 = point(coor2[len2 - 1]); //线2终点 
  if (isEqual(p_s_1, p_e_1)) {
    console.log('线1自闭合');
    return 1
  }
  if (isEqual(p_s_2, p_e_2)) {
    console.log('线2自闭合');
    return false
  }
  if (isEqual(p_s_1, p_e_2) && isEqual(p_e_1, p_s_2)) {
    return 2
  }
  if (isEqual(p_s_1, p_s_2) && isEqual(p_e_1, p_e_2)) {
    return 2
  }
  var isClose = (isEqual(p_s_1, p_e_2) && isEqual(p_e_1, p_s_2)) || (isEqual(p_s_1, p_s_2) && isEqual(p_e_1, p_e_2));
  if ((isEqual(p_s_1, p_s_2) && !isEqual(p_e_1, p_e_2)) || (isEqual(p_e_1, p_s_2) && !isEqual(p_s_1, p_e_2))) {
    //起点相交
    return 3
  }
  if ((isEqual(p_e_1, p_e_2) && !isEqual(p_s_1, p_s_2)) || (isEqual(p_s_1, p_e_2) && !isEqual(p_e_1, p_s_2))) {
    //终点相交
    return 4
  }
  return false
}