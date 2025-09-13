"use client";

export default function LoadingScreen() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="relative mb-8">
          {/* Animated forest icon */}
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div className="absolute inset-0 rounded-full bg-green-100 animate-pulse"></div>
            <div
              className="absolute inset-2 rounded-full bg-green-200 animate-pulse"
              style={{ animationDelay: "0.5s" }}
            ></div>
            <div className="absolute inset-4 rounded-full bg-green-300 flex items-center justify-center">
              <span className="text-2xl">🌲</span>
            </div>
          </div>

          {/* Loading rings */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
            <div className="w-20 h-20 border-4 border-green-200 border-t-green-500 rounded-full animate-spin"></div>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Loading Forest Monitor
        </h2>
        <p className="text-gray-600 mb-4">Initializing wildfire sensors...</p>

        {/* Progress dots */}
        <div className="flex justify-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
          <div
            className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
            style={{ animationDelay: "0.1s" }}
          ></div>
          <div
            className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
        </div>
      </div>
    </div>
  );
}
