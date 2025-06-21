import path from 'path';
import fs from 'fs/promises';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || file.size === 0) {
      return NextResponse.json(
        { message: 'File tidak ditemukan atau kosong' },
        { status: 400 }
      );
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { message: 'Format file harus JPG atau PNG' },
        { status: 400 }
      );
    }

    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(process.cwd(), 'public/uploads', fileName);

    // Pastikan folder 'public/uploads' ada
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Simpan file ke folder 'public/uploads'
    await fs.writeFile(filePath, Buffer.from(await file.arrayBuffer()));

    return NextResponse.json({
      message: 'File berhasil diunggah',
      url: `/uploads/${fileName}`
    });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json(
      { message: 'Gagal mengunggah file', error: error.message },
      { status: 500 }
    );
  }
}