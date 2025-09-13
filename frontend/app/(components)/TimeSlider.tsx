"use client";

import { useStore } from "../(lib)/store";

export default function TimeSlider() {
  const { timeWindowMin, actions } = useStore();

  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10 bg-white rounded-lg px-3 py-2 shadow-lg">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">Time:</span>
        <input
          type="range"
          min="5"
          max="30"
          step="5"
          value={timeWindowMin}
          onChange={(e) => actions.setTimeWindow(Number(e.target.value))}
          className="w-24 h-1 bg-gray-200 rounded appearance-none cursor-pointer"
        />
        <span className="text-sm font-medium text-gray-900">
          {timeWindowMin}m
        </span>
      </div>
    </div>
  );
}
