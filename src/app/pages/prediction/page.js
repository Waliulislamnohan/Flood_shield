"use client";

import DashboardLayout from "@/app/layout/DashboardLayout";

// Dynamically import the component to avoid server-side rendering issues with Leaflet
import MapCoordinates from "@/app/components/prediction";

export default function MapPage() {
  return (
    <DashboardLayout>
        <MapCoordinates />
    </DashboardLayout>      
    
  );
}