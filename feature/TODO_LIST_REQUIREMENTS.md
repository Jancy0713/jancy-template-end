# TODO List 开发需求文档

## 功能实现状态

### ✅ 已完成功能

- [x] 基础 TODO List 功能
  - [x] 任务 CRUD 操作 (新增、编辑、删除、查看)
  - [x] 基础 UI 展示 (三栏布局、状态卡片)
  - [x] 任务状态管理 (待办、进行中、已完成)
- [x] 优先级功能
  - [x] 优先级等级设置 (高、中、低)
  - [x] 视觉区分 (不同颜色标识)
  - [x] 优先级排序
- [x] 排序功能
  - [x] 多种排序方式 (优先级、创建时间、修改时间等)
  - [x] 排序控制器
- [x] 计划完成日期
  - [x] 日期设置
  - [x] 状态提醒 (即将到期、已超期)
- [x] 数据持久化
  - [x] 本地存储 (localStorage)
  - [x] 示例数据初始化
- [x] 基础筛选功能
  - [x] 筛选框架搭建

### ✅ 新完成功能

- [x] **拖拽功能**
  - [x] 拖拽排序 (同一状态内调整任务顺序)
  - [x] 状态变更 (拖拽任务到不同状态区域)
  - [x] 拖拽视觉反馈 (鼠标悬停、拖拽动画)
- [x] **标签系统**
  - [x] 标签管理 (创建、编辑、删除)
  - [x] 颜色系统 (预设颜色 + 自定义颜色)
  - [x] 任务标签关联 (多标签支持)
  - [x] 标签统计 (显示每个标签下的任务数量)
- [x] **高级筛选功能**
  - [x] 标签筛选
  - [x] 时间范围筛选
  - [x] 多条件组合筛选
- [x] **任务详情弹窗**
  - [x] 详情编辑界面
  - [x] 操作历史记录

### 🚧 待完成功能

- [ ] **数据导入导出**
  - [ ] JSON 格式导出
  - [ ] 数据备份和恢复
  - [ ] 批量导入功能
- [ ] **任务统计分析**
  - [ ] 完成率统计
  - [ ] 时间分布分析
  - [ ] 标签使用分析
- [ ] **任务提醒**
  - [ ] 到期提醒
  - [ ] 邮件通知
  - [ ] 桌面通知

## 项目概述

基于 Vue 3 + TypeScript + Element Plus 开发的高功能 TODO List 应用，支持任务管理、标签分类、优先级设置、拖拽排序等功能。

## 功能需求详细拆解

### 1. 基础 TODO List 功能

#### 1.1 任务 CRUD 操作

- **新增任务**: 快速添加任务，支持回车键确认
- **编辑任务**: 双击任务标题进行编辑，或通过详情弹窗编辑
- **删除任务**: 支持单个删除和批量删除
- **查看任务**: 列表展示和详情查看

#### 1.2 基础 UI 展示

- **默认状态**: 展示"进行中"和"已完成"两个卡片
- **已完成任务**: 默认只显示今日已完成任务，点击可展开查看全部
- **任务状态**: 支持待办、进行中、已完成三种状态

### 2. 拖拽功能

- **拖拽排序**: 在同一状态内调整任务顺序
- **状态变更**: 拖拽任务到不同状态区域改变任务状态
- **拖拽库选择**: 使用 Vue.Draggable 或 SortableJS

### 3. 标签系统

- **标签管理**: 创建、编辑、删除自定义标签
- **颜色系统**: 为标签设置不同颜色进行区分
- **任务标签**: 为任务添加一个或多个标签
- **标签统计**: 显示每个标签下的任务数量

### 4. 优先级功能

- **优先级等级**: 高、中、低三个优先级
- **视觉区分**: 不同优先级使用不同颜色/图标标识
- **默认排序**: 按优先级高低排序任务

### 5. 排序功能

- **排序方式**:
  - 默认排序(优先级)
  - 创建时间(正序/倒序)
  - 修改时间(正序/倒序)
  - 完成时间(正序/倒序)
- **排序控制**: 提供排序选择器，支持快速切换

### 6. 筛选功能

- **筛选条件**:
  - 创建时间范围
  - 修改时间范围
  - 完成时间范围
  - 标签筛选(支持多选)
  - 优先级筛选
- **筛选组合**: 支持多条件组合筛选
- **筛选重置**: 一键清空所有筛选条件

### 7. 计划完成日期

- **日期设置**: 为任务设置计划完成日期(可选)
- **状态提醒**:
  - 即将到期: 黄色标识
  - 已超期: 红色标识
- **日期格式**: 精确到天

### 8. 任务详情弹窗

- **详情编辑**:
  - 任务标题编辑
  - 任务描述编辑
  - 优先级修改
  - 标签管理
  - 计划完成日期设置
- **操作历史**: 显示任务的创建、修改记录

## UI 设计方案

### 整体布局

```
┌─────────────────────────────────────────────────────────┐
│  Header: TODO List + 搜索框 + 筛选器 + 排序器              │
├─────────────────────────────────────────────────────────┤
│  Toolbar: 新增任务 + 批量操作 + 标签管理                   │
├─────────────────────────────────────────────────────────┤
│  Main Content:                                          │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │   进行中 Card    │  │   已完成 Card    │              │
│  │  ┌─────────────┐ │  │  ┌─────────────┐ │              │
│  │  │   任务1      │ │  │  │   任务3      │ │              │
│  │  │   任务2      │ │  │  │   任务4      │ │              │
│  │  └─────────────┘ │  │  └─────────────┘ │              │
│  └─────────────────┘  └─────────────────┘              │
└─────────────────────────────────────────────────────────┘
```

### 任务卡片设计

```
┌─────────────────────────────────────────────────────────┐
│ [优先级图标] 任务标题                     [日期状态] [操作] │
│ 任务描述(截断显示)                                        │
│ [标签1] [标签2] [标签3]                 创建时间/修改时间  │
└─────────────────────────────────────────────────────────┘
```

### 色彩方案

- **优先级颜色**:
  - 高优先级: #F56C6C (红色)
  - 中优先级: #E6A23C (橙色)
  - 低优先级: #909399 (灰色)
- **日期状态颜色**:
  - 即将到期: #E6A23C (黄色)
  - 已超期: #F56C6C (红色)
- **任务状态颜色**:
  - 待办: #909399 (灰色)
  - 进行中: #409EFF (蓝色)
  - 已完成: #67C23A (绿色)

## 数据模型设计

### Todo 数据结构

```typescript
export interface Todo {
  id: string
  title: string
  description?: string
  status: TodoStatus // 'pending' | 'in-progress' | 'completed'
  priority: TodoPriority // 'high' | 'medium' | 'low'
  tags: string[]
  dueDate?: Date
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  order: number
  history: HistoryRecord[] // 操作历史记录
}

export interface CreateTodoData {
  title: string
  description?: string
  priority?: TodoPriority
  tags?: string[]
  dueDate?: Date
}

export interface UpdateTodoData {
  title?: string
  description?: string
  status?: TodoStatus
  priority?: TodoPriority
  tags?: string[]
  dueDate?: Date
  order?: number
  completedAt?: Date
}

export interface HistoryRecord {
  id: string
  todoId: string
  actionType: HistoryActionType
  timestamp: Date
  changes?: {
    field: string
    oldValue: HistoryChangeValue
    newValue: HistoryChangeValue
  }
  operator?: string // 预留字段，用于多用户场景
}

export type HistoryActionType =
  | 'create'
  | 'update_title'
  | 'update_description'
  | 'update_status'
  | 'update_priority'
  | 'update_tags'
  | 'update_due_date'
  | 'update_order'
  | 'complete'
  | 'delete'
```

### Tag 数据结构

```typescript
export interface Tag {
  id: string
  name: string
  color: string // RGB format, e.g. 'rgb(64, 158, 255)'
  createdAt: Date
}

export interface CreateTagData {
  name: string
  color: string // RGB format
}

export interface UpdateTagData {
  name?: string
  color?: string
}
```

### 筛选器数据结构

```typescript
export interface FilterOptions {
  status?: TodoStatus[]
  priority?: TodoPriority[]
  tags?: string[]
  dateRange?: {
    type: 'created' | 'updated' | 'completed'
    start?: Date
    end?: Date
  }
  keyword?: string
}
```

### 排序数据结构

```typescript
export interface SortOptions {
  field: 'priority' | 'createdAt' | 'updatedAt' | 'completedAt' | 'dueDate' | 'order'
  order: 'asc' | 'desc'
}
```

### 统计数据结构

```typescript
export interface TodoStats {
  total: number
  pending: number
  inProgress: number
  completed: number
  overdue: number
  tagStats: { tag: string; count: number }[]
}
```

## Store 接口设计

### Todo Store

```typescript
interface TodoStore {
  // 状态
  todos: Todo[]
  filters: FilterOptions
  sort: SortOptions
  loading: boolean

  // 计算属性
  filteredTodos: Todo[]
  sortedTodos: Todo[]
  todosByStatus: {
    pending: Todo[]
    inProgress: Todo[]
    completed: {
      today: Todo[]
      all: Todo[]
    }
  }
  stats: TodoStats

  // 方法
  addTodo: (data: CreateTodoData) => Todo
  updateTodo: (id: string, data: UpdateTodoData) => Todo | false
  deleteTodo: (id: string) => boolean
  deleteTodos: (ids: string[]) => number
  toggleTodoStatus: (id: string) => Todo | null
  updateTodoOrder: (id: string, newOrder: number) => Todo | null
  reorderTodos: (todoIds: string[]) => void
  setFilters: (newFilters: FilterOptions) => void
  clearFilters: () => void
  setSort: (newSort: SortOptions) => void
  loadData: () => void
}
```

### Tag Store

```typescript
interface TagStore {
  // 状态
  tags: Tag[]

  // 方法
  addTag: (data: CreateTagData) => Tag
  updateTag: (id: string, data: UpdateTagData) => Tag | null
  deleteTag: (id: string) => boolean
  getTagById: (id: string) => Tag | undefined
  loadTags: () => void
}
```

## 存储接口设计

```typescript
interface StorageInterface {
  // Todo 存储
  saveTodos: (todos: Todo[]) => void
  loadTodos: () => Todo[]

  // Tag 存储
  saveTags: (tags: Tag[]) => void
  loadTags: () => Tag[]

  // 筛选器存储
  saveFilters: (filters: FilterOptions) => void
  loadFilters: () => FilterOptions

  // 排序设置存储
  saveSort: (sort: SortOptions) => void
  loadSort: () => SortOptions
}

// 存储键定义
const STORAGE_KEYS = {
  TODOS: 'todo-app-todos',
  TAGS: 'todo-app-tags',
  FILTERS: 'todo-app-filters',
  SORT: 'todo-app-sort',
} as const
```

## 组件 Props/Emits 接口

### TodoList 组件

```typescript
interface TodoListProps {
  todos: Todo[]
  status: TodoStatus
}

interface TodoListEmits {
  (e: 'edit', todo: Todo): void
  (e: 'delete', id: string): void
  (e: 'toggle', id: string): void
  (e: 'reorder', todos: Todo[]): void
  (e: 'show-history', todo: Todo): void
}

interface DragChangeEvent {
  added?: {
    element: Todo
    newIndex: number
  }
  moved?: {
    element: Todo
    newIndex: number
    oldIndex: number
  }
}
```

## 接口设计方案

### 基础 CRUD 接口

```typescript
// 获取任务列表
GET /api/todos?filter={}&sort={}&page={}&size={}
Response: { data: Todo[], total: number, page: number, size: number }

// 创建任务
POST /api/todos
Body: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>
Response: Todo

// 更新任务
PUT /api/todos/:id
Body: Partial<Omit<Todo, 'id' | 'createdAt'>>
Response: Todo

// 删除任务
DELETE /api/todos/:id
Response: { success: boolean }

// 批量操作
POST /api/todos/batch
Body: { action: 'delete' | 'update', ids: string[], data?: Partial<Todo> }
Response: { success: boolean, affected: number }
```

### 标签管理接口

```typescript
// 获取标签列表
GET /api/tags
Response: Tag[]

// 创建标签
POST /api/tags
Body: Omit<Tag, 'id' | 'createdAt'>
Response: Tag

// 更新标签
PUT /api/tags/:id
Body: Partial<Omit<Tag, 'id' | 'createdAt'>>
Response: Tag

// 删除标签
DELETE /api/tags/:id
Response: { success: boolean }
```

### 统计接口

```typescript
// 获取统计信息
GET / api / stats
Response: {
  total: number
  pending: number
  inProgress: number
  completed: number
  overdue: number
  tagStats: {
    tag: string
    count: number
  }
  ;[]
}
```

## 技术架构设计

### 前端技术栈

- **框架**: Vue 3 + TypeScript
- **UI 库**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router
- **拖拽**: Vue.Draggable.Next
- **日期处理**: Day.js
- **图标**: Element Plus Icons

### 项目结构

```
src/
├── components/
│   ├── TodoCard.vue          # 任务卡片组件
│   ├── TodoList.vue          # 任务列表组件
│   ├── TodoForm.vue          # 任务表单组件
│   ├── TodoDetail.vue        # 任务详情弹窗
│   ├── TagManager.vue        # 标签管理组件
│   ├── FilterBar.vue         # 筛选栏组件
│   └── SortSelector.vue      # 排序选择器组件
├── stores/
│   ├── todo.ts              # Todo 状态管理
│   ├── tag.ts               # Tag 状态管理
│   └── filter.ts            # 筛选和排序状态管理
├── services/
│   ├── api.ts               # API 请求封装
│   ├── todoService.ts       # Todo 服务
│   └── tagService.ts        # Tag 服务
├── utils/
│   ├── date.ts              # 日期工具函数
│   ├── storage.ts           # 本地存储工具
│   └── validation.ts        # 数据验证工具
├── types/
│   ├── todo.ts              # Todo 类型定义
│   ├── tag.ts               # Tag 类型定义
│   └── common.ts            # 通用类型定义
└── views/
    └── TodoView.vue         # 主页面
```

## 单元测试设计方案

### 测试框架

- **测试库**: Vitest
- **组件测试**: Vue Test Utils
- **测试覆盖率**: 目标 90%+

### 测试用例设计

#### 1. 组件测试

```typescript
// TodoCard.vue 测试
describe('TodoCard', () => {
  test('renders todo correctly', () => {})
  test('emits delete event on delete click', () => {})
  test('emits edit event on double click', () => {})
  test('shows overdue status correctly', () => {})
  test('displays priority correctly', () => {})
})

// TodoForm.vue 测试
describe('TodoForm', () => {
  test('validates required fields', () => {})
  test('emits submit event with correct data', () => {})
  test('resets form after submit', () => {})
})
```

#### 2. 状态管理测试

```typescript
// todo.store.ts 测试
describe('Todo Store', () => {
  test('adds todo correctly', () => {})
  test('updates todo correctly', () => {})
  test('deletes todo correctly', () => {})
  test('filters todos correctly', () => {})
  test('sorts todos correctly', () => {})
})
```

#### 3. 工具函数测试

```typescript
// date.utils.ts 测试
describe('Date Utils', () => {
  test('calculates overdue status correctly', () => {})
  test('formats date correctly', () => {})
})
```

## E2E 测试设计方案

### 测试框架

- **E2E 库**: Playwright

### 测试场景设计

#### 1. 基础功能测试

```typescript
describe('Todo Basic Functions', () => {
  test('user can create a new todo', async () => {})
  test('user can edit todo title', async () => {})
  test('user can delete todo', async () => {})
  test('user can mark todo as completed', async () => {})
})
```

#### 2. 高级功能测试

```typescript
describe('Todo Advanced Functions', () => {
  test('user can drag and drop to reorder todos', async () => {})
  test('user can filter todos by tags', async () => {})
  test('user can sort todos by priority', async () => {})
  test('user can set due date and see overdue status', async () => {})
})
```

#### 3. 用户流程测试

```typescript
describe('User Workflows', () => {
  test('complete todo management workflow', async () => {
    // 创建任务 -> 添加标签 -> 设置优先级 -> 设置截止日期 -> 完成任务
  })
})
```

## 项目难点分析

### 1. 拖拽交互复杂性

- **挑战**: 跨状态区域拖拽，实时视觉反馈
- **解决方案**: 使用成熟的拖拽库，精细化配置拖拽规则

### 2. 性能优化

- **挑战**: 大量任务时的渲染性能
- **解决方案**:
  - 虚拟滚动
  - 懒加载
  - 分页显示

### 3. 复杂筛选和排序

- **挑战**: 多条件组合筛选的性能和用户体验
- **解决方案**:
  - 防抖处理
  - 索引优化
  - 缓存机制

### 4. 数据持久化

- **挑战**: 离线存储和数据同步
- **解决方案**:
  - localStorage 备份
  - 乐观更新
  - 冲突解决机制

### 5. 响应式设计

- **挑战**: 移动端适配和交互优化
- **解决方案**:
  - 断点设计
  - 触摸友好的交互
  - 渐进式功能降级

## 后续可迭代方向

### 1. 协作功能

- 多人协作编辑
- 任务分配
- 评论系统
- 实时同步

### 2. 高级功能

- 子任务支持
- 任务模板
- 定期任务
- 任务依赖关系

### 3. 数据分析

- 工作效率统计
- 任务完成趋势
- 时间分布分析
- 个人生产力报告

### 4. 集成功能

- 日历集成
- 邮件通知
- 第三方应用集成
- API 开放

### 5. 智能化

- 智能任务分类
- 优先级自动推荐
- 完成时间预测
- 个性化建议

### 6. 移动端应用

- 原生 App 开发
- 离线功能增强
- 推送通知
- 桌面小组件

## 开发计划

### Phase 1: 基础功能 (Week 1-2)

- 项目初始化和环境搭建
- 基础 Todo CRUD 功能
- 基本 UI 框架搭建

### Phase 2: 核心功能 (Week 3-4)

- 拖拽功能实现
- 标签系统开发
- 优先级功能

### Phase 3: 高级功能 (Week 5-6)

- 筛选和排序功能
- 日期管理和提醒
- 任务详情弹窗

### Phase 4: 优化和测试 (Week 7-8)

- 性能优化
- 单元测试和 E2E 测试
- Bug 修复和用户体验优化

## 验收标准

### 功能验收

- [ ] 所有基础 CRUD 功能正常工作
- [ ] 拖拽排序和状态变更流畅
- [ ] 标签系统完整可用
- [ ] 筛选和排序功能准确
- [ ] 日期提醒和状态显示正确
- [ ] 任务详情弹窗功能完整

### 性能验收

- [ ] 页面加载时间 < 2s
- [ ] 1000+ 任务时操作流畅
- [ ] 内存使用合理
- [ ] 移动端适配良好

### 质量验收

- [ ] 单元测试覆盖率 > 90%
- [ ] E2E 测试通过率 100%
- [ ] 无严重 Bug
- [ ] 代码质量达标
