import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type !== 'create' || !data) {
      return Response.json({ success: true });
    }

    // Hole den Namen des Followers
    const users = await base44.asServiceRole.entities.User.filter({ email: data.following_email });
    const followingName = users.length > 0 ? users[0].full_name : data.following_email;

    // Benachrichtige den User der gefolgt wird, dass jemand ihm folgt
    await base44.asServiceRole.entities.Notification.create({
      recipient_email: data.following_email,
      sender_email: data.follower_email,
      sender_name: followingName,
      type: 'follow_accepted',
      message: `${followingName} folgt dir jetzt!`,
      is_read: false
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error creating follow accepted notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});