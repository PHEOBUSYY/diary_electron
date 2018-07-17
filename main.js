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


//dbHelper
let dbHelper = require('./dbhelper');

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({width: 1500, height: 750});

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
    let args = {
      method: 'get',
      time : new Date().toLocaleDateString(),
      type: 1,
      data: [
          {
              value: '测试0'
          },
          {
              value: '测试1'

          }
      ]
    };
    dbHelper.test(args, res =>{
        console.log("tester", res);
    })
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
//目标
let targetKey = 'target';
electron.ipcMain.on(targetKey, (event, method, time, targets) => {
    dbHelper.dbTarget(event, method, time, targets);
});
//成就
let inputGroupKey = 'inputGroup';
electron.ipcMain.on(inputGroupKey, (event, args) => {
    dbHelper.dbInputGroup(event, args);
});

//时间记录
let timeRecordKey = 'timeRecord';
electron.ipcMain.on(timeRecordKey, (event, args) => {
    dbHelper.timeRecord(event, args);
});

