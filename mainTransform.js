/**
 * 前缀替换
 */

var babylon = require("babylon");
var traverse = require("babel-traverse").default;
var generate = require("babel-generator").default;
var t = require("babel-types");
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

function main(src, dst, param) {

    var {
        debugFile,
        callback,
        replacedMap
    } = param;

    if (!src) {
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

    // console.log(replacedMap)
    // console.log(":", fs.existsSync(jqueryUrl));
    mainTransfer(callback, replacedMap);
}

function mainTransfer(callback, replacedMap) {
    callback = callback || function () {

        }

    logInfo("开始转换", "html")
    //1.加载页面
    loadMainPage(function (window) {
        var $ = window.$;
        var document = window.document;

        //1. 获取节点信息
        var {
            elementNodeArr,
            textNodeArr
        } = getElementTypeArr($("body")[0]);
        // logInfo(elementNodeArr.length)
        // logInfo(textNodeArr.length)

        // for (var i in textNodeArr) {
        //     var {
        //         nodeValue,
        //         innerHtml
        //     } = textNodeArr[i];
        //     // if (nodeValue && nodeValue.trim()) {
        //     //     logInfo(typeof(nodeValue), nodeValue)
        //     // }
        //
        // }

        var result;

        // precessTextNode(textNodeArr, {$, replacedMap});

        var result = processElementNode(elementNodeArr, {$, replacedMap});
        // console.log(nameMap);

        callback(result);

        generateTest(document)
        logInfo("结束转换", "html")
    })
}

function generateTest(window) {
    var html = serializeDocument(window)
    // var html = parse5.serialize($("body")[0]);


    if (dstFilePath) {
        fs.writeFile(dstFilePath, html, "utf8");
    }


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
        $,
        replacedMap
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
                var tmp = processStrWithAst(matchReg, replacedMap);
                return "{{" + tmp + "}}"

            });

            if (isReplaced) {
                // console.log("replaced")
                //元素值写回
                textNode.nodeValue = newValue
            }
        }
    }
}

/**
 * 处理 一个元素节点
 * @param elementNodeArr
 * @param param
 * @returns {{nameMap: {}, keyValueArr: Array}}
 */
function processElementNode(elementNodeArr, param) {

    var {
        $, replacedMap
    } = param;

    var nameMap = {};
    var keyValueArr = [];
    for (var i in elementNodeArr) {
        var node = elementNodeArr[i];
        var {
            attributes
        } = node;

        for (var j = 0, len = attributes.length; j < len; j++) {
            var {
                name, value
            } = attributes[j];
            nameMap[name] = true;
            keyValueArr.push({
                name, value, node, index: j
            })
        }
    }

    for (var i in keyValueArr) {
        var nodeInfo = keyValueArr[i];
        var {
            name, value, node, index
        } = nodeInfo;

        var newValue = processAttributeValue(value, replacedMap);
        node.attributes[index].value = newValue;
    }

    return {nameMap, keyValueArr};
}

function processAttributeValue(value, replacedMap) {

    var normalArr1 = [];
    var normalArr2 = [];
    var normalArr3 = [];
    var normalArr4 = [];
    var normalArr5 = [];
    var errorArr = [];
    var errorArr1 = [];
    var errorArr2 = [];

    value = value.trim();
    var newValue = value;
    if (value) {
        if (value.indexOf("{") > -1) {
            //有意义的
            newValue = processBrace(value, replacedMap);
        } else if (value.indexOf("(") > -1) {
            //可能有意义的
            normalArr2.push(value)
        } else if (value.indexOf(".") > -1) {
            //可能有意义的
            normalArr3.push(value)
        } else if (parseFloat(value) == value) {
            //不需要替换的
            errorArr.push(value);
        } else {
            //不知道是否有意义的
            var tmpVlue = "var tmpTest = " + value;
            try {
                babylon.parse(tmpVlue)
                //可能无意义的

                if (value == "false" || value == "true") {

                }
                else if (value.length == 1) {
                    //无意义
                    errorArr1.push(value);
                } else if (value.indexOf("-") > -1) {
                    errorArr1.push(value);
                } else {
                    normalArr4.push(value);
                }

            } catch (e) {
                // console.log(value)
                if (value.indexOf("track") > -1) {
                    //有意义的
                    normalArr5.push(value);
                } else {
                    //无意义的
                    errorArr.push(value);
                }

            }

        }
    }

    return newValue;
}

function processBrace(value, replacedMap) {
    var newValue = value;
    var replacedDouble = false;
    newValue = value.replace(/(?:\{\{)(.*?)(?:\}\})/g, function (match, matchReg, index, srcStr) {
        replacedDouble = true;
        var tmp = processAst(matchReg, replacedMap);
        return "{{" + tmp + "}}";
    });

    if (!replacedDouble) {
        //单个花括号
    } else {

    }
    return newValue;
}

function processAst(str, replacedMap) {

    //处理 |
    var testArr1 = str.split(/\s{1,}\|\s{1,}/g);
    if (testArr1.length > 2) {
        logInfo("这里有异常", "|", str);
        return str;
    }
    str = testArr1[0];

    //处理 ::
    var testArr2 = str.split("::");
    if (testArr2.length > 2) {
        logInfo("这里有异常", "::", str)
        return testArr1.join(" | ");
    }

    str = testArr2[testArr2.length - 1];

    try {
        var ast = babylon.parse(str);
        var bindNode = {};
        var bindPath = {};
        traverse(ast, {
            Identifier: {
                enter: function (path) {
                    var node = path.node;
                    var scope = path.scope;
                    for (var i in scope.globals) {
                        bindNode[i] = scope.globals[i];
                    }
                },
                exit: function (path) {
                    var node = path.node;
                    for (var i in bindNode) {
                        if (bindNode[i] == node) {
                            bindPath[i] = path;
                        }
                    }
                }
            }


        })
        if (Object.keys(bindNode).length != Object.keys(bindPath).length) {
            logInfo.log("这里有异常", "bindPath")
        }
        for (var i in bindPath) {
            var dstPath = bindPath[i];

            var finded = false;
            var lasfFindPath = null;
            var fullStr = getFullVarString(dstPath, function (findPath) {
                lasfFindPath = findPath;
                var outPut = generate(findPath.node);
                var code = outPut.code;
                // console.log("code", code)
                //
                if (replacedMap[code]) {
                    console.log("find", code)
                    //需要替换
                    finded = true;
                    return true;
                }
                return false;

            });
            if (!finded) {
                //新增vm前缀
                var outPut = generate(lasfFindPath.node).code;
                outPut = "vm." + outPut;
                // logInfo('test' , outPut)
                lasfFindPath.replaceWithSourceString(outPut);

            }
            // console.log("generate", fullStr)
            // var generateStr = generate(bindPath[i].node).code
            // console.log("generate",generateStr)
        }

        var newStr = generate(ast).code;
        newStr = newStr.replace(";", "");
        console.log("newStr", newStr)

        testArr2[testArr2.length - 1] = newStr;
        testArr1[0] = testArr2.join("::");
        str = testArr1.join(" | ");

    } catch (e) {
        console.log("error", str);
    }


    // console.log(str);
    return str
}

function processStrWithAst(src, replacedMap) {
    console.log(src);
    return src;
}

function getFullVarString(path, callback) {
    callback = callback || function () {

        }
    var flag = false;
    if (callback) {
        if (callback(path)) {
            flag = true;
        }
    }
    if (flag) {
        return;
    }
    //找到父元素的类型非MemberExpression 为止
    while (path.parentPath.node.type == "MemberExpression" &&
    (path.parentPath.key == "object"
        // || path.parentPath.key == "left"
    )) {
        // console.log(">",path.node.type)
        path = path.parentPath;

        if (callback) {
            if (callback(path)) {
                flag = true;
                break;
            }
        }
    }

    if (flag) {
        return;
    }
    if (callback) {
        if (callback(path.parentPath)) {
            flag = true;
        }
    }
    if (flag) {
        return;
    }

    var outPut = generate(path.node);

    // if (getLine(path) == 78) {
    // console.log(outPut.code, getLine(path))
    // }
    return outPut.code;

}