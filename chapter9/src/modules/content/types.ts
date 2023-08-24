import { PostEntity } from "./entities";

export type SearchType = 'like' | 'against' | 'elastic';

export interface ContentConfig {
    searchType?: SearchType;
}

export type PostSearchBody = Pick<ClassToPlain<PostEntity>, 'title' | 'body' | 'summary'> & {
    categories: string;
};