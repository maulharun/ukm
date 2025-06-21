import { NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("db-ukm");

    const total = await db.collection("ukm").countDocuments();

    // --- Tambahan: Ambil semua UKM dan hitung total member pada masing-masing ---
    const ukmList = await db.collection("ukm").find({}).toArray();

    // Untuk setiap UKM, hitung jumlah member dari koleksi registrations (status: approved)
    const ukmWithMembers = await Promise.all(
      ukmList.map(async (ukm) => {
        const totalMembers = await db.collection("registrations").countDocuments({
          ukm: ukm.name || ukm.nama || ukm._id, // Cocokkan dengan field UKM yang benar di registrations!
          status: "approved"
        });
        return {
          ...ukm,
          totalMembers
        };
      })
    );

    return NextResponse.json({ total, list: ukmWithMembers });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch UKM total", detail: error?.message },
      { status: 500 }
    );
  }
}