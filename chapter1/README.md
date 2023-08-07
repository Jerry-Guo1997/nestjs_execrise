---
aliases: [1-Typescript+Eslint+Prettier搭建Nestjs工程及断点调试]
tags: []
cssclass:
source:
date created: 星期四, 五月 18日 2023, 10:32:41 晚上
date modified: 星期四, 六月 1日 2023, 11:54:54 中午
---
## 学习目标
- 安装与配置 [Node.js](https://nodejs.org) + [pnpm](https://pnpm.io/) 的开发环境
- 配置 _tsconfig.json_ + [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/) 实现Nestjs应用的代码规范化
- 配置 [VSCode](https://code.visualstudio.com/) 在保存代码时自动运行 ESLint + Prettier
- 配置 _lanunch.json_ 对应用进行断点调试
## 环境搭建
安装与配置 [Node.js](https://nodejs.org/) 环境
建议：我们所有TS课程统一使用 [pnpm](https://pnpm.io/) 作为包管理器（Windows 的同学在学习期间可以使用 Yarn）
### 安装 Node.js
有关开发环境，由于 Windows 对 Node.js 的开发支持并不友好，所以只推荐 Linux 与 Macos 作为开发环境。你也可以自行安装 [WSL2](https://learn.microsoft.com/zh-cn/windows/wsl/install) 和 Linux 虚拟机，这些不在我们的课程范围内，请自行研究。Linux 发行版可以从[arch](https://archlinux.org/)、[ubuntu](https://ubuntu.com/) 或者 [fedora](https://getfedora.org/) 中任选一个（站长强烈推荐 [manjaro](https://manjaro.org)）
另外，如果你不想折腾或者想得到一个体验最好，最完美的TS全栈开发环境，MacOS将是不二选择

#### MacOS 中安装
> 建议使用brew安装node环境

```shell
# 安装Brew
~ /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装Node
~ brew install nodejs
```

#### Linux 中安装
> 此处的node版本，可根据情况，自己从 nodejs.org 选择对应的版本，并在下方命令的基础上进行更改

```shell
# 下载并解压node
~ sudo wget https://nodejs.org/dist/v18.16.0/node-v18.16.0-linux-x64.tar.xz -O /usr/local/src/node18.tar.xz
~ sudo tar -xf /usr/local/src/node18.tar.xz -C /usr/local/
~ sudo mv /usr/local/node-v18.16.0-linux-x64 /usr/local/node
# 添加到环境变量
~ echo "export PATH=/usr/local/node/bin:\$PATH" >> ~/.zshrc && source ~/.zshrc
```

#### Windows 中安装
[请参考这篇文章](https://learn.microsoft.com/zh-cn/windows/dev-environment/javascript/nodejs-on-windows)
### 配置npm
设置全局库的存放目录
> 用于防止权限问题

```shell
~ npm config set prefix $HOME/.node_modules
~ echo "export PATH=$HOME/.node_modules/bin:\$PATH" >> ~/.zshrc && source ~/.zshrc
```

配置 [npm](https://www.npmjs.com/) 淘宝镜像

```shell
~ npm config set registry https://registry.npmmirror.com/
```

### 安装与配置pnpm

安装 [pnpm](https://pnpm.io/) 以及初始化 pnpm
> 注意，Windows 如果在此步骤选择 pnpm 作为包管理器，可能会出现错误。如果选择在 Windows 中进行学习，推荐使用 Yarn 或者直接使用 npm

```shell
~ npm install -g pnpm
~ pnpm setup 
~ source ~/.zshrc
```

安装源管理工具

```shell
~ pnpm add nnrm -g
```

选择一个国内镜像

```shell
~ nnrm use taobao
```

### Node版本管理
使用pnpm可直接管理多个Node版本

```shell
# 使用最新版
~ pnpm env use --global latest
# 使用长期支持版
~ pnpm env use --global lts
```

另外如果你无法使用比较科学的上网方式，那么可以使用传统的版本管理工具，比如 [n](https://github.com/tj/n) 或者 [nvm](https://github.com/nvm-sh/nvm)
> 因为我们使用普通用户权限进行编程，所以把 n 的目录通过环境变量改成我们可以操作的目录

```shell
~ pnpm add n -g 
~ echo "export N_PREFIX=\$HOME/.n" >> ~/.zshrc
~ echo "export PATH=\$N_PREFIX/bin:\$PATH" >> ~/.zshrc
~ source ~/.zshrc
# 安装最新的长期支持版
~ n lts_latest && node --version
# 切换回最新版
~ n latest && node --version
```

## Nestjs应用
### 初始化
安装 [Nest CLI](https://docs.nestjs.com/cli/overview)

```shell
~ pnpm add @nestjs/cli -g
```

创建项目，我们命名为 `chapter1`

```shell
~ nest new chapter1 # 创建的时候选择pnpm
```

升级所有包到最新版本

```shell
~ pnpm up -latest
```

为了后续安装其它库时不会因为 `peer`_ _建议依赖中缺少 `webpack`而报出警告，把下面这段添加到 _package.json_ 中用于忽略`webpack`

```json
"pnpm": {
    "peerDependencyRules": {
      "ignoreMissing": [
        "webpack"
      ]
    }
  }
```

### tsconfig 配置
_tsconfig.json_ 文件中添加 `ESNEXT` 就可以使用最新的 _ES_ 语法，并且添加一个 `@` 作为根目录映射符
> 添加 `**.js`  是为了让 `.eslintrc.js`  之类的文件也能被格式化，但是必须要在  `tsconfig.build.json`  中排除

```json
{
    "compilerOptions": {
        // ...
        "paths": {
            "@/*": ["src/*"]
        }
    },
     "include": ["src", "test", "typings/**/*.d.ts", "**.js"]
}
```

配置_ tsconfig.build.json_

```json
{
    "extends": "./tsconfig.json",
    "exclude": ["node_modules", "test", "dist", "**.js", "**/*spec.ts"]
}
```

### 代码风格
> 完整的代码请查看 git 仓库

配置 [airbnb](https://github.com/airbnb/javascript) 的 ESLint 规则并整合 [Prettier](https://prettier.io/)，并且经过一定的客制化同时配合 VSCode 可达到完美的编码体验

```shell
pnpm add typescript \
eslint \
prettier \
@typescript-eslint/parser \
@typescript-eslint/eslint-plugin \
eslint-config-airbnb-base \
eslint-config-airbnb-typescript \
eslint-config-prettier \
eslint-plugin-import \
eslint-plugin-prettier \
eslint-plugin-unused-imports \
eslint-plugin-jest -D
```

配置 `eslint` 内容

```javascript
...
plugins: ['@typescript-eslint', 'jest', 'prettier', 'import', 'unused-imports'],
extends: [
    // airbnb规范
    'airbnb-base',
    // 兼容typescript的airbnb规范
    'airbnb-typescript/base',
    // typescript的eslint插件
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',

    // 支持jest
    'plugin:jest/recommended',
    // 使用prettier格式化代码
    'prettier',
    // 整合typescript-eslint与prettier
    'plugin:prettier/recommended',
],
```

#### 一些重要的规则
`eslint-plugin-unused-imports` 用于自动删除未使用的导入

```javascript
...
 'no-unused-vars': 0,
 '@typescript-eslint/no-unused-vars': 0,
 'unused-imports/no-unused-imports': 1,
 'unused-imports/no-unused-vars': [
    'error',
    {
        vars: 'all',
        args: 'none',
        ignoreRestSiblings: true,
    },
]
```

`import` 插件，`import/order` 可以按照自己的需求配置

```javascript
// 导入模块的顺序
'import/order': [
     'error',
     {
         pathGroups: [
             {
                 pattern: '@/**',
                 group: 'external',
                 position: 'after',
             },
         ],
         alphabetize: { order: 'asc', caseInsensitive: false },
         'newlines-between': 'always-and-inside-groups',
         warnOnUnassignedImports: true,
     },
],
// 导入的依赖不必一定要在 dependencies 的文件
'import/no-extraneous-dependencies': [
    'error',
     {
         devDependencies: [
             '**/*.test.{ts,js}',
             '**/*.spec.{ts,js}',
             './test/**.{ts,js}',
         ],
     },
],
```

接下来需要配置一下 _.prettierrc_ 和 _.editorconfig_，并且把一些它们各自需要忽略的目录和文件分别添加到 ._eslintignore_ 和 ._prettierignore_
最后把 git 仓库需要忽略的目录和文件写入 ._gitignore_
## **开发与调试**
对于 [Node.js](https://nodejs.org) 和 [TypeScript](https://www.typescriptlang.org/) 等前端技术最好的开发工具，毋庸置疑的就是 [VSCode](https://code.visualstudio.com/)。任何其它选项（包括 Vim、Emacs、Sublime Text、Atom、WebStorm 等等）都有这样那样的问题需要去耗费精力解决，所以建议直接使用 VSCode 进行开发
> VSCode 已经自带同步配置和插件的功能，建议启用
安装 [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) 插件和 [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) 插件（可在 VSCode 插件中搜索并安装）

```shell
~ code --install-extension dbaeumer.vscode-eslint \
  && code --install-extension esbenp.prettier-vscode
```

按 `cmd + ,` 选择偏好设置 -> 工作空间，配置 [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) 插件

```json
{
    // 使用eslint+prettier自动格式化
    "editor.formatOnSave": false,
    "editor.codeActionsOnSave": {
        "source.fixAll.eslint": true
    },
    // 导入模块时默认使用相对于项目的路径
    "javascript.preferences.importModuleSpecifier": "project-relative",
    // jsdoc注释时不带return
    "typescript.suggest.jsdoc.generateReturns": false,
    // 只启用项目范围的错误报告
    "typescript.tsserver.experimental.enableProjectDiagnostics": true,
    // 使用项目内部安装的ts的sdk
    "typescript.tsdk": "node_modules/typescript/lib",
    // 默认使用pnpm作为eslint服务器的包管理工具
    "eslint.packageManager": "pnpm",
    // 默认使用pnpm作为包安装的管理工具
    "npm.packageManager": "pnpm",
}
```

按 `shift + cmd + d` 创建 `lanunch.json`，打好断点，按`F5`就可以进行调试
> 请注意，断点调试和 TDD、E2E 等测试的区别，断点调试只是在一些简单的情况下找出错误，并非测试。关于测试我们将会在后面的课程进行讲解

```json
{
    // 使用 IntelliSense 了解相关属性。
    // 悬停以查看现有属性的描述。
    // 欲了解更多信息，请访问: https://go.microsoft.com/fwlink/?linkid=830387
    "version": "0.2.0",
    "configurations": [
        {
            "name": "debug 3r",
            "request": "launch",
            "runtimeArgs": ["run-script", "start:debug"],
            "autoAttachChildProcesses": true,
            "console": "integratedTerminal",
            "runtimeExecutable": "pnpm",
            "skipFiles": ["<node_internals>/**"],
            "type": "node"
        }
    ]
}
```

至此，所有配置完成。
