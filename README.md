# 🌾 Agroverse - AI-Powered Farm Simulator

[![Built with Bolt.new](https://img.shields.io/badge/Built%20with-Bolt.new-00D4FF?style=for-the-badge&logo=bolt)](https://bolt.new/)

A realistic 3D farming simulation game built with Three.js, featuring AI-powered crop analysis and immersive agricultural gameplay.

## 🚀 Live Demo

Visit the live application: [Agroverse on Vercel](https://your-deployment-url.vercel.app)

## ✨ Features

### 🌱 Core Farming Mechanics
- **Realistic Crop Growth** - Time-based plant development with multiple growth stages
- **6 Different Tools** - Hoe, Watering Can, Seeds, Fertilizer, Shears, and Harvest Basket
- **Multiple Crop Types** - Wheat, Corn, Tomatoes, Carrots, and Lettuce
- **Environmental Systems** - Weather, soil conditions, and day/night cycles

### 🤖 AI-Powered Features
- **Smart Crop Analysis** - AI-driven plant health assessment
- **Disease Diagnosis** - Intelligent identification of plant issues
- **Growth Optimization** - Personalized farming recommendations
- **Predictive Analytics** - Harvest timing and yield forecasting

### 🎮 Immersive Experience
- **3D Graphics** - WebGL-powered realistic rendering
- **Root View System** - Underground plant visualization
- **Particle Effects** - Dynamic visual feedback for actions
- **3D Audio** - Positional sound effects and ambient audio

## 🛠️ Technology Stack

### Frontend
- **Three.js** - 3D graphics rendering
- **React 18** - UI framework
- **@react-three/fiber** - React renderer for Three.js
- **@react-three/drei** - Three.js helpers and utilities
- **Vite** - Build tool and development server

### AI Integration
- **Groq API** - AI-powered crop analysis
- **llama3-8b-8192** - Primary AI model
- **llama-3.1-70b-versatile** - Advanced analysis model

### Development
- **ES6+ JavaScript** - Modern JavaScript features
- **WebGL** - Hardware-accelerated graphics
- **CSS3** - Advanced styling and animations
- **HTML5** - Semantic markup and canvas

## 🎯 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Modern web browser with WebGL support

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/agroverse.git
   cd agroverse
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Add your Groq API key to .env
   VITE_GROQ_API_KEY=your_api_key_here
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:5173
   ```

### Building for Production

```bash
npm run build
npm run preview
```

## 🎮 How to Play

### Basic Controls
- **WASD** - Move around the farm
- **Mouse** - Look around and aim
- **Space** - Jump
- **E** - Interact with crops
- **1-6** - Select farming tools
- **Mouse Wheel** - Cycle through tools

### Farming Actions
- **🌾 Harvest** - Collect mature crops (80%+ growth)
- **💧 Water** - Increase plant hydration
- **🔧 Treat** - Apply disease treatment
- **🌱 Fertilize** - Boost nutrient levels
- **🔍 Inspect** - Get detailed plant information
- **🤖 AI Analysis** - Get intelligent farming advice

### Advanced Features
- **R** - Toggle root view system
- **P** - Open pause menu
- **F1** - Show/hide instructions
- **Esc** - Close panels or pause game

## 🚀 Deployment

### Vercel Deployment

1. **Connect to Vercel**
   ```bash
   npm i -g vercel
   vercel login
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Environment Variables**
   - Add `VITE_GROQ_API_KEY` in Vercel dashboard
   - Configure any additional environment variables

### Other Platforms
- **Netlify**: Use `npm run build` and deploy `dist` folder
- **GitHub Pages**: Use GitHub Actions with build workflow
- **AWS S3**: Deploy static files from `dist` folder

## 🔧 Configuration

### AI Settings
Adjust AI behavior in the settings panel:
- **Temperature**: Controls AI response creativity (0.0-1.0)
- **Model Selection**: Choose between different AI models
- **Response Caching**: Enable/disable AI response caching

### Game Settings
- **Render Distance**: Adjust 3D rendering distance
- **Time Speed**: Control game time acceleration
- **Graphics Quality**: Enable/disable shadows and particles
- **Audio**: Master volume and 3D audio settings

## 🏗️ Project Structure

```
src/
├── ai/           # AI integration and analysis
├── audio/        # Sound management and effects
├── crops/        # Crop simulation and root systems
├── effects/      # Particle systems and visual effects
├── input/        # User input handling
├── player/       # Player character and camera
├── tools/        # Farming tool system
├── ui/           # User interface management
├── world/        # 3D world generation and terrain
└── main.js       # Application entry point
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Built with [Bolt.new](https://bolt.new/)** - AI-powered web development
- **Three.js Community** - 3D graphics framework
- **Groq** - AI API services
- **React Three Fiber** - React renderer for Three.js

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-username/agroverse/issues) page
2. Create a new issue with detailed information
3. Join our community discussions

---

**🌾 Happy Farming in the Agroverse! 🚜**
