import { useEffect, useState } from "react";
import "./App.css";
import CryptoCard from "./components/CryptoCard.jsx";
import SearchBar from "./components/SearchBar.jsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";

function App() {
  return (

    <BrowserRouter>
      <Routes>
                <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
