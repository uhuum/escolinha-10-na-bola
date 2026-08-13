import { createClient } from "@supabase/supabase-js"
import { studentsData } from "@/lib/data/students"

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function seedDatabase() {
  try {
    console.log("[v0] Starting data migration to Supabase...")

    for (const student of studentsData) {
      const { data: insertedStudent, error: studentError } = await supabase
        .from("students")
        .insert({
          id: student.id,
          name: student.name,
          rg: student.rg || null,
          birth_date: student.birthDate || null,
          responsible: student.responsible,
          responsible_cpf: student.responsibleCpf || null,
          responsible_email: student.responsibleEmail || null,
          father_phone: student.fatherPhone || null,
          mother_phone: student.motherPhone || null,
          monthly_value: student.monthlyValue,
          is_active: student.isActive,
          class_schedule: student.classSchedule || null,
          class_days: student.classDays || [],
          photo: student.photo || null,
        })
        .select()

      if (studentError) {
        console.error(`[v0] Error inserting student ${student.id}:`, studentError.message)
        continue
      }

      console.log(`[v0] Inserted student: ${student.name}`)

      for (const payment of student.payments) {
        const { error: paymentError } = await supabase.from("payments").insert({
          student_id: student.id,
          month: payment.month,
          status: payment.status,
          value: payment.value,
          receipt: payment.receipt ? String(payment.receipt) : null,
          paid_at: payment.paidAt || null,
        })

        if (paymentError && !paymentError.message.includes("duplicate")) {
          console.error(`[v0] Error inserting payment for ${student.id} - ${payment.month}:`, paymentError.message)
        }
      }
    }

    console.log("[v0] ✅ Data migration completed successfully!")
  } catch (error) {
    console.error("[v0] ❌ Migration failed:", error)
    process.exit(1)
  }
}

seedDatabase()
