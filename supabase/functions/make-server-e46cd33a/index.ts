import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const app = new Hono();

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Storage bucket name
const STORAGE_BUCKET = 'make-e46cd33a-lms-files';

// Initialize storage bucket on startup
async function initializeStorage() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === STORAGE_BUCKET);
    
    if (!bucketExists) {
      await supabase.storage.createBucket(STORAGE_BUCKET, {
        public: false,
        fileSizeLimit: 52428800 // 50MB
      });
      console.log(`✅ Created storage bucket: ${STORAGE_BUCKET}`);
    } else {
      console.log(`✅ Storage bucket already exists: ${STORAGE_BUCKET}`);
    }
  } catch (error) {
    console.error('❌ Error initializing storage:', error);
  }
}

// Initialize storage on startup
initializeStorage();

// Initialize sample TPO and Test data
async function initializeSampleData() {
  try {
    // Check if sample data already exists
    const existingTPO1 = await kv.get('tpo:1');
    const existingTest1 = await kv.get('test:1');
    
    if (!existingTPO1) {
      // Create sample TPO 1
      const sampleTPO1 = {
        id: 'tpo-1',
        testNumber: 1,
        testType: 'TPO',
        year: 2024,
        month: 3,
        isOfficial: true,
        dateMemo: 'Sample TPO for demonstration',
        sections: [
          {
            id: 'reading-1',
            sectionType: 'Reading',
            instructions: 'Read the passage and answer the questions.',
            totalTime: 3600,
            questions: [
              {
                id: 'r1-q1',
                questionNumber: 1,
                questionText: 'What is the main idea of the passage?',
                questionType: 'Multiple Choice',
                options: ['Option A', 'Option B', 'Option C', 'Option D'],
                correctAnswer: 'Option A',
                explanation: 'This is the correct answer because...',
                difficulty: '보통'
              }
            ]
          },
          {
            id: 'listening-1',
            sectionType: 'Listening',
            instructions: 'Listen to the audio and answer the questions.',
            totalTime: 2400,
            questions: [
              {
                id: 'l1-q1',
                questionNumber: 1,
                questionText: 'What did the speaker mainly discuss?',
                questionType: 'Multiple Choice',
                options: ['Topic A', 'Topic B', 'Topic C', 'Topic D'],
                correctAnswer: 'Topic A',
                difficulty: '보통'
              }
            ]
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await kv.set('tpo:1', sampleTPO1);
      console.log('✅ Created sample TPO 1');
    }
    
    // Create sample TPO 2
    const existingTPO2 = await kv.get('tpo:2');
    if (!existingTPO2) {
      const sampleTPO2 = {
        id: 'tpo-2',
        testNumber: 2,
        testType: 'TPO',
        year: 2024,
        month: 4,
        isOfficial: true,
        dateMemo: 'Sample TPO 2 for demonstration',
        sections: [
          {
            id: 'reading-2',
            sectionType: 'Reading',
            instructions: 'Read the passage and answer the questions.',
            totalTime: 3600,
            questions: [
              {
                id: 'r2-q1',
                questionNumber: 1,
                questionText: 'Which of the following best describes the passage?',
                questionType: 'Multiple Choice',
                options: ['Description A', 'Description B', 'Description C', 'Description D'],
                correctAnswer: 'Description B',
                explanation: 'The passage indicates that...',
                difficulty: '보통'
              }
            ]
          },
          {
            id: 'speaking-2',
            sectionType: 'Speaking',
            instructions: 'Speak your response.',
            totalTime: 1200,
            questions: [
              {
                id: 's2-q1',
                questionNumber: 1,
                questionText: 'Do you prefer studying alone or in a group?',
                questionType: 'Independent Task',
                duration: 45,
                difficulty: '보통'
              }
            ]
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await kv.set('tpo:2', sampleTPO2);
      console.log('✅ Created sample TPO 2');
    }
    
    if (!existingTest1) {
      // Create sample Test 1
      const sampleTest1 = {
        id: 'test-1',
        testNumber: 1,
        testType: 'Test',
        year: 2024,
        month: 6,
        isOfficial: true,
        dateMemo: 'Sample Real Test for demonstration',
        sections: [
          {
            id: 'reading-t1',
            sectionType: 'Reading',
            instructions: 'Read the passage and answer the questions.',
            totalTime: 3600,
            questions: [
              {
                id: 'rt1-q1',
                questionNumber: 1,
                questionText: 'According to the passage, what is the primary purpose?',
                questionType: 'Multiple Choice',
                options: ['Purpose A', 'Purpose B', 'Purpose C', 'Purpose D'],
                correctAnswer: 'Purpose A',
                explanation: 'The passage clearly states...',
                difficulty: '보통'
              }
            ]
          },
          {
            id: 'writing-t1',
            sectionType: 'Writing',
            instructions: 'Write your essay response.',
            totalTime: 1800,
            questions: [
              {
                id: 'wt1-q1',
                questionNumber: 1,
                questionText: 'Do you agree or disagree with the following statement?',
                questionType: 'Essay',
                difficulty: '보통'
              }
            ]
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await kv.set('test:1', sampleTest1);
      console.log('✅ Created sample Test 1');
    }
  } catch (error) {
    console.error('❌ Error initializing sample data:', error);
  }
}

// Initialize sample data on startup
initializeSampleData();

// Retry helper for transient network errors
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 500): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isTransient = err instanceof TypeError && 
        (String(err).includes('connection reset') || 
         String(err).includes('connection error') ||
         String(err).includes('SendRequest'));
      if (!isTransient || attempt === retries) throw err;
      console.log(`⚠️ Transient error on attempt ${attempt}/${retries}, retrying in ${delayMs}ms...`);
      await new Promise(r => setTimeout(r, delayMs * attempt));
    }
  }
  throw new Error('withRetry: unreachable');
}

// Helper function to normalize text (remove line breaks, trim whitespace, normalize case)
function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .replace(/[\r\n\t]+/g, " ") // Replace line breaks and tabs with space
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .trim(); // Remove leading/trailing whitespace
}

// Helper function to normalize word object
function normalizeWord(word: any) {
  return {
    english: normalizeText(word.english || ""),
    korean: normalizeText(word.korean || ""),
    synonyms: word.synonyms ? normalizeText(word.synonyms) : "",
    definition: word.definition ? normalizeText(word.definition) : "",
    example: word.example ? normalizeText(word.example) : undefined
  };
}

// Helper function to compare words with normalized matching
function wordsMatch(word1: any, word2: any): boolean {
  const normalized1 = normalizeWord(word1);
  const normalized2 = normalizeWord(word2);
  
  return normalized1.english.toLowerCase() === normalized2.english.toLowerCase() &&
         normalized1.korean.toLowerCase() === normalized2.korean.toLowerCase();
}

// Helper function to determine words per day based on tab type
const getWordsPerDay = (tabType: string): number => {
  // No limit for custom and etymology tabs (use a very large number)
  if (tabType === 'custom' || tabType === 'etymology') {
    return 999999; // Effectively unlimited - no restriction on words per day
  }
  if (tabType === 'toefl-hard') {
    return 60; // vol.2 uses 60 words per day
  }
  return 40; // toefl-easy default (only used for legacy index-based fallback)
};

// Helper function to check if a tab uses dayNumber-based storage (unlimited words per day)
const isDayNumberTab = (tabType: string): boolean => {
  return tabType === 'custom' || tabType === 'etymology' || tabType === 'toefl-easy';
};

// Auto-migrate toefl-easy words from index-based to dayNumber-based storage
const migrateToeflEasyWords = async (words: any[]): Promise<any[]> => {
  if (words.length === 0) return words;
  
  // Check if migration is needed (words without dayNumber)
  const needsMigration = words.some(w => !w.dayNumber);
  if (!needsMigration) return words;
  
  console.log(`[MIGRATION] Migrating ${words.length} toefl-easy words to dayNumber-based storage`);
  
  const LEGACY_WORDS_PER_DAY = 40;
  const migratedWords = words.map((word, index) => {
    if (word.dayNumber) return word; // Already has dayNumber
    const dayNum = Math.floor(index / LEGACY_WORDS_PER_DAY) + 1;
    return { ...word, dayNumber: dayNum };
  });
  
  // Save migrated words
  await kv.set('vocabulary_words_toefl-easy', migratedWords);
  console.log(`[MIGRATION] Migration complete. Words distributed across ${Math.ceil(words.length / LEGACY_WORDS_PER_DAY)} days`);
  
  return migratedWords;
};

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-e46cd33a/health", (c) => {
  return c.json({ status: "ok" });
});

// ===========================================
// VOCABULARY MANAGEMENT ENDPOINTS
// ===========================================

// Get all words for a specific tab type
app.get("/make-server-e46cd33a/vocabulary/:tabType", async (c) => {
  try {
    const tabType = c.req.param("tabType");
    console.log(`[GET VOCABULARY] Fetching words for tab: ${tabType}`);
    
    const key = `vocabulary_words_${tabType}`;
    let words;
    
    try {
      words = await withRetry(() => kv.get(key));
    } catch (kvError) {
      console.error(`[GET VOCABULARY] KV Store error:`, kvError);
      words = null;
    }
    
    // Auto-migrate toefl-easy if needed
    if (tabType === 'toefl-easy' && words && words.length > 0) {
      words = await migrateToeflEasyWords(words);
    }
    
    console.log(`[GET VOCABULARY] Tab: ${tabType}, Total words: ${words ? words.length : 0}`);
    return c.json({ words: words || [] });
  } catch (error) {
    console.error("Error fetching vocabulary words:", error);
    return c.json({ error: "Failed to fetch vocabulary words", details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// Get words for a specific tab type and day
app.get("/make-server-e46cd33a/vocabulary/:tabType/:day", async (c) => {
  try {
    const tabType = c.req.param("tabType");
    const day = parseInt(c.req.param("day"));
    const key = `vocabulary_words_${tabType}`;
    let allWords = await withRetry(() => kv.get(key)) || [];
    
    // Auto-migrate toefl-easy if needed
    if (tabType === 'toefl-easy') {
      allWords = await migrateToeflEasyWords(allWords);
    }
    
    if (isDayNumberTab(tabType)) {
      // For dayNumber-based tabs, filter by dayNumber field
      const dayWords = allWords.filter((w: any) => w.dayNumber === day);
      return c.json({ words: dayWords });
    } else {
      // For index-based tabs (toefl-hard), use slice
      const startIndex = (day - 1) * getWordsPerDay(tabType);
      const endIndex = startIndex + getWordsPerDay(tabType);
      const dayWords = allWords.slice(startIndex, endIndex);
      return c.json({ words: dayWords });
    }
  } catch (error) {
    console.error("Error fetching vocabulary words for day:", error);
    return c.json({ error: "Failed to fetch vocabulary words", details: error.message }, 500);
  }
});

// Add a word to a specific tab type and day
app.post("/make-server-e46cd33a/vocabulary/:tabType", async (c) => {
  try {
    const tabType = c.req.param("tabType");
    const { word, day } = await c.req.json();
    const key = `vocabulary_words_${tabType}`;
    
    const allWords = await kv.get(key) || [];
    
    // For dayNumber-based tabs (custom, etymology, toefl-easy), add dayNumber to the word
    if (isDayNumberTab(tabType)) {
      const wordWithDay = { ...word, dayNumber: day };
      allWords.push(wordWithDay);
      console.log(`[ADD WORD] Added word to ${tabType}, DAY ${day}: ${word.english}`);
    } else {
      // For index-based tabs (toefl-hard), use index-based insertion
      const insertIndex = (day - 1) * getWordsPerDay(tabType);
      allWords.splice(insertIndex, 0, word);
      
      // Keep only wordsPerDay words per day - remove the last word if needed
      const dayStart = (day - 1) * getWordsPerDay(tabType);
      const dayEnd = dayStart + getWordsPerDay(tabType);
      if (allWords.slice(dayStart, dayEnd + 1).length > getWordsPerDay(tabType)) {
        allWords.splice(dayEnd, 1);
      }
    }
    
    await kv.set(key, allWords);
    return c.json({ success: true, words: allWords });
  } catch (error) {
    console.error("Error adding vocabulary word:", error);
    return c.json({ error: "Failed to add vocabulary word", details: error.message }, 500);
  }
});

// Update a word in a specific tab type and day
app.put("/make-server-e46cd33a/vocabulary/:tabType", async (c) => {
  try {
    const tabType = c.req.param("tabType");
    const { oldWord, newWord, day } = await c.req.json();
    const key = `vocabulary_words_${tabType}`;
    
    const allWords = await kv.get(key) || [];
    
    // Search in ALL words, not just the specific day
    const wordIndex = allWords.findIndex(w => 
      wordsMatch(w, oldWord)
    );
    
    if (wordIndex !== -1) {
      // For dayNumber-based tabs, preserve or add dayNumber
      if (isDayNumberTab(tabType)) {
        allWords[wordIndex] = { ...newWord, dayNumber: day };
      } else {
        allWords[wordIndex] = newWord;
      }
      await kv.set(key, allWords);
      return c.json({ success: true, words: allWords });
    } else {
      return c.json({ error: "Word not found" }, 404);
    }
  } catch (error) {
    console.error("Error updating vocabulary word:", error);
    return c.json({ error: "Failed to update vocabulary word", details: error.message }, 500);
  }
});

// Delete a word from a specific tab type and day
app.delete("/make-server-e46cd33a/vocabulary/:tabType", async (c) => {
  try {
    const tabType = c.req.param("tabType");
    const { word, day } = await c.req.json();
    const key = `vocabulary_words_${tabType}`;
    
    console.log(`[DELETE] Deleting word from ${tabType}:`, word);
    
    const allWords = await kv.get(key) || [];
    console.log(`[DELETE] Total words in ${tabType}: ${allWords.length}`);
    
    // Search in ALL words, not just the specific day
    // This is because the client shuffles words for display
    const wordIndex = allWords.findIndex(w => 
      wordsMatch(w, word)
    );
    
    if (wordIndex !== -1) {
      console.log(`[DELETE] Found word at global index ${wordIndex}, removing...`);
      allWords.splice(wordIndex, 1);
      await kv.set(key, allWords);
      console.log(`[DELETE] Word deleted successfully. Remaining words: ${allWords.length}`);
      return c.json({ success: true, words: allWords });
    } else {
      console.error(`[DELETE] Word not found in entire collection. Looking for:`, word);
      console.error(`[DELETE] Total words available:`, allWords.length);
      console.error(`[DELETE] First 5 words:`, allWords.slice(0, 5).map(w => ({ english: w.english, korean: w.korean })));
      return c.json({ 
        error: "Word not found", 
        details: `단어를 찾을 수 없습니다. English: ${word.english}, Korean: ${word.korean}`,
        totalWords: allWords.length,
        searchedWord: word
      }, 404);
    }
  } catch (error) {
    console.error("Error deleting vocabulary word:", error);
    return c.json({ error: "Failed to delete vocabulary word", details: error.message }, 500);
  }
});

// Get all days for a specific tab type
app.get("/make-server-e46cd33a/vocabulary-days/:tabType", async (c) => {
  try {
    const tabType = c.req.param("tabType");
    const key = `vocabulary_days_${tabType}`;
    const days = await withRetry(() => kv.get(key));
    
    // If no days exist, initialize with default 50 days
    if (!days || days.length === 0) {
      const defaultDays = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        name: `DAY ${i + 1}`
      }));
      await kv.set(key, defaultDays);
      return c.json({ days: defaultDays });
    }
    
    return c.json({ days });
  } catch (error) {
    console.error("Error fetching vocabulary days:", error);
    return c.json({ error: "Failed to fetch vocabulary days", details: error.message }, 500);
  }
});

// Add a day to a specific tab type
app.post("/make-server-e46cd33a/vocabulary-days/:tabType", async (c) => {
  try {
    const tabType = c.req.param("tabType");
    const { dayName } = await c.req.json();
    const key = `vocabulary_days_${tabType}`;
    
    const days = await kv.get(key) || [];
    const newId = days.length > 0 ? Math.max(...days.map(d => d.id)) + 1 : 1;
    const newDay = { id: newId, name: dayName };
    
    days.push(newDay);
    await kv.set(key, days);
    
    return c.json({ success: true, days });
  } catch (error) {
    console.error("Error adding vocabulary day:", error);
    return c.json({ error: "Failed to add vocabulary day", details: error.message }, 500);
  }
});

// Update a day in a specific tab type
app.put("/make-server-e46cd33a/vocabulary-days/:tabType", async (c) => {
  try {
    const tabType = c.req.param("tabType");
    const { dayId, newName } = await c.req.json();
    const key = `vocabulary_days_${tabType}`;
    
    const days = await kv.get(key) || [];
    const updatedDays = days.map(day => 
      day.id === dayId ? { ...day, name: newName } : day
    );
    
    await kv.set(key, updatedDays);
    return c.json({ success: true, days: updatedDays });
  } catch (error) {
    console.error("Error updating vocabulary day:", error);
    return c.json({ error: "Failed to update vocabulary day", details: error.message }, 500);
  }
});

// Delete a day from a specific tab type
app.delete("/make-server-e46cd33a/vocabulary-days/:tabType", async (c) => {
  try {
    const tabType = c.req.param("tabType");
    const { dayId } = await c.req.json();
    const daysKey = `vocabulary_days_${tabType}`;
    const wordsKey = `vocabulary_words_${tabType}`;
    
    const days = await kv.get(daysKey) || [];
    let words = await kv.get(wordsKey) || [];
    
    const dayIndex = days.findIndex(d => d.id === dayId);
    if (dayIndex === -1) {
      return c.json({ error: "Day not found" }, 404);
    }
    
    if (isDayNumberTab(tabType)) {
      // For dayNumber-based tabs, remove words with matching dayNumber
      words = words.filter((w: any) => w.dayNumber !== dayId);
    } else {
      // For index-based tabs, remove words by index range
      const startIndex = dayIndex * getWordsPerDay(tabType);
      words.splice(startIndex, getWordsPerDay(tabType));
    }
    
    // Remove the day
    const updatedDays = days.filter(d => d.id !== dayId);
    
    await kv.set(daysKey, updatedDays);
    await kv.set(wordsKey, words);
    
    return c.json({ success: true, days: updatedDays, words });
  } catch (error) {
    console.error("Error deleting vocabulary day:", error);
    return c.json({ error: "Failed to delete vocabulary day", details: error.message }, 500);
  }
});

// Delete all words in a specific day (without deleting the day itself)
app.delete("/make-server-e46cd33a/vocabulary-clear-day/:tabType", async (c) => {
  try {
    const tabType = c.req.param("tabType");
    const { day } = await c.req.json();
    const wordsKey = `vocabulary_words_${tabType}`;
    
    let words = await kv.get(wordsKey) || [];
    
    console.log(`[CLEAR DAY] Clearing words for day ${day} in ${tabType}`);
    console.log(`[CLEAR DAY] Total words before: ${words.length}`);
    
    if (isDayNumberTab(tabType)) {
      // For dayNumber-based tabs, filter out words with matching dayNumber
      words = words.filter((w: any) => w.dayNumber !== day);
    } else {
      // For index-based tabs, remove words by index range
      const startIndex = (day - 1) * getWordsPerDay(tabType);
      words.splice(startIndex, getWordsPerDay(tabType));
    }
    
    console.log(`[CLEAR DAY] Total words after: ${words.length}`);
    
    await kv.set(wordsKey, words);
    
    return c.json({ success: true, words });
  } catch (error) {
    console.error("Error clearing day words:", error);
    return c.json({ error: "Failed to clear day words", details: error.message }, 500);
  }
});

// Initialize vocabulary data for a tab type (if not exists)
app.post("/make-server-e46cd33a/vocabulary-init/:tabType", async (c) => {
  try {
    const tabType = c.req.param("tabType");
    const { words } = await c.req.json();
    const wordsKey = `vocabulary_words_${tabType}`;
    const daysKey = `vocabulary_days_${tabType}`;
    
    // Check if data already exists
    const existingWords = await kv.get(wordsKey);
    if (existingWords && existingWords.length > 0) {
      return c.json({ success: true, message: "Data already exists" });
    }
    
    // Initialize words and days
    await kv.set(wordsKey, words || []);
    
    const defaultDays = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      name: `DAY ${i + 1}`
    }));
    await kv.set(daysKey, defaultDays);
    
    return c.json({ success: true, message: "Vocabulary data initialized" });
  } catch (error) {
    console.error("Error initializing vocabulary data:", error);
    return c.json({ error: "Failed to initialize vocabulary data", details: error.message }, 500);
  }
});

// Get user's vocabulary learning progress (for future user tracking)
app.get("/make-server-e46cd33a/vocabulary-progress/:userId/:tabType", async (c) => {
  try {
    const userId = c.req.param("userId");
    const tabType = c.req.param("tabType");
    const key = `vocabulary_progress_${userId}_${tabType}`;
    
    const progress = await kv.get(key) || {
      completedDays: [],
      masteredWords: [],
      reviewWords: [],
      lastStudied: null
    };
    
    return c.json({ progress });
  } catch (error) {
    console.error("Error fetching vocabulary progress:", error);
    return c.json({ error: "Failed to fetch vocabulary progress", details: error.message }, 500);
  }
});

// Update user's vocabulary learning progress
app.post("/make-server-e46cd33a/vocabulary-progress/:userId/:tabType", async (c) => {
  try {
    const userId = c.req.param("userId");
    const tabType = c.req.param("tabType");
    const progressData = await c.req.json();
    const key = `vocabulary_progress_${userId}_${tabType}`;
    
    await kv.set(key, {
      ...progressData,
      lastStudied: new Date().toISOString()
    });
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error updating vocabulary progress:", error);
    return c.json({ error: "Failed to update vocabulary progress", details: error.message }, 500);
  }
});

// Bulk upload words to a specific tab type
app.post("/make-server-e46cd33a/vocabulary-bulk/:tabType", async (c) => {
  try {
    const tabType = c.req.param("tabType");
    const { words, targetDay, replaceExisting } = await c.req.json();
    const key = `vocabulary_words_${tabType}`;
    
    let allWords = await kv.get(key) || [];
    
    // For dayNumber-based tabs (custom, etymology, toefl-easy), add dayNumber to each word and just append
    if (isDayNumberTab(tabType)) {
      if (replaceExisting) {
        // Remove existing words for this day
        allWords = allWords.filter((w: any) => w.dayNumber !== targetDay);
      }
      
      // Add dayNumber to new words and append them
      const wordsWithDay = words.map(w => ({ ...w, dayNumber: targetDay }));
      allWords.push(...wordsWithDay);
      
      console.log(`[BULK UPLOAD] ${tabType}: Added ${wordsWithDay.length} words to DAY ${targetDay}`);
    } else {
      // For index-based tabs (toefl-hard), use index-based insertion
      if (replaceExisting) {
        // Replace all words for the target day
        const dayStart = (targetDay - 1) * getWordsPerDay(tabType);
        const dayEnd = dayStart + getWordsPerDay(tabType);
        
        // Remove existing words for this day
        allWords.splice(dayStart, Math.min(getWordsPerDay(tabType), allWords.length - dayStart));
        
        // Insert new words (limited to wordsPerDay)
        const wordsToInsert = words.slice(0, getWordsPerDay(tabType));
        allWords.splice(dayStart, 0, ...wordsToInsert);
      } else {
        // Append words to the target day
        const dayStart = (targetDay - 1) * getWordsPerDay(tabType);
        allWords.splice(dayStart, 0, ...words);
        
        // Keep only wordsPerDay words per day
        const dayEnd = dayStart + getWordsPerDay(tabType);
        if (allWords.slice(dayStart, dayEnd + words.length).length > getWordsPerDay(tabType)) {
          const excessCount = allWords.slice(dayStart, dayEnd + words.length).length - getWordsPerDay(tabType);
          allWords.splice(dayEnd, excessCount);
        }
      }
    }
    
    await kv.set(key, allWords);
    return c.json({ success: true, words: allWords, uploadedCount: words.length });
  } catch (error) {
    console.error("Error bulk uploading vocabulary words:", error);
    return c.json({ error: "Failed to bulk upload vocabulary words", details: error.message }, 500);
  }
});

// Bulk upload words across multiple days
app.post("/make-server-e46cd33a/vocabulary-bulk-multi/:tabType", async (c) => {
  try {
    const tabType = c.req.param("tabType");
    const { wordsByDay, replaceExisting } = await c.req.json(); // Format: { 1: [words], 2: [words], ... }
    const key = `vocabulary_words_${tabType}`;
    
    let allWords = await kv.get(key) || [];
    let totalUploaded = 0;
    
    if (isDayNumberTab(tabType)) {
      // For dayNumber-based tabs (custom, etymology, toefl-easy), add dayNumber field to each word
      for (const [dayStr, dayWords] of Object.entries(wordsByDay)) {
        const day = parseInt(dayStr);
        
        if (replaceExisting) {
          // Remove existing words for this day
          allWords = allWords.filter((w: any) => w.dayNumber !== day);
        }
        
        // If dayWords is empty, skip (already removed above)
        if (Array.isArray(dayWords) && dayWords.length === 0) {
          console.log(`[BULK-MULTI] ${tabType} DAY ${day} skipped (all words removed)`);
          continue;
        }
        
        // Add dayNumber to each word and append
        const wordsWithDay = dayWords.map(w => ({ ...w, dayNumber: day }));
        allWords.push(...wordsWithDay);
        totalUploaded += wordsWithDay.length;
        console.log(`[BULK-MULTI] ${tabType} DAY ${day}: uploaded ${wordsWithDay.length} words`);
      }
    } else {
      // For index-based tabs (toefl-hard), use index-based insertion
      for (const [dayStr, dayWords] of Object.entries(wordsByDay)) {
        const day = parseInt(dayStr);
        const dayStart = (day - 1) * getWordsPerDay(tabType);
        
        // Remove existing words for this day
        const wordsToRemove = Math.min(getWordsPerDay(tabType), allWords.length - dayStart);
        if (wordsToRemove > 0) {
          allWords.splice(dayStart, wordsToRemove);
        }
        
        // If dayWords is empty, skip this day (remove all words but don't add any)
        if (Array.isArray(dayWords) && dayWords.length === 0) {
          console.log(`[BULK-MULTI] DAY ${day} skipped (all words removed)`);
          continue;
        }
        
        // Insert new words (limited to wordsPerDay)
        const wordsToInsert = dayWords.slice(0, getWordsPerDay(tabType));
        allWords.splice(dayStart, 0, ...wordsToInsert);
        totalUploaded += wordsToInsert.length;
        console.log(`[BULK-MULTI] DAY ${day}: uploaded ${wordsToInsert.length} words`);
      }
    }
    
    await kv.set(key, allWords);
    return c.json({ success: true, words: allWords, totalUploaded });
  } catch (error) {
    console.error("Error multi-day bulk uploading vocabulary words:", error);
    return c.json({ error: "Failed to multi-day bulk upload vocabulary words", details: error.message }, 500);
  }
});

// Normalize all existing words in a tab type (cleanup utility)
app.post("/make-server-e46cd33a/vocabulary-normalize/:tabType", async (c) => {
  try {
    const tabType = c.req.param("tabType");
    const key = `vocabulary_words_${tabType}`;
    
    const allWords = await kv.get(key) || [];
    console.log(`[NORMALIZE] Normalizing ${allWords.length} words in ${tabType}`);
    
    // Normalize all words
    const normalizedWords = allWords.map((word: any) => ({
      english: normalizeText(word.english || ""),
      korean: normalizeText(word.korean || ""),
      synonyms: word.synonyms ? normalizeText(word.synonyms) : "",
      definition: word.definition ? normalizeText(word.definition) : "",
      example: word.example ? normalizeText(word.example) : undefined
    }));
    
    await kv.set(key, normalizedWords);
    console.log(`[NORMALIZE] Successfully normalized ${normalizedWords.length} words`);
    
    return c.json({ 
      success: true, 
      message: `Normalized ${normalizedWords.length} words in ${tabType}`,
      words: normalizedWords 
    });
  } catch (error) {
    console.error("Error normalizing vocabulary words:", error);
    return c.json({ error: "Failed to normalize vocabulary words", details: error.message }, 500);
  }
});

// Rearrange words from 60×30 to 40×45 format (for toefl-hard migration)
app.post("/make-server-e46cd33a/vocabulary-rearrange/:tabType", async (c) => {
  try {
    const tabType = c.req.param("tabType");
    const wordsKey = `vocabulary_words_${tabType}`;
    const daysKey = `vocabulary_days_${tabType}`;
    
    const allWords = await kv.get(wordsKey) || [];
    console.log(`[REARRANGE] Starting rearrangement for ${tabType}`);
    console.log(`[REARRANGE] Current word count: ${allWords.length}`);
    
    // No need to rearrange if not enough words
    if (allWords.length === 0) {
      return c.json({ 
        success: false, 
        message: "No words to rearrange" 
      });
    }
    
    // For toefl-hard: rearrange from 60×30 (1800) to 40×45 (1800)
    if (tabType === 'toefl-hard') {
      // Words are already in flat array, just need to update days
      const newDayCount = Math.ceil(allWords.length / 40);
      console.log(`[REARRANGE] Creating ${newDayCount} days for ${allWords.length} words`);
      
      const newDays = Array.from({ length: newDayCount }, (_, i) => ({
        id: i + 1,
        name: `DAY ${i + 1}`
      }));
      
      await kv.set(daysKey, newDays);
      console.log(`[REARRANGE] Successfully updated to ${newDays.length} days`);
      
      return c.json({ 
        success: true, 
        message: `Rearranged ${allWords.length} words into ${newDays.length} days (40 words per day)`,
        totalWords: allWords.length,
        totalDays: newDays.length,
        wordsPerDay: 40
      });
    } else {
      return c.json({ 
        success: false, 
        message: `Rearrangement not needed for ${tabType}` 
      });
    }
  } catch (error) {
    console.error("Error rearranging vocabulary words:", error);
    return c.json({ error: "Failed to rearrange vocabulary words", details: error.message }, 500);
  }
});

// ==============================================
// Advertisement Management Routes
// ==============================================

// Get all advertisements
app.get('/make-server-e46cd33a/advertisements', async (c) => {
  try {
    const ads = await kv.getByPrefix('advertisement:');
    const sortedAds = ads.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return c.json(sortedAds);
  } catch (error) {
    console.error('Error loading advertisements:', error);
    return c.json({ error: 'Failed to load advertisements' }, 500);
  }
});

// Create or update advertisement
app.post('/make-server-e46cd33a/advertisements', async (c) => {
  try {
    const ad = await c.req.json();
    await kv.set(`advertisement:${ad.id}`, ad);
    console.log('✅ Advertisement saved:', ad.id);
    return c.json({ success: true, ad });
  } catch (error) {
    console.error('Error saving advertisement:', error);
    return c.json({ error: 'Failed to save advertisement' }, 500);
  }
});

// Update advertisement
app.put('/make-server-e46cd33a/advertisements', async (c) => {
  try {
    const ad = await c.req.json();
    await kv.set(`advertisement:${ad.id}`, ad);
    console.log('✅ Advertisement updated:', ad.id);
    return c.json({ success: true, ad });
  } catch (error) {
    console.error('Error updating advertisement:', error);
    return c.json({ error: 'Failed to update advertisement' }, 500);
  }
});

// Delete advertisement
app.delete('/make-server-e46cd33a/advertisements/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await kv.del(`advertisement:${id}`);
    console.log('✅ Advertisement deleted:', id);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting advertisement:', error);
    return c.json({ error: 'Failed to delete advertisement' }, 500);
  }
});

// Get active advertisements (for display)
app.get('/make-server-e46cd33a/advertisements/active', async (c) => {
  try {
    const ads = await kv.getByPrefix('advertisement:');
    const activeAds = ads
      .filter(ad => ad.isActive)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return c.json(activeAds);
  } catch (error) {
    console.error('Error loading active advertisements:', error);
    return c.json({ error: 'Failed to load active advertisements' }, 500);
  }
});

// ==============================================
// Shared JSON document routes
// ==============================================

const registerJsonDocumentRoutes = (path: string, storageKey: string) => {
  app.get(path, async (c) => {
    try {
      const value = await kv.get(storageKey);
      return c.json(value ?? []);
    } catch (error) {
      console.error(`Error loading ${storageKey}:`, error);
      return c.json({ error: `Failed to load ${storageKey}` }, 500);
    }
  });

  app.post(path, async (c) => {
    try {
      const payload = await c.req.json();
      await kv.set(storageKey, payload);
      return c.json({ success: true, data: payload });
    } catch (error) {
      console.error(`Error saving ${storageKey}:`, error);
      return c.json({ error: `Failed to save ${storageKey}` }, 500);
    }
  });
};

const registerAppendableCollectionRoutes = (path: string, storageKey: string) => {
  app.get(path, async (c) => {
    try {
      const value = await kv.get(storageKey);
      return c.json(Array.isArray(value) ? value : []);
    } catch (error) {
      console.error(`Error loading ${storageKey}:`, error);
      return c.json({ error: `Failed to load ${storageKey}` }, 500);
    }
  });

  app.post(path, async (c) => {
    try {
      const payload = await c.req.json();
      if (Array.isArray(payload)) {
        await kv.set(storageKey, payload);
        return c.json({ success: true, data: payload });
      }

      const existing = await kv.get(storageKey);
      const nextValue = Array.isArray(existing) ? [payload, ...existing] : [payload];
      await kv.set(storageKey, nextValue);
      return c.json({ success: true, data: nextValue });
    } catch (error) {
      console.error(`Error saving ${storageKey}:`, error);
      return c.json({ error: `Failed to save ${storageKey}` }, 500);
    }
  });
};

registerJsonDocumentRoutes('/make-server-e46cd33a/lms-contents', 'lms-contents');
registerJsonDocumentRoutes('/make-server-e46cd33a/reports', 'reports');
registerJsonDocumentRoutes('/make-server-e46cd33a/students', 'students');
registerJsonDocumentRoutes('/make-server-e46cd33a/question-types-config', 'question-types-config');
registerJsonDocumentRoutes('/make-server-e46cd33a/training-config', 'training-config');
registerAppendableCollectionRoutes('/make-server-e46cd33a/test-results', 'test-results');
registerAppendableCollectionRoutes('/make-server-e46cd33a/training-results', 'training-results');
registerAppendableCollectionRoutes('/make-server-e46cd33a/question-types-results', 'question-types-results');

// ==============================================
// TPO/Test Data Management Routes
// ==============================================

// Get all TPO tests metadata (list)
app.get('/make-server-e46cd33a/tpo-tests', async (c) => {
  try {
    const tests = await kv.getByPrefix('tpo:');
    return c.json(tests);
  } catch (error) {
    console.error('Error loading TPO tests:', error);
    return c.json({ error: 'Failed to load TPO tests' }, 500);
  }
});

// Get specific TPO test by number
app.get('/make-server-e46cd33a/tpo-tests/:number', async (c) => {
  try {
    const number = c.req.param('number');
    const test = await kv.get(`tpo:${number}`);
    if (!test) {
      return c.json({ error: 'Test not found' }, 404);
    }
    return c.json(test);
  } catch (error) {
    console.error('Error loading TPO test:', error);
    return c.json({ error: 'Failed to load TPO test' }, 500);
  }
});

// Save TPO test
app.post('/make-server-e46cd33a/tpo-tests', async (c) => {
  try {
    const test = await c.req.json();
    await kv.set(`tpo:${test.testNumber}`, test);
    return c.json({ success: true, test });
  } catch (error) {
    console.error('Error saving TPO test:', error);
    return c.json({ error: 'Failed to save TPO test' }, 500);
  }
});

// Get all Real tests metadata (list)
app.get('/make-server-e46cd33a/test-tests', async (c) => {
  try {
    const tests = await kv.getByPrefix('test:');
    return c.json(tests);
  } catch (error) {
    console.error('Error loading Real tests:', error);
    return c.json({ error: 'Failed to load Real tests' }, 500);
  }
});

// Get specific Real test by number
app.get('/make-server-e46cd33a/test-tests/:number', async (c) => {
  try {
    const number = c.req.param('number');
    const test = await kv.get(`test:${number}`);
    if (!test) {
      return c.json({ error: 'Test not found' }, 404);
    }
    return c.json(test);
  } catch (error) {
    console.error('Error loading Real test:', error);
    return c.json({ error: 'Failed to load Real test' }, 500);
  }
});

// Save Real test
app.post('/make-server-e46cd33a/test-tests', async (c) => {
  try {
    const test = await c.req.json();
    await kv.set(`test:${test.testNumber}`, test);
    return c.json({ success: true, test });
  } catch (error) {
    console.error('Error saving Real test:', error);
    return c.json({ error: 'Failed to save Real test' }, 500);
  }
});

// Get all Training tests metadata (list)
app.get('/make-server-e46cd33a/training-tests', async (c) => {
  try {
    const tests = await kv.getByPrefix('training:');
    return c.json(tests);
  } catch (error) {
    console.error('Error loading Training tests:', error);
    return c.json({ error: 'Failed to load Training tests' }, 500);
  }
});

// Get specific Training test by number
app.get('/make-server-e46cd33a/training-tests/:number', async (c) => {
  try {
    const number = c.req.param('number');
    const test = await kv.get(`training:${number}`);
    if (!test) {
      return c.json({ error: 'Test not found' }, 404);
    }
    return c.json(test);
  } catch (error) {
    console.error('Error loading Training test:', error);
    return c.json({ error: 'Failed to load Training test' }, 500);
  }
});

// Save Training test
app.post('/make-server-e46cd33a/training-tests', async (c) => {
  try {
    const test = await c.req.json();
    await kv.set(`training:${test.testNumber}`, test);
    return c.json({ success: true, test });
  } catch (error) {
    console.error('Error saving Training test:', error);
    return c.json({ error: 'Failed to save Training test' }, 500);
  }
});

// Delete TPO test
app.delete('/make-server-e46cd33a/tpo-tests/:number', async (c) => {
  try {
    const number = c.req.param('number');
    await kv.del(`tpo:${number}`);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting TPO test:', error);
    return c.json({ error: 'Failed to delete TPO test' }, 500);
  }
});

// Delete Real test
app.delete('/make-server-e46cd33a/real-tests/:number', async (c) => {
  try {
    const number = c.req.param('number');
    await kv.del(`test:${number}`);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting Real test:', error);
    return c.json({ error: 'Failed to delete Real test' }, 500);
  }
});

// Delete Test test
app.delete('/make-server-e46cd33a/test-tests/:number', async (c) => {
  try {
    const number = c.req.param('number');
    await kv.del(`test:${number}`);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting Test test:', error);
    return c.json({ error: 'Failed to delete Test test' }, 500);
  }
});

// Delete Training test
app.delete('/make-server-e46cd33a/training-tests/:number', async (c) => {
  try {
    const number = c.req.param('number');
    await kv.del(`training:${number}`);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting Training test:', error);
    return c.json({ error: 'Failed to delete Training test' }, 500);
  }
});

// ── Supabase Auth 세션 발급 헬퍼 ──
// 이메일 인증번호 검증에 성공한 뒤 호출한다.
// 1) Auth 유저가 없으면 생성(이메일 확인 완료 상태) 2) 매직링크 토큰 해시를 발급해 반환.
// 프론트엔드는 이 token_hash 를 supabase.auth.verifyOtp 로 교환해 진짜 세션을 만든다.
async function issueAuthSession(email: string): Promise<{ tokenHash: string } | { error: string }> {
  const emailLower = String(email).toLowerCase();
  try {
    // 유저 생성 시도 (이미 있으면 무시)
    const { error: createErr } = await supabase.auth.admin.createUser({
      email: emailLower,
      email_confirm: true,
    });
    if (createErr && !/already|registered|exists/i.test(createErr.message)) {
      console.error('createUser error:', createErr.message);
    }

    // 매직링크 생성 → token_hash 확보
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: emailLower,
    });
    if (error || !data?.properties?.hashed_token) {
      console.error('generateLink error:', error?.message);
      return { error: '세션 발급에 실패했어요.' };
    }
    return { tokenHash: data.properties.hashed_token };
  } catch (err) {
    console.error('issueAuthSession error:', err);
    return { error: '세션 발급 중 오류가 발생했어요.' };
  }
}

// User registration endpoint (email-based)
app.post('/make-server-e46cd33a/users/register', async (c) => {
  try {
    const { email, username, password, verifyCode } = await c.req.json();

    // Validate email (모든 방식에서 필수)
    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: 'Invalid email format' }, 400);
    }
    const emailLower = email.toLowerCase();

    // ── Email + 인증번호 등록 (신규 방식) ──
    if (verifyCode) {
      const stored = await kv.get(`email_code:${emailLower}`);
      if (!stored) {
        return c.json({ error: '인증번호를 먼저 요청해주세요.' }, 400);
      }
      if (Date.now() > stored.expiresAt) {
        return c.json({ error: '인증번호가 만료되었어요. 다시 요청해주세요.' }, 400);
      }
      if (String(stored.code) !== String(verifyCode).trim()) {
        return c.json({ error: '인증번호가 올바르지 않아요.' }, 401);
      }
      await kv.del(`email_code:${emailLower}`);

      let user = await kv.get(`user:email:${emailLower}`);
      if (!user) {
        const derivedUsername = emailLower.split('@')[0];
        user = {
          id: `user_${Date.now()}`,
          email: emailLower,
          username: derivedUsername,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await kv.set(`user:email:${emailLower}`, user);
        await kv.set(`user:id:${user.id}`, user);
        console.log('✅ User registered via email code:', emailLower);
      }

      // 진짜 Supabase Auth 세션 발급 (활성화/권한 시스템 연동)
      const session = await issueAuthSession(emailLower);
      return c.json({
        success: true,
        user: { id: user.id, email: user.email, username: user.username },
        tokenHash: 'tokenHash' in session ? session.tokenHash : null,
        email: emailLower,
      });
    }

    // ── Legacy: 아이디/비밀번호 등록 ──
    if (!username || !password) {
      return c.json({ error: 'All fields are required' }, 400);
    }

    // Check if user already exists
    const existingUser = await kv.get(`user:email:${emailLower}`);
    if (existingUser) {
      return c.json({ error: 'Email already registered' }, 400);
    }

    const existingUsername = await kv.get(`user:username:${username}`);
    if (existingUsername) {
      return c.json({ error: 'Username already taken' }, 400);
    }

    // Create user object
    const user = {
      id: `user_${Date.now()}`,
      email: emailLower,
      username,
      password, // Note: In production, you should hash passwords
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save user
    await kv.set(`user:email:${emailLower}`, user);
    await kv.set(`user:username:${username}`, user);
    await kv.set(`user:id:${user.id}`, user);

    console.log('✅ User registered:', username);
    return c.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ error: 'Registration failed' }, 500);
  }
});

// Send email verification code via Resend
app.post('/make-server-e46cd33a/auth/send-email-code', async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: 'Invalid email format' }, 400);
    }

    // Backend generates the code (single source of truth)
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Get Resend API key from environment
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return c.json({ error: 'Email service not configured' }, 500);
    }

    const FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev';
    const FROM_NAME = Deno.env.get('RESEND_FROM_NAME') || 'TOEFL ALLMYEXAM';

    // Store the code in KV (5 minutes TTL)
    await kv.set(`email_code:${email.toLowerCase()}`, {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    // Send via Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [email],
        subject: '[TOEFL] 이메일 인증 코드',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1a1a1a;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="font-size: 24px; font-weight: 700; color: #005f61; margin: 0;">TOEFL ALLMYEXAM</h1>
            </div>
            <div style="background: #f5f7fa; border-radius: 16px; padding: 32px; text-align: center;">
              <p style="font-size: 16px; color: #4a5568; margin: 0 0 16px 0;">이메일 인증 코드</p>
              <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #005f61; padding: 16px 0;">${code}</div>
              <p style="font-size: 13px; color: #718096; margin: 16px 0 0 0;">이 코드는 5분 후 만료됩니다.</p>
            </div>
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
              <p style="font-size: 12px; color: #a0aec0; text-align: center; line-height: 1.6; margin: 0;">
                본인이 요청하지 않은 경우 이 메일을 무시해주세요.<br/>
                이 메일은 발신 전용입니다.
              </p>
            </div>
          </div>
        `,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error('Resend API error:', errorText);
      return c.json({ error: 'Failed to send email', detail: errorText }, 500);
    }

    const data = await resendResponse.json();
    console.log('✅ Email sent to', email, '— Resend ID:', data.id);
    // Return code to frontend so it can verify locally
    return c.json({ success: true, messageId: data.id, code });
  } catch (error) {
    console.error('Send email code error:', error);
    return c.json({ error: 'Failed to send email code' }, 500);
  }
});

// Verify email code (optional — frontend can also check, but server-side is more secure)
app.post('/make-server-e46cd33a/auth/verify-email-code', async (c) => {
  try {
    const { email, code } = await c.req.json();
    if (!email || !code) {
      return c.json({ error: 'Email and code required' }, 400);
    }
    const stored = await kv.get(`email_code:${email.toLowerCase()}`);
    if (!stored) {
      return c.json({ error: 'No code found. Please request a new one.' }, 400);
    }
    if (Date.now() > stored.expiresAt) {
      return c.json({ error: 'Code expired. Please request a new one.' }, 400);
    }
    if (stored.code !== code) {
      return c.json({ error: 'Invalid code' }, 400);
    }
    // Clear the code after successful verification
    await kv.del(`email_code:${email.toLowerCase()}`);
    return c.json({ success: true, verified: true });
  } catch (error) {
    console.error('Verify email code error:', error);
    return c.json({ error: 'Verification failed' }, 500);
  }
});

// User login endpoint
app.post('/make-server-e46cd33a/users/login', async (c) => {
  try {
    const body = await c.req.json();
    const { username, email, phoneNumber, password, verifyCode, loginMethod } = body;

    // ── Email + 인증번호 로그인 (신규 방식) ──
    // 프론트엔드가 { email, verifyCode, loginMethod: 'email' } 를 보낸다.
    if (loginMethod === 'email' && email && verifyCode) {
      const emailLower = String(email).toLowerCase();

      // 인증번호 검증
      const stored = await kv.get(`email_code:${emailLower}`);
      if (!stored) {
        return c.json({ error: '인증번호를 먼저 요청해주세요.' }, 400);
      }
      if (Date.now() > stored.expiresAt) {
        return c.json({ error: '인증번호가 만료되었어요. 다시 요청해주세요.' }, 400);
      }
      if (String(stored.code) !== String(verifyCode).trim()) {
        return c.json({ error: '인증번호가 올바르지 않아요.' }, 401);
      }

      // 인증 성공 → 코드 삭제 (1회용)
      await kv.del(`email_code:${emailLower}`);

      // 기존 유저 조회, 없으면 자동 생성
      let user = await kv.get(`user:email:${emailLower}`);
      if (!user) {
        const derivedUsername = emailLower.split('@')[0];
        user = {
          id: `user_${Date.now()}`,
          email: emailLower,
          username: derivedUsername,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await kv.set(`user:email:${emailLower}`, user);
        await kv.set(`user:id:${user.id}`, user);
        console.log('✅ User auto-registered via email code:', emailLower);
      }

      console.log('✅ User logged in (email code):', user.username);

      // 진짜 Supabase Auth 세션 발급 (활성화/권한 시스템 연동)
      const session = await issueAuthSession(emailLower);
      return c.json({
        success: true,
        user: { id: user.id, email: user.email, username: user.username },
        tokenHash: 'tokenHash' in session ? session.tokenHash : null,
        email: emailLower,
      });
    }

    // ── Legacy: 아이디/비밀번호 로그인 (기존 계정 호환) ──
    if (!password || (!username && !email && !phoneNumber)) {
      return c.json({ error: 'Invalid credentials' }, 400);
    }

    // Find user by chosen login method
    let user;
    if (loginMethod === 'email' && email) {
      user = await kv.get(`user:email:${String(email).toLowerCase()}`);
    } else if (loginMethod === 'username' && username) {
      user = await kv.get(`user:username:${username}`);
    } else if (loginMethod === 'phone' && phoneNumber) {
      // Legacy phone login still supported for old accounts
      user = await kv.get(`user:phone:${phoneNumber}`);
    }

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Verify password
    if (user.password !== password) {
      return c.json({ error: 'Incorrect password' }, 401);
    }

    console.log('✅ User logged in:', user.username);
    return c.json({
      success: true,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

Deno.serve(app.fetch);// deployed: 2026-07-11T00:00:00Z
