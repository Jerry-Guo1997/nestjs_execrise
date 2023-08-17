export type SearchType = 'like' | 'against' | 'elastic';

export interface ContentConfig {
    searchType?: 'SearchType';
}