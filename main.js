const electron = require('electron');
// const Menu = require("menu");
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const path = require('path');
const url = require('url');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;


//mongodb

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/my_database', (error, db) => {
    if (error)
        console.log(error);
    db.on('error',err=>{
        console.log("db", err);
    })
});

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({width: 1024, height: 678});

    mainWindow.webContents.openDevTools();
    // and load the index.html of the app.
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'www/index.html'),
        protocol: 'file:',
        slashes: true
    }));

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    });
    //解决mac无法粘贴和复制的问题
    if (process.platform === 'darwin') {
        // Create our menu entries so that we can use MAC shortcuts
        electron.Menu.setApplicationMenu(electron.Menu.buildFromTemplate([{
            label: "Application",
            submenu: [
                {label: "About Application", selector: "orderFrontStandardAboutPanel:"},
                {type: "separator"},
                {
                    label: "Quit", accelerator: "Command+Q", click: function () {
                        app.quit();
                    }
                }
            ]
        },
            {
                label: 'Edit',
                submenu: [
                    {role: 'undo'},
                    {role: 'redo'},
                    {type: 'separator'},
                    {role: 'cut'},
                    {role: 'copy'},
                    {role: 'paste'},
                    {role: 'pasteandmatchstyle'},
                    {role: 'delete'},
                    {role: 'selectall'}
                ]
            }
        ]));
    }

    //测试mongodb是否连接成功
    let dbhelper = new TargetDbHelper();
    let time = '2018-7-9';
    let targets = [];
    targets.push({
        text: '测试',
        star: true,
        editable: false,
        type: 0,
        week: ['周六','周日']
    });
    targets.push({
        text: '测试4',
        star: false,
        editable: false,
        type: 0,
        week: ['周一','周五']
    });
    targets.push({
        text: '测试5',
        star: false,
        editable: false,
        type: 0,
        week: ['周','周五']
    });
    dbhelper.createOrUpdate(time, targets, (res) => {
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
});

electron.ipcMain.on('target', (event, method, time, targets) => {
    console.log(arguments);
    let channel = 'targetRenderer';
    if (method && time) {
        let dbhelper = new TargetDbHelper();
        if (method === 'get') {
            dbhelper.get(time, (res) => {
                event.sender.send(channel, method, time,res ? res.toJSON() : res);
            });
        } else if (method === 'create') {
            dbhelper.createOrUpdate(time, targets, (res) => {
                event.sender.send(channel, method, time, res ? res.toJSON() : res);
            });
        } else if (method === 'delete') {
            dbhelper.del(time, (res) => {
                event.sender.send(channel, method, time,res ?  res.toJSON() : res);
            });
        }
    }

});
let Schema = mongoose.Schema;
//构造函数
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

let targetModel = mongoose.model('TargetModel', targetSchema);

function TargetDbHelper() {
    return {
        get: function (time, callback) {
            targetModel.findOne({
                'time': time
            }, function (err, res) {
                if (err) console.log("get err", err);
                console.log("res", res);
                callback(res);
            })
        },
        createOrUpdate: function (time, targets, callback) {
            this.del(time,(err)=>{
                if(err) console.log("del", err);
                let newObject = new targetModel({
                    time: time,
                    targets: targets
                });
                console.log("save targets", JSON.stringify(targets));
                newObject.save().then(res =>{
                    console.log("save res", res);
                    callback(res);
                }).catch(err =>{
                    if(err) console.log("save", err);
                })
            })
        },
        del: function (time, callback) {
            targetModel.deleteOne({'time': time}, function (err, res) {
                if (err) console.log("del err", err);
                console.log("res", res);
                callback(res);
            })
        }
    }
}
