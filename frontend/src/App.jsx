import { Navigate, Route, Routes } from "react-router";
import HomePage from "./pages/home-page";
import ProblemsPage from "./pages/problem-page";
import { useUser } from "@clerk/clerk-react";
import { Toaster } from "react-hot-toast";
import DashboardPage from "./pages/dashboard-page";
import ProblemsDetailsPage from "./pages/problem-page-details";

const App = () => {
  const { isSignedIn, isLoaded } = useUser();
  if(!isLoaded) return null;
  return (
    <>
      <Routes>
        <Route
          path="/"
          element={!isSignedIn ? <HomePage /> : <Navigate to={"/dashboard"} />}
        />
        <Route
          path="/dashboard"
          element={isSignedIn ? <DashboardPage /> : <Navigate to={"/"} />}
        />
        <Route
          path="/problems"
          element={isSignedIn ? <ProblemsPage /> : <Navigate to={"/"} />}
        />
        <Route
          path="/problem/:id"
          element={isSignedIn ? <ProblemsDetailsPage /> : <Navigate to={"/"} />}
        />
      </Routes>
      <Toaster toastOptions={{ duration: 2000 }} />
    </>
  );
};

export default App;
