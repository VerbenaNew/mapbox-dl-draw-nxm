const turf = require("@turf/turf");
const buildPolygonFromLines = require('./build-polygon-from-lines');

//闭合点串
var linecoor = [[140, 60], [150, 60], [150, 50], [140, 50], [140, 60]];
var poly = turf.polygon([linecoor]);
//外环线
var line = turf.lineString(linecoor);
//分割线
var splitter = turf.lineString([[145, 61], [145, 49]]);

//线分割面outer线
var splitOuter = turf.lineSplit(line, splitter);

//outer 分割 分割线
var splitSplitter = turf.lineSplit(splitter, line);
splitSplitter.features.shift();
splitSplitter.features.pop();

splitOuter.features.forEach(f => {
    f.usedTotal = 1;
    f.usedCount = 0;
});

splitSplitter.features.forEach(f => {
    f.usedTotal = 2;
    f.usedCount = 0;
})

let polygons = buildPolygonFromLines(splitOuter, splitSplitter);
console.log("kk")