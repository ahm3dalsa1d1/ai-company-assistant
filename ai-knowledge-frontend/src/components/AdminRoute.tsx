import  type { ReactNode } from "react";
import {
  Navigate
} from "react-router-dom";

import {
  useAuth
} from "../context/AuthContext";


export default function AdminRoute({
  children,
}: {
  children: ReactNode;
}) {

  const {
    user,
    loading,
  } = useAuth();


  if (loading) {
    return <p>Loading...</p>;
  }


  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  if (user.access_level < 2) {
    return (
      <Navigate
        to="/chat"
        replace
      />
    );
  }


  return children;
}