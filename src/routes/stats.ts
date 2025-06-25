import express, { Router, Request, Response } from 'express';
import { TodoStats, Todo, TodoStatus } from '../types';

const router: Router = express.Router();

// 这里应该从todos路由中导入数据，为了演示目的，我们重新定义
// 在实际项目中，应该使用共享的数据存储或数据库
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
  },
  {
    id: '4',
    title: '代码重构',
    description: '重构旧项目的代码结构',
    status: 'completed',
    priority: 'high',
    tags: ['work', 'refactoring'],
    completedAt: new Date('2025-06-23'),
    createdAt: new Date('2025-06-18'),
    updatedAt: new Date('2025-06-23'),
    order: 4,
    history: []
  },
  {
    id: '5',
    title: '学习Vue 3',
    description: '学习Vue 3的新特性和Composition API',
    status: 'in-progress',
    priority: 'medium',
    tags: ['learning', 'vue'],
    dueDate: new Date('2025-06-20'), // 已过期
    createdAt: new Date('2025-06-10'),
    updatedAt: new Date('2025-06-25'),
    order: 5,
    history: []
  }
];

/**
 * @swagger
 * /api/stats:
 *   get:
 *     summary: 获取任务统计信息
 *     description: 获取任务的各种统计数据，包括总数、状态分布、过期任务等
 *     tags: [Stats]
 *     responses:
 *       200:
 *         description: 成功获取统计信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TodoStats'
 */
router.get('/', (req: any, res: any) => {
  try {
    const now = new Date();
    
    // 基础统计
    const total = todos.length;
    const pending = todos.filter(todo => todo.status === 'pending').length;
    const inProgress = todos.filter(todo => todo.status === 'in-progress').length;
    const completed = todos.filter(todo => todo.status === 'completed').length;
    
    // 过期任务统计
    const overdue = todos.filter(todo => 
      todo.status !== 'completed' && 
      todo.dueDate && 
      new Date(todo.dueDate) < now
    ).length;
    
    // 标签统计
    const tagCounts: { [key: string]: number } = {};
    todos.forEach(todo => {
      todo.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    const tagStats = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
    
    const stats: TodoStats = {
      total,
      pending,
      inProgress,
      completed,
      overdue,
      tagStats
    };
    
    res.json({
      success: true,
      data: stats
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
 * /api/stats/priority:
 *   get:
 *     summary: 获取优先级统计
 *     description: 获取按优先级分组的任务统计
 *     tags: [Stats]
 *     responses:
 *       200:
 *         description: 成功获取优先级统计
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     high:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         pending:
 *                           type: integer
 *                         inProgress:
 *                           type: integer
 *                         completed:
 *                           type: integer
 *                     medium:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         pending:
 *                           type: integer
 *                         inProgress:
 *                           type: integer
 *                         completed:
 *                           type: integer
 *                     low:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         pending:
 *                           type: integer
 *                         inProgress:
 *                           type: integer
 *                         completed:
 *                           type: integer
 */
router.get('/priority', (req: any, res: any) => {
  try {
    const priorityStats = {
      high: { total: 0, pending: 0, inProgress: 0, completed: 0 },
      medium: { total: 0, pending: 0, inProgress: 0, completed: 0 },
      low: { total: 0, pending: 0, inProgress: 0, completed: 0 }
    };
    
    todos.forEach(todo => {
      const priority = todo.priority;
      priorityStats[priority].total++;
      
      switch (todo.status) {
        case 'pending':
          priorityStats[priority].pending++;
          break;
        case 'in-progress':
          priorityStats[priority].inProgress++;
          break;
        case 'completed':
          priorityStats[priority].completed++;
          break;
      }
    });
    
    res.json({
      success: true,
      data: priorityStats
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
 * /api/stats/timeline:
 *   get:
 *     summary: 获取时间线统计
 *     description: 获取按日期分组的任务完成统计
 *     tags: [Stats]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *         description: 统计天数
 *     responses:
 *       200:
 *         description: 成功获取时间线统计
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
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                       created:
 *                         type: integer
 *                       completed:
 *                         type: integer
 */
router.get('/timeline', (req: any, res: any) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const now = new Date();
    const timeline = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const created = todos.filter(todo => {
        const createdDate = new Date(todo.createdAt);
        return createdDate >= date && createdDate < nextDate;
      }).length;

      const completed = todos.filter(todo => {
        if (!todo.completedAt) return false;
        const completedDate = new Date(todo.completedAt);
        return completedDate >= date && completedDate < nextDate;
      }).length;

      timeline.push({
        date: date.toISOString().split('T')[0],
        created,
        completed
      });
    }

    res.json({
      success: true,
      data: timeline
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
 * /api/stats/completion-rate:
 *   get:
 *     summary: 获取完成率统计
 *     description: 获取任务完成率相关统计
 *     tags: [Stats]
 *     responses:
 *       200:
 *         description: 成功获取完成率统计
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     overall:
 *                       type: number
 *                       format: float
 *                       description: 总体完成率
 *                     thisWeek:
 *                       type: number
 *                       format: float
 *                       description: 本周完成率
 *                     thisMonth:
 *                       type: number
 *                       format: float
 *                       description: 本月完成率
 *                     averageCompletionTime:
 *                       type: number
 *                       description: 平均完成时间（小时）
 */
router.get('/completion-rate', (req: any, res: any) => {
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 总体完成率
    const totalTodos = todos.length;
    const completedTodos = todos.filter(todo => todo.status === 'completed').length;
    const overall = totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;

    // 本周完成率
    const thisWeekTodos = todos.filter(todo => new Date(todo.createdAt) >= weekAgo);
    const thisWeekCompleted = thisWeekTodos.filter(todo => todo.status === 'completed').length;
    const thisWeek = thisWeekTodos.length > 0 ? (thisWeekCompleted / thisWeekTodos.length) * 100 : 0;

    // 本月完成率
    const thisMonthTodos = todos.filter(todo => new Date(todo.createdAt) >= monthAgo);
    const thisMonthCompleted = thisMonthTodos.filter(todo => todo.status === 'completed').length;
    const thisMonth = thisMonthTodos.length > 0 ? (thisMonthCompleted / thisMonthTodos.length) * 100 : 0;

    // 平均完成时间
    const completedWithTime = todos.filter(todo => todo.completedAt && todo.createdAt);
    const totalCompletionTime = completedWithTime.reduce((sum, todo) => {
      const created = new Date(todo.createdAt).getTime();
      const completed = new Date(todo.completedAt!).getTime();
      return sum + (completed - created);
    }, 0);

    const averageCompletionTime = completedWithTime.length > 0
      ? totalCompletionTime / completedWithTime.length / (1000 * 60 * 60) // 转换为小时
      : 0;

    res.json({
      success: true,
      data: {
        overall: Math.round(overall * 100) / 100,
        thisWeek: Math.round(thisWeek * 100) / 100,
        thisMonth: Math.round(thisMonth * 100) / 100,
        averageCompletionTime: Math.round(averageCompletionTime * 100) / 100
      }
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
