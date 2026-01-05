import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ScannerLogin from "./pages/scanner/ScannerLogin";
import ScannerInput from "./pages/scanner/ScannerInput";
import ScannerResults from "./pages/scanner/ScannerResults";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/scanner" element={<ScannerLogin />} />
        <Route path="/scanner/input" element={<ScannerInput />} />
        <Route path="/scanner/results/:scanId" element={<ScannerResults />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
