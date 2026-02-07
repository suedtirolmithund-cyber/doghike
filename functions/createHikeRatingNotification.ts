import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type !== 'create' || !data) {
      return Response.json({ success: true });
    }

    // Hole Hike-Infos
    const hike = await base44.asServiceRole.entities.Hike.get(data.hike_id);
    if (!hike || !hike.created_by) {
      return Response.json({ success: true });
    }

    // Keine Selbst-Benachrichtigung
    if (hike.created_by === data.user_email) {
      return Response.json({ success: true });
    }

    // Erstelle Benachrichtigung für Hike-Ersteller
    await base44.asServiceRole.entities.Notification.create({
      recipient_email: hike.created_by,
      sender_email: data.user_email,
      sender_name: data.user_email.split('@')[0],
      type: 'hike_rating',
      related_id: data.hike_id,
      related_title: hike.trail_name,
      message: `${data.user_email.split('@')[0]} hat deine Tour "${hike.trail_name}" mit ${data.rating} Sternen bewertet`,
      is_read: false
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error creating hike rating notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});