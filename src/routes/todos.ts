import express, { Router, Request, Response } from 'express';
import {
  Todo,
  CreateTodoData,
  UpdateTodoData,
  TodoStatus,
  TodoPriority,
  HistoryRecord,
  HistoryActionType,
  FilterOptions,
  SortOptions,
  BatchOperation,
  ReorderRequest,
  PaginationQuery,
  PaginatedResponse,
  ApiResponse
} from '../types';
import {
  TodoRepository,
  TagRepository,
  TodoHistoryRepository,
  DatabaseTodo,
  DatabaseTag
} from '../config/database';

const router: Router = express.Router();

// 工具函数 - 将数据库TODO转换为API TODO格式
async function convertDatabaseTodoToTodo(dbTodo: DatabaseTodo): Promise<Todo> {
  // 获取标签
  const tags = await TodoRepository.getTags(dbTodo.id);
  const tagNames = tags.map(tag => tag.name);

  // 获取历史记录
  const historyRecords = await TodoHistoryRepository.findByTodoId(dbTodo.id);
  const history: HistoryRecord[] = historyRecords.map(record => ({
    id: record.id.toString(),
    todoId: dbTodo.id.toString(),
    actionType: record.action_type as HistoryActionType,
    timestamp: new Date(record.timestamp),
    changes: record.changes ? JSON.parse(record.changes) : undefined,
    operator: record.operator
  }));

  return {
    id: dbTodo.id.toString(),
    title: dbTodo.title,
    description: dbTodo.description,
    status: dbTodo.status,
    priority: dbTodo.priority,
    tags: tagNames,
    dueDate: dbTodo.due_date ? new Date(dbTodo.due_date) : undefined,
    completedAt: dbTodo.completed_at ? new Date(dbTodo.completed_at) : undefined,
    createdAt: new Date(dbTodo.created_at),
    updatedAt: new Date(dbTodo.updated_at),
    order: dbTodo.order_index,
    history
  };
}

// 模拟用户ID获取函数（实际项目中应该从认证中间件获取）
function getCurrentUserId(req: any): number {
  // 这里应该从JWT token或session中获取用户ID
  // 为了演示，我们使用固定的用户ID
  return 1;
}

// 根据标签名称获取或创建标签ID
async function getOrCreateTagIds(tagNames: string[], userId: number): Promise<number[]> {
  const tagIds: number[] = [];

  for (const tagName of tagNames) {
    let tag = await TagRepository.findByNameAndUserId(tagName, userId);
    if (!tag) {
      // 如果标签不存在，创建新标签（使用默认颜色）
      const defaultColors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399'];
      const color = defaultColors[Math.floor(Math.random() * defaultColors.length)];
      tag = await TagRepository.create(tagName, color, userId);
    }
    tagIds.push(tag.id);
  }

  return tagIds;
}

// 数据库查询构建函数
function buildTodoQuery(userId: number, filters?: FilterOptions, sort?: SortOptions) {
  const { db } = require('../config/database');
  let query = db('todos').where('user_id', userId);

  // 应用筛选条件
  if (filters) {
    if (filters.status && filters.status.length > 0) {
      query = query.whereIn('status', filters.status);
    }

    if (filters.priority && filters.priority.length > 0) {
      query = query.whereIn('priority', filters.priority);
    }

    if (filters.keyword) {
      const keyword = `%${filters.keyword}%`;
      query = query.where(function() {
        this.where('title', 'like', keyword)
            .orWhere('description', 'like', keyword);
      });
    }

    if (filters.dateRange) {
      const { type, start, end } = filters.dateRange;
      let dateField: string;

      switch (type) {
        case 'created':
          dateField = 'created_at';
          break;
        case 'updated':
          dateField = 'updated_at';
          break;
        case 'completed':
          dateField = 'completed_at';
          query = query.whereNotNull('completed_at');
          break;
        default:
          dateField = 'created_at';
      }

      if (start) {
        query = query.where(dateField, '>=', start.toISOString());
      }
      if (end) {
        query = query.where(dateField, '<=', end.toISOString());
      }
    }
  }

  // 应用排序
  if (sort) {
    let orderField: string;
    switch (sort.field) {
      case 'priority':
        // SQLite中按优先级排序需要使用CASE语句
        query = query.orderByRaw(`
          CASE priority
            WHEN 'high' THEN 3
            WHEN 'medium' THEN 2
            WHEN 'low' THEN 1
          END ${sort.order === 'desc' ? 'DESC' : 'ASC'}
        `);
        return query;
      case 'createdAt':
        orderField = 'created_at';
        break;
      case 'updatedAt':
        orderField = 'updated_at';
        break;
      case 'completedAt':
        orderField = 'completed_at';
        break;
      case 'dueDate':
        orderField = 'due_date';
        break;
      case 'order':
        orderField = 'order_index';
        break;
      default:
        orderField = 'order_index';
    }

    query = query.orderBy(orderField, sort.order);
  } else {
    // 默认按order_index排序
    query = query.orderBy('order_index', 'asc');
  }

  return query;
}

/**
 * @swagger
 * /api/todos:
 *   get:
 *     summary: 获取任务列表
 *     description: 获取任务列表，支持筛选、排序和分页
 *     tags: [Todos]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 每页数量
 *       - in: query
 *         name: status
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [pending, in-progress, completed]
 *         description: 状态筛选
 *       - in: query
 *         name: priority
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [high, medium, low]
 *         description: 优先级筛选
 *       - in: query
 *         name: tags
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: 标签筛选
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: 关键词搜索
 *       - in: query
 *         name: sortField
 *         schema:
 *           type: string
 *           enum: [priority, createdAt, updatedAt, completedAt, dueDate, order]
 *           default: order
 *         description: 排序字段
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: 排序方向
 *     responses:
 *       200:
 *         description: 成功获取任务列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Todo'
 *                 total:
 *                   type: integer
 *                   example: 100
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 size:
 *                   type: integer
 *                   example: 10
 */
router.get('/', async (req: any, res: any) => {
  try {
    const userId = getCurrentUserId(req);
    const {
      page = 1,
      size = 10,
      status,
      priority,
      tags,
      keyword,
      sortField = 'order',
      sortOrder = 'asc'
    } = req.query;

    // 构建筛选条件
    const filters: FilterOptions = {};
    if (status) filters.status = Array.isArray(status) ? status : [status];
    if (priority) filters.priority = Array.isArray(priority) ? priority : [priority];
    if (tags) filters.tags = Array.isArray(tags) ? tags : [tags];
    if (keyword) filters.keyword = keyword;

    // 构建排序条件
    const sort: SortOptions = {
      field: sortField,
      order: sortOrder
    };

    // 构建查询
    let query = buildTodoQuery(userId, filters, sort);

    // 处理标签筛选（需要特殊处理，因为涉及关联表）
    if (filters.tags && filters.tags.length > 0) {
      query = query
        .join('todo_tags', 'todos.id', 'todo_tags.todo_id')
        .join('tags', 'todo_tags.tag_id', 'tags.id')
        .whereIn('tags.name', filters.tags)
        .groupBy('todos.id')
        .select('todos.*');
    }

    // 获取总数（用于分页）
    const countQuery = query.clone().clearSelect().clearOrder().count('* as count').first();
    const totalResult = await countQuery;
    const total = parseInt(totalResult?.count as string) || 0;

    // 分页
    const pageNum = parseInt(page);
    const pageSize = parseInt(size);
    const offset = (pageNum - 1) * pageSize;

    const dbTodos = await query.limit(pageSize).offset(offset);

    // 转换为API格式
    const todos: Todo[] = [];
    for (const dbTodo of dbTodos) {
      const todo = await convertDatabaseTodoToTodo(dbTodo);
      todos.push(todo);
    }

    const response: PaginatedResponse<Todo> = {
      data: todos,
      total,
      page: pageNum,
      size: pageSize
    };

    res.json({
      success: true,
      ...response
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

/**
 * @swagger
 * /api/todos/{id}:
 *   get:
 *     summary: 获取单个任务
 *     description: 根据ID获取任务详情
 *     tags: [Todos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务ID
 *     responses:
 *       200:
 *         description: 成功获取任务详情
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Todo'
 *       404:
 *         description: 任务不存在
 */
router.get('/:id', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const todoId = parseInt(id, 10);

    if (isNaN(todoId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid todo ID'
      });
    }

    const dbTodo = await TodoRepository.findById(todoId);

    if (!dbTodo) {
      return res.status(404).json({
        success: false,
        error: 'Todo not found'
      });
    }

    const todo = await convertDatabaseTodoToTodo(dbTodo);

    res.json({
      success: true,
      data: todo
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

/**
 * @swagger
 * /api/todos:
 *   post:
 *     summary: 创建新任务
 *     description: 创建一个新的任务
 *     tags: [Todos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTodoData'
 *     responses:
 *       201:
 *         description: 任务创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Todo'
 *       400:
 *         description: 请求参数错误
 */
router.post('/', async (req: any, res: any) => {
  try {
    const userId = getCurrentUserId(req);
    const { title, description, priority = 'medium', tags = [], dueDate }: CreateTodoData = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Title is required'
      });
    }

    // 创建TODO
    const dbTodo = await TodoRepository.create(
      title.trim(),
      userId,
      description?.trim(),
      priority,
      dueDate ? new Date(dueDate) : undefined
    );

    // 处理标签
    if (tags.length > 0) {
      const tagIds = await getOrCreateTagIds(tags, userId);
      await TodoRepository.setTags(dbTodo.id, tagIds);
    }

    // 添加历史记录
    await TodoHistoryRepository.add(dbTodo.id, 'create');

    // 转换为API格式
    const todo = await convertDatabaseTodoToTodo(dbTodo);

    res.status(201).json({
      success: true,
      data: todo,
      message: 'Todo created successfully'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

/**
 * @swagger
 * /api/todos/{id}:
 *   put:
 *     summary: 更新任务
 *     description: 更新指定ID的任务
 *     tags: [Todos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTodoData'
 *     responses:
 *       200:
 *         description: 任务更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Todo'
 *       404:
 *         description: 任务不存在
 */
router.put('/:id', async (req: any, res: any) => {
  try {
    const userId = getCurrentUserId(req);
    const { id } = req.params;
    const updateData: UpdateTodoData = req.body;
    const todoId = parseInt(id, 10);

    if (isNaN(todoId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid todo ID'
      });
    }

    const existingTodo = await TodoRepository.findById(todoId);
    if (!existingTodo) {
      return res.status(404).json({
        success: false,
        error: 'Todo not found'
      });
    }

    // 验证标题
    if (updateData.title !== undefined && updateData.title.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Title cannot be empty'
      });
    }

    // 准备更新数据
    const updates: any = {};
    if (updateData.title !== undefined) updates.title = updateData.title.trim();
    if (updateData.description !== undefined) updates.description = updateData.description?.trim();
    if (updateData.status !== undefined) {
      updates.status = updateData.status;
      if (updateData.status === 'completed') {
        updates.completedAt = new Date();
      } else if (existingTodo.completed_at) {
        updates.completedAt = null; // 清除完成时间
      }
    }
    if (updateData.priority !== undefined) updates.priority = updateData.priority;
    if (updateData.dueDate !== undefined) {
      updates.dueDate = updateData.dueDate ? new Date(updateData.dueDate) : undefined;
    }
    if (updateData.order !== undefined) updates.orderIndex = updateData.order;

    // 更新TODO
    const updatedTodo = await TodoRepository.update(todoId, updates);
    if (!updatedTodo) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update todo'
      });
    }

    // 处理标签更新
    if (updateData.tags !== undefined) {
      const tagIds = await getOrCreateTagIds(updateData.tags, userId);
      await TodoRepository.setTags(todoId, tagIds);
    }

    // 记录变更历史
    const changes = Object.keys(updateData).map(field => ({
      field,
      oldValue: (existingTodo as any)[field],
      newValue: (updateData as any)[field]
    }));

    if (changes.length > 0) {
      await TodoHistoryRepository.add(todoId, 'update_status', { changes });
    }

    // 转换为API格式
    const todo = await convertDatabaseTodoToTodo(updatedTodo);

    res.json({
      success: true,
      data: todo,
      message: 'Todo updated successfully'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

/**
 * @swagger
 * /api/todos/{id}:
 *   delete:
 *     summary: 删除任务
 *     description: 删除指定ID的任务
 *     tags: [Todos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务ID
 *     responses:
 *       200:
 *         description: 任务删除成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Todo deleted successfully"
 *       404:
 *         description: 任务不存在
 */
router.delete('/:id', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const todoId = parseInt(id, 10);

    if (isNaN(todoId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid todo ID'
      });
    }

    const existingTodo = await TodoRepository.findById(todoId);
    if (!existingTodo) {
      return res.status(404).json({
        success: false,
        error: 'Todo not found'
      });
    }

    // 转换为API格式（在删除前）
    const deletedTodo = await convertDatabaseTodoToTodo(existingTodo);

    // 删除TODO（会自动删除关联的标签和历史记录）
    await TodoRepository.delete(todoId);

    res.json({
      success: true,
      data: deletedTodo,
      message: 'Todo deleted successfully'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

/**
 * @swagger
 * /api/todos/batch:
 *   post:
 *     summary: 批量操作任务
 *     description: 对多个任务执行批量操作（删除或更新）
 *     tags: [Todos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BatchOperation'
 *     responses:
 *       200:
 *         description: 批量操作成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 affected:
 *                   type: integer
 *                   example: 3
 *                 message:
 *                   type: string
 *                   example: "Batch operation completed"
 */
router.post('/batch', async (req: any, res: any) => {
  try {
    const userId = getCurrentUserId(req);
    const { action, ids, data }: BatchOperation = req.body;

    if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid batch operation parameters'
      });
    }

    // 转换字符串ID为数字ID
    const todoIds = ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    if (todoIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid todo IDs'
      });
    }

    let affected = 0;

    if (action === 'delete') {
      affected = await TodoRepository.batchDelete(todoIds);
    } else if (action === 'update') {
      if (!data) {
        return res.status(400).json({
          success: false,
          error: 'Update data is required for batch update'
        });
      }

      // 处理批量状态更新（最常见的批量操作）
      if (data.status) {
        affected = await TodoRepository.batchUpdateStatus(todoIds, data.status);

        // 为每个TODO添加历史记录
        for (const todoId of todoIds) {
          await TodoHistoryRepository.add(
            todoId,
            'update_status',
            { field: 'status', newValue: data.status, batchOperation: true }
          );
        }
      } else {
        // 处理其他批量更新（逐个更新）
        for (const todoId of todoIds) {
          const updates: any = {};
          if (data.priority !== undefined) updates.priority = data.priority;
          if (data.dueDate !== undefined) updates.dueDate = data.dueDate ? new Date(data.dueDate) : undefined;

          const updated = await TodoRepository.update(todoId, updates);
          if (updated) {
            affected++;
            await TodoHistoryRepository.add(
              todoId,
              'update_status',
              { batchOperation: true, updates }
            );
          }
        }
      }
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid action type'
      });
    }

    res.json({
      success: true,
      affected,
      message: `Batch ${action} completed`
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

/**
 * @swagger
 * /api/todos/reorder:
 *   post:
 *     summary: 重新排序任务
 *     description: 批量更新任务的排序顺序
 *     tags: [Todos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReorderRequest'
 *     responses:
 *       200:
 *         description: 重新排序成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Todos reordered successfully"
 */
router.post('/reorder', async (req: any, res: any) => {
  try {
    const { todoIds } = req.body;

    if (!todoIds || !Array.isArray(todoIds)) {
      return res.status(400).json({
        success: false,
        error: 'todoIds array is required'
      });
    }

    // 转换字符串ID为数字ID
    const numericTodoIds = todoIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    if (numericTodoIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid todo IDs'
      });
    }

    // 重新排序
    await TodoRepository.reorder(numericTodoIds);

    // 为每个TODO添加历史记录
    for (let i = 0; i < numericTodoIds.length; i++) {
      await TodoHistoryRepository.add(
        numericTodoIds[i],
        'update_order',
        { field: 'order', newValue: i + 1 }
      );
    }

    res.json({
      success: true,
      message: 'Todos reordered successfully'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

export default router;
