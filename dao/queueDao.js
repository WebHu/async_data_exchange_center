/**
 * fileName:queueDao.js
 * author:gamehu
 * date:2017/3/9 10:11
 * desc:异步数据交换中心队列dao
 */
const mongoose = require('mongoose');
var db = require('../db/dbconnect');
//mongodb queue
var mongoDbQueue = require('mongodb-queue');
var log = require("../models/logger");
var logger = log.logger;
var Promise = require('bluebird');
var util = require('../models/util');
//创建queue
/*exports.createCollections = function () {
 global.db_queues_map.forEach(function (value, key) {
 console.log(key + " : " + value);
 var deadQueue = mongoDbQueue(db.dbConn, 'dead-' + key, {
 visibility: 3000,
 delay: 0,
 maxRetries: 2
 });
 var queue = mongoDbQueue(db.dbConn, key, {
 visibility: 30,
 delay: 0,
 deadQueue: deadQueue,
 maxRetries: 2
 });
 });
 };*/
//add queue
//exports.queues_map=db.queues_map;
exports.puQueue = function (queueName, req, longpoll) {
    var p = new Promise(function (resove, reject) {
        var deadQueue = mongoDbQueue(db.dbConn, "dead-" + queueName);
        var queue = mongoDbQueue(db.dbConn, queueName, {
            visibility: global.queueVisibility,
            delay: global.queueDelay,
            deadQueue: deadQueue,
            maxRetries: global.queueMaxRetries
        });
        var b = [];
        b = req.body;
        b["payload"] = JSON.parse(b["payload"]);
        //添加到队列
        queue.add(b, function (err, id) {
            if (err) {
                reject(err);
            } else {
                //longpoll.create("/getQueueForTms");
                resove(id);
            }
        });

    });
    return p;
};


//get queue
var getQueue = function (queueName, params) {
    try {
        var p = new Promise(function (resove, reject) {
            var deadQueue = mongoDbQueue(db.dbConn, "dead-" + queueName);
            var queue = mongoDbQueue(db.dbConn, queueName, {
                visibility: global.queueVisibility,
                delay: global.queueDelay,
                deadQueue: deadQueue,
                maxRetries: global.queueMaxRetries
            });
            var param = {
                deleted: null,
                visible: {$lte:(new Date()).toISOString()},
                state: {$ne: 2},//不等于2
            };
            if (params) {
                param=util.mergeJsonObject(param,params) ;
            }
            queue.get({params: param}, function (err, msg) {
                if (err) {
                    reject(err);
                }
                else {
                    // console.log("时间间隔"+msg.visible-(new Date()).toISOString())
                    resove(msg);
                }

            });

        });
        return p;
    } catch (err) {
        console.error(err);
        logger.error(err);
    }

};
exports.getQue = getQueue;
//长轮询获取queue
exports.intervalQueue = function (curr_queue, params) {
    var p = new Promise(function (resove, reject) {
        try {
            var data;
            var interval;
            //默认一秒查询一次
            interval = setInterval(function () {
                getQueue(curr_queue, params).then(function (message) {
                    console.log("list_messages:" + message);
                    data = message;
                    if (message) {
                        resove(data);
                        //查到数据clear time，然后返回
                        clearInterval(interval);
                        clearTimeout(timeOut);
                    }
                }, function (err) {
                    reject(err);
                    //   console.error(err);
                }).catch(function (err) {
                    reject(err);
                });

            }, global.timerInterval);
            //默认10秒后停止查询
            var timeOut = setTimeout(function () {
                clearInterval(interval);
                resove(data);
            }, global.timerTimeOut);

        } catch (err) {
            reject(err);
        }
    });
    return p;
};

//处理获取的queue msg

exports.ackQueue = function (queueName, ack) {
    var p = new Promise(function (resove, reject) {

        var deadQueue = mongoDbQueue(db.dbConn, "dead-" + queueName);
        var queue = mongoDbQueue(db.dbConn, queueName, {
            deadQueue: deadQueue
        });
        queue.ack(ack, function (err, newMsg) {
            if (err) {
                reject(err);
            } else {
                resove(newMsg);
            }
        });
    });
    return p;
};

//获取某租户下某用户的queue
exports.getQueuesByMyself = function (q, params) {
    var p = new Promise(function (resove, reject) {
        //   queueNames.forEach(function (q) {
        var deadQueue = mongoDbQueue(db.dbConn, "dead-" + q);
        var queue = mongoDbQueue(db.dbConn, q, {
            deadQueue: deadQueue
        });
        queue.getQueuesByMyself(params, function (err, docs) {
            if (err) {
                reject(err);
            } else {
                resove(docs)
            }
        });
        //  });
    });
    return p;
};
//获取某用户的 某条queue
exports.getQueueByOid = function (q, oid) {
    var p = new Promise(function (resove, reject) {
        //   queueNames.forEach(function (q) {
        var deadQueue = mongoDbQueue(db.dbConn, "dead-" + q);
        var queue = mongoDbQueue(db.dbConn, q, {
            deadQueue: deadQueue
        });
        queue.getQueueByOid({_id: mongoose.Types.ObjectId(oid)}, function (err, doc) {
            if (err) {
                reject(err);
            } else {
                resove(doc)
            }
        });
        //  });
    });
    return p;
};

//获取某用户的queues
exports.getQueuesByCid = function (q, params) {
    var p = new Promise(function (resove, reject) {
        //   queueNames.forEach(function (q) {
        var deadQueue = mongoDbQueue(db.dbConn, "dead-" + q);
        var queue = mongoDbQueue(db.dbConn, q, {
            deadQueue: deadQueue
        });
        queue.getQueuesByCid(params, function (err, doc) {
            if (err) {
                reject(err);
            } else {
                resove(doc)
            }
        });
        //  });
    });
    return p;
};

//删除
exports.deleteQueueById = function (id, queueName) {
    var p = new Promise(function (resove, reject) {
        //根据name获取collection
        mongoose.connection.db.listCollections({name: queueName})
            .next(function (err, collinfo) {
                if (collinfo) {
                    //获取collection
                    var c = db.getCol(collinfo.name);
                    // The collection exists
                    c.findAndRemove({_id: mongoose.Types.ObjectId(id)}, function (err, node) {
                        if (err) {
                            reject(err);
                        } else {
                            resove(node);
                        }
                    });
                } else {
                    reject("no collection")
                }
            });

    });

    return p;
};