---
title: 使用Yargs构建命令行工具
sidebar_label: 使用Yargs构建命令行工具
hide_title: true
sidebar_position: 14
---
## 预准备
在学习本节课之前你需要阅读以下文档

- [yargs官网文档](http://yargs.js.org/docs/)或[3R教室的yargs翻译](https://3rcd.com/wiki/yargs/example)(版本较老，建议尽量看官网英文原版)
- [Bun在TS中的基本使用](https://bun.sh/docs/typescript)
## 预装库

- `yargs`是一个构建命令行的工具
- `cross-env`用于跨平台指定环境变量
- `bun`是一个高性能的新型node解析器，能直接快速运行`.ts`源码

```bash
pnpm add yargs bun
pnpm add cross-env @types/yargs bun-types -D
```

## 类型

首先，我们把这节课的所有类型先编写好，这样后续写功能就会比较流畅了

### Bun类型

在Typescript中使用bun需要把它的类型放到`tsconfig.json`中，同时为了避免jest测试代码报错，把jest的类型也放进去

```typescript
{
    "compilerOptions": {
      ...
      "types": ["bun-types", "@types/jest"]
    }
...
}
```

### 命令选项

因为在命令中需要启动一个nestjs实例，对于一些即时运行的命令，比如数据迁移等，需要在运行后退出进程。否则，虽然就算实例关闭了，命令窗口还会卡在那边，因为进程没有结束掉

所以，除了继承yargs默认的`CommandModule`**命令模块**选项外，还需要添加一个`instant`用于设置瞬时命令

```typescript
// src/modules/core/types.ts
export interface CommandOption<T = RecordAny, U = RecordAny> extends CommandModule<T, U> {
    /**
     * 是否为执行后即退出进程的瞬时应用
     */
    instant?: boolean;
}
```

### 命令构造器

该类型是命令构造函数的类型，这个函数在执行后将生成一个yargs命令模块，在参数中传入`app`，它包含了

- 当前运行的nest实例:`container`
- 配置模块实例: `configure`
- 以及所有的命令模块: `commands`

```typescript
// src/modules/core/types.ts
export type CommandItem<T = Record<string, any>, U = Record<string, any>> = (
    app: Required<App>,
) => Promise<CommandOption<T, U>>;
```

### 命令选项

这是命令构造器的列表数组类型

```typescript
// src/modules/core/types.ts
export type CommandCollection = Array<CommandItem<any, any>>;
```

### 应用创建选项

改造一下应用创建参数类型，加个构造器列表生成函数类型

```typescript
/**
 * 创建应用的选项参数
 */
export interface CreateOptions {
    ...
    /**
     * 应用命令
     */
    commands: () => CommandCollection;
}
```

### App对象类型

同样地，给APP类型也添加一个命令类型，当然这边的命令是已经同构命令构造函数生成可直接传入yargs使用的命令模块

```typescript
// src/modules/core/types.ts
export type App = {
    // 应用容器实例
    container?: NestFastifyApplication;
    // 配置中心实例
    configure: Configure;
    // 命令列表
    commands: CommandModule<RecordAny, RecordAny>[];
};
```

## 函数

下面我们开始为我们的Nest应用添加自定义命令功能

### 创建命令

1. 根据传入的命令构建函数生成函数获取命令构造器列表
2. 执行所有的命令构造器函数，并为每个函数传入`app`参数，获取所有的yargs命令模块
3. 遍历这些命令模块，改造执行器函数。首先关闭container实例，然后执行命令执行器，最后判断如果是瞬时命令就退出进程

```typescript
// src/modules/core/helpers/command.ts
export async function createCommands(
    factory: () => CommandCollection,
    app: Required<App>,
): Promise<CommandModule<any, any>[]> {
    const collection: CommandCollection = [...factory()];
    const commands = await Promise.all(collection.map(async (command) => command(app)));
    return commands.map((command) => ({
        ...command,
        handler: async (args: Arguments<RecordAny>) => {
            await app.container.close();
            await command.handler(args);
            if (command.instant) process.exit();
        },
    }));
}
```

### CLI构建

该函数用于构建CLI命令，使用生成的命令模块绑定yargs即可

```typescript
// src/modules/core/helpers/command.ts
export async function buildCli(creator: () => Promise<App>) {
    const app = await creator();
    const bin = yargs(hideBin(process.argv));
    app.commands.forEach((command) => bin.command(command));
    bin.usage('Usage: $0 <command> [args]')
        .scriptName('cli')
        .demandCommand(1, '')
        .fail((msg, err, y) => {
            if (!msg && !err) {
                bin.showHelp();
                process.exit();
            }
            if (msg) console.error(chalk.red(msg));
            if (err) console.error(chalk.red(err.message));
            process.exit();
        })
        .strict()
        .alias('v', 'version')
        .help('h')
        .alias('h', 'help')
        .parse();
}


export * from './app';
export * from './utils';
export * from './command';
```

### 演示命令

我们编写一个模拟命令来看一下效果

```typescript
// src/modules/core/commands/types.ts
export type StartCommandArguments = {
    /**
     * 是否监控,所有环境都可以使用(但在非PM2启动的生产环境下此选项无效)
     */
    watch?: boolean;
};

// src/modules/core/commands/start.command.ts
export const createStartCommand: CommandItem<any, StartCommandArguments> = async (app) => ({
    command: ['start', 's'],
    describe: 'Start app',
    builder: {
        watch: {
            type: 'boolean',
            alias: 'w',
            describe: ' Run in watch mode (live-reload).',
            default: false,
        },
    },
    handler: async (args: yargs.Arguments<StartCommandArguments>) => {
        const { configure } = app;
        const appName = await configure.get<string>('app.name');
        const watching = args.watch ? ' and watching' : '';
        console.log(`String app ${appName}${watching}`);
    },
});

// src/modules/core/commands/index.ts
export * from './start.command';
```

### 导入命令

命令编写完后需要导入后才能生效，这边我们直接把命令放在`createCommands`

:::info

后续非`CoreModule`核心命令的其他模块命令可以在外部的应用创建时传入

:::

```typescript
// src/modules/core/helpers/command.ts
export async function createCommands(
    factory: () => CommandCollection,
    app: Required<App>,
): Promise<CommandModule<any, any>[]> {
    const collection: CommandCollection = [...factory(), ...Object.values(coreCommands)];
    ...
}
```

## 运行时

要让命令跑起来，我们还需要编写一个运行命令的bin文件

### 编写BIN

这里的`#!/usr/bin/env node`用于在应用编译后，直接可以通过文件使用`./dist/console/bin.js`去运行命令，而不需要`node ./dist/console/bin.js`或者`bun ./dist/console/bin.js`去运行。不过我们后面都是用bun直接运行ts源码命令，所以在此处作用不大

这个文件用于创建一个app的创建器，并传入`buildCli`，这样就可以使用yargs构建一个命令工具了

```typescript
// src/console/bin.ts
#!/usr/bin/env node

import { createOptions } from '@/constants';

import { buildCli, createApp } from '../modules/core/helpers';

buildCli(createApp(createOptions));
```

### 添加脚本

最后在`package.json`中添加一个脚本命令，使用`bun`来直接运行`bin.ts`

:::tip

注意: 这里的`--bun`参数用于透传bun运行时，因为如果运行编译后带有`#!/usr/bin/env node`的js文件可能会自动切换到node运行时。所以为了使用bun运行，必须加上这个参数。但是在此处直接运行ts文件，则不会有任何影响

:::

:::note

经测试后，最新版的bun运行nestjs代码无任何问题

:::

```typescript
{
  "scripts": {
        "cli": "./node_modules/bun/bin/bun --bun ./console/bin.ts",
       ...
    },
}
```

## 效果

运行`pnpm cli -h`可以看到我们刚才添加的命令已经存在了

![](https://img.pincman.com/media/202310210619521.png)

运行`pnpm cli start`或`pnpm cli s`输出应用名称

![](https://img.pincman.com/media/202310210620409.png)
