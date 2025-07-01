import express, { Router, Request, Response } from 'express';
import { User, UserInput, TypedRequest, ApiResponse, ErrorResponse } from '../types';
import { UserRepository, DatabaseUser } from '../config/database';
import { logError, logInfo } from '../config/logger';

const router: Router = express.Router();

// 将 DatabaseUser 转换为 User 的辅助函数
function convertToUser(dbUser: DatabaseUser): User {
  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    avatar: dbUser.avatar
  };
}

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: 获取所有用户
 *     description: 获取系统中所有用户的列表
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: 成功获取用户列表
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const dbUsers = await UserRepository.getAll();
    const users = dbUsers.map(convertToUser);

    res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    logError('Get users error', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: 获取单个用户
 *     description: 根据用户ID获取用户详细信息
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 用户ID
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: 成功获取用户信息
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: 用户不存在
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
router.get('/:id', async (req: any, res: any) => {
  try {
    const userId: number = parseInt(req.params.id, 10);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    const dbUser = await UserRepository.findById(userId);

    if (!dbUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = convertToUser(dbUser);

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    logError('Get user by ID error', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: 创建新用户
 *     description: 创建一个新的用户账户
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserInput'
 *     responses:
 *       201:
 *         description: 用户创建成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: 请求参数错误
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
router.post('/', async (req: any, res: any) => {
  try {
    const { name, email, age, avatar }: UserInput = req.body;

    // 简单验证
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Name and email are required'
      });
    }

    // 检查邮箱是否已存在
    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already exists'
      });
    }

    // 创建新用户 - 注意：这里使用默认密码，实际应用中应该要求密码
    const defaultPassword = 'defaultPassword123'; // 实际应用中应该从请求中获取
    const userAvatar = avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`;

    const dbUser = await UserRepository.create(email, defaultPassword, name, userAvatar);
    const newUser = convertToUser(dbUser);

    logInfo('User created successfully', {
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      data: newUser,
      message: 'User created successfully'
    });
  } catch (error) {
    logError('Create user error', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: 更新用户信息
 *     description: 根据用户ID更新用户信息
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 用户ID
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserInput'
 *     responses:
 *       200:
 *         description: 用户更新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: 用户不存在
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
router.put('/:id', async (req: any, res: any) => {
  try {
    const userId: number = parseInt(req.params.id, 10);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    const existingUser = await UserRepository.findById(userId);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const { name, email, age, avatar }: Partial<UserInput> = req.body;

    // 如果要更新邮箱，检查是否已存在
    if (email && email !== existingUser.email) {
      const emailExists = await UserRepository.findByEmail(email);
      if (emailExists) {
        return res.status(400).json({
          success: false,
          error: 'Email already exists'
        });
      }
    }

    // 更新用户信息 - 注意：这里只更新 name 和 avatar，因为 UserRepository.update 只支持这些字段
    const updatedUser = await UserRepository.update(
      userId,
      name || existingUser.name,
      avatar !== undefined ? avatar : existingUser.avatar
    );

    if (!updatedUser) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update user'
      });
    }

    const user = convertToUser(updatedUser);

    logInfo('User updated successfully', {
      userId: user.id,
      email: user.email,
      updatedFields: { name: !!name, avatar: avatar !== undefined },
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      data: user,
      message: 'User updated successfully'
    });
  } catch (error) {
    logError('Update user error', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: 删除用户
 *     description: 根据用户ID删除用户
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 用户ID
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: 用户删除成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: 用户不存在
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
router.delete('/:id', async (req: any, res: any) => {
  try {
    const userId: number = parseInt(req.params.id, 10);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    const existingUser = await UserRepository.findById(userId);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // 删除用户（不再有测试账号保护）

    const deletedCount = await UserRepository.delete(userId);

    if (deletedCount === 0) {
      return res.status(500).json({
        success: false,
        error: 'Failed to delete user'
      });
    }

    const deletedUser = convertToUser(existingUser);

    logInfo('User deleted successfully', {
      userId: deletedUser.id,
      email: deletedUser.email,
      name: deletedUser.name,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      data: deletedUser,
      message: 'User deleted successfully'
    });
  } catch (error) {
    logError('Delete user error', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
