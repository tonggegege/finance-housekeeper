# 私人财务管家 - 部署指南

## 部署架构

```
┌─────────────────┐         ┌──────────────────┐
│   Vercel (前端)  │  ←──→   │  Render (后端)   │
│  React + Vite   │   HTTPS │  Express + JSON  │
│  静态网站托管    │         │  持久化磁盘       │
└─────────────────┘         └──────────────────┘
        ↓                           ↓
   *.vercel.app            *.onrender.com
```

## 方案一：Vercel + Render（推荐，完全免费）

### 1. 部署后端到 Render

1. 访问 [render.com](https://render.com) 注册账号
2. 点击 "New +" → "Web Service"
3. 连接你的 GitHub 仓库
4. 配置：
   - **Name**: `finance-housekeeper-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run server`
   - **Plan**: Free
5. 添加环境变量：
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: （随机字符串，用于 JWT 签名）
   - `CORS_ORIGIN`: `https://你的前端域名.vercel.app`
   - `DATA_DIR`: `/data`
6. 添加磁盘（持久化存储）：
   - **Name**: `data`
   - **Mount Path**: `/data`
   - **Size**: 1 GB
7. 点击 "Create Web Service"

部署完成后，记录你的后端地址：`https://finance-housekeeper-api.onrender.com`

### 2. 部署前端到 Vercel

1. 访问 [vercel.com](https://vercel.com) 注册账号
2. 点击 "Add New..." → "Project"
3. 导入同一个 GitHub 仓库
4. 配置：
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. 添加环境变量：
   - `VITE_API_BASE_URL`: `https://finance-housekeeper-api.onrender.com`
6. 点击 "Deploy"

部署完成后，你的应用就可以通过 `https://你的项目名.vercel.app` 访问了。

### 3. 更新 CORS 配置

前端部署后，更新 Render 后端的环境变量：
- `CORS_ORIGIN`: `https://你的实际前端域名.vercel.app`

然后重启后端服务。

## 方案二：单服务器部署（适合自有服务器）

如果你有自己的云服务器（如阿里云、腾讯云轻量应用服务器）：

```bash
# 1. 克隆代码
git clone <你的仓库地址>
cd finance-housekeeper

# 2. 安装依赖
npm install

# 3. 构建前端
npm run build

# 4. 安装 PM2
npm install -g pm2

# 5. 启动后端
pm2 start npm --name "finance-api" -- run server

# 6. 配置 Nginx 反向代理
# 将前端 dist 目录作为静态文件服务
# 将 /api 请求代理到后端
```

## 方案三：使用 Docker 部署

```bash
# 构建镜像
docker build -t finance-housekeeper .

# 运行容器
docker run -d \
  -p 10000:10000 \
  -v /host/data/path:/data \
  -e JWT_SECRET=your-secret-key \
  -e CORS_ORIGIN=https://your-frontend.com \
  finance-housekeeper
```

## 免费域名

### 使用 Freenom 免费域名
1. 访问 [freenom.com](https://freenom.com)
2. 搜索并注册免费域名（如 `.tk`, `.ml`, `.ga`, `.cf`, `.gq`）
3. 在 Vercel/Render 中配置自定义域名

### 使用 Cloudflare 免费域名
1. 注册 [cloudflare.com](https://cloudflare.com)
2. 添加站点，使用 Cloudflare 提供的 DNS
3. 在 Vercel/Render 中配置自定义域名，并指向 Cloudflare

## 注意事项

1. **数据持久化**：Render 免费实例会在不活动时休眠，但磁盘数据会保留。首次访问可能需要等待 30 秒启动。
2. **HTTPS**：Vercel 和 Render 都自动提供 HTTPS，无需额外配置。
3. **环境变量**：生产环境务必设置强密码的 `JWT_SECRET`。
4. **备份**：定期导出 JSON 数据备份，防止意外丢失。

## 监控

- Render 提供基本的日志和监控
- Vercel 提供访问统计和性能分析
- 可以集成 UptimeRobot 免费监控，当服务宕机时发送邮件通知
