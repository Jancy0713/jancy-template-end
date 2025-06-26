# 注销账号功能说明

## 功能概述

为了方便E2E测试中的数据清理，我们添加了注销账号功能。此功能允许用户永久删除自己的账号及相关数据。

## API接口

### DELETE /api/auth/delete-account

**描述**: 永久删除用户账号及相关数据

**请求头**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**请求体**:
```json
{
  "password": "用户密码",
  "confirmText": "DELETE MY ACCOUNT" // 可选的确认文本
}
```

**响应**:

成功 (200):
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

失败 (400/401/403/500):
```json
{
  "success": false,
  "error": "错误信息"
}
```

## 安全特性

1. **身份验证**: 需要有效的访问令牌
2. **密码验证**: 必须提供正确的用户密码
3. **确认文本**: 可选的二次确认机制
4. **保护默认账号**: 防止删除系统默认的测试账号
5. **完整清理**: 删除用户相关的所有数据（tokens、refresh tokens等）

## E2E测试使用

### 方法1: 直接使用curl命令

```bash
# 1. 注册测试账号
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "confirm_password": "test123",
    "name": "Test User"
  }'

# 2. 使用返回的token删除账号
curl -X DELETE http://localhost:3000/api/auth/delete-account \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "password": "test123"
  }'
```

### 方法2: 使用提供的清理脚本

```bash
# 运行清理脚本
node e2e-account-cleanup.js
```

### 方法3: 在测试代码中使用

```javascript
const E2EAccountCleanup = require('./e2e-account-cleanup');

describe('用户功能测试', () => {
  let cleanup;
  let testAccount;

  beforeAll(() => {
    cleanup = new E2EAccountCleanup('http://localhost:3000');
  });

  beforeEach(async () => {
    // 注册测试账号
    testAccount = await cleanup.registerTestAccount(
      'test@example.com',
      'test123',
      'Test User'
    );
  });

  afterEach(async () => {
    // 清理测试账号
    if (testAccount) {
      await cleanup.deleteAccount(testAccount.token, 'test123');
    }
  });

  test('用户登录功能', async () => {
    // 你的测试代码
  });
});
```

## 错误处理

| 状态码 | 错误信息 | 说明 |
|--------|----------|------|
| 400 | Password is required to delete account | 未提供密码 |
| 400 | Confirmation text must be "DELETE MY ACCOUNT" | 确认文本不正确 |
| 401 | Access token required | 未提供访问令牌 |
| 401 | Invalid token | 访问令牌无效 |
| 401 | Token has been revoked | 访问令牌已被撤销 |
| 401 | Invalid password | 密码错误 |
| 403 | Cannot delete default test accounts | 尝试删除受保护的默认账号 |
| 500 | 服务器内部错误 | 系统错误 |

## 注意事项

1. **不可逆操作**: 账号删除后无法恢复
2. **数据清理**: 删除账号会清理所有相关数据
3. **令牌失效**: 删除账号后所有相关令牌立即失效
4. **默认账号保护**: admin@example.com 和 user@example.com 无法被删除
5. **测试环境**: 此功能主要用于测试环境，生产环境需要额外的安全措施

## 生产环境建议

在生产环境中使用此功能时，建议添加以下安全措施：

1. **邮件确认**: 发送确认邮件到用户邮箱
2. **等待期**: 设置账号删除的等待期（如7天）
3. **审计日志**: 记录所有账号删除操作
4. **数据备份**: 在删除前备份重要数据
5. **多重验证**: 要求多种身份验证方式

## 示例脚本

项目中包含了 `e2e-account-cleanup.js` 脚本，可以直接使用或作为参考来实现自己的清理逻辑。
