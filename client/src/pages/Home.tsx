import React, { useState, useEffect } from 'react';
import { Landing } from './Landing';


const Home: React.FC = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* 1. THE LOADING OVERLAY */}
      <div 
        className={`fixed inset-0 z-[100] transition-transform duration-900 ease-in-out ${
          loading ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex h-screen w-full flex-col items-center justify-center bg-[#ADC9E3]">
        <div className="text-center bol">
          <h1 className="text-[270px] font-black text-[#F25C3D] leading-none ">
            earn
          </h1>
          <p className="text-4xl font-bold tracking-tight text-[#F25C3D] md:text-4xl -mt-6">
             Decentralized Freelance Hub for you
          </p>
        </div>
      </div>
      </div>

      {/* 2. THE MAIN CONTENT */}
      <div className={`flex flex-col min-h-screen w-full transition-opacity duration-1000 ${
        loading ? 'opacity-0' : 'opacity-100'
      }`}>
       <Landing/>
      </div>
    </div>
  );
};

export default Home;
