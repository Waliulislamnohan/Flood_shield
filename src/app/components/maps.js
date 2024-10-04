"use client";
import React, { useState, useEffect } from "react";
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

// Import required libraries for GeoTIFF handling
import georaster from "georaster";
import GeoRasterLayer from "georaster-layer-for-leaflet";

// Import axios for fetching binary data
import axios from "axios";

import styles from "./maps.module.css"; // Ensure this path is correct

const { BaseLayer, Overlay } = LayersControl;

// Component to change the map view dynamically
export function ChangeView({ coords }) {
  const map = useMap();
  map.setView(coords, 7);
  return null;
}

// Custom icon for station markers
const customIcon = new L.Icon({
  iconUrl: "/gps.png", // Ensure you have this icon in the public folder
  iconSize: [30, 30], // Size of the marker icon
  iconAnchor: [17, 55], // Anchor point for the marker
  popupAnchor: [1, -45], // Popup position relative to the marker
});

export default function MapCoordinates() {
  const [stations, setStations] = useState([]);
  const [geoData, setGeoData] = useState({
    lat: 23.685,
    lng: 90.3563,
  });
  const [borders, setBorders] = useState(null);
  const [rivers, setRivers] = useState(null);
  const [floodData, setFloodData] = useState(null);
  const [showFlood, setShowFlood] = useState(false); // State to control flood layer visibility
  const [geoRasterLayer, setGeoRasterLayer] = useState(null);

  const center = [geoData.lat, geoData.lng];

  // Utility function to check if cached data is valid
  const isCacheValid = (timestamp) => {
    const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
    return Date.now() - timestamp < CACHE_DURATION;
  };

  // Fetch the station data from the API with caching
  useEffect(() => {
    const fetchStations = async () => {
      const cacheKey = "stationsData";
      const cachedData = localStorage.getItem(cacheKey);

      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        if (isCacheValid(parsedData.timestamp)) {
          setStations(parsedData.data);
          return;
        }
      }

      try {
        const response = await fetch(
          "https://ffwc-api.bdservers.site/data_load/stations/",
          { mode: "cors" }
        );
        const data = await response.json();
        setStations(data);

        // Cache the data
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ data, timestamp: Date.now() })
        );
      } catch (error) {
        console.error("Error fetching station data:", error);
        if (cachedData) {
          setStations(JSON.parse(cachedData).data);
        }
      }
    };
    fetchStations();
  }, []);

  // Fetch the borders GeoJSON data with caching
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

  // Fetch the rivers GeoJSON data with caching
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

  // Fetch the flood-prone areas GeoJSON data with caching
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

  // Fetch and process the GeoTIFF data with caching
  useEffect(() => {
    const fetchGeoTIFF = async () => {
      const cacheKey = "geoTIFFData";
      const cachedData = localStorage.getItem(cacheKey);

      if (cachedData) {
        // Note: For binary data, localStorage is not ideal due to size limitations.
        // We'll proceed assuming the data is small enough.
        const parsedData = JSON.parse(cachedData);
        if (isCacheValid(parsedData.timestamp)) {
          const tiff = await georaster(parsedData.data);
          const layer = new GeoRasterLayer({
            georaster: tiff,
            opacity: 0.7,
            resolution: 256, // Adjust for performance vs. quality
            pixelValuesToColorFn: (values) => {
              if (values[0] === 1) {
                return "rgba(0, 0, 255, 0.5)"; // Blue color with transparency
              } else {
                return null; // No color for other values
              }
            },
          });
          setGeoRasterLayer(layer);
          return;
        }
      }

      try {
        const response = await axios.get(
          "https://ffwc.rimes.int/assets/geotiff/inundation/inundation_2019_4326.tif",
          {
            responseType: "arraybuffer", // Important for binary data
            withCredentials: false,
          }
        );

        const tiff = await georaster(response.data);
        const layer = new GeoRasterLayer({
          georaster: tiff,
          opacity: 0.7,
          resolution: 256, // Adjust for performance vs. quality
          pixelValuesToColorFn: (values) => {
            if (values[0] === 1) {
              return "rgba(0, 0, 255, 0.5)"; // Blue color with transparency
            } else {
              return null; // No color for other values
            }
          },
        });

        setGeoRasterLayer(layer);

        // Cache the data
        // Note: localStorage can only store strings, and there are limitations to the size.
        // For array buffers, you might need to convert to Base64.
        // Here, we proceed with caution.
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ data: response.data, timestamp: Date.now() })
        );
      } catch (error) {
        console.error("Error fetching GeoTIFF data:", error);

        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          const tiff = await georaster(parsedData.data);
          const layer = new GeoRasterLayer({
            georaster: tiff,
            opacity: 0.7,
            resolution: 256, // Adjust for performance vs. quality
            pixelValuesToColorFn: (values) => {
              if (values[0] === 1) {
                return "rgba(0, 0, 255, 0.5)"; // Blue color with transparency
              } else {
                return null; // No color for other values
              }
            },
          });
          setGeoRasterLayer(layer);
        }
      }
    };

    fetchGeoTIFF();
  }, []);

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
  const floodStyle = {
    color: "#FFA500", // Orange color for flood areas
    weight: 2,
    opacity: 0.8,
    fillOpacity: 0.4,
  };

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
    layer.on({
      mouseover: (e) => {
        e.target.setStyle({
          weight: 3,
          color: "#FFFF00", // Highlight color
          fillOpacity: 0.7,
        });
      },
      mouseout: (e) => {
        e.target.setStyle({
          weight: 2,
          color: "#FFA500",
          fillOpacity: 0.4,
        });
      },
    });
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

    return () => {
      document.body.removeChild(s1);
      document.head.removeChild(style);
    };
  }, []);
  return (
    <div style={{ position: "relative", height: "100vh", width: "100%" }}>
      {/* Button to toggle flood-prone areas */}
      <button
        className={styles.toggleButton}
        onClick={() => setShowFlood(!showFlood)}
      >
        {showFlood ? "Hide Flood Areas" : "Show Flood Areas"}
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
          <BaseLayer name="Satellite - Google">
            <TileLayer
              url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
              subdomains={["mt0", "mt1", "mt2", "mt3"]}
              attribution="&copy; Google"
            />
          </BaseLayer>
          <BaseLayer name="OpenStreetMap">
            <TileLayer
              attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </BaseLayer>

          {/* Overlay for the GeoTIFF layer */}
          {geoRasterLayer && (
            <Overlay checked name="Inundation Layer">
              {/* Use the GeoTIFF layer as an overlay */}
              <GeoTIFFLayer layer={geoRasterLayer} />
            </Overlay>
          )}

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
        </LayersControl>

        {/* Loop through the stations and create a Marker for each */}
        {stations.map((station) => (
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
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Change the view to the center coordinates */}
        <ChangeView coords={center} />
      </MapContainer>
    </div>
  );
}

// Component to render the GeoTIFF layer
function GeoTIFFLayer({ layer }) {
  const map = useMap();

  useEffect(() => {
    if (layer) {
      layer.addTo(map);
    }

    return () => {
      if (layer) {
        map.removeLayer(layer);
      }
    };
  }, [layer, map]);

  return null;
}
