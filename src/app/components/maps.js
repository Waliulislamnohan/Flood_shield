"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  LayersControl,
  Marker,
  Popup,
  useMap,
  GeoJSON,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import L from "leaflet";

import * as turf from "@turf/turf";

// **NEW:** Import required libraries for GeoTIFF handling
import georaster from "georaster";
import GeoRasterLayer from "georaster-layer-for-leaflet";

// **NEW:** Import axios for fetching binary data
import axios from "axios";

import styles from "./maps.module.css"; // Ensure this path is correct

const { BaseLayer, Overlay } = LayersControl;

export function ChangeView({ coords }) {
  const map = useMap();
  map.setView(coords, 12); // Zoom level set to 12
  return null;
}

export default function MapCoordinates() {
  const [stations, setStations] = useState([]);
  const [recentWaterLevels, setRecentWaterLevels] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredStations, setFilteredStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [borders, setBorders] = useState(null);
  const [rivers, setRivers] = useState(null);
  const [floodData, setFloodData] = useState(null);
  const [showFlood, setShowFlood] = useState(false); // State to control flood layer visibility
  const [geoRasterLayers, setGeoRasterLayers] = useState([]); // Array to hold multiple GeoTIFF Layers
  const [showFloodButtons, setShowFloodButtons] = useState(false);
  const [selectedYear, setSelectedYear] = useState(null);
  const [showYearButtons, setShowYearButtons] = useState(false); // **NEW** State to show/hide the year buttons for Flood
  const [showPopulationButtons, setShowPopulationButtons] = useState(false); 
  const [showYearButtons1, setShowYearButtons1] = useState(false);
  // State to track selected flood year
  const [selectedYear1, setSelectedYear1] = useState(null);


  const [geoData, setGeoData] = useState({
    lat: 23.685,
    lng: 90.3563,
  });
  const center = [geoData.lat, geoData.lng];

  const isCacheValid = (timestamp) => {
    const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
    return Date.now() - timestamp < CACHE_DURATION;
  };

  // Fetch the data from the first API
  useEffect(() => {

    const CACHE_DURATION = 60 * 60 * 1000; // Cache duration in milliseconds (1 hour)
  
    const isCacheValid = (timestamp) => {
      return Date.now() - timestamp < CACHE_DURATION;
    };
  
    const fetchStations = async () => {
      const cacheKey = "stationsData";
      const cachedData = localStorage.getItem(cacheKey);
  
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        if (isCacheValid(parsedData.timestamp)) {
          setStations(parsedData.data);
          setFilteredStations(parsedData.data);
          return; // Use cached data if valid
        }
      }
      try {
        const response = await fetch(
          "https://ffwc-api.bdservers.site/data_load/stations/",
          { mode: "cors" } // Handle CORS
        );
        const data = await response.json();
        setStations(data); // Store station data in state
        setFilteredStations(data); // Initially, all stations are shown

                // Cache the data
                localStorage.setItem(
                  cacheKey,
                  JSON.stringify({ data, timestamp: Date.now() })
                );


      } catch (error) {
        console.error("Error fetching station data:", error);
               // Use cached data if available
               if (cachedData) {
                const parsedData = JSON.parse(cachedData);
                setStations(parsedData.data);
                setFilteredStations(parsedData.data);
              }
      }
    };

    const fetchRecentWaterLevels = async () => {

      const cacheKey = "recentWaterLevelsData";
      const cachedData = localStorage.getItem(cacheKey);
  
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        if (isCacheValid(parsedData.timestamp)) {
          setRecentWaterLevels(parsedData.data);
          return; // Use cached data if valid
        }
      }

      try {
        const response = await fetch(
          "https://ffwc-api.bdservers.site/data_load/modified-observed/",
          { mode: "cors" } // Handle CORS
        );
        const data = await response.json();
        setRecentWaterLevels(data); // Store recent water levels in state

                // Cache the data
                localStorage.setItem(
                  cacheKey,
                  JSON.stringify({ data, timestamp: Date.now() })
                );

      } catch (error) {
        console.error("Error fetching recent water levels:", error);
          
        // Use cached data if available
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          setRecentWaterLevels(parsedData.data);
        }
      }
    };

    fetchStations();
    fetchRecentWaterLevels();
  }, []);

  ///////////////////////////////////////////////////

  // **NEW:** Fetch and process the local GeoTIFF data (2019.tif)
  // useEffect(() => {
  //   const fetchGeoTIFF = async () => {
  //     try {
  //       console.log("Fetching GeoTIFF...");
  //       // Fetch the local GeoTIFF file from the public folder
  //       const response = await axios.get("/2019.tif", {
  //         responseType: "arraybuffer", // Important for binary data
  //       });

  //       console.log("GeoTIFF fetched successfully.");

  //       // Parse the GeoTIFF using georaster
  //       const tiff = await georaster(response.data);

  //       console.log("GeoTIFF parsed successfully:", tiff);
  //       console.log("GeoTIFF bounds:", tiff.bounds); // **NEW** Check the bounds of the GeoTIFF
  //       console.log("GeoTIFF projection:", tiff.projection); // **NEW** Check the projection of the GeoTIFF

  //       // Create a GeoRasterLayer to display on the map
  //       const layer = new GeoRasterLayer({
  //         georaster: tiff,
  //         opacity: 0.7, // Adjust opacity for better visibility
  //         resolution: 256, // Adjust for performance vs. quality
  //         pixelValuesToColorFn: (values) => {
  //           if (values[0] > 0) {
  //             // Display for non-zero pixel values
  //             return "rgba(0, 0, 255, 0.5)"; // Blue color with transparency
  //           } else {
  //             return null; // No color for zero or other values
  //           }
  //         },
  //       });

  //       setGeoRasterLayer(layer);
  //       console.log("GeoTIFF layer created successfully.");
  //       // Set the layer to the state
  //     } catch (error) {
  //       console.error("Error fetching or parsing GeoTIFF:", error);
  //     }
  //   };

  //   fetchGeoTIFF();
  // }, []);

  // Function to fetch and set GeoTIFF layer based on year
   // Function to fetch and set GeoTIFF layer based on year
  // Function to fetch and set GeoTIFF layer based on year and color
    // Function to fetch and add a GeoTIFF layer
    const loadGeoTIFFLayer = async (year, filename, color) => {
      try {
        console.log(`Fetching GeoTIFF for ${filename}...`);
        // Fetch the corresponding GeoTIFF file from the public folder
        const response = await axios.get(`/${filename}.tif`, {
          responseType: "arraybuffer", // Important for binary data
        });
  
        console.log(`${filename} GeoTIFF fetched successfully.`);
  
        // Parse the GeoTIFF using georaster
        const tiff = await georaster(response.data);
  
        console.log(`${filename} GeoTIFF parsed successfully:`, tiff);
  
        // Set bounds manually in case bounds are missing from the GeoTIFF
        const bounds = tiff.bounds || [
          [21.0, 88.0], // Southwest corner [lat, lon]
          [26.0, 92.5], // Northeast corner [lat, lon]
        ];
  
        // Create a GeoRasterLayer to display on the map
        const layer = new GeoRasterLayer({
          georaster: tiff,
          opacity: 0.5, // Adjust opacity for better visibility (lower opacity makes it more subtle)
          resolution: 256, // Adjust for performance vs. quality
          pixelValuesToColorFn: (values) => {
            if (values[0] > 0) {
              return color; // Dynamic color passed based on the year
            } else {
              return null; // No color for zero or other values
            }
          },
          zIndex: 1000, // Ensure that the layer is rendered above other base layers
          bounds: bounds, // Manually set bounds if they are not available
        });
  
        // Add the new layer to the array of layers
        setGeoRasterLayers((prevLayers) => [...prevLayers, { year, layer }]); // Keep previous layers
        console.log(`${filename} GeoTIFF layer created successfully.`);
      } catch (error) {
        console.error(`Error fetching or parsing GeoTIFF for ${filename}:`, error);
      }
    };

  // Function to handle year button click with corresponding color
  // Function to handle year button click with corresponding color
  // const handleYearButtonClick = (year) => {
  //   if (year === "2019") {
  //     loadGeoTIFFLayer("2019", "rgba(128, 0, 128, 0.7)"); // Purple with lower opacity
  //   } else if (year === "2020") {
  //     loadGeoTIFFLayer("2020", "rgba(255, 165, 0, 0.7)"); // Orange with lower opacity
  //   } else if (year === "2021") {
  //     loadGeoTIFFLayer("2021", "rgba(0, 128, 128, 0.7)"); // Teal with lower opacity
  //   }
  // };

  // const handleYearButtonClick1 = (year) => {
  //   if (year === "2019") {
  //     loadGeoTIFFLayer("Population_2019", "rgba(128, 0, 128, 0.7)"); // Purple with lower opacity
  //   } else if (year === "2020") {
  //     loadGeoTIFFLayer("Population_2020", "rgba(255, 165, 0, 0.7)"); // Orange with lower opacity
  //   } else if (year === "2021") {
  //     loadGeoTIFFLayer("2021", "rgba(0, 128, 128, 0.7)"); // Teal with lower opacity
  //   }
  // };

  const handleYearButtonClick = (year) => {
    setSelectedYear(year); // Set selected flood year
    const filename = `${year}`; // Example naming convention
    const color = year === "2019" ? "rgba(255, 0, 0, 0.7)" : "rgba(128, 0, 128, 0.7)"; // Different colors for different years
    loadGeoTIFFLayer(year, filename, color);
  };

  // "rgba(255, 165, 0, 0.7)" : "rgba(128, 0, 128, 0.7)"
  
  const handleYearButtonClick1 = (year) => {
    setSelectedYear1(year); // Set selected population year
    const filename = `Population_${year}`; // Example naming convention
    const color = "rgba(0, 128, 128, 0.7)"; // Teal for population
    loadGeoTIFFLayer(year, filename, color);
  };



  // **NEW**: Handle Flood button click to show year buttons
  const handleFloodClick = () => {
    setSelectedYear(null); // Reset the selected year
    setShowYearButtons(true); // Show year buttons when Flood is clicked
  };

  const handlePopulationClick = () => {
    setSelectedYear(null); // Reset the selected year
    setShowYearButtons1(true); // Show year buttons when Flood is clicked
  };

    // Function to handle population year button click with corresponding color
    const handlePopulationYearButtonClick = (year) => {
      const filename = `Population_${year}`; // Construct filename based on year
      loadGeoTIFFLayer(year, filename, "rgba(0, 128, 128, 0.3)"); // Teal for population
    };
  

  // Fetch the borders GeoJSON data
  useEffect(() => {
    const fetchBorders = async () => {

      const cacheKey = "bordersData";
      const cachedData = localStorage.getItem(cacheKey);

      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        if (isCacheValid(parsedData.timestamp)) {
          setBorders(parsedData.data);
          return;
        }
      }

      try {
        const response = await fetch(
          "https://ffwc.rimes.int/assets/geojson/BD_Bndry_without_island.json",
          { mode: "cors" }
        );
        const data = await response.json();
        setBorders(data);

               // Cache the data
               localStorage.setItem(
                cacheKey,
                JSON.stringify({ data, timestamp: Date.now() })
              );

      } catch (error) {
        console.error("Error fetching borders GeoJSON data:", error);
        if (cachedData) {
          setBorders(JSON.parse(cachedData).data);
        }
      }
    };
    fetchBorders();
  }, []);

  // Fetch the rivers GeoJSON data
  useEffect(() => {
    const fetchRivers = async () => {
      const cacheKey = "riversData";
      const cachedData = localStorage.getItem(cacheKey);

      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        if (isCacheValid(parsedData.timestamp)) {
          setRivers(parsedData.data);
          return;
        }
      }
      try {
        const response = await fetch(
          "https://ffwc.rimes.int/assets/geojson/rivers-level-2.json",
          { mode: "cors" }
        );
        const data = await response.json();
        setRivers(data);
                // Cache the data
                localStorage.setItem(
                  cacheKey,
                  JSON.stringify({ data, timestamp: Date.now() })
                );
      } catch (error) {
        console.error("Error fetching rivers GeoJSON data:", error);
        if (cachedData) {
          setRivers(JSON.parse(cachedData).data);
        }
      }
    };
    fetchRivers();
  }, []);

  // Fetch the flood-prone areas GeoJSON data
  useEffect(() => {
    const fetchFloodData = async () => {
      const cacheKey = "floodData";
      const cachedData = localStorage.getItem(cacheKey);

      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        if (isCacheValid(parsedData.timestamp)) {
          setFloodData(parsedData.data);
          return;
        }
      }
      try {
        const response = await fetch(
          "https://ffwc.rimes.int/assets/geojson/bd_adm2.json",
          { mode: "cors" }
        );
        const data = await response.json();
        setFloodData(data);
                // Cache the data
                localStorage.setItem(
                  cacheKey,
                  JSON.stringify({ data, timestamp: Date.now() })
                );
      } catch (error) {
        console.error("Error fetching flood-prone areas GeoJSON data:", error);
        if (cachedData) {
          setFloodData(JSON.parse(cachedData).data);
        }
      }
    };
    fetchFloodData();
  }, []);

  //  // **NEW:** Fetch and process the GeoTIFF data
  //  useEffect(() => {
  //   const fetchGeoTIFF = async () => {
  //     try {
  //       const response = await axios.get(
  //         "https://ffwc.rimes.int/assets/geotiff/inundation/inundation_2019_4326.tif",
  //         {
  //           responseType: "arraybuffer", // Important for binary data
  //         }
  //       );

  //       const tiff = await georaster(response.data);
  //       const layer = new GeoRasterLayer({
  //         georaster: tiff,
  //         opacity: 0.7,
  //         resolution: 256, // Adjust for performance vs. quality
  //         pixelValuesToColorFn: (values) => {
  //           if (values[0] === 1) {
  //             return "rgba(0, 0, 255, 0.5)"; // Blue color with transparency
  //           } else {
  //             return null; // No color for other values
  //           }
  //         },
  //       });

  //       setGeoRasterLayer(layer);
  //     } catch (error) {
  //       console.error("Error fetching GeoTIFF data:", error);
  //     }
  //   };

  //   fetchGeoTIFF();
  // }, []);

  // Styling for borders
  const borderStyle = {
    color: "#FF0000", // Red color for borders
    weight: 2,
    opacity: 1,
    fillOpacity: 0.1,
  };

  // Styling for rivers
  const riverStyle = {
    color: "#0000FF", // Blue color for rivers
    weight: 1.5,
    opacity: 0.7,
  };

  // Styling for flood-prone areas
  const defaultFloodStyle = {
    color: "#FFA500", // Orange color for flood areas
    weight: 2,
    opacity: 0.8,
    fillOpacity: 0.4,
  };

  //..................................................

  const districtDangerStatus = useMemo(() => {
    const dangerStatus = {};
  
    // Create a map of districts to stations
    const districtStations = {};
    stations.forEach((station) => {
      if (station.district) {
        if (!districtStations[station.district]) {
          districtStations[station.district] = [];
        }
        districtStations[station.district].push(station);
      }
    });
  
    // For each district, check if any station is above danger level
    for (const district in districtStations) {
      const stationsInDistrict = districtStations[district];
      let isDistrictInDanger = false;
  
      for (const station of stationsInDistrict) {
        const recentWaterLevel =
          recentWaterLevels[station.id] &&
          Object.values(recentWaterLevels[station.id])[0];
  
        const isAboveDangerLevel =
          recentWaterLevel &&
          parseFloat(recentWaterLevel) > parseFloat(station.dangerlevel);
  
        if (isAboveDangerLevel) {
          isDistrictInDanger = true;
          break; // No need to check other stations in the district
        }
      }
  
      dangerStatus[district] = isDistrictInDanger;
    }
  
    return dangerStatus;
  }, [stations, recentWaterLevels]);

    // Styling for flood-prone areas
    const floodStyle = (feature) => {
      const districtName = feature.properties.ADM2_EN;
      const isDistrictInDanger = districtDangerStatus[districtName];
    
      return {
        color: isDistrictInDanger ? "#FF0000" : "#00FF00", // Red if in danger, green otherwise
        weight: 2,
        opacity: 0.8,
        fillOpacity: 0.4,
      };
    };

    

  //...................................................

  // Function to handle events on each flood feature
  const onEachFloodFeature = (feature, layer) => {
    // Attach a popup to each feature
    if (feature.properties && feature.properties.ADM2_EN) {
      layer.bindPopup(
        `<div>
          <strong>District:</strong> ${feature.properties.ADM2_EN}<br/>
          <strong>Division:</strong> ${feature.properties.ADM1_EN}
        </div>`
      );
    }

    // Optional hover effects
    // layer.on({
    //   mouseover: (e) => {
    //     e.target.setStyle({
    //       weight: 3,
    //       color: "#FFFF00", // Highlight color
    //       fillOpacity: 0.7,
    //     });
    //   },
    //   mouseout: (e) => {
    //     e.target.setStyle({
    //       weight: 2,
    //       color: "#FFA500",
    //       fillOpacity: 0.4,
    //     });
    //   },
    // });
  };

  /////////////////////////////////////////////////

  // Handle search input and filter stations by name
  const handleSearch = (event) => {
    const searchValue = event.target.value;
    setSearchTerm(searchValue);
    const filtered = stations.filter((station) =>
      station.name.toLowerCase().includes(searchValue.toLowerCase())
    );
    setFilteredStations(filtered);
  };

  // Handle station selection
  const handleStationSelect = (station) => {
    setSelectedStation(station);
    setGeoData({ lat: parseFloat(station.lat), lng: parseFloat(station.long) });
    setSearchTerm(station.name); // Set the selected station name in the search box
    setShowDropdown(false); // Hide the dropdown after selection
  };

    // Add Tawk.to script and change widget position
    useEffect(() => {
      window.Tawk_API = window.Tawk_API || {};
      window.Tawk_LoadStart = new Date();
  
      const s1 = document.createElement("script");
      s1.async = true;
      s1.src = "https://embed.tawk.to/66ff799c37379df10df1958b/1i9av63aa";
      s1.charset = "UTF-8";
      s1.setAttribute("crossorigin", "*");
      document.body.appendChild(s1);
  
      // Inject custom CSS to change the widget position
      const style = document.createElement("style");
      style.innerHTML = `
        .tawk-min-container {
          left: 20px !important;
          right: auto !important;
        }
        .tawk-chat-container {
          left: 20px !important;
          right: auto !important;
        }
      `;
      document.head.appendChild(style);
    }) 



  return (
    <div className="flow-root">
<div style={{ position: "relative", height: "100vh", width: "100%" }}>
  <div style={{ position: "absolute", top: 10, right: 10, zIndex: 1000 }}>
  {/* Search Box positioned on the right upper side */}
  <div >
    {/* Search box */}
    <input
      type="text"
      value={searchTerm}
      onChange={handleSearch}
      onFocus={() => setShowDropdown(true)}
      onBlur={() => setTimeout(() => setShowDropdown(false), 200)} // Small delay to allow selection
      placeholder="Search station by name"
      className="p-3 border border-gray-300 rounded-md w-64 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    {/* Dropdown of filtered station names */}
    {showDropdown && (
      <ul
        className="border border-gray-300 rounded-md w-64 max-h-48 overflow-y-auto bg-white shadow-lg mt-1"
        style={{ position: "absolute", top: "40px", zIndex: 1000 }}
      >
        {filteredStations.map((station) => (
          <li
            key={station.id}
            onClick={() => handleStationSelect(station)}
            className="p-2 cursor-pointer hover:bg-blue-100 hover:text-blue-700 transition duration-150 ease-in-out"
          >
            {station.name}
          </li>
        ))}
      </ul>
    )}

</div>

    {/* Historical Peak Button and Sub-buttons (Flood and Population) */}
    <div className="flex gap-2 ">
    <div className="mt-20 bg-gray-100 bg-opacity-30 backdrop-blur-md rounded-lg p-4 shadow-lg float-left">
  {/* Population Button */}
  <button
    style={{
      display: "block",
      width: "100%",
      backgroundColor: "rgba(0, 123, 255, 0.8)", // Transparent blue background
      color: "#fff",
      border: "none",
      padding: "10px 20px",
      marginBottom: "10px",
      borderRadius: "8px",
      cursor: "pointer",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      transition: "background-color 0.2s",
    }}
    onClick={() => setShowPopulationButtons(!showPopulationButtons)}
    onMouseEnter={(e) => (e.target.style.backgroundColor = "rgba(0, 86, 179, 0.8)")}
    onMouseLeave={(e) => (e.target.style.backgroundColor = "rgba(0, 123, 255, 0.8)")}
  >
    Population
  </button>

  {/* Year Buttons for Population */}
  {showPopulationButtons && (
    <div style={{ marginTop: "10px" }}>
      {["2019", "2020", "2021"].map((year) => (
        <button
          key={year}
          style={{
            display: "block",
            width: "100%",
            backgroundColor: selectedYear1 === year ? "rgba(0, 86, 179, 0.9)" : "rgba(0, 123, 255, 0.8)", // Change color if selected
            color: "#fff",
            border: "none",
            padding: "10px",
            marginBottom: "10px",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
          onClick={() => handleYearButtonClick1(year)}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "rgba(0, 86, 179, 0.8)")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = selectedYear1 === year ? "rgba(0, 86, 179, 0.9)" : "rgba(0, 123, 255, 0.8)")}
        >
          {year}
        </button>
      ))}
    </div>
  )}
</div>

{/* Flood Button and Year Selection on Right Side */}
<div className="mt-20 bg-gray-100 bg-opacity-60 backdrop-blur-md rounded-lg p-4 shadow-lg float-right">
  <button
    style={{
      display: "block",
      width: "100%",
      backgroundColor: "rgba(0, 123, 255, 0.8)", // Transparent blue background
      color: "#fff",
      border: "none",
      padding: "10px 20px",
      marginBottom: "10px",
      borderRadius: "8px",
      cursor: "pointer",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      transition: "background-color 0.2s",
    }}
    onClick={() => setShowFloodButtons(!showFloodButtons)}
    onMouseEnter={(e) => (e.target.style.backgroundColor = "rgba(0, 86, 179, 0.8)")}
    onMouseLeave={(e) => (e.target.style.backgroundColor = "rgba(0, 123, 255, 0.8)")}
  >
    Flood
  </button>

  {/* Year Buttons for Flood */}
  {showFloodButtons && (
    <div style={{ marginTop: "10px" }}>
      {["2019", "2020", "2021"].map((year) => (
        <button
          key={year}
          style={{
            display: "block",
            width: "100%",
            backgroundColor: selectedYear === year ? "rgba(0, 86, 179, 0.9)" : "rgba(0, 123, 255, 0.8)", // Change color if selected
            color: "#fff",
            border: "none",
            padding: "10px",
            marginBottom: "10px",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
          onClick={() => handleYearButtonClick(year)}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "rgba(0, 86, 179, 0.8)")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = selectedYear === year ? "rgba(0, 86, 179, 0.9)" : "rgba(0, 123, 255, 0.8)")}
        >
          {year}
        </button>
      ))}
    </div>
  )}
</div>

    
    </div>





       {/*Button done */}

   
      



  </div>
  
            {/* Button to toggle flood-prone areas */}
            <button  className={styles.toggleButton}
        onClick={() => setShowFlood(!showFlood)}
      >
        {showFlood ? "Predict Flood Areas" : "Show Flood Areas"}
      </button>


      <MapContainer
        center={center}
        zoom={7}
        style={{ height: "100%", width: "100%" }}
      >
        <LayersControl position="topright">
          <BaseLayer checked name="Google Earth Engine">
            <TileLayer
              url="https://earthengine.googleapis.com/map/projects/ee-ramadhan/assets/PL_KLHK_Raster_v1/KLHK_PL_2021_raster_v1/{z}/{x}/{y}"
              attribution="&copy; Google Earth Engine"
            />
          </BaseLayer>
          <BaseLayer checked name="Satellite - Google">
            <TileLayer
              url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
              subdomains={["mt0", "mt1", "mt2", "mt3"]}
              attribution="&copy; Google"
            />
          </BaseLayer>
          <BaseLayer name="OpenStreetMap">
            <TileLayer
              attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </BaseLayer>

          {/* Overlay layers */}

          {/* **NEW:** Overlay for the GeoTIFF layer */}
          {geoRasterLayers.map((item) => (
  <Overlay key={item.year} checked name={`${item.year} Layer`}>
    <GeoTIFFLayer layer={item.layer} />
  </Overlay>
))}

          {/* Render borders if data is available */}
          {borders && (
            <Overlay checked name="Borders">
              <GeoJSON data={borders} style={borderStyle} />
            </Overlay>
          )}

          {/* Render rivers if data is available */}
          {rivers && (
            <Overlay checked name="Rivers">
              <GeoJSON data={rivers} style={riverStyle} />
            </Overlay>
          )}

          {/* Render flood-prone areas if showFlood is true */}
          {showFlood && floodData && (
            <Overlay checked name="Flood-Prone Areas">
              <GeoJSON
                data={floodData}
                style={floodStyle}
                onEachFeature={onEachFloodFeature}
              />
            </Overlay>
          )}
          {/* **NEW:** GeoTIFF overlay layer */}
          {geoRasterLayers.map((item) => (
  <Overlay key={item.year} checked name={`${item.year} Layer`}>
    <GeoTIFFLayer layer={item.layer} />
  </Overlay>
))}
        </LayersControl>

        {/* Fetch dataloops */}

        {/* Loop through the stations and create a Marker for each */}
        {stations.map((station) => {
          // Get the recent water level for the current station
          const recentWaterLevel =
            recentWaterLevels[station.id] &&
            Object.values(recentWaterLevels[station.id])[0];

          // Check if Recent Water Level is greater than Danger Level
          const isAboveDangerLevel =
            recentWaterLevel &&
            parseFloat(recentWaterLevel) > parseFloat(station.dangerlevel);

          // Set the icon based on the comparison
          const iconUrl = isAboveDangerLevel ? "/gps.png" : "/placeholder.png";

          const customIcon = new L.Icon({
            iconUrl, // Dynamically set the icon URL
            iconSize: [30, 30], // Size of the marker icon
            iconAnchor: [17, 55], // Anchor point for the marker
            popupAnchor: [1, -45], // Popup position relative to the marker
          });

          return (
            <Marker
              key={station.id}
              position={[parseFloat(station.lat), parseFloat(station.long)]}
              icon={customIcon}
            >
              <Popup>
                <div>
                  <p>
                    <strong>Station Name:</strong> {station.name}
                  </p>
                  <p>
                    <strong>River:</strong> {station.river}
                  </p>
                  <p>
                    <strong>Basin:</strong> {station.basin}
                  </p>
                  <p>
                    <strong>Danger Level:</strong> {station.dangerlevel}
                  </p>
                  <p>
                    <strong>Highest Water Level:</strong>{" "}
                    {station.riverhighestwaterlevel}
                  </p>
                  <p>
                    <strong>Division:</strong> {station.division}
                  </p>
                  <p>
                    <strong>District:</strong> {station.district}
                  </p>
                  <p>
                    <strong>Upazilla:</strong> {station.upazilla}
                  </p>
                  <p>
                    <strong>Recent Water Level:</strong>{" "}
                    {recentWaterLevel ? recentWaterLevel : "N/A"}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Change view when a station is selected */}
        {selectedStation && (
          <ChangeView
            coords={[
              parseFloat(selectedStation.lat),
              parseFloat(selectedStation.long),
            ]}
          />
        )}
      </MapContainer>
    </div>
    </div>
  );
}

// Component to handle GeoTIFF Layer integration into Leaflet Map
function GeoTIFFLayer({ layer }) {
  const map = useMap();

  useEffect(() => {
    if (layer) {
      layer.addTo(map); // Add the layer on top of the map
      console.log("GeoTIFF Layer added to map.");
    }

    return () => {
      if (layer) {
        map.removeLayer(layer); // Clean up when layer is removed
        console.log("GeoTIFF Layer removed from map.");
      }
    };
  }, [layer, map]);

  return null;
}