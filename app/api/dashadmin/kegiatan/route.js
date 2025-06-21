import { NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("db-ukm");

    // Ambil semua kegiatan
    const kegiatan = await db.collection("kegiatan").find({}).toArray();

    // Hitung jumlah kegiatan per UKM
    const ukmCount = {};
    for (const k of kegiatan) {
      if (k.ukm) {
        ukmCount[k.ukm] = (ukmCount[k.ukm] || 0) + 1;
      }
    }

    // Urutkan UKM berdasarkan jumlah kegiatan (descending)
    const topUKM = Object.entries(ukmCount)
      .sort((a, b) => b[1] - a[1]) // urut dari terbanyak ke sedikit
      .slice(0, 3) // ambil 3 teratas
      .map(([ukm, totalKegiatan]) => ({
        ukm,
        totalKegiatan
      }));

    return NextResponse.json({
      topUKM, // array of { ukm, totalKegiatan }
      all: kegiatan
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch kegiatan", detail: error?.message },
      { status: 500 }
    );
  }
}