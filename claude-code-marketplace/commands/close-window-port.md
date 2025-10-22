# 关闭 window 系统内指定端口的进程

- netstat -ano | findstr :端口号 查找占用端口的进程
- powershell "Stop-Process -Id PID -Force" 强制终止指定进程

请你按照我提供给你的端口号，关闭他们。
