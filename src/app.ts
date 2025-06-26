import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import swaggerSpecs from './config/swagger';
import { config } from 'dotenv';
import { HealthResponse } from './types';
import routes from './routes';

// 导入日志系统
import logger, { logInfo, logError } from './config/logger';
import {
  httpLogger,
  consoleHttpLogger,
  errorLogger,
  requestDetailLogger,
  badRequestLogger
} from './middleware/requestLogger';

// 加载环境变量
config();

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);

// 中间件配置
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      connectSrc: ["'self'", "http://localhost:*", "http://192.168.50.79:*"]
    }
  }
})); // 安全头部

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://192.168.50.79:3000',
    process.env.CORS_ORIGIN
  ].filter((origin): origin is string => Boolean(origin)),
  credentials: true
}));

// 日志中间件
app.use(httpLogger); // 详细的HTTP日志记录到文件
if (process.env.NODE_ENV !== 'production') {
  app.use(consoleHttpLogger); // 开发环境控制台日志
  app.use(requestDetailLogger); // 详细的请求调试日志
}
app.use(badRequestLogger); // 400错误专用日志

app.use(express.json({ limit: '10mb' })); // 解析JSON请求体
app.use(express.urlencoded({ extended: true })); // 解析URL编码请求体

// Swagger JSON 端点 - 提供原始的OpenAPI JSON文档
app.get('/api-docs/swagger.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(swaggerSpecs);
});

// Swagger UI 文档 - 特殊处理以支持局域网访问
app.use('/api-docs', (req: Request, res: Response, next: NextFunction) => {
  // 为Swagger UI设置更宽松的CSP策略
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' http: https:;"
  );
  next();
}, swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Express.js Backend API Documentation',
  swaggerOptions: {
    url: '/api-docs/swagger.json'
  }
}));

// 路由
app.use('/api', routes);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: 健康检查
 *     description: 检查服务器运行状态
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: 服务器运行正常
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
app.get('/health', (req: Request, res: Response<HealthResponse>) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: API欢迎页面
 *     description: 获取API基本信息和可用端点
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API基本信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Welcome to Express.js Backend API"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 endpoints:
 *                   type: object
 *                   properties:
 *                     health:
 *                       type: string
 *                       example: "/health"
 *                     api:
 *                       type: string
 *                       example: "/api"
 *                     docs:
 *                       type: string
 *                       example: "/api-docs"
 */
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Express.js Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      docs: '/api-docs'
    }
  });
});

// 404 处理
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// 全局错误处理
app.use(errorLogger); // 错误日志记录
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logError('Unhandled error', err, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(500).json({
    error: err.message || 'Internal Server Error',
    ...(isDevelopment && { stack: err.stack })
  });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  const startupInfo = {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    localUrl: `http://localhost:${PORT}`,
    networkUrl: `http://192.168.50.79:${PORT}`,
    docsUrl: `http://192.168.50.79:${PORT}/api-docs`,
    logsDir: 'logs/',
    timestamp: new Date().toISOString()
  };

  logInfo('🚀 Server started successfully', startupInfo);

  // 控制台输出（保留用户友好的格式）
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Local Access: http://localhost:${PORT}`);
  console.log(`🌐 Network Access: http://192.168.50.79:${PORT}`);
  console.log(`📚 API Documentation: http://192.168.50.79:${PORT}/api-docs`);
  console.log(`📝 Logs Directory: logs/`);
});

export default app;
