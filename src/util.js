const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { aliasObj, pathStandard, fileSuffix } = vscode.workspace.getConfiguration('fileJump')

/**
* 获取当前所在工程根目录，有3种使用方法：<br>
* getProjectPath(uri) uri 表示工程内某个文件的路径<br>
* getProjectPath(document) document 表示当前被打开的文件document对象<br>
* getProjectPath() 会自动从 activeTextEditor 拿document对象，如果没有拿到则报错
* @param {*} document 
*/
const getProjectPath = function (document) {
  if (!document) {
    document = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document : null
  }
  if (!document) {
    vscode.window.showErrorMessage('当前激活的编辑器不是文件或者没有文件被打开！')
    return ''
  }
  const currentFile = (document.uri ? document.uri : document).fsPath
  let projectPath = null
  let workspaceFolders = vscode.workspace.workspaceFolders.map(item => item.uri.path)
  // 如果发现只有一个根文件夹，读取其子文件夹作为 workspaceFolders
  if (workspaceFolders.length === 1) {
    projectPath = workspaceFolders[0].substring(1).replace(/\//g, "\\")
  } else { // 当有多个文件时进行匹配
    workspaceFolders.map(item => {
      let splitArr = item.split(':')
      if (currentFile.indexOf(splitArr[1].replace(/\//g, "\\")) !== -1) {
        projectPath = item.substring(1).replace(/\//g, "\\")
      }
    })
  }
  if (!projectPath) {
    vscode.window.showErrorMessage('获取工程根路径异常！')
    return ''
  }
  return projectPath
}

const getTargetPath = function (rootPath, linePath, workDir) {
  if (linePath) {
    let aliasArr = Object.keys(aliasObj)
    let hasAlias = false
    let aliasKey = ''
    aliasArr.forEach(keys => {
      if (linePath.indexOf(keys) === 0) {
        hasAlias = true
        aliasKey = keys
      }
    })
    if (hasAlias) {
      return path.join(rootPath, linePath.replace(aliasKey, aliasObj[aliasKey]))
    } else {
      return path.join(workDir, linePath)
    }
  } else {
    return ''
  }
}

const getSuffixJoinPath = function (projectRootPath, targetPath, linePath) {
  let joinPath = ''
  if (linePath) {
    let extname = path.extname(targetPath)
    if (linePath.indexOf('/') === -1 && fs.existsSync(path.join(projectRootPath, `node_modules/${linePath}/package.json`))) {
      joinPath = path.join(projectRootPath, `node_modules/${linePath}/package.json`)
    } else if (!extname) {
      fileSuffix.forEach(item => {
        if (fs.existsSync(`${targetPath}.${item}`)) {
          joinPath = `${targetPath}.${item}`
        } else if (fs.existsSync(`${path.join(targetPath, 'index')}.${item}`)) {
          joinPath = `${path.join(targetPath, 'index')}.${item}`
        }
      })
    } else if (fs.existsSync(targetPath)) {
      joinPath = targetPath
    }
  }
  return joinPath
}

const setAlias = function (msg) {
  try {
    let fileJump = vscode.workspace.getConfiguration('fileJump')
    let convertMsg = JSON.parse(msg)
    if (Object.prototype.toString.call(convertMsg) === '[object Object]') {
      let obj = {}
      if (convertMsg.reset === true) {
        delete convertMsg.reset
        obj = { "@": '/src', ...convertMsg }
      } else {
        obj = { ...aliasObj, ...convertMsg }
      }
      fileJump.update('aliasObj', obj).then(res => {
        vscode.window.showInformationMessage('恭喜您设置成功, 请重启vscode!')
      })
    } else {
      vscode.window.showErrorMessage('抱歉设置失败，请按照提示中的格式添加！')
    }
  } catch (err) {
    vscode.window.showErrorMessage('抱歉设置失败，请按照提示中的格式添加！')
  }
}

module.exports = {
  getProjectPath,
  getTargetPath,
  getSuffixJoinPath,
  setAlias
}
