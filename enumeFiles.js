var fs = require("fs");
var path = require("path");
var transfer = require("./mainTransform").default;

// var root = "./www/html";
//
// var fileNum = 0;
// enumeFilesSync(root, function (filePath) {
//     // console.log(filePath)
//     // console.log(fileNum++);
//     // fileNum ++ ;
// });
//
// console.log("fileNum", fileNum)


exports.enumeFilesSync = enumeFilesSync;

function enumeFiles(readurl, callback, isSub) {
    callback = callback || function () {

        };
    fs.readdir(readurl, function (err, files) {
        if (err) {
            console.log(err);
            return;
        }

        files.forEach(function (filename) {
            var _filePath = path.join(readurl, filename);

            fs.stat(_filePath, function (err, stats) {
                if (err) throw err;
                //是文件
                if (stats.isFile()) {
                    callback(_filePath);
                    //是子目录
                } else if (stats.isDirectory()) {
                    enumeFiles(_filePath, callback);
                }
            });
        });
    });
}


function enumeFilesSync(readurl, callback) {
    callback = callback || function () {

        };
    var files = fs.readdirSync(readurl);

    if (files) {
        files.forEach(function (filename) {

            var _filePath = path.join(readurl, filename);

            var stats = fs.statSync(_filePath);

            if (stats) {
                //是文件
                if (stats.isFile()) {
                    callback(_filePath);
                    //是子目录
                } else if (stats.isDirectory()) {
                    enumeFilesSync(_filePath, callback);
                }
            } else {
                console.log("states error")
            }
        });
    } else {
        console.log("read dir error")
    }

}