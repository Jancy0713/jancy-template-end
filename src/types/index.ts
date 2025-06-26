import { Request } from 'express';

// 用户相关类型
export interface User {
  id: number;
  name: string;
  email: string;
  age?: number;
  avatar?: string;
}

export interface UserInput {
  name: string;
  email: string;
  age?: number;
  avatar?: string;
}

export interface UpdateUserRequest {
  name?: string;
  avatar?: string;
}

// 认证相关类型
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name?: string; // 可选，默认使用邮箱前缀
  email: string;
  password: string;
  confirm_password: string;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  avatar?: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: AuthUser;
    token: string;
    refreshToken?: string;
    expiresIn: number; // token过期时间（秒）
    refreshExpiresIn?: number; // refresh token过期时间（秒）
  };
  message: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  data: {
    token: string;
    refreshToken: string;
    expiresIn: number; // token过期时间（秒）
    refreshExpiresIn: number; // refresh token过期时间（秒）
  };
  message: string;
}

export interface LogoutRequest {
  token?: string;
  refreshToken?: string;
}

export interface DeleteAccountRequest {
  password: string;
  confirmText?: string; // 可选的确认文本，如 "DELETE MY ACCOUNT"
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
}

export interface ErrorResponse {
  success: false;
  error: string;
}

// 健康检查响应类型
export interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
}

// Express扩展类型
export interface TypedRequest<T = any> extends Request {
  body: T;
}

// TODO相关类型
export type TodoStatus = 'pending' | 'in-progress' | 'completed';
export type TodoPriority = 'high' | 'medium' | 'low';
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
  | 'delete';

export type HistoryChangeValue = string | number | boolean | Date | null;

export interface Todo {
  id: string;
  title: string;
  description?: string;
  status: TodoStatus;
  priority: TodoPriority;
  tags: string[];
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  order: number;
  history: HistoryRecord[];
}

export interface CreateTodoData {
  title: string;
  description?: string;
  priority?: TodoPriority;
  tags?: string[];
  dueDate?: Date;
}

export interface UpdateTodoData {
  title?: string;
  description?: string;
  status?: TodoStatus;
  priority?: TodoPriority;
  tags?: string[];
  dueDate?: Date;
  order?: number;
  completedAt?: Date;
}

export interface HistoryRecord {
  id: string;
  todoId: string;
  actionType: HistoryActionType;
  timestamp: Date;
  changes?: {
    field: string;
    oldValue: HistoryChangeValue;
    newValue: HistoryChangeValue;
  };
  operator?: string;
}

// Tag相关类型
export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
}

export interface CreateTagData {
  name: string;
  color: string;
}

export interface UpdateTagData {
  name?: string;
  color?: string;
}

// 筛选和排序类型
export interface FilterOptions {
  status?: TodoStatus[];
  priority?: TodoPriority[];
  tags?: string[];
  dateRange?: {
    type: 'created' | 'updated' | 'completed';
    start?: Date;
    end?: Date;
  };
  keyword?: string;
}

export interface SortOptions {
  field: 'priority' | 'createdAt' | 'updatedAt' | 'completedAt' | 'dueDate' | 'order';
  order: 'asc' | 'desc';
}

// 统计类型
export interface TodoStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  tagStats: { tag: string; count: number }[];
}

// 批量操作类型
export interface BatchOperation {
  action: 'delete' | 'update';
  ids: string[];
  data?: Partial<UpdateTodoData>;
}

// 重新排序请求类型
export interface ReorderRequest {
  todoIds: string[];
}

// 分页类型
export interface PaginationQuery {
  page?: number;
  size?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
}

// 环境变量类型
export interface EnvConfig {
  PORT: string;
  NODE_ENV: string;
  CORS_ORIGIN?: string;
  LOCAL_IP?: string;
  API_URL?: string;
  DATABASE_URL?: string;
  JWT_SECRET?: string;
}
