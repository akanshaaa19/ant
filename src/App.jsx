import { Analytics } from "@vercel/analytics/react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Curate from "./pages/Curate.jsx";
import Home from "./pages/Home.jsx";
import SharedWalk from "./pages/SharedWalk.jsx";
import ThursdayWalk from "./pages/ThursdayWalk.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/thursday/:slug" element={<ThursdayWalk />} />
          <Route path="/curate" element={<Curate />} />
          <Route path="/walk/:id" element={<SharedWalk />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <Analytics />
    </BrowserRouter>
  );
}
