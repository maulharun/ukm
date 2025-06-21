import { NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import clientPromise from '@/app/lib/mongodb';
import { ObjectId } from 'mongodb';

// Handle GET request
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const ukm = searchParams.get('ukm');

        if (!ukm) {
            return NextResponse.json({
                success: false,
                message: 'UKM parameter is required'
            }, { status: 400 });
        }
        const client = await clientPromise;
        const db = client.db("db-ukm");
        const activities = await db.collection("kegiatan")
        .find({ ukm })
        .sort({ date: -1 })
        .toArray();

        return NextResponse.json({
            success: true,
            activities
        });

    } catch (error) {
        console.error('GET error:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch activities'
        }, { status: 500 });
    }
}

// Handle POST request
export async function POST(request) {
    try {
        const formData = await request.formData();
        const title = formData.get('title');
        const description = formData.get('description');
        const date = formData.get('date');
        const location = formData.get('location');
        const status = formData.get('status');
        const ukm = formData.get('ukm');
        const banner = formData.get('banner');

        if (!title || !description || !date || !location || !ukm) {
            return NextResponse.json({
                success: false,
                message: 'Missing required fields'
            }, { status: 400 });
        }

        let bannerUrl = null;
        if (banner) {
            // Create uploads directory
            const uploadDir = join(process.cwd(), 'public', 'uploads', 'kegiatan');
            await mkdir(uploadDir, { recursive: true });

            const bytes = await banner.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Generate unique filename
            const uniqueName = `${Date.now()}-${banner.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
            const filePath = join(uploadDir, uniqueName);

            // Save file
            await writeFile(filePath, buffer);
            bannerUrl = `/uploads/kegiatan/${uniqueName}`;
        }

        const client = await clientPromise;
        const db = client.db("db-ukm");

        const activity = {
            title,
            description,
            date: new Date(date),
            location,
            status,
            ukm,
            banner: bannerUrl,
            createdAt: new Date()
        };

        const result = await db.collection("kegiatan").insertOne(activity);

        return NextResponse.json({
            success: true,
            activity: { ...activity, _id: result.insertedId }
        });

    } catch (error) {
        console.error('POST error:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to create activity'
        }, { status: 500 });
    }
}

// Handle DELETE request
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id || !ObjectId.isValid(id)) {
            return NextResponse.json({
                success: false,
                message: 'Invalid activity ID'
            }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db("db-ukm");

        // Get activity first to delete banner
        const activity = await db.collection("kegiatan").findOne({
            _id: new ObjectId(id)
        });

        if (!activity) {
            return NextResponse.json({
                success: false,
                message: 'Activity not found'
            }, { status: 404 });
        }

        // Delete banner file if exists
        if (activity.banner) {
            const filePath = join(process.cwd(), 'public', activity.banner);
            await unlink(filePath).catch(console.error);
        }

        // Delete from database
        await db.collection("kegiatan").deleteOne({
            _id: new ObjectId(id)
        });

        return NextResponse.json({
            success: true,
            message: 'Activity deleted successfully'
        });

    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to delete activity'
        }, { status: 500 });
    }
}

// Handle PUT request
export async function PUT(request) {
    try {
        const formData = await request.formData();
        const id = formData.get('id');
        const title = formData.get('title');
        const description = formData.get('description');
        const date = formData.get('date');
        const location = formData.get('location');
        const status = formData.get('status');
        const banner = formData.get('banner');

        if (!id) {
            return NextResponse.json({
                success: false,
                message: 'Activity ID is required'
            }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db("db-ukm");

        const updateData = {
            title,
            description,
            date: new Date(date),
            location,
            status,
            updatedAt: new Date()
        };

        if (banner) {
            // Handle new banner upload
            const uploadDir = join(process.cwd(), 'public', 'uploads', 'kegiatan');
            await mkdir(uploadDir, { recursive: true });

            const bytes = await banner.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const uniqueName = `${Date.now()}-${banner.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
            const filePath = join(uploadDir, uniqueName);

            await writeFile(filePath, buffer);
            updateData.banner = `/uploads/kegiatan/${uniqueName}`;

            // Delete old banner if exists
            const oldActivity = await db.collection("kegiatan").findOne({
                _id: new ObjectId(id)
            });
            if (oldActivity?.banner) {
                const oldFilePath = join(process.cwd(), 'public', oldActivity.banner);
                await unlink(oldFilePath).catch(console.error);
            }
        }

        await db.collection("kegiatan").updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        return NextResponse.json({
            success: true,
            message: 'Activity updated successfully'
        });

    } catch (error) {
        console.error('PUT error:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to update activity'
        }, { status: 500 });
    }
}