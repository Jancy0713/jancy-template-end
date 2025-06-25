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

const router: Router = express.Router();

// 模拟数据存储
let todos: Todo[] = [
  {
    id: '1',
    title: '完成项目文档',
    description: '编写项目的技术文档和用户手册',
    status: 'in-progress',
    priority: 'high',
    tags: ['work', 'documentation'],
    dueDate: new Date('2025-07-01'),
    createdAt: new Date('2025-06-20'),
    updatedAt: new Date('2025-06-25'),
    order: 1,
    history: []
  },
  {
    id: '2',
    title: '学习TypeScript',
    description: '深入学习TypeScript的高级特性',
    status: 'pending',
    priority: 'medium',
    tags: ['learning', 'typescript'],
    dueDate: new Date('2025-07-15'),
    createdAt: new Date('2025-06-22'),
    updatedAt: new Date('2025-06-22'),
    order: 2,
    history: []
  },
  {
    id: '3',
    title: '健身计划',
    description: '制定并执行每周的健身计划',
    status: 'completed',
    priority: 'low',
    tags: ['health', 'personal'],
    completedAt: new Date('2025-06-24'),
    createdAt: new Date('2025-06-15'),
    updatedAt: new Date('2025-06-24'),
    order: 3,
    history: []
  }
];

let nextId = 4;

// 工具函数
const generateId = (): string => (nextId++).toString();

const createHistoryRecord = (
  todoId: string, 
  actionType: HistoryActionType, 
  changes?: any
): HistoryRecord => ({
  id: generateId(),
  todoId,
  actionType,
  timestamp: new Date(),
  changes,
  operator: 'system'
});

const applyFilters = (todos: Todo[], filters: FilterOptions): Todo[] => {
  return todos.filter(todo => {
    // 状态筛选
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(todo.status)) return false;
    }
    
    // 优先级筛选
    if (filters.priority && filters.priority.length > 0) {
      if (!filters.priority.includes(todo.priority)) return false;
    }
    
    // 标签筛选
    if (filters.tags && filters.tags.length > 0) {
      if (!filters.tags.some(tag => todo.tags.includes(tag))) return false;
    }
    
    // 关键词筛选
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      if (!todo.title.toLowerCase().includes(keyword) && 
          !todo.description?.toLowerCase().includes(keyword)) {
        return false;
      }
    }
    
    // 日期范围筛选
    if (filters.dateRange) {
      const { type, start, end } = filters.dateRange;
      let targetDate: Date;
      
      switch (type) {
        case 'created':
          targetDate = todo.createdAt;
          break;
        case 'updated':
          targetDate = todo.updatedAt;
          break;
        case 'completed':
          if (!todo.completedAt) return false;
          targetDate = todo.completedAt;
          break;
        default:
          return true;
      }
      
      if (start && targetDate < start) return false;
      if (end && targetDate > end) return false;
    }
    
    return true;
  });
};

const applySorting = (todos: Todo[], sort: SortOptions): Todo[] => {
  return [...todos].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sort.field) {
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        aValue = priorityOrder[a.priority];
        bValue = priorityOrder[b.priority];
        break;
      case 'createdAt':
        aValue = a.createdAt.getTime();
        bValue = b.createdAt.getTime();
        break;
      case 'updatedAt':
        aValue = a.updatedAt.getTime();
        bValue = b.updatedAt.getTime();
        break;
      case 'completedAt':
        aValue = a.completedAt?.getTime() || 0;
        bValue = b.completedAt?.getTime() || 0;
        break;
      case 'dueDate':
        aValue = a.dueDate?.getTime() || Infinity;
        bValue = b.dueDate?.getTime() || Infinity;
        break;
      case 'order':
        aValue = a.order;
        bValue = b.order;
        break;
      default:
        return 0;
    }
    
    if (sort.order === 'desc') {
      return bValue - aValue;
    }
    return aValue - bValue;
  });
};

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
router.get('/', (req: any, res: any) => {
  try {
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

    // 应用筛选和排序
    let filteredTodos = applyFilters(todos, filters);
    let sortedTodos = applySorting(filteredTodos, sort);

    // 分页
    const pageNum = parseInt(page);
    const pageSize = parseInt(size);
    const startIndex = (pageNum - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedTodos = sortedTodos.slice(startIndex, endIndex);

    const response: PaginatedResponse<Todo> = {
      data: paginatedTodos,
      total: sortedTodos.length,
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
router.get('/:id', (req: any, res: any) => {
  try {
    const { id } = req.params;
    const todo = todos.find(t => t.id === id);

    if (!todo) {
      return res.status(404).json({
        success: false,
        error: 'Todo not found'
      });
    }

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
router.post('/', (req: any, res: any) => {
  try {
    const { title, description, priority = 'medium', tags = [], dueDate }: CreateTodoData = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Title is required'
      });
    }

    const now = new Date();
    const newTodo: Todo = {
      id: generateId(),
      title: title.trim(),
      description: description?.trim(),
      status: 'pending',
      priority,
      tags,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      createdAt: now,
      updatedAt: now,
      order: todos.length + 1,
      history: []
    };

    // 添加创建历史记录
    const historyRecord = createHistoryRecord(newTodo.id, 'create');
    newTodo.history.push(historyRecord);

    todos.push(newTodo);

    res.status(201).json({
      success: true,
      data: newTodo,
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
router.put('/:id', (req: any, res: any) => {
  try {
    const { id } = req.params;
    const updateData: UpdateTodoData = req.body;

    const todoIndex = todos.findIndex(t => t.id === id);
    if (todoIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Todo not found'
      });
    }

    const todo = todos[todoIndex];
    const oldTodo = { ...todo };

    // 更新字段
    if (updateData.title !== undefined) {
      if (updateData.title.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Title cannot be empty'
        });
      }
      todo.title = updateData.title.trim();
    }

    if (updateData.description !== undefined) {
      todo.description = updateData.description?.trim();
    }

    if (updateData.status !== undefined) {
      todo.status = updateData.status;
      if (updateData.status === 'completed' && !todo.completedAt) {
        todo.completedAt = new Date();
      } else if (updateData.status !== 'completed') {
        todo.completedAt = undefined;
      }
    }

    if (updateData.priority !== undefined) {
      todo.priority = updateData.priority;
    }

    if (updateData.tags !== undefined) {
      todo.tags = updateData.tags;
    }

    if (updateData.dueDate !== undefined) {
      todo.dueDate = updateData.dueDate ? new Date(updateData.dueDate) : undefined;
    }

    if (updateData.order !== undefined) {
      todo.order = updateData.order;
    }

    todo.updatedAt = new Date();

    // 记录变更历史
    Object.keys(updateData).forEach(field => {
      if (field in oldTodo && (oldTodo as any)[field] !== (todo as any)[field]) {
        const historyRecord = createHistoryRecord(
          todo.id,
          `update_${field}` as HistoryActionType,
          {
            field,
            oldValue: (oldTodo as any)[field],
            newValue: (todo as any)[field]
          }
        );
        todo.history.push(historyRecord);
      }
    });

    todos[todoIndex] = todo;

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
router.delete('/:id', (req: any, res: any) => {
  try {
    const { id } = req.params;
    const todoIndex = todos.findIndex(t => t.id === id);

    if (todoIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Todo not found'
      });
    }

    const deletedTodo = todos.splice(todoIndex, 1)[0];

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
router.post('/batch', (req: any, res: any) => {
  try {
    const { action, ids, data }: BatchOperation = req.body;

    if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid batch operation parameters'
      });
    }

    let affected = 0;

    if (action === 'delete') {
      const initialLength = todos.length;
      todos = todos.filter(todo => !ids.includes(todo.id));
      affected = initialLength - todos.length;
    } else if (action === 'update') {
      if (!data) {
        return res.status(400).json({
          success: false,
          error: 'Update data is required for batch update'
        });
      }

      todos.forEach(todo => {
        if (ids.includes(todo.id)) {
          const oldTodo = { ...todo };

          // 应用更新
          Object.keys(data).forEach(key => {
            if (key in todo && data[key as keyof UpdateTodoData] !== undefined) {
              (todo as any)[key] = data[key as keyof UpdateTodoData];
            }
          });

          todo.updatedAt = new Date();

          // 记录历史
          const historyRecord = createHistoryRecord(
            todo.id,
            'update_status',
            { field: 'batch_update', oldValue: 'multiple', newValue: 'multiple' }
          );
          todo.history.push(historyRecord);

          affected++;
        }
      });
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
router.post('/reorder', (req: any, res: any) => {
  try {
    const { todoIds } = req.body;

    if (!todoIds || !Array.isArray(todoIds)) {
      return res.status(400).json({
        success: false,
        error: 'todoIds array is required'
      });
    }

    // 更新排序
    todoIds.forEach((id: string, index: number) => {
      const todo = todos.find(t => t.id === id);
      if (todo) {
        todo.order = index + 1;
        todo.updatedAt = new Date();

        const historyRecord = createHistoryRecord(
          todo.id,
          'update_order',
          { field: 'order', oldValue: todo.order, newValue: index + 1 }
        );
        todo.history.push(historyRecord);
      }
    });

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
