"use client";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { FaGithub } from "react-icons/fa";
import { truncateAddress } from "@/lib/truncate";
import { useState, useEffect, useRef } from "react";

export default function Header() {
  const { address, isConnected } = useAccount();
  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = useRef(null);
  const [particles, setParticles] = useState([]);
  const [smokeParticles, setSmokeParticles] = useState([]);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ایجاد ذرات دود فقط در سمت کلاینت
  useEffect(() => {
    const particles = Array(20).fill(null).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 5}s`,
      animationDuration: `${5 + Math.random() * 10}s`,
      transform: `translateZ(${Math.random() * 20 - 10}px)`
    }));
    setSmokeParticles(particles);
  }, []);

  useEffect(() => {
    if (!headerRef.current) return;
    
    const handleMouseMove = (e) => {
      const headerRect = headerRef.current.getBoundingClientRect();
      const x = e.clientX - headerRect.left;
      const y = e.clientY - headerRect.top;
      
      // ایجاد ذرات جدید در موقعیت موس
      const newParticle = {
        id: Date.now() + Math.random(),
        x,
        y,
        size: Math.random() * 15 + 5,
        color: Math.random() > 0.5 ? 
          `rgba(${147 + Math.random() * 50}, ${50 + Math.random() * 30}, ${200 + Math.random() * 55}, ${0.7 + Math.random() * 0.3})` : 
          `rgba(${50 + Math.random() * 30}, ${150 + Math.random() * 50}, ${200 + Math.random() * 55}, ${0.7 + Math.random() * 0.3})`,
        life: 100, // عمر ذره (100% تا 0%)
        speedX: (Math.random() - 0.5) * 2,
        speedY: (Math.random() - 0.5) * 2,
        blur: Math.random() * 10 + 5
      };
      
      setParticles(prev => [...prev.slice(-20), newParticle]); // حداکثر 20 ذره همزمان
    };
    
    const headerElement = headerRef.current;
    headerElement.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      headerElement.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    // انیمیشن ذرات
    const interval = setInterval(() => {
      setParticles(prev => 
        prev
          .map(p => ({
            ...p,
            x: p.x + p.speedX,
            y: p.y + p.speedY,
            life: p.life - 2,
            size: p.size * 0.98
          }))
          .filter(p => p.life > 0)
      );
    }, 50);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <header 
      ref={headerRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled ? "py-2" : "py-4"
      }`}
    >
      {/* پس‌زمینه تیره با گرادینت */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900"></div>
      
      {/* ذرات دنباله‌دار موس */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: `${particle.x}px`,
              top: `${particle.y}px`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              background: particle.color,
              filter: `blur(${particle.blur}px)`,
              opacity: particle.life / 100,
              transform: `translate(-50%, -50%) scale(${particle.life / 100})`,
              transition: 'all 0.1s ease-out',
              zIndex: Math.floor(particle.life / 10)
            }}
          />
        ))}
      </div>
      
      {/* افکت‌های دود سه‌بعدی */}
      <div className="absolute inset-0 overflow-hidden">
        {/* لایه دود پایه - حرکت آهسته */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-900/10 to-blue-900/10 rounded-full filter blur-3xl animate-smoke-1"></div>
          <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-gradient-to-r from-blue-900/10 to-teal-900/10 rounded-full filter blur-3xl animate-smoke-2"></div>
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-gradient-to-r from-purple-900/10 to-blue-900/10 rounded-full filter blur-3xl animate-smoke-3"></div>
        </div>
        
        {/* لایه دود میانی - حرکت متوسط */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/3 left-1/5 w-64 h-64 bg-gradient-to-r from-purple-800/15 to-blue-800/15 rounded-full filter blur-2xl animate-smoke-4"></div>
          <div className="absolute top-1/2 right-1/5 w-56 h-56 bg-gradient-to-r from-blue-800/15 to-teal-800/15 rounded-full filter blur-2xl animate-smoke-5"></div>
          <div className="absolute bottom-1/3 left-1/4 w-60 h-60 bg-gradient-to-r from-purple-800/15 to-blue-800/15 rounded-full filter blur-2xl animate-smoke-6"></div>
        </div>
        
        {/* لایه دود بالایی - حرکت سریع */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-gradient-to-r from-purple-700/20 to-blue-700/20 rounded-full filter blur-xl animate-smoke-7"></div>
          <div className="absolute top-2/3 right-1/3 w-40 h-40 bg-gradient-to-r from-blue-700/20 to-teal-700/20 rounded-full filter blur-xl animate-smoke-8"></div>
          <div className="absolute bottom-1/2 left-2/5 w-44 h-44 bg-gradient-to-r from-purple-700/20 to-blue-700/20 rounded-full filter blur-xl animate-smoke-9"></div>
        </div>
        
        {/* ذرات رنگی برای افکت قدرت و ثروت - فقط در سمت کلاینت رندر می‌شوند */}
        <div className="absolute top-0 left-0 w-full h-full">
          {smokeParticles.map(particle => (
            <div 
              key={particle.id}
              className="absolute w-1 h-1 rounded-full animate-particle"
              style={{
                top: particle.top,
                left: particle.left,
                animationDelay: particle.animationDelay,
                animationDuration: particle.animationDuration,
                transform: particle.transform,
                background: Math.random() > 0.5 
                  ? 'rgba(147, 100, 230, 0.3)' 
                  : Math.random() > 0.5 
                    ? 'rgba(59, 130, 246, 0.3)' 
                    : 'rgba(20, 184, 166, 0.3)'
              }}
            ></div>
          ))}
        </div>
        
        {/* خطوط قدرت */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-0 left-1/4 w-0.5 h-full bg-gradient-to-b from-transparent via-purple-500/20 to-transparent animate-power-line-1"></div>
          <div className="absolute top-0 right-1/4 w-0.5 h-full bg-gradient-to-b from-transparent via-blue-500/20 to-transparent animate-power-line-2"></div>
          <div className="absolute top-0 left-1/2 w-0.5 h-full bg-gradient-to-b from-transparent via-teal-500/20 to-transparent animate-power-line-3"></div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 flex items-center relative z-10">
        {/* سمت چپ - دکمه گیت‌هاب */}
        <div className="flex-1 flex justify-start">
          <a
            href="https://github.com/3aDegH3/TokenSender"
            target="_blank"
            rel="noopener noreferrer"
            className="relative group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 group-hover:border-purple-500/50 transition-all duration-300">
              <FaGithub className="text-gray-300 group-hover:text-white transition-colors duration-300" size={20} />
            </div>
          </a>
        </div>
        
        {/* وسط - نام پروژه */}
        <div className="flex-1 text-center">
          <div className="inline-block relative">
            <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-blue-400 to-teal-400 animate-pulse">
              TSender
            </h1>
            <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </div>
        </div>
        
        {/* سمت راست - دکمه اتصال */}
        <div className="flex-1 flex justify-end">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
            <div className="relative">
              <ConnectButton 
                chainStatus="icon"
                accountStatus="address"
                showBalance={false}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* خط نوار پیشرفت در بالای صفحه */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 animate-progress"></div>
    </header>
  );
}