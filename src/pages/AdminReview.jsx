import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

// AdminReview is kept only as a redirect for older links.
// The active admin workflow lives entirely in AdminDashboard.
export default function AdminReview() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(createPageUrl("AdminDashboard"), { replace: true });
  }, [navigate]);
  return null;
}
