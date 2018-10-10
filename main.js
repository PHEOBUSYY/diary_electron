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

let schedule = require('node-schedule');
//dbHelper
let dbHelper = require('./dbhelper');

function createWindow() {
    let screen = electron.screen.getPrimaryDisplay().workAreaSize;
    // console.log("env", process.env.NODE_ENV);
    // Create the browser window.
    //develop环境下开启debug
    if (process.env.NODE_ENV === 'develop') {
        mainWindow = new BrowserWindow({width: screen.width, height: screen.height});
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow = new BrowserWindow({width: screen.width * 2 / 3, height: screen.height});
    }
    // and load the index.html of the app.
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'www/index.html'),
        protocol: 'file:',
        slashes: true
    }));

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    });
    mainWindow.on('show', function () {
        sendIpc('onShow');
    });
    mainWindow.on('focus',function () {
        sendIpc('onFocus');
    });
    mainWindow.on('blur',function () {
        sendIpc('onBlur');
    });
    //增加快捷键
    let systemKey = 'systemRenderer';
    if (process.platform === 'darwin') {
        // Create our menu entries so that we can use MAC shortcuts
        electron.Menu.setApplicationMenu(electron.Menu.buildFromTemplate([{
            label: "Application",
            submenu: [
                {label: "About Application", selector: "orderFrontStandardAboutPanel:"},
                {type: "separator"},
                {
                    label: "Quit", accelerator: "Command+Q", click: function () {
                        sendIpc('quit');
                    }
                }
            ]
        },
            {
                label: '编辑',
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
            },
            {
                label: '切换',
                submenu: [
                    {
                        label: "向前", accelerator: "CommandOrControl+Right", click: function () {
                            sendIpc('next');
                        }
                    },
                    {
                        label: "后退", accelerator: "CommandOrControl+Left", click: function () {
                            sendIpc('pre');
                        }
                    },
                    {
                        label: "日记", accelerator: "CommandOrControl+Alt+Left", click: function () {
                            sendIpc('pre_router');
                        }
                    },
                    {
                        label: "目标", accelerator: "CommandOrControl+Alt+Right", click: function () {
                            sendIpc('next_router');
                        }
                    },
                ]
            },
            {
                label: '操作',
                submenu: [
                    {
                        //electron中 回车对应为：Return
                        label: "保存", accelerator: "CommandOrControl+Return", click: function () {
                            sendIpc('autosave');
                        }
                    },
                ]
            }
        ]));

    }
}

function createConnectDB() {
    //测试mongodb是否连接成功
    dbHelper.createConnectDB(error => {
        if (error) {
            let notification = new electron.Notification({
                title: '心言-提示',
                body: '请开启后台数据服务!'
            });
            notification.show();
        }
    });
}

let scheduleKey = 'systemRenderer';

function createSchedule() {
    //每隔半小时提示一次
    schedule.scheduleJob('0 20 9,13,16 * * *', function () {
        let notification = new electron.Notification({
            title: '心言-提示',
            body: '请查看今日任务'
        });
        notification.show();
    });
    schedule.scheduleJob('0 */30 * * * *', function () {
        let notification = new electron.Notification({
            title: '心言',
            body: '请填写时间记录'
        });
        notification.show();
    });
    schedule.scheduleJob('*/30 * * * * *', function () {
        sendIpc('autosave');
    });
    // job.cancel();
}

function sendIpc(action,data) {
    mainWindow.webContents.send(scheduleKey, {action: action,data: data})
}

function registerShortCut() {

}

// Some APIs can only be used after this event occurs.
app.on('ready', function () {
    createWindow();
    registerShortCut();
    //开启数据库连接
    createConnectDB();
    createSchedule();
});

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
//目标
let targetKey = 'target';
electron.ipcMain.on(targetKey, (event, args) => {
    dbHelper.dbTarget(event, args);
});
//成就
let inputGroupKey = 'inputgroup';
electron.ipcMain.on(inputGroupKey, (event, args) => {
    dbHelper.dbInputGroup(event, args);
});

//时间记录
let timeRecordKey = 'timeRecord';
electron.ipcMain.on(timeRecordKey, (event, args) => {
    dbHelper.timeRecord(event, args);
});
let systemKey = 'system';
electron.ipcMain.on(systemKey, (event, args) => {
    //系统类通讯
    if (args.action === 'quit') {
        //退出
        setTimeout(()=>{
            app.quit();
        },500)
    }
});


