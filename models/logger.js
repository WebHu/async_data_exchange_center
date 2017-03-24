/**
 * fileName:logger.js
 * author:gamehu
 * date:2017/3/16 11:02
 * desc:日志管理类
*/
var log4js = require('log4js');
//log配置
log4js.configure({

    appenders: [
        {
            type: 'console',
            category: "console"

        }, //控制台输出
        {
            type: "dateFile",
            filename: 'logs/',
            alwaysIncludePattern: true,
            pattern: "yyyy-MM-dd.log",
            maxLogSize: 20480,
            backups: 3,
            category: 'dateFileLog'

        }//日期文件格式
    ],
    replaceConsole: true,   //替换console.log
    levels:{
        dateFileLog: 'debug',
        console: 'debug'
    }
});


var dateFileLog = log4js.getLogger('dateFileLog');
//var consoleLog = log4js.getLogger('console');
exports.logger = dateFileLog;

//打印http相关日志
exports.use = function(app) {
    app.use(log4js.connectLogger(dateFileLog, {level:'INFO', format:':method :url'}));
}