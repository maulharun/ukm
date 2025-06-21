import { NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";

// API: /api/mahasiswa/dokumentasi?ukm=UKM1&ukm=UKM2&...

export async function GET(req) {
  try {
    const client = await clientPromise;
    const db = client.db("db-ukm"); // ganti jika perlu: client.db("db-ukm")
    const collection = db.collection("dokumentasi");

    // Ambil semua ukm dari query string: /api/mahasiswa/dokumentasi?ukm=ukm1&ukm=ukm2
    const { searchParams } = new URL(req.url);
    const ukm = searchParams.getAll('ukm');

    if (!ukm || ukm.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Parameter ukm wajib diisi.",
        documents: []
      }, { status: 400 });
    }

    // Query: cari dokumen yang ukm-nya ada di array ukm
    const query = { ukm: { $in: ukm } };
    const docs = await collection.find(query).sort({ createdAt: -1 }).toArray();

    // Format hasil
    const documents = docs.map(doc => ({
      id: doc._id.toString(),
      title: doc.title,
      description: doc.description,
      fileUrl: doc.fileUrl, // pastikan field ini ada di db
      fileType: doc.fileType, // pastikan field ini ada di db
      type: doc.type,         // bisa digunakan untuk filter (image/video/pdf)
      ukm: doc.ukm,
      createdAt: doc.createdAt,
    }));

    return NextResponse.json({
      success: true,
      documents
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error.message,
      documents: []
    }, { status: 500 });
  }
}