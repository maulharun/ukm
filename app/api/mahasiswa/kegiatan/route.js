import { NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("db-ukm"); // optionally: db("db-ukm") if your db name is not the default
    const collection = db.collection("kegiatan");

    // Fetch all upcoming events sorted by date ascending
    const events = await collection
      .find({ status: "upcoming" })
      .sort({ date: 1 })
      .toArray();

    // Convert _id to id for frontend convenience
    const formatted = events.map((event) => ({
      id: event._id.toString(),
      title: event.title,
      description: event.description,
      date: event.date,
      location: event.location,
      status: event.status,
      ukm: event.ukm,
      banner: event.banner,
      createdAt: event.createdAt,
    }));

    return NextResponse.json({ events: formatted });
  } catch (error) {
    return NextResponse.json(
      { events: [], error: error.message },
      { status: 500 }
    );
  }
}