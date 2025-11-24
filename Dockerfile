# 使用轻量 Nginx 镜像
FROM nginx:alpine

# 删除默认 Nginx 页面
RUN rm -rf /usr/share/nginx/html/*

# 复制 React 打包后的文件到 Nginx web 根目录
COPY build/ /usr/share/nginx/html/

# 暴露 80 端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]