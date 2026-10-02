import React, { useState } from 'react';
import lungsImg from '../assets/images/medical_lungs_hologram_1790944797782.jpg';
import { Activity } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="flex flex-col items-center text-center pt-4 pb-6 px-4">
      {/* Anatomical Medical Illustration */}
      <div className="relative w-44 h-28 sm:w-56 sm:h-32 mb-2 flex items-center justify-center">
        {!imgError ? (
          <img
            src={lungsImg}
            alt="Medical Holographic Pulmonary Anatomy"
            className="w-full h-full object-contain mix-blend-multiply opacity-95 transition-opacity"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-50 to-teal-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-inner">
            <Activity className="w-12 h-12 stroke-[1.5]" />
          </div>
        )}
      </div>

      {/* Main Title & Subtitle */}
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
        SepsisSense
      </h1>
      <p className="mt-1 text-base sm:text-lg font-medium text-slate-700">
        AI-Powered Sepsis Risk Assessment
      </p>
      <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-lg">
        Upload patient records or enter vitals and lab values to predict sepsis risk
      </p>

      {/* Subtle Unboxed Clinical Tags */}
      <div className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-500">
        <span className="text-blue-600 font-semibold">Early Detection</span>
        <span aria-hidden="true" className="text-slate-300">·</span>
        <span>Explainable AI</span>
        <span aria-hidden="true" className="text-slate-300">·</span>
        <span className="text-teal-600 font-semibold">Better Outcomes</span>
      </div>
    </div>
  );
};
