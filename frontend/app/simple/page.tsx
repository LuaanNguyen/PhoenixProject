"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useStore } from "../(lib)/store";
import SimpleSidebar from "../(components)/SimpleSidebar";
import RightSidebar from "../(components)/RightSidebar";

// Dynamic import to prevent SSR issues
const SimpleFireMap = dynamic(() => import("../(components)/SimpleFireMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
        <div className="text-gray-600">
          Loading Arduino Fire Detection System...
        </div>
      </div>
    </div>
  ),
});

export default function SimpleFirePage() {
  const { actions } = useStore();

  useEffect(() => {
    // Start the WebSocket connection for simple fire system
    actions.startLive();

    return () => {
      actions.stopLive();
    };
  }, [actions]);

  return (
    <main className="flex h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-white overflow-hidden">
      {/* Left Sidebar */}
      <SimpleSidebar />

      {/* Map Container */}
      <div className="flex-1 relative bg-gradient-to-br from-blue-50/20 to-purple-50/20">
        <SimpleFireMap />
      </div>

      {/* Right Sidebar */}
      <RightSidebar />
    </main>
  );
}
