import { forwardRef } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Web3Provider } from "@/components/Web3Provider";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index.tsx";
import About from "./pages/About.tsx";
import Submit from "./pages/Submit.tsx";
import Insights from "./pages/Insights.tsx";
import MerchantDetail from "./pages/MerchantDetail.tsx";
import EditListing from "./pages/EditListing.tsx";
import MapView from "./pages/MapView.tsx";
import NotFound from "./pages/NotFound.tsx";

const App = forwardRef<HTMLDivElement>((_, _ref) => (
  <HelmetProvider>
    <ThemeProvider>
    <Web3Provider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/submit" element={<Submit />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/merchant/:id" element={<MerchantDetail />} />
            <Route path="/edit/:id" element={<EditListing />} />
            <Route path="/map" element={<MapView />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </Web3Provider>
  </HelmetProvider>
));

App.displayName = "App";

export default App;
