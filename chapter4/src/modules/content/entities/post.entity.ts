import { Exclude, Expose, Type } from 'class-transformer';
import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinTable,
    ManyToMany,
    OneToMany,
    PrimaryColumn,
    // PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

import { PostBodyType } from '../constants';

import { CategoryEntity } from './category.entity';
import { CommentEntity } from './comment.entity';

@Exclude()
@Entity('content_posts')
export class PostEntity extends BaseEntity {
    // @PrimaryGeneratedColumn('uuid')
    @Expose()
    @PrimaryColumn({ type: 'varchar', generated: 'uuid', length: 36 })
    id!: string;

    @Expose()
    @Column({ comment: '文章标题' })
    title!: string;

    @Expose({ groups: ['post-detail'] })
    @Column({ comment: '文章内容', type: 'longtext' })
    body!: string;

    @Expose()
    @Column({ comment: '文章描述', nullable: true })
    summary?: string;

    @Expose()
    @Column({ comment: '关键字', type: 'simple-array', nullable: true })
    keywords?: string[];

    @Expose()
    @Column({ comment: '文章类型', type: 'enum', enum: PostBodyType, default: PostBodyType.MD })
    type!: PostBodyType;

    @Expose()
    @Column({ comment: '发布时间', type: 'varchar', nullable: true })
    publishedAt?: Date | null;

    @Expose()
    @Column({ comment: '自定义文章排序', default: 0 })
    customOrder!: number;

    @Expose()
    @Type(() => Date)
    @CreateDateColumn({ comment: '创建时间' })
    createdAt!: Date;

    @Expose()
    @Type(() => Date)
    @UpdateDateColumn({ comment: '更新时间' })
    updatedAt!: Date;

    @ManyToMany(() => CategoryEntity, (category) => category.posts, {
        // 新增文章时，如果所属分类不存在则直接创建
        cascade: true,
    })
    @JoinTable()
    categories!: CategoryEntity[];

    @OneToMany((type) => CommentEntity, (comment) => comment.post, {
        cascade: true,
    })
    comments!: CommentEntity;

    @Expose()
    commentCount!: number;
}
