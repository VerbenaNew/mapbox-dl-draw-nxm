const turf = require("@turf/turf");

/**
 * 
 * @param {FeatureCollection} mainLines 
 * @param {FeatureCollection} assistLines
 * 注意，每个feature必须包含两个根属性，
 * usedTotal：本要素在构建面过程中最多可以使用次数,
 * usedCount：本要素在构建面过程中已经使用的次数
 */
module.exports = function (mainLines, assistLines) {
    let polygonLineArr = [];
    if (!mainLines.features) return;
    mainLines.features.forEach(outFea => {
        if (!outFea.hasOwnProperty('usedTotal')) {
            console.log('缺少usedTotal或usedCount');
            return;
        }
        if (outFea.usedCount < outFea.usedTotal) {
            outFea.usedCount++;
            fn(assistLines, outFea, mainLines, polygonLineArr);
        }
    });
    /**
     * 
     * @param {featureCollection} target 线段组，两个组里切换
     * @param {lineString} finder 开始查找的线
     * @param {featureCollection} nextTarget 线段组，两个组里切换
     * @param {lineString} polygonLineArr 组织好的封闭面的线
     */
    function fn(target, finder, nextTarget, polygonLineArr) {
        let newCoor = null;
        let f = finder.geometry.coordinates;
        const fStart = f[0];
        const fEnd = f[f.length - 1];
        let tartgetFeas = target.features;
        var flag = false;
        for (let i = 0, len = tartgetFeas.length; i < len; i++) {
            if (flag) return;
            let tFea = tartgetFeas[i];
            if (tFea.usedCount < tFea.usedTotal) {
                // tFea.usedCount++;
                let t = tFea.geometry.coordinates;
                const tStart = t[0];
                const tEnd = t[t.length - 1];
                /*****fEnd和tStart相同*****/
                let bFEnd2TStart = isEqual(fEnd, tStart);
                // 
                let tEndPoint = turf.point(tEnd);
                let fLine = finder.geometry;
                let bTEndonFLine = turf.booleanPointOnLine(tEndPoint, fLine, { ignoreEndVertices: true });
                let tEnd2FStart = false;
                if (bTEndonFLine) {
                    tEnd2FStart = isEqual(tEnd, fStart);
                }

                /****fEnd和tEnd相同  需要反转t的点顺序****/
                let bFEnd2TEnd = isEqual(fEnd, tEnd);

                let tStartPoint = turf.point(tStart);
                let bTStartonFLine = turf.booleanPointOnLine(tStartPoint, fLine, { ignoreEndVertices: true });
                let tStart2FStart = false;
                if (bTStartonFLine) {
                    tStart2FStart = isEqual(tStart, fStart);
                }


                if ((bFEnd2TStart && !bTEndonFLine) || (bFEnd2TStart && tEnd2FStart)) {
                    //去掉t 的第一个点
                    newCoor = f.concat(t.slice(1));
                    tFea.usedCount++;
                } else if ((bFEnd2TEnd && !bTStartonFLine) || (bFEnd2TEnd && tStart2FStart)) {
                    //去掉t 的最后一个点
                    let newT = t.slice(0, t.length - 1);
                    newT = newT.reverse();
                    // f.shift();
                    newCoor = f.concat(newT);
                    tFea.usedCount++;
                }

                //找到连接线
                if (newCoor) {
                    let newPolyLine = turf.clone(finder);
                    newPolyLine.geometry.coordinates = newCoor;
                    //需要判断是否闭合
                    if (isEqual(newCoor[0], newCoor[newCoor.length - 1])) {
                        //已经闭合 一个面完成
                        polygonLineArr.push(newPolyLine);
                        return true;
                        // break;
                        // console.log(newPolyLine);
                        // return newLine;
                    } else {
                        flag = fn(nextTarget, newPolyLine, target, polygonLineArr);
                        return false;
                    }
                }

            }
        }
        // });

    }

    function isEqual(arr1, arr2, tolerance) {
        tolerance = tolerance || 10;
        return arr1[0].toFixed(tolerance) == arr2[0].toFixed(tolerance) &&
            arr1[1].toFixed(tolerance) == arr2[1].toFixed(tolerance);
    }

    return polygonLineArr.map(line => {
        return turf.lineToPolygon(line)
    });
}