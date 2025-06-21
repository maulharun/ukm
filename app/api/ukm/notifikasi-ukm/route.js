import { NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;
    const ukm = searchParams.get('ukm');

    const client = await clientPromise;
    const db = client.db('db-ukm');

    // Filter untuk UKM spesifik
    const filter = ukm ? { 'memberData.ukm': ukm } : {};

    const total = await db.collection('notif-ukm').countDocuments(filter);
    const notifications = await db
      .collection('notif-ukm')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const unreadCount = await db
      .collection('notif-ukm')
      .countDocuments({ ...filter, isRead: false });

    return NextResponse.json({
      success: true,
      notifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      unreadCount,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { notificationId } = await request.json();
    
    // Validate notificationId
    if (!notificationId) {
      return NextResponse.json(
        { success: false, message: 'Notification ID is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('db-ukm');

    // Convert string ID to ObjectId
    const _id = new ObjectId(notificationId);

    const result = await db.collection('notif-ukm').updateOne(
      { _id },
      { $set: { isRead: true } }
    );

    if (result.matchedCount === 0) {
      console.error(`Notification not found: ${notificationId}`);
      return NextResponse.json(
        { success: false, message: 'Notification not found' },
        { status: 404 }
      );
    }

    if (result.modifiedCount === 0) {
      console.warn(`Notification already marked as read: ${notificationId}`);
      return NextResponse.json({ 
        success: true, 
        message: 'Notification already marked as read' 
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Notification marked as read successfully' 
    });

  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}