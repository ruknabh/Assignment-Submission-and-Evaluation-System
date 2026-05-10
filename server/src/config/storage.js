import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(fileURLToPath(import.meta.url));

// Absolute path to uploads root
const UPLOADS_ROOT = path.join(__dirname, '../../uploads');

// Save a file buffer to disk
// Returns { fileName, filePath, fileSizeKb }
// filePath stored in DB is relative to uploads/ — portable across environments
export const saveFile = async ({ buffer, originalName, studentId, assignmentId, courseId }) => {
  // Build directory path organized by course then assignment
  const dir = path.join(UPLOADS_ROOT, 'submissions', courseId, assignmentId);

  // Create directory if it doesn't exist
  fs.mkdirSync(dir, { recursive: true });

  // Generate unique filename — prevents collisions and overwrites between students
  const ext      = path.extname(originalName).toLowerCase();
  const fileName = `${studentId}_${assignmentId}_${Date.now()}${ext}`;
  const absPath  = path.join(dir, fileName);

  // Write buffer to disk
  fs.writeFileSync(absPath, buffer);

  // Store relative path in DB — works regardless of where server is deployed
  const filePath   = path.join('submissions', courseId, assignmentId, fileName);
  const fileSizeKb = Math.ceil(buffer.length / 1024);

  return { fileName, filePath, fileSizeKb };
};

// Delete a file from disk — used when student re-submits
// filePath is the relative path stored in DB
export const deleteFile = (filePath) => {
  const absPath = path.join(UPLOADS_ROOT, filePath);
  if (fs.existsSync(absPath)) {
    fs.unlinkSync(absPath);
  }
  // Silently ignore if file not found — don't crash on missing files
};

// Resolve a relative filePath from DB to absolute path for res.sendFile
export const resolveFilePath = (filePath) => {
  return path.join(UPLOADS_ROOT, filePath);
};