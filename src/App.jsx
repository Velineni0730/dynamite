import './index.css';
import { motion } from 'framer-motion';

// --- Your Exact Image Imports ---
import dynamiteIcon from './assets/dynamite.png';
import heartTop from './assets/heart_top.png';
import starTop from './assets/star_top.png';
import cloudTop from './assets/cloud_top.png';
import youGotThis from './assets/you_got_this.png';
import heroDynamiteText from './assets/hero_dynamite.png';
import heroIllustration from './assets/hero.png';

import brainIcon from './assets/brain.png';
import bookIcon from './assets/book.png';
import targetIcon from './assets/target.png';
import barGraphIcon from './assets/bar_graph.png';

import cloudBottom from './assets/cloud_bottom.png';
import bottomPot from './assets/bottom_pot.png';

export default function App() {
  return (
    <div className="min-h-screen font-sans bg-bg-blue overflow-x-hidden">
      {/* 1. TOP NAVIGATION BAR */}
      <nav className="bg-[#4871C4] text-white px-4 md:px-8 py-3 w-full flex justify-between items-center z-50 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center">
             <img src={dynamiteIcon} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-2xl tracking-wide leading-none mb-1 flex items-center gap-1">
              DYNAMITE <span className="text-sm">✨</span>
            </h1>
            <p className="text-[10px] font-bold tracking-widest uppercase leading-none opacity-90">
              Your Study Hero ♥
            </p>
          </div>
        </div>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-2">
          <button className="bg-btn-yellow text-[#1E3A8A] px-6 py-2 rounded-full font-bold flex items-center gap-2 shadow-sm">
            <span>🏠</span> Home
          </button>
          <button className="text-white/90 hover:bg-white/10 px-6 py-2 rounded-full font-semibold flex items-center gap-2 transition-colors">
            <span className="opacity-80">🎛️</span> My Dashboard
          </button>
          <button className="text-white/90 hover:bg-white/10 px-6 py-2 rounded-full font-semibold flex items-center gap-2 transition-colors">
            <span className="opacity-80">📁</span> My Workspace
          </button>
          <button className="text-white/90 hover:bg-white/10 px-6 py-2 rounded-full font-semibold flex items-center gap-2 transition-colors">
            <span className="opacity-80">🛠️</span> Tools
          </button>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-4">
          <button className="text-xl hover:scale-110 transition-transform hidden sm:block">🔔</button>
          <div className="w-10 h-10 bg-white rounded-full border-2 border-white shadow-md"></div>
        </div>
      </nav>

        {/* 2. HERO SECTION */}
      <div className="bg-[#FFF9E6] relative w-full pt-12 pb-32 md:pb-48 px-4 md:px-12 flex flex-col items-center z-10">
        
        {/* Floating Background Elements */}
        <motion.img src={heartTop} alt="Heart" className="hidden md:block absolute top-12 left-12 w-16"
          animate={{ y: [0, -15, 0], rotate: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} />
          
        <motion.img src={starTop} alt="Star" className="hidden md:block absolute top-16 left-[35%] w-8"
          animate={{ y: [0, -10, 0], scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} />
          
        <motion.img src={cloudTop} alt="Cloud" className="hidden lg:block absolute top-40 right-10 w-28 opacity-90"
          animate={{ x: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }} />

        {/* Hero Grid */}
        <main className="max-w-7xl w-full mx-auto flex flex-col-reverse lg:flex-row items-center justify-between gap-8 z-20">
          
          {/* Left Content */}
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="flex-1 text-center lg:text-left z-10 mt-8 lg:mt-0">
            <img src={heroDynamiteText} alt="DYNAMITE" className="w-[350px] md:w-[450px] mx-auto lg:mx-0 mb-4" />
            
            <h2 className="text-lg md:text-2xl font-bold text-[#2B579A] tracking-[0.2em] mb-6 flex items-center justify-center lg:justify-start gap-3">
              <span className="text-blue-400">♥</span> YOUR STUDY HERO <span className="text-blue-400">♥</span>
            </h2>
            <p className="text-[#6B7280] text-base md:text-lg leading-relaxed mb-8 max-w-md mx-auto lg:mx-0">
              Stay focused, protect your peace,<br className="hidden md:block"/>
              and be the <span className="text-[#4871C4] font-bold">best version of you.</span>
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button className="bg-[#4871C4] text-white px-8 py-3.5 rounded-full font-bold shadow-lg hover:-translate-y-1 transition-all flex items-center gap-2">
                Let's Start ➔
              </button>
              <button className="bg-[#FCE69B] text-[#1E3A8A] px-8 py-3.5 rounded-full font-bold shadow-sm hover:-translate-y-1 transition-all flex items-center gap-2">
                Explore Tools ✨
              </button>
            </div>
          </motion.div>

          {/* Right Hero Illustration */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="flex-1 relative flex justify-center w-full">
            <img src={heroIllustration} alt="Study Hero Illustration" className="w-full max-w-[650px] object-contain drop-shadow-xl relative z-10" />
            
            {/* The Speech Bubble hovering over the boy */}
            <motion.img src={youGotThis} alt="You got this!" className="absolute top-10 right-4 lg:-right-4 w-24 lg:w-32 z-20"
              animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} />
          </motion.div>
        </main>

        {/* Wavy Divider */}
        <div className="absolute left-0 right-0 bottom-0 w-full overflow-hidden leading-[0] pointer-events-none">
          <svg className="block w-full h-[60px] md:h-[100px] lg:h-[150px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C50,30,150,70,321.39,56.44Z" fill="#E8F0FF"></path>
          </svg>
        </div>
      </div>

      {/* 3. FEATURE CARDS */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} 
        className="max-w-7xl mx-auto px-4 md:px-12 relative z-20">
        
        <div className="bg-white rounded-2xl md:rounded-[2rem] p-6 shadow-sm border border-white flex flex-col md:flex-row justify-between gap-4 -mt-16 md:-mt-24">
          
          <div className="flex-1 flex items-center gap-4 p-2">
            <img src={brainIcon} alt="Brain" className="w-12 h-12 object-contain" />
            <div>
              <h3 className="text-[#2B579A] font-bold text-sm mb-0.5">Protect Your Mind</h3>
              <p className="text-[#6B7280] text-xs">Mental health tools and mindful habits.</p>
            </div>
          </div>

          <div className="flex-1 flex items-center gap-4 p-2 md:border-l border-gray-100">
            <img src={bookIcon} alt="Book" className="w-12 h-12 object-contain" />
            <div>
              <h3 className="text-[#2B579A] font-bold text-sm mb-0.5">Study Smarter</h3>
              <p className="text-[#6B7280] text-xs">Plan, organize and ace your goals.</p>
            </div>
          </div>

          <div className="flex-1 flex items-center gap-4 p-2 md:border-l border-gray-100">
            <img src={targetIcon} alt="Target" className="w-12 h-12 object-contain" />
            <div>
              <h3 className="text-[#2B579A] font-bold text-sm mb-0.5">Achieve Goals</h3>
              <p className="text-[#6B7280] text-xs">Track progress and celebrate wins.</p>
            </div>
          </div>

          <div className="flex-1 flex items-center gap-4 p-2 md:border-l border-gray-100">
            <img src={barGraphIcon} alt="Chart" className="w-12 h-12 object-contain" />
            <div>
              <h3 className="text-[#2B579A] font-bold text-sm mb-0.5">See Progress</h3>
              <p className="text-[#6B7280] text-xs">Unlock levels and be your hero.</p>
            </div>
          </div>
          
        </div>
      </motion.div>

      {/* 4. BOTTOM SECTION (Quick Access & True Sticky Note) */}
      <div className="max-w-7xl mx-auto px-4 md:px-12 pb-24 mt-8 flex flex-col lg:flex-row gap-8 relative z-20">
        
        {/* Floating Cloud Bottom */}
        <motion.img src={cloudBottom} alt="Cloud" className="absolute -left-6 top-10 w-20 hidden xl:block"
          animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }} />

        {/* Quick Access Box */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} 
          className="flex-1 bg-white p-8 md:p-10 rounded-[2rem] shadow-sm border border-white">
          <h3 className="text-[#1E3A8A] font-bold text-lg mb-8 flex items-center gap-2">
            Quick Access ⭐️
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
             {/* Using pure CSS for the pastel icon backgrounds since you don't have SVGs for these yet */}
            {[
              { icon: '🎛️', label: 'My Dashboard', bg: 'bg-[#F0F5FF]' },
              { icon: '📁', label: 'My Workspace', bg: 'bg-[#FFF7E0]' },
              { icon: '⏱️', label: 'Focus Timer', bg: 'bg-[#F0F5FF]' },
              { icon: '📝', label: 'Notes', bg: 'bg-[#FFF9E6]' },
              { icon: '🌱', label: 'Habit Tracker', bg: 'bg-[#F0FFF4]' },
              { icon: '🛠️', label: 'Tools', bg: 'bg-[#FFF9E6]' }
            ].map((item, idx) => (
              <motion.button key={idx} whileHover={{ scale: 1.05 }} className="flex flex-col items-center gap-3 group">
                <div className={`w-16 h-16 rounded-2xl ${item.bg} flex items-center justify-center text-2xl border border-gray-50 shadow-sm`}>
                  {item.icon}
                </div>
                <span className="text-xs text-[#2B579A] font-bold">{item.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* 1:1 Sticky Note Reminder */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} 
          className="relative w-full lg:w-[280px] shrink-0 mt-8 lg:mt-0 lg:ml-12">
          
          {/* The Physical Paper Note */}
          <div className="bg-[#FEF5D0] p-8 w-full h-full min-h-[220px] shadow-md rotate-2 relative rounded-sm">
            {/* The Blue Tape */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-5 bg-[#6DA5FF] opacity-80 -rotate-[4deg] shadow-sm"></div>
            
            <h3 className="text-[#1E3A8A] font-bold text-lg mb-4 flex items-center gap-2">
              Reminder 💙
            </h3>
            <p className="text-[#6B7280] text-sm leading-relaxed pr-4">
              Small steps everyday lead to big changes.
            </p>
          </div>

          {/* Plant overlapping the bottom right of the sticky note onto the desk/background */}
          <motion.img src={bottomPot} alt="Plant" className="absolute -bottom-8 -right-8 w-24 drop-shadow-lg z-30" 
            whileHover={{ scale: 1.05, rotate: 2 }} />
            
        </motion.div>

      </div>
      
    </div>
  );
}