import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { FloatingSupport } from "./FloatingSupport";
import { useAuth } from "../../context/AuthContext";

export const AppLayout: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F5F5F7] dark:bg-[#000000]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-900 dark:border-white border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-slate-500">StoreBox yuklanmoqda...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex bg-[#F5F5F7] dark:bg-[#000000] text-neutral-900 dark:text-neutral-100 transition-colors duration-300 p-3 sm:p-4 lg:p-5 gap-3 sm:gap-5">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 pt-4 pb-8 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
      <FloatingSupport />
    </div>
  );
};
