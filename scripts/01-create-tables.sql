-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  rg TEXT,
  birth_date TEXT,
  responsible TEXT,
  responsible_cpf TEXT,
  responsible_email TEXT,
  father_phone TEXT,
  mother_phone TEXT,
  monthly_value INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  class_schedule TEXT,
  class_days TEXT[],
  photo TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  status TEXT NOT NULL,
  value INTEGER,
  postponed_to TEXT,
  receipt TEXT,
  paid_at TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, month)
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  day_of_week TEXT,
  class_schedule TEXT NOT NULL,
  class_days TEXT[],
  trainer_name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create attendance_records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id TEXT PRIMARY KEY,
  attendance_id TEXT NOT NULL REFERENCES attendance(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'Ausente',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_month ON payments(month);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_attendance_id ON attendance_records(attendance_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_id ON attendance_records(student_id);
