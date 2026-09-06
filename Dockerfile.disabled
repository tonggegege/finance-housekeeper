# 生产环境 Dockerfile
FROM node:20-alpine

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建前端
RUN npm run build

# 创建数据目录
RUN mkdir -p /data

# 暴露端口
EXPOSE 10000

# 启动命令
CMD ["npm", "run", "server"]
