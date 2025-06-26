import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import logger, { logHttp, logError } from '../config/logger';

// 创建自定义的morgan token
morgan.token('body', (req: Request) => {
  // 只记录非敏感信息
  if (req.body && typeof req.body === 'object') {
    const sanitizedBody = { ...req.body };
    // 移除敏感字段
    delete sanitizedBody.password;
    delete sanitizedBody.confirm_password;
    delete sanitizedBody.token;
    delete sanitizedBody.refreshToken;
    return JSON.stringify(sanitizedBody);
  }
  return '';
});

morgan.token('query', (req: Request) => {
  return JSON.stringify(req.query);
});

morgan.token('user-agent', (req: Request) => {
  return req.get('User-Agent') || '';
});

morgan.token('real-ip', (req: Request) => {
  return req.ip || req.connection.remoteAddress || '';
});

// 详细的HTTP日志格式
const detailedFormat = ':real-ip - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms - Body: :body - Query: :query';

// 简化的控制台格式
const simpleFormat = ':method :url :status :response-time ms - :res[content-length]';

// 创建morgan中间件
export const httpLogger = morgan(detailedFormat, {
  stream: {
    write: (message: string) => {
      logHttp(message.trim());
    }
  }
});

// 控制台HTTP日志（开发环境）
export const consoleHttpLogger = morgan(simpleFormat, {
  skip: (req: Request, res: Response) => {
    // 跳过静态资源和健康检查
    return req.url.includes('/api-docs') || 
           req.url.includes('/favicon.ico') ||
           req.url === '/health';
  }
});

// 错误日志中间件
export const errorLogger = (err: any, req: Request, res: Response, next: NextFunction) => {
  const errorInfo = {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body ? JSON.stringify(req.body).replace(/"password":"[^"]*"/g, '"password":"***"') : '',
    query: JSON.stringify(req.query),
    headers: {
      ...req.headers,
      authorization: req.headers.authorization ? '***' : undefined
    },
    error: {
      message: err.message,
      stack: err.stack,
      status: err.status || 500
    }
  };

  logError(`HTTP Error: ${err.message}`, err, errorInfo);
  next(err);
};

// 请求详情日志中间件（用于调试）
export const requestDetailLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // 记录请求开始
  const requestInfo = {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    body: req.body ? JSON.stringify(req.body).replace(/"password":"[^"]*"/g, '"password":"***"') : '',
    query: JSON.stringify(req.query),
    params: JSON.stringify(req.params),
    headers: {
      ...req.headers,
      authorization: req.headers.authorization ? '***' : undefined,
      cookie: req.headers.cookie ? '***' : undefined
    }
  };

  logger.debug('Request received', requestInfo);

  // 监听响应结束
  const originalSend = res.send;
  res.send = function(data) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // 记录响应信息
    const responseInfo = {
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: res.get('Content-Length'),
      responseBody: data && typeof data === 'string' && data.length < 1000 ? data : '[Large Response]'
    };

    if (res.statusCode >= 400) {
      logger.warn('Request completed with error', { ...requestInfo, ...responseInfo });
    } else {
      logger.debug('Request completed successfully', { ...requestInfo, ...responseInfo });
    }

    return originalSend.call(this, data);
  };

  next();
};

// 400错误专用日志中间件
export const badRequestLogger = (req: Request, res: Response, next: NextFunction) => {
  const originalStatus = res.status;
  const originalJson = res.json;

  res.status = function(code: number) {
    if (code === 400) {
      const requestInfo = {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        body: req.body ? JSON.stringify(req.body).replace(/"password":"[^"]*"/g, '"password":"***"') : '',
        query: JSON.stringify(req.query),
        params: JSON.stringify(req.params),
        timestamp: new Date().toISOString()
      };

      logger.warn('400 Bad Request detected', requestInfo);
    }
    return originalStatus.call(this, code);
  };

  res.json = function(data: any) {
    if (res.statusCode === 400) {
      logger.warn('400 Response body', { responseData: data });
    }
    return originalJson.call(this, data);
  };

  next();
};
