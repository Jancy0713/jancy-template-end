#!/usr/bin/env node

/**
 * E2E测试账号清理脚本
 * 用于在测试后清理注册的测试账号
 */

const https = require('https');
const http = require('http');

class E2EAccountCleanup {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  // 发送HTTP请求的辅助方法
  async request(method, path, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(this.baseUrl + path);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;
      
      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: method.toUpperCase(),
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      if (data) {
        const jsonData = JSON.stringify(data);
        options.headers['Content-Length'] = Buffer.byteLength(jsonData);
      }

      const req = client.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(body);
            resolve({ status: res.statusCode, data: response });
          } catch (e) {
            resolve({ status: res.statusCode, data: body });
          }
        });
      });

      req.on('error', reject);
      
      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  // 注册测试账号
  async registerTestAccount(email, password, name) {
    console.log(`📝 注册测试账号: ${email}`);
    
    const response = await this.request('POST', '/api/auth/register', {
      email,
      password,
      confirm_password: password,
      name
    });

    if (response.status === 201 && response.data.success) {
      console.log(`✅ 注册成功: ${email}`);
      return {
        user: response.data.data.user,
        token: response.data.data.token,
        refreshToken: response.data.data.refreshToken
      };
    } else {
      console.log(`❌ 注册失败: ${response.data.error || '未知错误'}`);
      return null;
    }
  }

  // 删除账号
  async deleteAccount(token, password, confirmText = null) {
    console.log(`🗑️  删除账号...`);
    
    const requestData = { password };
    if (confirmText) {
      requestData.confirmText = confirmText;
    }

    const response = await this.request('DELETE', '/api/auth/delete-account', requestData, {
      'Authorization': `Bearer ${token}`
    });

    if (response.status === 200 && response.data.success) {
      console.log(`✅ 账号删除成功`);
      return true;
    } else {
      console.log(`❌ 删除失败: ${response.data.error || '未知错误'}`);
      return false;
    }
  }

  // 完整的测试流程：注册 -> 删除
  async testAccountLifecycle(email, password, name) {
    console.log(`\n🧪 开始测试账号生命周期: ${email}`);
    
    // 1. 注册账号
    const account = await this.registerTestAccount(email, password, name);
    if (!account) {
      return false;
    }

    // 2. 删除账号
    const deleted = await this.deleteAccount(account.token, password);
    
    if (deleted) {
      console.log(`✅ 测试完成: ${email} 账号已清理`);
      return true;
    } else {
      console.log(`❌ 测试失败: ${email} 账号清理失败`);
      return false;
    }
  }

  // 批量清理测试账号
  async cleanupTestAccounts(accounts) {
    console.log(`\n🧹 开始批量清理 ${accounts.length} 个测试账号`);
    
    const results = [];
    for (const account of accounts) {
      const result = await this.testAccountLifecycle(
        account.email,
        account.password,
        account.name
      );
      results.push({ email: account.email, success: result });
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`\n📊 清理结果: ${successCount}/${accounts.length} 成功`);
    
    return results;
  }
}

// 使用示例
async function main() {
  const cleanup = new E2EAccountCleanup('http://localhost:3000');

  // 定义测试账号
  const testAccounts = [
    { email: 'e2e-test1@example.com', password: 'test123', name: 'E2E Test 1' },
    { email: 'e2e-test2@example.com', password: 'test123', name: 'E2E Test 2' },
    { email: 'e2e-test3@example.com', password: 'test123', name: 'E2E Test 3' }
  ];

  try {
    await cleanup.cleanupTestAccounts(testAccounts);
  } catch (error) {
    console.error('❌ 清理过程中发生错误:', error.message);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = E2EAccountCleanup;
