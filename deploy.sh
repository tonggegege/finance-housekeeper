#!/bin/bash
# 部署脚本 - 用于自有服务器一键部署

set -e

echo "🚀 开始部署私人财务管家..."

# 检查环境
if ! command -v node &> /dev/null; then
    echo "❌ 未安装 Node.js，请先安装"
    exit 1
fi

if ! command -v pm2 &> /dev/null; then
    echo "📦 安装 PM2..."
    npm install -g pm2
fi

# 安装依赖
echo "📦 安装依赖..."
npm install

# 构建前端
echo "🔨 构建前端..."
npm run build

# 创建数据目录
mkdir -p data

# 生成 JWT 密钥
if [ -z "$JWT_SECRET" ]; then
    export JWT_SECRET=$(openssl rand -base64 32)
    echo "🔑 生成 JWT 密钥: $JWT_SECRET"
fi

# 启动/重启后端
echo "🚀 启动后端服务..."
pm2 delete finance-api 2>/dev/null || true
pm2 start npm --name "finance-api" -- run server

# 保存 PM2 配置
pm2 save

echo "✅ 部署完成！"
echo ""
echo "后端地址: http://localhost:3000"
echo "前端文件: $(pwd)/dist"
echo ""
echo "请配置 Nginx 反向代理，将前端静态文件和 API 请求指向正确的服务。"
