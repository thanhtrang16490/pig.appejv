import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
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
      .insert({
        name: name.trim(),
        group_name: group_name?.trim() || null,
        location: location?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating farm:", error);
      return NextResponse.json(
        { error: "Không thể tạo trại" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/farms:", error);
    return NextResponse.json(
      { error: "Có lỗi xảy ra" },
      { status: 500 }
    );
  }
}
