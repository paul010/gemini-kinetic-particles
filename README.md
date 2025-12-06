# ✨ Kinetic Particles

<p align="center">
  <a href="https://github.com/paul010">
    <img src="https://img.shields.io/badge/GitHub-paul010-181717?logo=github" alt="GitHub">
  </a>
  <a href="https://www.youtube.com/@dalei2025">
    <img src="https://img.shields.io/badge/YouTube-@dalei2025-FF0000?logo=youtube" alt="YouTube">
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2-blue?logo=react" alt="React">
  <img src="https://img.shields.io/badge/Three.js-0.181-black?logo=three.js" alt="Three.js">
  <img src="https://img.shields.io/badge/MediaPipe-Hands-green?logo=google" alt="MediaPipe">
  <img src="https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript" alt="TypeScript">
</p>

<p align="center">
  🖐️ Hand gesture-controlled immersive 3D particle effects. <b>No API Key required</b>, works out of the box!
  <br/>
  🖐️ 用手势控制的沉浸式 3D 粒子效果，<b>无需任何 API Key</b>，开箱即用！
</p>

<p align="center">
  🌐 <b>Live Demo</b>: <a href="https://dailycosmos.net">https://dailycosmos.net</a>
</p>

<p align="center">
  <a href="https://www.youtube.com/watch?v=dYTeo_qNX6E">
    <img src="https://img.youtube.com/vi/dYTeo_qNX6E/maxresdefault.jpg" alt="Demo Video" width="600">
  </a>
</p>
<p align="center">
  <a href="https://www.youtube.com/watch?v=dYTeo_qNX6E">
    <img src="https://img.shields.io/badge/▶_Watch_Demo_观看演示-FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="Watch Demo">
  </a>
</p>

## 📸 Preview / 预览

<p align="center">
  <img src="preview.png" alt="Sci-Fi HUD Interface Preview" width="100%" style="border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 0 20px rgba(0,0,0,0.5);">
</p>

---

**English** | [中文](#中文文档)

## ✨ Features

- 🎯 **No API Key Required** - Runs locally using MediaPipe for hand tracking
- 🖥️ **Sci-Fi HUD Interface** - Advanced operational feel with terminal-style controls & glassmorphism
- 🖐️ **Real-time Hand Tracking** - Detects palm open/close gestures to control particles
- ✌️ **Gesture Recognition** - Victory gesture (✌️) triggers special text effects
- 🎨 **8+ Particle Shapes** - Sphere, Heart, Flower, Saturn, Galaxy, DNA, and more
- 🌈 **Customizable Colors** - Multiple presets + custom color picker
- 💫 **Stunning Visual Effects** - Explosion, shockwave, vortex, breathing animations
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🚀 **High Performance** - Smooth rendering with 12000+ particles

## 🚀 Quick Start

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```

### Open Browser

Visit `http://localhost:3000`, click **"Start Tracking"** to begin!

> 💡 **Tip**: No API Key configuration needed, works immediately!

## 🎮 Gesture Guide

| Gesture | Effect |
|---------|--------|
| 🖐️ **Open Palm** | Particles explode outward |
| ✊ **Closed Fist** | Particles contract and vibrate |
| ✌️ **Victory Sign** | Particles form "大雷早上好" text |
| 🔄 **Quick Open/Close** | Trigger dramatic explosion |

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 19** | UI Framework |
| **Three.js** | 3D Rendering Engine |
| **React Three Fiber** | React renderer for Three.js |
| **MediaPipe Hands** | Hand Tracking (**Local, No API**) |
| **TypeScript** | Type Safety |
| **Vite** | Build Tool |
| **Tailwind CSS** | Styling Framework |

## 📁 Project Structure

```
├── App.tsx                 # Main application component
├── index.tsx               # Entry point
├── types.ts                # TypeScript type definitions
├── components/
│   └── ParticleSystem.tsx  # Particle system renderer
└── services/
    ├── handTrackingService.ts   # MediaPipe hand tracking ⭐ Core
    └── geminiLiveService.ts     # Gemini AI service (optional)
```

## 🎨 Particle Shapes

| Shape | Icon | Description |
|-------|:----:|-------------|
| Sphere | 🔮 | Classic spherical distribution |
| Heart | ❤️ | Romantic heart shape |
| Flower | 🌸 | Six-petal flower pattern |
| Saturn | 🪐 | Saturn with rings |
| Buddha | 🧘 | Meditation pose |
| Fireworks | 🎆 | Multi-point fireworks |
| Galaxy | 🌌 | Spiral galaxy structure |
| DNA | 🧬 | Double helix structure |
| Text | ✌️ | Custom text (Victory gesture) |

## 💡 How It Works

This project uses **MediaPipe Hands** for real-time gesture recognition:

1. **Camera Capture** - Get video stream
2. **Hand Detection** - MediaPipe detects 21 hand landmarks locally
3. **Gesture Analysis** - Calculate finger curl and gesture type
4. **Particle Control** - Map gesture data to particle system

The entire process **runs completely locally**, no internet required, no API Key needed!

## ⚙️ Optional: Gemini AI Extension

The project includes optional Gemini AI integration for advanced features:

1. Get a [Google AI Studio API Key](https://aistudio.google.com/app/apikey)
2. Create `.env.local` file:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
3. Enable `GeminiLiveService` in the code

> 📌 **Note**: This is optional. Basic hand gesture control works without any API Key.

## 📦 Build & Deploy

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🤝 Contributing

Issues and Pull Requests are welcome!

---

# 中文文档

## ✨ 特性

- 🎯 **无需 API Key** - 纯本地运行，使用 MediaPipe 进行手势识别
- �️ **科幻 HUD 界面** - 极具未来感的操作终端风格，玻璃拟态设计
- �🖐️ **实时手势追踪** - 识别手掌开合程度，精准控制粒子效果
- ✌️ **手势识别** - 支持胜利手势（V字手势）触发特殊效果
- 🎨 **8+ 粒子形状** - 球体、爱心、花朵、土星、银河、DNA 等
- 🌈 **自定义颜色** - 多种预设颜色 + 自定义取色器
- 💫 **震撼视觉效果** - 爆炸、冲击波、漩涡、呼吸等动态效果
- 📱 **响应式设计** - 支持桌面和移动设备
- 🚀 **高性能** - 12000+ 粒子流畅运行

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 打开浏览器

访问 `http://localhost:3000`，点击 **"Start Tracking"** 开始体验！

> 💡 **提示**: 无需配置任何 API Key，开箱即用！

## 🎮 操作指南

| 手势 | 效果 |
|------|------|
| 🖐️ **张开手掌** | 粒子向外爆炸扩散 |
| ✊ **握紧拳头** | 粒子收缩聚拢并抖动 |
| ✌️ **胜利手势** | 粒子变成 "大雷早上好" 文字 |
| 🔄 **快速开合** | 触发震撼的爆炸特效 |

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| **React 19** | UI 框架 |
| **Three.js** | 3D 渲染引擎 |
| **React Three Fiber** | React 的 Three.js 渲染器 |
| **MediaPipe Hands** | 手势识别（**本地运行，无需 API**） |
| **TypeScript** | 类型安全 |
| **Vite** | 构建工具 |
| **Tailwind CSS** | 样式框架 |

## 📁 项目结构

```
├── App.tsx                 # 主应用组件
├── index.tsx               # 入口文件
├── types.ts                # TypeScript 类型定义
├── components/
│   └── ParticleSystem.tsx  # 粒子系统渲染组件
└── services/
    ├── handTrackingService.ts   # MediaPipe 手势追踪服务 ⭐ 核心
    └── geminiLiveService.ts     # Gemini AI 服务（可选扩展）
```

## 🎨 粒子形状

| 形状 | 图标 | 描述 |
|------|:----:|------|
| Sphere | 🔮 | 经典球形分布 |
| Heart | ❤️ | 浪漫爱心形状 |
| Flower | 🌸 | 六瓣花朵图案 |
| Saturn | 🪐 | 土星及光环 |
| Buddha | 🧘 | 打坐冥想造型 |
| Fireworks | 🎆 | 多点烟花绽放 |
| Galaxy | 🌌 | 螺旋星系结构 |
| DNA | 🧬 | 双螺旋结构 |
| Text | ✌️ | 自定义文字（胜利手势触发） |

## 💡 工作原理

本项目使用 **MediaPipe Hands** 进行实时手势识别：

1. **摄像头捕获** - 获取视频流
2. **手部检测** - MediaPipe 在本地检测手部 21 个关键点
3. **手势分析** - 计算手指弯曲程度和手势类型
4. **粒子控制** - 将手势数据映射到粒子系统

整个过程**完全在本地运行**，不需要联网，不需要 API Key！

## ⚙️ 可选：Gemini AI 扩展

项目预留了 Gemini AI 集成接口，如需启用语音交互等高级功能：

1. 获取 [Google AI Studio API Key](https://aistudio.google.com/app/apikey)
2. 创建 `.env.local` 文件：
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
3. 在代码中启用 `GeminiLiveService`

> 📌 **注意**: 这是可选功能，基础手势控制完全不需要 API Key。

## 📦 构建部署

```bash
# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 License

MIT License

---

<p align="center">
  Made with ❤️ and ✨ particles
</p>
