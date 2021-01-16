const vscode = require('vscode');
const path = require('path');
const { getTargetPath, getProjectPath, getSuffixJoinPath } = require('./util.js');

/**
 * 查找文件定义的provider，匹配到了就return一个location，否则不做处理
 * 最终效果是，当按住Ctrl键时，如果return了一个location，字符串就会变成一个可以点击的链接，否则无任何效果
 * @param {*} document 
 * @param {*} position 
 * @param {*} token 
 */
function provideDefinition (document, position, token) {
  const fileName = document.fileName;
  const workDir = path.dirname(fileName);
  // const word = document.getText(document.getWordRangeAtPosition(position));
  const line = document.lineAt(position);
  const projectRootPath = getProjectPath(document)

  // 获取当前行中的路径内容
  let pathArr = line.text.match(/('.*?')|(".*?")/g)
  let linePath = ''
  if (pathArr.length > 0) {
    linePath = pathArr[0].substring(1, pathArr[0].length - 1)
  }
  const targetPath = getTargetPath(projectRootPath, linePath, workDir)
  const suffixJoinPath = getSuffixJoinPath(projectRootPath, targetPath, linePath)

  if (suffixJoinPath) {
    return new vscode.Location(vscode.Uri.file(suffixJoinPath), new vscode.Position(0, 0));
  } else {
    vscode.window.showErrorMessage('获取工程路径异常！')
  }

}


/**
 * @param {vscode.ExtensionContext} context
 */
function activate (context) {
  context.subscriptions.push(vscode.languages.registerDefinitionProvider(['json', 'javascript', 'vue'], {
    provideDefinition
  }))

  let disposable = vscode.commands.registerCommand('directory-jump.hello', function () {
    vscode.window.showInformationMessage('对于 directory-jump 如有什么问题请联系作者 yonglei.shang, email: syl18188@163.com!')
  })

  context.subscriptions.push(disposable)
}

// this method is called when your extension is deactivated
function deactivate () { }

module.exports = {
  activate,
  deactivate
}
