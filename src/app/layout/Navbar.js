"use client";
import React, { useState } from "react";
import { FaUserCircle, FaCog, FaSignOutAlt, FaUserEdit } from "react-icons/fa";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const handleAccountClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = () => {
    // Logika ketika logout di klik
    console.log("Logout diklik");
    // Anda dapat menambahkan logika logout di sini (misalnya, menghapus token, membersihkan sesi, dll.)
  };
  return (
    <div className="flex  justify-between  ">
      <div className="flex-[22%] flex  bg-slate-800 text-white text-sm p-3 shadow-lg text-center">
      <div className="items-center self-center  ">
        Land Cover  <br /> Google Earth Engine
      </div>
      </div>
      <div className="flex-[78%] border-b justify-end text-end p-5 shadow-md ">
        <div className="absolute right-7 ">
          <div className="cursor-pointer flex" onClick={handleAccountClick}>
            <FaUserCircle size={24} />
            <div className="ml-2 text-sm mt-1">Sumaiya Islam</div>
          </div>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg">
              <button className=" px-2 py-1 flex text-gray-800 hover:bg-gray-200 w-full text-left text-sm">
                <FaUserEdit className="mr-2" /> My Account
              </button>
              <button className=" px-2 py-1 flex text-gray-800 hover:bg-gray-200 w-full text-left text-sm">
                <FaCog className="mr-2" /> Settings
              </button>
              <Link href="/">
              <button
                className="flex px-2 py-1 text-gray-800 hover:bg-gray-200 w-full text-left text-sm"
                onClick={handleLogout}
              >
                <FaSignOutAlt className="mr-2" /> Logout
              </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
