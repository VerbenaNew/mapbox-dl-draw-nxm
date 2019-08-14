const featuresAt = require('./features_at');
const mapEventToBoundingBox = require('./map_event_to_bounding_box');
const createSnaped = require('./create_snaped');
const Point = require('../feature_types/point');
const Polygon = require('../feature_types/polygon');
const bboxPolygon = require("@turf/bbox-polygon");

module.exports = function snapVertex(event, ctx) {
  //[[minx,miny],[maxx,maxy]]ctx.options.clickBuffer
  const box = mapEventToBoundingBox(event, 10);
  // console.log(box);

  const leftTopLngLat = ctx.map.unproject(box[0]);
  const rightBottomLngLat = ctx.map.unproject(box[1]);
  let boxLngLat = [leftTopLngLat, rightBottomLngLat];


  // console.log(boxLngLat);

  const features = featuresAt.click(event, null, ctx, true);
  if (features.length < 1) return;

  // var poly = bboxPolygon([leftTopLngLat.lng, leftTopLngLat.lat, rightBottomLngLat.lng, rightBottomLngLat.lat]);
  // poly.id = "snapbbox";
  // poly.properties.meta = "snapbbox";
  // var polygon = new Polygon(ctx, poly);
  // ctx.store.add(polygon);


  features.forEach(feature => {
    const geometry = feature.geometry;
    let snapNode = { pid: feature.properties.id };
    switch (geometry.type) {
      case 'Point':
        // lngLatInBox(geometry.coordinates, boxLngLat);
        break;
      case 'LineString':
        snapNode.coordinate = lngLatInBox(geometry.coordinates[0], boxLngLat);
        break;
      case 'Polygon':
        var coors = geometry.coordinates;
        for (let j = 0, l = coors.length; j < l; j++) {
          var ringCoors = coors[j];
          for (let i = 0, len = ringCoors.length; i < len; i++) {
            var coor = lngLatInBox(ringCoors[i], boxLngLat)
            if (coor) {
              snapNode.coordinate = coor;
              break;
            }
          }
        }
        // geometry.coordinates.forEach((ringCoors, ringIndex) => {
        //   for (let i = 0, len = ringCoors.length; i < len; i++) {
        //     var coor = lngLatInBox(ringCoors[i], boxLngLat)
        //     if (coor) {
        //       snapNode.coordinate = coor;
        //       return;
        //     }
        //   }
        // ringCoors.forEach((coor, index) => {
        //   snapNode.coordinate = lngLatInBox(coor, boxLngLat);
        //   if (snapNode.coordinate) {
        //     return;
        //   }
        // })
        // });
        break;
    }
    //地图上展示
    if (snapNode.coordinate) {
      showOnMap(ctx.map, snapNode, ctx);
    }
    return snapNode;
  });

  function lngLatInBox(coordinate, box) {
    const leftTopLngLat = box[0];
    const rightBottomLngLat = box[1];
    var coor = null;
    if (coordinate[0] > leftTopLngLat.lng && coordinate[0] < rightBottomLngLat.lng &&
      coordinate[1] > rightBottomLngLat.lat && coordinate[1] < leftTopLngLat.lat) {
      // console.log(coordinate);
      coor = coordinate;
    }
    return coor;
  }
  function showOnMap(map, snapNode, ctx) {
    let geojson = createSnaped(snapNode.pid, snapNode.coordinate, 'path');
    ctx.store.sources.hot.push(geojson);
    let snapedPoint = new Point(ctx, geojson);
    // ctx.store.delete(geojson.id);
    ctx.store.add(snapedPoint);//featureChanged(geojson.properties.id);
  }
}


//http://geojson.org/geojson-spec.html
/** 
 * 
 */