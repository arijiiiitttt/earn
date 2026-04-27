import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import Foot from "./Foot";

export function Layout() {
  return (
    <div className="min-h-screen bg-bg grid-bg">
      <Navbar />
      <main className="pt-14 min-h-screen">
        <Outlet />
      </main>
      <Foot/>
    </div>
  );
}
