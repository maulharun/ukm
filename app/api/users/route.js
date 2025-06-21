import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/app/lib/mongodb';
import bcryptjs from 'bcryptjs';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('db-ukm');
    
    // Get all users and format UKM array properly
    const users = await db.collection('users')
      .find({})
      .project({ password: 0 })
      .toArray();

    // Format users data with proper UKM structure
    const formattedUsers = users.map(user => ({
      ...user,
      // Ensure UKM is array of objects with name property
      ukm: Array.isArray(user.ukm) ? 
      user.ukm.map(ukm => ({
        name: typeof ukm === 'object' ? ukm.name : ukm
      })) : []
    }));

    return NextResponse.json({
      success: true,
      users: formattedUsers
    });

  } catch (error) {
    console.error('Get Users Error:', error);
    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    
    // Extract form fields
    const email = formData.get('email');
    const password = formData.get('password');
    const name = formData.get('name');
    const role = formData.get('role');
    const nim = formData.get('nim');
    const fakultas = formData.get('fakultas');
    const prodi = formData.get('prodi');
    const file = formData.get('file');
    
    // Parse UKM data from string
    const ukmData = formData.get('ukm');
    const ukm = ukmData ? JSON.parse(ukmData) : [];

    if (!email || !password || !name || !role) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields'
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('db-ukm');

    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: 'Email already registered'
      }, { status: 400 });
    }

    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    const newUser = {
      email,
      password: hashedPassword,
      name,
      role,
      ukm,
      nim: nim || '',
      fakultas: fakultas || '',
      prodi: prodi || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (file) {
      newUser.file = file.name;
    }

    const result = await db.collection('users').insertOne(newUser);
    const userWithoutPassword = { ...newUser, password: undefined };

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: userWithoutPassword
    }, { status: 201 });

  } catch (error) {
    console.error('Create User Error:', error);
    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const formData = await request.formData();

    // Extract form fields
    const name = formData.get('name');
    const email = formData.get('email');
    const role = formData.get('role');
    const nim = formData.get('nim');
    const fakultas = formData.get('fakultas');
    const prodi = formData.get('prodi');
    const file = formData.get('file');
    
    // Parse UKM data from string
    const ukmData = formData.get('ukm');
    const ukm = ukmData ? JSON.parse(ukmData) : [];

    if (!name || !email || !role) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields'
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('db-ukm');

    const updateData = {
      name,
      email,
      role,
      ukm,
      nim: nim || '',
      fakultas: fakultas || '',
      prodi: prodi || '',
      updatedAt: new Date()
    };

    if (file && file.size > 0) {
      updateData.file = file.name;
    }

    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Profil berhasil diperbarui'
    });

  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}