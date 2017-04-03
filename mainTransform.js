/**
 * 前缀替换
 */


var jsdom = require("jsdom");
var parse5 = require("parse5");
var fs = require("fs");
var util = require("util");
var path = require("path");
var jqueryUrl = "./node_modules/jquery/dist/jquery.min.js";
var serializeDocument = jsdom.serializeDocument;

var srcFilePath = "./srcOld.js";
var dstFilePath = "./dstOld.js";
var debugFilePathArr = [];      //阶段性调试文件

exports.default = main;

function main(src, dst, debugFile) {

    if (!src || !dst) {
        //不处理
        console.log("参数不齐，不干活");
        return;
    } else {
        srcFilePath = src;
        dstFilePath = dst;
    }

    if (debugFile) {
        debugFilePathArr = getDstFilePath(dst);
    }

    // console.log(":", fs.existsSync(jqueryUrl));
    mainTransfer();
}

function mainTransfer() {

    //1.加载页面
    loadMainPage(function (window) {
        var $ = window.$;
        var document = window.document;
        // var allElement = $("*");
        // // logInfo(allElement.length, aElement.nodeName)
        // // for (var i in aElement) {
        // //     // logInfo(i)
        // //     // console.log(i, typeof (aElement[i].))
        // // }
        // var obj = {};
        // var atrributeObj = {};
        // var nodeTypeMap = {};
        // for (var i in allElement) {
        //     var aElement = allElement.get(i);
        //     var {
        //         nodeName,
        //         attributes,
        //         nodeType,
        //     } = aElement;
        //
        //     // if (nodeType) {
        //     //     nodeTypeMap[nodeType] = true;
        //     // }
        //     // console.log(nodeType)
        //
        //     if (nodeName) {
        //         obj[nodeName] = true;
        //         if (typeof (nodeName) == "string" && nodeName) {
        //             //all nodeName
        //             // logInfo(jsdom.nodeLocation(allElement[20]))
        //             // logInfo(aElement.nodeType)
        //
        //
        //             // logInfo("======", nodeName);
        //             for (var j in attributes) {
        //                 var {name, value} = attributes[j];
        //                 if (typeof (name) == "string" && name) {
        //                     // logInfo(name, value)
        //                     atrributeObj[name] = true;
        //                 }
        //
        //             }
        //         }
        //     }
        //
        //
        // }
        // logInfo(Object.keys((obj)))
        // logInfo(Object.keys((atrributeObj)))
        // logInfo("nodeType", Object.keys((nodeTypeMap)))
        // logInfo("allElement", allElement.length);
        // var allContents = $("body").children();
        // logInfo("allContents", allContents.length)
        // var test = $(":contains('{{')");
        // logInfo(test.length)
        // for (var i in test) {
        //     var {
        //         nodeName,
        //         attributes,
        //         nodeType,
        //     } = test[i];
        //     if (nodeName && typeof (nodeName) == "string"){
        //         // console.log(nodeName, attributes, nodeType, jsdom.nodeLocation(test[i]))
        //     }
        //
        // }


        // var document = window.document;
        // var test = document.querySelectorAll();
        // logInfo(test.length)

        // logInfo("1",document, test)
        //1. 获取节点信息
        var {
            elementNodeArr,
            textNodeArr
        } = getElementTypeArr($("body")[0]);
        logInfo(elementNodeArr.length)
        logInfo(textNodeArr.length)

        for (var i in textNodeArr) {
            var {
                nodeValue,
                innerHtml
            } = textNodeArr[i];
            if (nodeValue && nodeValue.trim()) {
                logInfo(typeof(nodeValue), nodeValue)
            }

        }


        precessTextNode(textNodeArr, {$});


        generateTest(document)
    })
}

function generateTest(window) {
    var html = serializeDocument(window)
    // var html = parse5.serialize($("body")[0]);


    fs.writeFile(dstFilePath, html, "utf8");


}

function loadMainPage(callback) {
    var jqueryContent = fs.readFileSync(jqueryUrl, "utf8");
    var htmlContent = fs.readFileSync(srcFilePath, "utf8");

    jsdom.env({
        // file: srcFilePath,
        //需要用html而不是file，否则，没找到设置文本格式的地方，显示不了中文。
        html: htmlContent,
        src: [jqueryContent],
        done: function (err, window) {
            if (err || !window) {
                logError("html页面转码错误");
                return;
            }

            var $ = window.$;
            if (!$) {
                logError("jquery加载失败");
                return;
            }

            callback && callback(window);
        }
    });
}

function getDstFilePath(srcFullPath) {
    var fileNum = 4;
    var srcFilePathObj = path.parse(srcFullPath);
    var {
        root,
        dir,
        ext
    } = srcFilePathObj;
    var srcName = srcFilePathObj.name;

    var arr = [];
    for (var i = 0; i < 7; i++) {
        var name = srcName + ".state" + i;
        var newPath = path.format({
            root,
            dir,
            ext,
            name
        });
        arr.push(newPath);
        // console.log("path", newPath)
    }
    return arr;

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

function logError() {
    var arg = arguments;
    var arr = [];
    for (var i in arg) {
        if (typeof (arg[i]) == "object") {
            arr.push(util.inspect(arg[i]));
        } else {
            arr.push(arg[i])
        }
    }
    console.log("error===>", arr.join(" "))
}

function enumChildNodes(parentNode, callback) {
    for (var i = 0; i < parentNode.childNodes.length; i++) {
        callback(parentNode.childNodes[i]);
        enumChildNodes(parentNode.childNodes[i], callback); // 递归
    }
}

function getElementTypeArr(body) {
    var nodeTypeMap = {};
    var elementNodeArr = [];
    var textNodeArr = [];
    enumChildNodes(body, function (node) {
        var {
            nodeName,
            nodeType
        } = node;


        if (nodeType === 1) {
            elementNodeArr.push(node);
        } else if (nodeType === 3) {
            textNodeArr.push(node);
        } else if (nodeType === 8) {
            //注释
        } else {
            nodeTypeMap[nodeType] = true;
        }

    });

    if (Object.keys(nodeTypeMap).length > 0) {
        //报告错误
        logError("未知的节点类型，请关注")
    }

    return {
        elementNodeArr,
        textNodeArr
    }
}

function precessTextNode(textNodeArr, param) {

    var {
        $
    } = param;

    for (var i in textNodeArr) {
        var textNode = textNodeArr[i];
        var {
            nodeValue
        } = textNode;

        nodeValue = (nodeValue + "").trim();
        if (nodeValue) {
            var isReplaced = false;
            var newValue = nodeValue.replace(/(?:\{\{)(.*?)(?:\}\})/g, function (match, matchReg, index, srcStr) {
                isReplaced = true;
                return "{{vm." + matchReg + "}}"

            });

            if (isReplaced) {
                console.log("replaced")
                //元素值写回
                textNode.nodeValue = newValue
            }
        }
    }
}