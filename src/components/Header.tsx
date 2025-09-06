"use client";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { FaGithub } from "react-icons/fa";
import { useState, useEffect, useRef, useLayoutEffect } from "react";

export default function Header() {
  const { address, isConnected } = useAccount();
  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const [particles, setParticles] = useState<any[]>([]);
  const [smokeParticles, setSmokeParticles] = useState<any[]>([]);

  // header height that we use for spacer (string with px)
  const [headerHeight, setHeaderHeight] = useState<string>(() => {
    if (typeof window === "undefined") return "72px";
    return window.innerWidth >= 768 ? "72px" : "56px";
  });

  // scroll handler — threshold متفاوت برای دسکتاپ/موبایل
  useEffect(() => {
    const handleScroll = () => {
      const wide = window.innerWidth >= 1024;
      const threshold = wide ? 40 : 10;
      setIsScrolled(window.scrollY > threshold);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // smoke particles initial
  useEffect(() => {
    const parts = Array(20).fill(null).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 5}s`,
      animationDuration: `${5 + Math.random() * 10}s`,
      transform: `translateZ(${Math.random() * 20 - 10}px)`
    }));
    setSmokeParticles(parts);
  }, []);

  // mouse particle generator
  useEffect(() => {
    if (!headerRef.current) return;
    const handleMouseMove = (e: MouseEvent) => {
      const headerRect = headerRef.current!.getBoundingClientRect();
      const x = e.clientX - headerRect.left;
      const y = e.clientY - headerRect.top;
      const newParticle = {
        id: Date.now() + Math.random(),
        x, y,
        size: Math.random() * 15 + 5,
        color: Math.random() > 0.5 ?
          `rgba(${147 + Math.random() * 50}, ${50 + Math.random() * 30}, ${200 + Math.random() * 55}, ${0.7 + Math.random() * 0.3})` :
          `rgba(${50 + Math.random() * 30}, ${150 + Math.random() * 50}, ${200 + Math.random() * 55}, ${0.7 + Math.random() * 0.3})`,
        life: 100,
        speedX: (Math.random() - 0.5) * 2,
        speedY: (Math.random() - 0.5) * 2,
        blur: Math.random() * 10 + 5
      };
      setParticles(prev => [...prev.slice(-20), newParticle]);
    };

    const headerElement = headerRef.current;
    headerElement.addEventListener('mousemove', handleMouseMove);
    return () => headerElement.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // particle decay loop
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev =>
        prev
          .map(p => ({ ...p, x: p.x + p.speedX, y: p.y + p.speedY, life: p.life - 2, size: p.size * 0.98 }))
          .filter(p => p.life > 0)
      );
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // **useLayoutEffect** برای اندازه‌گیری هم‌زمان قبل از paint => جلوگیری از gap/jitter
  useLayoutEffect(() => {
    const setHeaderVar = () => {
      if (!headerRef.current) return;
      const h = Math.ceil(headerRef.current.getBoundingClientRect().height);
      const hStr = `${h}px`;
      setHeaderHeight(hStr);
      document.documentElement.style.setProperty('--header-height', hStr);
    };

    // initial set (synchronous)
    setHeaderVar();

    // observe changes
    const ro = new ResizeObserver(setHeaderVar);
    if (headerRef.current) ro.observe(headerRef.current);
    window.addEventListener('resize', setHeaderVar);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', setHeaderVar);
    };
    // isScrolled affects header size -> include in deps so height recalculated
  }, [isScrolled]);

  return (
    <>
      <header
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 min-h-[48px] md:min-h-[64px] ${
          isScrolled ? "md:py-2 py-1" : "md:py-3 py-2"
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900"></div>

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

        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-900/10 to-blue-900/10 rounded-full filter blur-3xl animate-smoke-1"></div>
            <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-gradient-to-r from-blue-900/10 to-teal-900/10 rounded-full filter blur-3xl animate-smoke-2"></div>
            <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-gradient-to-r from-purple-900/10 to-blue-900/10 rounded-full filter blur-3xl animate-smoke-3"></div>
          </div>

          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-1/3 left-1/5 w-64 h-64 bg-gradient-to-r from-purple-800/15 to-blue-800/15 rounded-full filter blur-2xl animate-smoke-4"></div>
            <div className="absolute top-1/2 right-1/5 w-56 h-56 bg-gradient-to-r from-blue-800/15 to-teal-800/15 rounded-full filter blur-2xl animate-smoke-5"></div>
            <div className="absolute bottom-1/3 left-1/4 w-60 h-60 bg-gradient-to-r from-purple-800/15 to-blue-800/15 rounded-full filter blur-2xl animate-smoke-6"></div>
          </div>

          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-gradient-to-r from-purple-700/20 to-blue-700/20 rounded-full filter blur-xl animate-smoke-7"></div>
            <div className="absolute top-2/3 right-1/3 w-40 h-40 bg-gradient-to-r from-blue-700/20 to-teal-700/20 rounded-full filter blur-xl animate-smoke-8"></div>
            <div className="absolute bottom-1/2 left-2/5 w-44 h-44 bg-gradient-to-r from-purple-700/20 to-blue-700/20 rounded-full filter blur-xl animate-smoke-9"></div>
          </div>

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
              />
            ))}
          </div>

          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-0 left-1/4 w-0.5 h-full bg-gradient-to-b from-transparent via-purple-500/20 to-transparent animate-power-line-1"></div>
            <div className="absolute top-0 right-1/4 w-0.5 h-full bg-gradient-to-b from-transparent via-blue-500/20 to-transparent animate-power-line-2"></div>
            <div className="absolute top-0 left-1/2 w-0.5 h-full bg-gradient-to-b from-transparent via-teal-500/20 to-transparent animate-power-line-3"></div>
          </div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Mobile layout - stacked vertically */}
          <div className="md:hidden flex flex-col items-center space-y-1.5 py-0.5">
            {/* GitHub button */}
            <a
              href="https://github.com/3aDegH3/TokenSender"
              target="_blank"
              rel="noopener noreferrer"
              className="relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
              <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 group-hover:border-purple-500/50 transition-all duration-300">
                <FaGithub className="text-gray-300 group-hover:text-white transition-colors duration-300" size={12} />
              </div>
            </a>

            {/* Site name */}
            <div className="inline-block relative">
              <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-blue-400 to-teal-400 animate-pulse">
                TSender
              </h1>
            </div>

            {/* Wallet button - CENTERED & GLOW LIMITED TO BUTTON */}
            <div className="w-full max-w-[320px] flex justify-center">
              <div className="relative group inline-flex">
                <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 blur opacity-25 group-hover:opacity-75 transition duration-300 pointer-events-none"></div>
                <div className="relative z-10">
                  <ConnectButton
                    chainStatus="icon"
                    accountStatus="address"
                    showBalance={false}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Desktop layout - horizontal */}
          <div className="hidden md:flex items-center">
            <div className="flex-1 flex justify-start">
              <a href="https://github.com/3aDegH3/TokenSender" target="_blank" rel="noopener noreferrer" className="relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
                <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 group-hover:border-purple-500/50 transition-all duration-300">
                  <FaGithub className="text-gray-300 group-hover:text-white transition-colors duration-300" size={20} />
                </div>
              </a>
            </div>

            <div className="flex-1 text-center">
              <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-blue-400 to-teal-400 animate-pulse">
                TSender
              </h1>
            </div>

            <div className="flex-1 flex justify-end">
              <div className="relative group inline-flex">
                <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 blur opacity-25 group-hover:opacity-75 transition duration-300 pointer-events-none"></div>
                <div className="relative z-10">
                  <ConnectButton chainStatus="icon" accountStatus="address" showBalance={false} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 animate-progress"></div>
      </header>

      {/* spacer: این div فضای هدر را در جریان صفحه اشغال می‌کند — مانع از افتادن محتوا زیر هدر می‌شود */}
      <div aria-hidden style={{ height: headerHeight }} />
    </>
  );
}
