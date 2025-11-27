import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/App.css";
import { AuthProvider } from './components/AuthContext';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
    <AuthProvider>
        <App />
    </AuthProvider>
);
