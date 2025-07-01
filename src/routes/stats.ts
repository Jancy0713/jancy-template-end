import express, { Router, Request, Response } from 'express';
import { TodoStats, Todo, TodoStatus } from '../types';
import { TodoRepository } from '../config/database';

const router: Router = express.Router();

// 模拟用户ID获取函数（实际项目中应该从认证中间件获取）
function getCurrentUserId(req: any): number {
  // 这里应该从JWT token或session中获取用户ID
  // 为了演示，我们使用固定的用户ID
  return 1;
}

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
router.get('/', async (req: any, res: any) => {
  try {
    const userId = getCurrentUserId(req);

    // 获取基础统计
    const basicStats = await TodoRepository.getStats(userId);

    // 获取标签统计
    const tagStats = await TodoRepository.getTagStats(userId);

    const stats: TodoStats = {
      total: basicStats.total,
      pending: basicStats.pending,
      inProgress: basicStats.inProgress,
      completed: basicStats.completed,
      overdue: basicStats.overdue,
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
router.get('/priority', async (req: any, res: any) => {
  try {
    const userId = getCurrentUserId(req);
    const { db } = require('../config/database');

    // 使用数据库查询获取优先级统计
    const result = await db('todos')
      .where('user_id', userId)
      .select('priority', 'status', db.raw('COUNT(*) as count'))
      .groupBy('priority', 'status');

    const priorityStats = {
      high: { total: 0, pending: 0, inProgress: 0, completed: 0 },
      medium: { total: 0, pending: 0, inProgress: 0, completed: 0 },
      low: { total: 0, pending: 0, inProgress: 0, completed: 0 }
    };

    // 处理查询结果
    result.forEach((row: any) => {
      const priority = row.priority as 'high' | 'medium' | 'low';
      const status = row.status;
      const count = parseInt(row.count) || 0;

      priorityStats[priority].total += count;

      switch (status) {
        case 'pending':
          priorityStats[priority].pending = count;
          break;
        case 'in-progress':
          priorityStats[priority].inProgress = count;
          break;
        case 'completed':
          priorityStats[priority].completed = count;
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
router.get('/timeline', async (req: any, res: any) => {
  try {
    const userId = getCurrentUserId(req);
    const days = parseInt(req.query.days) || 7;
    const { db } = require('../config/database');
    const now = new Date();
    const timeline = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dateStr = date.toISOString();
      const nextDateStr = nextDate.toISOString();

      // 查询当天创建的任务数量
      const createdResult = await db('todos')
        .where('user_id', userId)
        .where('created_at', '>=', dateStr)
        .where('created_at', '<', nextDateStr)
        .count('* as count')
        .first();

      // 查询当天完成的任务数量
      const completedResult = await db('todos')
        .where('user_id', userId)
        .where('completed_at', '>=', dateStr)
        .where('completed_at', '<', nextDateStr)
        .whereNotNull('completed_at')
        .count('* as count')
        .first();

      timeline.push({
        date: date.toISOString().split('T')[0],
        created: parseInt(createdResult?.count as string) || 0,
        completed: parseInt(completedResult?.count as string) || 0
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
router.get('/completion-rate', async (req: any, res: any) => {
  try {
    const userId = getCurrentUserId(req);
    const { db } = require('../config/database');
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 总体完成率
    const totalResult = await db('todos')
      .where('user_id', userId)
      .select(
        db.raw('COUNT(*) as total'),
        db.raw("COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed")
      )
      .first();

    const totalTodos = parseInt(totalResult?.total) || 0;
    const completedTodos = parseInt(totalResult?.completed) || 0;
    const overall = totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;

    // 本周完成率
    const weekResult = await db('todos')
      .where('user_id', userId)
      .where('created_at', '>=', weekAgo.toISOString())
      .select(
        db.raw('COUNT(*) as total'),
        db.raw("COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed")
      )
      .first();

    const thisWeekTotal = parseInt(weekResult?.total) || 0;
    const thisWeekCompleted = parseInt(weekResult?.completed) || 0;
    const thisWeek = thisWeekTotal > 0 ? (thisWeekCompleted / thisWeekTotal) * 100 : 0;

    // 本月完成率
    const monthResult = await db('todos')
      .where('user_id', userId)
      .where('created_at', '>=', monthAgo.toISOString())
      .select(
        db.raw('COUNT(*) as total'),
        db.raw("COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed")
      )
      .first();

    const thisMonthTotal = parseInt(monthResult?.total) || 0;
    const thisMonthCompleted = parseInt(monthResult?.completed) || 0;
    const thisMonth = thisMonthTotal > 0 ? (thisMonthCompleted / thisMonthTotal) * 100 : 0;

    // 平均完成时间
    const completionTimeResult = await db('todos')
      .where('user_id', userId)
      .whereNotNull('completed_at')
      .select('created_at', 'completed_at');

    let averageCompletionTime = 0;
    if (completionTimeResult.length > 0) {
      const totalCompletionTime = completionTimeResult.reduce((sum: number, todo: any) => {
        const created = new Date(todo.created_at).getTime();
        const completed = new Date(todo.completed_at).getTime();
        return sum + (completed - created);
      }, 0);

      averageCompletionTime = totalCompletionTime / completionTimeResult.length / (1000 * 60 * 60); // 转换为小时
    }

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
