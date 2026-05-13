import { supabase } from "@/lib/supabaseClient";

export async function sendSupportMessage({
  subject,
  message,
  email,
  category = "feedback",
  pageUrl,
  userAgent,
}) {
  const { data, error } = await supabase.functions.invoke("send-support-email", {
    body: {
      subject,
      message,
      email,
      category,
      pageUrl,
      userAgent,
    },
  });

  if (error) {
    throw error;
  }

  if (data?.error) {
    const typedError = new Error(data.error);
    typedError.code = data.error;
    throw typedError;
  }

  return data;
}
