"use client";

import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import { useStore } from "./(lib)/store";
import Sidebar from "./(components)/Sidebar";
import ZoomControls from "./(components)/ZoomControls";
import TimeSlider from "./(components)/TimeSlider";
import StatusIndicator from "./(components)/StatusIndicator";
import LoadingScreen from "./(components)/LoadingScreen";
import NotificationSystem from "./(components)/NotificationSystem";
import AQILegend from "./(components)/AQILegend";
import { generateRandomSensorBatch } from "./(lib)/sim";

// Dynamically import the map component to avoid SSR issues
const SmartConeMap = dynamic(() => import("./(components)/SmartConeMap"), {
  ssr: false,
  loading: () => <LoadingScreen />,
});

export default function Home() {
  const { actions } = useStore();

  // Initialize with some sample data on mount
  useEffect(() => {
    // Add some initial random data for demonstration
    const initialData = generateRandomSensorBatch(8, {
      minLat: 38.65,
      maxLat: 38.95,
      minLon: -120.55,
      maxLon: -120.25,
    });
    actions.addPoints(initialData);
  }, [actions]);

  return (
    <main className="flex h-screen bg-white overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Map Container */}
      <div className="flex-1 relative">
        <SmartConeMap />
        <StatusIndicator />
        <ZoomControls />
        <TimeSlider />
        <AQILegend />
      </div>

      {/* Global Notifications */}
      <NotificationSystem />
    </main>
  );
}
