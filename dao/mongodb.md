#mongodb的操作

转载http://www.cnblogs.com/huangxincheng

## 一：Insert操作
> 文档是采用“K-V”格式存储的，我们知道JSON里面Value，可能是“字符串”，可能是“数组”，又有可能是内嵌的一个JSON对象，相同的方式也适合于BSON。
 >> 常见的插入操作也就两种形式存在：“单条插入”和“批量插入”。
    ①  单条插入
         insert
    ② 批量插入
         insertMany

## 二：Find操作

* <1>>, >=, <, <=, !=, =。对应mongodb："$gt", "$gte", "$lt", "$lte", "$ne", "没有特殊关键字"
* <2>And，OR，In，NotIn。对应mongodb："无关键字“, "$or", "$in"，"$nin"
* <3>在mongodb中还有一个特殊的匹配，那就是“正则表达式”
    ![正则表达式](http://pic002.cnblogs.com/images/2012/214741/2012021900232833.png)
* <4> 有时查询很复杂，可以用$where
## 三：Update操作

      更新操作无非也就两种，整体更新和局部更新，使用场合相信大家也清楚。

### <1> 整体更新
### <2> 局部更新

        有时候我们仅仅需要更新一个字段， 修改器： $inc 和 $set。
* ①  $inc修改器
     $inc也就是increase的缩写，学过sql server 的同学应该很熟悉，比如我们做一个在线用户状态记录，每次修改会在原有的基础上
     自增$inc指定的值，如果“文档”中没有此key，则会创建key，下面的例子一看就懂。
     ![$inc](http://pic002.cnblogs.com/images/2012/214741/2012021901321851.png)
* ② $set修改器
```
   $set : {
            deleted : now(),
            state:2,//修改状态为已处理
        }
```
### <3> upsert操作
     upsert操作就是说：如果我没有查到，我就在数据库里面新增一条，其实这样也有好处，就是避免了我在数据库里面判断是update还是add操作，使用起来很简单
     将update的第三个参数设为true即可。 
     
    今天跟大家分享一下mongodb中比较好玩的知识，主要包括：聚合，游标。

## 一： 聚合

      常见的聚合操作跟sql server一样，有：count，distinct，group，mapReduce。

### <1> count

 ![count](http://pic002.cnblogs.com/images/2012/214741/2012022022344936.png)

### <2> distinct

 ![distinct](http://pic002.cnblogs.com/images/2012/214741/2012022022410978.png)

### <3> group
*  下面举的例子就是按照age进行group操作，value为对应age的姓名。下面对这些参数介绍一下：
   key：  这个就是分组的key，我们这里是对年龄分组。
   initial: 每组都分享一个”初始化函数“，特别注意：是每一组，比如这个的age=20的value的list分享一个
   initial函数，age=22同样也分享一个initial函数。
   $reduce: 这个函数的第一个参数是当前的文档对象，第二个参数是上一次function操作的累计对象，第一次
   为initial中的{”perosn“：[]}。有多少个文档， $reduce就会调用多少次。
   
 ![group](http://pic002.cnblogs.com/images/2012/214741/2012022023404990.png)
 
 看到上面的结果，是不是有点感觉，我们通过age查看到了相应的name人员，不过有时我们可能有如下的要求：

     ①：想过滤掉age>25一些人员。

     ②：有时person数组里面的人员太多，我想加上一个count属性标明一下。

 针对上面的需求，在group里面还是很好办到的，因为group有这么两个可选参数: condition 和 finalize。

     condition:  这个就是过滤条件。

     finalize:这是个函数，每一组文档执行完后，多会触发此方法，那么在每组集合里面加上count也就是它的活了。

![group](http://pic002.cnblogs.com/images/2012/214741/2012022102293097.png)
### <4> mapReduce

        这玩意算是聚合函数中最复杂的了，不过复杂也好，越复杂就越灵活。

  mapReduce其实是一种编程模型，用在分布式计算中，其中有一个“map”函数，一个”reduce“函数。

   ① map：

          这个称为映射函数，里面会调用emit(key,value)，集合会按照你指定的key进行映射分组。

   ② reduce：

         这个称为简化函数，会对map分组后的数据进行分组简化，注意：在reduce(key,value)中的key就是

      emit中的key，vlaue为emit分组后的emit(value)的集合，这里也就是很多{"count":1}的数组。

   ③ mapReduce:

          这个就是最后执行的函数了，参数为map，reduce和一些可选参数。具体看图可知：

![mapReduce](http://pic002.cnblogs.com/images/2012/214741/2012022111202288.png)
 

从图中我们可以看到如下信息：

       result: "存放的集合名“；

       input:传入文档的个数。

       emit：此函数被调用的次数。

       reduce：此函数被调用的次数。

       output:最后返回文档的个数。

最后我们看一下“collecton”集合里面按姓名分组的情况。

![collecton](http://pic002.cnblogs.com/images/2012/214741/2012022111270618.png)

 

## 二：游标

    mongodb里面的游标有点类似我们说的C#里面延迟执行，比如：
      var list=db.person.find();
    针对这样的操作，list其实并没有获取到person中的文档，而是申明一个“查询结构”，等我们需要的时候通过
    for或者next()一次性加载过来，然后让游标逐行读取，当我们枚举完了之后，游标销毁，之后我们在通过list获取时，
    发现没有数据返回了。

![游标](http://pic002.cnblogs.com/images/2012/214741/2012022112191440.png)

    当然我们的“查询构造”还可以搞的复杂点，比如分页，排序都可以加进去。
     var single=db.person.find().sort({"name",1}).skip(2).limit(2);
    那么这样的“查询构造”可以在我们需要执行的时候执行，大大提高了不必要的花销。
    
![](http://pic002.cnblogs.com/images/2012/214741/2012022112252930.png)


## 索引操作

### 一：性能分析函数（explain）
    好了，数据已经插入成功，既然我们要做分析，肯定要有分析的工具，幸好mongodb中给我们提供了一个关键字叫做“explain"。
   
 ![explain](http://pic002.cnblogs.com/images/2012/214741/2012022823115964.png)
    
   cursor:       这里出现的是”BasicCursor",什么意思呢，就是说这里的查找采用的是“表扫描”，也就是顺序查找，很悲催啊。

   nscanned:  这里是10w，也就是说数据库浏览了10w个文档，很恐怖吧，这样玩的话让人受不了啊。

   n:             这里是1，也就是最终返回了1个文档。

   millis:        这个就是我们最最最....关心的东西，总共耗时114毫秒。 

 

### 二：建立索引（ensureIndex）
  
 ![ensureIndex](http://pic002.cnblogs.com/images/2012/214741/2012022823373585.png)

  这里我们使用了ensureIndex在name上建立了索引。”1“：表示按照name进行升序，”-1“：表示按照name进行降序。

我的神啊，再来看看这些敏感信息。

   cursor:       这里出现的是”BtreeCursor"，这么牛X，mongodb采用B树的结构来存放索引，索引名为后面的“name_1"。

   nscanned:  我擦，数据库只浏览了一个文档就OK了。

   n:             直接定位返回。

   millis:        看看这个时间真的不敢相信，秒秒杀。

 


 

### 三：唯一索引

     和sqlserver一样都可以建立唯一索引，重复的键值自然就不能插入，在mongodb中的使用方法是：
db.person.ensureIndex({"name":1},{"unique":true})。

![unique](http://pic002.cnblogs.com/images/2012/214741/2012022900115280.png)


 

### 四：组合索引

     有时候我们的查询不是单条件的，可能是多条件，比如查找出生在‘1989-3-2’名字叫‘jack’的同学，那么我们可以建立“姓名”和"生日“

的联合索引来加速查询。

![组合](http://pic002.cnblogs.com/images/2012/214741/2012022900250710.png)

看到上图，大家或者也知道name跟birthday的不同，建立的索引也不同，升序和降序的顺序不同都会产生不同的索引，

那么我们可以用getindexes来查看下person集合中到底生成了那些索引。

![](http://pic002.cnblogs.com/images/2012/214741/2012022900305376.png)
 

此时我们肯定很好奇，到底查询优化器会使用哪个查询作为操作，呵呵，还是看看效果图：

![](http://pic002.cnblogs.com/images/2012/214741/2012022900352917.png)

看完上图我们要相信查询优化器，它给我们做出的选择往往是最优的，因为我们做查询时，查询优化器会使用我们建立的这些索引来创建查询方案，

如果某一个先执行完则其他查询方案被close掉，这种方案会被mongodb保存起来，当然如果非要用自己指定的查询方案，这也是

可以的，在mongodb中给我们提供了hint方法让我们可以暴力执行。

![](http://pic002.cnblogs.com/images/2012/214741/2012022900434745.png)

 

### 五： 删除索引

     可能随着业务需求的变化，原先建立的索引可能没有存在的必要了，可能有的人想说没必要就没必要呗，但是请记住，索引会降低CUD这三
种操作的性能，因为这玩意需要实时维护，所以啥问题都要综合考虑一下，这里就把刚才建立的索引清空掉来演示一下:dropIndexes的使用。

![](http://pic002.cnblogs.com/images/2012/214741/2012022900492239.png)


### 如果需要启动调试，需要修改package.json
 * 把"start": "node ./bin/www" 修改为   "start": "node  %NODE_DEBUG_OPTION%  ./bin/www"
