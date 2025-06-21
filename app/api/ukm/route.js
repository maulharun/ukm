import { NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";
import { ObjectId } from "mongodb";

// GET - Mengambil semua data UKM
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("db-ukm");

    const ukms = await db.collection("ukm")
      .find({})
      .sort({ name: 1 })
      .toArray();

    // Update response structure to match frontend expectations
    return NextResponse.json({
      success: true,
      ukm: ukms.map(ukm => ({
        _id: ukm._id.toString(),
        name: ukm.name,
        category: ukm.category,
        description: ukm.description,
        members: ukm.members || [],
      }))
    });
  } catch (error) {
    console.error("GET UKM error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data UKM" },
      { status: 500 }
    );
  }
}

// POST - Menambah UKM baru
export async function POST(request) {
  try {
    const client = await clientPromise;
    const db = client.db("db-ukm");
    const data = await request.json();

    // Validasi data
    if (!data.name || !data.category || !data.description) {
      return NextResponse.json(
        { success: false, message: "Semua field harus diisi" },
        { status: 400 }
      );
    }

    // Cek apakah UKM dengan nama yang sama sudah ada
    const existingUkm = await db.collection("ukm").findOne({ name: data.name });
    if (existingUkm) {
      return NextResponse.json(
        { success: false, message: "UKM dengan nama tersebut sudah ada" },
        { status: 400 }
      );
    }

    // Tambah data tambahan
    const newUkm = {
      ...data,
      members: [],
      createdAt: new Date(),
      createdBy: "maulharun", // Menggunakan current user dari parameter
      updatedAt: new Date(),
      updatedBy: "maulharun"
    };

    const result = await db.collection("ukm").insertOne(newUkm);

    return NextResponse.json({
      success: true,
      message: "UKM berhasil ditambahkan",
      data: { _id: result.insertedId, ...newUkm }
    });
  } catch (error) {
    console.error("POST UKM error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menambahkan UKM" },
      { status: 500 }
    );
  }
}

// PUT - Update UKM berdasarkan ID
export async function PUT(request) {
  try {
    const client = await clientPromise;
    const db = client.db("db-ukm");
    const data = await request.json();
    const { _id, ...updateData } = data;

    // Validasi data
    if (!_id || !updateData.name || !updateData.category || !updateData.description) {
      return NextResponse.json(
        { success: false, message: "Semua field harus diisi" },
        { status: 400 }
      );
    }

    // Cek apakah UKM dengan nama yang sama sudah ada (kecuali UKM yang sedang diupdate)
    const existingUkm = await db.collection("ukm").findOne({
      name: updateData.name,
      _id: { $ne: new ObjectId(_id) }
    });

    if (existingUkm) {
      return NextResponse.json(
        { success: false, message: "UKM dengan nama tersebut sudah ada" },
        { status: 400 }
      );
    }

    // Update data
    const result = await db.collection("ukm").updateOne(
      { _id: new ObjectId(_id) },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
          updatedBy: "maulharun"
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: "UKM tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "UKM berhasil diupdate"
    });
  } catch (error) {
    console.error("PUT UKM error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengupdate UKM" },
      { status: 500 }
    );
  }
}

// DELETE - Hapus UKM berdasarkan ID
export async function DELETE(request) {
  try {
    const client = await clientPromise;
    const db = client.db("db-ukm");
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID UKM tidak ditemukan" },
        { status: 400 }
      );
    }

    // Hapus UKM
    const result = await db.collection("ukm").deleteOne({
      _id: new ObjectId(id)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: "UKM tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "UKM berhasil dihapus"
    });
  } catch (error) {
    console.error("DELETE UKM error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus UKM" },
      { status: 500 }
    );
  }
}