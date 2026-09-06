# 🚀 快速部署指南（5分钟上线）

## 推荐方案：Vercel + Render（完全免费）

### 第一步：准备代码

1. 将你的代码推送到 GitHub 仓库
2. 确保包含以下文件：
   - `package.json`
   - `vercel.json`
   - `render.yaml`
   - `Dockerfile`
   - `dist/` 目录（构建产物）

### 第二步：部署后端（Render）

1. 打开 [dashboard.render.com](https://dashboard.render.com)
2. 点击 **"New +"** → **"Web Service"**
3. 选择你的 GitHub 仓库
4. 填写配置：
   ```
   Name: finance-housekeeper-api
   Environment: Node
   Build Command: npm install
   Start Command: npm run server
   Plan: Free
   ```
5. 点击 **"Advanced"** 添加环境变量：
   ```
   NODE_ENV = production
   JWT_SECRET = （输入一个随机长字符串）
   CORS_ORIGIN = https://finance-housekeeper.vercel.app
   DATA_DIR = /data
   ```
6. 点击 **"Add Disk"**：
   ```
   Name: data
   Mount Path: /data
   Size: 1 GB
   ```
7. 点击 **"Create Web Service"**

等待部署完成，记录你的后端地址，例如：
```
https://finance-housekeeper-api.onrender.com
```

### 第三步：部署前端（Vercel）

1. 打开 [vercel.com](https://vercel.com)
2. 点击 **"Add New Project"**
3. 导入同一个 GitHub 仓库
4. 填写配置：
   ```
   Framework Preset: Vite
   Build Command: npm run build
   Output Directory: dist
   ```
5. 点击 **"Environment Variables"** 添加：
   ```
   VITE_API_BASE_URL = https://finance-housekeeper-api.onrender.com
   ```
   （替换为你的实际 Render 地址）
6. 点击 **"Deploy"**

等待部署完成，你的应用现在可以通过 Vercel 提供的域名访问了！

### 第四步：更新 CORS（重要）

1. 回到 Render 控制台
2. 找到你的服务，点击 **"Environment"**
3. 修改 `CORS_ORIGIN` 为 Vercel 实际分配的域名：
   ```
   CORS_ORIGIN = https://finance-housekeeper-xxxxx.vercel.app
   ```
4. 点击 **"Manual Deploy"** → **"Deploy latest commit"**

### 第五步：访问你的应用

打开 Vercel 提供的域名，例如：
```
https://finance-housekeeper-xxxxx.vercel.app
```

🎉 完成！你现在拥有一个可以全球访问的私人财务管家网站！

---

## 📱 手机使用

1. 在手机上打开浏览器，访问你的 Vercel 域名
2. 点击浏览器菜单 → **"添加到主屏幕"**
3. 现在你的财务管家就像原生 App 一样使用了！

## 🔒 安全建议

1. **立即修改 JWT_SECRET**：使用 `openssl rand -base64 32` 生成随机密钥
2. **定期备份数据**：在"数据"页面导出 JSON 备份
3. **使用强密码**：注册时设置复杂的登录密码

## 🆓 免费域名（可选）

如果你想使用自定义域名：

### Freenom 免费域名
1. 访问 [freenom.com](https://freenom.com)
2. 搜索并注册 `.tk` / `.ml` / `.ga` 免费域名
3. 在 Vercel 项目设置中添加自定义域名
4. 按照提示配置 DNS

### Cloudflare 免费域名
1. 注册 [cloudflare.com](https://cloudflare.com)
2. 添加你的域名，使用 Cloudflare DNS
3. 在 Vercel 中添加该域名
4. 享受 Cloudflare 的 CDN 加速

---

## ⚠️ 免费额度限制

| 服务 | 限制 |
|------|------|
| Render Free | 实例休眠（首次访问需等待 30 秒唤醒），每月 750 小时 |
| Vercel Free | 每月 100GB 带宽，无限请求 |
| Freenom | 免费域名需每年续期 |

**建议**：如果长期使用，可以考虑 Render 的 Starter 计划（$7/月，永不休眠）或购买自己的服务器。

---

## 🆘 故障排除

### 前端无法连接后端
- 检查 `VITE_API_BASE_URL` 是否正确
- 检查 Render 的 `CORS_ORIGIN` 是否匹配前端域名
- 查看 Render 日志是否有错误

### 数据丢失
- Render 免费实例重启后数据应该保留（因为配置了磁盘）
- 但建议定期导出备份

### 首次访问慢
- Render 免费实例会休眠，首次访问需要等待唤醒
- 可以使用 UptimeRobot 免费监控，每 5 分钟 ping 一次保持活跃
