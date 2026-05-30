import fs   from 'fs';
import path from 'path';

// Tokenize text into a set of word n-grams for comparison
// Using bigrams (pairs of consecutive words) gives better accuracy than single words
const tokenize = (text) => {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')  // strip punctuation
    .split(/\s+/)
    .filter(Boolean);

  const bigrams = new Set();
  for (let i = 0; i < words.length - 1; i++) {
    bigrams.add(`${words[i]}_${words[i + 1]}`);
  }
  // Also include single words for short texts
  words.forEach((w) => bigrams.add(w));
  return bigrams;
};

// Jaccard similarity between two sets — returns 0 to 1
const jaccardSimilarity = (setA, setB) => {
  if (setA.size === 0 && setB.size === 0) return 0;
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union        = new Set([...setA, ...setB]);
  return intersection.size / union.size;
};

// Read text content from a file — only works for text-based file types
// Returns null for binary files (zip, images etc.)
const readTextFile = (filePath) => {
  const TEXT_EXTENSIONS = [
    'txt', 'py', 'java', 'js', 'ts', 'c', 'cpp', 'h',
    'cs', 'rb', 'go', 'rs', 'php', 'html', 'css', 'md',
    'json', 'xml', 'sql', 'sh', 'r', 'swift', 'kt',
  ];

  const ext = path.extname(filePath).replace('.', '').toLowerCase();
  if (!TEXT_EXTENSIONS.includes(ext)) return null;

  try {
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
};

// Check plagiarism for all submissions of one assignment
// Returns array of { submissionId, studentId, highestSimilarity, comparisons }
// comparisons = array of { againstSubmissionId, score }
export const checkAssignmentPlagiarism = (submissions) => {
  // submissions: [{ id, student_id, file_path }]
  // Read and tokenize each text file
  const tokenizedMap = new Map();

  for (const sub of submissions) {
    const text = readTextFile(sub.file_path);
    if (text) {
      tokenizedMap.set(sub.id, {
        tokens:    tokenize(text),
        studentId: sub.student_id,
      });
    }
  }

  const results = [];

  // Compare every pair — O(n²) but n is small (class size)
  for (const sub of submissions) {
    const current = tokenizedMap.get(sub.id);

    if (!current) {
      // Binary file — cannot check, score 0
      results.push({
        submissionId:      sub.id,
        studentId:         sub.student_id,
        highestSimilarity: 0,
        comparisons:       [],
        skipped:           true,
      });
      continue;
    }

    const comparisons = [];

    for (const other of submissions) {
      if (other.id === sub.id) continue;
      const otherData = tokenizedMap.get(other.id);
      if (!otherData) continue;

      const score = jaccardSimilarity(current.tokens, otherData.tokens);
      comparisons.push({
        againstSubmissionId: other.id,
        againstStudentId:    other.student_id,
        score:               Math.round(score * 100), // 0-100 percent
      });
    }

    const highestSimilarity = comparisons.length > 0
      ? Math.max(...comparisons.map((c) => c.score))
      : 0;

    results.push({
      submissionId:      sub.id,
      studentId:         sub.student_id,
      highestSimilarity,
      comparisons:       comparisons.sort((a, b) => b.score - a.score),
      skipped:           false,
    });
  }

  return results;
};