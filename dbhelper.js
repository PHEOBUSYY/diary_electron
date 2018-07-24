/**
 * 所有的数据库操作都放在这里
 * @type {module:mongoose}
 */
//mongodb
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/my_database', {
    // useNewUrlParser: true
}, (error, db) => {
    if (error) console.log(error);
    db.on('error', err => {
        console.log("db", err);
    })
});

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
},{
    id: false
});

function TargetDbHelper(method, time, targets, summary, callback) {
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
        del(time, (err) => {
            if (err) console.log("del", err);
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
        targetModel.deleteOne({'time': time}, function (err, res) {
            if (err) console.log("del err", err);
            callback(res);
        })
    }

    if (method && time) {
        if (method === 'get') {
            get(time, callback);
        } else if (method === 'create') {
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
        console.log("enter query ", time);
        let currentWeek = new Date(time);
        currentWeek.setDate(currentWeek.getDate() - currentWeek.getDay() + 1);//从周一开始算，所以要加1
        console.log("week", currentWeek.toLocaleDateString());
        let weekEnd = new Date(currentWeek.toLocaleDateString());
        weekEnd.setDate(weekEnd.getDate() + 6);
        console.log("week2", weekEnd.toLocaleDateString());
        let typeArray = [];
        if (type instanceof Array) {
            type.forEach(item => {
                typeArray.push({type: item});
            });
        } else {
            typeArray.push({type: type});
        }
        console.log("type", typeArray);
        inputGroupModel.find().or(typeArray).where('time').gte(currentWeek).lte(weekEnd).lean().exec(function (err, res) {
            if (err) console.log("err", err);
            console.log("res", res);
            callback(res);
        });
    }

    function createOrUpdate(time, type, data, callback) {
        del(new Date(time), type, (err) => {
            if (err) console.log("del", err);
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
        inputGroupModel.deleteOne({'time': new Date(time), 'type': type}, function (err, res) {
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
        del(new Date(time), (err) => {
            if (err) console.log("del", err);
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
        timeRecordModel.deleteOne({'time': new Date(time)}, function (err, res) {
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
    dbTarget: function (event, method, time, targets, summary) {
        let targetRenderKey = 'targetRenderer';//renderer线程接受的key
        let callback = res => {
            //这里这样处理的原因是 只有查询的时候返回的query对象包含toJSON方法，剩下的crud操作返回的普通对象，没有toJSON对象
            if (res && res.toJSON && typeof res.toJSON === 'function') {
                event.sender.send(targetRenderKey, method, time, res.toJSON());
            } else {
                event.sender.send(targetRenderKey, method, time, res);
            }
        };
        TargetDbHelper(method, time, targets, summary, callback);
    },
    dbInputGroup: function (event, args) {
        let inputGroupRenderKey = 'inputGroupRenderer';//renderer线程接受的key
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
    test: function (args, callback) {
        InputGroupHelper(args, callback)
    }

};
module.exports = dbHelper;