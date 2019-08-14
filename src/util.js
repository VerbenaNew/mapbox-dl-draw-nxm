// import {
//   point,
//   lineString,
//   pointOnLine,
//   pointOnFeature,
//   nearestPointOnLine,
//   featureCollection,
//   nearestPoint
// } from "@turf/turf"
var helpers = require('@turf/helpers');
var nearestPoint = require('@turf/nearest-point');
var lineSegment = require('@turf/line-segment');
var pointToLineDistance = require('@turf/point-to-line-distance');
var pointDistance = require('@turf/distance');
var nearestPointOnLine = require('@turf/nearest-point-on-line');
var lineIntersect = require('@turf/line-intersect');
var lineString = helpers.lineString;
var point = helpers.point;
var featureCollection = helpers.featureCollection;
var util = {
  findPoint(state, map, ePoint, eLngLat) {
    var width = 10;
    var height = 10;

    var snapbox = [
      [ePoint.x - width / 2, ePoint.y - height / 2],
      [ePoint.x + width / 2, ePoint.y + height / 2]
    ];
    var pp1 = map.unproject([ePoint.x - width / 2, ePoint.y - height / 2]);
    var pp2 = map.unproject([ePoint.x + width / 2, ePoint.y + height / 2]);
    var layerIds = state.layerIds;

    if (layerIds) {
      var features = map.queryRenderedFeatures(snapbox, {
        layers: layerIds
      });
    } else {
      var features = map.queryRenderedFeatures(snapbox);
    }
    var feature_new = features.filter(item => {
      return item.layer.type == 'line'
    })
    // console.log("ff",feature_new)
    //取第一个要素
    if (feature_new.length == 0) return
    var feature = feature_new[0];
    if (!feature) return null;
    //生成点集合
    var points = [];
    if (feature.geometry.type == 'Point') {
      points.push(point(feature.geometry.coordinates));
    } else if (feature.geometry.type == 'LineString') {
      feature.geometry.coordinates.forEach(lnglat => {
        var lng = Number(lnglat[0]);
        var lat = Number(lnglat[1]);
        if (isNaN(lng) || isNaN(lat)) return
        var pp = [lng, lat]
        points.push(point(pp));
      });
    }
    var pointCol = featureCollection(points);

    //   var line = lineString(feature.geometry.coordinates);

    var cursorAt = point([eLngLat.lng, eLngLat.lat]);
    var snapped = nearestPoint(cursorAt, pointCol);
    // //判断找到的点是不是在snapbox里
    var boxPoly = turf.bboxPolygon([pp1.lng, pp1.lat, pp2.lng, pp2.lat]);
    if (!boxPoly || !snapped) return null
    var iscontain = turf.booleanContains(boxPoly, snapped);
    // console.log("snap",snapped)
    if (iscontain) {
      return snapped;
    } else {
      return null
    }
    // return snapped;
  },
  //添加节点
  addVertex(pp, polygon) {
    var distance_arr = [];
    var temp_arr = [];
    var isBetween_arr = [];
    var segments = lineSegment(polygon);
    //获取最短距离线段的索引
    for (var i = 0; i < segments.features.length; i++) {
      var line = segments.features[i]
      var distance = pointToLineDistance(pp, line, {
        units: 'meters'
      });
      var isBetween = this.isBetween(pp, line);
      var obj = {
        dis: distance,
        idx: i
      }
      isBetween_arr.push(isBetween)
      distance_arr.push(obj)
    }
    for (var j = 0; j < distance_arr.length; j++) {
      if (isBetween_arr[j]) {
        temp_arr.push(distance_arr[j])
      }
    }
    temp_arr.sort(function (a, b) {
      return a.dis > b.dis ? 1 : -1
    });
    return {
      point: pp,
      idx: temp_arr[0].idx
    }
  },
  //求对称点
  getCrossPoint(point, line) {
    var x0 = point.geometry.coordinates[0];
    var y0 = point.geometry.coordinates[1]
    var p1 = line.geometry.coordinates[0];
    var p2 = line.geometry.coordinates[1];
    var A = p2[1] - p1[1];
    var B = p1[0] - p2[0];
    var C = p2[0] * p1[1] - p1[0] * p2[1];
    var x1 = ((B * B - A * A) * x0 - 2 * A * B * y0 - 2 * A * C) / (A * A + B * B);
    var y1 = (-2 * A * B * x0 + (A * A - B * B) * y0 - 2 * B * C) / (A * A + B * B);
    return [x1, y1]
  },
  //垂足是否在线上
  isBetween(point, line) {
    var crossPoint = this.getCrossPoint(point, line);
    var crossLine = helpers.lineString([point.geometry.coordinates, crossPoint]);
    var intersects = lineIntersect(crossLine, line);
    var isCross = intersects.features.length > 0 ? true : false;
    return isCross
  },
  //获取点到直线最短距离（垂足在线上取垂线距离，不在线上取端点最短距离）
  getDistance(point, line) {
    //求垂足是否在线上
    var isBetween = this.isBetween(point, line);
    if (isBetween) {
      var distance = pointToLineDistance(point, line, {
        units: 'meters'
      });
    } else {
      var p1 = helpers.point(line.geometry.coordinates[0])
      var p2 = helpers.point(line.geometry.coordinates[1])
      var d1 = pointDistance(point, p1, {
        units: 'meters'
      });
      var d2 = pointDistance(point, p2, {
        units: 'meters'
      });
      var distance = d1 > d2 ? d2 : d1;
    }
    return distance
  }
}

module.exports = util;