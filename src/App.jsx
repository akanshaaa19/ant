import { useEffect } from "react";
import { Analytics } from "@vercel/analytics/react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Curate from "./pages/Curate.jsx";
import Home from "./pages/Home.jsx";
import SharedWalk from "./pages/SharedWalk.jsx";
import ThursdayWalk from "./pages/ThursdayWalk.jsx";
import { clearRecoveryTried } from "./lib/recovery.js";

export default function App() {
  // Once the app has stayed up a few seconds, treat this session as healthy so
  // a future crash can auto-recover again. A route that crashes immediately on
  // reload does so before this fires, which keeps the recovery flag set and
  // prevents a reload loop.
  useEffect(() => {
    const t = setTimeout(clearRecoveryTried, 5000);
    return () => clearTimeout(t);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/art-night" element={<ThursdayWalk />} />
          <Route path="/curate" element={<Curate />} />
          <Route path="/walk/:id" element={<SharedWalk />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <Analytics />
    </BrowserRouter>
  );
}
