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
    }]
});

function TargetDbHelper(method, time, targets, callback) {
    let targetModel = mongoose.model('TargetModel', targetSchema);


    function get(time, callback) {
        targetModel.findOne({
            'time': time
        }, function (err, res) {
            if (err) console.log("get err", err);
            callback(res);
        })
    }

    function createOrUpdate(time, targets, callback) {
        del(time, (err) => {
            if (err) console.log("del", err);
            let newObject = new targetModel({
                time: time,
                targets: targets
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
            createOrUpdate(time, targets, callback);
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
    }
}


const dbHelper = {
    dbTarget: function (event, method, time, targets) {
        let targetRenderKey = 'targetRenderer';//renderer线程接受的key
        let callback = res => {
            //这里这样处理的原因是 只有查询的时候返回的query对象包含toJSON方法，剩下的crud操作返回的普通对象，没有toJSON对象
            if (res && res.toJSON && typeof res.toJSON === 'function') {
                event.sender.send(targetRenderKey, method, time, res.toJSON());
            } else {
                event.sender.send(targetRenderKey, method, time, res);
            }
        };
        TargetDbHelper(method, time, targets, callback);
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
    test: function (args, callback) {
        InputGroupHelper(args, callback)
    }

};
module.exports = dbHelper;