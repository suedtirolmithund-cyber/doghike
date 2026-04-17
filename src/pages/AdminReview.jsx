import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

// AdminReview used the old base44 Hike entity system.
// The new admin workflow (journal entry review + comment moderation)
// lives entirely in AdminDashboard which uses Supabase.
export default function AdminReview() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(createPageUrl("AdminDashboard"), { replace: true });
  }, [navigate]);
  return null;
}
