import express, { Router, Request, Response } from 'express';
import {
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  LogoutRequest,
  AuthUser,
  UpdateUserRequest,
  DeleteAccountRequest
} from '../types';
import { logError, logInfo, logWarn } from '../config/logger';

const router: Router = express.Router();

// 模拟用户数据库
interface DatabaseUser {
  id: number;
  email: string;
  password: string;
  name: string;
  avatar?: string;
}

const users: DatabaseUser[] = [
  { id: 1, email: 'admin@example.com', password: 'admin123', name: 'Admin', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin' },
  { id: 2, email: 'user@example.com', password: 'user123', name: 'User', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user' }
];

// 模拟token黑名单 (实际项目中应该使用Redis或数据库)
const tokenBlacklist: Set<string> = new Set();
const refreshTokenStore: Map<string, { userId: number; createdAt: number }> = new Map();

// 生成唯一用户名的辅助函数
function generateUniqueUsername(email: string, providedName?: string): string {
  let baseName = providedName || email.split('@')[0];
  let username = baseName;
  let counter = 1;

  // 检查用户名是否已存在（这里简化检查，实际项目中应该查询数据库）
  while (users.some(user => user.name === username)) {
    username = `${baseName}${counter}`;
    counter++;
  }

  return username;
}

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: 用户登录
 *     description: 用户使用邮箱和密码登录系统
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: 登录成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: 邮箱或密码错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', (req: any, res: any) => {
  try {
    const { email, password }: LoginRequest = req.body;
    
    // 验证必填字段
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }
    
    // 查找用户
    const user: DatabaseUser | undefined = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }
    
    // 验证密码 (实际项目中应该使用加密密码)
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }
    
    // 模拟生成 JWT token 和 refresh token (实际项目中应该使用真实的JWT)
    const token: string = `mock_token_${user.id}_${Date.now()}`;
    const refreshToken: string = `mock_refresh_token_${user.id}_${Date.now()}`;

    // 定义过期时间（秒）
    const tokenExpiresIn = 60 * 60; // 1小时
    const refreshTokenExpiresIn = 7 * 24 * 60 * 60; // 7天

    // 存储refresh token
    refreshTokenStore.set(refreshToken, {
      userId: user.id,
      createdAt: Date.now()
    });

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar
    };

    res.json({
      success: true,
      data: {
        user: authUser,
        token,
        refreshToken,
        expiresIn: tokenExpiresIn,
        refreshExpiresIn: refreshTokenExpiresIn
      },
      message: 'Login successful'
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
 * /api/auth/register:
 *   post:
 *     summary: 用户注册
 *     description: 创建新的用户账户。用户名可选，如果不提供将使用邮箱前缀作为默认用户名。如果用户名已存在，系统会自动添加数字后缀确保唯一性。
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: 注册成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: 请求参数错误或邮箱已存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/register', (req: any, res: any) => {
  try {
    const { name, email, password, confirm_password }: RegisterRequest = req.body;

    logInfo('Registration attempt', {
      email,
      hasName: !!name,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // 验证必填字段
    if (!email || !password || !confirm_password) {
      logWarn('Registration failed: Missing required fields', {
        email,
        missingFields: {
          email: !email,
          password: !password,
          confirm_password: !confirm_password
        },
        ip: req.ip
      });
      return res.status(400).json({
        success: false,
        error: 'Email, password and confirm_password are required'
      });
    }

    // 生成唯一用户名
    const userName = generateUniqueUsername(email, name);

    // 验证密码确认
    if (password !== confirm_password) {
      logWarn('Registration failed: Password mismatch', { email, ip: req.ip });
      return res.status(400).json({
        success: false,
        error: 'Password and confirm_password do not match'
      });
    }

    // 验证密码长度
    if (password.length < 6) {
      logWarn('Registration failed: Password too short', {
        email,
        passwordLength: password.length,
        ip: req.ip
      });
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }

    // 检查邮箱是否已存在
    const existingUser: DatabaseUser | undefined = users.find(u => u.email === email);
    if (existingUser) {
      logWarn('Registration failed: Email already exists', { email, ip: req.ip });
      return res.status(400).json({
        success: false,
        error: 'Email already registered'
      });
    }

    // 创建新用户
    const newUser: DatabaseUser = {
      id: users.length + 1,
      name: userName,
      email,
      password, // 实际项目中应该加密密码
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}` // 默认头像
    };

    users.push(newUser);

    // 模拟生成 JWT token 和 refresh token
    const token: string = `mock_token_${newUser.id}_${Date.now()}`;
    const refreshToken: string = `mock_refresh_token_${newUser.id}_${Date.now()}`;

    // 定义过期时间（秒）
    const tokenExpiresIn = 60 * 60; // 1小时
    const refreshTokenExpiresIn = 7 * 24 * 60 * 60; // 7天

    // 存储refresh token
    refreshTokenStore.set(refreshToken, {
      userId: newUser.id,
      createdAt: Date.now()
    });

    const authUser: AuthUser = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      avatar: newUser.avatar
    };

    logInfo('User registered successfully', {
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      generatedUsername: userName,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      data: {
        user: authUser,
        token,
        refreshToken,
        expiresIn: tokenExpiresIn,
        refreshExpiresIn: refreshTokenExpiresIn
      },
      message: 'Registration successful'
    });
  } catch (error) {
    logError('Registration error', error, {
      email: req.body?.email,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      requestBody: JSON.stringify(req.body).replace(/"password":"[^"]*"/g, '"password":"***"')
    });

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: 获取用户信息
 *     description: 获取当前登录用户的个人信息（需要认证）
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取用户信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: 未授权或token无效
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/profile', (req: any, res: any) => {
  try {
    // 模拟从token中获取用户信息
    const token: string | undefined = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    // 检查token是否在黑名单中
    if (tokenBlacklist.has(token)) {
      return res.status(401).json({
        success: false,
        error: 'Token has been revoked'
      });
    }

    // 模拟验证token (实际项目中应该验证真实的JWT)
    if (!token.startsWith('mock_token_')) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    // 从token中提取用户ID (模拟)
    const tokenParts: string[] = token.split('_');
    const userId: number = parseInt(tokenParts[2], 10);
    const user: DatabaseUser | undefined = users.find(u => u.id === userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar
    };

    res.json({
      success: true,
      data: authUser
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
 * /api/auth/profile:
 *   put:
 *     summary: 更新用户信息
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *     responses:
 *       200:
 *         description: 用户信息更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   example: 'Profile updated successfully'
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: 未授权
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/profile', (req: any, res: any) => {
  try {
    // 模拟从token中获取用户信息
    const token: string | undefined = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    // 检查token是否在黑名单中
    if (tokenBlacklist.has(token)) {
      return res.status(401).json({
        success: false,
        error: 'Token has been revoked'
      });
    }

    // 模拟验证token (实际项目中应该验证真实的JWT)
    if (!token.startsWith('mock_token_')) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    // 从token中提取用户ID (模拟)
    const tokenParts: string[] = token.split('_');
    const userId: number = parseInt(tokenParts[2], 10);
    const userIndex: number = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    const { name, avatar }: UpdateUserRequest = req.body;

    // 验证至少有一个字段需要更新
    if (!name && !avatar) {
      return res.status(400).json({
        success: false,
        error: 'At least one field (name or avatar) is required'
      });
    }

    // 更新用户信息
    if (name) {
      users[userIndex].name = name;
    }
    if (avatar) {
      users[userIndex].avatar = avatar;
    }

    const updatedUser = users[userIndex];
    const authUser: AuthUser = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      avatar: updatedUser.avatar
    };

    res.json({
      success: true,
      data: authUser,
      message: 'Profile updated successfully'
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
 * /api/auth/refresh-token:
 *   post:
 *     summary: 刷新访问令牌
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: 令牌刷新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefreshTokenResponse'
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: 刷新令牌无效或已过期
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/refresh-token', (req: any, res: any) => {
  try {
    const { refreshToken }: RefreshTokenRequest = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    // 验证refresh token
    const tokenData = refreshTokenStore.get(refreshToken);
    if (!tokenData) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }

    // 检查refresh token是否过期 (假设7天过期)
    const tokenAge = Date.now() - tokenData.createdAt;
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7天
    if (tokenAge > maxAge) {
      refreshTokenStore.delete(refreshToken);
      return res.status(401).json({
        success: false,
        error: 'Refresh token expired'
      });
    }

    // 查找用户
    const user = users.find(u => u.id === tokenData.userId);
    if (!user) {
      refreshTokenStore.delete(refreshToken);
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // 生成新的token和refresh token
    const newToken = `mock_token_${user.id}_${Date.now()}`;
    const newRefreshToken = `mock_refresh_token_${user.id}_${Date.now()}`;

    // 定义过期时间（秒）
    const tokenExpiresIn = 60 * 60; // 1小时
    const refreshTokenExpiresIn = 7 * 24 * 60 * 60; // 7天

    // 删除旧的refresh token，存储新的
    refreshTokenStore.delete(refreshToken);
    refreshTokenStore.set(newRefreshToken, {
      userId: user.id,
      createdAt: Date.now()
    });

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
        expiresIn: tokenExpiresIn,
        refreshExpiresIn: refreshTokenExpiresIn
      },
      message: 'Token refreshed successfully'
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
 * /api/auth/logout:
 *   post:
 *     summary: 用户登出
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LogoutRequest'
 *     responses:
 *       200:
 *         description: 登出成功
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
 *                   example: 'Logout successful'
 *       401:
 *         description: 未授权
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/logout', (req: any, res: any) => {
  try {
    // 从请求头或请求体中获取token
    const authHeader = req.headers.authorization;
    const headerToken = authHeader?.replace('Bearer ', '');
    const { token: bodyToken, refreshToken }: LogoutRequest = req.body || {};

    const token = headerToken || bodyToken;

    if (!token && !refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Token or refresh token required'
      });
    }

    // 将token添加到黑名单
    if (token) {
      tokenBlacklist.add(token);
    }

    // 删除refresh token
    if (refreshToken) {
      refreshTokenStore.delete(refreshToken);
    }

    res.json({
      success: true,
      message: 'Logout successful'
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
 * /api/auth/delete-account:
 *   delete:
 *     summary: 注销账号
 *     description: 永久删除用户账号及相关数据。此操作不可逆，主要用于e2e测试中清理测试数据。
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeleteAccountRequest'
 *     responses:
 *       200:
 *         description: 账号删除成功
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
 *                   example: 'Account deleted successfully'
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: 未授权或密码错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: 无法删除默认账号
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/delete-account', (req: any, res: any) => {
  try {
    // 模拟从token中获取用户信息
    const token: string | undefined = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    // 检查token是否在黑名单中
    if (tokenBlacklist.has(token)) {
      return res.status(401).json({
        success: false,
        error: 'Token has been revoked'
      });
    }

    // 模拟验证token (实际项目中应该验证真实的JWT)
    if (!token.startsWith('mock_token_')) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    // 从token中提取用户ID (模拟)
    const tokenParts: string[] = token.split('_');
    const userId: number = parseInt(tokenParts[2], 10);
    const userIndex: number = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = users[userIndex];
    const { password, confirmText }: DeleteAccountRequest = req.body;

    // 验证必填字段
    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required to delete account'
      });
    }

    // 验证密码
    if (user.password !== password) {
      logWarn('Account deletion failed: Invalid password', {
        userId: user.id,
        email: user.email,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(401).json({
        success: false,
        error: 'Invalid password'
      });
    }

    // 可选：验证确认文本
    if (confirmText && confirmText !== 'DELETE MY ACCOUNT') {
      return res.status(400).json({
        success: false,
        error: 'Confirmation text must be "DELETE MY ACCOUNT"'
      });
    }

    // 防止删除默认的测试账号（可选保护）
    const protectedEmails = ['admin@example.com', 'user@example.com'];
    if (protectedEmails.includes(user.email)) {
      return res.status(403).json({
        success: false,
        error: 'Cannot delete default test accounts'
      });
    }

    // 记录删除操作
    logInfo('Account deletion initiated', {
      userId: user.id,
      email: user.email,
      name: user.name,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // 删除用户相关的所有数据
    // 1. 将当前token加入黑名单
    tokenBlacklist.add(token);

    // 2. 删除所有相关的refresh token
    const tokensToDelete: string[] = [];
    refreshTokenStore.forEach((tokenData, refreshToken) => {
      if (tokenData.userId === userId) {
        tokensToDelete.push(refreshToken);
      }
    });
    tokensToDelete.forEach(refreshToken => {
      refreshTokenStore.delete(refreshToken);
    });

    // 3. 从用户数组中删除用户
    users.splice(userIndex, 1);

    logInfo('Account deleted successfully', {
      deletedUserId: userId,
      deletedEmail: user.email,
      deletedName: user.name,
      remainingUsersCount: users.length,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    logError('Account deletion error', error, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      requestBody: JSON.stringify(req.body).replace(/"password":"[^"]*"/g, '"password":"***"')
    });

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

export default router;
