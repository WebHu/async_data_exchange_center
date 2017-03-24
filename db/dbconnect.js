/**
 * fileName:dbconnect.js
 * author:gamehu
 * date:2017/3/2 9:52
 * desc:数据库连接相关实现
 */

var connectionString, mongoose, db, options, queue, deadQueue;
mongoose = require('mongoose');
var log = require("../models/logger");
var logger = log.logger;
connectionString = "mongodb://192.168.1.165:27017/mongodb-queue";
options = {
    db: {
        native_parser: true//启动本地解析use c++
    },
    server: {
      //  socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 },
        auto_reconnect: true,//是否自动重连接
        poolSize: 5//连接池大小
    },
   // replset: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } }
};
//打开连接
mongoose.connect(connectionString, options, function (err, res) {
    if (err) {
        logger.error('[mongoose log] '+err);
        console.log('[mongoose log] Error connecting to: ' + connectionString + '. ' + err);
    } else {
        console.log('[mongoose log] Successfully connected to: ' + connectionString);

    }
});
//获取连接
var db = mongoose.connection;
exports.dbConn = db;

exports.getCol=function(name){
       return db.collection(name);
};
//db.on('error', console.error.bind(console, 'mongoose connection error:'));等同下面
db.on('error', function (err) {
    logger.error('[mongoose log] '+err);
    console.log('Mongoose connection error: ' + err);
});
//var HashMap=require("hashmap");
var queueDao = require('../dao/queueDao');
db.on('connected', function () {
    console.log("mongoose connected to");
    //创建db中不存在的queue
    createCols();
});

//获取db的所有的collections

function createCols() {
    try {
        var MongoClient = require('mongodb').MongoClient;

        MongoClient.connect(connectionString, function (err, db) {
            if (err) {
                logger.error('[create collection] '+err);
            } else {
                db.collections().then(function (data) {
                    data.forEach(function (d) {
                        //从全局变量中移除已存在的queue
                        if (global.db_queues_map.has(d.s.name)) {
                            global.db_queues_map.remove(d.s.name);
                        }
                    });
                }).then(function (data) {
                    global.db_queues_map.forEach(function (value, key) {
                        db.createCollection("dead-" + key);
                        db.createCollection(key);
                    });
                    //queueDao.createCollections();
                    //  db.close();
                }).catch(function (err) {
                    logger.error('[create collection] '+err);
                });
            }

        });
    }catch (err){
        logger.error('[create collection] '+err);
    }


}

//断开连接事件
db.on('disconnected', function () {
    logger.warn('[mongoose disconnected] ');
    console.log("mongoose disconnected to" + connectionString);
});
//监听进程退出
process.on('SIGINT', function () {
    console.log("SIGINT ..");
    db.close(function () {
        console.log("disconnected ..");
        logger.warn('[process SIGINT] ');
    });
    process.exit(0);
});


