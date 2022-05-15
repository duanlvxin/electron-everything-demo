const fs = require('fs');
const path = require('path');
const dayjs = require('dayjs');

// const startDir = ['C:\\', 'D:\\'];
let startDir = [];
let fileObjList = [];

const generateFileObjList = (dir) => {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    try {
      const fileStat = fs.statSync(dir+file);
      fileObjList.push({
        filename: file,
        path: path.resolve(dir, file),
        size: fileStat.size,
        createdTime: fileStat.birthtime,
        modifiedTime: fileStat.mtime,
        isFile: true
      })

      const stat = fs.statSync(`${dir}${file}`);
      if (stat.isDirectory()) {
        fileObjList[fileObjList.length-1].isFile = false;
        generateFileObjList(`${dir}${file}\\`);
      }
    } catch (error) {
      console.log(error);
    }
  });
}

startDir.forEach((dir) => {
  generateFileObjList(dir);
})

// console.log(fileObjList);

const dateFormat = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
}

const renderer = (arr, keyword='') => {
  document.querySelector('#file-list__content').innerHTML = '';
  for (const fileObj of arr) {
    const div = document.createElement('div');
    div.classList = ['file'];
    const start = fileObj.filename.match(new RegExp(keyword)).index;
    const filename1 = fileObj.filename.substr(0, start);
    const filename2 = fileObj.filename.substr(start, keyword.length);
    const filename3 = fileObj.filename.substr(start+keyword.length);
    const imgSrc = fileObj.isFile ? './img/file.svg': './img/filefolder.svg';
    div.innerHTML = `
      <span id="file-list__content-filename" title="${fileObj.filename}\nPath: ${fileObj.path}\nSize: ${fileObj.size}\nBirthTime: ${dateFormat(fileObj.createdTime)}\nModifyTime: ${dateFormat(fileObj.modifiedTime)}">
        <img src="${imgSrc}">
        <i>${filename1}</i><i style="font-weight: bold">${filename2}</i><i>${filename3}</i>
      </span>
      <span>${fileObj.path}</span>
      <span>${fileObj.size}</span>
      <span>${dateFormat(fileObj.createdTime)}</span>
      <span>${dateFormat(fileObj.modifiedTime)}</span>
    `
    document.querySelector("#file-list__content").appendChild(div);

    div.addEventListener('contextmenu', () => {
      ipcRenderer.send('open-context-menu', fileObj.path);
    }, false);
  }
}

const reGenerate = () => {
  fileObjList = [];
  startDir.forEach((dir)=>{
    generateFileObjList(dir);
  })
  renderer(fileObjList);
}

window.addEventListener('DOMContentLoaded', () => {
  document.querySelector("input").addEventListener('keyup', () => {
    const keyword = document.querySelector("input").value;
    const arr = fileObjList.filter((item) =>
      new RegExp(keyword).test(item.filename)
    );
    renderer(arr, keyword);
  })
})

// 右键单击弹出菜单面板
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  setTitle: (title) => ipcRenderer.send('set-title', title),
  onRerender: (callback) => ipcRenderer.on('rerender', ()=>{
    reGenerate();
    callback();
  }),
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  setDir: (dir) => {
    console.log(dir);
    startDir = [`${dir}\\`];
    reGenerate();
  }
})