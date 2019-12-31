/**
 * fileName:getway.js
 * author:gamehu
 * date:2017/3/6 15:06
 * desc:异步数据交换中心路由
 */

const express = require('express');
// 获取路由对象
const router = express.Router();
// 注：post请求获取参数需要
const bodyParser = require('body-parser');
const https = require('https');
// 引入dao
const queueDao = require('../dao/queueDao');
// 引入初始化相关信息
const util = require('../models/util');
// log
const log = require('../models/logger');

const logger = log.logger;
log.use(router);
// base64解码
const Base64 = require('../models/base64');
// 引入validate
const vali = require('./validate');
// 身份校验
let appid, companyid, curr_queue, access_token;
router.use('/', function(req, res, next) {
  try {
    // 系统的queue集合
    const h = global.queues_map;
    // base64解码,获取appid
    access_token =
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6ImtfS1JMRk9TM1dPYk9ZcUN2ZEpKS2I3ZGo1TSIsImtpZCI6ImtfS1JMRk9TM1dPYk9ZcUN2ZEpKS2I3ZGo1TSJ9.eyJpc3MiOiJodHRwczovL2lkLnNoaXB4eS5jb20vY29yZSIsImF1ZCI6Imh0dHBzOi8vaWQuc2hpcHh5LmNvbS9jb3JlL3Jlc291cmNlcyIsImV4cCI6MTQ5NzkyNzUwOSwibmJmIjoxNDkwMTUxNTA5LCJjbGllbnRfaWQiOiJkZW1vaWQiLCJzY29wZSI6WyJvcGVuaWQiLCJwcm9maWxlIiwibG9nYXBpIl0sInN1YiI6Ijk2YWU5MTQzZDJjNzBlMDkiLCJhdXRoX3RpbWUiOjE0OTAxNTE1MDcsImlkcCI6Imlkc3J2IiwiYW1yIjpbInBhc3N3b3JkIl19.kbacLLITDAhRM1VBd4Jpo5lINRbz7SKC4U43Qoj9GqmW7ECyLoS3Yu-YY0QGy2ForaqhDdIeaWfQ-p-DWnS_svcoKo2nv46xD0jIwJbzLunmlUbDPWqfJVCQoRKQcCAt3KrCMw-U_K9cHduSjpWHZF8WRhdLbiNuqTQ2U5OC8op_aMestz8Tz1GXKoM-jo-HpYdGJADc_PKB5Ij8eseh6QzRsI3Dhj4079XB1Iwmz5cKYnc3oUZTsqlUo2uZf8xtFaZdvHaw4AT40--XaGDZPkBdVBEt7pvGYvXvAZ_F4Aa1CSOka9qdzcT1GrojNng20ChVdR46lknL5ZUTmeCJYw';
    // 验证身份信息
    const token = require('./token');
    // 校验token缓存
    token.tokenCheck(access_token).then(
      function(data) {
        if (data) {
          next();
        } else {
          // 去用户中心校验身份
          const a_appid = access_token.split('.')[1];
          // 创建base64解码对象
          const b = new Base64();
          const out = b.decode(a_appid);
          appid = JSON.parse(out).client_id;
          // 获取appid（平台）对应的queue
          curr_queue = global.queues_map.get(appid);
          if (curr_queue) {
            token
              .userinfo('https://xxx', `Bearer ${access_token}`)
              .then(
                function(data) {
                  console.log(data);
                  companyid = data.companyid;
                  if (!companyid) {
                    util.sendJSONresponse(res, 401, {
                      message: '未授权'
                    });
                    logger.error(`${err}没有companyid，校验未通过`);
                    return;
                  }
                  logger.info(`${data.nickname},用户校验通过,${new Date()}`);
                  // 缓存token
                  global.token_map.set(access_token, {
                    createTime: new Date(),
                    appid,
                    companyid,
                    curr_queue
                  });
                  next();
                },
                function(err) {
                  console.log(err);
                  util.sendJSONresponse(res, 401, {
                    message: err
                  });
                  logger.error(`${err}用户中心，校验未通过`);
                }
              )
              .catch(function(err) {
                util.sendJSONresponse(res, 401, {
                  message: '未授权'
                });
                logger.error(`${err},身份校验异常`);
              });
          } else {
            util.sendJSONresponse(res, 401, {
              message: '未授权'
            });
            logger.error(`${500},身份校验异常,不存在对应的queue`);
          }
        }
      },
      function(err) {
        logger.error(`${401},缓存身份校验出错`);
      }
    );
  } catch (err) {
    util.sendJSONresponse(res, 401, {
      message: '未授权'
    });
    logger.error(err);
  }
});

// 确认(处理)前校验数据
router.use('/ackQueue/:ack', function(req, res, next) {
  try {
    if (req.method === 'POST') {
      // 获取ack
      var ack = req.body.ack;
      if (!ack) {
        util.sendJSONresponse(res, 403, { message: '数据校验未通过' });
      } else {
        next();
      }
    } else if (req.method === 'GET') {
      // 获取ack
      var ack = req.params.ack;
      if (!ack) {
        util.sendJSONresponse(res, 403, { message: '数据校验未通过' });
      } else {
        next();
      }
    }
  } catch (err) {
    logger.error(`ackQueue校验异常，${err}`);
  }
});

// header的body部分转换为json
const jsonParser = bodyParser.json();
// 获取消息队列中的信息
function getQueues(req, res) {
  try {
    const catalog = req.params.catalog;
    const type = req.params.type;
    let queueName, params;
    if (curr_queue) {
      queueName = curr_queue;
    } else {
      const val = global.token_map.get(access_token);
      queueName = val.curr_queue;
    }
    // 拼接where条件
    if (companyid) {
      if (catalog && type) {
        params = { toCompanyid: companyid, catalog, type };
      } else if (catalog) {
        params = { toCompanyid: companyid, catalog };
      } else if (type) {
        params = { toCompanyid: companyid, type };
      } else {
        params = { toCompanyid: companyid };
      }
    } else {
      util.sendJSONresponse(res, 401, '未授权');
      return;
    }
    // 获取消息，先进先出
    queueDao
      .intervalQueue(queueName, params)
      .then(
        function(data) {
          if (data) {
            util.sendJSONresponse(res, 200, data);
          } else {
            util.sendJSONresponse(res, 200, { message: '没有数据' });
          }
        },
        function(err) {
          util.sendJSONresponse(res, 500, { message: '获取失败' });
          logger.error(`${500},定时器错误，${err}`);
        }
      )
      .catch(function(err) {
        logger.error(`${500},定时器错误，${err}`);
        util.sendJSONresponse(res, 500, { message: '获取失败' });
      });
  } catch (err) {
    util.sendJSONresponse(res, 500, { message: '获取失败' });
    logger.error(`${500},获取失败，${err}`);
  }
}

router.get('/getQueue', function(req, res, next) {
  console.log('/getQueue');
  getQueues(req, res);
});
router.get('/getQueue/:catalog', function(req, res, next) {
  console.log('/getQueue/:catalog');
  getQueues(req, res);
});
router.get('/getQueue/:catalog/:type', function(req, res, next) {
  console.log('/getQueue/:catalog/:type');
  getQueues(req, res);
});

// 添加数据 long polling ，put
router.put('/', function(req, res) {
  try {
    // 校验数据
    vali
      .validateData(req, res)
      .then(
        function(v) {
          let queueName;
          if (curr_queue) {
            queueName = curr_queue;
          } else {
            const val = global.token_map.get(access_token);
            queueName = val.curr_queue;
          }
          // 添加到queue
          queueDao
            .puQueue(queueName, req)
            .then(function(data) {
              if (!data || data == 0) {
                util.sendJSONresponse(res, 500, {
                  message: '发送失败'
                });
              } else {
                util.sendJSONresponse(res, 200, {
                  message: '发送成功'
                });
              }
            })
            .catch(function(err) {
              console.error(err);
              logger.error(err);
            });
        },
        function(err) {
          console.error(err);
          logger.error(`数据校验未通过,${err}`);
          util.sendJSONresponse(res, 403, {
            message: '数据校验未通过'
          });
        }
      )
      .catch(function(err) {
        util.sendJSONresponse(res, 403, {
          message: '数据校验未通过'
        });
        logger.error(`数据校验未通过，${err}`);
      });
  } catch (err) {
    util.sendJSONresponse(res, 500, {
      message: '发送失败'
    });
    logger.error(`发送失败,${err}`);
  }
});

// 删除queue通过_id
router.delete('/deleteQueue/:id', function(req, res, next) {
  try {
    const id = req.params.id;
    const queueName = req.params.queueName;

    queueDao
      .deleteQueueById(id, queueName)
      .then(
        function(data) {
          if (data.value) {
            util.sendJSONresponse(res, 200, { message: '删除成功' });
            logger.info('queue:%s删除成功', id);
          } else {
            util.sendJSONresponse(res, 200, { message: '删除失败' });
            logger.warn('queue:%s删除失败', id);
          }
        },
        function(err) {
          util.sendJSONresponse(res, 200, { message: '删除失败' });
          logger.error('queue:%s删除失败', id);
        }
      )
      .catch(function(err) {
        logger.error('queue:%s删除失败', id);
      });
  } catch (err) {
    logger.error(err);
  }
});

// 修改状态为已确认，处理queue
router.get('/ackQueue/:ack', function(req, res) {
  try {
    console.log('ack..');
    let queueName;
    if (curr_queue) {
      queueName = curr_queue;
    } else {
      const val = global.token_map.get(access_token);
      queueName = val.curr_queue;
    }
    const ack = req.params.ack;
    queueDao
      .ackQueue(queueName, ack)
      .then(
        function(data) {
          console.log(data);
          util.sendJSONresponse(res, 200, { message: '处理成功' });
        },
        function(err) {
          console.error(err);
          logger.error(`ackQueue异常,消息已过期，${err}`);
          util.sendJSONresponse(res, 401, { message: '消息已过期' });
        }
      )
      .catch(function(err) {
        console.error(err);
        util.sendJSONresponse(res, 500, { message: '处理失败' });
        logger.error(`ackQueue异常，${err}`);
      });
  } catch (err) {
    util.sendJSONresponse(res, 500, { message: '处理失败' });
    logger.error(`ackQueue异常，${err}`);
  }
});

// 获取queues by clientReference 列表
router.get('/getQueuesByCid/:cid', function(req, res, next) {
  try {
    let queueName;
    if (curr_queue) {
      queueName = curr_queue;
    } else {
      const val = global.token_map.get(access_token);
      queueName = val.curr_queue;
    }
    const cid = req.params.cid;
    queueDao
      .getQueuesByCid(queueName, { clientReference: cid })
      .then(
        function(data) {
          if (data && data.length != 0) {
            util.sendJSONresponse(res, 200, data);
          } else {
            util.sendJSONresponse(res, 200, { message: '没找到数据' });
          }
        },
        function(err) {
          console.log(err);
          logger.error(`获取失败,${err}`);
          util.sendJSONresponse(res, 500, { message: '获取失败' });
        }
      )
      .catch(function(err) {
        util.sendJSONresponse(res, 500, { message: '获取失败' });
        logger.error(`获取失败,${err}`);
      });
  } catch (err) {
    util.sendJSONresponse(res, 500, { message: '获取失败' });
    logger.error(`获取失败，${err}`);
  }
});
// 获取queues by ObjectID 列表
router.get('/getQueueByOid/:oid', function(req, res, next) {
  try {
    let queueName;
    if (curr_queue) {
      queueName = curr_queue;
    } else {
      const val = global.token_map.get(access_token);
      queueName = val.curr_queue;
    }
    const oid = req.params.oid;
    if (oid) {
      queueDao
        .getQueueByOid(queueName, oid)
        .then(
          function(data) {
            if (data) {
              util.sendJSONresponse(res, 200, data);
            } else {
              util.sendJSONresponse(res, 200, { message: '没找到数据' });
            }
          },
          function(err) {
            console.log(err);
            logger.error(`获取失败,${err}`);
            util.sendJSONresponse(res, 500, { message: '获取失败' });
          }
        )
        .catch(function(err) {
          util.sendJSONresponse(res, 500, { message: '获取失败' });
          logger.error(`获取失败,${err}`);
        });
    } else {
      logger.error(`oid为空,${err}`);
      util.sendJSONresponse(res, 403, { message: '获取失败' });
      return;
    }
  } catch (err) {
    util.sendJSONresponse(res, 500, { message: '获取失败' });
    logger.error(`获取失败，${err}`);
  }
});

// 获取与自己相关的所有queue
router.get('/getQueuesByMyself/:companyid/:clientReference', function(req, res, next) {
  const h = global.queues_map.keys();
  // 根据平台id、租户id、用户标识获取
  queueDao
    .getQueuesByMyself(h[0], req.params.appid, req.params.companyid, req.params.clientReference)
    .then(
      function(data) {
        const datas = [];
        datas.push(data);
        return datas;
      },
      function(err) {
        console.error(err);
        return [];
      }
    )
    .then(function(datas) {
      queueDao.getQueuesByMyself(h[1], req.params.appid, req.params.companyid, req.params.clientReference).then(
        function(data) {
          datas.push(data);
          util.sendJSONresponse(res, 200, datas);
        },
        function(err) {
          console.error(err);
          util.sendJSONresponse(res, 200, { message: '没有数据' });
        }
      );
    })
    .catch(function(err) {
      console.error(err);
    });
});
// 导出路由
module.exports = router;
