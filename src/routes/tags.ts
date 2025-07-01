import express, { Router, Request, Response } from 'express';
import { Tag, CreateTagData, UpdateTagData, ApiResponse } from '../types';
import { TagRepository, DatabaseTag } from '../config/database';

const router: Router = express.Router();

// 工具函数 - 将数据库标签转换为API标签格式
function convertDatabaseTagToTag(dbTag: DatabaseTag): Tag {
  return {
    id: dbTag.id.toString(),
    name: dbTag.name,
    color: dbTag.color,
    createdAt: new Date(dbTag.created_at)
  };
}

// 模拟用户ID获取函数（实际项目中应该从认证中间件获取）
function getCurrentUserId(req: any): number {
  // 这里应该从JWT token或session中获取用户ID
  // 为了演示，我们使用固定的用户ID
  return 1;
}

/**
 * @swagger
 * /api/tags:
 *   get:
 *     summary: 获取标签列表
 *     description: 获取所有标签的列表
 *     tags: [Tags]
 *     responses:
 *       200:
 *         description: 成功获取标签列表
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
 *                     $ref: '#/components/schemas/Tag'
 *                 count:
 *                   type: integer
 *                   example: 6
 */
router.get('/', async (req: any, res: any) => {
  try {
    const userId = getCurrentUserId(req);
    const dbTags = await TagRepository.findByUserId(userId);
    const tags = dbTags.map(convertDatabaseTagToTag);

    res.json({
      success: true,
      data: tags,
      count: tags.length
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
 * /api/tags/{id}:
 *   get:
 *     summary: 获取单个标签
 *     description: 根据ID获取标签详情
 *     tags: [Tags]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 标签ID
 *     responses:
 *       200:
 *         description: 成功获取标签详情
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Tag'
 *       404:
 *         description: 标签不存在
 */
router.get('/:id', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const tagId = parseInt(id, 10);

    if (isNaN(tagId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tag ID'
      });
    }

    const dbTag = await TagRepository.findById(tagId);

    if (!dbTag) {
      return res.status(404).json({
        success: false,
        error: 'Tag not found'
      });
    }

    const tag = convertDatabaseTagToTag(dbTag);

    res.json({
      success: true,
      data: tag
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
 * /api/tags:
 *   post:
 *     summary: 创建新标签
 *     description: 创建一个新的标签
 *     tags: [Tags]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTagData'
 *     responses:
 *       201:
 *         description: 标签创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Tag'
 *       400:
 *         description: 请求参数错误
 */
router.post('/', async (req: any, res: any) => {
  try {
    const userId = getCurrentUserId(req);
    const { name, color }: CreateTagData = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Tag name is required'
      });
    }

    if (!color || color.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Tag color is required'
      });
    }

    // 检查标签名是否已存在
    const existingTag = await TagRepository.findByNameAndUserId(name.trim(), userId);
    if (existingTag) {
      return res.status(400).json({
        success: false,
        error: 'Tag name already exists'
      });
    }

    const dbTag = await TagRepository.create(name.trim(), color.trim(), userId);
    const newTag = convertDatabaseTagToTag(dbTag);

    res.status(201).json({
      success: true,
      data: newTag,
      message: 'Tag created successfully'
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
 * /api/tags/{id}:
 *   put:
 *     summary: 更新标签
 *     description: 更新指定ID的标签
 *     tags: [Tags]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 标签ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTagData'
 *     responses:
 *       200:
 *         description: 标签更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Tag'
 *       404:
 *         description: 标签不存在
 *       400:
 *         description: 请求参数错误
 */
router.put('/:id', async (req: any, res: any) => {
  try {
    const userId = getCurrentUserId(req);
    const { id } = req.params;
    const updateData: UpdateTagData = req.body;
    const tagId = parseInt(id, 10);

    if (isNaN(tagId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tag ID'
      });
    }

    const existingTag = await TagRepository.findById(tagId);
    if (!existingTag) {
      return res.status(404).json({
        success: false,
        error: 'Tag not found'
      });
    }

    // 验证更新数据
    if (updateData.name !== undefined) {
      if (updateData.name.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Tag name cannot be empty'
        });
      }

      // 检查名称是否与其他标签重复
      const duplicateTag = await TagRepository.findByNameAndUserId(updateData.name.trim(), userId);
      if (duplicateTag && duplicateTag.id !== tagId) {
        return res.status(400).json({
          success: false,
          error: 'Tag name already exists'
        });
      }
    }

    if (updateData.color !== undefined && updateData.color.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Tag color cannot be empty'
      });
    }

    // 更新标签
    const updatedDbTag = await TagRepository.update(
      tagId,
      updateData.name?.trim(),
      updateData.color?.trim()
    );

    if (!updatedDbTag) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update tag'
      });
    }

    const tag = convertDatabaseTagToTag(updatedDbTag);

    res.json({
      success: true,
      data: tag,
      message: 'Tag updated successfully'
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
 * /api/tags/{id}:
 *   delete:
 *     summary: 删除标签
 *     description: 删除指定ID的标签
 *     tags: [Tags]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 标签ID
 *     responses:
 *       200:
 *         description: 标签删除成功
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
 *                   example: "Tag deleted successfully"
 *       404:
 *         description: 标签不存在
 */
router.delete('/:id', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const tagId = parseInt(id, 10);

    if (isNaN(tagId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tag ID'
      });
    }

    const existingTag = await TagRepository.findById(tagId);
    if (!existingTag) {
      return res.status(404).json({
        success: false,
        error: 'Tag not found'
      });
    }

    // 转换为API格式（在删除前）
    const deletedTag = convertDatabaseTagToTag(existingTag);

    // 删除标签（会自动删除关联的todo_tags记录）
    await TagRepository.delete(tagId);

    res.json({
      success: true,
      data: deletedTag,
      message: 'Tag deleted successfully'
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
