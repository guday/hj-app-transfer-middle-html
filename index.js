var path = require("path");
var fs = require("fs");
var transfer = require("./mainTransform").default;
var url = require('url');
var util = require('util');

function main(srcFilePath, param) {

    // if (fs.existsSync(srcFilePath)) {
    //     logInfo("转换的html文件不存在")
    //     return;
    // }

    if (srcFilePath.indexOf("?") > -1) {
        var tmpUrl = url.parse(srcFilePath);
        srcFilePath = tmpUrl.pathname;
    }

    var dstFilePath = getDstFilePath(srcFilePath);


    transfer(srcFilePath, dstFilePath, param);
}


function getDstFilePath(srcFullPath) {
    var dstFileFix = ".transfer";
    var srcFilePathObj = path.parse(srcFullPath);
    var {
        root,
        dir,
        ext,
        name
    } = srcFilePathObj;
    name += dstFileFix;
    return path.format({
        root,
        dir,
        ext,
        name
    })
}


function logInfo() {
    var arg = arguments;
    var arr = [];
    for (var i in arg) {
        if (typeof (arg[i]) == "object") {
            arr.push(util.inspect(arg[i]));
        } else {
            arr.push(arg[i])
        }
    }
    console.log("info=>:", arr.join(" "))
}


exports.default = main;