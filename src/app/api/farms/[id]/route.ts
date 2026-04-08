import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, group_name, location } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Tên trại là bắt buộc" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("farms")
      .update({
        name: name.trim(),
        group_name: group_name?.trim() || null,
        location: location?.trim() || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating farm:", error);
      return NextResponse.json(
        { error: "Không thể cập nhật trại" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in PUT /api/farms/[id]:", error);
    return NextResponse.json(
      { error: "Có lỗi xảy ra" },
      { status: 500 }
    );
  }
}
