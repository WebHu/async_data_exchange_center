/**
 * fileName:queue_init.js
 * author:gamehu
 * date:2017/3/8 17:33
 * desc:初始化工作——异步数据中心
*/
//引入hashmap
var HashMap=require("hashmap");
global.queues_map = new HashMap();
//var history_queues=['his_tms_queue','his_tuochebao_queue','his_interconnectioncar_queue'];
queues_map.set("demoid","tms_queue");
queues_map.set("tuochebao_queue","tuochebao_queue");
global.db_queues_map = new HashMap();
db_queues_map.set("tms_queue","tms_queue");
db_queues_map.set("tuochebao_queue","tuochebao_queue");

//存储token
global.token_map = new HashMap();
//token缓存时间
global.tokenTtl=60*1000;//默认缓存时间，单位s，注意该时间一定要大于，longpolling的时间

//longpolling 定时器的时间
global.timerTimeOut=10*1000;//默认30s后停止
global.timerInterval=1*1000;//默认1s查一次
//queue的配置参数
global.queueVisibility=30;//默认每次获取queue后挂起30s,其它消费者不能获取
global.queueMaxRetries=3;//默认最多提取3次，3次后message queue失效
global.queueDelay=0;//默认0s延迟

