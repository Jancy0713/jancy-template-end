import express, { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { logInfo, logWarn } from '../config/logger';

const router: Router = express.Router();

// 日志目录路径
const logsDir = path.join(process.cwd(), 'logs');

// 获取日志文件列表
interface LogFile {
  name: string;
  size: number;
  modified: string;
  type: 'error' | 'combined' | 'http' | 'exceptions' | 'rejections';
}

/**
 * @swagger
 * /api/logs:
 *   get:
 *     summary: 获取日志文件列表
 *     description: 获取所有可用的日志文件列表
 *     tags: [Logs]
 *     responses:
 *       200:
 *         description: 日志文件列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       size:
 *                         type: number
 *                       modified:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [error, combined, http, exceptions, rejections]
 */
router.get('/', (req: any, res: any) => {
  try {
    if (!fs.existsSync(logsDir)) {
      return res.json({
        success: true,
        data: [],
        message: 'No logs directory found'
      });
    }

    const files = fs.readdirSync(logsDir);
    const logFiles: LogFile[] = files
      .filter(file => file.endsWith('.log'))
      .map(file => {
        const filePath = path.join(logsDir, file);
        const stats = fs.statSync(filePath);
        
        let type: LogFile['type'] = 'combined';
        if (file.includes('error')) type = 'error';
        else if (file.includes('http')) type = 'http';
        else if (file.includes('exceptions')) type = 'exceptions';
        else if (file.includes('rejections')) type = 'rejections';

        return {
          name: file,
          size: stats.size,
          modified: stats.mtime.toISOString(),
          type
        };
      })
      .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());

    logInfo('Log files list requested', { 
      fileCount: logFiles.length,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      data: logFiles
    });
  } catch (error) {
    logWarn('Error getting log files list', { error: error instanceof Error ? error.message : error });
    res.status(500).json({
      success: false,
      error: 'Failed to get log files'
    });
  }
});

/**
 * @swagger
 * /api/logs/{filename}:
 *   get:
 *     summary: 获取日志文件内容
 *     description: 获取指定日志文件的内容
 *     tags: [Logs]
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: 日志文件名
 *       - in: query
 *         name: lines
 *         schema:
 *           type: integer
 *           default: 100
 *         description: 返回的行数（从文件末尾开始）
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *     responses:
 *       200:
 *         description: 日志文件内容
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     filename:
 *                       type: string
 *                     content:
 *                       type: string
 *                     totalLines:
 *                       type: number
 *                     returnedLines:
 *                       type: number
 */
router.get('/:filename', (req: any, res: any) => {
  try {
    const { filename } = req.params;
    const lines = parseInt(req.query.lines as string) || 100;
    const search = req.query.search as string;

    // 安全检查：防止路径遍历攻击
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filename'
      });
    }

    const filePath = path.join(logsDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Log file not found'
      });
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const allLines = content.split('\n').filter(line => line.trim());
    
    let filteredLines = allLines;
    
    // 如果有搜索关键词，过滤行
    if (search) {
      filteredLines = allLines.filter(line => 
        line.toLowerCase().includes(search.toLowerCase())
      );
    }

    // 获取最后N行
    const returnedLines = filteredLines.slice(-lines);

    logInfo('Log file accessed', { 
      filename,
      totalLines: allLines.length,
      returnedLines: returnedLines.length,
      hasSearch: !!search,
      searchTerm: search,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      data: {
        filename,
        content: returnedLines.join('\n'),
        totalLines: allLines.length,
        returnedLines: returnedLines.length,
        ...(search && { searchTerm: search, matchedLines: filteredLines.length })
      }
    });
  } catch (error) {
    logWarn('Error reading log file', { 
      filename: req.params.filename,
      error: error instanceof Error ? error.message : error 
    });
    res.status(500).json({
      success: false,
      error: 'Failed to read log file'
    });
  }
});

/**
 * @swagger
 * /api/logs/tail/{filename}:
 *   get:
 *     summary: 实时获取日志文件尾部内容
 *     description: 获取日志文件的最新内容（类似tail -f命令）
 *     tags: [Logs]
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: 日志文件名
 *       - in: query
 *         name: lines
 *         schema:
 *           type: integer
 *           default: 50
 *         description: 返回的行数
 *     responses:
 *       200:
 *         description: 日志文件尾部内容
 */
router.get('/tail/:filename', (req: any, res: any) => {
  try {
    const { filename } = req.params;
    const lines = parseInt(req.query.lines as string) || 50;

    // 安全检查
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filename'
      });
    }

    const filePath = path.join(logsDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Log file not found'
      });
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const allLines = content.split('\n').filter(line => line.trim());
    const tailLines = allLines.slice(-lines);

    res.json({
      success: true,
      data: {
        filename,
        content: tailLines.join('\n'),
        lines: tailLines.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to tail log file'
    });
  }
});

export default router;
