# 源码分析


## 架构工作流程介绍

![](https://user-images.githubusercontent.com/20950813/67635484-dfb5df80-f902-11e9-95d0-07ea1f151c2b.png)

微核架构（microkernel architecture）又称为"插件架构"（plug-in architecture），指的是软件的内核相对较小，主要功能和业务逻辑都通过插件实现

内核（core）通常只包含系统运行的最小功能。插件则是互相独立的，插件之间的通信，应该减少到最低，避免出现互相依赖的问题。

优点

良好的功能延伸性（extensibility），需要什么功能，开发一个插件即可

功能之间是隔离的，插件可以独立的加载和卸载，使得它比较容易部署，
可定制性高，适应不同的开发需要

可以渐进式地开发，逐步增加功能

缺点

扩展性（scalability）差，内核通常是一个独立单元，不容易做成分布式

开发难度相对较高，因为涉及到插件与内核的通信，以及内部的插件登记机制

前端领域比较典型的例子有webpack、babel、eslint、postCss等

## 生态包介绍

### @babel/core

@babel/core 这也是上面说的‘微内核’架构中的‘内核’。对于 Babel 来说，这个内核主要干这些事情：

*   加载和处理配置 (config)
*   加载插件
*   调用 Parser 进行语法解析，生成 AST
*   调用 Traverser 遍历 AST，并使用访问者模式应用'插件'对 AST 进行转换
*   生成代码，包括 SourceMap 转换和源代码生成

其依赖项：

``` js
    "@babel/code-frame": "^7.10.4",
    "@babel/generator": "^7.10.4",
    "@babel/helper-module-transforms": "^7.10.4",
    "@babel/helpers": "^7.10.4",
    "@babel/parser": "^7.10.4",
    "@babel/template": "^7.10.4",
    "@babel/traverse": "^7.10.4",
    "@babel/types": "^7.10.4",
    "convert-source-map": "^1.7.0",
    "debug": "^4.1.0",
    "gensync": "^1.0.0-beta.1",
    "json5": "^2.1.2",
    "lodash": "^4.17.13",
    "resolve": "^1.3.2",
    "semver": "^5.4.1",
    "source-map": "^0.5.0"
```

### @babel/parser

@babel/parser javascript 解析器，提供生成 AST 的方法，fork 于 acron；它已经内置支持很多语法. 例如 JSX、Typescript、Flow、以及最新的 ECMAScript 规范。目前为了执行效率，parser 是不支持扩展的，由官方进行维护。如果你要支持自定义语法，可以 fork 它，不过这种场景非常少。

### @babel/traverse

@babel/traverse 实现了访问者模式(具体可以参考[design - 设计模式（以Typescript描述）](https://omnipotent-front-end.github.io/-Design-Patterns-Typescript/#/visitor/index?id=babel%e6%8f%92%e4%bb%b6%e4%b8%ad%e5%af%b9ast%e7%9a%84%e6%93%8d%e4%bd%9c))，对 AST 进行遍历，转换插件会通过它获取感兴趣的 AST 节点，对节点继续操作。

基本用法如下：

``` js
import parser from "@babel/parser";
import traverse from "@babel/traverse";

const code = `function square(n) {
  return n * n;
}`;

const ast = parser.parse(code);

traverse(ast, {
  enter(path) {
    if (
      path.node.type === "Identifier" &&
      path.node.name === "n"
    ) {
      path.node.name = "x";
    }
  }
```




### @babel/generator

@babel/generator 将 AST 转换为源代码，支持 SourceMap。可以想象换一个generator后就可以将javascript转化为其他语言了。

### @babel/template

@babel/template： 某些场景直接操作 AST 太麻烦，就比如我们直接操作 DOM 一样，所以 Babel 实现了这么一个简单的模板引擎，可以将字符串代码转换为 AST。比如在生成一些辅助代码 (helper) 时会用到这个库


### @babel/types



@babel/types： AST 节点构造器和断言. 插件开发时使用很频繁


### @babel/helper-*

@babel/helper-*： 一些辅助器，用于辅助插件开发，例如简化 AST 操作


### @babel/helpers


@babel/helpers： 辅助代码，单纯的语法转换可能无法让代码运行起来，比如低版本浏览器无法识别 class 关键字，这时候需要添加辅助代码，对 class 进行模拟。

### @babel/node


@babel/node： Node.js CLI, 通过它直接运行需要 Babel 处理的 JavaScript 文件

### @babel.register

@babel/register： Patch NodeJs 的 require 方法，支持导入需要 Babel 处理的 JavaScript 模块


### @babel/cli

@babel/cli： CLI 工具


### @babel/preset-env

根据目标环境加载对应的 bable 语法转化插件及 polyfill；如果传入目标环境则，默认与 babel-preset-latest 的功能是一样的，如果传入了需要运行的目标环境，则会根据目标环境自动加载对应的 plugin

目标环境指的是代码需要运行的 web 或 node 环境，通过一个第三方的库 [compat-table](https://kangax.github.io/compat-table/es6/)，来判断某个语法 or 某个 api 目标环境是否一句支持，如果已支持则不加载对应的插件，如果不支持则加载对应的插件

我们以 targets >= ie9 及 targets >= edg15 来看下 babel 是怎样进行 polyfill 的处理

``` json
{
    "presets": [
        [
            "env",
            {
                "targets": {
                    "browsers": ["ie >= 9"],
                    // "browsers": ["ie >= edg15"],
                },
                "debug": true,
                "useBuiltIns": true,
            }
        ]
    ]
}


```

``` js

import "babel-polyfill";

const name = 'jack';

export const myName = `hi ${name}`

async function getName() {}

const index = [1, 3, 7, 9].findIndex((it) => {
    return it === 3
})

let x = 10 ** 2;

x **= 3;

class Person {}

var promise = new Promise;

Array.from(new Set([1, 4, 6]))


```

target >= 9 babel处理后的index.js

``` js

import "core-js/modules/es6.typed.array-buffer";
import "core-js/modules/es6.typed.data-view";
import "core-js/modules/es6.typed.int8-array";
import "core-js/modules/es6.typed.uint8-array";
import "core-js/modules/es6.typed.uint8-clamped-array";
import "core-js/modules/es6.typed.int16-array";
import "core-js/modules/es6.typed.uint16-array";
import "core-js/modules/es6.typed.int32-array";
import "core-js/modules/es6.typed.uint32-array";
import "core-js/modules/es6.typed.float32-array";
import "core-js/modules/es6.typed.float64-array";
import "core-js/modules/es6.map";
import "core-js/modules/es6.set";
import "core-js/modules/es6.weak-map";
import "core-js/modules/es6.weak-set";
import "core-js/modules/es6.reflect.apply";
import "core-js/modules/es6.reflect.construct";
import "core-js/modules/es6.reflect.define-property";
import "core-js/modules/es6.reflect.delete-property";
import "core-js/modules/es6.reflect.get";
import "core-js/modules/es6.reflect.get-own-property-descriptor";
import "core-js/modules/es6.reflect.get-prototype-of";
import "core-js/modules/es6.reflect.has";
import "core-js/modules/es6.reflect.is-extensible";
import "core-js/modules/es6.reflect.own-keys";
import "core-js/modules/es6.reflect.prevent-extensions";
import "core-js/modules/es6.reflect.set";
import "core-js/modules/es6.reflect.set-prototype-of";
import "core-js/modules/es6.promise";
import "core-js/modules/es6.symbol";
import "core-js/modules/es6.object.freeze";
import "core-js/modules/es6.object.seal";
import "core-js/modules/es6.object.prevent-extensions";
import "core-js/modules/es6.object.is-frozen";
import "core-js/modules/es6.object.is-sealed";
import "core-js/modules/es6.object.is-extensible";
import "core-js/modules/es6.object.get-own-property-descriptor";
import "core-js/modules/es6.object.get-prototype-of";
import "core-js/modules/es6.object.keys";
import "core-js/modules/es6.object.get-own-property-names";
import "core-js/modules/es6.object.assign";
import "core-js/modules/es6.object.is";
import "core-js/modules/es6.object.set-prototype-of";
import "core-js/modules/es6.function.name";
import "core-js/modules/es6.string.raw";
import "core-js/modules/es6.string.from-code-point";
import "core-js/modules/es6.string.code-point-at";
import "core-js/modules/es6.string.repeat";
import "core-js/modules/es6.string.starts-with";
import "core-js/modules/es6.string.ends-with";
import "core-js/modules/es6.string.includes";
import "core-js/modules/es6.regexp.flags";
import "core-js/modules/es6.regexp.match";
import "core-js/modules/es6.regexp.replace";
import "core-js/modules/es6.regexp.split";
import "core-js/modules/es6.regexp.search";
import "core-js/modules/es6.array.from";
import "core-js/modules/es6.array.of";
import "core-js/modules/es6.array.copy-within";
import "core-js/modules/es6.array.find";
import "core-js/modules/es6.array.find-index";
import "core-js/modules/es6.array.fill";
import "core-js/modules/es6.array.iterator";
import "core-js/modules/es6.number.is-finite";
import "core-js/modules/es6.number.is-integer";
import "core-js/modules/es6.number.is-safe-integer";
import "core-js/modules/es6.number.is-nan";
import "core-js/modules/es6.number.epsilon";
import "core-js/modules/es6.number.min-safe-integer";
import "core-js/modules/es6.number.max-safe-integer";
import "core-js/modules/es6.math.acosh";
import "core-js/modules/es6.math.asinh";
import "core-js/modules/es6.math.atanh";
import "core-js/modules/es6.math.cbrt";
import "core-js/modules/es6.math.clz32";
import "core-js/modules/es6.math.cosh";
import "core-js/modules/es6.math.expm1";
import "core-js/modules/es6.math.fround";
import "core-js/modules/es6.math.hypot";
import "core-js/modules/es6.math.imul";
import "core-js/modules/es6.math.log1p";
import "core-js/modules/es6.math.log10";
import "core-js/modules/es6.math.log2";
import "core-js/modules/es6.math.sign";
import "core-js/modules/es6.math.sinh";
import "core-js/modules/es6.math.tanh";
import "core-js/modules/es6.math.trunc";
import "core-js/modules/es7.array.includes";
import "core-js/modules/es7.object.values";
import "core-js/modules/es7.object.entries";
import "core-js/modules/es7.object.get-own-property-descriptors";
import "core-js/modules/es7.string.pad-start";
import "core-js/modules/es7.string.pad-end";
import "core-js/modules/web.timers";
import "core-js/modules/web.immediate";
import "core-js/modules/web.dom.iterable";
import "regenerator-runtime/runtime";

var getName = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                    case "end":
                        return _context.stop();
                }
            }
        }, _callee, this);
    }));

    return function getName() {
        return _ref.apply(this, arguments);
    };
}();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var name = 'jack';

export var myName = "hi " + name;

var index = [1, 3, 7, 9].findIndex(function (it) {
    return it === 3;
});

var x = Math.pow(10, 2);

x = Math.pow(x, 3);

var Person = function Person() {
    _classCallCheck(this, Person);
};

var promise = new Promise();

Array.from(new Set([1, 4, 6]));
```


我们可以上面的例子明显的看出来，babel 会根据 targets 来加载 plugins 及 polyfills；ie9 肯定是不支持 es6 语法的，所以加载了很多的语法转化插件及 polyfills；而 edge15 已经差不多全部支持 es6 的语法了，所以基本没有加载什么插件及 polyfills，转化之后的代码变化也不大。


### @babel/polyfill

polyfill 为目标环境提供垫片，其内部引用的是 core-js 及 regenerator-runtime 这两个包；core-js 提供所有 es5+ api polyfill;regenerator-runtime 提供 generator polyfill

``` js
if (global._babelPolyfill) {
  throw new Error("only one instance of babel-polyfill is allowed");
}
global._babelPolyfill = true;

import "core-js/shim";
import "regenerator-runtime/runtime";
```
### @babel/runtime

为 @babel/plugin-transform-runtime 插件提供 helper 方法

会根据 @babel/plugin-transform-runtime 插件的 corejs 参数做不同的引入

```
false	npm install --save @babel/runtime
2	npm install --save @babel/runtime-corejs2
3	npm install --save @babel/runtime-corejs3


```

### @babel/plugin-transform-runtime（与 babel-runtime 配合使用）

plugin-transform-runtime 做 3 件事情

1.  引入 @babel/runtime/regenerator 插件，便于转化 generator 函数
2.  通过引入 corejs 来解决全局变量污染的问题
3.  将 helper 函数从外部引入，而不是每个需要的地方生成，减少重复代码




## 知识点


### 解析流程

一个完整的解析流程，是基于@babel/parser、@babel/traverse、@babel/generator共同来完成：

``` js

const babel =  require("@babel/core");
const generate = require('@babel/generator').default;

const code = `function square(n) {
    return n * n;
}`;

const ast = babel.parse(code);

babel.traverse(ast, {
  enter(path) {
    if (path.isIdentifier({ name: "n" })) {
      path.node.name = "x";
    }
  }
});

const output = generate(ast, { /* options */ }, code);

console.log('output', output.code)


```

``` js

const parser =  require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generate = require('@babel/generator').default;

const code = `function square(n) {
    return n * n;
}`;

const ast = parser.parse(code);

traverse(ast, {
  enter(path) {
    if (path.isIdentifier({ name: "n" })) {
      path.node.name = "x";
    }
  }
});

const output = generate(ast, { /* options */ }, code);

console.log('output', output.code)

// output function square(x) {
//  return x * x;
// }


```



### 插件的分类

babel 的插件分为两类

Syntax Plugins (语法插件) 这些插件只允许 Babel 解析特定类型的语法（不做代码转化）、转换插件自动启用语法插件。因此，如果已经使用了相应的转换插件，则无需指定语法插件；语法插件的命名 (@babel/plugin-syntax-*)：上面说了 @babel/parser 已经支持了很多 JavaScript 语法特性，Parser 也不支持扩展. 因此 plugin-syntax-* 实际上只是用于开启或者配置 Parser 的某个功能特性。

一般用户不需要关心这个，Transform 插件里面已经包含了相关的 plugin-syntax-* 插件了。用户也可以通过 parserOpts 配置项来直接配置 Parser

``` json
{
  "parserOpts": {
    "plugins": ["jsx", "flow"]
  }
}


```

Transform Plugins (转化插件) 用于对 AST 进行转换, 实现转换为 ES5 代码、压缩、功能增强等目的. Babel 仓库将转换插件划分为两种 (只是命名上的区别)：

@babel/plugin-transform-_： 普通的转换插件  
@babel/plugin-proposal-_： 还在'提议阶段'(非正式) 的语言特性, 目前有[这些](https://babeljs.io/docs/en/next/plugins#experimental)

特殊的插件 - 预设插件 (@babel/presets-*)： 插件集合或者分组，主要方便用户对插件进行管理和使用。比如 preset-env 含括所有的标准的最新特性; 再比如 preset-react 含括所有 react 相关的插件



### 插件的执行顺序

1.  Plugins run before Presets Plugins 插件顺序在 Presets 插件顺序之前执行
2.  Plugin ordering is first to last. // Plugins 插件从左至右依次执行
3.  Preset ordering is reversed (last to first) //Presets 插件从右至走依次执行

``` json
{
  "presets": ["es2015", "react", "stage-2"],
  "plugins": ["transform-decorators-legacy", "transform-class-properties"]
}
```


插件的执行顺序是 transform-decorators-legacy => transform-class-properties => stage-2 => react => es2015



所以我们在引入插件的时候一定要注意引入的插件是否有依赖关系


### 插件的开发


一个最基础的插件：

``` js
export default function (babel) {
  const { types: t } = babel;
  return {
    name: "ast-transform", // not required
    visitor: {
      Identifier(path, state) {
        path.node.name = path.node.name.split('').reverse().join('');
      }
    }
  };
}
```

基本上需要回传一个visitor对象，接收两个参数path和state。

path代表在traverse AST过程中，通过path.node取得目前的节点，也可以用path.parent取得父节点。
此外，path 还能通过path.traverse 來在原有的 visitor 內进行 nested visiting，這对于想要讓让visitor 在某个特定 visitor 执行后再执行时很有帮助。

state是一個贯穿整個 traverse 过程的 global state，你可以在任意阶段修改 state。其中也包含你想让使用 plugin 的使用者传入的 options 设定。


此处是通过访问者模式来完成插件的调用的，具体可以参考[design - 设计模式（以Typescript描述）](https://omnipotent-front-end.github.io/-Design-Patterns-Typescript/#/visitor/index?id=babel%e6%8f%92%e4%bb%b6%e4%b8%ad%e5%af%b9ast%e7%9a%84%e6%93%8d%e4%bd%9c)







-----

<p align="center">
  <a href="https://babeljs.io/">
    <img alt="babel" src="https://raw.githubusercontent.com/babel/logo/master/babel.png" width="546">
  </a>
</p>

<p align="center">
  The compiler for writing next generation JavaScript.
</p>

<p align="center">
  <a href="https://gitpod.io/#https://github.com/babel/babel"><img alt="Gitpod ready-to-code" src="https://img.shields.io/badge/Gitpod-ready--to--code-blue?logo=gitpod"></a>
</p>
<p align="center">
    <a href="https://www.npmjs.com/package/@babel/core"><img alt="v7 npm Downloads" src="https://img.shields.io/npm/dm/@babel/core.svg?maxAge=43200&label=v7%20downloads"></a>
  <a href="https://www.npmjs.com/package/babel-core"><img alt="v6 npm Downloads" src="https://img.shields.io/npm/dm/babel-core.svg?maxAge=43200&label=v6%20downloads"></a>
</p>
<p align="center">
  <a href="https://travis-ci.com/babel/babel"><img alt="Travis Status" src="https://img.shields.io/travis/com/babel/babel/main.svg?label=travis&maxAge=43200"></a>
  <a href="https://circleci.com/gh/babel/babel"><img alt="CircleCI Status" src="https://img.shields.io/circleci/project/github/babel/babel/main.svg?label=circle&maxAge=43200"></a>
  <a href="https://codecov.io/github/babel/babel"><img alt="Coverage Status" src="https://img.shields.io/codecov/c/github/babel/babel/main.svg?maxAge=43200"></a>
  <a href="https://slack.babeljs.io/"><img alt="Slack Status" src="https://slack.babeljs.io/badge.svg"></a>
  <a href="https://twitter.com/intent/follow?screen_name=babeljs"><img alt="Follow on Twitter" src="https://img.shields.io/twitter/follow/babeljs.svg?style=social&label=Follow"></a>
</p>

<h2 align="center">Supporting Babel</h2>

<p align="center">
  <a href="#backers"><img alt="Backers on Open Collective" src="https://opencollective.com/babel/backers/badge.svg" /></a>
  <a href="#sponsors"><img alt="Sponsors on Open Collective" src="https://opencollective.com/babel/sponsors/badge.svg" /></a>
  <a href="https://medium.com/friendship-dot-js/i-peeked-into-my-node-modules-directory-and-you-wont-believe-what-happened-next-b89f63d21558"><img alt="Business Strategy Status" src="https://img.shields.io/badge/business%20model-flavortown-green.svg"></a>
</p>

Babel (pronounced ["babble"](https://soundcloud.com/sebmck/how-to-pronounce-babel))  is a community-driven project used by many companies and projects, and is maintained by a group of [volunteers](https://babeljs.io/team). If you'd like to help support the future of the project, please consider:

- Giving developer time on the project. (Message us on [Twitter](https://twitter.com/babeljs) or [Slack](https://slack.babeljs.io/) for guidance!)
- Giving funds by becoming a sponsor on [Open Collective](https://opencollective.com/babel) or [Patreon](https://www.patreon.com/henryzhu)!

## Sponsors

Our top sponsors are shown below! [[Become a sponsor](https://opencollective.com/babel#sponsor)]

<a href="https://opencollective.com/babel/sponsor/0/website" target="_blank"><img src="https://opencollective.com/babel/sponsor/0/avatar.svg"></a>
<a href="https://opencollective.com/babel/sponsor/1/website" target="_blank"><img src="https://opencollective.com/babel/sponsor/1/avatar.svg"></a>
<a href="https://opencollective.com/babel/sponsor/2/website" target="_blank"><img src="https://opencollective.com/babel/sponsor/2/avatar.svg"></a>
<a href="https://opencollective.com/babel/sponsor/3/website" target="_blank"><img src="https://opencollective.com/babel/sponsor/3/avatar.svg"></a>
<a href="https://opencollective.com/babel/sponsor/4/website" target="_blank"><img src="https://opencollective.com/babel/sponsor/4/avatar.svg"></a>
 <a href="https://opencollective.com/babel/sponsor/5/website" target="_blank"><img src="https://opencollective.com/babel/sponsor/5/avatar.svg"></a>
  <a href="https://opencollective.com/babel/sponsor/6/website" target="_blank"><img src="https://opencollective.com/babel/sponsor/6/avatar.svg"></a>
  <a href="https://opencollective.com/babel/sponsor/7/website" target="_blank"><img src="https://opencollective.com/babel/sponsor/7/avatar.svg"></a>
  <a href="https://opencollective.com/babel/sponsor/8/website" target="_blank"><img src="https://opencollective.com/babel/sponsor/8/avatar.svg"></a>
  <a href="https://opencollective.com/babel/sponsor/9/website" target="_blank"><img src="https://opencollective.com/babel/sponsor/9/avatar.svg"></a>
  <a href="https://opencollective.com/babel/sponsor/10/website" target="_blank"><img src="https://opencollective.com/babel/sponsor/10/avatar.svg"></a>
  <a href="https://opencollective.com/babel/sponsor/11/website" target="_blank"><img src="https://opencollective.com/babel/sponsor/11/avatar.svg"></a>
  <a href="https://opencollective.com/babel/sponsor/12/website" target="_blank"><img src="https://opencollective.com/babel/sponsor/12/avatar.svg"></a>
  <a href="https://opencollective.com/babel/sponsor/13/website" target="_blank"><img src="https://opencollective.com/babel/sponsor/13/avatar.svg"></a>
  <a href="https://opencollective.com/babel/sponsor/14/website" target="_blank"><img src="https://opencollective.com/babel/sponsor/14/avatar.svg"></a>

## Intro

Babel is a tool that helps you write code in the latest version of JavaScript. When your supported environments don't support certain features natively, Babel will help you compile those features down to a supported version.

**In**

```js
// ES2020 nullish coalescing
function greet(input) {
  return input ?? "Hello world";
}
```

**Out**

```js
function greet(input) {
  return input != null ? input : "Hello world";
}
```

Try it out at our [REPL](https://babel.dev/repl#?browsers=defaults%2C%20not%20ie%2011&loose=true&code_lz=GYVwdgxgLglg9mABAcwE4FN1QBQzABxCgEpEBvAKEUQyhFST0KkQH5XEAiACXQBs-cRAHc4qPgBNOAbgoBfIA&shippedProposals=true&sourceType=script&lineWrap=true&presets=env%2Cenv&prettier=true).

## FAQ

### Who maintains Babel?

Mostly a handful of volunteers, funded by you! Please check out our [team page](https://babeljs.io/team)!

### Is there a Babel song?

I'm so glad you asked: [Hallelujah —— In Praise of Babel](SONG.md) by [@angus-c](https://github.com/angus-c), [audio version](https://youtu.be/40abpedBKK8) by [@swyx](https://twitter.com/@swyx). Tweet us your recordings!

### Looking for support?

For questions and support please join our [Slack Community](https://slack.babeljs.io/) (you can sign-up [here](https://slack.babeljs.io/) for an invite), ask a question on [Stack Overflow](https://stackoverflow.com/questions/tagged/babeljs), or ping us on [Twitter](https://twitter.com/babeljs).

### Where are the docs?

Check out our website: [babeljs.io](https://babeljs.io/), and report issues/features at [babel/website](https://github.com/babel/website/issues).

### Want to report a bug or request a feature?

Please read through our [CONTRIBUTING.md](CONTRIBUTING.md) and fill out the issue template at [babel/issues](https://github.com/babel/babel/issues)!

### Want to contribute to Babel?

Check out:

- Our [#development](https://babeljs.slack.com/messages/development) Slack channel and say hi ([signup](https://slack.babeljs.io))!
- Issues with the [good first issue](https://github.com/babel/babel/labels/good%20first%20issue) and [help wanted](https://github.com/babel/babel/labels/help%20wanted) label. We suggest also looking at the [closed ones](https://github.com/babel/babel/issues?utf8=%E2%9C%93&q=is%3Aclosed+label%3A%22good+first+issue%22) to get a sense of the kinds of issues you can tackle.

Some resources:

- Our [CONTRIBUTING.md](CONTRIBUTING.md) to get started with setting up the repo.
- Our discussions/notes/roadmap: [babel/notes](https://github.com/babel/notes)
- Our progress on TC39 proposals: [babel/proposals](https://github.com/babel/proposals)
- Our blog which contains release posts and explanations: [/blog](https://babeljs.io/blog)
- Our videos page with talks about open source and Babel: [/videos](https://babeljs.io/videos)
- Our [podcast](https://podcast.babeljs.io)

### How is the repo structured?

The Babel repo is managed as a [monorepo](doc/design/monorepo.md) that is composed of many [npm packages](packages/README.md).

## License

[MIT](LICENSE)
