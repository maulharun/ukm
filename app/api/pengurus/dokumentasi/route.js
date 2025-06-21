import { NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const ukm = searchParams.get('ukm');
    const search = searchParams.get('search');
    const fileType = searchParams.get('fileType');
    const tahun = searchParams.get('tahun');

    if (!ukm) {
      return NextResponse.json({ 
        success: false, 
        message: 'UKM parameter required' 
      });
    }

    const client = await clientPromise;
    const db = client.db("db-ukm");

    let query = { ukm };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (fileType) query.fileType = fileType;
    if (tahun) query.tahun = parseInt(tahun);

    const documents = await db.collection("dokumentasi")
      .find(query)
      .sort({ uploadedAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      documents: documents.map(doc => ({
        id: doc._id.toString(),
        title: doc.title,
        description: doc.description,
        fileUrl: doc.fileUrl,
        fileType: doc.fileType,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        uploadedBy: doc.uploadedBy,
        uploadedAt: doc.uploadedAt,
        kegiatan: doc.kegiatan,
        tahun: doc.tahun
      }))
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}


export async function POST(request) {
  try {
      const formData = await request.formData();
      const files = formData.getAll('files');
      const title = formData.get('title');
      const description = formData.get('description');
      const ukm = formData.get('ukm');
      const kegiatan = formData.get('kegiatan');
      const tahun = parseInt(formData.get('tahun'));
      const uploadedBy = formData.get('uploadedBy');

      if (!files.length || !title || !ukm) {
          return NextResponse.json({
              success: false,
              message: 'Missing required fields'
          }, { status: 400 });
      }

      // Create uploads directory
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'dokumentasi');
      await mkdir(uploadDir, { recursive: true });

      // Save files and prepare documents
      const fileDocuments = await Promise.all(files.map(async (file) => {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);

          // Generate unique filename
          const uniqueName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
          const filePath = join(uploadDir, uniqueName);

          // Save file
          await writeFile(filePath, buffer);

          return {
              ukm,
              title,
              description,
              kegiatan,
              tahun,
              fileName: uniqueName,
              fileSize: file.size,
              fileType: file.type.split('/')[0], // image, video, application
              fileUrl: `/uploads/dokumentasi/${uniqueName}`,
              uploadedBy,
              uploadedAt: new Date()
          };
      }));

      // Save to MongoDB
      const client = await clientPromise;
      const db = client.db("db-ukm");
      const result = await db.collection("dokumentasi").insertMany(fileDocuments);

      return NextResponse.json({
          success: true,
          message: 'Documents uploaded successfully',
          documentIds: result.insertedIds
      });

  } catch (error) {
      console.error('Upload error:', error);
      return NextResponse.json({
          success: false,
          message: 'Failed to upload documents'
      }, { status: 500 });
  }
}
  
export async function DELETE(request) {
  try {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get('id');

      if (!id || !ObjectId.isValid(id)) {
          return NextResponse.json({
              success: false,
              message: 'Invalid document ID'
          }, { status: 400 });
      }

      const client = await clientPromise;
      const db = client.db("db-ukm");

      // Get document
      const doc = await db.collection("dokumentasi").findOne({
          _id: new ObjectId(id)
      });

      if (!doc) {
          return NextResponse.json({
              success: false,
              message: 'Document not found'
          }, { status: 404 });
      }

      // Delete file
      if (doc.fileUrl) {
          const filePath = join(process.cwd(), 'public', doc.fileUrl);
          await unlink(filePath).catch(console.error);
      }

      // Delete from database
      await db.collection("dokumentasi").deleteOne({
          _id: new ObjectId(id)
      });

      return NextResponse.json({
          success: true,
          message: 'Document deleted successfully'
      });

  } catch (error) {
      console.error('Delete error:', error);
      return NextResponse.json({
          success: false,
          message: 'Failed to delete document'
      }, { status: 500 });
  }
}
  
  export async function PUT(request) {
    try {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get('id');
      const formData = await request.formData();
      
      const updateData = {
        title: formData.get('title'),
        description: formData.get('description'),
        kegiatan: formData.get('kegiatan'),
        tahun: parseInt(formData.get('tahun'))
      };
  
      // Remove undefined fields
      Object.keys(updateData).forEach(key => 
        updateData[key] === undefined && delete updateData[key]
      );
  
      if (!id || Object.keys(updateData).length === 0) {
        return NextResponse.json({
          success: false,
          message: 'Invalid update data'
        }, { status: 400 });
      }
  
      const client = await clientPromise;
      const db = client.db("db-ukm");
  
      const result = await db.collection("dokumentasi").updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );
  
      if (result.matchedCount === 0) {
        return NextResponse.json({
          success: false,
          message: 'Document not found'
        }, { status: 404 });
      }
  
      return NextResponse.json({
        success: true,
        message: 'Document updated successfully'
      });
  
    } catch (error) {
      console.error('Update error:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to update document'
      }, { status: 500 });
    }
  }