import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type !== 'create' || !data) {
      return Response.json({ success: true });
    }

    // Erstelle Benachrichtigung für Empfänger
    await base44.asServiceRole.entities.Notification.create({
      recipient_email: data.to_email,
      sender_email: data.from_email,
      sender_name: data.from_name,
      type: 'follow_request',
      message: `${data.from_name} hat dir eine Freundschaftsanfrage gesendet`,
      is_read: false
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error creating follow request notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});