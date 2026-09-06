// vite.config.js
import { defineConfig } from "file:///D:/software/AI/Finacial_manager/finance-housekeeper/node_modules/vite/dist/node/index.js";
import react from "file:///D:/software/AI/Finacial_manager/finance-housekeeper/node_modules/@vitejs/plugin-react/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true
      }
    }
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxzb2Z0d2FyZVxcXFxBSVxcXFxGaW5hY2lhbF9tYW5hZ2VyXFxcXGZpbmFuY2UtaG91c2VrZWVwZXJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXHNvZnR3YXJlXFxcXEFJXFxcXEZpbmFjaWFsX21hbmFnZXJcXFxcZmluYW5jZS1ob3VzZWtlZXBlclxcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovc29mdHdhcmUvQUkvRmluYWNpYWxfbWFuYWdlci9maW5hbmNlLWhvdXNla2VlcGVyL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgICBwbHVnaW5zOiBbcmVhY3QoKV0sXG4gICAgc2VydmVyOiB7XG4gICAgICAgIGhvc3Q6ICcwLjAuMC4wJyxcbiAgICAgICAgcG9ydDogNTE3MyxcbiAgICAgICAgYWxsb3dlZEhvc3RzOiB0cnVlLFxuICAgICAgICBwcm94eToge1xuICAgICAgICAgICAgJy9hcGknOiB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDozMDAwJyxcbiAgICAgICAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgY3NzOiB7XG4gICAgICAgIHByZXByb2Nlc3Nvck9wdGlvbnM6IHtcbiAgICAgICAgICAgIGxlc3M6IHtcbiAgICAgICAgICAgICAgICBqYXZhc2NyaXB0RW5hYmxlZDogdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXFWLFNBQVMsb0JBQW9CO0FBQ2xYLE9BQU8sV0FBVztBQUNsQixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUN4QixTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDakIsUUFBUTtBQUFBLElBQ0osTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sY0FBYztBQUFBLElBQ2QsT0FBTztBQUFBLE1BQ0gsUUFBUTtBQUFBLFFBQ0osUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLE1BQ2xCO0FBQUEsSUFDSjtBQUFBLEVBQ0o7QUFBQSxFQUNBLEtBQUs7QUFBQSxJQUNELHFCQUFxQjtBQUFBLE1BQ2pCLE1BQU07QUFBQSxRQUNGLG1CQUFtQjtBQUFBLE1BQ3ZCO0FBQUEsSUFDSjtBQUFBLEVBQ0o7QUFDSixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
