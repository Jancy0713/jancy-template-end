import knex, { Knex } from 'knex';
import path from 'path';
import fs from 'fs';
import { logInfo, logError } from './logger';

// 数据库文件路径
const DB_PATH = path.join(process.cwd(), 'data', 'app.db');

// 确保数据目录存在
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Knex 配置
const config: Knex.Config = {
  client: 'better-sqlite3',
  connection: {
    filename: DB_PATH,
  },
  useNullAsDefault: true,
  migrations: {
    directory: path.join(__dirname, '../migrations'),
    extension: 'ts'
  },
  pool: {
    afterCreate: (conn: any, cb: any) => {
      // 启用外键约束
      conn.pragma('foreign_keys = ON');
      cb();
    }
  }
};

// 创建 Knex 实例
export const db = knex(config);

// 数据库表接口定义
export interface DatabaseUser {
  id: number;
  email: string;
  password: string;
  name: string;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface RefreshToken {
  id: number;
  token: string;
  user_id: number;
  created_at: string;
  expires_at: string;
}

export interface TokenBlacklist {
  id: number;
  token: string;
  created_at: string;
}

export interface DatabaseTodo {
  id: number;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  order_index: number;
  user_id: number;
}

export interface DatabaseTag {
  id: number;
  name: string;
  color: string;
  created_at: string;
  user_id: number;
}

export interface DatabaseTodoTag {
  id: number;
  todo_id: number;
  tag_id: number;
}

export interface DatabaseTodoHistory {
  id: number;
  todo_id: number;
  action_type: string;
  timestamp: string;
  changes?: string; // JSON string
  operator?: string;
}

// 初始化数据库表结构
export async function initDatabase(): Promise<void> {
  try {
    // 创建用户表
    const hasUsersTable = await db.schema.hasTable('users');
    if (!hasUsersTable) {
      await db.schema.createTable('users', (table) => {
        table.increments('id').primary();
        table.string('email').unique().notNullable();
        table.string('password').notNullable();
        table.string('name').notNullable();
        table.string('avatar');
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
      });
      logInfo('Created users table');
    }

    // 创建刷新令牌表
    const hasRefreshTokensTable = await db.schema.hasTable('refresh_tokens');
    if (!hasRefreshTokensTable) {
      await db.schema.createTable('refresh_tokens', (table) => {
        table.increments('id').primary();
        table.string('token').unique().notNullable();
        table.integer('user_id').unsigned().notNullable();
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('expires_at').notNullable();
        table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      });
      logInfo('Created refresh_tokens table');
    }

    // 创建令牌黑名单表
    const hasTokenBlacklistTable = await db.schema.hasTable('token_blacklist');
    if (!hasTokenBlacklistTable) {
      await db.schema.createTable('token_blacklist', (table) => {
        table.increments('id').primary();
        table.string('token').unique().notNullable();
        table.timestamp('created_at').defaultTo(db.fn.now());
      });
      logInfo('Created token_blacklist table');
    }

    // 创建标签表
    const hasTagsTable = await db.schema.hasTable('tags');
    if (!hasTagsTable) {
      await db.schema.createTable('tags', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.string('color').notNullable();
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.integer('user_id').unsigned().notNullable();
        table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
        table.unique(['name', 'user_id']); // 同一用户下标签名唯一
      });
      logInfo('Created tags table');
    }

    // 创建TODO表
    const hasTodosTable = await db.schema.hasTable('todos');
    if (!hasTodosTable) {
      await db.schema.createTable('todos', (table) => {
        table.increments('id').primary();
        table.string('title').notNullable();
        table.text('description');
        table.enum('status', ['pending', 'in-progress', 'completed']).defaultTo('pending');
        table.enum('priority', ['high', 'medium', 'low']).defaultTo('medium');
        table.timestamp('due_date');
        table.timestamp('completed_at');
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
        table.integer('order_index').defaultTo(0);
        table.integer('user_id').unsigned().notNullable();
        table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      });
      logInfo('Created todos table');
    }

    // 创建TODO标签关联表
    const hasTodoTagsTable = await db.schema.hasTable('todo_tags');
    if (!hasTodoTagsTable) {
      await db.schema.createTable('todo_tags', (table) => {
        table.increments('id').primary();
        table.integer('todo_id').unsigned().notNullable();
        table.integer('tag_id').unsigned().notNullable();
        table.foreign('todo_id').references('id').inTable('todos').onDelete('CASCADE');
        table.foreign('tag_id').references('id').inTable('tags').onDelete('CASCADE');
        table.unique(['todo_id', 'tag_id']); // 防止重复关联
      });
      logInfo('Created todo_tags table');
    }

    // 创建TODO历史记录表
    const hasTodoHistoryTable = await db.schema.hasTable('todo_history');
    if (!hasTodoHistoryTable) {
      await db.schema.createTable('todo_history', (table) => {
        table.increments('id').primary();
        table.integer('todo_id').unsigned().notNullable();
        table.string('action_type').notNullable();
        table.timestamp('timestamp').defaultTo(db.fn.now());
        table.text('changes'); // JSON string
        table.string('operator');
        table.foreign('todo_id').references('id').inTable('todos').onDelete('CASCADE');
      });
      logInfo('Created todo_history table');
    }

    // 数据库初始化完成，不再插入默认测试数据

    logInfo('Database initialized successfully', { dbPath: DB_PATH });
  } catch (error) {
    logError('Failed to initialize database', error);
    throw error;
  }
}

// 用户数据仓库类
export class UserRepository {
  // 根据邮箱查找用户
  static async findByEmail(email: string): Promise<DatabaseUser | undefined> {
    return await db('users').where('email', email).first();
  }

  // 根据ID查找用户
  static async findById(id: number): Promise<DatabaseUser | undefined> {
    return await db('users').where('id', id).first();
  }

  // 创建新用户
  static async create(email: string, password: string, name: string, avatar?: string): Promise<DatabaseUser> {
    const [userId] = await db('users').insert({
      email,
      password,
      name,
      avatar
    });
    
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('Failed to create user');
    }
    return user;
  }

  // 更新用户信息
  static async update(id: number, name: string, avatar?: string): Promise<DatabaseUser | undefined> {
    await db('users')
      .where('id', id)
      .update({
        name,
        avatar,
        updated_at: db.fn.now()
      });
    
    return await this.findById(id);
  }

  // 删除用户
  static async delete(id: number): Promise<number> {
    return await db('users').where('id', id).del();
  }

  // 获取所有用户
  static async getAll(): Promise<DatabaseUser[]> {
    return await db('users').orderBy('created_at', 'desc');
  }
}

// 刷新令牌仓库类
export class RefreshTokenRepository {
  // 创建刷新令牌
  static async create(token: string, userId: number, expiresAt: Date): Promise<void> {
    await db('refresh_tokens').insert({
      token,
      user_id: userId,
      expires_at: expiresAt.toISOString()
    });
  }

  // 查找刷新令牌
  static async find(token: string): Promise<RefreshToken | undefined> {
    return await db('refresh_tokens').where('token', token).first();
  }

  // 删除刷新令牌
  static async delete(token: string): Promise<number> {
    return await db('refresh_tokens').where('token', token).del();
  }

  // 删除用户的所有刷新令牌
  static async deleteByUser(userId: number): Promise<number> {
    return await db('refresh_tokens').where('user_id', userId).del();
  }

  // 清理过期的刷新令牌
  static async cleanupExpired(): Promise<number> {
    return await db('refresh_tokens')
      .where('expires_at', '<', new Date().toISOString())
      .del();
  }
}

// 令牌黑名单仓库类
export class TokenBlacklistRepository {
  // 添加令牌到黑名单
  static async add(token: string): Promise<void> {
    await db('token_blacklist').insert({ token }).onConflict('token').ignore();
  }

  // 检查令牌是否在黑名单中
  static async isBlacklisted(token: string): Promise<boolean> {
    const result = await db('token_blacklist').where('token', token).first();
    return !!result;
  }

  // 清理旧的黑名单令牌（可选，用于定期清理）
  static async cleanup(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    return await db('token_blacklist')
      .where('created_at', '<', cutoffDate.toISOString())
      .del();
  }
}

// 标签仓库类
export class TagRepository {
  // 根据用户ID获取所有标签
  static async findByUserId(userId: number): Promise<DatabaseTag[]> {
    return await db('tags').where('user_id', userId).orderBy('created_at', 'desc');
  }

  // 根据ID查找标签
  static async findById(id: number): Promise<DatabaseTag | undefined> {
    return await db('tags').where('id', id).first();
  }

  // 根据名称和用户ID查找标签
  static async findByNameAndUserId(name: string, userId: number): Promise<DatabaseTag | undefined> {
    return await db('tags').where('name', name).where('user_id', userId).first();
  }

  // 创建新标签
  static async create(name: string, color: string, userId: number): Promise<DatabaseTag> {
    const [tagId] = await db('tags').insert({
      name,
      color,
      user_id: userId
    });

    const tag = await this.findById(tagId);
    if (!tag) {
      throw new Error('Failed to create tag');
    }
    return tag;
  }

  // 更新标签
  static async update(id: number, name?: string, color?: string): Promise<DatabaseTag | undefined> {
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (color !== undefined) updateData.color = color;

    if (Object.keys(updateData).length > 0) {
      await db('tags').where('id', id).update(updateData);
    }

    return await this.findById(id);
  }

  // 删除标签
  static async delete(id: number): Promise<number> {
    // 先删除关联的todo_tags记录
    await db('todo_tags').where('tag_id', id).del();
    // 再删除标签
    return await db('tags').where('id', id).del();
  }

  // 检查标签是否被使用
  static async isUsed(id: number): Promise<boolean> {
    const result = await db('todo_tags').where('tag_id', id).first();
    return !!result;
  }
}

// TODO仓库类
export class TodoRepository {
  // 根据用户ID获取所有TODO
  static async findByUserId(userId: number): Promise<DatabaseTodo[]> {
    return await db('todos').where('user_id', userId).orderBy('order_index', 'asc');
  }

  // 根据ID查找TODO
  static async findById(id: number): Promise<DatabaseTodo | undefined> {
    return await db('todos').where('id', id).first();
  }

  // 创建新TODO
  static async create(
    title: string,
    userId: number,
    description?: string,
    priority: 'high' | 'medium' | 'low' = 'medium',
    dueDate?: Date
  ): Promise<DatabaseTodo> {
    // 获取最大order_index
    const maxOrder = await db('todos')
      .where('user_id', userId)
      .max('order_index as max')
      .first();

    const orderIndex = (maxOrder?.max || 0) + 1;

    const [todoId] = await db('todos').insert({
      title,
      description,
      priority,
      due_date: dueDate?.toISOString(),
      user_id: userId,
      order_index: orderIndex
    });

    const todo = await this.findById(todoId);
    if (!todo) {
      throw new Error('Failed to create todo');
    }
    return todo;
  }

  // 更新TODO
  static async update(
    id: number,
    updates: {
      title?: string;
      description?: string;
      status?: 'pending' | 'in-progress' | 'completed';
      priority?: 'high' | 'medium' | 'low';
      dueDate?: Date;
      completedAt?: Date;
      orderIndex?: number;
    }
  ): Promise<DatabaseTodo | undefined> {
    const updateData: any = {
      updated_at: db.fn.now()
    };

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate?.toISOString();
    if (updates.completedAt !== undefined) updateData.completed_at = updates.completedAt?.toISOString();
    if (updates.orderIndex !== undefined) updateData.order_index = updates.orderIndex;

    await db('todos').where('id', id).update(updateData);

    return await this.findById(id);
  }

  // 删除TODO
  static async delete(id: number): Promise<number> {
    // 先删除关联的标签和历史记录
    await db('todo_tags').where('todo_id', id).del();
    await db('todo_history').where('todo_id', id).del();
    // 再删除TODO
    return await db('todos').where('id', id).del();
  }

  // 批量删除TODO
  static async batchDelete(ids: number[]): Promise<number> {
    if (ids.length === 0) return 0;

    // 删除关联数据
    await db('todo_tags').whereIn('todo_id', ids).del();
    await db('todo_history').whereIn('todo_id', ids).del();
    // 删除TODO
    return await db('todos').whereIn('id', ids).del();
  }

  // 批量更新TODO状态
  static async batchUpdateStatus(ids: number[], status: 'pending' | 'in-progress' | 'completed'): Promise<number> {
    if (ids.length === 0) return 0;

    const updateData: any = {
      status,
      updated_at: db.fn.now()
    };

    if (status === 'completed') {
      updateData.completed_at = db.fn.now();
    }

    return await db('todos').whereIn('id', ids).update(updateData);
  }

  // 重新排序TODO
  static async reorder(todoIds: number[]): Promise<void> {
    const transaction = await db.transaction();
    try {
      for (let i = 0; i < todoIds.length; i++) {
        await transaction('todos')
          .where('id', todoIds[i])
          .update({
            order_index: i + 1,
            updated_at: db.fn.now()
          });
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // 获取TODO的标签
  static async getTags(todoId: number): Promise<DatabaseTag[]> {
    return await db('tags')
      .join('todo_tags', 'tags.id', 'todo_tags.tag_id')
      .where('todo_tags.todo_id', todoId)
      .select('tags.*');
  }

  // 设置TODO的标签
  static async setTags(todoId: number, tagIds: number[]): Promise<void> {
    const transaction = await db.transaction();
    try {
      // 删除现有关联
      await transaction('todo_tags').where('todo_id', todoId).del();

      // 添加新关联
      if (tagIds.length > 0) {
        const insertData = tagIds.map(tagId => ({
          todo_id: todoId,
          tag_id: tagId
        }));
        await transaction('todo_tags').insert(insertData);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // 获取统计信息
  static async getStats(userId: number): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
  }> {
    const now = new Date().toISOString();

    const stats = await db('todos')
      .where('user_id', userId)
      .select(
        db.raw('COUNT(*) as total'),
        db.raw("COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending"),
        db.raw("COUNT(CASE WHEN status = 'in-progress' THEN 1 END) as inProgress"),
        db.raw("COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed"),
        db.raw(`COUNT(CASE WHEN status != 'completed' AND due_date < ? THEN 1 END) as overdue`, [now])
      )
      .first() as any;

    return {
      total: parseInt(stats?.total) || 0,
      pending: parseInt(stats?.pending) || 0,
      inProgress: parseInt(stats?.inProgress) || 0,
      completed: parseInt(stats?.completed) || 0,
      overdue: parseInt(stats?.overdue) || 0
    };
  }

  // 获取标签统计
  static async getTagStats(userId: number): Promise<{ tag: string; count: number }[]> {
    const result = await db('tags')
      .join('todo_tags', 'tags.id', 'todo_tags.tag_id')
      .join('todos', 'todo_tags.todo_id', 'todos.id')
      .where('todos.user_id', userId)
      .groupBy('tags.id', 'tags.name')
      .select('tags.name as tag', db.raw('COUNT(*) as count'))
      .orderBy('count', 'desc');

    return result.map(row => ({
      tag: row.tag,
      count: parseInt(row.count) || 0
    }));
  }
}

// TODO历史记录仓库类
export class TodoHistoryRepository {
  // 添加历史记录
  static async add(
    todoId: number,
    actionType: string,
    changes?: any,
    operator?: string
  ): Promise<void> {
    await db('todo_history').insert({
      todo_id: todoId,
      action_type: actionType,
      changes: changes ? JSON.stringify(changes) : null,
      operator
    });
  }

  // 获取TODO的历史记录
  static async findByTodoId(todoId: number): Promise<DatabaseTodoHistory[]> {
    return await db('todo_history')
      .where('todo_id', todoId)
      .orderBy('timestamp', 'desc');
  }

  // 清理旧的历史记录
  static async cleanup(olderThanDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    return await db('todo_history')
      .where('timestamp', '<', cutoffDate.toISOString())
      .del();
  }
}

// 优雅关闭数据库连接
export async function closeDatabase(): Promise<void> {
  try {
    await db.destroy();
    logInfo('Database connection closed');
  } catch (error) {
    logError('Error closing database connection', error);
  }
}
