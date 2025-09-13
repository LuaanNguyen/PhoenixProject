"use client";

import { useStore } from "../(lib)/store";

export default function ZoomControls() {
  const { view, actions } = useStore();

  const handleZoomIn = () => {
    actions.setView({
      zoom: Math.min((view.zoom || 8) + 1, 18),
    });
  };

  const handleZoomOut = () => {
    actions.setView({
      zoom: Math.max((view.zoom || 8) - 1, 1),
    });
  };

  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
      <button
        onClick={handleZoomIn}
        className="w-12 h-12 bg-white hover:bg-blue-500 hover:text-white border border-gray-200 rounded-xl shadow-lg flex items-center justify-center text-gray-700 transition-all transform hover:scale-105"
        title="Zoom in"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
      <button
        onClick={handleZoomOut}
        className="w-12 h-12 bg-white hover:bg-blue-500 hover:text-white border border-gray-200 rounded-xl shadow-lg flex items-center justify-center text-gray-700 transition-all transform hover:scale-105"
        title="Zoom out"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
    </div>
  );
}
