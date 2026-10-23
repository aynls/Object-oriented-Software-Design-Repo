# Ripple 源码分析演示

基于 React、TypeScript 和 Vite 的课程演示，共封面及 13 页正文。以史莱姆基础生命值从 100 调整为 200 的场景介绍 Ripple，并集中分析提前记录同步确认、历史回收破坏增量依赖两个问题。正文为 26–28px，仅在四处分节展示标题。

## 本地运行

```powershell
cd D:\UCAS\OOPLab\OOPRepo\ripple-presentation
npm install
npm run dev
```

打开 http://127.0.0.1:5186 。已安装依赖后只需执行 `npm run dev`。

## 展示操作

- 左右方向键翻页；上方向键进入全屏，下方向键退出全屏。
- Home / End 跳到首页或末页；PageUp / PageDown 也可翻页。
- 鼠标移到底部中央显示翻页、目录和全屏按钮。目录支持直接跳页。
- 触屏左右滑动翻页。页面地址中的 `#页码` 支持刷新后停留在当前页。

页面采用 1440 × 810 的展示画布并按窗口等比例缩放。窗口、画布及全屏背景均为同一纯色。

## 编辑与构建

`src/Presentation.tsx` 包含页面文案、示意图和交互；`src/style.css` 管理排版与配色。

```powershell
npm run build
npm run preview
```

构建会先检查 TypeScript，再生成本地静态资源。项目不导出独立 HTML 文件。

## 源码核对入口

源码位于同级 Ripple 仓库。页面中的代码来自以下位置，展示时省略无关日志。

- `ripple-server/src/main/java/ripple/server/core/Node.java`：本地保存、异步传播及记录 ACK。
- `ripple-server/src/main/java/ripple/server/core/Tracker.java`：进度初始化与重试目标。
- `ripple-server/src/main/java/ripple/server/helper/Api.java`：异步发送 Sync 请求。
- `ripple-server/src/main/java/ripple/server/tcp/handler/SyncResponseHandler.java`：同步响应处理。
- `ripple-client/src/main/java/ripple/client/core/tcp/handler/DispatchRequestHandler.java`：组内转发。

保留两张传播路径图和一张对象关系图。游戏场景插图保存在 `public/images`，生成提示词与编辑记录见 `public/images/generation-notes.md`。所有图片均从本地加载。

- `ripple-common/src/main/java/ripple/common/resolver/LastWriteWinsResolver.java`：增量合并与基消息查找。
- `ripple-common/src/main/java/ripple/common/storage/sqlite/SqliteMaxNumberRecycleStrategy.java`：历史消息回收。
