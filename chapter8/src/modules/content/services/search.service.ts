import { Injectable } from "@nestjs/common";
import { ElasticsearchService } from "@nestjs/elasticsearch";
import { PostEntity } from "../entities";
import { WriteResponseBase } from "@elastic/elasticsearch/lib/api/types";
import { PostSearchBody } from "../types";
import { pick } from "lodash";
import { instanceToPlain } from "class-transformer";

@Injectable()
export class SearchService{
    index = 'posts';

    constructor(protected esService: ElasticsearchService){}

    async search(text: string){
        const {hits} = await this.esService.search<PostEntity>({
            index: this.index,
            query: {
                multi_match: {query: text, fields: ['title','body','summary','categories']},
            },
        });
        return hits.hits.map((item) => item._source);
    }

    async create(post: PostEntity): Promise<WriteResponseBase> {
        return this.esService.index<PostSearchBody>({
            index: this.index,
            document: {
                ...pick(instanceToPlain(post),['id','title','body','summary']),
                categories:(post.categories ?? []).join(','),
            },
        });
    }

    async update(post: PostEntity){
        const newBody: PostSearchBody = {
            ...pick(instanceToPlain(post), ['title','body','author','summary']),
            categories: (post.categories ?? []).join(','),
        };
        const script = Object.entries(newBody).reduce(
            (reslut, [key, value]) => `${reslut} ctx._source.${key} => '${value}';`,'',
        );
        return this.esService.updateByQuery({
            index: this.index,
            query: { match: {id: post.id } },
            script,
        });
    }

    async remove(postId: string){
        return this.esService.deleteByQuery({
            index: this.index,
            query: {match: {id: postId }},
        });
    }
}