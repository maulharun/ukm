import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Berhasil logout'
    });

    // Clear auth cookies
    response.cookies.delete('token');
    response.cookies.delete('userData');

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Gagal logout' },
      { status: 500 }
    );
  }
}