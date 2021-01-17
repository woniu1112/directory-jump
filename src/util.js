const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { resolve } = require('path');
const { aliasObj, pathStandard, fileSuffix } = vscode.workspace.getConfiguration('directoryJump')

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
  // 由于存在Multi-root工作区，暂时没有特别好的判断方法，先这样粗暴判断
  // 如果发现只有一个根文件夹，读取其子文件夹作为 workspaceFolders
  let workspaceFolderPath = workspaceFolders[0].substring(1).replace(/\//g, "\\")
  if (workspaceFolders.length == 1 && workspaceFolderPath === vscode.workspace.rootPath) {
    const rootPath = workspaceFolderPath
    var files = fs.readdirSync(rootPath)
    workspaceFolders = files.filter(name => !/^\./g.test(name)).map(name => path.resolve(rootPath, name))
  }
  workspaceFolders.forEach(folder => {
    if (path.join(vscode.workspace.rootPath, pathStandard) === folder) {
      projectPath = path.join(folder, './..')
    }
  })
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
  // try {
    let directoryJump = vscode.workspace.getConfiguration('directoryJump')
    let convertMsg = JSON.parse(msg)
    if (Object.prototype.toString.call(convertMsg) === '[object Object]') {
      // let obj = Object.assign(aliasObj, convertMsg)
      let obj = {...aliasObj, ...convertMsg}
      console.log('obj:' + obj['@c'])
      directoryJump.update('aliasObj', obj, true).then(() => {
        return true
      }).then(undefined, err => {
        console.log('err: ' + err)
        return false
      })
    } else {
      return false
    }
  // } catch(err) {
  //   console.log()
  //   return false
  // }  
}

module.exports = {
  getProjectPath,
  getTargetPath,
  getSuffixJoinPath,
  setAlias
}
