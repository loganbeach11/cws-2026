// src/pages/Admin2026Page.jsx
import React from "react";
import { Tournament2026Provider } from "../context/Tournament2026Context";
import Admin2026Panel from "../components/Admin2026Panel";

export default function Admin2026Page() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "navy" }}>
      <div className="header">
        <h1 className="header-title">🛠️ Admin Panel — 2026</h1>
      </div>
      <div style={{ flex: 1 }}>
        <Tournament2026Provider>
          <div className="container mx-auto p-4">
            <Admin2026Panel />
          </div>
        </Tournament2026Provider>
      </div>
    </div>
  );
}
