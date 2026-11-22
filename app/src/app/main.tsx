import { createRoot } from "react-dom/client";
import { OngoingPage } from "../pages/ongoing/OngoingPage";
import "./style.css";

const root = document.getElementById("root");
if (root) createRoot(root).render(<OngoingPage />);
