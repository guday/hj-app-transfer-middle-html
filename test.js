var path = require("path");
var fs = require("fs");
var mainTransfer = require("./index").default;
var enumeFilesSync = require("./enumeFiles").enumeFilesSync

var arguments = process.argv.splice(2);
var rootPath = process.cwd();


var defaultSrc = "./test/srcHtml.html";
var defaultDebug = true;

var srcFilePath = arguments[0] || defaultSrc;
if (!srcFilePath) {
    logInfo("第一个参数是转码相对路径，请确保填写了");
    return;
}
srcFilePath = path.join(rootPath, srcFilePath);

if (!fs.existsSync(srcFilePath)) {
    logInfo("路径文件不存在", srcFilePath);
    return;
}

var extName = path.extname(srcFilePath);
if (extName != ".html" && extName != ".html") {
    logInfo("仅支持html，或者htm格式的文件转换", srcFilePath);
    return;
}

var isDebugFile = arguments[1] || defaultDebug;

var dstFilePath = getDstFilePath(srcFilePath);

var srcRelative = path.relative(rootPath, srcFilePath);
var dstRelative = path.relative(rootPath, dstFilePath);

console.log("转换源文件", srcRelative);
console.log("转目的文件", dstRelative);

var root = "www/html";
var fileNum = 0;
enumeFilesSync(root, function (filePath) {
    // console.log(filePath)
    fileNum++;
    console.log(fileNum);
    // fileNum ++ ;
    mainTransfer(filePath, {
        isDebugFile,
        callback
    });
});

var nameMap = {};
var timer = null;
function callback(obj) {
    for (var i in obj) {
        nameMap[i] = true;
    }
    if (timer) {
        clearTimeout(timer);
        timer = null;
    }
    timer = setTimeout(function () {
        for (var i in nameMap) {
            if (i.indexOf("ng-") > -1 || i.indexOf("bo-") > -1) {
                console.log(i);
            }
        }

    }, 500)
    // if (fileNum == 344) {
    //     console.log(nameMap)
    // }
    // console.log('callback')
}

// console.log(nameMap)

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

