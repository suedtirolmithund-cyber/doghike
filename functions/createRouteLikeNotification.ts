import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type !== 'create' || !data) {
      return Response.json({ success: true });
    }

    // Hole Route-Infos
    const route = await base44.asServiceRole.entities.UserRoute.get(data.route_id);
    if (!route || !route.created_by) {
      return Response.json({ success: true });
    }

    // Keine Selbst-Benachrichtigung
    if (route.created_by === data.user_email) {
      return Response.json({ success: true });
    }

    // Hole User-Infos
    const users = await base44.asServiceRole.entities.User.filter({ email: data.user_email });
    const userName = users.length > 0 ? users[0].full_name : data.user_email;

    // Erstelle Benachrichtigung für Route-Ersteller
    await base44.asServiceRole.entities.Notification.create({
      recipient_email: route.created_by,
      sender_email: data.user_email,
      sender_name: userName,
      type: 'route_like',
      related_id: data.route_id,
      related_title: route.name,
      message: `${userName} hat deine Route "${route.name}" gespeichert`,
      is_read: false
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error creating route like notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});