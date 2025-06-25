import express, { Router, Request, Response } from 'express';
import { Tag, CreateTagData, UpdateTagData, ApiResponse } from '../types';

const router: Router = express.Router();

// 模拟标签数据
let tags: Tag[] = [
  {
    id: '1',
    name: 'work',
    color: '#409EFF',
    createdAt: new Date('2025-06-20')
  },
  {
    id: '2',
    name: 'personal',
    color: '#67C23A',
    createdAt: new Date('2025-06-20')
  },
  {
    id: '3',
    name: 'learning',
    color: '#E6A23C',
    createdAt: new Date('2025-06-21')
  },
  {
    id: '4',
    name: 'health',
    color: '#F56C6C',
    createdAt: new Date('2025-06-22')
  },
  {
    id: '5',
    name: 'documentation',
    color: '#909399',
    createdAt: new Date('2025-06-23')
  },
  {
    id: '6',
    name: 'typescript',
    color: '#3178C6',
    createdAt: new Date('2025-06-24')
  }
];

let nextTagId = 7;

// 工具函数
const generateTagId = (): string => (nextTagId++).toString();

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
router.get('/', (req: any, res: any) => {
  try {
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
router.get('/:id', (req: any, res: any) => {
  try {
    const { id } = req.params;
    const tag = tags.find(t => t.id === id);
    
    if (!tag) {
      return res.status(404).json({
        success: false,
        error: 'Tag not found'
      });
    }
    
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
router.post('/', (req: any, res: any) => {
  try {
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
    const existingTag = tags.find(t => t.name.toLowerCase() === name.trim().toLowerCase());
    if (existingTag) {
      return res.status(400).json({
        success: false,
        error: 'Tag name already exists'
      });
    }
    
    const newTag: Tag = {
      id: generateTagId(),
      name: name.trim(),
      color: color.trim(),
      createdAt: new Date()
    };
    
    tags.push(newTag);
    
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
router.put('/:id', (req: any, res: any) => {
  try {
    const { id } = req.params;
    const updateData: UpdateTagData = req.body;

    const tagIndex = tags.findIndex(t => t.id === id);
    if (tagIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Tag not found'
      });
    }

    const tag = tags[tagIndex];

    // 更新名称
    if (updateData.name !== undefined) {
      if (updateData.name.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Tag name cannot be empty'
        });
      }

      // 检查名称是否与其他标签重复
      const existingTag = tags.find(t =>
        t.id !== id && t.name.toLowerCase() === updateData.name!.trim().toLowerCase()
      );
      if (existingTag) {
        return res.status(400).json({
          success: false,
          error: 'Tag name already exists'
        });
      }

      tag.name = updateData.name.trim();
    }

    // 更新颜色
    if (updateData.color !== undefined) {
      if (updateData.color.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Tag color cannot be empty'
        });
      }
      tag.color = updateData.color.trim();
    }

    tags[tagIndex] = tag;

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
router.delete('/:id', (req: any, res: any) => {
  try {
    const { id } = req.params;
    const tagIndex = tags.findIndex(t => t.id === id);

    if (tagIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Tag not found'
      });
    }

    const deletedTag = tags.splice(tagIndex, 1)[0];

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
