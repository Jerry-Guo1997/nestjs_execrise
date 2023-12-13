---
title: 数据迁移功能的实现
sidebar_label: 数据迁移功能的实现
hide_title: true
sidebar_position: 16
---

:::note
本文档文字解释部分更新中,当前为代码实现步骤版本
:::

## 预准备

## 预装库

```bash
pnpm add @sqltools/formatter
```

## 应用改造

### 类型

```typescript
/**
 * 额外数据库选项,用于CLI工具
 */
type DbAdditionalOption = {
    paths?: {
        /**
         * 迁移文件路径
         */
        migration?: string;
    };
};

/**
 * 自定义数据库配置
 */
export type DbConfig = {
    common: Record<string, any> & DbAdditionalOption;
    connections: Array<TypeOrmModuleOptions & { name?: string } & DbAdditionalOption>;
};

/**
 * Typeorm连接配置
 */
export type TypeormOption = Omit<TypeOrmModuleOptions, 'name' | 'migrations'> & {
    name: string;
} & DbAdditionalOption;
```

### 默认配置

```typescript
/**
 * 创建数据库配置
 * @param options 自定义配置
 */
export const createDbOptions = (options: DbConfig) => {
    const newOptions: DbOptions = {
        common: deepMerge(
            {
                charset: 'utf8mb4',
                logging: ['error'],
                paths: {
                    migration: resolve(__dirname, '../../database/migrations'),
                },
            },
            options.common ?? {},
            'replace',
        ),
        connections: createConnectionOptions(options.connections ?? []),
    };
    newOptions.connections = newOptions.connections.map((connection) => {
        const entities = connection.entities ?? [];
        const newOption = { ...connection, entities };
        return deepMerge(
            newOptions.common,
            {
                ...newOption,
                autoLoadEntities: true,
                synchronize: false,
            } as any,
            'replace',
        ) as TypeormOption;
    });
    return newOptions;
};
```

### 模型添加

```typescript
/**
 * 在模块上注册entity
 * @param configure 配置类实例
 * @param entities entity类列表
 * @param dataSource 数据连接名称,默认为default
 */
export const addEntities = async (
    configure: Configure,
    entities: EntityClassOrSchema[] = [],
    dataSource = 'default',
) => {
    const database = await configure.get<DbOptions>('database');
    if (isNil(database)) throw new Error(`Typeorm have not any config!`);
    const dbConfig = database.connections.find(({ name }) => name === dataSource);
    if (isNil(dbConfig)) throw new Error(`Database connection named ${dataSource} not exists!`);
    const oldEntities = (dbConfig.entities ?? []) as ObjectLiteral[];
    /**
     * 更新数据库配置,添加上新的模型
     */
    configure.set(
        'database.connections',
        database.connections.map((connection) =>
            connection.name === dataSource
                ? {
                      ...connection,
                      entities: [...entities, ...oldEntities],
                  }
                : connection,
        ),
    );
    return TypeOrmModule.forFeature(entities, dataSource);
};
```

模块导入模型

```typescript
@Module({})
export class ContentModule {
    static async forRoot(configure: Configure) {
        ...
        return {
            module: ContentModule,
            imports: [
                addEntities(configure, Object.values(entities)),
                DatabaseModule.forRepository(Object.values(repositories)),
            ],
            providers,
            exports: [
                ...Object.values(services),
                PostService,
                DatabaseModule.forRepository(Object.values(repositories)),
            ],
        };
    }
}
```

## 创建迁移

### 类型

```typescript
/**
 * 基础数据库命令参数类型
 */
export type TypeOrmArguments = Arguments<{
    connection?: string;
}>;


/**
 * 创建迁移处理器选项
 */
export interface MigrationCreateOptions {
    name: string;
}

/**
 * 创建迁移命令参数
 */
export type MigrationCreateArguments = TypeOrmArguments & MigrationCreateOptions;
```

### 执行逻辑

```typescript
import path from 'path';

import chalk from 'chalk';

import { MigrationCreateOptions } from '../types';

const { CommandUtils } = require('typeorm/commands/CommandUtils');
const { PlatformTools } = require('typeorm/platform/PlatformTools');
const { camelCase } = require('typeorm/util/StringUtils');

type HandlerOptions = MigrationCreateOptions & { dir: string };
/**
 * Creates a new migration file.
 */
export class TypeormMigrationCreate {
    async handler(args: HandlerOptions) {
        try {
            const timestamp = new Date().getTime();
            const directory = args.dir.startsWith('/')
                ? args.dir
                : path.resolve(process.cwd(), args.dir);
            const fileContent = TypeormMigrationCreate.getTemplate(args.name as any, timestamp);
            const filename = `${timestamp}-${args.name}`;
            const fullPath = `${directory}/${filename}`;
            await CommandUtils.createFile(`${fullPath}.ts`, fileContent);
            console.log(
                `Migration ${chalk.blue(`${fullPath}.ts`)} has been generated successfully.`,
            );
        } catch (err) {
            PlatformTools.logCmdErr('Error during migration creation:', err);
            process.exit(1);
        }
    }

    /**
     * Gets contents of the migration file.
     */
    protected static getTemplate(name: string, timestamp: number): string {
        return `/* eslint-disable import/no-import-module-exports */
        import { MigrationInterface, QueryRunner } from "typeorm";

class ${camelCase(name, true)}${timestamp} implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
`;
    }
}
```

### 处理器

```typescript
/**
 * 创建迁移处理器
 * @param configure
 * @param args
 */
export const MigrationCreateHandler = async (
    configure: Configure,
    args: Arguments<MigrationCreateArguments>,
) => {
    const spinner = ora('Start to create migration').start();
    const cname = args.connection ?? 'default';
    try {
        const { connections = [] } = await configure.get<DbOptions>('database');
        const dbConfig: TypeormOption = connections.find(({ name }) => name === cname);
        if (isNil(dbConfig)) panic(`Database connection named ${cname} not exists!`);
        const runner = new TypeormMigrationCreate();
        console.log();
        runner.handler({
            name: cname,
            dir: dbConfig.paths.migration,
        });
        spinner.succeed(chalk.greenBright.underline('\n 👍 Finished create migration'));
    } catch (error) {
        panic({ spinner, message: 'Create migration failed!', error });
    }
};
```

### 命令

```typescript
/**
 * 创建迁移
 * @param param0
 */
export const CreateMigrationCommand: CommandItem<any, MigrationCreateArguments> = async ({
    configure,
}) => ({
    source: true,
    command: ['db:migration:create', 'dbmc'],
    describe: 'Creates a new migration file',
    builder: {
        connection: {
            type: 'string',
            alias: 'c',
            describe: 'Connection name of typeorm to connect database.',
        },
        name: {
            type: 'string',
            alias: 'n',
            describe: 'Name of the migration class.',
            demandOption: true,
        },
    } as const,

    handler: async (args: Arguments<MigrationCreateArguments>) =>
        MigrationCreateHandler(configure, args),
});
```

## 生成迁移

### 类型

```typescript
/**
 * 生成迁移处理器选项
 */
export interface MigrationGenerateOptions {
    name?: string;
    run?: boolean;
    pretty?: boolean;
    // outputJs?: boolean;
    dryrun?: boolean;
    check?: boolean;
}

/**
 * 生成迁移命令参数
 */
export type MigrationGenerateArguments = TypeOrmArguments & MigrationGenerateOptions;
```

### 执行逻辑

```typescript
type HandlerOptions = MigrationGenerateOptions & {
    dataSource: DataSource;
} & { dir: string };
export class TypeormMigrationGenerate {
    async handler(args: HandlerOptions) {
        const timestamp = new Date().getTime();
        const extension = '.ts';
        // const extension = args.outputJs ? '.js' : '.ts';
        const directory = args.dir.startsWith('/')
            ? args.dir
            : path.resolve(process.cwd(), args.dir);
        const filename = `${timestamp}-${args.name}`;
        const fullPath = `${directory}/${filename}${extension}`;
        const { dataSource } = args;
        try {
            dataSource.setOptions({
                synchronize: false,
                migrationsRun: false,
                dropSchema: false,
                logging: false,
            });
            await dataSource.initialize();
            const upSqls: string[] = [];
            const downSqls: string[] = [];

            try {
                const sqlInMemory = await dataSource.driver.createSchemaBuilder().log();

                if (args.pretty) {
                    sqlInMemory.upQueries.forEach((upQuery) => {
                        upQuery.query = TypeormMigrationGenerate.prettifyQuery(upQuery.query);
                    });
                    sqlInMemory.downQueries.forEach((downQuery) => {
                        downQuery.query = TypeormMigrationGenerate.prettifyQuery(downQuery.query);
                    });
                }

                sqlInMemory.upQueries.forEach((upQuery) => {
                    upSqls.push(
                        `        await queryRunner.query(\`${upQuery.query.replace(
                            /`/g,
                            '\\`',
                        )}\`${TypeormMigrationGenerate.queryParams(upQuery.parameters)});`,
                    );
                });
                sqlInMemory.downQueries.forEach((downQuery) => {
                    downSqls.push(
                        `        await queryRunner.query(\`${downQuery.query.replace(
                            /`/g,
                            '\\`',
                        )}\`${TypeormMigrationGenerate.queryParams(downQuery.parameters)});`,
                    );
                });
            } finally {
                await dataSource.destroy();
            }

            if (!upSqls.length) {
                console.log(chalk.green(`No changes in database schema were found`));
                process.exit(0);
            }

            const fileContent = TypeormMigrationGenerate.getTemplate(
                args.name,
                timestamp,
                upSqls,
                downSqls.reverse(),
            );
            if (args.check) {
                console.log(
                    chalk.yellow(
                        `Unexpected changes in database schema were found in check mode:\n\n${chalk.white(
                            fileContent,
                        )}`,
                    ),
                );
                process.exit(1);
            }

            if (args.dryrun) {
                console.log(
                    chalk.green(
                        `Migration ${chalk.blue(
                            fullPath + extension,
                        )} has content:\n\n${chalk.white(fileContent)}`,
                    ),
                );
            } else {
                await CommandUtils.createFile(fullPath, fileContent);

                console.log(
                    chalk.green(
                        `Migration ${chalk.blue(fullPath)} has been generated successfully.`,
                    ),
                );
            }
        } catch (err) {
            PlatformTools.logCmdErr('Error during migration generation:', err);
            process.exit(1);
        }
    }

    protected static queryParams(parameters: any[] | undefined): string {
        if (!parameters || !parameters.length) {
            return '';
        }

        return `, ${JSON.stringify(parameters)}`;
    }

    protected static getTemplate(
        name: string,
        timestamp: number,
        upSqls: string[],
        downSqls: string[],
    ): string {
        const migrationName = `${camelCase(upperFirst(name), true)}${timestamp}`;

        return `/* eslint-disable import/no-import-module-exports */
        import { MigrationInterface, QueryRunner } from "typeorm";

class ${migrationName} implements MigrationInterface {
    name = '${migrationName}'

    public async up(queryRunner: QueryRunner): Promise<void> {
${upSqls.join(`
`)}
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
${downSqls.join(`
`)}
    }

}

module.exports = ${migrationName}
`;
    }

    protected static prettifyQuery(query: string) {
        const formattedQuery = format(query, { indent: '    ' });
        return `\n${formattedQuery.replace(/^/gm, '            ')}\n        `;
    }
}
```

### 处理器

```typescript
/**
 * 生成迁移处理器
 * @param configure
 * @param args
 */
export const MigrationGenerateHandler = async (
    configure: Configure,
    args: Arguments<MigrationGenerateArguments>,
) => {
    console.log();
    const spinner = ora('Start to generate migration');
    const cname = args.connection ?? 'default';
    try {
        spinner.start();
        console.log();
        const { connections = [] }: DbConfig = await configure.get<DbConfig>('database');
        const dbConfig = connections.find(({ name }) => name === cname);
        if (isNil(dbConfig)) panic(`Database connection named ${cname} not exists!`);
        console.log();
        const runner = new TypeormMigrationGenerate();
        const dataSource = new DataSource({ ...dbConfig } as DataSourceOptions);
        console.log();
        await runner.handler({
            name: args.name ?? getRandomCharString(6),
            dir: dbConfig.paths.migration,
            dataSource,
            ...pick(args, ['pretty', 'outputJs', 'dryrun', 'check']),
        });
        if (dataSource.isInitialized) await dataSource.destroy();
        spinner.succeed(chalk.greenBright.underline('\n 👍 Finished generate migration'));
        if (args.run) {
            console.log();
        }
    } catch (error) {
        panic({ spinner, message: 'Generate migration failed!', error });
    }
};
```

### 命令

```typescript
/**
 * 生成迁移
 * @param param0
 */
export const GenerateMigrationCommand: CommandItem<any, MigrationGenerateArguments> = async ({
    configure,
}) => ({
    instant: true,
    command: ['db:migration:generate', 'dbmg'],
    describe: 'Auto generates a new migration file with sql needs to be executed to update schema.',
    builder: {
        connection: {
            type: 'string',
            alias: 'c',
            describe: 'Connection name of typeorm to connect database.',
        },
        name: {
            type: 'string',
            alias: 'n',
            describe: 'Name of the migration class.',
        },
        run: {
            type: 'boolean',
            alias: 'r',
            describe: 'Run migration after generated.',
            default: false,
        },
        dir: {
            type: 'string',
            alias: 'd',
            describe: 'Which directory where migration should be generated.',
        },
        pretty: {
            type: 'boolean',
            alias: 'p',
            describe: 'Pretty-print generated SQL',
            default: false,
        },
        dryrun: {
            type: 'boolean',
            alias: 'dr',
            describe: 'Prints out the contents of the migration instead of writing it to a file',
            default: false,
        },
        check: {
            type: 'boolean',
            alias: 'ch',
            describe:
                'Verifies that the current database is up to date and that no migrations are needed. Otherwise exits with code 1.',
            default: false,
        },
    } as const,

    handler: async (args: Arguments<MigrationGenerateArguments>) =>
        MigrationGenerateHandler(configure, args),
});
```

## 运行迁移

### 类型

```typescript
/**
 * 恢复迁移处理器选项
 */
export interface MigrationRevertOptions {
    transaction?: string;
    fake?: boolean;
}

/**
 * 运行迁移处理器选项
 */
export interface MigrationRunOptions extends MigrationRevertOptions {
    refresh?: boolean;
    onlydrop?: boolean;
    clear?: boolean;
    seed?: boolean;
}

/**
 * 运行迁移的命令参数
 */
export type MigrationRunArguments = TypeOrmArguments & MigrationRunOptions;
```

### 执行逻辑

```typescript
type HandlerOptions = MigrationRunOptions & { dataSource: DataSource };
export class TypeormMigrationRun {
    async handler({ transaction, fake, dataSource }: HandlerOptions) {
        const options = {
            transaction:
                dataSource.options.migrationsTransactionMode ?? ('all' as 'all' | 'none' | 'each'),
            fake,
        };
        switch (transaction) {
            case 'all':
                options.transaction = 'all';
                break;
            case 'none':
            case 'false':
                options.transaction = 'none';
                break;
            case 'each':
                options.transaction = 'each';
                break;
            default:
            // noop
        }
        await dataSource.runMigrations(options);
    }
}
```

### 更改生成

```typescript
/**
 * 生成迁移处理器
 * @param configure
 * @param args
 */
export const MigrationGenerateHandler = async (
    configure: Configure,
    args: Arguments<MigrationGenerateArguments>,
) => {
    await MigrationRunHandler(configure, { connection: args.connection } as any);
    console.log();
    const spinner = ora('Start to generate migration');
    const cname = args.connection ?? 'default';
    try {
        ...
        if (args.run) {
            console.log();
            await MigrationRunHandler(configure, { connection: args.connection } as any);
        }
    } catch (error) {
        panic({ spinner, message: 'Generate migration failed!', error });
    }
};
```

### 处理器

```typescript
/**
 * 运行迁移处理器
 * @param configure
 * @param args
 */
export const MigrationRunHandler = async (
    configure: Configure,
    args: Arguments<MigrationRunArguments>,
) => {
    const spinner = ora('Start to run migrations');
    const cname = args.connection ?? 'default';
    let dataSource: DataSource | undefined;
    try {
        spinner.start();
        const { connections = [] }: DbConfig = await configure.get<DbConfig>('database');
        const dbConfig = connections.find(({ name }) => name === cname);
        if (isNil(dbConfig)) panic(`Database connection named ${cname} not exists!`);
        let dropSchema = false;
        dropSchema = args.refresh || args.onlydrop;
        console.log();
        const runner = new TypeormMigrationRun();
        dataSource = new DataSource({ ...dbConfig } as DataSourceOptions);
        if (dataSource && dataSource.isInitialized) await dataSource.destroy();
        const options = {
            subscribers: [],
            synchronize: false,
            migrationsRun: false,
            dropSchema,
            logging: ['error'],
            migrations: [
                join(dbConfig.paths.migration, '**/*.ts'),
                join(dbConfig.paths.migration, '**/*.js'),
            ],
        } as any;
        if (dropSchema) {
            dataSource.setOptions(options);
            await dataSource.initialize();
            await dataSource.destroy();
            spinner.succeed(chalk.greenBright.underline('\n 👍 Finished drop database schema'));
            if (args.onlydrop) process.exit();
        }
        dataSource.setOptions({ ...options, dropSchema: false });
        await dataSource.initialize();
        console.log();
        await runner.handler({
            dataSource,
            transaction: args.transaction,
            fake: args.fake,
        });
        spinner.succeed(chalk.greenBright.underline('\n 👍 Finished run migrations'));
    } catch (error) {
        if (dataSource && dataSource.isInitialized) await dataSource.destroy();
        panic({ spinner, message: 'Run migrations failed!', error });
    }

    if (dataSource && dataSource.isInitialized) await dataSource.destroy();
};
```

### 命令

```typescript
/**
 * 运行迁移
 * @param param0
 */
export const RunMigrationCommand: CommandItem<any, MigrationRunArguments> = async ({
    configure,
}) => ({
    source: true,
    command: ['db:migration:run', 'dbmr'],
    describe: 'Runs all pending migrations.',
    builder: {
        connection: {
            type: 'string',
            alias: 'c',
            describe: 'Connection name of typeorm to connect database.',
        },
        transaction: {
            type: 'string',
            alias: 't',
            describe:
                'Indicates if transaction should be used or not for migration run/revert/reflash. Enabled by default.',
            default: 'default',
        },
        fake: {
            type: 'boolean',
            alias: 'f',
            describe:
                'Fakes running the migrations if table schema has already been changed manually or externally ' +
                '(e.g. through another project)',
        },
        refresh: {
            type: 'boolean',
            alias: 'r',
            describe: 'drop database schema and run migration',
            default: false,
        },

        onlydrop: {
            type: 'boolean',
            alias: 'o',
            describe: 'only drop database schema',
            default: false,
        },
    } as const,

    handler: async (args: Arguments<MigrationRunArguments>) => MigrationRunHandler(configure, args),
});
```

## 回滚迁移

### 类型

```typescript
/**
 * 恢复迁移的命令参数
 */
export type MigrationRevertArguments = TypeOrmArguments & MigrationRevertOptions;
```

### 执行逻辑

```typescript
type HandlerOptions = MigrationRevertOptions & { dataSource: DataSource };
export class TypeormMigrationRevert {
    async handler({ transaction, fake, dataSource }: HandlerOptions) {
        const options = {
            transaction:
                dataSource.options.migrationsTransactionMode ?? ('all' as 'all' | 'none' | 'each'),
            fake,
        };
        switch (transaction) {
            case 'all':
                options.transaction = 'all';
                break;
            case 'none':
            case 'false':
                options.transaction = 'none';
                break;
            case 'each':
                options.transaction = 'each';
                break;
            default:
            // noop
        }

        await dataSource.undoLastMigration(options);
    }
}
```

### 处理器

```typescript
/**
 * 移除迁移处理器
 * @param configure
 * @param args
 */
export const MigrationRevertHandler = async (
    configure: Configure,
    args: Arguments<MigrationRevertArguments>,
) => {
    const spinner = ora('Start to revert migrations');
    const cname = args.connection ?? 'default';
    let dataSource: DataSource | undefined;
    try {
        spinner.start();
        const { connections = [] }: DbConfig = await configure.get<DbConfig>('database');
        const dbConfig = connections.find(({ name }) => name === cname);
        if (isNil(dbConfig)) panic(`Database connection named ${cname} not exists!`);
        console.log();
        const revert = new TypeormMigrationRevert();
        dataSource = new DataSource({ ...dbConfig } as DataSourceOptions);
        dataSource.setOptions({
            subscribers: [],
            synchronize: false,
            migrationsRun: false,
            dropSchema: false,
            logging: ['error'],
            migrations: [
                join(dbConfig.paths.migration, '**/*.js'),
                join(dbConfig.paths.migration, '**/*.ts'),
            ],
        });
        await dataSource.initialize();
        console.log();
        await revert.handler({
            dataSource,
            transaction: args.transaction,
            fake: args.fake,
        });
        await dataSource.destroy();
        spinner.succeed(chalk.greenBright.underline('\n 👍 Finished revert migrations'));
    } catch (error) {
        if (dataSource && dataSource.isInitialized) await dataSource.destroy();
        panic({ spinner, message: 'Revert migrations failed!', error });
    }
};
```

### 命令

```typescript
/**
 * 恢复迁移命令
 * @param param0
 */
export const RevertMigrationCommand: CommandItem<any, MigrationRevertArguments> = async ({
    configure,
}) => ({
    source: true,
    command: ['db:migration:revert', 'dbmv'],
    describe: 'Reverts last executed migration.',
    builder: {
        connection: {
            type: 'string',
            alias: 'c',
            describe: 'Connection name of typeorm to connect database.',
        },
        transaction: {
            type: 'string',
            alias: 't',
            describe:
                'Indicates if transaction should be used or not for migration run/revert/reflash. Enabled by default.',
            default: 'default',
        },
        fake: {
            type: 'boolean',
            alias: 'f',
            describe:
                'Fakes running the migrations if table schema has already been changed manually or externally ' +
                '(e.g. through another project)',
        },
    } as const,

    handler: async (args: Arguments<MigrationRevertArguments>) =>
        MigrationRevertHandler(configure, args),
});
```

## 使用命令

### 添加命令

```typescript
export * from './migration-create.command';
export * from './migration-generate.command';
export * from './migration-run.command';
export * from './migration-revert.command';


import * as dbCommands from './modules/database/commands';
export const createOptions: CreateOptions = {
    ...
    commands: () => [...Object.values(dbCommands)],
};
```

### 生成迁移

删除数据库表结构

![](https://img.pincman.com/media/202310271511605.png)

执行命令`pnpm cli dbmg`

![](https://img.pincman.com/media/202310271518835.png)

![](https://img.pincman.com/media/202310271519271.png)

### 运行迁移

执行`pnpm cli dbmr`或者`pnpm cli dbmg -r`运行迁移

![](https://img.pincman.com/media/202310271520755.png)

![](https://img.pincman.com/media/202310271520640.png)
