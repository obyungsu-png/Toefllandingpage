import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
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
  return 40; // TOEFL tabs use 40 words per day
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
      words = await kv.get(key);
    } catch (kvError) {
      console.error(`[GET VOCABULARY] KV Store error:`, kvError);
      words = null;
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
    const allWords = await kv.get(key) || [];
    
    // Calculate day words (40 words per day)
    const startIndex = (day - 1) * getWordsPerDay(tabType);
    const endIndex = startIndex + getWordsPerDay(tabType);
    const dayWords = allWords.slice(startIndex, endIndex);
    
    return c.json({ words: dayWords });
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
    
    // For custom and etymology tabs, add dayNumber to the word
    if (tabType === 'custom' || tabType === 'etymology') {
      const wordWithDay = { ...word, dayNumber: day };
      allWords.push(wordWithDay);
      console.log(`[ADD WORD] Added word to ${tabType}, DAY ${day}: ${word.english}`);
    } else {
      // For TOEFL tabs, use index-based insertion (original logic)
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
    // This is because the client shuffles words for display
    const wordIndex = allWords.findIndex(w => 
      wordsMatch(w, oldWord)
    );
    
    if (wordIndex !== -1) {
      // For custom and etymology tabs, preserve or add dayNumber
      if (tabType === 'custom' || tabType === 'etymology') {
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
    const days = await kv.get(key);
    
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
    const words = await kv.get(wordsKey) || [];
    
    const dayIndex = days.findIndex(d => d.id === dayId);
    if (dayIndex === -1) {
      return c.json({ error: "Day not found" }, 404);
    }
    
    // Remove words for this day (40 words starting at dayIndex * 40)
    const startIndex = dayIndex * getWordsPerDay(tabType);
    words.splice(startIndex, getWordsPerDay(tabType));
    
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
    
    const words = await kv.get(wordsKey) || [];
    
    // Calculate the range for this day's words
    const startIndex = (day - 1) * getWordsPerDay(tabType);
    const endIndex = startIndex + getWordsPerDay(tabType);
    
    console.log(`[CLEAR DAY] Clearing words for day ${day} in ${tabType} (indices ${startIndex}-${endIndex})`);
    console.log(`[CLEAR DAY] Total words before: ${words.length}`);
    
    // Remove the words for this day
    words.splice(startIndex, getWordsPerDay(tabType));
    
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
    
    // For custom and etymology tabs, add dayNumber to each word and just append
    if (tabType === 'custom' || tabType === 'etymology') {
      if (replaceExisting) {
        // Remove existing words for this day
        allWords = allWords.filter((w: any) => w.dayNumber !== targetDay);
      }
      
      // Add dayNumber to new words and append them
      const wordsWithDay = words.map(w => ({ ...w, dayNumber: targetDay }));
      allWords.push(...wordsWithDay);
      
      console.log(`[BULK UPLOAD] ${tabType}: Added ${wordsWithDay.length} words to DAY ${targetDay}`);
    } else {
      // For TOEFL tabs, use index-based insertion
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
    
    if (tabType === 'custom' || tabType === 'etymology') {
      // For custom and etymology, add dayNumber field to each word
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
      // For TOEFL tabs, use index-based insertion
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

// ===========================================
// LMS CONTENTS ENDPOINTS
// ===========================================

// Save LMS contents
app.post('/make-server-e46cd33a/lms-contents', async (c) => {
  try {
    const contents = await c.req.json();
    await kv.set('lms-contents', contents);
    console.log('✅ LMS contents saved');
    return c.json({ success: true });
  } catch (error) {
    console.error('Error saving LMS contents:', error);
    return c.json({ error: 'Failed to save LMS contents' }, 500);
  }
});

// Get LMS contents
app.get('/make-server-e46cd33a/lms-contents', async (c) => {
  try {
    const contents = await kv.get('lms-contents');
    return c.json(contents || []);
  } catch (error) {
    console.error('Error loading LMS contents:', error);
    return c.json({ error: 'Failed to load LMS contents' }, 500);
  }
});

// ===========================================
// TPO TESTS ENDPOINTS
// ===========================================

// Save TPO tests
app.post('/make-server-e46cd33a/tpo-tests', async (c) => {
  try {
    const tests = await c.req.json();
    await kv.set('tpo-tests', tests);
    console.log('✅ TPO tests saved');
    return c.json({ success: true });
  } catch (error) {
    console.error('Error saving TPO tests:', error);
    return c.json({ error: 'Failed to save TPO tests' }, 500);
  }
});

// Get TPO tests
app.get('/make-server-e46cd33a/tpo-tests', async (c) => {
  try {
    const tests = await kv.get('tpo-tests');
    return c.json(tests || []);
  } catch (error) {
    console.error('Error loading TPO tests:', error);
    return c.json({ error: 'Failed to load TPO tests' }, 500);
  }
});

// ===========================================
// TEST TESTS ENDPOINTS
// ===========================================

// Save Test tests
app.post('/make-server-e46cd33a/test-tests', async (c) => {
  try {
    const tests = await c.req.json();
    await kv.set('test-tests', tests);
    console.log('✅ Test tests saved');
    return c.json({ success: true });
  } catch (error) {
    console.error('Error saving Test tests:', error);
    return c.json({ error: 'Failed to save Test tests' }, 500);
  }
});

// Get Test tests
app.get('/make-server-e46cd33a/test-tests', async (c) => {
  try {
    const tests = await kv.get('test-tests');
    return c.json(tests || []);
  } catch (error) {
    console.error('Error loading Test tests:', error);
    return c.json({ error: 'Failed to load Test tests' }, 500);
  }
});

// ===========================================
// REPORTS ENDPOINTS
// ===========================================

// Save Reports
app.post('/make-server-e46cd33a/reports', async (c) => {
  try {
    const reports = await c.req.json();
    await kv.set('reports', reports);
    console.log('✅ Reports saved');
    return c.json({ success: true });
  } catch (error) {
    console.error('Error saving reports:', error);
    return c.json({ error: 'Failed to save reports' }, 500);
  }
});

// Get Reports
app.get('/make-server-e46cd33a/reports', async (c) => {
  try {
    const reports = await kv.get('reports');
    return c.json(reports || []);
  } catch (error) {
    console.error('Error loading reports:', error);
    return c.json({ error: 'Failed to load reports' }, 500);
  }
});

Deno.serve(app.fetch);