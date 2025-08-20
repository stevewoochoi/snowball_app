import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import "./axiosConfig";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// import { StrictMode } from 'react';
// import { createRoot } from 'react-dom/client';
// import { createBrowserRouter, RouterProvider } from "react-router-dom";
// import './index.css';
// import './axiosConfig';

// import App from './App.jsx';
// import AuthCallback from './pages/AuthCallback.jsx';

// const router = createBrowserRouter([
//   { path: "/", element: <App /> },
//   { path: "/auth/google/callback", element: <AuthCallback /> },
// ]);

// createRoot(document.getElementById('root')).render(
//   <StrictMode>
//     <RouterProvider router={router} />
//   </StrictMode>
// );