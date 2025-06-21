import { NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'User ID is required'
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("db-ukm");

    // Fetch user notifications
    const notifications = await db.collection("notif-user")
      .find({
        userId: userId
      })
      .sort({ createdAt: -1 }) // Newest first
      .toArray();

    // Format notifications
    const formattedNotifications = notifications.map(notif => ({
      _id: notif._id.toString(),
      userId: notif.userId,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      isRead: notif.isRead || false,
      createdAt: notif.createdAt,
      ukmName: notif.ukmName,
      registrationId: notif.registrationId,
      alasanPenolakan: notif.alasanPenolakan
    }));

    return NextResponse.json({
      success: true,
      notifications: formattedNotifications
    });

  } catch (error) {
    console.error("GET Notifications error:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch notifications"
    }, { status: 500 });
  }
}

// Add endpoint to mark notification as read
export async function PUT(request) {
  try {
    const { notificationId } = await request.json();

    if (!notificationId) {
      return NextResponse.json({
        success: false,
        message: "Notification ID is required"
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("db-ukm");

    const result = await db.collection("notif-user").updateOne(
      { _id: new ObjectId(notificationId) },
      { $set: { isRead: true } }
    );

    if (!result.modifiedCount) {
      throw new Error("Failed to update notification status");
    }

    return NextResponse.json({
      success: true,
      message: "Notification marked as read"
    });

  } catch (error) {
    console.error("PUT Notification error:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to update notification"
    }, { status: 500 });
  }
}