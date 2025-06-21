import { NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    // Cek pakai nama database yang BENAR dari Compass
    const db = client.db("db-ukm"); // <-- pastikan ini sama!
    const users = await db.collection("users").find({}).toArray();
    // Log seluruh users
    console.log("USERS:", users);

    const total = await db.collection("users").countDocuments({ role: "mahasiswa" });

    return NextResponse.json({ total, debug: users });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch mahasiswa users", detail: error?.message },
      { status: 500 }
    );
  }
}