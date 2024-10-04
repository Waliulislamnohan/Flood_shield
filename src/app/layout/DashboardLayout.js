import { FaMap, FaTable, FaUpload ,FaBars, FaTimes} from "react-icons/fa";
import Navbar from "./Navbar";
import Link from 'next/link';
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import shp from 'shpjs'; // Import the shpjs library

const DashboardLayout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };
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
        <aside
          className={`bg-gray-200 transition-all duration-300 ${
            isCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          <div className="flex items-center justify-between p-4">
            {!isCollapsed && <h2 className="text-lg font-semibold">Dashboard</h2>}
            <button onClick={toggleSidebar} className="focus:outline-none">
              {isCollapsed ? <FaBars /> : <FaTimes />}
            </button>
          </div>
          <nav className="mt-4">
            <Link href="/">
              <div className="flex items-center text-md font-semibold mb-4 cursor-pointer hover:text-blue-400 px-4">
                <FaMap className="mr-2" />
                {!isCollapsed && 'Maps'}
              </div>
            </Link>
            <Link href="/pages/tables">
              <div className="flex items-center text-md font-semibold mb-4 cursor-pointer hover:text-blue-400 px-4">
                <FaTable className="mr-2" />
                {!isCollapsed && 'Table'}
              </div>
            </Link>

            <Link href="/pages/prediction">
              <div className="flex items-center text-md font-semibold mb-4 cursor-pointer hover:text-blue-400 px-4 ">
                <FaTable className="mr-2" />
                {!isCollapsed && 'Prediction'}

              </div>
            </Link>

            <Link href="/pages/adminpanel">
              <div className="flex items-center text-md font-semibold mb-4 cursor-pointer hover:text-blue-400 px-4">
                <FaTable className="mr-2" />
                {!isCollapsed && 'Admin Panel'}
              </div>
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 bg-gray-100 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
