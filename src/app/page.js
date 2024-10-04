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
      <div className="text-center p-2 font-semibold text-2xl  text-gray-800 shadow-sm shadow-gray-400 mx-auto  max-w-[fit-content] mb-2  rounded-sm bg-gray-100">
        Flood cover Visualization 
      </div>
      <MapCoordinates/>
      {/* <Tables /> */}
    </DashboardLayout>
  );
};

export default Dashboard;
