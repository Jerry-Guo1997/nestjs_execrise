import { ElasticsearchModuleOptions } from "@nestjs/elasticsearch";

export const elastic = (): ElasticsearchModuleOptions => ({
    node: 'http://localhost:9200',
    maxRetries: 10,
    requestTimeout: 60000,
    pingTimeout: 60000,
    sniffOnStart: true,
});