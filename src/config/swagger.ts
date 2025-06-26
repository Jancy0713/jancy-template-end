import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Express.js Backend API',
      version: '1.0.0',
      description: '一个专为前端工程师设计的Express.js后端API模板',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: '本地开发服务器'
      },
      {
        url: process.env.API_URL || 'http://192.168.50.79:3000',
        description: '局域网访问地址'
      }
    ],
    components: {
      schemas: {
        User: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            id: {
              type: 'integer',
              description: '用户ID',
              example: 1
            },
            name: {
              type: 'string',
              description: '用户姓名',
              example: 'Alice'
            },
            email: {
              type: 'string',
              format: 'email',
              description: '用户邮箱',
              example: 'alice@example.com'
            },
            age: {
              type: 'integer',
              description: '用户年龄',
              example: 25,
              minimum: 0,
              maximum: 150
            },
            avatar: {
              type: 'string',
              description: '用户头像URL',
              example: 'https://example.com/avatar.jpg'
            }
          }
        },
        UserInput: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            name: {
              type: 'string',
              description: '用户姓名',
              example: 'John'
            },
            email: {
              type: 'string',
              format: 'email',
              description: '用户邮箱',
              example: 'john@example.com'
            },
            age: {
              type: 'integer',
              description: '用户年龄',
              example: 28,
              minimum: 0,
              maximum: 150
            },
            avatar: {
              type: 'string',
              description: '用户头像URL',
              example: 'https://example.com/avatar.jpg'
            }
          }
        },
        UpdateUserRequest: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: '用户姓名',
              example: 'Updated Name'
            },
            avatar: {
              type: 'string',
              description: '用户头像URL',
              example: 'https://example.com/new-avatar.jpg'
            }
          }
        },
        UpdateUserInput: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: '用户姓名',
              example: 'Updated Name'
            },
            email: {
              type: 'string',
              format: 'email',
              description: '用户邮箱',
              example: 'updated@example.com'
            },
            age: {
              type: 'integer',
              description: '用户年龄',
              example: 30,
              minimum: 0,
              maximum: 150
            },
            avatar: {
              type: 'string',
              description: '用户头像URL',
              example: 'https://example.com/new-avatar.jpg'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: '用户邮箱',
              example: 'admin@example.com'
            },
            password: {
              type: 'string',
              description: '用户密码',
              example: 'admin123'
            }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'confirm_password'],
          properties: {
            name: {
              type: 'string',
              description: '用户姓名（可选，默认使用邮箱前缀）',
              example: 'John'
            },
            email: {
              type: 'string',
              format: 'email',
              description: '用户邮箱（必须唯一）',
              example: 'john@example.com'
            },
            password: {
              type: 'string',
              description: '用户密码',
              example: 'password123',
              minLength: 6
            },
            confirm_password: {
              type: 'string',
              description: '确认密码',
              example: 'password123',
              minLength: 6
            }
          }
        },
        Todo: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: '任务ID',
              example: '1'
            },
            title: {
              type: 'string',
              description: '任务标题',
              example: '完成项目文档'
            },
            description: {
              type: 'string',
              description: '任务描述',
              example: '编写项目的技术文档和用户手册'
            },
            status: {
              type: 'string',
              enum: ['pending', 'in-progress', 'completed'],
              description: '任务状态',
              example: 'in-progress'
            },
            priority: {
              type: 'string',
              enum: ['high', 'medium', 'low'],
              description: '任务优先级',
              example: 'high'
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: '任务标签',
              example: ['work', 'documentation']
            },
            dueDate: {
              type: 'string',
              format: 'date-time',
              description: '截止日期',
              example: '2025-07-01T00:00:00.000Z'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '创建时间',
              example: '2025-06-20T00:00:00.000Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: '更新时间',
              example: '2025-06-25T00:00:00.000Z'
            },
            completedAt: {
              type: 'string',
              format: 'date-time',
              description: '完成时间',
              example: '2025-06-24T00:00:00.000Z'
            },
            order: {
              type: 'integer',
              description: '排序顺序',
              example: 1
            }
          }
        },
        CreateTodoData: {
          type: 'object',
          required: ['title'],
          properties: {
            title: {
              type: 'string',
              description: '任务标题',
              example: '新任务'
            },
            description: {
              type: 'string',
              description: '任务描述',
              example: '任务的详细描述'
            },
            priority: {
              type: 'string',
              enum: ['high', 'medium', 'low'],
              description: '任务优先级',
              example: 'medium'
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: '任务标签',
              example: ['work']
            },
            dueDate: {
              type: 'string',
              format: 'date-time',
              description: '截止日期',
              example: '2025-07-01T00:00:00.000Z'
            }
          }
        },
        UpdateTodoData: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: '任务标题',
              example: '更新的任务标题'
            },
            description: {
              type: 'string',
              description: '任务描述',
              example: '更新的任务描述'
            },
            status: {
              type: 'string',
              enum: ['pending', 'in-progress', 'completed'],
              description: '任务状态',
              example: 'completed'
            },
            priority: {
              type: 'string',
              enum: ['high', 'medium', 'low'],
              description: '任务优先级',
              example: 'high'
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: '任务标签',
              example: ['work', 'urgent']
            },
            dueDate: {
              type: 'string',
              format: 'date-time',
              description: '截止日期',
              example: '2025-07-01T00:00:00.000Z'
            },
            order: {
              type: 'integer',
              description: '排序顺序',
              example: 2
            }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  $ref: '#/components/schemas/User'
                },
                token: {
                  type: 'string',
                  description: '访问令牌',
                  example: 'mock_token_1_1640995200000'
                },
                refreshToken: {
                  type: 'string',
                  description: '刷新令牌',
                  example: 'mock_refresh_token_1_1640995200000'
                },
                expiresIn: {
                  type: 'integer',
                  description: 'token过期时间（秒）',
                  example: 3600
                },
                refreshExpiresIn: {
                  type: 'integer',
                  description: 'refresh token过期时间（秒）',
                  example: 604800
                }
              }
            },
            message: {
              type: 'string',
              example: 'Login successful'
            }
          }
        },
        RefreshTokenRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: {
              type: 'string',
              description: '刷新令牌',
              example: 'mock_refresh_token_1_1640995200000'
            }
          }
        },
        RefreshTokenResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                  description: '新的访问令牌',
                  example: 'mock_token_1_1640995300000'
                },
                refreshToken: {
                  type: 'string',
                  description: '新的刷新令牌',
                  example: 'mock_refresh_token_1_1640995300000'
                },
                expiresIn: {
                  type: 'integer',
                  description: 'token过期时间（秒）',
                  example: 3600
                },
                refreshExpiresIn: {
                  type: 'integer',
                  description: 'refresh token过期时间（秒）',
                  example: 604800
                }
              }
            },
            message: {
              type: 'string',
              example: 'Token refreshed successfully'
            }
          }
        },
        LogoutRequest: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              description: '访问令牌（可选）',
              example: 'mock_token_1_1640995200000'
            },
            refreshToken: {
              type: 'string',
              description: '刷新令牌（可选）',
              example: 'mock_refresh_token_1_1640995200000'
            }
          }
        },
        DeleteAccountRequest: {
          type: 'object',
          required: ['password'],
          properties: {
            password: {
              type: 'string',
              description: '用户密码（用于验证身份）',
              example: 'user123'
            },
            confirmText: {
              type: 'string',
              description: '确认文本（可选），必须为 "DELETE MY ACCOUNT"',
              example: 'DELETE MY ACCOUNT'
            }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              oneOf: [
                { $ref: '#/components/schemas/User' },
                { type: 'array', items: { $ref: '#/components/schemas/User' } }
              ]
            },
            message: {
              type: 'string',
              example: 'Operation successful'
            },
            count: {
              type: 'integer',
              description: '数据总数（用于列表接口）',
              example: 3
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              example: 'Error message'
            }
          }
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'OK'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2023-12-01T10:00:00.000Z'
            },
            uptime: {
              type: 'number',
              description: '服务器运行时间（秒）',
              example: 123.456
            }
          }
        },
        Tag: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: '标签ID',
              example: '1'
            },
            name: {
              type: 'string',
              description: '标签名称',
              example: 'work'
            },
            color: {
              type: 'string',
              description: '标签颜色',
              example: '#409EFF'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '创建时间',
              example: '2025-06-20T00:00:00.000Z'
            }
          }
        },
        CreateTagData: {
          type: 'object',
          required: ['name', 'color'],
          properties: {
            name: {
              type: 'string',
              description: '标签名称',
              example: 'urgent'
            },
            color: {
              type: 'string',
              description: '标签颜色',
              example: '#F56C6C'
            }
          }
        },
        UpdateTagData: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: '标签名称',
              example: 'updated-tag'
            },
            color: {
              type: 'string',
              description: '标签颜色',
              example: '#67C23A'
            }
          }
        },
        TodoStats: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
              description: '总任务数',
              example: 10
            },
            pending: {
              type: 'integer',
              description: '待办任务数',
              example: 3
            },
            inProgress: {
              type: 'integer',
              description: '进行中任务数',
              example: 4
            },
            completed: {
              type: 'integer',
              description: '已完成任务数',
              example: 3
            },
            overdue: {
              type: 'integer',
              description: '过期任务数',
              example: 1
            },
            tagStats: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  tag: {
                    type: 'string',
                    example: 'work'
                  },
                  count: {
                    type: 'integer',
                    example: 5
                  }
                }
              },
              description: '标签统计'
            }
          }
        },
        BatchOperation: {
          type: 'object',
          required: ['action', 'ids'],
          properties: {
            action: {
              type: 'string',
              enum: ['delete', 'update'],
              description: '操作类型',
              example: 'delete'
            },
            ids: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: '任务ID列表',
              example: ['todo1', 'todo2', 'todo3']
            },
            data: {
              $ref: '#/components/schemas/UpdateTodoData',
              description: '更新数据（仅在action为update时需要）'
            }
          }
        },
        ReorderRequest: {
          type: 'object',
          required: ['todoIds'],
          properties: {
            todoIds: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: '按新顺序排列的任务ID列表',
              example: ['todo3', 'todo1', 'todo2']
            }
          }
        }
      },
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: '使用Bearer token进行认证'
        }
      }
    },
    tags: [
      {
        name: 'Health',
        description: '健康检查相关接口'
      },
      {
        name: 'Users',
        description: '用户管理相关接口'
      },
      {
        name: 'Auth',
        description: '认证相关接口'
      },
      {
        name: 'Todos',
        description: 'TODO任务管理相关接口'
      },
      {
        name: 'Tags',
        description: '标签管理相关接口'
      },
      {
        name: 'Stats',
        description: '统计分析相关接口'
      }
    ]
  },
  apis: [
    './src/app.ts',
    './src/routes/*.ts'
  ]
};

const specs = swaggerJsdoc(options);

export default specs;
