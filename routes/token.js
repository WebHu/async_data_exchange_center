/**
 * fileName:node_http02.js
 * author:gamehu
 * date:2017/2/27 17:10
 * desc:身份验证
 */

const https = require('https');
// restler模块封装https请求
const rest = require('restler');

// 导出方法（通过access_token校验身份信息）
exports.accessToken = function(url, token) {
  const p = new Promise(function(resolve, reject) {
    rest
      .post(url, {
        data: { token }
      })
      .on('complete', function(data) {
        // console.log(data)
        resolve(data); // 返回请求结果
      });
  });
  return p;
};
// 通过Access_Token访问用户信息
exports.userinfo = function(url, token) {
  const p = new Promise(function(resolve, reject) {
    const options = {
      headers: {
        Authorization: token
      }
    };
    rest.postJson(url, {}, options).on('complete', function(data) {
      // console.log(data)
      if (data) {
        resolve(data); // 返回请求结果
      } else {
        reject('未授权');
      }
    });
  });
  return p;
};
// 检查token的缓存是否超时
exports.tokenCheck = function(token) {
  const p = new Promise(function(resolve, reject) {
    try {
      const val = global.token_map.get(token);
      if (val) {
        console.log(val);
        const times = new Date() - val.createTime;
        if (times > global.tokenTtl) {
          // 超过时间
          resolve(false);
          // 移除缓存
          global.token_map.remove(token);
        } else {
          resolve(true);
        }
      } else {
        resolve(false);
      }
    } catch (err) {
      reject(err);
    }
  });
  return p;
};
