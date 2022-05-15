const { app, BrowserWindow, Menu, MenuItem, nativeTheme, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;

try {
  require('electron-reloader')(module);
} catch (_) { }

async function handleFileOpen() {
  const { canceled, filePaths } = await dialog.showOpenDialog({properties:['openDirectory']})
  if (canceled) {
    return
  } else {
    return filePaths[0]
  }
}

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1800,
    height: 1000,
    // frame: false,
    // titleBarStyle: 'hidden',
    // titleBarOverlay: true, // 不起作用？
    icon: './icon/search.ico',
    resizable: true, // 设置后放大按钮能显示，能改变大小
    movable: true, // 可移动
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // 换肤菜单
  const menu = Menu.getApplicationMenu();
  const menuItem = new MenuItem(
    {
      label: '换肤',
      submenu: [
        new MenuItem({
          click: () => {
            nativeTheme.themeSource = 'dark';
          },
          label: '黑色系',
          checked: nativeTheme.shouldUseDarkColors,
          type: 'radio'
        }),
        new MenuItem({
          click: () => {
            nativeTheme.themeSource = 'light';
          },
          label: '白色系',
          checked: !nativeTheme.shouldUseDarkColors,
          type: 'radio'
        })
      ]
    }
  )
  menu.append(menuItem);
  Menu.setApplicationMenu(menu);

  win.loadFile('index.html');
  // win.webContents.openDevTools();
}

const createEvent = () => {
  // 自定义上下文菜单
  ipcMain.on('open-context-menu', (event, filePath) => {
    const webContents = event.sender;
    const win = BrowserWindow.fromWebContents(webContents);
    const menu = new Menu();
    menu.append(new MenuItem({
      label: 'Open', click: () => {
        exec(`explorer.exe /select,"${filePath}"`)
      }
    }));
    menu.append(new MenuItem({ type: 'separator' }));
    menu.append(new MenuItem({
      label: '删除', click: () => {
        fs.unlinkSync(filePath);
        webContents.send('rerender');
      }
    }));
    menu.popup(win);
  })

  // 改变标题
  ipcMain.on('set-title', (event, title) => {
    const webContents = event.sender;
    const win = BrowserWindow.fromWebContents(webContents);
    win.setTitle(title)
  })

  // 打开文件夹
  ipcMain.handle('dialog:openDirectory', handleFileOpen)
}

app.whenReady().then(() => {
  createEvent();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})