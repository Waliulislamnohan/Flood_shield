"use client";
import dynamic from "next/dynamic";
import React, { useMemo, useState } from "react";
import DashboardLayout from "@/app/layout/DashboardLayout";
// import Tables from "./components/tables";

const Dashboard = () => {
  const MapCoordinates = useMemo(
    () =>
      dynamic(() => import("@/app/components/maps"), {
        loading: () => <p>A map is loading</p>,
        ssr: false,
      }),
    []
  );
  return (
    <DashboardLayout>

<div className="text-center px-4 py-2 font-semibold text-2xl text-gray-800 shadow-lg shadow-gray-400 mx-auto max-w-md mb-4 rounded-lg bg-white bg-opacity-30 backdrop-blur-md border border-white border-opacity-20">
  Flood Cover Visualization
</div>

      <MapCoordinates/>
      {/* <Tables /> */}
    </DashboardLayout>
  );
};

export default Dashboard;
