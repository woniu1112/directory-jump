const vscode = require('vscode');
const path = require('path');
const { getTargetPath, getProjectPath, getSuffixJoinPath, setAlias } = require('./util.js');

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
// input options
let inputOptions = {
  password: false, // 输入内容是否是密码
  ignoreFocusOut: true, // 默认false，设置为true时鼠标点击别的地方输入框不会消失
  placeHolder: '请输入要添加的别名', // 在输入框内的提示信息
  prompt: 'JSON格式：{ "@": "/src"}' // 在输入框下方的提示信息
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate (context) {
  // 定义跳转
  let provideDefinitionJump = vscode.languages.registerDefinitionProvider([
    'javascript', 'vue', 'css', 'typescript', 'javascriptreact', 'typescriptreact', 'less', 'scss'], {
    provideDefinition
  })
  // 命令 dj-contact 作者联系方式
  let disposable = vscode.commands.registerCommand('file-jump.contact', function () {
    vscode.window.showInformationMessage('对于 file-jump 如有什么问题请联系作者 yonglei.shang, email: syl18188@163.com!')
  })
  // 设置别名
  let updateAlias = vscode.commands.registerCommand('file-jump.updateAlias', function () {
    vscode.window.showInputBox(inputOptions).then(function (msg) {
      setAlias(msg)
    })
  })

  context.subscriptions.push(disposable, provideDefinitionJump, updateAlias)
}

function deactivate () { }

module.exports = {
  activate,
  deactivate
}
