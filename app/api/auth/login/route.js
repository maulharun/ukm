import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import clientPromise from '../../../lib/mongodb';

const SECRET = process.env.JWT_SECRET;

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    const client = await clientPromise;
    const db = client.db('db-ukm');
    const usersCol = db.collection('users');

    const user = await usersCol.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { message: 'Email atau password salah' },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json(
        { message: 'Email atau password salah' },
        { status: 401 }
      );
    }

    // Add UKM info to token if user is pengurus
    const tokenData = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      ukm: user.role === 'admin' ? undefined : (user.ukm || [])
    };

    const token = jwt.sign(tokenData, SECRET, { expiresIn: '7d' });

    const sanitizedUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      ukm: user.role === 'admin' ? undefined : (user.ukm || [])
    };

    // Set both cookies and return user data for localStorage
    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil',
      user: sanitizedUser // Tambahkan ini untuk localStorage
    });

    // Set cookies
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60
    });

    response.cookies.set('userData', JSON.stringify(sanitizedUser), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Login gagal' },
      { status: 500 }
    );
  }
}