/**
 * fileName:queueDao.js
 * author:gamehu
 * date:2017/3/9 10:11
 * desc:异步数据交换中心队列dao
 */
const mongoose = require('mongoose');
const db = require('../db/dbconnect');
// mongodb queue
const mongoDbQueue = require('mongodb-queue');
const log = require('../models/logger');

const logger = log.logger;
const Promise = require('bluebird');
const util = require('../models/util');
// add queue
// exports.queues_map=db.queues_map;
exports.puQueue = function(queueName, req, longpoll) {
  const p = new Promise(function(resove, reject) {
    const deadQueue = mongoDbQueue(db.dbConn, `dead-${queueName}`);
    const queue = mongoDbQueue(db.dbConn, queueName, {
      visibility: global.queueVisibility,
      delay: global.queueDelay,
      deadQueue,
      maxRetries: global.queueMaxRetries
    });
    let b = [];
    b = req.body;
    b.payload = JSON.parse(b.payload);
    // 添加到队列
    queue.add(b, function(err, id) {
      if (err) {
        reject(err);
      } else {
        // longpoll.create("/getQueueForTms");
        resove(id);
      }
    });
  });
  return p;
};

// get queue
const getQueue = function(queueName, params) {
  try {
    const p = new Promise(function(resove, reject) {
      const deadQueue = mongoDbQueue(db.dbConn, `dead-${queueName}`);
      const queue = mongoDbQueue(db.dbConn, queueName, {
        visibility: global.queueVisibility,
        delay: global.queueDelay,
        deadQueue,
        maxRetries: global.queueMaxRetries
      });
      let param = {
        deleted: null,
        visible: { $lte: new Date().toISOString() },
        state: { $ne: 2 } // 不等于2
      };
      if (params) {
        param = util.mergeJsonObject(param, params);
      }
      queue.get({ params: param }, function(err, msg) {
        if (err) {
          reject(err);
        } else {
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
// 长轮询获取queue
exports.intervalQueue = function(curr_queue, params) {
  const p = new Promise(function(resove, reject) {
    try {
      let data;
      let interval;
      // 默认一秒查询一次
      interval = setInterval(function() {
        getQueue(curr_queue, params)
          .then(
            function(message) {
              console.log(`list_messages:${message}`);
              data = message;
              if (message) {
                resove(data);
                // 查到数据clear time，然后返回
                clearInterval(interval);
                clearTimeout(timeOut);
              }
            },
            function(err) {
              reject(err);
              //   console.error(err);
            }
          )
          .catch(function(err) {
            reject(err);
          });
      }, global.timerInterval);
      // 默认10秒后停止查询
      var timeOut = setTimeout(function() {
        clearInterval(interval);
        resove(data);
      }, global.timerTimeOut);
    } catch (err) {
      reject(err);
    }
  });
  return p;
};

// 处理获取的queue msg

exports.ackQueue = function(queueName, ack) {
  const p = new Promise(function(resove, reject) {
    const deadQueue = mongoDbQueue(db.dbConn, `dead-${queueName}`);
    const queue = mongoDbQueue(db.dbConn, queueName, {
      deadQueue
    });
    queue.ack(ack, function(err, newMsg) {
      if (err) {
        reject(err);
      } else {
        resove(newMsg);
      }
    });
  });
  return p;
};

// 获取某租户下某用户的queue
exports.getQueuesByMyself = function(q, params) {
  const p = new Promise(function(resove, reject) {
    //   queueNames.forEach(function (q) {
    const deadQueue = mongoDbQueue(db.dbConn, `dead-${q}`);
    const queue = mongoDbQueue(db.dbConn, q, {
      deadQueue
    });
    queue.getQueuesByMyself(params, function(err, docs) {
      if (err) {
        reject(err);
      } else {
        resove(docs);
      }
    });
    //  });
  });
  return p;
};
// 获取某用户的 某条queue
exports.getQueueByOid = function(q, oid) {
  const p = new Promise(function(resove, reject) {
    //   queueNames.forEach(function (q) {
    const deadQueue = mongoDbQueue(db.dbConn, `dead-${q}`);
    const queue = mongoDbQueue(db.dbConn, q, {
      deadQueue
    });
    queue.getQueueByOid({ _id: mongoose.Types.ObjectId(oid) }, function(err, doc) {
      if (err) {
        reject(err);
      } else {
        resove(doc);
      }
    });
    //  });
  });
  return p;
};

// 获取某用户的queues
exports.getQueuesByCid = function(q, params) {
  const p = new Promise(function(resove, reject) {
    //   queueNames.forEach(function (q) {
    const deadQueue = mongoDbQueue(db.dbConn, `dead-${q}`);
    const queue = mongoDbQueue(db.dbConn, q, {
      deadQueue
    });
    queue.getQueuesByCid(params, function(err, doc) {
      if (err) {
        reject(err);
      } else {
        resove(doc);
      }
    });
    //  });
  });
  return p;
};

// 删除
exports.deleteQueueById = function(id, queueName) {
  const p = new Promise(function(resove, reject) {
    // 根据name获取collection
    mongoose.connection.db.listCollections({ name: queueName }).next(function(err, collinfo) {
      if (collinfo) {
        // 获取collection
        const c = db.getCol(collinfo.name);
        // The collection exists
        c.findAndRemove({ _id: mongoose.Types.ObjectId(id) }, function(err, node) {
          if (err) {
            reject(err);
          } else {
            resove(node);
          }
        });
      } else {
        reject('no collection');
      }
    });
  });

  return p;
};
