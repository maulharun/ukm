import { NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("db-ukm");

    // Get all registrations, not just pending
    const registrations = await db.collection("registrations")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      registrations: registrations.map(reg => ({
        _id: reg._id.toString(),
        userId: reg.userId || '',
        nama: reg.nama || '',
        email: reg.email || '',
        nim: reg.nim || '',
        fakultas: reg.fakultas || '',
        prodi: reg.prodi || '',
        ukm: reg.ukm || '',
        alasan: reg.alasan || '',
        ktmFile: reg.ktmFile || '',
        sertifikatFile: reg.sertifikatFile || '',
        status: reg.status || 'pending',
        createdAt: reg.createdAt || new Date(),
        tanggalDiterima: reg.tanggalDiterima || null,
        updatedAt: reg.updatedAt || new Date(),
        updatedBy: reg.updatedBy || null,
        alasanPenolakan: reg.alasanPenolakan || ''
      }))
    });
  } catch (error) {
    console.error("GET Validasi error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data pendaftaran" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { registrationId, status, alasanPenolakan } = await request.json();

    if (!registrationId || !status) {
      return NextResponse.json({
        success: false,
        message: "Missing required fields"
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("db-ukm");
    const session = client.startSession();

    try {
      await session.withTransaction(async () => {
        // Get registration data first
        const registration = await db.collection("registrations").findOne(
          { _id: new ObjectId(registrationId) }
        );

        if (!registration) {
          throw new Error("Registration not found");
        }

        // Update registration status
        const updateResult = await db.collection("registrations").updateOne(
          { _id: new ObjectId(registrationId) },
          {
            $set: {
              status,
              alasanPenolakan: alasanPenolakan || '',
              tanggalDiterima: status === 'approved' ? new Date() : null,
              updatedAt: new Date()
            }
          },
          { session }
        );

        if (!updateResult.modifiedCount) {
          throw new Error("Failed to update registration status");
        }

        if (status === 'approved') {
          // Create user notification
          await db.collection("notif-user").insertOne({
            userId: registration.userId,
            title: `Pendaftaran UKM ${registration.ukm}`,
            message: `Selamat! Anda telah diterima di UKM ${registration.ukm}`,
            type: 'success',
            isRead: false,
            createdAt: new Date(),
            ukmName: registration.ukm,
            registrationId: registrationId
          }, { session });

          // Create UKM notification
          await db.collection("notif-ukm").insertOne({
            ukmName: registration.ukm,
            title: 'Anggota Baru',
            message: `${registration.nama} telah bergabung dengan UKM ${registration.ukm}`,
            type: 'info',
            isRead: false,
            createdAt: new Date(),
            ukm: registration.ukm, // Add ukm field
            memberData: {
              userId: registration.userId,
              name: registration.nama,
              nim: registration.nim,
              prodi: registration.prodi,
              fakultas: registration.fakultas,
              ukm: registration.ukm
            }
          }, { session });

          // Update UKM members
          const ukmUpdate = await db.collection("ukm").updateOne(
            { name: registration.ukm },
            {
              $push: {
                members: {
                  userId: registration.userId,
                  nim: registration.nim,
                  name: registration.nama,
                  prodi: registration.prodi,
                  fakultas: registration.fakultas,
                  tanggalDiterima: new Date()
                }
              }
            },
            { session }
          );

          if (!ukmUpdate.modifiedCount) {
            throw new Error("Failed to update UKM members");
          }

          // Update user's UKM list
          const userUpdate = await db.collection("users").updateOne(
            { _id: new ObjectId(registration.userId) },
            {
              $push: {
                ukm: {
                  name: registration.ukm,
                  joinDate: new Date()
                }
              }
            },
            { session }
          );

          if (!userUpdate.modifiedCount) {
            throw new Error("Failed to update user's UKM list");
          }
        } else {
          // Create rejection notification
          await db.collection("notif-user").insertOne({
            userId: registration.userId,
            title: `Pendaftaran UKM ${registration.ukm}`,
            message: `Maaf, pendaftaran Anda di UKM ${registration.ukm} ditolak. ${alasanPenolakan}`,
            type: 'warning',
            isRead: false,
            createdAt: new Date(),
            ukmName: registration.ukm,
            registrationId: registrationId,
            alasanPenolakan
          }, { session });
        }
      });

      return NextResponse.json({
        success: true,
        message: `Registration ${status} successfully`
      });

    } catch (error) {
      throw error;
    } finally {
      await session.endSession();
    }

  } catch (error) {
    console.error("PUT Validasi error:", error);
    return NextResponse.json({
      success: false,
      message: error.message || "Failed to update registration status"
    }, { status: 500 });
  }
}