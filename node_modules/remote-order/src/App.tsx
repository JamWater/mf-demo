// remote-order/src/App.tsx（整个替换）
import React from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { createOrderRoutes } from "./routes";

export default function App() {
  const router = createBrowserRouter([
    { path: "/", children: createOrderRoutes() },
  ]);
  return <RouterProvider router={router} />;
}
