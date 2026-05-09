-- ASES — Academic Submission & Evaluation System

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums (safe re-run via DO blocks)
--Try to create ENUM type. If it already exists, ignore the error. (DO $$ BEGIN --sql logic END $$)

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE enrollment_status AS ENUM ('active', 'withdrawn', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE submission_status AS ENUM ('submitted', 'evaluated', 'returned');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  password_hash TEXT         NOT NULL,
  role          user_role    NOT NULL DEFAULT 'student',
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- Courses
CREATE TABLE IF NOT EXISTS courses (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  code          VARCHAR(20)  NOT NULL,
  name          VARCHAR(150) NOT NULL,
  semester      VARCHAR(20)  NOT NULL,
  section       VARCHAR(10),
  instructor_id UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- Prevents duplicate course+semester+section, NULL-safe
CREATE UNIQUE INDEX IF NOT EXISTS idx_courses_unique_section
  ON courses (code, semester, COALESCE(section, ''));


-- Enrollments
CREATE TABLE IF NOT EXISTS enrollments (
  id          UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID              NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id   UUID              NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status      enrollment_status NOT NULL DEFAULT 'active',
  enrolled_at TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

  UNIQUE (student_id, course_id)
);


-- Assignments
CREATE TABLE IF NOT EXISTS assignments (
  id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id          UUID         NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_by         UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title              VARCHAR(200) NOT NULL,
  description        TEXT,
  max_marks          INT          NOT NULL CHECK (max_marks > 0),
  due_date           TIMESTAMPTZ  NOT NULL,
  allowed_file_types JSONB        NOT NULL DEFAULT '["pdf"]',                   --files types are stored as json 
  max_file_size_mb   INT          NOT NULL DEFAULT 10 CHECK (max_file_size_mb > 0),
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- Submissions
CREATE TABLE IF NOT EXISTS submissions (
  id            UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID              NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id    UUID              NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name     VARCHAR(255)      NOT NULL,
  file_path     TEXT              NOT NULL,
  file_size_kb  INT               NOT NULL CHECK (file_size_kb > 0),
  submitted_at  TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  is_late       BOOLEAN           NOT NULL DEFAULT FALSE,
  status        submission_status NOT NULL DEFAULT 'submitted',

  UNIQUE (assignment_id, student_id)
);


-- Evaluations
CREATE TABLE IF NOT EXISTS evaluations (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id    UUID        NOT NULL UNIQUE REFERENCES submissions(id) ON DELETE CASCADE,
  graded_by        UUID        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  marks_obtained   INT         NOT NULL CHECK (marks_obtained >= 0),
  letter_grade     CHAR(2),
  comment          TEXT,
  plagiarism_score INT         NOT NULL DEFAULT 0 CHECK (plagiarism_score BETWEEN 0 AND 100),
  graded_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- Indexes
CREATE INDEX IF NOT EXISTS idx_courses_instructor     ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student    ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course     ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course     ON assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student    ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_graded_by  ON evaluations(graded_by);