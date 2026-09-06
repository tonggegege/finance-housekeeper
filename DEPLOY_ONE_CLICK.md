# 一键部署指南

## 方案：Vercel（前端）+ Render（后端）—— 完全免费

### 准备工作（必须先完成）

1. **注册账号**：
   - GitHub: https://github.com/signup
   - Render: https://dashboard.render.com
   - Vercel: https://vercel.com/signup（建议用 GitHub 账号直接登录）

2. **创建 GitHub 仓库**：
   - 打开 https://github.com/new
   - Repository name: `finance-housekeeper`
   - 选择 Public
   - 点击 Create repository

3. **推送代码到 GitHub**：
   ```bash
   cd D:\software\AI\Finacial_manager\finance-housekeeper
   git remote add origin https://github.com/你的用户名/finance-housekeeper.git
   git branch -m main
   git push -u origin main
   ```

---

### 部署后端（Render）

1. 打开 https://dashboard.render.com
2. 点击 **New +** → **Web Service**
3. 选择 **Build and deploy from a Git repository**
4. 连接 GitHub，选择 `finance-housekeeper`
5. 填写配置：
   ```
   Name: finance-housekeeper-api
   Region: Singapore (Asia)
   Branch: main
   Runtime: Node
   Build Command: npm install
   Start Command: npm run server
   Plan: Free
   ```
6. 点击 **Advanced** 按钮，添加环境变量：
   ```
   NODE_ENV=production
   JWT_SECRET=HIUG6LMTE9n6g6vXLzJtRFOUe1eHdnqMgosbaH6I0eA=
   CORS_ORIGIN=*
   DATA_DIR=/data
   ```
7. 点击 **Add Disk**：
   ```
   Name: data
   Mount Path: /data
   Size: 1 GB
   ```
8. 点击 **Create Web Service**

等待部署完成（约 2-3 分钟），记录你的后端地址。

---

### 部署前端（Vercel）

1. 打开 https://vercel.com/new
2. 导入 `finance-housekeeper` 仓库
3. Framework Preset 选择 **Vite**
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. 添加环境变量：
   ```
   VITE_API_BASE_URL=https://finance-housekeeper-api.onrender.com
   ```
   ⚠️ **注意**：替换为你的实际 Render 地址！
7. 点击 **Deploy**

等待部署完成，记录你的前端地址。

---

### 更新 CORS（重要！）

1. 回到 Render 控制台
2. 找到你的服务，点击 **Environment**
3. 修改 `CORS_ORIGIN`：
   ```
   CORS_ORIGIN=https://你的-vercel-地址.vercel.app
   ```
4. 点击 **Manual Deploy** → **Deploy latest commit**

---

### 完成！

打开你的 Vercel 地址，开始使用你的私人财务管家！

---

## 保持服务唤醒（防止 Render 休眠）

Render 免费实例 15 分钟无访问会休眠。使用 UptimeRobot 保持唤醒：

1. 打开 https://uptimerobot.com 注册
2. 点击 **Add New Monitor**
3. 配置：
   ```
   Monitor Type: HTTP(s)
   Friendly Name: Finance API
   URL: https://finance-housekeeper-api.onrender.com/api/health
   Monitoring Interval: 5 minutes
   ```
4. 点击 **Create Monitor**

这样每 5 分钟会 ping 一次你的后端，保持活跃状态。
