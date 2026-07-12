import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Hyperspeed from '../components/Hyperspeed/Hyperspeed';

export default function LandingPage() {
  const navigate = useNavigate();

  // Hyperspeed config memoized to prevent re-renders
  const effectOptions = useMemo(() => ({
    distortion: 'turbulentDistortion',
    length: 400,
    roadWidth: 10,
    islandWidth: 2,
    lanesPerRoad: 3,
    fov: 90,
    fovSpeedUp: 150,
    speedUp: 2,
    carLightsFade: 0.4,
    totalSideLightSticks: 20,
    lightPairsPerRoadWay: 40,
    shoulderLinesWidthPercentage: 0.05,
    brokenLinesWidthPercentage: 0.1,
    brokenLinesLengthPercentage: 0.5,
    lightStickWidth: [0.12, 0.5],
    lightStickHeight: [1.3, 1.7],
    movingAwaySpeed: [60, 80],
    movingCloserSpeed: [-120, -160],
    carLightsLength: [12, 80],
    carLightsRadius: [0.05, 0.14],
    carWidthPercentage: [0.3, 0.5],
    carShiftX: [-0.8, 0.8],
    carFloorSeparation: [0, 5],
    colors: {
      roadColor: 0x080808,
      islandColor: 0x0a0a0a,
      background: 0x000000,
      shoulderLines: 0xffffff,
      brokenLines: 0xffffff,
      leftCars: [0xd856bf, 0x6750a2, 0xc247ac],
      rightCars: [0x03b3c3, 0x0e5ea5, 0x324555],
      sticks: 0x03b3c3
    }
  }), []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black flex items-center justify-center font-sans">
      {/* 3D Space Background */}
      <Hyperspeed effectOptions={effectOptions} />

      {/* Main Transparent Panel */}
      <div className="relative z-10 w-full max-w-xl mx-4 bg-transparent rounded-2xl p-8 transition-all duration-300">
        
        {/* Logo and Brand */}
        <div className="flex flex-col items-center text-center mb-8">
          <img src="/logo.png" alt="TransitOps Logo" className="w-32 h-32 object-contain mb-4" />
          <h1 className="text-5xl font-extrabold tracking-tight text-white">
            Transit<span className="text-accent">Ops</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1 uppercase tracking-widest">
            Next-Gen Fleet Intelligence
          </p>
        </div>

        {/* View Switcher */}
        <div className="space-y-6 animate-fade-in">
          <p className="text-gray-300 text-base text-center mb-6 leading-relaxed">
            Optimize logistics, track vehicle health, and manage dispatching workflows with high performance.
          </p>
          <div className="grid grid-cols-2 gap-4 text-center">
            <button
              onClick={() => navigate('/login')}
              className="btn-primary py-3 text-sm font-semibold rounded-xl"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="bg-white/10 hover:bg-white/15 text-white py-3 text-sm font-semibold rounded-xl border border-white/10 transition-all duration-150"
            >
              Register
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
