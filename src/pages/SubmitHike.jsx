import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function SubmitHike() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(createPageUrl("AddJournalEntry"), { replace: true });
  }, [navigate]);
  return null;
}
