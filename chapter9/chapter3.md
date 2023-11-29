---
title: React基础入门
sidebar_label:  React基础入门
hide_title: true
sidebar_position: 3
---

:::tip
本课程更建议学习视频版，视频在网盘里(网盘地址在[《本手册的主页》](../index.md#资料获取))，请自行获取，感谢`@许竣皓`同学提供本教程！
:::
:::note
注意: 本基础教程不提供问答服务与源码，因为不需要！
:::

## React 起源与发展

> React 起源于 Facebook 的内部项目
>
> 因为该公司对市场上所有 JavaScript MVC 框架，都不满意，就决定自己写一套
>
> 做出来以后，发现这套东西很好用，就在 2013 年 5 月开源了

## React 与传统 MVC 的关系

> 1. 轻量级的视图层库
> 2. React 不是一个完整的 MVC 框架，最多可以认为是 MVC 中的 V（View），甚至 React 并不非常认可 MVC 开发模式
> 3. React 构建页面 UI 的库。
> 4. 可以简单地理解为，React 将界面分成了各个独立的小块，每一个块就是组件，这些组件之间可以组合、嵌套，就成了我们的页面。

## React 的特性

> 1. 声明式设计 -- React 采用声明范式，可以轻松描述应用。
> 2. 高效, 通过对 DOM 的模拟(虚拟 dom), 最大限度地减少与 DOM 的交互。
> 3. 灵活 -- React 可以与已知的库或框架很好地配合。
> 4. JSX -- JSX 是 JavaScript 语法的扩展
> 5. 组件 -- 通过 React 构建组件，使得代码更加容易得到复用，能够很好的应用在大顶目的开发中。
> 6. 单向响应的数据流 -- React 实现了单向响应的数据流

## 虚拟 DOM

> 传统 DOM 更新:
>
> - 真实页面对应一个 DOM 树。
> - 在传统页面的开发模式中，每次需要更新页面时，都要手动操作 DOM 来进行更新

![image-20221207230808296](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221207230808.png)

> 虚拟 DOM:
>
> - DOM 操作非常昂贵
> - 在前端开发中，性能消耗最大的就是 DOM 操作，而且这部分代码会让整体项目的代码变得难以维护
> - React 把真实 DOM 树转换成 JavaScript 对象树，也就是 Virtual DOM

![image-20221207230845552](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221207230845.png)

## 为什么学习 React？

> 1. 系出名门, facebook 开发
> 2. 一个专注于构建用户界面的 JavaScript 框架，和 vue 和 angular 并称前端三大框架
> 3. React 的出现让创建交互式 UI 变得轻而易举
> 4. 函数和类就是 UI 的载体, 将数据传入 React 的类和函数中，返回的就是 UI 界面

![](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202204042053065.webp)

> 5. React 应用中，一切皆组件
> 6. React 还具有跨平台能力, Node 进行服务器渲染，还可以用 React Native 进行原生移动应用的开发
> 7. 小厂喜欢 Vue, 大厂喜欢 React

![](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202204040116690.png)

## react 文档

> 1. React 英文文档 [https://reactjs.org/](https://reactjs.org/)
> 2. React 中文文档 [https://zh-hans.reactjs.org/](https://zh-hans.reactjs.org/)
> 3. React 新文档 https://beta.reactjs.org/（开发中....）

## 配置开发环境

> 安装脚手架工具

```bash
npm install -g create-react-app
```

> 使用脚手架创建项目

```bash
create-react-app 项目名称
```

> 以上两个命令, 也可以合成一个

```bash
npx create-react-app 项目名称
```

> 1. npx create-react-app 是固定命令，`create-react-app`是 React 脚手架的名称
> 2. 项目名称，可以自定义，保持语义化
> 3. npx 命令会帮助我们临时安装 create-react-app 包，然后初始化项目完成之后会自自动删掉，所以不需要全局安装 create-react-app

## npm 和 npx 的区别

> npm 的 m 是 Management，npx 的 x 可以理解为 eXecute。
>
> 当执行`npx xxx`的时候，npx 先看`xxx`在`$PATH`里有没有，如果没有，找当前目录的`node_modules`里有没有，如果还是没有，就安装这个 `xxx` 来执行。

## 页面的显示流程

> 简单梳理一下显示的流程
>
> 首先是`src\App.js`, 在 js 文件中可以书写 html 代码

![](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202204041434214.png)

> 这是 jsx 的语法
>
> 1. js，是一种直译式脚本语言
> 2. jsx，JavaScript XML 是一种在 React 组件内部构建标签的类 XML 语法。
> 3. 每一个 XML 标签都会被 JSX 转换工具转换成纯 JS 代码，使用 JSX 可以使组件的结构和组件之间的关系看上去更加清晰。

> 区别
>
> 1. 浏览器只能识别不同的 JS 和 CSS，不能识别 SCSS 或者 JSX，所以 webpack 的作用就是把 SCSS 转换成 CSS，把 JSX 转换成 JS，然后在浏览器正常使用。
> 2. React 使用 JSX 来替代常规的 JavaScript。
> 3. js 就是 react 里面的 jsx（也就是在 JS 文件里面直接写 HTML 那种）

> 在`src\index.js`中,我们引用了 app
>
> 把它作为 html 的一部分, 渲染到了`id="root"`的元素里面

![](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202204041445554.png)

> 元素在`public\index.html`里面

![](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202204041446225.png)

## NPM vs YARN

> 从 `package.json` 中安装项目依赖:

```console
npm install / npm i
或
yarn
```

> 向 `package.json` 添加/安装新的项目依赖:

```console
npm install {库名} / npm i {库名}
或
yarn add {库名}
```

> 向 `package.json` 添加/安装新的 dev 项目依赖（devDependency）:

```console
npm install {库名} --save-dev / npm i {库名} --save-dev
或
yarn add {库名} --dev
```

> 删除依赖项目:

```console
npm uninstall package --save
或
yarn remove package
```

> 升级某个依赖项目:

```console
npm update --save
或
yarn upgrade
```

> 全局安装某项目依赖（慎用）:

```console
npm install package -g
或
yarn global add package
```

## 编写第一个 react 应用程序

> 把 src 目录清空，然后在里面重新创建一个`index.js`, 它是 src 的入口文件

```jsx
// src\index.js
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<h1>欢迎进入React的世界</h1>);
```

> 最终的结果

![image-20221208172551370](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221208172551.png)

## 什么是 jsx

> JSX 是 JavaScript XML（HTML）的缩写，表示在 JS 代码中书写 HTML 结构
>
> 作用是在 React 中创建 HTML 结构（页面 UI 结构）
>
> 优势:
>
> 1. 采用类似于 HTML 的语法，降低学习成本，会 HTML 就会 JSX
> 2. 充分利用 JS 自身的可编程能力创建 HTML 结构

> 注意：JSX 并不是标准的 JS 语法，是 JS 的语法扩展，浏览器默认是不识别的，脚手架中内置的`@babel/plugin-transform-react-jsx`包，用来解析该语法
>
> 如下图, 左边使我们编写的声明式代码, 右边是解析后的命令式代码

![](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202204041936620.png)

## JSX 中使用 js 表达式

> 先编写一个测试环境, src 中只保留`src\index.js`

```jsx
// src\index.js
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<h1>欢迎进入React的世界</h1>);
```

> 语法: `{ JS 表达式 }`

```jsx
// src\index.js
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));
const username = "张三";
root.render(<h1>你好, 我叫{username} !!!</h1>);
```

![image-20221209152221290](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221209152221.png)

> 可以使用的表达式
>
> 1. 字符串、数值、布尔值、null、undefined、object（ [] / {} ）
> 2. 1 + 2、'abc'.split('')、['a', 'b'].join('-')
> 3. fn()

> 特别注意: `if 语句/ switch-case 语句/ 变量声明语句`，这些叫做语句，不是表达式，不能出现在 `{}` 中！！

> 以下是一个函数的例子

```jsx
// src\index.js
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));
const username = "张三";
const getAge = () => {
	return 30;
};
root.render(
	<h1>
		你好, 我叫{username} , 今年 {getAge()} 岁了!!!
	</h1>
);
```

![image-20221209152325461](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221209152325.png)

> jsx 里面也支持三元运算符

```jsx
// src\index.js
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));
const username = "张三";
const getAge = () => {
	return 30;
};
const flag = true;
root.render(
	<h1>
		你好, 我叫{username} , 今年 {getAge()} 岁了!!!
		{flag ? "真棒!!!" : "好逊哟..."}
	</h1>
);
```

![image-20221209152557464](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221209152557.png)

## JSX 列表渲染

> 页面的构建离不开重复的列表结构，比如歌曲列表，商品列表等，我们知道 vue 中用的是 v-for，react 这边如何实现呢？
>
> react 中可以使用`map`方法
>
> 假如我们有如下歌单

```javascript
const songs = [
	{ id: 1, name: "粉红高跟鞋" },
	{ id: 2, name: "伤心太平洋" },
	{ id: 3, name: "雨一直下" },
];
```

> 我们想做成一个无序列表, 可以这么写

```jsx
// src\index.js
import ReactDOM from "react-dom/client";
const songs = [
	{ id: 1, name: "粉红高跟鞋" },
	{ id: 2, name: "伤心太平洋" },
	{ id: 3, name: "雨一直下" },
];
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
	<div>
		<h1>歌单</h1>
		<ul>
			{songs.map((item) => {
				return (
					<li key={item.id}>
						第{item.id}首歌: 《{item.name}》
					</li>
				);
			})}
		</ul>
	</div>
);
```

> 和 vue 一样, 遍历的时候, 注意添加 key 属性

```jsx
<li key={item.id}>{item.name}</li>
```

![](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202204072007779.png)

> 1. key 在 HTML 结构中是看不到的，是 React 内部用来进行性能优化时使用
> 2. key 在当前列表中要唯一的字符串或者数值（String/Number）
> 3. 如果列表中有像 id 这种的唯一值，就用 id 来作为 key 值
> 4. 如果列表中没有像 id 这种的唯一值，就可以使用 index（下标）来作为 key 值

## JSX 条件渲染

> 作用：根据是否满足条件生成 HTML 结构
>
> 实现：可以使用 `三元运算符`

```jsx
// src\index.js
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));
const flag = true;
root.render(<h1>{flag ? "好棒棒!!!" : "真菜..."}</h1>);
```

![](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202204042242565.png)

> 也可以使用 if else
>
> 原则: 模板中的逻辑尽量保持精简
>
> 复杂的多分支的逻辑收敛为一个函数, 通过一个专门的函数来写分支逻辑, 模板中只负责调用函数即可

```jsx
// src\index.js
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));
const type = 2;
const getTag = (type) => {
	if (type === 1) {
		return <h1>this is h1</h1>;
	}
	if (type === 2) {
		return <h2>this is h2</h2>;
	}
	if (type === 3) {
		return <h3>this is h3</h3>;
	}
};
root.render(<div>{getTag(type)}</div>);
```

![image-20221209160639597](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221209160639.png)

## JSX 样式处理

> 行内样式 - style, 需要两个花括号, 最外层代表我们要写表达式, 里面的花括号代表是一个对象

```jsx
// src\index.js
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));

const h1Color = "red";
const bgc = "black";

root.render(<h1 style={{ color: h1Color, backgroundColor: bgc }}>hello world</h1>);
```

![image-20221212215257226](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212122152411.png)

> 行内样式 - style - 更优写法, 我们可以把对象的定义提取出来, 赋值给一个变量

```jsx
// src\index.js
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));

const h1Color = "skyblue";
const bgc = "grey";
// 所有样式代码, 保存到一个对象中
const styleObj = {
	color: h1Color,
	backgroundColor: bgc,
};

root.render(<h1 style={styleObj}>hello world</h1>);
```

![image-20221212215416662](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212122154770.png)

> 类名 - className（推荐）
>
> 把样式写在一个单独的 css 文件中

```css
/* src\app.css */
.title {
	color: olivedrab;
	font-size: 44px;
}
```

```jsx
// src\index.js
// 导入css文件
import "./app.css";
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));

// 注意要写成className
root.render(<h1 className="title">hello world</h1>);
```

![](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202204051352569.png)

> 类名 - className - 动态类名控制

```css
/* src\app.css */
.title {
	color: orangered;
	font-size: 48px;
}
```

```jsx
// src\index.js
import ReactDOM from "react-dom/client";
import "./app.css";
const showTitle = true;
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<h1 className={showTitle ? "title" : ""}>hello world</h1>);
```

![](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202204051356430.png)

## JSX 注意事项

> JSX 必须有一个根节点

```jsx
// src\index.js
import ReactDOM from "react-dom/client";
import "./app.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
<h1>hello world</h1>
<h1>hello world</h1>
<h1>hello world</h1>
<h1>hello world</h1>
);

```

![image-20221209163334200](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221209163334.png)

> 如果没有根节点，可以使用`<></>`（幽灵节点）替代

```jsx
// src\index.js
import ReactDOM from "react-dom/client";
import "./app.css";
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
	<>
		<h1>hello world</h1>
		<h1>hello world</h1>
		<h1>hello world</h1>
		<h1>hello world</h1>
	</>
);
```

> JSX 中的语法更加贴近 JS 语法，属性名采用驼峰命名法 `class -> className` `for -> htmlFor`

```jsx
// src\index.js
import ReactDOM from "react-dom/client";
import "./app.css";
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
	<form action="" className="myForm">
		gender:
		<input type="radio" name="" id="myGender" />
		<label htmlFor="myGender">male</label>
	</form>
);
```

## vscode 插件

![](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202204051416257.png)

> 之前我们的提示, 都是划红线, 鼠标移入才能看到结果

![](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202204051417040.png)

> 装了这个插件之后, 会在编辑器的界面, 直接显示错误

![](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202204051418952.png)

## jsx 练习

> 练习说明
>
> 1. 下载准备好的项目模块到本地 ，安装依赖，run 起来项目
> 2. 按照图示，完成 `评论数据渲染` `tab内容渲染` `评论列表点赞和点踩` 三个视图渲染
>
> 代码链接:
>
> - 链接：https://pan.baidu.com/s/1Ysk_tH_xW8gvFbKYE3qgHQ?pwd=6666
>
> 下载解压代码, 安装依赖的包

```bash
npm i / yarn
```

> 安装完成之后, 使用如下命令, 开启项目

```bash
npm run start / yarn start
```

> 这样我们就可以看到效果了

![image-20221209183211583](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221209183211.png)

> 首先遍历列表, 代码中有相关的数据

```js
	list: [
		{
			id: 1,
			author: "刘德华",
			comment: "给我一杯忘情水",
			time: 1633828140000,
			// 1: 点赞 0：无态度 -1:踩
			attitude: 1,
		},
		{
			id: 2,
			author: "周杰伦",
			comment: "哎哟，不错哦",
			time: 1633914540000,
			// 1: 点赞 0：无态度 -1:踩
			attitude: 0,
		},
		{
			id: 3,
			author: "五月天",
			comment: "不打扰，是我的温柔",
			time: 1633918140000,
			// 1: 点赞 0：无态度 -1:踩
			attitude: -1,
		},
	],
```

> 使用 for 循环, 遍历数据

![image-20221209184440253](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221209184440.png)

> 阶段性效果

![image-20221209184458041](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221209184458.png)

> 会提示错误, 因为没有加 key

![image-20221209185103151](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221209185103.png)

![image-20221209185123618](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221209185123.png)

> 数据是重复的, 我们需要修改作者, 评论, 时间

![image-20221209185239916](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221209185240.png)

```jsx
<div className="user">{item.author}</div>
<p className="text">{item.comment}</p>
```

![image-20221209185329137](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221209185329.png)

> 时间也需要修改, 直接写成这样是不行的

```jsx
<span className="time">{item.time}</span>
```

![image-20221209185901317](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221209185901.png)

> 需要编写函数, 时间戳转日期
>
> 函数如下

```js
/**
 * 时间戳转日期
 * @param {number} timestamp 毫秒级时间戳
 * @returns {string} "2022-12-9 19:00:34"
 */
function timestampToTime(timestamp) {
	var date = new Date(timestamp);
	var Y = date.getFullYear() + "-";
	var M = (date.getMonth() + 1 < 10 ? "0" + (date.getMonth() + 1) : date.getMonth() + 1) + "-";
	var D = date.getDate() + " ";
	var h = (date.getHours() + "").padStart(2, "0") + ":"; // 两位, 前补零
	var m = (date.getMinutes() + "").padStart(2, "0") + ":"; // 两位, 前补零
	var s = (date.getSeconds() + "").padStart(2, "0"); // 两位, 前补零
	return Y + M + D + h + m + s;
}
```

> 把函数复制到`App.js`中

![image-20221212222407072](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212122224214.png)

> 原有代码如下修改即可

```jsx
<span className="time">{timestampToTime(item.time)}</span>
```

![image-20221212222428628](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212122224766.png)

> 点赞和点踩是通过类名控制的

![image-20221209190517718](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221209190517.png)

![image-20221209190604550](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221209190604.png)

> 通过 attribute 进行标记

![image-20221209190542768](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221209190542.png)

> 可以对代码做如下修改

```jsx
{/* 动态类名 */}
<span className={item.attitude === 1 ? "like liked" : "like"}>
  <i className="icon" />
</span>
<span className={item.attitude === -1 ? "hate hated" : "hate"}>
  <i className="icon" />
</span>
```

![image-20221209190916947](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221209190917.png)

> tab 内容渲染, 按热度和按时间是两个 tab, 需要遍历渲染

<img src="https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221209191233.png" alt="image-20221209191233065" />

```jsx
<div className="tabs-order">
	<ul className="sort-container">
		{state.tabs.map((item) => (
			<li key={item.id} className="on">
				{item.name}
			</li>
		))}
	</ul>
</div>
```

![image-20221209191539886](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221209191540.png)

> 需要调整文字

![image-20221209191740913](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221209191741.png)

![image-20221209191756472](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221209191756.png)

> type 和 active 相同, 则高亮

![image-20221209191205914](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221209191206.png)

> 高亮是通过 className 来控制的

![image-20221209191358666](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221209191358.png)

> 所以我们可以进行如下修改

```jsx
<li key={item.id} className={item.type === state.active ? "on" : ""}>
```

![image-20221209191952424](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221209191952.png)

> 如果把 active 改成 time, 就是`按时间排序`高亮

![image-20221209192036877](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221209192037.png)

## react 组件

> 把一个大的页面, 拆分成一个一个功能独立, 并且之间可以互相通信的组件

![](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202204041936632.png)

## 函数组件

> 使用命令创建项目

```bash
npx create-react-app react-basic
```

> 保留`src\index.js`, 其他 src 中的文件删除

```jsx
// src\index.js
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<div>hello world</div>);
```

> 查看效果, 如果能看到 hello world, 说明正常运行

![image-20221210151113480](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221210151113.png)

> 使用 JS 的函数（或箭头函数）创建的组件，就叫做`函数组件`

```jsx
// src\index.js
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));
// 函数组件
function HelloFun() {
	return <h1>hello world</h1>;
}
root.render(
	<div>
		{/* 单标签 */}
		<HelloFun />
		{/* 多标签 */}
		<HelloFun></HelloFun>
	</div>
);
```

![image-20221210151322327](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221210151322.png)

> 1. 组件的名称必须首字母大写(大驼峰的写法)，react 内部会根据这个来判断是组件还是普通的 HTML 标签
> 2. 函数组件必须有返回值，表示该组件的 UI 结构；
> 3. 如果不需要渲染任何内容，则返回 null
> 4. 组件就像 HTML 标签一样可以被渲染到页面中。
> 5. 组件表示的是一段结构内容，对于函数组件来说，渲染的内容是函数的返回值
> 6. 使用函数名称作为组件标签名称，可以是双标签也可以是单标签

## 类组件

> 使用 ES6 的 class 创建的组件，叫做类（class）组件

```jsx
// src\index.js
// 引入React
import React from "react";
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));

// 定义类组件
class HelloClassComponent extends React.Component {
	render() {
		return <div>这是我的第一个类组件!</div>;
	}
}
root.render(
	<div>
		{/* 渲染类组件 */}
		{/* 单标签 */}
		<HelloClassComponent />
		{/* 双标签 */}
		<HelloClassComponent></HelloClassComponent>
	</div>
);
```

![image-20221210151513102](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221210151513.png)

> 1. 类名称也必须以大写字母开头, 大驼峰写法
> 2. 类组件应该继承 `React.Component` 父类，从而使用父类中提供的方法或属性
> 3. 类组件必须提供 `render` 方法
> 4. `render` 方法必须有返回值，表示该组件的 UI 结构

## 事件绑定

> 语法结构
>
> `on + 事件名称 = { 事件处理程序 }`

```jsx
<div onClick={() => {}}></div>
```

> react 事件采用驼峰命名法，比如：onMouseEnter、onFocus
>
> 在函数组件中, 可以这样使用

```jsx
// src\index.js
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));
// 函数组件
function HelloFun() {
	// 定义事件回调函数
	const clickHandler = () => {
		alert("事件被触发了");
	};
	return (
		// 绑定事件
		<button onClick={clickHandler}>click me!</button>
	);
}
root.render(
	<div>
		{/* 单标签 */}
		<HelloFun />
		{/* 多标签 */}
		<HelloFun></HelloFun>
	</div>
);
```

> 在类组件中, 可以这样使用

```jsx
// src\index.js
// 引入React
import React from "react";
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));

// 定义类组件
class HelloClassComponent extends React.Component {
	// 定义事件回调函数
	clickHandler = () => {
		alert("事件被触发了");
	};
	render() {
		return (
			// 绑定事件
			<button onClick={this.clickHandler}>类组件 click me!</button>
		);
	}
}
root.render(
	<div>
		{/* 渲染类组件 */}
		{/* 单标签 */}
		<HelloClassComponent />
		{/* 双标签 */}
		<HelloClassComponent></HelloClassComponent>
	</div>
);
```

> 注意: 这种写法一样可以触发

```jsx
	// 定义事件回调函数
	clickHandler() {
		alert("事件被触发了");
	}
```

> 但是需要注意的是, 如果牵涉到 this, 以下两种写法不同

```jsx
	clickHandler() {
		console.log(this); // undefined
	}
```

```jsx
clickHandler = () => {
	console.log(this); // HelloClassComponent
};
```

> 推荐第二种写法, 也就是 class Fields 写法, 是为了保证 this 的指向正确, 永远指向当前的组件实例

## 获取事件对象

> 通过事件处理程序的参数获取事件对象 e

```jsx
// src\index.js
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));
// 函数组件
function HelloFun() {
	// 定义事件处理函数
	const clickHandler = (e) => {
		// 阻止默认事件, 不让a标签跳转
		e.preventDefault();
		alert("点击事件已经被触发了...");
	};
	// 绑定点击事件
	return (
		<a onClick={clickHandler} href="https://www.baidu.com">
			baidu
		</a>
	);
}
root.render(
	<div>
		{/* 单标签 */}
		<HelloFun />
	</div>
);
```

## 传递额外参数

> 别的参数, 应该怎么获取呢?
>
> 分两种情况
>
> 1. 只有自定义参数
> 2. 既有 e, 又有自定义参数
>
> 先说第一种, 正常函数传参, 把原本的函数, 变成箭头函数调用的形式
>
> `{clickHandler}` ==> `{()=>{clickHandler(a,b,c)}}`
>
> 原来的代码如下

```jsx
// src\index.js
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));
// 函数组件
function HelloFun() {
	// 定义事件回调函数
	const clickHandler = () => {
		alert("事件被触发了");
	};
	return (
		// 绑定事件
		<button onClick={clickHandler}>click me!</button>
	);
}
root.render(
	<div>
		{/* 单标签 */}
		<HelloFun />
	</div>
);
```

> 修改之后的代码

```jsx
// src\index.js
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));
// 函数组件
function HelloFun() {
	// 定义事件回调函数
	const clickHandler = (a, b) => {
		alert("事件被触发了");
		alert(a);
		alert(b);
	};
	return (
		// 绑定事件
		<button
			onClick={() => {
				clickHandler("hello", "world");
			}}
		>
			click me!
		</button>
	);
}
root.render(
	<div>
		{/* 单标签 */}
		<HelloFun />
	</div>
);
```

> 第二种情况, 既有 e, 又有自定义参数, 把 e 作为第一个参数传即可, 注意需要在形参中指定

```jsx
// src\index.js
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));
// 函数组件
function HelloFun() {
	// 定义事件回调函数
	const clickHandler = (e, a, b) => {
		console.log(e);
		alert("事件被触发了");
		alert(a);
		alert(b);
	};
	return (
		// 绑定事件
		<button
			onClick={(e) => {
				clickHandler(e, "hello", "world");
			}}
		>
			click me!
		</button>
	);
}
root.render(
	<div>
		{/* 单标签 */}
		<HelloFun />
	</div>
);
```

## 类组件的事件绑定

> 类组件中的事件绑定
>
> 整体的套路都是一致的
>
> 和函数组件没有太多不同

> 原来的事件相关的代码

```jsx
// src\index.js
// 引入React
import React from "react";
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));

// 定义类组件
class HelloClassComponent extends React.Component {
	// 定义事件回调函数
	clickHandler = () => {
		alert("事件被触发了");
	};
	render() {
		return (
			// 绑定事件
			<button onClick={this.clickHandler}>类组件 click me!</button>
		);
	}
}
root.render(
	<div>
		{/* 单标签 */}
		<HelloClassComponent />
	</div>
);
```

> 传递自定义参数的情况

```jsx
// src\index.js
// 引入React
import React from "react";
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));

// 定义类组件
class HelloClassComponent extends React.Component {
	// 定义事件回调函数
	clickHandler = (a, b) => {
		alert("事件被触发了");
		alert(a);
		alert(b);
	};
	render() {
		return (
			// 绑定事件
			<button
				onClick={() => {
					this.clickHandler("hello", "world");
				}}
			>
				类组件 click me!
			</button>
		);
	}
}
root.render(
	<div>
		{/* 单标签 */}
		<HelloClassComponent />
	</div>
);
```

> 事件对象和自定义参数一起传递

```jsx
// src\index.js
// 引入React
import React from "react";
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));

// 定义类组件
class HelloClassComponent extends React.Component {
	// 定义事件回调函数
	clickHandler = (e, a, b) => {
		console.log(e);
		console.log(a, b);
	};
	render() {
		return (
			// 绑定事件
			<button
				onClick={(e) => {
					this.clickHandler(e, "hello", "world");
				}}
			>
				类组件 click me!
			</button>
		);
	}
}
root.render(
	<div>
		{/* 单标签 */}
		<HelloClassComponent />
	</div>
);
```

## 组件状态

> 一个前提：在 react hook 出来之前，函数式组件是没有自己的状态的，所以我们的例子, 统一通过类组件来讲解
>
> 步骤：初始化状态 -> 读取状态 -> 修改状态 -> 影响视图

## 初始化状态

> 1. 通过 class 的实例属性 state 来初始化
> 2. state 的值是一个对象结构，表示一个组件可以有多个数据状态

```jsx
state = {
	count: 0,
};
```

> 完整代码如下:

```jsx
// src\index.js
// 引入React
import React from "react";
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));

// 定义类组件
class Counter extends React.Component {
	// 定义状态
	state = {
		count: 0,
	};
	render() {
		return <button>计数器</button>;
	}
}
root.render(
	<div>
		<Counter></Counter>
	</div>
);
```

## 读取状态

> 通过 this.state 来获取状态

```jsx
// src\index.js
// 引入React
import React from "react";
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));

// 定义类组件
class Counter extends React.Component {
	// 定义状态
	state = {
		count: 0,
	};
	render() {
		return (
			<>
				<button>计数器</button>
				<p>当前计数: {this.state.count}</p>
			</>
		);
	}
}
root.render(
	<div>
		<Counter></Counter>
	</div>
);
```

![image-20221210163406997](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221210163407.png)

## 修改状态

> 语法结构, 需要使用`setState`

```javascript
this.setState({ 要修改的部分数据 });
```

```jsx
// src\index.js
// 引入React
import React from "react";
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));

// 定义类组件
class Counter extends React.Component {
	// 定义状态
	state = {
		count: 0,
	};
	changeCount = () => {
		this.setState({
			count: this.state.count + 1,
		});
	};
	render() {
		return (
			<>
				<button onClick={this.changeCount}>计数器</button>
				<p>当前计数: {this.state.count}</p>
			</>
		);
	}
}
root.render(
	<div>
		<Counter></Counter>
	</div>
);
```

![image-20221210163613358](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221210163613.png)

> setState 方法作用
>
> 1. 修改 state 中的数据状态
> 2. 更新 UI

> 思想: 数据驱动视图，也就是只要修改数据状态，那么页面就会自动刷新，无需手动操作 dom
>
> 注意事项: 不要直接修改 state 中的值，必须通过 setState 方法进行修改

## React 的状态不可变

> 不要直接修改状态的值，而是基于当前状态创建新的状态值, 就是 readonly
>
> 初始代码如下

```jsx
// src\index.js
// 引入React
import React from "react";
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));

// 定义类组件
class Counter extends React.Component {
	// 定义状态
	state = {
		count: 0,
	};
	changeCount = () => {
		this.setState({
			count: this.state.count + 1,
		});
	};
	render() {
		return (
			<>
				<button onClick={this.changeCount}>计数器</button>
				<p>当前计数: {this.state.count}</p>
			</>
		);
	}
}
root.render(
	<div>
		<Counter></Counter>
	</div>
);
```

> 如果改成++, 就没有办法更改了

```jsx
changeCount = () => {
	this.setState({
		count: this.state.count++,
	});
};
```

![image-20221210171338545](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221210171338.png)

> 对象, 数组同理, 直接修改都是错误的写法

```javascript
state = {
	count: 0,
	list: [1, 2, 3],
	person: {
		name: "jack",
		age: 18,
	},
};
// 直接修改简单类型Number
this.state.count++;
++this.state.count;
this.state.count += 1;
this.state.count = 1;

// 直接修改数组
this.state.list.push(123);
this.state.list.spice(1, 1);

// 直接修改对象
this.state.person.name = "rose";
```

> 正确写法: 基于当前状态创建新值

```javascript
this.setState({
    count: this.state.count + 1
    list: [...this.state.list, 4],
    person: {
       ...this.state.person,
       // 覆盖原来的属性 就可以达到修改对象中属性的目的
       name: 'rose'
    }
})
```

> 代码示例

```jsx
// 类组件
class HelloClassComponent extends React.Component {
	state = {
		list: [1, 2, 3],
	};
	changeState = () => {
		this.setState({
			list: this.state.list.push(4), // ×
			// list: [...this.state.list, 4], // √
		});
	};
	render() {
		return (
			<>
				<button onClick={this.changeState}>click me</button>
				<p>当前state: {JSON.stringify(this.state.list)}</p>
			</>
		);
	}
}
```

```jsx
// 类组件
class HelloClassComponent extends React.Component {
	state = {
		person: {
			name: "jack",
			age: 18,
		},
	};
	changeState = () => {
		// 正确写法
		this.setState({
			person: { ...this.state.person, age: 19 },
		});
	};
	render() {
		return (
			<>
				<button onClick={this.changeState}>click me</button>
				<p>当前state: {JSON.stringify(this.state.person)}</p>
			</>
		);
	}
}
```

## 表单处理

![image-20221211115330101](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221211115330.png)

## 受控表单组件

> 使用 React 处理表单元素，一般使用受控组件的方式获取文本框的值
>
> 所谓受控组件: input 框自己的 value 被 React 组件状态控制
>
> React 组件的状态的地方是在 state 中，input 表单元素也有自己的状态是在 value 中，React 将 state 与表单元素的值（value）绑定到一起，由 state 的值来控制表单元素的值，从而保证单一数据源特性

> 以获取文本框的值为例，受控组件的使用步骤如下：
>
> 1. 在组件的 state 中声明一个组件的状态数据
> 2. 将 input 标签元素的 value 属性的值设置为状态数据
> 3. 为 input 添加 change 事件
> 4. 在事件处理程序中，通过事件对象 e 获取到当前文本框的值（`即用户当前输入的值`）
> 5. 调用 setState 方法，将文本框的值作为 state 状态的最新值

> 1. 在组件的 state 中声明一个组件的状态数据
> 2. 将 input 标签元素的 value 属性的值设置为状态数据

```jsx
// src\index.js
// 引入React
import React from "react";
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));
// 定义类组件
class InputComponent extends React.Component {
	// 1. 在组件的state中声明一个组件的状态数据,
	state = {
		message: "this is message",
	};
	render() {
		// 2. 将input标签元素的value属性的值设置为状态数据
		return <input type="text" value={this.state.message} />;
	}
}
root.render(
	<div>
		<InputComponent />
	</div>
);
```

![](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202204052041449.png)

> 3. 为 input 添加并定义 change 事件

```jsx
// 定义类组件
class InputComponent extends React.Component {
	// 1. 在组件的state中声明一个组件的状态数据,
	state = {
		message: "this is message",
	};
	// 3.2 定义inputChange方法
	inputChange = () => {
		console.log("input value is change...");
	};
	render() {
		// 2. 将input标签元素的value属性的值设置为状态数据
		// 3.1 为input添加change事件
		return <input type="text" onChange={this.inputChange} value={this.state.message} />;
	}
}
```

> 4. 在事件处理程序中，通过事件对象 e 获取到当前文本框的值（`即用户当前输入的值`）

```jsx
inputChange = (e) => {
	// 4. 在事件处理程序中，通过事件对象e获取到当前文本框的值（`即用户当前输入的值`）
	const value = e.target.value;
	console.log(value);
};
```

> 5. 调用 setState 方法，将文本框的值作为 state 状态的最新值

```jsx
inputChange = (e) => {
	// 4. 在事件处理程序中，通过事件对象e获取到当前文本框的值（`即用户当前输入的值`）
	const value = e.target.value;
	// 5. 调用setState方法，将文本框的值作为state状态的最新值
	this.setState({
		message: value,
	});
};
```

## 非受控表单组件

> 什么是非受控组件？
>
> 非受控组件就是通过手动操作 dom 的方式获取文本框的值，文本框的状态不受 react 组件的 state 中的状态控制，直接通过原生 dom 获取输入框的值

> 实现步骤
>
> 1. 导入 createRef 函数
> 2. 调用 createRef 函数，创建一个 ref 对象，存储到名为 msgRef 的实例属性中
> 3. 为 input 添加 ref 属性，值为 msgRef
> 4. 在按钮的事件处理程序中，通过 msgRef.current 即可拿到 input 对应的 dom 元素，而其中 msgRef.current.value 拿到的就是文本框的值

> 1. 导入 createRef 函数

```jsx
// 1. 导入createRef 函数
import React, { createRef } from "react";
```

> 2. 调用 createRef 函数，创建一个 ref 对象，存储到名为 msgRef 的实例属性中

```jsx
class InputComponent extends React.Component {
	// 2. 调用createRef函数，创建一个ref对象，存储到名为msgRef的实例属性中
	msgRef = createRef();
}
```

> 3. 为 input 添加 ref 属性，值为 msgRef

```jsx
// 定义类组件
class InputComponent extends React.Component {
	// 2. 调用createRef函数，创建一个ref对象，存储到名为msgRef的实例属性中
	msgRef = createRef();
	render() {
		return (
			<>
				{/* 3. 为input添加ref属性，值为msgRef */}
				<input ref={this.msgRef} />
			</>
		);
	}
}
```

> 4. 创建按钮的点击事件, 在按钮的事件处理程序中，通过 msgRef.current 即可拿到 input 对应的 dom 元素，而其中 msgRef.current.value 拿到的就是文本框的值

```jsx
// src\index.js
// 引入React
// 1. 导入createRef 函数
import { render } from "@testing-library/react";
import React, { createRef } from "react";
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));
// 定义类组件
class InputComponent extends React.Component {
	// 2. 调用createRef函数，创建一个ref对象，存储到名为msgRef的实例属性中
	msgRef = createRef();
	// 4.2. 在按钮的事件处理程序中，通过msgRef.current即可拿到input对应的dom元素，而其中msgRef.current.value拿到的就是文本框的值
	changeHandler = () => {
		console.log(this.msgRef.current.value);
	};
	render() {
		return (
			<>
				{/* 3. 为input添加ref属性，值为msgRef */}
				<input ref={this.msgRef} />
				{/* 4.1 添加点击按钮 */}
				<button onClick={this.changeHandler}>click</button>
			</>
		);
	}
}
root.render(
	<div>
		<InputComponent />
	</div>
);
```

![image-20221211122409121](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221211122409.png)

## 组件基础小练习

> 初始代码: https://pan.baidu.com/s/14yisnG7AQHVDGszIzXbqjA?pwd=6666
>
> 任务:
>
> 1. 完成 tab 点击切换激活状态交互
> 2. 完成发表评论功能

> 首先使用命令安装依赖包

```bash
npm i
```

> 因为需要用到状态管理, 需要使用类组件, 所以需要进行改写

![image-20221212160251092](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212121602173.png)

> 运行如下命令进行测试

```bash
npm run start
```

> 如果报错, 检查是否忘记了 this, 因为现在是类组件

![image-20221212161145639](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212121611697.png)

![image-20221214221253651](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212142212830.png)

> 之前的判断, type 和 active 一致, 就激活, 就可以高亮显示

![image-20221213142346294](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221213142346.png)

> 给点击绑定事件

![image-20221213142436761](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221213142436.png)

> 定义 switchTab

![image-20221212160401139](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212121604207.png)

```js
switchTab = (type) => {
	// 点击之后, 把type给state的active
	this.setState({
		active: type,
	});
};
```

> 最终效果

![](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212121610721.gif)

> 接下来是发表评论功能, 牵涉到受控组件的知识
>
> 首先在 state 添加 comment

<img src="https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212121625633.png" alt="image-20221212162541557"  />

> 绑定到 textarea

![image-20221212162653197](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212121626271.png)

> 绑定 onChange 事件

<img src="https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212121628284.png" alt="image-20221212162828224"  />

> 编写 textareaChange 函数

```jsx
textareaChange = (e) => {
	this.setState({
		comment: e.target.value,
	});
};
```

<img src="https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212121640123.png" alt="image-20221212164023066" />

> 点击发表评论, 把相关的信息, 添加到评论列表中去
>
> 给发表评论添加点击事件

![image-20221212164235404](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212121642454.png)

> 编写 submitComment 方法的代码

<img src="https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212121646248.png" alt="image-20221212164659183" />

```jsx
submitComment = () => {
	this.setState({
		list: [
			...this.state.list,
			{
				id: 1,
				author: "刘德华",
				comment: this.state.comment, // 之前存起来的comment
				time: new Date().getTime(), // 当前时间戳
				// 1: 点赞 0：无态度 -1:踩
				attitude: 0,
			},
		],
	});
};
```

> 注意 id, id 应该是一个独一无二的值
>
> 生成独立无二的 id, 可以使用 uuid 包

```bash
npm i uuid
```

> 首先导入

```js
import { v4 as uuid } from "uuid";
```

> 返回独一无二的 id

![image-20221213144733677](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221213144733.png)

> 返回的 id 类似于这样

```
a3dd49f0-b463-477f-8bd9-88284fd0242b
```

> 测试效果

![](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221213145039.gif)

> 写完之后, 应该清空 textarea

<img src="https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212121702567.png" alt="image-20221212170223495" />

![](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221213145317.gif)

> 接下来是删除评论

<img src="https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212121704220.png" alt="image-20221212170446101" />

> 添加 onclick 事件

![image-20221212184257199](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212121842271.png)

> 定义 deleteComment 函数

```jsx
deleteComment = (commentId) => {
	this.setState({
		list: this.state.list.filter((item) => item.id !== commentId),
	});
};
```

![](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221213150354.gif)

> 点赞功能, 点击可以切换状态

<img src="https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212121849098.png" alt="image-20221212184916000"  />

> 不管点赞还是点踩, 都是通过 attitude 来判断的, 所以只需要改 attitude 的值即可

<img src="https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212121850169.png" alt="image-20221212185051121"  />

<img src="https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212121851803.png" alt="image-20221212185126734" />

> 添加点击事件

![image-20221212191532521](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212121915622.png)

> 定义回调函数

```jsx
// 切换点赞
switchLike = (currentItem) => {
	if (currentItem.attitude === 1) {
		this.changeItemAttitude(currentItem.id, 0);
	} else {
		this.changeItemAttitude(currentItem.id, 1);
	}
};
```

```jsx
// 切换点踩
switchHate = (currentItem) => {
	if (currentItem.attitude === -1) {
		this.changeItemAttitude(currentItem.id, 0);
	} else {
		this.changeItemAttitude(currentItem.id, -1);
	}
};
```

```jsx
// 修改tiem
changeItemAttitude = (itemId, attitudeValue) => {
	this.setState({
		list: this.state.list.map((item) => {
			if (item.id === itemId) {
				return {
					...item,
					attitude: attitudeValue,
				};
			} else {
				return item;
			}
		}),
	});
};
```

> 最终结果

![](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212121922930.gif)

> 最终代码链接：https://pan.baidu.com/s/1JBd6JgUB09iSSinVvoozyQ?pwd=6666

## React 组件通信

> 组件是独立且封闭的单元，默认情况下组件只能使用自己的数据（state）
>
> 组件化开发的过程中，完整的功能会拆分多个组件，在这个过程中不可避免的需要互相传递一些数据
>
> 为了能让各组件之间可以进行互相沟通，数据传递，这个过程就是组件通信

## 父传子

> 1. 父组件提供要传递的数据 - `state`
> 2. 给子组件标签`添加属性`值为 state 中的数据
> 3. 子组件中通过 `props` 接收父组件中传过来的数据
> 4. 类组件使用 this.props 获取 props 对象
> 5. 函数式组件直接通过形参获取 props 对象

![](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202204041936288.png)

## 父传子 类组件

> 先创建基础代码

```jsx
// src\index.js
import React from "react";
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));
// 类子组件
class SonCls extends React.Component {
	render() {
		return <div>我是类子组件</div>;
	}
}
// Parent 父组件 Son 子组件
class Parent extends React.Component {
	render() {
		return (
			<div>
				<SonCls />
			</div>
		);
	}
}
root.render(
	<>
		<Parent />
	</>
);
```

> 此时的效果

![image-20221212234358280](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221212234358.png)

> 1. 父组件提供要传递的数据 - `state`

![image-20221212233724528](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221212233724.png)

> 2. 给子组件标签`添加属性`值为 state 中的数据

```jsx
<SonCls msg={this.state.message} />
```

> 3. 子组件中通过 `props` 接收父组件中传过来的数据
> 4. 类组件使用 this.props 获取 props 对象

```jsx
// 类子组件
class SonCls extends React.Component {
	render() {
		return <div>我是类子组件, {this.props.msg}</div>;
	}
}
```

![image-20221212234500981](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221212234501.png)

## 父传子 函数式组件

> 先创建基础代码

```jsx
// src\index.js
import React from "react";
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));
// 函数式子组件
function SonFun() {
	return <div>我是函数子组件</div>;
}
// Parent 父组件 Son 子组件
class Parent extends React.Component {
	render() {
		return (
			<div>
				<SonFun />
			</div>
		);
	}
}
root.render(
	<>
		<Parent />
	</>
);
```

> 此时的效果

![](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221212235932.png)

> 1. 父组件提供要传递的数据 - `state`

![image-20221213000049841](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221213000049.png)

> 2. 给子组件标签`添加属性`值为 state 中的数据

```jsx
<SonFun msg={this.state.message} />
```

> 3. 子组件中通过 `props` 接收父组件中传过来的数据
> 4. 函数式组件直接通过形参获取 props 对象

```jsx
// 函数式子组件
function SonFun(props) {
	return <div>我是函数子组件, {props.message}</div>;
}
```

![image-20221213000421263](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221213000421.png)

## props 说明

> props 是只读对象（readonly）, 根据单项数据流的要求，子组件只能读取 props 中的数据，不能进行修改, 以下写法错误

![](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202204061105713.png)

> props 可以传递任意数据, 数字、字符串、布尔值、数组、对象、函数、JSX

> 传递数组

```jsx
// src\index.js
import React from "react";
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));
// 函数式子组件
function SonFun(props) {
	return (
		<div>
			我是函数子组件
			<ul>
				{props.list.map((item, index) => {
					return <li key={index}>{item}</li>;
				})}
			</ul>
		</div>
	);
}
// 类子组件
class SonCls extends React.Component {
	render() {
		return (
			<div>
				我是类子组件
				<ul>
					{this.props.list.map((item, index) => {
						return <li key={index}>{item}</li>;
					})}
				</ul>
			</div>
		);
	}
}

// Parent 父组件 Son 子组件
class Parent extends React.Component {
	// 准备数据
	state = {
		list: [1, 2, 3, 4],
	};
	render() {
		return (
			<div>
				<SonFun list={this.state.list} />
				<SonCls list={this.state.list} />
			</div>
		);
	}
}
root.render(
	<>
		<Parent />
	</>
);
```

![image-20221213001114713](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221213001114.png)

> 传递对象

```jsx
// src\index.js
import React from "react";
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));
// 函数式子组件
function SonFun(props) {
	return <div>我是函数子组件 ,我叫{props.userinfo.username}</div>;
}
// 类子组件
class SonCls extends React.Component {
	render() {
		return <div>我是类子组件,我叫{this.props.userinfo.username}</div>;
	}
}
// Parent 父组件 Son 子组件
class Parent extends React.Component {
	// 准备数据
	state = {
		userinfo: {
			username: "lisi",
			age: 18,
		},
	};
	render() {
		return (
			<div>
				<SonFun userinfo={this.state.userinfo} />
				<SonCls userinfo={this.state.userinfo} />
			</div>
		);
	}
}
root.render(
	<>
		<Parent />
	</>
);
```

![image-20221213001219544](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221213001219.png)

> 传递函数

```jsx
// src\index.js
import React from "react";
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));
// 函数式子组件
function SonFun(props) {
	return (
		<>
			<div>这是子组件SonFun</div>
			<button onClick={props.getMsg}>点击</button>
		</>
	);
}
// 类子组件
class SonCls extends React.Component {
	render() {
		return (
			<>
				<div>这是子组件SonFun</div>
				<button onClick={this.props.getMsg}>点击</button>
			</>
		);
	}
}
// Parent 父组件 Son 子组件
class Parent extends React.Component {
	getMsg = () => {
		console.log("父组件函数");
	};
	render() {
		return (
			<div>
				<SonFun getMsg={this.getMsg} />
				<SonCls getMsg={this.getMsg} />
			</div>
		);
	}
}
root.render(
	<>
		<Parent />
	</>
);
```

![image-20221213001331825](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221213001331.png)

> 传递 jsx

```jsx
// src\index.js
import React from "react";
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));
// 函数式子组件
function SonFun(props) {
	return (
		<>
			<div>这是子组件SonFun</div>
			{props.child}
		</>
	);
}
// 类子组件
class SonCls extends React.Component {
	render() {
		return (
			<>
				<div>这是子组件SonFun</div>
				{this.props.child}
			</>
		);
	}
}
// Parent 父组件 Son 子组件
class Parent extends React.Component {
	render() {
		return (
			<div>
				<SonFun child={<div>this is div</div>} />
				<SonCls child={<div>this is div</div>} />
			</div>
		);
	}
}
root.render(
	<>
		<Parent />
	</>
);
```

![image-20221213001436760](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221213001436.png)

## 子传父

> 父组件给子组件传递回调函数，子组件调用

> 1. 父组件提供一个回调函数 - 用于接收数据
> 2. 将函数作为属性的值，传给子组件
> 3. 子组件通过 props 调用回调函数
> 4. 将子组件中的数据作为参数传递给回调函数

![](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202204041936298.png)

> 初始代码

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));

// 函数子组件
function SonFun() {
	return <div>this is son</div>;
}
// 父组件
class Parent extends React.Component {
	render() {
		return (
			<>
				<SonFun />
			</>
		);
	}
}

root.render(
	<>
		<Parent />
	</>
);
```

![image-20221213234625721](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221213234625.png)

> 1. 父组件提供一个回调函数 - 用于接收数据
> 2. 将函数作为属性的值，传给子组件

```jsx
// 父组件
class Parent extends React.Component {
	// 1. 父组件提供一个回调函数 - 用于接收数据
	getSonMsg = (sonMsg) => {
		console.log(sonMsg);
	};
	render() {
		return (
			<>
				{/* 2. 将函数作为属性的值，传给子组件 */}
				<SonFun getMsg={this.getSonMsg} />
			</>
		);
	}
}
```

> 3. 子组件通过 props 调用回调函数

```jsx
// 函数子组件
function SonFun(props) {
	// 3. 子组件通过 props 调用回调函数
	const { getMsg } = props;
	return <div>this is son</div>;
}
```

> 4. 将子组件中的数据作为参数传递给回调函数

```jsx
// 函数子组件
function SonFun(props) {
	// 3. 子组件通过 props 调用回调函数
	const { getMsg } = props;
	// 4. 将子组件中的数据作为参数传递给回调函数
	return (
		<>
			<div>this is son </div>
			<button onClick={() => getMsg("这是子组件的数据")}>点击传递数据给父组件</button>
		</>
	);
}
```

## 兄弟组件通信

> 利用共同的父组件实现兄弟通信

![](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202204041936307.png)

> 初始代码如下

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));
// 函数式子组件
function SonA(props) {
	return <div>this is SonA</div>;
}
function SonB(props) {
	return <div>this is SonB</div>;
}
// Parent 父组件 Son 子组件
class Parent extends React.Component {
	render() {
		return (
			<div>
				<SonA />
				<SonB />
			</div>
		);
	}
}
root.render(
	<>
		<Parent />
	</>
);
```

![image-20221214144523689](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221214144523.png)

> 我们的目标: 把 B 组件中的数据传给 A 组件
>
> 先把 B 中的数据子传父, 传到父级

```jsx
// Parent 父组件 Son 子组件
class Parent extends React.Component {
	getBMsg = (msg) => {
		console.log(msg);
	};
	render() {
		return (
			<div>
				<SonA />
				<SonB getBMsg={this.getBMsg} />
			</div>
		);
	}
}
```

```jsx
function SonB(props) {
	const { getBMsg } = props;
	return (
		<div>
			this is SonB
			<button onClick={() => getBMsg("这是B组件的数据")}>点击传值</button>
		</div>
	);
}
```

> 现在完成了子传父

![image-20221216213922279](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212162139410.png)

> 编写父传子, Parent ==> SonA

```jsx
// Parent 父组件 Son 子组件
class Parent extends React.Component {
	getBMsg = (msg) => {
		console.log(msg);
	};
	state = {
		sendAMsg: "测试一下父传子, 初始值...",
	};
	render() {
		return (
			<div>
				<SonA sendAMsg={this.state.sendAMsg} />
				<SonB getBMsg={this.getBMsg} />
			</div>
		);
	}
}
```

```jsx
// 函数式子组件
function SonA(props) {
	return <div>this is SonA {props.sendAMsg}</div>;
}
```

![image-20221214145538770](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221214145538.png)

> 现在父传子也没问题了

![image-20221216214141456](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212162141560.png)

> 把 SonB 的数据, 通过父组件, 传给 SonA

```jsx
getBMsg = (msg) => {
	this.setState({
		sendAMsg: msg,
	});
};
```

<img src="https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221214145622.png" alt="image-20221214145622864" />

![image-20221214145642358](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221214145642.png)

## 跨组件通信 Context

![](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202204081614429.png)

> 上图是一个 react 形成的嵌套组件树，如果我们想从 App 组件向任意一个下层组件传递数据，该怎么办呢？目前我们能采取的方式就是一层一层的 props 往下传，显然很繁琐
>
> 那么，Context 提供了一个无需为每层组件手动添加 props，就能在组件树间进行数据传递的方法

> 创建 Context 对象 导出 Provider(提供者) 和 Consumer(消费者) 对象

```javascript
const { Provider, Consumer } = createContext();
```

> 使用 Provider 包裹根组件提供数据

```jsx
<Provider value={this.state.message}>{/* 根组件 */}</Provider>
```

> 需要用到数据的组件使用 Consumer 包裹获取数据

```jsx
<Consumer >
    {value => /* 基于 context 值进行渲染*/}
</Consumer>
```

> 初始代码如下
>
> 父组件包含 A 组件, A 组件包含 C 组件
>
> 将来数据从父组件跨过 A 组件, 直接传递给 C 组件

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));
function ComponentC() {
	return <div>this is ComponentC</div>;
}
function ComponentA() {
	return (
		<div>
			this is ComponentA
			<ComponentC />
		</div>
	);
}
class Parent extends React.Component {
	render() {
		return (
			<div>
				this is Parent
				<ComponentA />
			</div>
		);
	}
}
root.render(
	<>
		<Parent />
	</>
);
```

![image-20221214160548484](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221214160548.png)

> 1. 获取 Provider, Consumer
> 2. 如果没有导入, 记得导入 createContext

```jsx
// 2. 如果没有导入, 记得导入createContext
import React, { createContext } from "react";
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));
// 1. 获取Provider, Consumer
const { Provider, Consumer } = createContext();
```

> 3. 定义需要传递的数据

![image-20221214164534628](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221214164534.png)

> 4. 使用 Provider 包裹根组件, 提供数据

![image-20221214164622075](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221214164622.png)

```jsx
class Parent extends React.Component {
	// 3. 定义需要传递的数据
	state = {
		message: "这是根组件Parent要传递的数据...",
	};
	render() {
		return (
			<Provider value={this.state.message}>
				<div>
					this is Parent
					<ComponentA />
				</div>
			</Provider>
		);
	}
}
```

> 5. 需要用到数据的组件使用 Consumer 包裹获取数据

```jsx
function ComponentC() {
	return (
		<div>
			this is ComponentC,
			<Consumer>
				{/* 使用函数获取数据, 参数value是传过来的数据 */}
				{(value) => <b>{value}</b>}
			</Consumer>
		</div>
	);
}
```

![image-20221214164841060](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221214164841.png)

## 组件小练习

> App 为父组件, 用来提供列表数据 ，ListItem 为子组件, 用来渲染列表数据, 有删除功能

![image-20221214165734383](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221214165734.png)

> 列表数据如下

```jsx
[
	{ id: 1, name: "超级好吃的棒棒糖", price: 18.8, info: "开业大酬宾，全场8折" },
	{ id: 2, name: "超级好吃的大鸡腿", price: 34.2, info: "开业大酬宾，全场8折" },
	{ id: 3, name: "超级无敌的冰激凌", price: 14.2, info: "开业大酬宾，全场8折" },
];
```

> 需要实现的效果
>
> 1. 子组件从父组件中获取数据, 并渲染
> 2. 点击子组件的按钮, 可以删除数据

![](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221214171614.gif)

> 初始代码如下

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));
// 子组件
function ListItem(props) {
	return <div>this is ListItem</div>;
}
// 父组件
class App extends React.Component {
	render() {
		return (
			<>
				<ListItem />
			</>
		);
	}
}
root.render(
	<>
		<App />
	</>
);
```

![image-20221214170152759](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221214170152.png)

> 给父组件添加数据

![image-20221214170438847](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221214170438.png)

```jsx
// 父组件
class App extends React.Component {
	state = {
		list: [
			{ id: 1, name: "超级好吃的棒棒糖", price: 18.8, info: "开业大酬宾，全场8折" },
			{ id: 2, name: "超级好吃的大鸡腿", price: 34.2, info: "开业大酬宾，全场8折" },
			{ id: 3, name: "超级无敌的冰激凌", price: 14.2, info: "开业大酬宾，全场8折" },
		],
	};
	render() {
		return (
			<>
				<ListItem />
			</>
		);
	}
}
```

> 遍历数据

![image-20221214170613173](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221214170613.png)

```jsx
	render() {
		return (
			<>
				{this.state.list.map((item) => (
					<ListItem key={item.id} {...item} />
				))}
			</>
		);
	}
```

> 子组件接收数据

```jsx
function ListItem(props) {
	const { name, price, info } = props;
	return (
		<div>
			<h3>{name}</h3>
			<p>{price}</p>
			<p>{info}</p>
		</div>
	);
}
```

![image-20221216215734247](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212162157383.png)

> 因为有删除操作, 所以需要添加删除按钮

![image-20221216215812976](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212162158074.png)

![image-20221216215832882](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212162158991.png)

> 删除操作, 牵涉到子传父, 按钮在子组件中, 点击按钮删除父组件中的数据
>
> 在父组件中添加删除函数

![image-20221214171106022](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221214171106.png)

```jsx
delHandler = (id) => {
	this.setState({
		list: this.state.list.filter((item) => item.id !== id),
	});
};
```

> 把函数传递给子元素

![image-20221214171440857](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221214171440.png)

```jsx
<ListItem key={item.id} {...item} delHandler={this.delHandler} />
```

> 子组件中, 解构获取 id 和 delHandler

![image-20221216220135057](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212162201182.png)

> 子组件的按钮, 会调用该函数

![image-20221214171219384](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221214171219.png)

```jsx
<button onClick={() => delHandler(id)}>删除</button>
```

> 最终的效果

![](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221214171614.gif)

## children 属性

> children 属性表示该组件的子节点，只要组件内部有子节点，props 中就有该属性

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));

function ComponentA(props) {
	console.log(props.children);
	return <div>this is A</div>;
}

class Parent extends React.Component {
	render() {
		return (
			<ComponentA>
				<div>hello world</div>
			</ComponentA>
		);
	}
}

root.render(
	<>
		<Parent />
	</>
);
```

> children 可以是什么
>
> 1. 普通文本
> 2. 普通标签元素
> 3. 函数
> 4. JSX

> 1. 普通文本

```jsx
function ComponentA(props) {
	const { children } = props;
	return <div>this is A {children}</div>;
}

class Parent extends React.Component {
	render() {
		return <ComponentA>这是一段文本</ComponentA>;
	}
}
```

![image-20221214191604740](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221214191604.png)

> 2. 普通标签元素

```jsx
function ComponentA(props) {
	const { children } = props;
	return <div>this is A {children}</div>;
}

class Parent extends React.Component {
	render() {
		return (
			<ComponentA>
				<b>这是一个加粗标签</b>
			</ComponentA>
		);
	}
}
```

![image-20221214191638347](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221214191638.png)

> 温馨提醒, 如果是多个标签, children 是个数组, 需要遍历

![image-20221214192707671](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221214192707.png)

```jsx
function ComponentA(props) {
	const { children } = props;
	return <div>this is A{children.map((item) => item)}</div>;
}

class Parent extends React.Component {
	render() {
		return (
			<ComponentA>
				<b>这是一个加粗标签1</b>
				<b>这是一个加粗标签2</b>
				<b>这是一个加粗标签3</b>
			</ComponentA>
		);
	}
}
```

> 3. 函数

```jsx
function ComponentA(props) {
	const { children } = props;
	return <div>this is A {children()}</div>;
}

class Parent extends React.Component {
	render() {
		return <ComponentA>{() => "我是一个函数..."}</ComponentA>;
	}
}
```

![image-20221214191757065](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221214191757.png)

> 4. jsx

![image-20221214192052563](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221214192052.png)

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));

function ComponentA(props) {
	const { children } = props;
	return <div>this is A {children}</div>;
}

class Parent extends React.Component {
	render() {
		return (
			<ComponentA>
				{
					<div>
						<b>{"this is jsx"}</b>
					</div>
				}
			</ComponentA>
		);
	}
}

root.render(
	<>
		<Parent />
	</>
);
```

## props 校验-场景和使用

> 对于组件来说，props 是由外部传入的，我们其实无法保证组件使用者传入了什么格式的数据，如果传入的数据格式不对，就有可能会导致组件内部错误，有一个点很关键 - 组件的使用者可能报错了也不知道为什么，看下面的例子

![](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202204041936917.png)

> 面对这样的问题，如何解决？ props 校验

> 1. 安装属性校验包：`npm install prop-types`
> 2. 导入`prop-types` 包
> 3. 使用 `组件名.propTypes = {}` 给组件添加校验规则

> 初始代码如下:

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));

function Son() {
	return (
		<ul>
			<li>子组件</li>
		</ul>
	);
}

class Parent extends React.Component {
	render() {
		return (
			<div>
				<Son />
			</div>
		);
	}
}

root.render(
	<>
		<Parent />
	</>
);
```

![image-20221214194443369](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221214194443.png)

> 给子组件传递颜色

```jsx
class Parent extends React.Component {
	render() {
		return (
			<div>
				<Son colors={["red", "blue", "yellow"]} />
			</div>
		);
	}
}
```

> 子组件接收遍历

```jsx
function Son(props) {
	const colorArr = props.colors;
	const list = colorArr.map((item, index) => {
		return <li key={index}>{item}</li>;
	});
	return <ul>{list}</ul>;
}
```

![image-20221214194628866](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221214194628.png)

> 代码能成功运行的前提, 是父组件传递数组进来
>
> 我们需要校验父组件传过来的是不是一个数组

> 1. 安装属性校验包

```bash
npm install prop-types
```

> 2. 导入 prop-types 包

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
// 导入 prop-types包
import PropTypes from "prop-types";
const root = ReactDOM.createRoot(document.getElementById("root"));
```

> 3. 定义类型校验

```jsx
Son.propTypes = {
	colors: PropTypes.array,
};
```

> 这个时候, 如果写错, 就会报错

```jsx
return (
	<div>
		<Son colors={18} />
	</div>
);
```

![image-20221214202218559](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221214202218.png)

## props 校验-规则说明

> 四种常见结构
>
> 1. 常见类型：array、bool、func、number、object、string
> 2. 必填项：isRequired
> 3. 特定的结构对象：shape({})

```javascript
// 常见类型
optionalFunc: PropTypes.func,
// 必填 只需要在类型后面串联一个isRequired
requiredFunc: PropTypes.func.isRequired,
// 特定结构的对象
optionalObjectWithShape: PropTypes.shape({
	color: PropTypes.string,
	fontSize: PropTypes.number
})
```

> 官网文档更多阅读：
>
> https://zh-hans.reactjs.org/docs/typechecking-with-proptypes.html

> 做一个小例子, 验证一下必传`isRequired`
>
> 代码如下

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
// 导入 prop-types包
import PropTypes from "prop-types";
const root = ReactDOM.createRoot(document.getElementById("root"));
function Son(props) {
	const colorArr = props.colors;
	const list = colorArr.map((item, index) => {
		return <li key={index}>{item}</li>;
	});
	return <ul>{list}</ul>;
}

Son.propTypes = {
	// 必须是数组, 而且是必传
	colors: PropTypes.array.isRequired,
};
class Parent extends React.Component {
	render() {
		return (
			<div>
				{/* 没有传值 */}
				<Son />
			</div>
		);
	}
}
root.render(
	<>
		<Parent />
	</>
);
```

![image-20221215154922726](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212151549801.png)

## props 校验-默认值

> 通过 `defaultProps` 可以给组件的 props 设置默认值，在未传入 props 的时候生效
>
> 分两种情况, 函数组件和类组件写法不同
>
> 1. props 校验-默认值-函数组件
> 2. props 校验-默认值-类组件

## props 校验-默认值-函数组件

> 初始代码如下

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));
function Son() {
	return <h1>函数子组件</h1>;
}
class Parent extends React.Component {
	render() {
		return (
			<div>
				<Son />
			</div>
		);
	}
}
root.render(
	<>
		<Parent />
	</>
);
```

<img src="https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212151626120.png" alt="image-20221215162558187" />

> 1. 安装并导入 prop-types 包

```bash
npm install prop-types
```

```jsx
// 1. 导入 prop-types包
import PropTypes from "prop-types";
```

![image-20221215161425314](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212151614374.png)

> 2. 定义校验类型

```jsx
// 2. 定义类型校验
Son.propTypes = {
	colors: PropTypes.array,
};
```

![image-20221215161451631](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212151614696.png)

> 3. 定义默认值, 如果父组件不进行传值, 走默认

```jsx
// 3. 定义默认值, 如果父组件不进行传值, 走默认
Son.defaultProps = {
	colors: ["aaa", "bbb", "ccc", "ddd"],
};
```

![image-20221215160602024](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212151606097.png)

> 4. 父组件传值

```jsx
return (
	<div>
		<Son colors={["red", "yellow", "blue"]} />
	</div>
);
```

![image-20221215160706013](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212151607100.png)

> 5. 子组件接收值

```jsx
function Son(props) {
	const colorArr = props.colors;
	const list = colorArr.map((item, index) => {
		return <li key={index}>{item}</li>;
	});
	return <ul>{list}</ul>;
}
```

![image-20221215161225108](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212151612186.png)

> 这个时候的效果

![image-20221215161529813](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212151615859.png)

> 如果父组件不传值

![image-20221215161605241](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212151616302.png)

> 会走默认值

![image-20221215161628195](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212151616243.png)

> 还有更简单的方式, 直接给函数的参数一个默认值就可以了

```jsx
// 5. 子组件接收值
function Son({ colors = ["aaa", "bbb", "ccc", "ddd", "eee"] }) {
	const colorArr = colors;
	const list = colorArr.map((item, index) => {
		return <li key={index}>{item}</li>;
	});
	return <ul>{list}</ul>;
}
```

![image-20221215163019523](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212151630653.png)

![image-20221215163040246](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212151630342.png)

![image-20221215162800505](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212151628556.png)

## props 校验-默认值-类组件

> 类组件, 可以使用 `类.defaultProps`设置
>
> 初始代码如下

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));
class Son extends React.Component {
	render() {
		return <h1>这是子组件</h1>;
	}
}
class Parent extends React.Component {
	render() {
		return (
			<div>
				<Son />
			</div>
		);
	}
}
root.render(
	<>
		<Parent />
	</>
);
```

![image-20221215163453798](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212151634847.png)

> 1. 安装并导入 prop-types 包

```bash
npm install prop-types
```

```jsx
// 1. 导入 prop-types包
import PropTypes from "prop-types";
```

![image-20221215161425314](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212151614374.png)

> 2. 给默认值

```jsx
// 2. 给默认值
Son.defaultProps = {
	colors: ["aaa", "bbb", "ccc"],
};
```

![image-20221216222824571](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212162228711.png)

> 3. 子组件展示数据

```jsx
// 3. 子组件展示数据
class Son extends React.Component {
	render() {
		return (
			<ul>
				{this.props.colors.map((item, index) => {
					return <li key={index}>{item}</li>;
				})}
			</ul>
		);
	}
}
```

![image-20221215164249382](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212151642551.png)

![image-20221215164315683](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212151643740.png)

> 也可以使用类静态属性声明默认值，`static defaultProps = {}`

```jsx
	// 类静态属性声明默认值
	static defaultProps = {
		colors: ["11111", "22222", "33333"],
	};
```

![image-20221215164501387](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212151645474.png)

![image-20221215164538609](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212151645676.png)

## 生命周期

> 组件的生命周期是指组件从被创建到挂载到页面中运行起来，再到组件不用时卸载的过程，注意，只有类组件才有生命周期（类组件需要实例化, 函数组件不需要实例化）

![](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202204061904271.png)

> [http://projects.wojtekmaj.pl/react-lifecycle-methods-diagram/](http://projects.wojtekmaj.pl/react-lifecycle-methods-diagram/)

## 生命周期 - 挂载阶段

![](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202204121833377.png)

![](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202204041936930.png)

| 钩子 函数         | 触发时机                                              | 作用                                                          |
| ----------------- | ----------------------------------------------------- | ------------------------------------------------------------- |
| constructor       | 创建组件时，最先执行，初始化的时候只执行一次          | 1. 初始化 state 2. 创建 Ref 3. 使用 bind 解决 this 指向问题等 |
| render            | 每次组件渲染都会触发                                  | 渲染 UI（注意： 不能在里面调用 setState() , 会无限循环）      |
| componentDidMount | 组件挂载（完成 DOM 渲染）后执行，初始化的时候执行一次 | 1. 发送网络请求 2.DOM 操作                                    |

> 初始代码如下

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));
class Parent extends React.Component {
	render() {
		return <div>hello world</div>;
	}
}
root.render(
	<>
		<Parent />
	</>
);
```

![image-20221216145830506](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212161458593.png)

> 编写生命周期函数

```jsx
class Parent extends React.Component {
	// 创建组件时，最先执行，初始化的时候只执行一次
	constructor() {
		super();
		console.log("constructor...创建组件时，最先执行，初始化的时候只执行一次");
	}
	// 组件挂载（完成 DOM 渲染）后执行，初始化的时候执行一次
	componentDidMount() {
		console.log("componentDidMount...组件挂载（完成 DOM 渲染）后执行，初始化的时候执行一次");
	}
	// 每次组件渲染都会触发
	render() {
		console.log("render...每次组件渲染都会触发");
		return <div>hello world</div>;
	}
}
```

![image-20221216154127767](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212161541841.png)

> 注意: render, 每次组件渲染都会触发

```jsx
state = {
	count: 0,
};
```

![image-20221216154918873](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212161549923.png)

```jsx
return <button onClick={this.handleClick}>{this.state.count}</button>;
```

![image-20221216154942956](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212161549014.png)

```jsx
handleClick = () => {
	this.setState({
		count: this.state.count + 1,
	});
};
```

![image-20221216155005356](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212161550408.png)

> 最终结果

![image-20221216154834483](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212161548535.png)

## 生命周期 - 更新阶段

![](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202204121834889.png)

![](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202204041936936.png)

| 钩子函数           | 触发时机                   | 作用                                                             |
| ------------------ | -------------------------- | ---------------------------------------------------------------- |
| render             | 每次组件渲染都会触发       | 渲染 UI（与 挂载阶段 是同一个 render）                           |
| componentDidUpdate | 组件更新后（DOM 渲染完毕） | DOM 操作，可以获取到更新后的 DOM 内容，**不要直接调用 setState** |

> 初始代码

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));
class Parent extends React.Component {
	state = {
		count: 0,
	};
	// 创建组件时，最先执行，初始化的时候只执行一次
	constructor() {
		super();
		console.log("constructor...创建组件时，最先执行，初始化的时候只执行一次");
	}
	// 组件挂载（完成 DOM 渲染）后执行，初始化的时候执行一次
	componentDidMount() {
		console.log("componentDidMount...组件挂载（完成 DOM 渲染）后执行，初始化的时候执行一次");
	}
	handleClick = () => {
		this.setState({
			count: this.state.count + 1,
		});
	};
	// 每次组件渲染都会触发
	render() {
		console.log("render...每次组件渲染都会触发");
		return <button onClick={this.handleClick}>{this.state.count}</button>;
	}
}
root.render(
	<>
		<Parent />
	</>
);
```

> 编写生命周期函数

```jsx
	// 组件更新后（DOM 渲染完毕）
	componentDidUpdate() {
		console.log("componentDidUpdate...组件更新后（DOM 渲染完毕）");
	}
```

![image-20221216155255429](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212161552483.png)

## 生命周期 - 卸载阶段

![](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202204121834264.png)

| 钩子函数             | 触发时机                 | 作用                               |
| -------------------- | ------------------------ | ---------------------------------- |
| componentWillUnmount | 组件卸载（从页面中消失） | 执行清理工作（比如：清理定时器等） |

> 初始代码

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));
class Son extends React.Component {
	render() {
		return "this is son";
	}
}
class Parent extends React.Component {
	render() {
		return (
			<div>
				<Son />
			</div>
		);
	}
}
root.render(
	<>
		<Parent />
	</>
);
```

![image-20221216160441357](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212161604429.png)

> 编写生命周期函数

```jsx
	// 组件卸载（从页面中消失）
	componentWillUnmount() {
		console.log("componentWillUnmount...组件卸载（从页面中消失）");
	}
```

![image-20221216160622858](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212161606916.png)

```jsx
state = {
	flag: true,
};
```

![image-20221216160829351](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212161608411.png)

```jsx
handleClick = () => {
	this.setState({
		flag: false,
	});
};
```

![image-20221216160910044](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212161609155.png)

```jsx
<div>
{	this.state.flag ? <Son /> : "";}
<button onClick={this.handleClick}>click</button>;
</div>
```

![image-20221216161117545](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212161611604.png)

> 最终效果, 点击子组件会消失, 触发 componentWillUnmount
>
> 点击前:

![image-20221216161230077](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212161612135.png)

> 点击后:

![image-20221216161218076](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212161612136.png)

## 阶段小练习-todolist

> 源码地址: https://pan.baidu.com/s/1AostnCi7iMtmAovOG2cPUw?pwd=6666
>
> 首先安装依赖包

```bash
npm i
```

> 运行项目

```bash
npm start
```

> 初始效果

![image-20221216165950552](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212161659671.png)

> 新开一个控制台, 开启 mock 接口服务，保持窗口不关闭

```bash
npm run mock-serve
```

> 接口文档

| 接口作用 | 接口地址                              | 接口方法 | 接口参数                 |
| -------- | ------------------------------------- | -------- | ------------------------ |
| 获取列表 | http://localhost:3001/data            | GET      | 无                       |
| 删除     | http://localhost:3001/data/:id        | DELETE   | id                       |
| 搜索     | http://localhost:3001/data/?q=keyword | GET      | name（以 name 字段搜索） |

> 进行接口测试, 在浏览器中打开接口 url

![image-20221216171332501](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212161713571.png)

> 需要实现的功能

| 功能         | 核心思路                            |
| ------------ | ----------------------------------- |
| 表格数据渲染 | 组件使用                            |
| 删除功能     | 获取当前 id 调用接口                |
| 搜索功能     | 用的依旧是列表接口，多传一个 q 参数 |
| 清除搜索功能 | 清空搜索参数 重新获取列表           |

> 表格数据渲染
>
> 发送请求, 拿到数据, 交给 list
>
> 发送请求可以在 componentDidMount 中写

![image-20221216194110937](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212161941006.png)

> 导入 axios

```js
import axios from "axios";
```

> 定义函数, 发送请求, 接口地址 http://localhost:3001/data

| 接口作用 | 接口地址                              | 接口方法 | 接口参数                 |
| -------- | ------------------------------------- | -------- | ------------------------ |
| 获取列表 | http://localhost:3001/data            | GET      | 无                       |
| 删除     | http://localhost:3001/data/:id        | DELETE   | id                       |
| 搜索     | http://localhost:3001/data/?q=keyword | GET      | name（以 name 字段搜索） |

```jsx
	// 加载列表
	loadList = async () => {
		const res = await axios.get("http://localhost:3001/data");
		console.log(res);
	};
	componentDidMount() {
		this.loadList();
	}
```

![image-20221216195428952](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212161954020.png)

> 修改 state

```jsx
loadList = async () => {
	const res = await axios.get("http://localhost:3001/data");
	this.setState({
		list: res.data,
	});
};
```

![image-20221216195629830](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212161956902.png)

> 如果遇到报错, 需要加上 rowkey

![image-20221218165646309](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212181656387.png)

![image-20221218165733900](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212181657993.png)

```jsx
rowKey={"id"}
```

> 接下来是删除操作, 点击哪个 id, 就用哪个 id 去调用删除接口, 然后重新获取列表
>
> 相关的 UI 代码已经写好了

```jsx
				render: (text, record) => (
					<Space size="middle">
						<Popconfirm title="确定要删除吗?" onConfirm={() => this.handleDelete(record.id)}>
							<a href="#">删除</a>
						</Popconfirm>
					</Space>
				),
```

![image-20221218171217230](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212181712327.png)

> 我们需要完善 handleDelete 的逻辑

```jsx
handleDelete = () => {
	alert("开始删除...");
};
```

> 点击进行测试

![image-20221218173000273](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212181730374.png)

> 继续完善逻辑, 删除需要 id, 我们已经把 id 传过来了

![image-20221218173058254](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212181730349.png)

> 在原有的基础上加上 id 进行测试

```jsx
handleDelete = (id) => {
	alert("开始删除, id为" + id);
};
```

> 发现可以正常获取 id

![image-20221218173146192](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212181731244.png)

> 调用删除接口

| 接口作用 | 接口地址                              | 接口方法 | 接口参数                 |
| -------- | ------------------------------------- | -------- | ------------------------ |
| 获取列表 | http://localhost:3001/data            | GET      | 无                       |
| 删除     | http://localhost:3001/data/:id        | DELETE   | id                       |
| 搜索     | http://localhost:3001/data/?q=keyword | GET      | name（以 name 字段搜索） |

```jsx
// 删除
handleDelete = async (id) => {
	// 调用删除接口
	await axios.delete("http://localhost:3001/data/" + id);
	// 重新拉取列表
	this.loadList();
};
```

> 可以正常删除
>
> 删除前

![image-20221218181210606](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212181812665.png)

> 删除后

![image-20221218181225964](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212181812013.png)

> 接下来是搜索功能, 拿到关键词, 调用接口, 获取数据
>
> onSearch, 可以拿到关键词

![image-20221218182655255](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212181826356.png)

```jsx
// 搜索
onSearch = (value) => {
	alert(value);
};
```

> 输入关键词, 点击搜索

![image-20221218182824545](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212181828603.png)

> 可以看到弹框

![image-20221218182844743](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212181828860.png)

> 能拿到值, 就可以调用搜索接口

| 接口作用 | 接口地址                              | 接口方法 | 接口参数                 |
| -------- | ------------------------------------- | -------- | ------------------------ |
| 获取列表 | http://localhost:3001/data            | GET      | 无                       |
| 删除     | http://localhost:3001/data/:id        | DELETE   | id                       |
| 搜索     | http://localhost:3001/data/?q=keyword | GET      | name（以 name 字段搜索） |

```jsx
// 搜索
onSearch = async (value) => {
	const res = await axios.get("http://localhost:3001/data/?q=" + value);
	this.setState({
		list: res.data,
	});
};
```

> 搜索 vue, 得到结果

![image-20221218183723228](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212181837287.png)

> 点击 × 号, 会再次发送请求, value 是空字符串, 这个时候后端会返回所有数据
>
> 点击前

![image-20221218183808730](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212181838822.png)

> 点击后

![image-20221218183824220](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212181838311.png)

## 什么是 hooks

> Hooks 的本质：一套能够使函数组件更强大，更灵活的"钩子"
>
> 钩子: 在特定条件下自动执行
>
> React 体系里组件分为 类组件 和 函数组件
>
> 函数组件是一个更加匹配 React 的设计理念 `UI = f(data)`，也更有利于逻辑拆分与重用的组件表达形式，而先前的函数组件是不可以有自己的状态的，为了能让函数组件可以拥有自己的状态，所以从 react v16.8 开始，Hooks 应运而生

> 1.  有了 hooks 之后，为了兼容老版本，class 类组件并没有被移除，俩者都可以使用
> 2.  有了 hooks 之后，不能在把函数称为无状态组件了，因为 hooks 为函数组件提供了状态
> 3.  hooks 只能在函数组件中使用

## Hooks 解决了什么问题

> Hooks 的出现解决了两个问题
>
> 1. 组件的状态逻辑复用,在 hooks 出现之前，react 先后尝试了 mixins 混入，HOC 高阶组件，render-props 等模式, 但是都有各自的问题，比如 mixin 的数据来源不清晰，高阶组件的嵌套问题等等
> 2. class 组件自身的问题, class 组件就像一个厚重的‘战舰’ 一样，大而全，提供了很多东西，有不可忽视的学习成本，比如各种生命周期，this 指向问题等等，而我们更多时候需要的是一个轻快灵活的'快艇'

## useState

> useState 为函数组件提供状态（state）

> 1. 导入 `useState` 函数
> 2. 调用 `useState` 函数，并传入状态的初始值, 返回值：数组,包含两个值：状态值和修改该状态的函数
> 3. 从`useState`函数的返回值中，拿到状态和修改状态的方法
> 4. 在 JSX 中展示状态
> 5. 调用修改状态的方法更新状态

> 初始代码如下

```jsx
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));

function App() {
	return <div>这是一个函数组件</div>;
}
root.render(
	<>
		<App />
	</>
);
```

![image-20221218222613455](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212182226536.png)

> 1. 导入 `useState` 函数

```jsx
// 1. 导入 `useState` 函数
import { useState } from "react";
```

> 2. 调用 useState 函数，并传入状态的初始值, 返回值：数组,包含两个值：状态值和修改该状态的函数

```jsx
function App() {
	// 2. 调用 useState 函数，并传入状态的初始值, 返回值：数组,包含两个值：状态值和修改该状态的函数
	const result = useState(0);
	return <div>这是一个函数组件</div>;
}
```

> 3. 从 useState 函数的返回值中，拿到状态和修改状态的方法

```jsx
// 3. 从 useState 函数的返回值中，拿到状态和修改状态的方法
const [count, setCount] = result;
```

> 4. 在 JSX 中展示状态

```jsx
return (
	<div>
		<button>增加</button>
		{/* 4. 在 JSX 中展示状态 */}
		<div>当前计数: {count}</div>
	</div>
);
```

> 5. 调用修改状态的方法更新状态

```jsx
const handleClick = (number) => {
	// 5. 调用修改状态的方法更新状态
	setCount(number);
};
```

![image-20221218224700777](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212182247870.png)

```jsx
<button
	onClick={() => {
		handleClick(count + 1);
	}}
>
	增加
</button>
```

![image-20221218224728789](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212182247852.png)

> 注意事项:
>
> 1. useState 的参数, 作为 count 的初始值
> 2. `[count, setCount]`是解构赋值, 名字可以自定义, 见明知意即可
> 3. count, setCount, 顺序不能互换, 第一个表示数据状态, 第二个是修改数据的方法
> 4. count 和 setCount 是一对, setCount 只能用来修改对应的 count 的值
> 5. setCount 是一个函数，参数表示`最新的状态值`
> 6. 调用该函数后，将使用新值替换旧值
> 7. 修改状态后，由于状态发生变化，会引起视图变化
> 8. 修改状态的时候，一定要使用新的状态替换旧的状态，不能直接修改旧的状态

![](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202204071622235.png)

## 组件的更新过程

> 组件第一次渲染
>
> 1. 从头开始执行该组件中的代码逻辑
> 2. 调用 `useState(0)` 将传入的参数作为状态初始值，即：0
> 3. 渲染组件，此时，获取到的状态 count 值为： 0

> 组件第二次渲染, 每次调用 setCount 都会执行
>
> 1. 点击按钮，调用 `setCount(number);` 修改状态，因为状态发生改变，所以，该组件会重新渲染
> 2. 组件重新渲染时，会再次执行该组件中的代码逻辑
> 3. 再次调用 `useState(0)`，此时 React 内部会拿到最新的状态值而非初始值，比如，该案例中最新的状态值为 1
> 4. 再次渲染组件，此时，获取到的状态 count 值为：1
> 5. 注意：useState 的初始值(参数)只会在组件第一次渲染时生效。也就是说，以后的每次渲染，useState 获取到都是最新的状态值，React 组件会记住每次最新的状态值

## 使用规则

> `useState` 函数可以执行多次，每次执行互相独立，每调用一次为函数组件提供一个状态

```jsx
const [count, setCount] = useState(0);
const [list, setList] = useState([]);
```

> 完整代码

```jsx
// 1. 导入 `useState` 函数
import { useState } from "react";
import ReactDOM from "react-dom/client";

const root = ReactDOM.createRoot(document.getElementById("root"));

function App() {
	const [count, setCount] = useState(0);
	const [list, setList] = useState([]);
	const handleClick = () => {
		// count 自增
		setCount(count + 1);
		// 生成一个新数组, 包含原来数组的值, 以及最新的count
		const newList = [...list, count];
		// 更新数组
		setList(newList);
	};
	return (
		<div>
			<button onClick={handleClick}>增加</button>
			{/* 在 JSX 中展示状态 */}
			<div>当前计数: {count}</div>
			<div>当前数组: {list.join("---")}</div>
		</div>
	);
}
root.render(
	<>
		<App />
	</>
);
```

> `useState` 注意事项
>
> 1. 只能出现在函数组件中
> 2. 不能嵌套在 if/for/其它函数中
> 3. react 按照 hooks 的调用顺序识别每一个 hook, if 会打乱顺序

![](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202204071659870.png)

## 函数副作用

> 副作用是相对于主作用来说的，一个函数除了主作用，其他的作用就是副作用
>
> sort 除了排序(主作用), 还能修改原数组(副作用)

```javascript
const arr = [6, 5, 4, 3, 2, 1];
const arr1 = arr.sort();
console.log(arr1);
console.log(arr);
```

> 解决方案: `const arr1 = arr.slice().sort()`, slice 会生成一个新数组

> 对于 React 组件来说，主作用就是根据数据（state/props）渲染 UI，除此之外都是副作用
>
> 常见 React 组件副作用
>
> 1. 数据请求 ajax 发送
> 2. 手动修改 dom
> 3. localstorage 操作

> useEffect 函数的作用就是为 react 函数组件提供副作用处理的

## useEffect

> 作用: 为 react 函数组件提供副作用处理

> 初始代码如下:

```jsx
import { useState } from "react";
import ReactDOM from "react-dom/client";

const root = ReactDOM.createRoot(document.getElementById("root"));

function App() {
	const [count, setCount] = useState(0);
	return (
		<div>
			<button onClick={() => setCount(count + 1)}>增加</button>
			<div>{count}</div>
		</div>
	);
}
root.render(
	<>
		<App />
	</>
);
```

> 比如需求是: 修改数据之后, 把 count 的值放到页面标题中
>
> 使用步骤
>
> 1. 导入 `useEffect` 函数
> 2. 调用 `useEffect` 函数，并传入回调函数
> 3. 在回调函数中编写副作用处理（dom 操作）

> 1. 导入 `useEffect` 函数

```jsx
// 导入 `useEffect` 函数
import { useEffect, useState } from "react";
```

> 2. 调用 useEffect 函数，并传入回调函数

```jsx
// 2. 调用 useEffect 函数，并传入回调函数
useEffect(() => {
	console.log("副作用执行了....");
});
```

![image-20221218234919466](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212182349539.png)

> 3. 在回调函数中编写副作用处理（dom 操作）

```jsx
useEffect(() => {
	console.log("副作用执行了....");
	// 3. 在回调函数中编写副作用处理（dom 操作）
	document.title = count + "!!!!";
});
```

> 注意: 当我们修改状态更新组件时, 副作用也会不断执行

## 依赖项控制执行时机

> 无依赖项的时候, 组件首次渲染执行一次，以及不管是哪个状态更改, 引起组件更新时都会重新执行
>
> 也就是我们之前写的代码

```jsx
// 导入 `useEffect` 函数
import { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";

const root = ReactDOM.createRoot(document.getElementById("root"));

function App() {
	const [count, setCount] = useState(0);
	// 2. 调用 useEffect 函数，并传入回调函数
	useEffect(() => {
		console.log("副作用执行了....");
		// 3. 在回调函数中编写副作用处理（dom 操作）
		document.title = count + "!!!!";
	});
	return (
		<div>
			<button onClick={() => setCount(count + 1)}>增加</button>
			<div>{count}</div>
		</div>
	);
}
root.render(
	<>
		<App />
	</>
);
```

> 添加一个空数组依赖项, 组件初始化的时候执行一次, 后面不再执行

![image-20221219003012287](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212190030366.png)

```jsx
useEffect(() => {
	console.log("副作用执行了....");
	// 3. 在回调函数中编写副作用处理（dom 操作）
	document.title = count + "!!!!";
}, []);
```

![image-20221219002924650](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212190029717.png)

> 添加特定依赖项, 副作用函数在首次渲染时执行，在依赖项发生变化时重新执行

```jsx
// 导入 `useEffect` 函数
import { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";

const root = ReactDOM.createRoot(document.getElementById("root"));

function App() {
	const [count, setCount] = useState(0);
	const [name, setName] = useState("张三");
	// 2. 调用 useEffect 函数，并传入回调函数
	useEffect(() => {
		// 3. 在回调函数中编写副作用处理（dom 操作）
		console.log("副作用执行了....");
		document.title = count + "!!!!";
	}, [count]);
	return (
		<div>
			<button onClick={() => setCount(count + 1)}>增加</button>
			<div>{count}</div>
			<button onClick={() => setName("李四")}>改名字</button>
			<div>{name}</div>
		</div>
	);
}
root.render(
	<>
		<App />
	</>
);
```

![image-20221219003246766](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212190032834.png)

![image-20221219003115196](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212190031265.png)

> 注意: useEffect 回调函数中用到的数据（比如，count）就是依赖数据，就应该出现在依赖项数组中，如果不添加依赖项就会有 bug 出现

![image-20221219003134945](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212190031013.png)

## 自定义 hook 小练习 1

> 自定义一个 hook 函数，实现获取滚动距离 Y
>
> 初始代码如下:

```jsx
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));
function App() {
	return <div>这是一个组件</div>;
}
root.render(
	<>
		<App />
	</>
);
```

![image-20221219151250430](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212191512508.png)

> 新建`useWindowScroll.js`, 编写相关逻辑

```javascript
// src\useWindowScroll.js

import { useState } from "react";
export function useWindowScroll() {
	const [y, setY] = useState(0);
	window.addEventListener("scroll", () => {
		const h = document.documentElement.scrollTop;
		setY(h);
	});
	return y;
}
```

> 在 index.js 中引入

```jsx
// src\index.js

import { useWindowScroll } from "./useWindowScroll";
//...
function App() {
	const y = useWindowScroll();
	return <div style={{ height: "12000px" }}>{y}</div>;
}
// ...
```

## 自定义 hook 小练习 2

> 自定义 hook 函数，可以自动同步到本地 LocalStorage
>
> 1. message 可以通过自定义传入默认初始值
> 2. 每次修改 message 数据的时候 都会自动往本地同步一份

> 初始代码如下:

```jsx
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));
function App() {
	return <div>这是一个组件</div>;
}
root.render(
	<>
		<App />
	</>
);
```

![image-20221219151250430](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212191512508.png)

> 创建 useLocalStorage.js, 编写相关逻辑

```jsx
import { useEffect, useState } from "react";

export function useLocalStorage(key, defaultValue) {
	const [message, setMessage] = useState(defaultValue);
	// 每次只要message变化 就会自动同步到本地localStorage
	useEffect(() => {
		window.localStorage.setItem(key, message);
	}, [message, key]);
	return [message, setMessage];
}
```

> 在 index.js 中引入

```jsx
// src\index.js

import { useLocalStorage } from "./useLocalStorage";
// ...

function App() {
	const [message, setMessage] = useLocalStorage("username", "zhangsan");
	const changeName = () => {
		setMessage("lisi");
	};
	return (
		<>
			<div>{message}</div>
			<button onClick={changeName}>改名字</button>
		</>
	);
}
// ...
```

## useState - 回调函数作为参数

> useState 的参数只会在组件的初始渲染中起作用，后续渲染时会被忽略。
>
> 如果初始 state 需要通过计算才能获得，则可以传入一个函数，在函数中计算并返回初始的 state，此函数只在初始渲染时被调用
>
> 语法结构如下:

```jsx
const [name, setName] = useState(() => {
	// 编写计算逻辑    return '计算之后的初始值'
});
```

> 语法规则
>
> 1. 回调函数 return 出去的值将作为 `name` 的初始值
> 2. 回调函数中的逻辑只会在组件初始化的时候执行一次

> 语法选择
>
> 1. 如果就是初始化一个普通的数据 直接使用 `useState(普通数据)` 即可
> 2. 如果要初始化的数据无法直接得到需要通过计算才能获取到，使用`useState(()=>{})`

![](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202204041936290.png)

> 初始代码如下

```jsx
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));

function Counter(props) {
	const { count } = props;
	return (
		<div>
			<button>{count}</button>
		</div>
	);
}

root.render(
	<>
		<Counter count={10} />
		<Counter count={20} />
	</>
);
```

![image-20221219162802351](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212191628429.png)

> 使用 useState 拿到状态和修改状态的方法

```jsx
import { useState } from "react";
// ...

const [count, setCount] = useState(() => {
	// 使用函数的返回值, 作为初始值
	return props.count;
});
```

![image-20221219163659666](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212191636736.png)

> 绑定点击事件

```jsx
<button onClick={() => setCount(count + 1)}>{count}</button>
```

![image-20221219163713778](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212191637875.png)

> 最终的效果

![](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212191639176.gif)

## useEffect - 清理副作用

> 使用场景:
>
> 在组件被销毁时，如果有些副作用操作需要被清理，就可以使用此语法，比如常见的定时器
>
> 语法结构如下:

```javascript
useEffect(() => {
	console.log("副作用函数执行了");
	// 副作用函数的执行时机为: 在下一次副作用函数执行之前执行
	return () => {
		console.log("清理副作用的函数执行了");
		// 在这里写清理副作用的代码
	};
});
```

> 比如如下的代码
>
> 添加副作用函数前, 组件虽然已经不显示了, 但是定时器依旧在运行

```jsx
import { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));

function Son() {
	useEffect(() => {
		// 函数副作用
		setInterval(() => {
			console.log("副作用函数执行了");
		}, 1000);
	});
	return <div>this is son</div>;
}

function Parent() {
	const [flag, setFlag] = useState(true);
	return (
		<>
			<button onClick={() => setFlag(!flag)}>click</button>
			{flag ? <Son /> : null}
		</>
	);
}

root.render(
	<>
		<Parent />
	</>
);
```

> 添加清理副作用函数后：一旦组件被销毁，定时器也被清理

```jsx
useEffect(() => {
	const timeId = setInterval(() => {
		console.log("副作用执行了...");
	}, 1000);
	// 清理副作用的代码, 组件销毁后会自动触发
	return () => {
		clearInterval(timeId);
	};
});
```

## useEffect - 发送网络请求

> 使用场景: 在 useEffect 中发送网络请求，并且封装 async await 操作
>
> 接口地址如下:
>
> [https://www.fastmock.site/mock/65fd811567052bc43a50412985949ab6/api/shop/1/tab/all](https://www.fastmock.site/mock/65fd811567052bc43a50412985949ab6/api/shop/1/tab/all)
>
> 返回数据如下

```json
{
	"code": "0000",
	"data": [
		{
			"id": 1,
			"name": "全部商品-番茄150g/份",
			"imgUrl": "https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202202261527635.png",
			"sales": 1,
			"promotionPrice": 1.6,
			"originalPrice": 1.6
		},
		{
			"id": 2,
			"name": "全部商品-番茄250g/份",
			"imgUrl": "https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202202261527853.png",
			"sales": 2,
			"promotionPrice": 2.6,
			"originalPrice": 2.6
		},
		{
			"id": 3,
			"name": "全部商品-番茄350g/份",
			"imgUrl": "https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202202261527922.png",
			"sales": 3,
			"promotionPrice": 3.6,
			"originalPrice": 3.6
		},
		{
			"id": 4,
			"name": "全部商品-番茄450g/份",
			"imgUrl": "https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202202261530259.png",
			"sales": 4,
			"promotionPrice": 4.6,
			"originalPrice": 4.6
		}
	],
	"desc": "成功"
}
```

> 注意: 不可以直接在 useEffect 的回调函数外层直接包裹 async
>
> 以下是错误写法:

```javascript
useEffect(async () => {
	const res = await axios.get("http://xxx.com/demo");
	console.log(res);
}, []);
```

> 正确写法: 在内部单独定义一个函数，然后把这个函数包装成同步

```jsx
useEffect(() => {
	async function fetchData() {
		const res = await axios.get("http://xxx.com/demo");
		console.log(res);
	}
	fetchData();
}, []);
```

> 首先安装 axios

```bash
npm install axios
```

> 编写获取接口的代码

```jsx
import axios from "axios";
import { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));

function App() {
	useEffect(() => {
		async function getData() {
			const response = await axios.get(
				"https://www.fastmock.site/mock/65fd811567052bc43a50412985949ab6/api/shop/1/tab/all"
			);
			console.log(response);
		}
		getData();
	}, []);
	return <></>;
}

root.render(
	<>
		<App />
	</>
);
```

> 测试, 可以看到接口的返回结果

```bash
npm run start
```

![](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202204081535542.png)

> 像这种写法, 就是错误的

```jsx
useEffect(async () => {
	const response = await axios.get(
		"https://www.fastmock.site/mock/65fd811567052bc43a50412985949ab6/api/shop/1/tab/all"
	);
	console.log(response);
}, []);
```

![image-20221219171934834](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212191719934.png)

## useRef

> 在函数组件中获取真实的 dom 元素对象或者是组件对象
>
> 初始代码如下:

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));

class Son extends React.Component {
	render() {
		return <div>this is son</div>;
	}
}

function Parent() {
	return (
		<div>
			<Son />
			<h1>this is h1</h1>
		</div>
	);
}

root.render(
	<>
		<Parent />
	</>
);
```

![image-20221219172741678](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212191727747.png)

> 使用步骤
>
> 1. 导入 `useRef` 函数
> 2. 执行 `useRef` 函数并传入 null，返回值为一个对象, 内部有一个 current 属性存放拿到的 dom 对象（组件实例）
> 3. 通过 ref 绑定要获取的元素或者组件
>
> 注意: 函数组件由于没有实例，不能使用 ref 获取，如果想获取组件实例，必须是类组件
>
> 1. 导入 `useRef` 函数

```jsx
// 1. 导入 useRef 函数
import { useRef } from "react";
```

> 2. 执行 useRef 函数并传入 null，返回值为一个对象, 内部有一个 current 属性存放拿到的 dom 对象（组件实例）

```jsx
// 2. 执行 useRef 函数并传入 null，返回值为一个对象, 内部有一个 current 属性存放拿到的 dom 对象（组件实例）
const sonRef = useRef(null);
const h1Ref = useRef(null);
```

![image-20221219173527432](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212191735523.png)

> 3. 通过 ref 绑定要获取的元素或者组件

```jsx
{/* 3. 通过 ref 绑定要获取的元素或者组件 */}
			<Son ref={sonRef} />
			<h1 ref={h1Ref}>this is h1</h1>
```

![image-20221219173341874](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212191733969.png)

> 4. 在 useEffect 中查看效果

```jsx
import React, { useEffect, useRef } from "react";
```

```jsx
useEffect(() => {
	console.log(sonRef.current);
	console.log(h1Ref.current);
});
```

![image-20221219173645655](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212191736748.png)

![image-20221219173744632](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212191737693.png)

## useContext

> 之前学过跨组件通信 Context, 接下来学习在 hook 中的用法, useContext

![](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202204081614429.png)

> 初始代码如下

```jsx
import ReactDOM from "react-dom/client";
const root = ReactDOM.createRoot(document.getElementById("root"));

function ComponentA() {
	return (
		<div>
			this is component A
			<ComponentC />
		</div>
	);
}
function ComponentC() {
	return <div>this is component C</div>;
}

function Parent() {
	return (
		<div>
			<ComponentA />
		</div>
	);
}

root.render(
	<>
		<Parent />
	</>
);
```

![image-20221219174152386](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212191741463.png)

> 1. 使用`createContext` 创建 Context 对象
> 2. 在顶层组件通过`Provider` 提供数据
> 3. 在底层组件通过`useContext`函数获取数据

> 1. 使用`createContext` 创建 Context 对象

```jsx
import { createContext } from "react";
// ...
// 1. 使用`createContext` 创建 Context 对象
const Context = createContext();
```

> 2. 在顶层组件通过`Provider` 提供数据

```jsx
import { createContext, useState } from "react";
```

```jsx
function Parent() {
	const [count] = useState(0);
	return (
		// 在顶层组件通过`Provider` 提供数据
		<Context.Provider value={count}>
			<div>
				<ComponentA />
			</div>
		</Context.Provider>
	);
}
```

> 3. 在底层组件通过`useContext`函数获取数据

```jsx
import { createContext, useContext, useState } from "react";
```

```jsx
function ComponentC() {
	// 3. 在底层组件通过`useContext`函数获取数据
	const count = useContext(Context);
	return <div>this is component C, count is : {count}</div>;
}
```

![image-20221219175254793](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212191752866.png)

> 注意: 数据是响应式的, 如果提供方更新的数据, 使用方的数据也会跟着变化

```jsx
function Parent() {
	const [count, setCount] = useState(0);
	return (
		// 2. 在顶层组件通过 Provider 提供数据
		<Context.Provider value={count}>
			<div>
				<button
					onClick={() => {
						setCount(count + 1);
					}}
				>
					click
				</button>
				<ComponentA />
			</div>
		</Context.Provider>
	);
}
```

![image-20221219175518323](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212191755392.png)

## React-Router 前置知识

> 1. 单页应用
> 2. 路由的本质

## 单页面应用 SPA

> 单页 Web 应用(single page web application, SPA)
>
> 整个应用只有一个完整的页面
>
> 点击页面中的导航链接不会刷新页, 只会进行页面的局部更新
>
> 数据需要通过 ajax 请求获取
>
> 项目渲染出来只有一个 html 文件, 主流的开发模式变成了通过路由进行页面切换
>
> 优点: 避免整体页面刷新, 用户体验变好
>
> 缺点: 前端负责事情变多了, 开发的难度变大

## 路由的本质

> 路由就是一组 key-value 的对应关系, 多个路由，需要经过路由器的管理

![image-20221001024444798](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221001024444.png)

> 有路由的概念, 是为了实现单页面应用 SPA, 所有数据在一个页面展示, 不跳转其他页面
>
> https://vue-admin-beautiful.com/admin-plus/#/index

![image-20221001025906678](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221001025906.png)

## 前端路由 vs 后端路由

> 前端路由, 匹配路径, 展示对应的组件
>
> 后端路由, 匹配请求方法和路径, 执行对应的函数

> 前端路由, 路径是`/index`, 展示对应的`index.vue`组件

![image-20221001031344724](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221001031344.png)

> 前端路由, 路径是`/dashboard`, 展示对应的`dashboard.vue`组件

![image-20221001031350761](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221001031350.png)

> 后端路由, 匹配请求方法(`get`)和路径(`/users/getUserInfo`), 执行对应的函数

![image-20221001031535062](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221001031535.png)

## 准备路由项目环境

> 1. vite 简介
> 2. 搭建一个 Vite 项目
> 3. 安装 react-router

## vite 简介

> 地址: https://cn.vitejs.dev/
>
> 中文网: https://vitejs.cn/

![image-20221002195836480](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221002195836.png)

> vite 相较于 webpack, 优势如下

![image-20221002195852599](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221002195852.png)

> webpack 的打包方式

![image-20221002200055502](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221002200055.png)

> vite 的打包方式

![image-20221002200116234](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221002200116.png)

## 搭建一个 Vite 项目

> 温馨提醒, 注意 node 的版本, 牵涉到兼容性问题
>
> Vite 需要 [Node.js](https://nodejs.org/en/) 版本 14.18+，16+
>
> 然而，有些模板需要依赖更高的 Node 版本才能正常运行，当你的包管理器发出警告时，请注意升级你的 Node 版本。
>
> 可以使用`node --version`查看 node 版本

![image-20221002200444429](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221002200444.png)

> 可以通过`npm --version` 查看 npm 版本

![image-20221002200626312](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221002200626.png)

> 创建项目的方法, 首先在桌面打开命令行, 先 cmd, 然后切到桌面

![image-20221002215634661](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/20221002215634.png)

> 执行如下命令

```bash
npm create vite@latest
```

> 如果你的项目(文件夹)的名字, 默认`vite-project`, 建议`react-router`前端

![image-20221219204712531](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212192047686.png)

> 需要选择框架, 我们选择`react`

![image-20221219204726183](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212192047317.png)

> 需要选择语言, 我们选择`JavaScript`

![image-20221219204736568](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212192047702.png)

> 此时已经有了`react-router`文件夹, 会给出下一步的提示

![image-20221219204749295](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212192047436.png)

> 使用 vscode 打开 react-router, 在 vscode 的命令行中, 执行如下命令

```bash
npm i
```

![image-20221219204839384](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212192048452.png)

> 安装完毕后, 执行如下命令

```bash
npm run dev
```

![image-20221219204920785](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212192049838.png)

> 提示你访问如下地址

![image-20221219204933556](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212192049634.png)

> 看到如下页面, 说明初始化完成

![image-20221219204948315](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212192049440.png)

## 安装 react-router

> 在原有项目的基础上, 执行如下代码即可
>
> 安装 react-router 包

```bash
npm i react-router-dom
```

![image-20221219205014759](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212192050817.png)

## 基础使用

> 需求: 准备俩个按钮，点击不同按钮切换不同组件内容的显示
>
> 实现步骤：
>
> 1. 导入必要的路由 router 内置组件
> 2. 准备两个 React 组件
> 3. 按照路由的规则进行路由配置

![无标题-2022-07-27-1257.png](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212211123695.png)

```jsx
// 引入必要的内置组件
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
// 准备两个路由组件
const Home = () => <div>home</div>;
const About = () => <div>about</div>;
function App() {
	return (
		<div className="App">
			<BrowserRouter>
				<Link to="/">
					<button>首页</button>
				</Link>
				<Link to="/about">
					<button>关于</button>
				</Link>
				<Routes>
					<Route path="/" element={<Home />}></Route>
					<Route path="/about" element={<About />}></Route>
				</Routes>
			</BrowserRouter>
		</div>
	);
}
export default App;
```

![image-20221222131329532](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212221313624.png)

> 注释版本

```jsx
// 引入必要的内置组件
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
// 准备两个路由组件
const Home = () => <div>home</div>;
const About = () => <div>about</div>;
function App() {
	return (
		<div className="App">
			{/* 声明当前要用一个非hash模式的路由 */}
			<BrowserRouter>
				{/* 指定跳转的组件, to用来配置路由地址 */}
				<Link to="/">
					<button>首页</button>
				</Link>
				<Link to="/about">
					<button>关于</button>
				</Link>
				{/* 路由出口, 路由对应的组件会在这里进行渲染 */}
				<Routes>
					{/* 指定路径和组件的对应关系, path代表路径, element代表组件, 成对出现, path ==> element */}
					<Route path="/" element={<Home />}></Route>
					<Route path="/about" element={<About />}></Route>
				</Routes>
			</BrowserRouter>
		</div>
	);
}
export default App;
```

## 核心内置组件说明

> 1. BrowerRouter
> 2. Link
> 3. Routes
> 4. Route

## BrowerRouter

> 作用: 包裹整个应用，一个 React 应用只需要使用一次

| **模式**      | **实现方式**                     | **路由 url 表现**             |
| ------------- | -------------------------------- | ----------------------------- |
| HashRouter    | 监听 url hash 值实现             | http://localhost:3000/#/about |
| BrowserRouter | h5 的 history.pushState API 实现 | http://localhost:3000/about   |

```jsx
// 引入必要的内置组件
import { Routes, Route, Link, HashRouter } from "react-router-dom";
// 准备两个路由组件
const Home = () => <div>home</div>;
const About = () => <div>about</div>;
function App() {
	return (
		<div className="App">
			{/* 生命当前要用一个非hash模式的路由 */}
			<HashRouter>
				{/* 指定跳转的组件, to用来配置路由地址 */}
				<Link to="/">
					<button>首页</button>
				</Link>
				<Link to="/about">
					<button>关于</button>
				</Link>
				{/* 路由出口, 路由对应的组件会在这里进行渲染 */}
				<Routes>
					{/* 指定路径和组件的对应关系, path代表路径, element代表组件, 成对出现, path ==> element */}
					<Route path="/" element={<Home />}></Route>
					<Route path="/about" element={<About />}></Route>
				</Routes>
			</HashRouter>
		</div>
	);
}
export default App;
```

![image-20221223110946551](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212231109608.png)

## Link

> 作用: 用于指定导航链接，完成声明式的路由跳转
>
> 这里 to 属性用于指定路由地址，表示要跳转到哪里去，Link 组件最终会被渲染为原生的 a 链接

![image.png](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212221856652.png)

![image-20221223113358430](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212231133499.png)

## Routes

> 作用: 提供一个路由出口，组件内部会存在多个内置的 Route 组件，满足条件的路由会被渲染到组件内部

![image.png](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212221857529.png)

## Route

> 作用: 用于定义路由路径和渲染组件的对应关系
>
> 其中 path 属性用来指定匹配的路径地址，element 属性指定要渲染的组件
>
> 图中配置的意思为: 当 url 上访问的地址为 /about 时，当前路由发生匹配，对应的 About 组件渲染

![image.png](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212221857054.png)

## 编程式导航

> 声明式 【 Link to】 vs 编程式 【调用路由方法进行路由跳转】
>
> 概念: 通过 js 编程的方式进行路由页面跳转，比如说从首页跳转到关于页
>
> 新建 Login 组件 `src\Login.jsx`

```jsx
function Login() {
	return <div>login</div>;
}

export default Login;
```

> 导入组件

```jsx
// src\App.jsx
import Login from "./Login";
```

> 新增路径和组件的对应关系

```jsx
// src\App.jsx
<Route path="/login" element={<Login />}></Route>
```

> 手动输入`http://127.0.0.1:5173/#/login`, 可以展示 login

![image-20221223125528141](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212231255208.png)

> 现在我们要做的是能够从 login 跳到首页
>
> 导入 useNavigate

```jsx
// src\Login.jsx
// 导入useNavigate
import { useNavigate } from "react-router-dom";
```

![image-20221223135528544](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212231355608.png)

> 执行 useNavigate, 得到一个跳转函数

```jsx
// src\Login.jsx
// 执行useNavigate, 得到一个跳转函数
const navigate = useNavigate();
```

![image-20221223135556961](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212231355025.png)

> 调用跳转函数, 传入目标路径

```jsx
// src\Login.jsx
// 跳转到首页
function goHome() {
	// 调用跳转函数, 传入目标路径
	navigate("/");
}
```

![image-20221223135612800](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212231356879.png)

> 添加按钮, 点击触发 goHome

```jsx
// src\Login.jsx
<button onClick={goHome}>跳转首页</button>
```

![image-20221223135505488](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212231355560.png)

![image-20221223135641611](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212231356666.png)

> 这个时候, 点击回退, 会跳回到 login, 不合理, 如果在跳转时不想添加历史记录，可以添加额外参数 replace 为 true

```jsx
// src\Login.jsx
function goHome() {
	// 调用跳转函数, 传入目标路径
	navigate("/", { replace: true });
}
```

## 路由传参

> 场景：跳转路由的同时，有时候要需要传递参数
>
> 1. searchParams 传参
> 2. params 传参

## searchParams 传参

> 路由传参

![image.png](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212231504076.png)

> 路由取参

![image.png](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212231505206.png)

> 首先进行路由传参

```jsx
// src\Login.jsx
function goHome() {
	// 调用跳转函数, 传入目标路径, searchParams传参
	navigate("/?id=10001", { replace: true });
}
```

> 然后进行路由取参

```jsx
// src\App.jsx
const Home = () => {
	// 路由取参
	const [params] = useSearchParams();
	// params有一个get方法, 可以获取参数
	const id = params.get("id");
	return <div>home 用户id {id}</div>;
};
```

![image-20221223231655793](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212232316853.png)

## params 传参

> 路由传参

![image.png](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212231506698.png)

> 路由取参

![image.png](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212231506273.png)

> 首先路由传参

```jsx
// src\Login.jsx
function goHome() {
	// 调用跳转函数, 传入目标路径, searchParams传参
	navigate("/10001", { replace: true });
}
```

> 路由取参

```jsx
// src\App.jsx
const Home = () => {
	let params = useParams();
	const id = params.id;
	return <div>home 用户id是 {id}</div>;
};
```

> 注意编写占位符

![image-20221223163457001](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212231634069.png)

![image-20221223231210966](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212232312053.png)

## 嵌套路由

> 场景：在我们做的很多的管理后台系统中，通常我们都会设计一个 Layout 组件，在它内部实现嵌套路由

![无标题-2022-07-27-1257.png](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212232334241.png)

> 实现步骤：
>
> 1. App.js 中定义嵌套路由声明
> 2. Layout 组件内部通过 `<Outlet/>` 指定二级路由出口

> 先编写 Layout 组件, Board 组件和 Article 组件

```jsx
// src\Layout.jsx
import { Outlet } from "react-router-dom";

function Layout() {
	return <div>layout</div>;
}
export default Layout;
```

```jsx
// src\Board.jsx
function Board() {
	return <div>Board</div>;
}
export default Board;
```

```jsx
// src\Article.jsx
function Article() {
	return <div>Article</div>;
}
export default Article;
```

> App.js 组件中定义路由嵌套关系

```jsx
// src\App.jsx

import { BrowserRouter, Route, Routes } from "react-router-dom";
import Article from "./Article";
import Board from "./Board";
import Layout from "./Layout";

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Layout></Layout>}>
					<Route path="board" element={<Board></Board>}></Route>
					<Route path="article" element={<Article></Article>}></Route>
				</Route>
			</Routes>
		</BrowserRouter>
	);
}
export default App;
```

> Layout.js 组件中使用 Outlet 组件添加二级路由出口

```jsx
// src\Layout.jsx
import { Outlet } from "react-router-dom";

function Layout() {
	return (
		<div>
			layout
			{/* 二级路由的出口 */}
			<Outlet></Outlet>
		</div>
	);
}
export default Layout;
```

![image-20221224151730147](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212241517236.png)

![image-20221224151734446](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212241517509.png)

## 默认二级路由

> 场景: 应用首次渲染完毕就需要显示的二级路由
>
> 实现步骤:
>
> 1. 给默认二级路由标记 index 属性
> 2. 把原本的路径 path 属性去掉

```jsx
// src\App.jsx

import { BrowserRouter, Route, Routes } from "react-router-dom";
import Article from "./Article";
import Board from "./Board";
import Layout from "./Layout";

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Layout></Layout>}>
					<Route index element={<Board></Board>}></Route>
					<Route path="article" element={<Article></Article>}></Route>
				</Route>
			</Routes>
		</BrowserRouter>
	);
}
export default App;
```

![image-20221224152942538](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212241529604.png)

## 404 路由配置

> 场景：当 url 的路径在整个路由配置中都找不到对应的 path，使用 404 兜底组件进行渲染

> 1. 准备一个 NotFound 组件

```jsx
// src\NotFound.jsx
function NotFound() {
	return <div>NotFound</div>;
}
export default NotFound;
```

```jsx
// src\App.jsx

import { BrowserRouter, Route, Routes } from "react-router-dom";
import Article from "./Article";
import Board from "./Board";
import Layout from "./Layout";
import NotFound from "./NotFound";

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Layout></Layout>}>
					<Route index element={<Board></Board>}></Route>
					<Route path="article" element={<Article></Article>}></Route>
				</Route>
				{/* 如果没有匹配成功, 走这个路由 */}
				<Route path="*" element={<NotFound />}></Route>
			</Routes>
		</BrowserRouter>
	);
}
export default App;
```

![image-20221224154147721](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212241541781.png)

## 集中式路由配置

> 场景: 当我们需要路由权限控制点时候, 对路由数组做一些权限的筛选过滤，所谓的集中式路由配置就是用一个数组统一把所有的路由对应关系写好替换
>
> 原来的代码

```jsx
// src\App.jsx

import { BrowserRouter, Route, Routes } from "react-router-dom";
import Article from "./Article";
import Board from "./Board";
import Layout from "./Layout";
import NotFound from "./NotFound";

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Layout></Layout>}>
					<Route index element={<Board></Board>}></Route>
					<Route path="article" element={<Article></Article>}></Route>
				</Route>
				{/* 如果没有匹配成功, 走这个路由 */}
				<Route path="*" element={<NotFound />}></Route>
			</Routes>
		</BrowserRouter>
	);
}
export default App;
```

```jsx
// src\Layout.jsx
import { Outlet } from "react-router-dom";

function Layout() {
	return (
		<div>
			layout
			{/* 二级路由的出口 */}
			<Outlet></Outlet>
		</div>
	);
}
export default Layout;
```

```jsx
// src\Board.jsx
function Board() {
	return <div>Board</div>;
}
export default Board;
```

```jsx
// src\Article.jsx
function Article() {
	return <div>Article</div>;
}
export default Article;
```

```jsx
// src\NotFound.jsx
function NotFound() {
	return <div>NotFound</div>;
}
export default NotFound;
```

> 如果想做成集中式路由配置, 需要进行如下修改

```jsx
// src\App.jsx

import { BrowserRouter, Route, Routes, useRoutes } from "react-router-dom";
import Article from "./Article";
import Board from "./Board";
import Layout from "./Layout";
import NotFound from "./NotFound";

// 1. 准备一个路由数组 数组中定义所有的路由对应关系
const routesList = [
	{
		path: "/",
		element: <Layout />,
		children: [
			{
				element: <Board />,
				index: true, // index设置为true 变成默认的二级路由
			},
			{
				path: "article",
				element: <Article />,
			},
		],
	},
	// 增加n个路由对应关系
	{
		path: "*",
		element: <NotFound />,
	},
];

// 2. 使用useRoutes方法传入routesList生成Routes组件
function WrapperRoutes() {
	let element = useRoutes(routesList);
	return element;
}

function App() {
	return (
		<BrowserRouter>
			{/* 3. 替换之前的Routes组件 */}
			<WrapperRoutes />
		</BrowserRouter>
	);
}
export default App;
```

![](https://markdown-1253389072.cos.ap-nanjing.myqcloud.com/202212241623621.gif)

