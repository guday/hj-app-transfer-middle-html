/**
 * 调试文件
 * node transform/lib/hj-app-transfer-middle-html/test.js > test11.js
 *
 * @type {"path"}
 */
var path = require("path");
var fs = require("fs");
var util = require("util");
var mainTransfer = require("./index").default;
var enumeFilesSync = require("./enumeFiles").enumeFilesSync
var babylon = require("babylon");
var traverse = require("babel-traverse").default;
var generate = require("babel-generator").default;


var arguments = process.argv.splice(2);
var rootPath = process.cwd();


var defaultSrc = "./test/srcHtml.html";
var defaultDebug = true;
//
var root = "www/html";
var fileNum = 0;
enumeFilesSync(root, function (filePath) {
    // console.log(filePath)
    fileNum++;
    // console.log(fileNum, filePath);
    // console.log(rootPath);
    filePath = path.join(rootPath, filePath)
    console.log(fileNum, filePath);
    // fileNum ++ ;=
    mainTransfer(filePath, {
        isDebugFile: false,
        callback
    });
});

var nameMap = {};
// {nameMap, keyValueArr}
var timer = null;
var keyValueAllArr = [];
function callback(result) {
    var {nameMap, keyValueArr} = result;
    keyValueAllArr = keyValueAllArr.concat(keyValueArr);

    // for (var i in obj) {
    //     nameMap[i] = true;
    // }
    if (timer) {
        clearTimeout(timer);
        timer = null;
    }
    timer = setTimeout(function () {
        // for (var i in nameMap) {
        //     if (i.indexOf("ng-") > -1 || i.indexOf("bo-") > -1) {
        //         // console.log(i);
        //     }
        // }


        processElementValues();

    }, 1000)
    // if (fileNum == 344) {
    //     console.log(nameMap)
    // }
    // console.log('callback')
}

function processElementValues() {
    console.log(keyValueAllArr.length)

    var normalArr = [];
    var normalArr1 = [];
    var normalArr2 = [];
    var normalArr3 = [];
    var normalArr4 = [];
    var normalArr5 = [];
    var errorArr = [];
    var errorArr1 = [];

    for (var i in keyValueAllArr) {
        var {
            name, value
        } = keyValueAllArr[i];

        value = value.trim();
        if (value) {
            if (value.indexOf("{") > -1) {
                //有意义的
                normalArr1.push(value)
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


    }
    // logArr(normalArr1)
    // logArr(normalArr1)
    // logArr(normalArr2)
    // logArr(normalArr3)
    // logArr(errorArr)
    // logArr(errorArr1)
    parse1(normalArr1)
}

function parse1(arr) {
    for (var i in arr) {
        var str = arr[i];
        var replacedDouble = false;
        str.replace(/(?:\{\{)(.*?)(?:\}\})/g, function (match, matchReg, index, srcStr) {


            replacedDouble = true;
            var tmp = processAst(matchReg);
            return tmp;
        });

        if (!replacedDouble) {
            //单个花括号
        } else {
            logInfo(str)
        }
    }


    logInfo(typeMap)
    logInfo(typeMap1)
}

var typeMap = {};
var typeMap1 = {};
var testNum = 0;
function processAst(str) {
    // if (testNum++ > 5) {
    //     return str;
    // }
    var testArr1 = str.split(/\s{1,}\|\s{1,}/g);
    if (testArr1.length > 2) {
        logInfo("这里有异常", str);
        return str;
    }
    str = testArr1[0];

    var testArr2 = str.split("::");
    if (testArr2.length > 2) {
        logInfo("这里有异常", str)
        return testArr1.join(" | ");
    }

    str = testArr2[testArr2.length - 1];

    var tmp = "var tmpTest = " + str;
    try {
        var ast = babylon.parse(str);
        // typeMap[ast.program.body[0].type] = true;
        // typeMap1["x" + ast.program.body.length] = true;
        // console.log(ast.program.body.length)
        var bindNode = {};
        var bindPath = {};
        traverse(ast, {
            // ExpressionStatement: function (path) {
            //     var node = path.node;
            //     typeMap[node.expression.type] = true
            //     switch (node.expression.type) {
            //         case "BinaryExpression":
            //             break;
            //         case "Identifier":
            //             break;
            //         case "CallExpression":
            //             break;
            //         case "ConditionalExpression":
            //             break;
            //     }
            // }
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
        // if (Object.keys(bindNode).length != Object.keys(bindPath).length) {
        //     console.log("errorrrrrrrrrrrrrrrrrrrrrrrr")
        // }
        for (var i in bindPath) {
            // if (testNum++ <5) {
            //     console.log(bindNode[i])
            // }
            var fullStr = getFullVarString(bindPath[i]);
            console.log("generate",fullStr)
            // var generateStr = generate(bindPath[i].node).code
            // console.log("generate",generateStr)
        }

    } catch (e) {
        console.log("error", tmp);
    }

    console.log(str);
}
function logArr(arr) {
    console.log("============", arr.length)
    for (var i in arr) {
        console.log(arr[i])
    }
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