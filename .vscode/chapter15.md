---
title: 整合bun与pm2实现开发环境与生产环境免编译和自启
sidebar_label: 整合Bun+PM2运行Nestjs应用
hide_title: true
sidebar_position: 15
---

:::note
本文档文字解释部分更新中,当前为代码实现步骤版本
:::

## 预准备

在学习本节课之前你需要阅读以下文档

- [pm2文档](https://pm2.keymetrics.io/docs/usage/pm2-api/)
- [bun文档](https://bun.sh/)
## 预装库

- `pm2`是一个在生产环境下运行后台运行node或者其他应用的工具

```bash
pnpm add pm2 ora@5 chokidar
```

package.json

```json
   "pnpm": {
        "updateConfig": {
            "ignoreDependencies": [
                "find-up",
                "chalk",
                "ora"
            ]
        }
    }
```

修改`PanicOption`类型

```typescript
/**
 * 控制台错误函数panic的选项参数
 */
export interface PanicOption {
    /**
     * 报错消息
     */
    message?: string;
    /**
     * ora对象
     */
    spinner?: Ora;
    /**
     * 抛出的异常信息
     */
    error?: any;
    /**
     * 是否退出进程
     */
    exit?: boolean;
}
```

## 启动命令

### 正常启动

#### 类型

```typescript
/* eslint-disable import/no-extraneous-dependencies */
import { SpawnOptions as NodeSpawnOptions } from 'child_process';
import { Configuration as NestCLIConfig } from '@nestjs/cli/lib/configuration';
import type { SpawnOptions as BunSpawnOptions } from 'bun';
import ts from 'typescript';


/**
 * CLI运行配置
 */
export interface CLIConfig {
    options: {
        ts: ts.CompilerOptions;
        nest: NestCLIConfig;
    };
    paths: Record<'cwd' | 'dist' | 'src' | 'js' | 'ts' | 'bun' | 'nest', string>;
    subprocess: {
        bun: BunSpawnOptions.OptionsObject;
        node: NodeSpawnOptions;
    };
}

export type StartCommandArguments = {
    /**
     * nest-cli.json的文件路径(相对于当前运行目录)
     */
    nestConfig?: string;
    /**
     * 用于编译和运行的tsconfig.build.json的文件路径(相对于当前运行目录)
     */
    tsConfig?: string;
    /**
     * 使用直接运行TS文件的入口文件,默认为main.ts
     * 如果是运行js文件,则通过nest-cli.json的entryFile指定
     */
    entry?: string;

    /**
     * 是否使用PM2后台静默启动生产环境
     */
    prod?: boolean;

    /**
     * 使用直接运行TS文件,这个配置只针对生产环境下是否通过
     */
    typescript?: boolean;

    /**
     * 是否监控,所有环境都可以使用(但在非PM2启动的生产环境下此选项无效)
     */
    watch?: boolean;

    /**
     * 是否开启debug模式,只对非生产环境有效
     */
    debug?: boolean | string;

    /**
     * 是否重启应用(PM2进程)
     */
    restart?: boolean;
};
```

#### 命令结构

```typescript
export const createStartCommand: CommandItem<any, StartCommandArguments> = async (app) => ({
    command: ['start', 's'],
    describe: 'Start app',
    builder: {
        nestConfig: {
            type: 'string',
            alias: 'n',
            describe: 'nest cli config file path.',
            default: 'nest-cli.json',
        },
        tsConfig: {
            type: 'string',
            alias: 't',
            describe: 'typescript config file path.',
            default: 'tsconfig.build.json',
        },
        entry: {
            type: 'string',
            alias: 'e',
            describe:
                'Specify entry file for ts runner, you can specify js entry file in nest-cli.json by entryFile.',
            default: 'main.ts',
        },
        prod: {
            type: 'boolean',
            alias: 'p',
            describe: 'Start app in production by pm2.',
            default: false,
        },
        restart: {
            type: 'boolean',
            alias: 'r',
            describe: 'Retart app(only pm2),pm2 will auto run start if process not exists.',
            default: false,
        },
        typescript: {
            type: 'boolean',
            alias: 'ts',
            describe: 'Run the .ts file directly.',
            default: true,
        },
        watch: {
            type: 'boolean',
            alias: 'w',
            describe: ' Run in watch mode (live-reload).',
            default: false,
        },
        debug: {
            type: 'boolean',
            alias: 'd',
            describe: 'Whether to enable debug mode, only valid for non-production environments',
            default: false,
        },
    },
    handler: async (args: Arguments<StartCommandArguments>) => {
        // 此处编写命令处理器
    },
});
```

#### 执行路径

```typescript
/**
 * 执行路径(应用根目录)
 */
const cwdPath = resolve(__dirname, '../../../../..');
```

#### 启动配置

```typescript
/* eslint-disable import/no-extraneous-dependencies */
import { Configuration as NestCLIConfig } from '@nestjs/cli/lib/configuration';
import ts from 'typescript';

/**
 * 获取CLI的运行配置
 * @param tsConfigFile
 * @param nestConfigFile
 * @param tsEntryFile
 */
export const getCLIConfig = (
    tsConfigFile: string,
    nestConfigFile: string,
    tsEntryFile?: string,
): CLIConfig => {
    let tsConfig: ts.CompilerOptions = {};
    const tsConfigPath = join(cwdPath, tsConfigFile);

    if (!existsSync(tsConfigPath)) panic(`ts config file '${tsConfigPath}' not exists!`);
    try {
        const allTsConfig = JSON.parse(readFileSync(tsConfigPath, 'utf-8'));
        tsConfig = get(allTsConfig, 'compilerOptions', {});
    } catch (error) {
        panic({ error });
    }
    let nestConfig: NestCLIConfig = {};
    const nestConfigPath = join(cwdPath, nestConfigFile);
    if (!existsSync(nestConfigPath)) panic(`nest cli config file '${nestConfigPath}' not exists!`);
    try {
        nestConfig = JSON.parse(readFileSync(nestConfigPath, 'utf-8'));
    } catch (error) {
        panic({ error });
    }
    const dist = get(tsConfig, 'outDir', 'dist');
    const src = get(nestConfig, 'sourceRoot', 'src');
    const paths = {
        cwd: cwdPath,
        dist,
        src,
        js: join(dist, nestConfig.entryFile ?? 'main.js'),
        ts: join(src, tsEntryFile ?? 'main.ts'),
        bun: './node_modules/bun/bin/bun',
        nest: './node_modules/@nestjs/cli/bin/nest.js',
    };

    return {
        options: {
            ts: tsConfig,
            nest: nestConfig,
        },
        paths,
        subprocess: {
            bun: {
                cwd: cwdPath,
                stdout: 'inherit',
                env: process.env,
                onExit: (proc) => {
                    proc.kill();
                    if (!isNil(proc.exitCode)) exit(0);
                },
            },
            node: {
                cwd: cwdPath,
                env: process.env,
                stdio: 'inherit',
            },
        },
    };
};
```

#### 启动函数

```typescript
export const start = async (args: Arguments<StartCommandArguments>, config: CLIConfig) => {
    const script = args.typescript ? config.paths.ts : config.paths.js;
    const params = [config.paths.bun, 'run'];
    if (args.watch) params.push('--watch');
    if (args.debug) {
        const inspectFlag =
            typeof args.debug === 'string' ? `--inspect=${args.debug}` : '--inspect';
        params.push(inspectFlag);
    }
    params.push(script);
    let child: Subprocess;
    if (args.watch) {
        const restart = () => {
            if (!isNil(child)) child.kill();
            child = Bun.spawn(params, config.subprocess.bun);
        };
        restart();
    } else {
        Bun.spawn(params, {
            ...config.subprocess.bun,
            onExit(proc) {
                proc.kill();
                process.exit(0);
            },
        });
    }
};
```

### PM2启动

#### 类型

修改`AppConfig`，这样就可以在`config/app.config.ts`自定义一些pm2的配置了

```typescript
import { StartOptions } from 'pm2';

export interface AppConfig {
    ...

    /**
     * PM2配置
     */
    pm2?: Omit<StartOptions, 'name' | 'cwd' | 'script' | 'args' | 'interpreter' | 'watch'>;
}

```

选项参数

```typescript
export type Pm2Option = Pick<StartCommandArguments, 'typescript' | 'watch'> & {
    command: string;
};
```

#### PM2配置

```typescript
export const getPm2Config = async (
    configure: Configure,
    option: Pm2Option,
    config: CLIConfig,
    script: string,
): Promise<StartOptions> => {
    const { name, pm2: customConfig = {} } = await configure.get<AppConfig>('app');
    const defaultConfig: StartOptions = {
        name,
        cwd: cwdPath,
        script,
        args: option.command,
        autorestart: true,
        watch: option.watch,
        ignore_watch: ['node_modules'],
        env: process.env,
        exec_mode: 'fork',
        interpreter: config.paths.bun,
    };
    return deepMerge(
        defaultConfig,
        omit(customConfig, ['name', 'cwd', 'script', 'args', 'watch', 'interpreter']),
        'replace',
    );
};
```

#### 启动函数

```typescript
export const startPM2 = async (
    configure: Configure,
    args: Arguments<StartCommandArguments>,
    config: CLIConfig,
) => {
    const { name } = await configure.get<AppConfig>('app');
    const script = args.typescript ? config.paths.ts : config.paths.js;
    const pm2Config = await getPm2Config(
        configure,
        {
            command: 'start',
            ...pick(args, ['watch', 'typescript']),
        },
        config,
        script,
    );
    if (pm2Config.exec_mode === 'cluster' && args.typescript) {
        console.log(
            chalk.yellowBright(
                'Cannot directly use bun to run ts code in cluster mode, so it will automatically change to fork mode.',
            ),
        );
        console.log();
        console.log(
            chalk.bgCyanBright(
                chalk.blackBright(
                    'If you really need the app to be started in cluster mode, be sure to compile it into js first, and then add the --no-ts arg when running',
                ),
            ),
        );
        console.log();
        pm2Config.exec_mode = 'fork';
    }
    const connectCallback = (error?: any) => {
        if (!isNil(error)) {
            console.error(error);
            process.exit(2);
        }
    };
    const startCallback = (error?: any) => {
        if (!isNil(error)) {
            console.error(error);
            exit(1);
        }
        pm2.disconnect();
    };
    const restartCallback = (error?: any) => {
        if (!isNil(error)) {
            pm2.start(pm2Config, (serr) => startCallback(serr));
        } else {
            pm2.disconnect();
        }
    };

    pm2.connect((cerr) => {
        connectCallback(cerr);
        args.restart
            ? pm2.restart(name, restartCallback)
            : pm2.start(pm2Config, (serr) => startCallback(serr));
    });
};
```

### 处理器

```typescript
export const createStartCommand: CommandItem<any, StartCommandArguments> = async (app) => ({
    ...
    handler: async (args: Arguments<StartCommandArguments>) => {
        const { configure } = app;
        const config = getCLIConfig(args.tsConfig, args.nestConfig, args.entry);
        if (args.prod || args.restart) await startPM2(configure, args, config);
        else await start(args, config);
    },
});
```

### 静态资源

#### Nest CLI配置

执行`mdkir src/assets`

```json
{
    "$schema": "https://json.schemastore.org/nest-cli",
    "collection": "@nestjs/schematics",
    "sourceRoot": "src",
    "compilerOptions": {
        "assets": ["assets/**/*"],
        ...
    }
}
```

#### 资源管理

```typescript
export class Asset {
    private watchAssetsKeyValue: { [key: string]: boolean } = {};

    private watchers: chokidar.FSWatcher[] = [];

    private actionInProgress = false;

    closeWatchers() {
        const timeoutMs = 500;
        const closeFn = () => {
            if (this.actionInProgress) {
                this.actionInProgress = false;
                setTimeout(closeFn, timeoutMs);
            } else {
                this.watchers.forEach((watcher) => watcher.close());
            }
        };

        setTimeout(closeFn, timeoutMs);
    }

    watchAssets(config: CLIConfig, codePath: string, changer: () => void) {
        const assets = get(config.options.nest, 'compilerOptions.assets', []) as AssetEntry[];

        if (assets.length <= 0) {
            return;
        }

        try {
            const isWatchEnabled = toBoolean(get(config, 'watchAssets', 'src'));
            const filesToWatch = assets.map<AssetEntry>((item) => {
                if (typeof item === 'string') {
                    return {
                        glob: join(codePath, item),
                    };
                }
                return {
                    glob: join(codePath, item.include!),
                    exclude: item.exclude ? join(codePath, item.exclude) : undefined,
                    flat: item.flat, // deprecated field
                    watchAssets: item.watchAssets,
                };
            });

            for (const item of filesToWatch) {
                const option: ActionOnFile = {
                    action: 'change',
                    item,
                    path: '',
                    sourceRoot: codePath,
                    watchAssetsMode: isWatchEnabled,
                };

                const watcher = chokidar
                    .watch(item.glob, { ignored: item.exclude })
                    .on('add', (path: string) =>
                        this.actionOnFile({ ...option, path, action: 'change' }, changer),
                    )
                    .on('change', (path: string) =>
                        this.actionOnFile({ ...option, path, action: 'change' }, changer),
                    )
                    .on('unlink', (path: string) =>
                        this.actionOnFile({ ...option, path, action: 'unlink' }, changer),
                    );

                this.watchers.push(watcher);
            }
        } catch (err) {
            throw new Error(
                `An error occurred during the assets copying process. ${(err as any).message}`,
            );
        }
    }

    protected actionOnFile(option: ActionOnFile, changer: () => void) {
        const { action, item, path, watchAssetsMode } = option;
        const isWatchEnabled = watchAssetsMode || item.watchAssets;

        if (!isWatchEnabled && this.watchAssetsKeyValue[path]) {
            return;
        }
        this.watchAssetsKeyValue[path] = true;
        this.actionInProgress = true;

        if (action === 'change') changer();
    }
}
```

#### 监控资源

```typescript
export const start = async (args: Arguments<StartCommandArguments>, config: CLIConfig) => {
    if (args.watch) {
        const asseter = new Asset();
        const restart = () => {
            if (!isNil(child)) child.kill();
            child = Bun.spawn(params, config.subprocess.bun);
        };
        restart();
        asseter.watchAssets(config, codePath, restart);
        process.on('exit', () => {
            child.kill();
            asseter.closeWatchers();
            process.exit(0);
        });
    }
};
```

### Swagger插件

#### 数据生成

```typescript
/* eslint-disable import/no-extraneous-dependencies */
import { join } from 'path';

import { PluginMetadataGenerator } from '@nestjs/cli/lib/compiler/plugins';
import { ReadonlyVisitor } from '@nestjs/swagger/dist/plugin';
import { PluginOptions } from '@nestjs/swagger/dist/plugin/merge-options';
import { get, isNil } from 'lodash';
import { Arguments } from 'yargs';

import { CLIConfig, StartCommandArguments } from '../types';

export const generateSwaggerMetadata = (
    args: Arguments<StartCommandArguments>,
    config: CLIConfig,
    watch: boolean,
) => {
    const cliPlugins = get(config.options.nest, 'compilerOptions.plugins', []) as (
        | string
        | RecordAny
    )[];
    const swaggerPlugin = cliPlugins.find(
        (item) => item === '@nestjs/swagger' || (item as any).name === '@nestjs/swagger',
    );
    if (!isNil(swaggerPlugin) && args.typescript) {
        const srcPath = join(config.paths.cwd, config.paths.src);
        const generator = new PluginMetadataGenerator();
        let swaggerPluginOption: PluginOptions = {};
        if (typeof swaggerPlugin !== 'string' && 'options' in swaggerPlugin) {
            swaggerPluginOption = swaggerPlugin.options;
        }
        generator.generate({
            visitors: [new ReadonlyVisitor({ ...swaggerPluginOption, pathToSource: srcPath })],
            outputDir: srcPath,
            watch,
            tsconfigPath: args.tsConfig,
            printDiagnostics: false,
        });
    }
};
```

#### 使用插件

```typescript
export const start = async (args: Arguments<StartCommandArguments>, config: CLIConfig) => {
    ...
    if (args.watch) {
        if (args.typescript) generateSwaggerMetadata(args, config, false);
        ...
    } else {
        if (args.typescript) generateSwaggerMetadata(args, config, false);
        ...
    }
};
      
export const startPM2 = async (
    configure: Configure,
    args: Arguments<StartCommandArguments>,
    config: CLIConfig,
) => {
    ...
    pm2.connect((cerr) => {
        connectCallback(cerr);
        generateSwaggerMetadata(args, config, false);
        args.restart
            ? pm2.restart(name, restartCallback)
            : pm2.start(pm2Config, (serr) => startCallback(serr));
    });
};
```

## 编译命令

### 类型

```typescript
export type BuildCommandArguments = Pick<StartCommandArguments, 'tsConfig' | 'nestConfig'> & {
    watch?: string;
    preserveWatchOutput?: boolean;
};
```

### 命令

```typescript
export const createBuildCommand: CommandItem<any, BuildCommandArguments> = async (app) => ({
    command: ['build', 'b'],
    describe: 'Build application by nest cli.',
    builder: {
        nestConfig: {
            type: 'string',
            alias: 'n',
            describe: 'nest cli config file path.',
            default: 'nest-cli.json',
        },
        tsConfig: {
            type: 'string',
            alias: 't',
            describe: 'typescript config file path.',
            default: 'tsconfig.build.json',
        },
        watch: {
            type: 'boolean',
            alias: 'w',
            describe: ' Run in watch mode (live-reload).',
            default: false,
        },
        preserveWatchOutput: {
            type: 'boolean',
            alias: 'po',
            describe: 'Use "preserveWatchOutput" option when using tsc watch mode',
            default: false,
        },
    },
    handler: async (args: Arguments<BuildCommandArguments>) => {
        const config = getCLIConfig(args.tsConfig, args.nestConfig);
        const params = ['build', '-c', args.nestConfig, '-p', args.tsConfig];
        if (args.watch) params.push('-w');
        if (args.preserveWatchOutput) params.push('po');
        const child = spawn(config.paths.nest, params, config.subprocess.node);
        child.on('exit', () => exit());
    },
});

export * from './build.command';
```

## 使用命令

### 添加脚本

```json
{
    "name": "nestapp",
    "version": "0.0.1",
    "description": "",
    "author": "",
    "private": true,
    "license": "UNLICENSED",
    "scripts": {
        "cli": "bun --bun src/console/bin.ts",
        "dev": "cross-env NODE_ENV=production pnpm cli start -w",
        "prod": "cross-env NODE_ENV=production pnpm cli start -w -p",
        "prodjs": "cross-env NODE_ENV=production pnpm cli start -w -p --no-ts",
        "reload": "cross-env NODE_ENV=production pnpm cli start -r",
        "build": "cross-env NODE_ENV=production pnpm cli build",
```

### 效果演示

![](https://img.pincman.com/media/202310211010705.png)

![](https://img.pincman.com/media/202310211011051.png)

![](https://img.pincman.com/media/202310211011555.png)
