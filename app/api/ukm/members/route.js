import { NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const ukm = searchParams.get('ukm');
    const search = searchParams.get('search');
    const filterBy = searchParams.get('filterBy');
    const filterValue = searchParams.get('filterValue');

    if (!ukm) {
      return NextResponse.json({ 
        success: false, 
        message: 'UKM parameter is required' 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("db-ukm");

    const ukmData = await db.collection("ukm").findOne(
      { name: ukm },
      { projection: { members: 1 } }
    );

    if (!ukmData) {
      return NextResponse.json({
        success: false,
        message: 'UKM not found'
      }, { status: 404 });
    }

    // Get initial members list
    let members = ukmData.members || [];

    // Apply search filter if search query exists
    if (search) {
      const searchLower = search.toLowerCase();
      members = members.filter(member => 
        member.name.toLowerCase().includes(searchLower) ||
        member.nim.toLowerCase().includes(searchLower) ||
        member.prodi.toLowerCase().includes(searchLower) ||
        member.fakultas.toLowerCase().includes(searchLower)
      );
    }

    // Apply additional filters if they exist
    if (filterBy && filterValue) {
      members = members.filter(member => 
        member[filterBy].toLowerCase().includes(filterValue.toLowerCase())
      );
    }
    
    // Get unique values for filter options
    const filterOptions = {
      prodi: [...new Set(ukmData.members.map(m => m.prodi))],
      fakultas: [...new Set(ukmData.members.map(m => m.fakultas))]
    };

    return NextResponse.json({
      success: true,
      members: members.map(member => ({
        id: member.userId,
        name: member.name,
        nim: member.nim,
        prodi: member.prodi,
        fakultas: member.fakultas,
        tanggalDiterima: member.tanggalDiterima
      })),
      filters: filterOptions,
      total: members.length
    });

  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}