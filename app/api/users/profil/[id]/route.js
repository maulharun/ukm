import clientPromise from '@/app/lib/mongodb';
import { ObjectId } from 'mongodb';
import path from 'path';
import fs from 'fs/promises';
import { NextResponse } from 'next/server';

// GET: Mengambil data user berdasarkan ID
export async function GET(request, context) {
  try {
    const params = await context.params; // Pastikan params diakses dengan benar
    if (!params || !params.id) {
      return NextResponse.json(
        { message: 'Parameter ID tidak ditemukan' },
        { status: 400 }
      );
    }

    const { id } = params; // Ambil id dari params
    const client = await clientPromise;
    const db = client.db('db-ukm');

    const user = await db.collection('users').findOne(
      { _id: new ObjectId(id) },
      { projection: { password: 0 } } // Exclude password
    );

    if (!user) {
      return NextResponse.json(
        { message: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('GET User Error:', error);
    return NextResponse.json(
      { message: 'Gagal mengambil data user', error: error.message },
      { status: 500 }
    );
  }
}

// PUT: Memperbarui data user berdasarkan ID
export async function PUT(request, context) {
    try {
      const params = await context.params;
      if (!params || !params.id) {
        return NextResponse.json(
          { message: 'Parameter ID tidak ditemukan' },
          { status: 400 }
        );
      }
  
      const { id } = params;
      const formData = await request.formData();
      const client = await clientPromise;
      const db = client.db("db-ukm");

      const existingUser = await db.collection('users').findOne(
        { _id: new ObjectId(id) }
      );
  
      if (!existingUser) {
        return NextResponse.json(
          { message: 'User tidak ditemukan' },
          { status: 404 }
        );
      }
    // Extract data from formData
   const name = formData.get('name');
    const email = formData.get('email');
    const nim = formData.get('nim');
    const fakultas = formData.get('fakultas');
    const prodi = formData.get('prodi');
    const file = formData.get('file');

    // Parse UKM data to correct format
    const ukmString = formData.get('ukm');
    const ukm = ukmString 
      ? JSON.parse(ukmString).map(item => ({
          name: typeof item === 'string' ? item : item.name
        }))
      : existingUser.ukm || [];

    // Create update object
    const updateData = {
        name: name || existingUser.name,
        email: email || existingUser.email,
        nim: nim || existingUser.nim,
        fakultas: fakultas || existingUser.fakultas,
        prodi: prodi || existingUser.prodi,
        role: existingUser.role || 'mahasiswa', // Keep existing role or set default
        ukm,
        updatedAt: new Date()
      };

    if (file && file.size > 0) {
      // Sanitize file name
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${id}-${Date.now()}-${sanitizedFileName}`;

      // Create proper upload path for Windows
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      await fs.mkdir(uploadDir, { recursive: true });

      const filePath = path.join(uploadDir, fileName);

      // Save file
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await fs.writeFile(filePath, buffer);

      // Update database with correct URL path format
      updateData.photoUrl = `/uploads/${fileName}`;
    }

    const result = await db.collection('users').updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    return NextResponse.json({
      success: true,
      message: 'Profil berhasil diubah',
      photoUrl: updateData.photoUrl || null
    }, { status: 200 });

 } catch (error) {
    console.error('Update User Error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memperbarui profil', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    // Properly await and destructure params
    const { id } = await Promise.resolve(params);
    
    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'Parameter ID tidak ditemukan'
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('db-ukm');

    // Add timeout before deletion
    await new Promise(resolve => setTimeout(resolve, 2000));

    const result = await db.collection('users').deleteOne({
      _id: new ObjectId(id)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({
        success: false,
        message: 'User tidak ditemukan'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'User berhasil dihapus'
    }, { status: 200 });

  } catch (error) {
    console.error('Delete User Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Gagal menghapus user',
      error: error.message
    }, { status: 500 });
  }
}