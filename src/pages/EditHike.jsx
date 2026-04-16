import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function EditHike() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");
  const navigate = useNavigate();

  useEffect(() => {
    if (id?.startsWith("journal-")) {
      const journalId = id.replace(/^journal-/, "");
      navigate(createPageUrl("AddJournalEntry") + `?id=${journalId}`, { replace: true });
    } else {
      navigate(createPageUrl("Journal"), { replace: true });
    }
  }, [id, navigate]);

  return null;
}
