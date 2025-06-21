import clientPromise from '@/app/lib/mongodb';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const { name, email, password, role = 'mahasiswa' } = await req.json();

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Semua field harus diisi' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('db-ukm');

    // Check existing user
    const userExists = await db.collection('users').findOne({ email });
    if (userExists) {
      return NextResponse.json(
        { message: 'Email sudah terdaftar' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user object
    const newUser = {
      name,
      email,
      password: hashedPassword,
      role,
      ukm: null, // Will be updated when joining UKM
      nim: null, // Can be updated later
      fakultas: null, // Can be updated later
      prodi: null, // Can be updated later
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert user
    const result = await db.collection('users').insertOne(newUser);

    // Return success without password
    const { password: _, ...userWithoutPassword } = newUser;
    
    return NextResponse.json({
      message: 'Registrasi berhasil',
      user: userWithoutPassword
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}