import express, { Request, Response, Router } from 'express';

const router: Router = express.Router();

// 导入各个路由模块
import userRoutes from './users';
import authRoutes from './auth';
import todoRoutes from './todos';
import tagRoutes from './tags';
import statsRoutes from './stats';
import logsRoutes from './logs';

// API 根路径
router.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'TODO List API Routes',
    version: '1.0.0',
    availableRoutes: [
      'GET /api/users - 用户相关接口',
      'POST /api/auth/login - 用户登录',
      'POST /api/auth/register - 用户注册',
      'GET /api/todos - 获取任务列表',
      'POST /api/todos - 创建新任务',
      'PUT /api/todos/:id - 更新任务',
      'DELETE /api/todos/:id - 删除任务',
      'POST /api/todos/batch - 批量操作任务',
      'POST /api/todos/reorder - 重新排序任务',
      'GET /api/tags - 获取标签列表',
      'POST /api/tags - 创建新标签',
      'PUT /api/tags/:id - 更新标签',
      'DELETE /api/tags/:id - 删除标签',
      'GET /api/stats - 获取统计信息',
      'GET /api/stats/priority - 获取优先级统计',
      'GET /api/stats/timeline - 获取时间线统计',
      'GET /api/stats/completion-rate - 获取完成率统计',
      'GET /api/logs - 获取日志文件列表',
      'GET /api/logs/:filename - 获取日志文件内容',
      'GET /api/logs/tail/:filename - 实时获取日志尾部内容'
    ]
  });
});

// 注册路由
router.use('/users', userRoutes);
router.use('/auth', authRoutes);
router.use('/todos', todoRoutes);
router.use('/tags', tagRoutes);
router.use('/stats', statsRoutes);
router.use('/logs', logsRoutes);

export default router;
