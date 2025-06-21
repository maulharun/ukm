import { NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const ukmList = searchParams.get('ukm')?.split(',') || [];

        if (!ukmList.length) {
            return NextResponse.json({
                success: false,
                message: 'UKM parameter is required'
            }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db("db-ukm");

        // Fetch activities for specified UKMs
        const activities = await db.collection("kegiatan")
            .find({ 
                ukm: { $in: ukmList }, // Match UKM name from users' ukm array
                status: { $in: ['upcoming', 'ongoing'] }
            })
            .sort({ date: 1 }) // Sort by date ascending
            .toArray();

        // Group activities by UKM name
        const groupedActivities = activities.reduce((acc, activity) => {
            const ukmName = activity.ukm;
            if (!acc[ukmName]) {
                acc[ukmName] = [];
            }
            acc[ukmName].push({
                _id: activity._id,
                title: activity.title,
                description: activity.description,
                date: activity.date,
                location: activity.location,
                status: activity.status,
                banner: activity.banner,
                ukm: activity.ukm
            });
            return acc;
        }, {});

        return NextResponse.json({
            success: true,
            schedule: groupedActivities
        });

    } catch (error) {
        console.error('GET error:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch schedule'
        }, { status: 500 });
    }
}