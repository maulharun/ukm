
import { NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

async function saveFile(file, fileName) {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, buffer);
    return `/uploads/${fileName}`;
  } catch (error) {
    console.error('File save error:', error);
    throw new Error('Failed to save file');
  }
}

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

    const registrations = await db.collection("registrations")
      .find({ userId: userId })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      registrations: registrations.map(reg => ({
        _id: reg._id.toString(),
        ukmName: reg.ukmName,
        status: reg.status,
        createdAt: reg.createdAt,
        ktmFile: reg.ktmFile,
        sertifikatFile: reg.sertifikatFile,
        alasan: reg.alasan
      }))
    });

  } catch (error) {
    console.error('GET registrations error:', error);
    return NextResponse.json({
      success: false,
      message: 'Gagal mengambil data pendaftaran'
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    
    // Extract form data matching client structure
    const userId = formData.get('userId');
    const nama = formData.get('nama');
    const email = formData.get('email');
    const nim = formData.get('nim');
    const fakultas = formData.get('fakultas');
    const prodi = formData.get('prodi');
    const ukm = formData.get('ukmName');
    const alasan = formData.get('alasan');
    const ktmFile = formData.get('ktmFile');
    const sertifikatFile = formData.get('sertifikatFile');

    // Validate required fields
    if (!userId || !ukm || !ktmFile) {
      return NextResponse.json({
        success: false,
        message: 'Data pendaftaran tidak lengkap'
      }, { status: 400 });
    }

    // Handle file uploads with client naming pattern
    let ktmPath = '';
    let sertifikatPath = '';

    if (ktmFile && ktmFile.size > 0) {
      const ktmFileName = `${nim}-ktm-${Date.now()}${ktmFile.name.substring(ktmFile.name.lastIndexOf('.'))}`;
      ktmPath = await saveFile(ktmFile, `ktm/${ktmFileName}`);
    }

    if (sertifikatFile && sertifikatFile.size > 0) {
      const sertifikatFileName = `${nim}-sertifikat-${Date.now()}${sertifikatFile.name.substring(sertifikatFile.name.lastIndexOf('.'))}`;
      sertifikatPath = await saveFile(sertifikatFile, `sertifikat/${sertifikatFileName}`);
    }

    // Create registration document
    const registration = {
      userId,
      nama,
      email,
      nim,
      fakultas,
      prodi,
      ukm,
      alasan,
      ktmFile: ktmPath,
      sertifikatFile: sertifikatPath,
      status: 'pending',
      createdAt: new Date(),
      tanggalDiterima: null,
      updatedAt: new Date(),
      updatedBy: null
    };

    const client = await clientPromise;
    const db = client.db("db-ukm");
    const result = await db.collection("registrations").insertOne(registration);

    return NextResponse.json({
      success: true,
      message: 'Pendaftaran berhasil dikirim',
      registrationId: result.insertedId
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Gagal memproses pendaftaran'
    }, { status: 500 });
  }
}