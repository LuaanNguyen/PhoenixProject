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
        className="w-10 h-10 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg shadow-md flex items-center justify-center text-gray-700 hover:text-gray-900 transition-colors"
        title="Zoom in"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
      <button
        onClick={handleZoomOut}
        className="w-10 h-10 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg shadow-md flex items-center justify-center text-gray-700 hover:text-gray-900 transition-colors"
        title="Zoom out"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
    </div>
  );
}
