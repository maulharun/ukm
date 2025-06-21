import { NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("db-ukm"); // Pastikan nama DB sesuai

    // Hitung jumlah untuk masing-masing status
    const pending = await db.collection("registrations").countDocuments({ status: "pending" });
    const approved = await db.collection("registrations").countDocuments({ status: "approved" });
    const rejected = await db.collection("registrations").countDocuments({ status: "rejected" });

    // Total pendaftar (semua status)
    const total = await db.collection("registrations").countDocuments();

    return NextResponse.json({
      total,
      pending,
      approved,
      rejected,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch registrations status", detail: error?.message },
      { status: 500 }
    );
  }
}