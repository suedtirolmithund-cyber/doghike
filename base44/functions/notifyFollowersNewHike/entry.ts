import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data } = await req.json();

    // Only trigger when a hike becomes "approved" (status changed to approved)
    if (event.type !== 'update' || !data) {
      return Response.json({ success: true });
    }

    const isNowApproved = data.status === 'approved';
    const wasNotApproved = !old_data || old_data.status !== 'approved';

    if (!isNowApproved || !wasNotApproved) {
      return Response.json({ success: true });
    }

    const hikeCreatorEmail = data.created_by;
    if (!hikeCreatorEmail) {
      return Response.json({ success: true });
    }

    // Find all users who follow the hike creator
    const followers = await base44.asServiceRole.entities.UserFollow.filter({
      following_email: hikeCreatorEmail
    });

    if (!followers || followers.length === 0) {
      return Response.json({ success: true });
    }

    // Get creator info
    const allUsers = await base44.asServiceRole.entities.User.list();
    const creator = allUsers.find(u => u.email === hikeCreatorEmail);
    const creatorName = creator?.full_name || data.submitted_by_name || hikeCreatorEmail;

    // Send notification to each follower
    const notifications = followers.map(follow => ({
      recipient_email: follow.follower_email,
      sender_email: hikeCreatorEmail,
      sender_name: creatorName,
      type: 'hike_comment', // reusing existing type
      related_id: event.entity_id,
      related_title: data.trail_name,
      message: `${creatorName} hat eine neue Tour veröffentlicht: "${data.trail_name}"`,
      is_read: false
    }));

    for (const notification of notifications) {
      await base44.asServiceRole.entities.Notification.create(notification);
    }

    return Response.json({ success: true, notified: notifications.length });
  } catch (error) {
    console.error('Error notifying followers:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});