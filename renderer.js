document.querySelector("input").addEventListener('keyup', () => {
  const keyword = document.querySelector("input").value;
  window.electronAPI.setTitle(keyword?`${keyword}-Everything`:'Everything');
}, false)

window.electronAPI.onRerender(()=>{
  alert('删除完成，重新渲染成功');
})

const btn = document.getElementById('btn');

btn.addEventListener('click', async () => {
  const filePath = await window.electronAPI.openDirectory();
  window.electronAPI.setDir(filePath)
})