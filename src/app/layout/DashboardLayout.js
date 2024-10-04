import { FaMap, FaTable, FaUpload } from "react-icons/fa";
import Navbar from "./Navbar";
import Link from 'next/link';
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import shp from 'shpjs'; // Import the shpjs library

const DashboardLayout = ({ children }) => {

  const [uploadedGeoJSON, setUploadedGeoJSON] = useState(null);

  const onDrop = async (acceptedFiles) => {
    // Process upload shapefile and convert to GeoJSON
    const shapefile = acceptedFiles[0];

    // Read the shapefile using shpjs library
    const geojson = await shp(shapefile);

    // Set the GeoJSON data in state
    setUploadedGeoJSON(geojson);

    // You can now use the geojson data for further processing or visualization
    console.log("Uploaded GeoJSON:", geojson);
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div className="w-full h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="flex-[22%] p-5 bg-gray-200">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Dashboard</h2>
          </div>
          <div className="mb-4 flex">
            <Link href="/">
              <div className="flex items-center text-md font-semibold mb-2 cursor-pointer hover:text-blue-400">
                <FaMap className="mr-2 inline-block mt-1" />
                Maps
              </div>
            </Link>
          </div>
          <div className="mb-4 flex">
            <Link href="/pages/tables">
              <div className="flex items-center text-md font-semibold mb-2 cursor-pointer hover:text-blue-400">
                <FaTable className="mr-2 inline-block mt-1" />
                Table
              </div>
            </Link>
          </div>
          <div className="mb-4 flex">
            <Link href="/pages/forecast-map">
              <div className="flex items-center text-md font-semibold mb-2 cursor-pointer hover:text-blue-400">
                <FaTable className="mr-2 inline-block mt-1" />
                Forcast Map 
              </div>
            </Link>
          </div>
          {/* <div className="mb-4 flex cursor-pointer hover:text-blue-400" {...getRootProps()}>
            <input {...getInputProps()} />
            <FaUpload className="mr-2 inline-block mt-1" />
            <h2 className="text-md font-semibold mb-2">Upload Shapefile</h2>
          </div> */}
        </aside>

        {/* Main Content */}
        <main className="flex-[78%] p-4 bg-gray-100 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;