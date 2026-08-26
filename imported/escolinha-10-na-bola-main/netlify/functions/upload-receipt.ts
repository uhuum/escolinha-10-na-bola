import { createClient } from "@supabase/supabase-js"

// Netlify serverless function for receipt upload
export default async (req: any) => {
  if (req.method !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    }
  }

  try {
    const supabase = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "")

    // Parse form data (file upload)
    const { file, studentId, currentUserId } = JSON.parse(req.body)

    if (!file || !studentId || !currentUserId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields" }),
      }
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(file.split(",")[1], "base64")
    const fileName = `${studentId}-${Date.now()}.pdf`

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(`${studentId}/${fileName}`, buffer, {
        contentType: "application/pdf",
        upsert: false,
      })

    if (uploadError) {
      console.error("[v0] Upload error:", uploadError)
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Upload failed" }),
      }
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("receipts").getPublicUrl(data.path)

    // Save receipt metadata to database
    const { data: receipt, error: dbError } = await supabase
      .from("receipts")
      .insert({
        student_id: studentId,
        uploaded_by: currentUserId,
        file_path: data.path,
        file_url: publicUrl,
        file_name: fileName,
        uploaded_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (dbError) {
      console.error("[v0] Database error:", dbError)
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to save receipt metadata" }),
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        receipt: receipt,
      }),
    }
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    }
  }
}
