/**
 * fileName:util.js
 * author:gamehu
 * date:2017/3/23 17:57
 * desc:工具类
*/

//设置响应内容
var sendJSONresponse = function (res, status, content) {
    res.status(status);
    res.json(content);
};
exports.sendJSONresponse=sendJSONresponse;

//合并两个json对象
var mergeJsonObject = function (jsonbject1, jsonbject2) {
    var resultJsonObject={};
    for(var attr in jsonbject1){
        resultJsonObject[attr]=jsonbject1[attr];
    }
    for(var attr in jsonbject2){
        resultJsonObject[attr]=jsonbject2[attr];
    }
    return resultJsonObject;
};
exports.mergeJsonObject=mergeJsonObject;
