/**
 * 所有的数据库操作都放在这里
 * @type {module:mongoose}
 */
//mongodb
const mongoose = require('mongoose');
let uri = 'mongodb://localhost:27017/my_database';
// mongoose.connect(uri,{ useNewUrlParser: true }, function(error) {
//     if(error){
//         console.log("mongoose connect error",  error);
//     }
// });
let Schema = mongoose.Schema;
//目标对象
let targetSchema = new Schema({
    time: String,
    targets: [{
        text: String,
        star: Boolean,
        editable: Boolean,
        type: {type: Number, min: 0, max: 5},
        week: [String]
    }],
    summary: {
        improve: [{
            value: String
        }],
        overall: String,
        score: ''
    }
}, {
    id: false
});

function TargetDbHelper(args, callback) {
    let targetModel = mongoose.model('TargetModel', targetSchema);


    function get(time, callback) {
        targetModel.findOne({
            'time': time
        }, function (err, res) {
            if (err) console.log("get err", err);
            callback(res);
        })
    }

    function createOrUpdate(time, targets, summary, callback) {
        del(time, () => {
            let newObject = new targetModel({
                time: time,
                targets: targets,
                summary: summary
            });
            newObject.save().then(res => {
                callback(res);
            }).catch(err => {
                if (err) console.log("save", err);
            })
        })
    }

    function del(time, callback) {
        targetModel.deleteMany({'time': time}, function (err, res) {
            if (err) console.log("del err", err);
            callback(res);
        })
    }
    let method = args.method;
    let time = args.time;
    if (method && time) {
        if (method === 'get') {
            get(time, callback);
        } else if (method === 'create') {
            let targets = args.targets;
            let summary = args.summary;
            createOrUpdate(time, targets, summary, callback);
        } else if (method === 'delete') {
            del(time, callback);
        }
    }
}

//成就，图片，感悟
let inputGroupSchema = new Schema({
    time: Date,//日期
    type: {type: Number, min: 0, max: 10},//类型  1: 成就 2：感悟 3： 照片 4: 标题 5: ...
    data: [{
        value: String,//输入值
    }]
});

//成就，图片，感悟
function InputGroupHelper(args, callback) {
    let inputGroupModel = mongoose.model('InputGroupModel', inputGroupSchema);

    function get(time, type, callback) {
        inputGroupModel.findOne({
            'time': new Date(time),//日期
            'type': type,//类型
        }, function (err, res) {
            if (err) console.log("get err", err);
            callback(res);
        })
    }

    function query(time, type, callback) {
        //取time时间的周一和周日日期
        let currentWeek = new Date(time);
        currentWeek.setDate(currentWeek.getDate() - currentWeek.getDay() + 1);//从周一开始算，所以要加1
        let weekEnd = new Date(currentWeek.toLocaleDateString());
        weekEnd.setDate(weekEnd.getDate() + 6);
        let typeArray = [];
        if (type instanceof Array) {
            type.forEach(item => {
                typeArray.push({type: item});
            });
        } else {
            typeArray.push({type: type});
        }
        inputGroupModel.find().or(typeArray).where('time').gte(currentWeek).lte(weekEnd).lean().exec(function (err, res) {
            if (err) console.log("err", err);
            callback(res);
        });
    }

    function createOrUpdate(time, type, data, callback) {
        del(new Date(time), type, () => {
            let newObject = new inputGroupModel({
                time: new Date(time),
                type: type,
                data: data
            });
            newObject.save().then(res => {
                callback(res);
            }).catch(err => {
                if (err) console.log("save", err);
            })
        })
    }

    function del(time, type, callback) {
        inputGroupModel.deleteMany({'time': new Date(time), 'type': type}, function (err, res) {
            if (err) console.log("del err", err);
            callback(res);
        })
    }

    let method = args.method;
    let time = args.time;
    let type = args.type;
    if (method === 'get') {
        get(time, type, callback);
    } else if (method === 'create') {
        let data = args.data;
        createOrUpdate(time, type, data, callback);
    } else if (method === 'delete') {
        del(time, type, callback);
    } else if (method === 'query') {
        query(time, type, callback);
    }
}

//时间记录
let timeRecordSchema = new Schema({
    time: Date,//日期
    data: [{
        event: String,//事项
        start: String,//开始时间
        end: String,//结束时间
        remark: String,//备注
    }]
});

//时间记录
function timeRecordHelper(args, callback) {
    let timeRecordModel = mongoose.model('TimeRecordModel', timeRecordSchema);

    function get(time, callback) {
        timeRecordModel.findOne({
            'time': new Date(time)//日期
        }, function (err, res) {
            if (err) console.log("get err", err);
            callback(res);
        })
    }

    function createOrUpdate(time, data, callback) {
        del(new Date(time), () => {
            let newObject = new timeRecordModel({
                time: new Date(time),
                data: data
            });
            newObject.save().then(res => {
                callback(res);
            }).catch(err => {
                if (err) console.log("save", err);
            })
        })
    }

    function del(time, callback) {
        timeRecordModel.deleteMany({'time': new Date(time)}, function (err, res) {
            if (err) console.log("del err", err);
            callback(res);
        })
    }

    let method = args.method;
    let time = args.time;
    if (method === 'get') {
        get(time, callback);
    } else if (method === 'create') {
        let data = args.data;
        createOrUpdate(time, data, callback);
    } else if (method === 'delete') {
        del(time, callback);
    }
}

const dbHelper = {
    dbTarget: function (event, args) {
        let targetRenderKey = 'targetRenderer';//renderer线程接受的key
        let callback = res => {
            //这里这样处理的原因是 只有查询的时候返回的query对象包含toJSON方法，剩下的crud操作返回的普通对象，没有toJSON对象
            if (res && res.toJSON && typeof res.toJSON === 'function') {
                event.sender.send(targetRenderKey, args, res.toJSON());
            } else {
                event.sender.send(targetRenderKey, args, res);
            }
        };
        TargetDbHelper(args, callback);
    },
    dbInputGroup: function (event, args) {
        let inputGroupRenderKey = 'inputgroupRenderer';//renderer线程接受的key
        let callback = res => {
            //这里这样处理的原因是 只有查询的时候返回的query对象包含toJSON方法，剩下的crud操作返回的普通对象，没有toJSON对象
            if (res && res.toJSON && typeof res.toJSON === 'function') {
                event.sender.send(inputGroupRenderKey, args, res.toJSON());
            } else {
                event.sender.send(inputGroupRenderKey, args, res);
            }
        };
        InputGroupHelper(args, callback);
    },
    timeRecord: function (event, args) {
        let timeRecordRenderKey = 'timeRecordRenderer';//renderer线程接受的key
        let callback = res => {
            //这里这样处理的原因是 只有查询的时候返回的query对象包含toJSON方法，剩下的crud操作返回的普通对象，没有toJSON对象
            if (res && res.toJSON && typeof res.toJSON === 'function') {
                event.sender.send(timeRecordRenderKey, args, res.toJSON());
            } else {
                event.sender.send(timeRecordRenderKey, args, res);
            }
        };
        timeRecordHelper(args, callback);
    },
    createConnectDB: function (callback) {
        mongoose.connect(uri,{ useNewUrlParser: true }, function(error) {
            if(callback)callback(error);
            if(error){
                console.log("mongoose connect error",  error);
            }
        });
    }

};
module.exports = dbHelper;