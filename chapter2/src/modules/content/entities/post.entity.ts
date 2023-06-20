import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    PrimaryColumn,
    //PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

import { PostBodyType } from '../constants';

@Entity('content_posts')
export class PostEntity extends BaseEntity {
    //@PrimaryGeneratedColumn('uuid')
    @PrimaryColumn({ type: 'varchar',generated:'uuid',length:36})
    id!: string;

    @Column({ comment: '文章标题' })
    title!: string;

    @Column({ comment: '文章内容', type: 'longtext' })
    body!: string;

    @Column({ comment: '文章描述', nullable: true })
    summary?: string;

    @Column({ comment: '关键字', type: 'simple-array', nullable: true })
    keywords?: string[];

    @Column({ comment: '文章类型', type: 'enum', enum: PostBodyType, default: PostBodyType.MD })
    type!: PostBodyType;

    @Column({ comment: '发布时间', type: 'varchar', nullable: true })
    publishedAt?: Date | null;

    @Column({ comment: '文章排序', default: 0 })
    customOrder!: number;

    @CreateDateColumn({ comment: '创建时间' })
    createdAt!: Date;

    @UpdateDateColumn({ comment: '更新时间' })
    updatedAt!: Date;
}
