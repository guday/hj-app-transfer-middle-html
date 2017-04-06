var path = require("path");
var fs = require("fs");
var transfer = require("./mainTransform").default;
//
// var arguments = process.argv.splice(2);
// var rootPath = process.cwd();
//
//
//
//
// var srcFilePath = arguments[0] || null;
// if (!srcFilePath) {
//     logInfo("第一个参数是转码相对路径，请确保填写了");
//     return;
// }
// srcFilePath = path.join(rootPath, srcFilePath);
//
// if (!fs.existsSync(srcFilePath)) {
//     logInfo("路径文件不存在", srcFilePath);
//     return;
// }
//
// var extName = path.extname(srcFilePath);
// if (extName != ".html" && extName != ".html") {
//     logInfo("仅支持html，或者htm格式的文件转换", srcFilePath);
//     return;
// }
//
// var isDebugFile = arguments[1] || false;
//
// var dstFilePath = getDstFilePath(srcFilePath);
//
// var srcRelative = path.relative(rootPath, srcFilePath);
// var dstRelative = path.relative(rootPath, dstFilePath);
//
// console.log("转换源文件", srcRelative);
// console.log("转目的文件", dstRelative);
//
// transfer(srcFilePath, dstFilePath, isDebugFile);
//

function main(srcFilePath, param) {
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