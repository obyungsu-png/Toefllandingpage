import { useState, useMemo, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Plus, Edit, Trash2, Search, BookOpen, Save, X, Check, Pencil, Upload, Download, FileText, ChevronDown, ChevronRight } from 'lucide-react';
// motion removed - using CSS animations
import { SATWord } from './vocaWordSets';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export interface VocabularyDay {
  id: number;
  name: string;
}

// Helper function to normalize text (remove line breaks, trim whitespace)
function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .replace(/[\r\n\t]+/g, " ") // Replace line breaks and tabs with space
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .trim(); // Remove leading/trailing whitespace
}

// Helper function to normalize word object
function normalizeWord(word: SATWord): SATWord {
  return {
    english: normalizeText(word.english || ""),
    korean: normalizeText(word.korean || ""),
    synonyms: normalizeText(word.synonyms || ""),
    definition: normalizeText(word.definition || ""),
    example: word.example ? normalizeText(word.example) : undefined
  };
}

interface VocabularyManagementProps {
  // Props are no longer needed since we fetch from Supabase
  // Keeping for backward compatibility but will be ignored
  words?: SATWord[];
  days?: VocabularyDay[];
  onAddWord?: (word: SATWord, day: number) => void;
  onUpdateWord?: (oldWord: SATWord, newWord: SATWord, day: number) => void;
  onDeleteWord?: (word: SATWord, day: number) => void;
  onAddDay?: (dayName: string) => void;
  onUpdateDay?: (dayId: number, newName: string) => void;
  onDeleteDay?: (dayId: number) => void;
}

export function VocabularyManagement({ 
  words: propsWords, 
  days: propsDays,
  onAddWord: propsOnAddWord, 
  onUpdateWord: propsOnUpdateWord, 
  onDeleteWord: propsOnDeleteWord,
  onAddDay: propsOnAddDay,
  onUpdateDay: propsOnUpdateDay,
  onDeleteDay: propsOnDeleteDay
}: VocabularyManagementProps) {
  const [activeTab, setActiveTab] = useState<'toefl-easy' | 'toefl-hard' | 'etymology' | 'custom'>('toefl-easy');
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddDayForm, setShowAddDayForm] = useState(false);
  const [showUploadGuide, setShowUploadGuide] = useState(false);
  const [editingDayId, setEditingDayId] = useState<number | null>(null);
  const [editingDayName, setEditingDayName] = useState('');
  const [newDayName, setNewDayName] = useState('');
  const [editingWord, setEditingWord] = useState<SATWord | null>(null);
  const [editingWordIndex, setEditingWordIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<SATWord>({
    english: '',
    korean: '',
    definition: '',
    synonyms: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addFormRef = useRef<HTMLDivElement>(null);
  const editFormRef = useRef<HTMLDivElement>(null);

  // Supabase state management
  const [words, setWords] = useState<SATWord[]>([]);
  const [days, setDays] = useState<VocabularyDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bulk upload state
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkUploadText, setBulkUploadText] = useState('');
  const [bulkUploadTargetDay, setBulkUploadTargetDay] = useState<number>(1);
  const [bulkUploadMode, setBulkUploadMode] = useState<'single-day' | 'multi-day'>('single-day');
  const [replaceExisting, setReplaceExisting] = useState(true);

  // Collapse/Expand state for word lists (default: collapsed)
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-e46cd33a`;

  // Cache configuration
  const CACHE_VERSION = 'v1';
  const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

  // Cache helper functions
  const getCacheKey = (type: string) => `vocab_cache_${CACHE_VERSION}_${type}`;
  
  const loadFromCache = (type: string) => {
    try {
      const cached = localStorage.getItem(getCacheKey(type));
      if (!cached) return null;
      
      const data = JSON.parse(cached);
      const isExpired = Date.now() - data.timestamp > CACHE_TTL_MS;
      
      if (isExpired) {
        localStorage.removeItem(getCacheKey(type));
        return null;
      }
      
      console.log(`[VocabularyManagement] ✅ Loaded from cache: ${type} (${data.words?.length || 0} words, ${data.days?.length || 0} days)`);
      return data;
    } catch (err) {
      console.warn('[VocabularyManagement] Cache load failed:', err);
      return null;
    }
  };
  
  const saveToCache = (type: string, words: SATWord[], days: VocabularyDay[]) => {
    try {
      const data = {
        words,
        days,
        timestamp: Date.now()
      };
      localStorage.setItem(getCacheKey(type), JSON.stringify(data));
      console.log(`[VocabularyManagement] 💾 Saved to cache: ${type}`);
    } catch (err) {
      console.warn('[VocabularyManagement] Cache save failed:', err);
    }
  };

  // Retry helper for transient network errors (cold start, etc.)
  const fetchWithRetry = async (url: string, options: RequestInit, retries = 5, delayMs = 2000): Promise<Response> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeoutId);
        return response;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.warn(`[VocabularyManagement] Fetch attempt ${attempt}/${retries} timed out, retrying in ${delayMs * attempt}ms...`);
        } else {
          console.warn(`[VocabularyManagement] Fetch attempt ${attempt}/${retries} failed (${err.message}), retrying in ${delayMs * attempt}ms...`);
        }
        if (attempt === retries) throw err;
        await new Promise(r => setTimeout(r, delayMs * attempt));
      }
    }
    throw new Error('fetchWithRetry: unreachable');
  };

  // Warm up the edge function on mount to reduce cold start issues
  const serverWarmedUp = useRef(false);
  useEffect(() => {
    if (!serverWarmedUp.current) {
      serverWarmedUp.current = true;
      fetch(`${serverUrl}/health`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      }).catch(() => {});
    }
  }, []);

  // Toggle day expansion
  const toggleDayExpansion = (dayId: number) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dayId)) {
        newSet.delete(dayId);
      } else {
        newSet.add(dayId);
      }
      return newSet;
    });
  };

  // Fetch words and days from Supabase when tab changes
  useEffect(() => {
    fetchVocabularyData();
  }, [activeTab]);

  const fetchVocabularyData = async () => {
    try {
      setError(null);

      // Step 1: Try to load from cache first for instant display
      const cachedData = loadFromCache(activeTab);
      if (cachedData) {
        console.log(`[VocabularyManagement] 🚀 Using cached data for instant display: ${activeTab}`);
        setWords(cachedData.words || []);
        setDays(cachedData.days || []);
        setLoading(false); // Show cached data immediately
      } else {
        setLoading(true);
      }

      // Step 2: Fetch fresh data from server in background
      console.log(`[VocabularyManagement] 🔄 Fetching fresh data from server: ${activeTab}`);
      console.log(`[VocabularyManagement] Server URL: ${serverUrl}/vocabulary/${activeTab}`);

      const headers = {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      };

      // Fetch words and days in parallel with retry for cold start resilience
      const [wordsResponse, daysResponse] = await Promise.all([
        fetchWithRetry(`${serverUrl}/vocabulary/${activeTab}`, { headers }),
        fetchWithRetry(`${serverUrl}/vocabulary-days/${activeTab}`, { headers })
      ]);

      if (!wordsResponse.ok) {
        const errorText = await wordsResponse.text();
        console.error(`[VocabularyManagement] Failed to fetch words. Status: ${wordsResponse.status}, Response: ${errorText}`);
        throw new Error(`Failed to fetch vocabulary words: ${wordsResponse.status} ${errorText}`);
      }

      if (!daysResponse.ok) {
        const errorText = await daysResponse.text();
        console.error(`[VocabularyManagement] Failed to fetch days. Status: ${daysResponse.status}, Response: ${errorText}`);
        throw new Error(`Failed to fetch vocabulary days: ${daysResponse.status} ${errorText}`);
      }

      const wordsData = await wordsResponse.json();
      const daysData = await daysResponse.json();
      
      const freshWords = wordsData.words || [];
      const freshDays = daysData.days || [];
      
      console.log(`[VocabularyManagement] ✅ Fetched fresh data: ${freshWords.length} words, ${freshDays.length} days for ${activeTab}`);
      
      // Step 3: Update UI with fresh data
      setWords(freshWords);
      setDays(freshDays);
      
      // Step 4: Save to cache for next time
      saveToCache(activeTab, freshWords, freshDays);

    } catch (err) {
      console.error('Error fetching vocabulary data:', err);
      console.error('Error details:', {
        message: err.message,
        serverUrl,
        activeTab,
        projectId,
        publicAnonKey: publicAnonKey ? '***' + publicAnonKey.slice(-10) : 'undefined'
      });
      setError(err.message || 'Failed to fetch data from server');
      // Fallback to props if provided
      if (propsWords) setWords(propsWords);
      if (propsDays) setDays(propsDays);
    } finally {
      setLoading(false);
    }
  };

  // Group words by day - Use stored order without shuffling
  const wordsByDay = useMemo(() => {
    const grouped: { [key: number]: SATWord[] } = {};
    
    // For custom, etymology, and toefl-easy tabs, use dayNumber field (unlimited words per day)
    if (activeTab === 'custom' || activeTab === 'etymology' || activeTab === 'toefl-easy') {
      // Initialize all days with empty arrays
      for (let day = 1; day <= days.length; day++) {
        grouped[day] = [];
      }
      
      // Group words by their dayNumber field
      words.forEach(word => {
        const dayNum = (word as any).dayNumber || 1; // Default to DAY 1 if no dayNumber
        if (!grouped[dayNum]) {
          grouped[dayNum] = [];
        }
        grouped[dayNum].push(word);
      });
    } else {
      // For toefl-hard tab, use index-based grouping (60 words per day)
      const wordsPerDay = 60;
      const totalDays = Math.ceil(words.length / wordsPerDay);
      
      for (let day = 1; day <= Math.max(totalDays, days.length); day++) {
        const startIndex = (day - 1) * wordsPerDay;
        const endIndex = startIndex + wordsPerDay;
        grouped[day] = words.slice(startIndex, endIndex);
      }
    }
    
    return grouped;
  }, [words, days, activeTab]);

  const currentDayWords = wordsByDay[selectedDay] || [];

  // Helper to get the display name for the selected day
  const selectedDayName = days.find(d => d.id === selectedDay)?.name || `DAY ${selectedDay}`;

  // Filter words by search query
  const filteredWords = useMemo(() => {
    if (!searchQuery.trim()) return currentDayWords;
    
    const query = searchQuery.toLowerCase();
    return currentDayWords.filter(word =>
      word.english.toLowerCase().includes(query) ||
      word.korean.toLowerCase().includes(query) ||
      word.definition.toLowerCase().includes(query) ||
      word.synonyms.toLowerCase().includes(query)
    );
  }, [currentDayWords, searchQuery]);

  const handleAddWord = async () => {
    if (!formData.english || !formData.korean) {
      alert('영어 단어와 한글 뜻은 필수입니다.');
      return;
    }

    try {
      const normalizedWord = normalizeWord(formData);
      const response = await fetch(`${serverUrl}/vocabulary/${activeTab}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ word: normalizedWord, day: selectedDay })
      });

      if (!response.ok) {
        throw new Error('Failed to add word');
      }

      const data = await response.json();
      setWords(data.words);
      resetForm();
      alert('단어가 성공적으로 추가되었습니다.');
    } catch (error) {
      console.error('Error adding word:', error);
      alert('단어 추가 중 오류가 발생했습니다.');
    }
  };

  const handleUpdateWord = async () => {
    if (!editingWord || !formData.english || !formData.korean) {
      alert('영어 단어와 한글 뜻은 필수입니다.');
      return;
    }

    try {
      const normalizedNewWord = normalizeWord(formData);
      const normalizedOldWord = normalizeWord(editingWord);
      const response = await fetch(`${serverUrl}/vocabulary/${activeTab}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ oldWord: normalizedOldWord, newWord: normalizedNewWord, day: selectedDay })
      });

      if (!response.ok) {
        throw new Error('Failed to update word');
      }

      const data = await response.json();
      setWords(data.words);
      resetForm();
      alert('단어가 성공적으로 수정되었습니다.');
    } catch (error) {
      console.error('Error updating word:', error);
      alert('단어 수정 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteWord = async (word: SATWord) => {
    if (!confirm(`"${word.english}"를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const normalizedWord = normalizeWord(word);
      console.log('[CLIENT] Deleting word:', normalizedWord);
      console.log('[CLIENT] Selected day:', selectedDay);
      
      const response = await fetch(`${serverUrl}/vocabulary/${activeTab}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ word: normalizedWord, day: selectedDay })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[CLIENT] Delete failed:', errorData);
        throw new Error(errorData.details || errorData.error || 'Failed to delete word');
      }

      const data = await response.json();
      setWords(data.words);
      alert('단어가 성공적으로 삭제되었습니다.');
    } catch (error) {
      console.error('Error deleting word:', error);
      alert(`단어 삭제 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  const startEdit = (word: SATWord, index?: number) => {
    setEditingWord(word);
    setEditingWordIndex(index ?? null);
    setFormData({ ...word });
    setShowAddForm(false);
    setTimeout(() => {
      editFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  const resetForm = () => {
    setFormData({
      english: '',
      korean: '',
      definition: '',
      synonyms: ''
    });
    setEditingWord(null);
    setEditingWordIndex(null);
    setShowAddForm(false);
  };

  const handleAddDay = async () => {
    if (!newDayName.trim()) {
      alert('날짜 이름은 필수입니다.');
      return;
    }

    try {
      const response = await fetch(`${serverUrl}/vocabulary-days/${activeTab}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ dayName: newDayName })
      });

      if (!response.ok) {
        throw new Error('Failed to add day');
      }

      const data = await response.json();
      setDays(data.days);
      setNewDayName('');
      setShowAddDayForm(false);
      alert('날짜가 성공적으로 추가되었습니다.');
    } catch (error) {
      console.error('Error adding day:', error);
      alert('날짜 추가 중 오류가 발생했습니다.');
    }
  };

  const handleUpdateDay = async () => {
    if (!editingDayId || !editingDayName.trim()) {
      alert('날짜 이름은 필수입니다.');
      return;
    }

    try {
      const response = await fetch(`${serverUrl}/vocabulary-days/${activeTab}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ dayId: editingDayId, newName: editingDayName })
      });

      if (!response.ok) {
        throw new Error('Failed to update day');
      }

      const data = await response.json();
      setDays(data.days);
      setEditingDayId(null);
      setEditingDayName('');
      setShowAddDayForm(false);
      alert('날짜가 성공적으로 수정되었습니다.');
    } catch (error) {
      console.error('Error updating day:', error);
      alert('날짜 수정 중 오류가 발생했습니다.');
    }
  };

  const startEditDay = (dayId: number, dayName: string) => {
    setEditingDayId(dayId);
    setEditingDayName(dayName);
    setShowAddDayForm(true);
  };

  const handleDeleteDay = async (dayId: number) => {
    if (!confirm(`이 날짜를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(`${serverUrl}/vocabulary-days/${activeTab}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ dayId })
      });

      if (!response.ok) {
        throw new Error('Failed to delete day');
      }

      const data = await response.json();
      setDays(data.days);
      setWords(data.words);
      alert('날짜가 성공적으로 삭제되었습니다.');
    } catch (error) {
      console.error('Error deleting day:', error);
      alert('날짜 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleClearAllDayWords = async () => {
    if (!confirm(`${selectedDayName}의 모든 단어(${currentDayWords.length}개)를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      const response = await fetch(`${serverUrl}/vocabulary-clear-day/${activeTab}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ day: selectedDay })
      });

      if (!response.ok) {
        throw new Error('Failed to clear day words');
      }

      const data = await response.json();
      setWords(data.words);
      alert(`${selectedDayName}의 모든 단어가 삭제되었습니다.`);
    } catch (error) {
      console.error('Error clearing day words:', error);
      alert('DAY 단어 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        try {
          let parsedWords: SATWord[] = [];
          if (file.name.endsWith('.json')) {
            parsedWords = JSON.parse(content);
          } else if (file.name.endsWith('.txt')) {
            const lines = content.split('\n').filter(line => line.trim());
            parsedWords = lines.map(line => {
              // Use regex to split by one or more tabs OR two or more spaces
              const parts = line.split(/\t+|\s{2,}/);
              const [english, korean, definition = '', synonyms = ''] = parts;
              return { english: english || '', korean: korean || '', definition, synonyms };
            }).filter(word => word.english && word.korean);
          }
          
          // Normalize all words before uploading
          const normalizedWords = parsedWords.map(word => normalizeWord(word));
          
          // Upload each word to Supabase
          for (const word of normalizedWords) {
            try {
              const response = await fetch(`${serverUrl}/vocabulary/${activeTab}`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${publicAnonKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ word, day: selectedDay })
              });
              
              if (!response.ok) {
                console.error(`Failed to add word: ${word.english}`);
              }
            } catch (error) {
              console.error(`Error adding word ${word.english}:`, error);
            }
          }
          
          // Refresh data after uploading
          await fetchVocabularyData();
          alert(`${normalizedWords.length}개 단어가 성공적으로 업로드되었습니다.`);
        } catch (error) {
          console.error('File upload error:', error);
          alert('파일 형식이 올바르지 않습니다. JSON 또는 텍스트 형식의 파일을 업로드해주세요.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDownload = () => {
    const wordsToDownload = currentDayWords.map(word => ({
      english: word.english,
      korean: word.korean,
      definition: word.definition,
      synonyms: word.synonyms
    }));
    const blob = new Blob([JSON.stringify(wordsToDownload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vocabulary_day_${selectedDay}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle bulk upload from text area
  const handleBulkUpload = async () => {
    if (!bulkUploadText.trim()) {
      alert('업로드할 단어를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      
      if (bulkUploadMode === 'single-day') {
        // Single day upload (with auto-split if > 40 words)
        const lines = bulkUploadText.split('\n').filter(line => line.trim());
        const parsedWords: SATWord[] = lines.map(line => {
          // Use regex to split by one or more tabs OR two or more spaces
          const parts = line.split(/\t+|\s{2,}/);
          const [english, korean, definition = '', synonyms = ''] = parts;
          return { english: english?.trim() || '', korean: korean?.trim() || '', definition: definition?.trim() || '', synonyms: synonyms?.trim() || '' };
        }).filter(word => word.english && word.korean);

        if (parsedWords.length === 0) {
          alert('유효한 단어가 없습니다. 형식을 확인해주세요.');
          return;
        }

        // Normalize all words before uploading
        const normalizedWords = parsedWords.map(word => normalizeWord(word));

        // For custom, etymology, and toefl-easy tabs, upload all words to the selected day without splitting
        if (activeTab === 'custom' || activeTab === 'etymology' || activeTab === 'toefl-easy') {
          // No limit - upload all words to the target day
          const response = await fetch(`${serverUrl}/vocabulary-bulk/${activeTab}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              words: normalizedWords,
              targetDay: bulkUploadTargetDay,
              replaceExisting
            })
          });

          if (!response.ok) {
            throw new Error('Failed to bulk upload words');
          }

          const data = await response.json();
          setWords(data.words);
          alert(`${data.uploadedCount}개 단어가 DAY ${bulkUploadTargetDay}에 성공적으로 업로드되었습니다.`);
          setBulkUploadText('');
          setShowBulkUpload(false);
        } else {
          // For TOEFL tabs: vol.2 (toefl-hard) uses 60 words per day, others use 40
          const wordsPerDay = activeTab === 'toefl-hard' ? 60 : 40;

          // Check if more than wordsPerDay - if so, split into multiple days
          if (normalizedWords.length > wordsPerDay) {
            // Auto-split into multiple days
            const wordsByDay: { [key: number]: SATWord[] } = {};
            let currentDay = bulkUploadTargetDay;
            
            for (let i = 0; i < normalizedWords.length; i += wordsPerDay) {
              wordsByDay[currentDay] = normalizedWords.slice(i, i + wordsPerDay);
              currentDay++;
            }

            // Use multi-day endpoint
            const response = await fetch(`${serverUrl}/vocabulary-bulk-multi/${activeTab}`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${publicAnonKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ wordsByDay, replaceExisting })
            });

            if (!response.ok) {
              throw new Error('Failed to bulk upload words');
            }

            const data = await response.json();
            await fetchVocabularyData();
            const dayCount = Object.keys(wordsByDay).length;
            const dayRange = dayCount > 1 ? `DAY ${bulkUploadTargetDay} ~ DAY ${bulkUploadTargetDay + dayCount - 1}` : `DAY ${bulkUploadTargetDay}`;
            alert(`${normalizedWords.length}개 단어가 ${dayRange}에 자동으로 분할되어 업로드되었습니다. (${wordsPerDay}개씩 ${dayCount}개 DAY)`);
            setBulkUploadText('');
            setShowBulkUpload(false);
          } else {
            // wordsPerDay or less - upload to single day
            const response = await fetch(`${serverUrl}/vocabulary-bulk/${activeTab}`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${publicAnonKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                words: normalizedWords,
                targetDay: bulkUploadTargetDay,
                replaceExisting
              })
            });

            if (!response.ok) {
              throw new Error('Failed to bulk upload words');
            }

            const data = await response.json();
            setWords(data.words);
            alert(`${data.uploadedCount}개 단어가 DAY ${bulkUploadTargetDay}에 성공적으로 업로드되었습니다.`);
            setBulkUploadText('');
            setShowBulkUpload(false);
          }
        }
      } else {
        // Multi-day upload
        const lines = bulkUploadText.split('\n').filter(line => line.trim());
        const wordsByDay: { [key: number]: SATWord[] } = {};
        
        // Check if first line contains DAY range (e.g., "DAY 10-DAY 20" or "DAY 10 - 20")
        const firstLine = lines[0];
        const rangeMatch = firstLine.match(/^DAY\s*(\d+)\s*-\s*(?:DAY\s*)?(\d+)/i);
        
        if (rangeMatch) {
          // DAY range mode: distribute words per DAY
          const startDay = parseInt(rangeMatch[1]);
          const endDay = parseInt(rangeMatch[2]);
          
          if (startDay > endDay) {
            alert('시작 DAY가 종료 DAY보다 클 수 없습니다.');
            return;
          }
          
          // Parse all words from lines (skip the first range line)
          const allWords: SATWord[] = [];
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            const parts = line.split(/\t+|\s{2,}/);
            const [english, korean, definition = '', synonyms = ''] = parts;
            if (english?.trim() && korean?.trim()) {
              const word = {
                english: english.trim(),
                korean: korean.trim(),
                definition: definition.trim(),
                synonyms: synonyms.trim()
              };
              allWords.push(normalizeWord(word));
            }
          }
          
          if (allWords.length === 0) {
            alert('업로드할 단어가 없습니다.');
            return;
          }
          
          // No limit for custom, etymology, toefl-easy; 60 for vol.2
          const wordsPerDay = 
            activeTab === 'custom' || activeTab === 'etymology' || activeTab === 'toefl-easy' ? 10000 :
            60;
          
          // Distribute words
          let wordIndex = 0;
          for (let day = startDay; day <= endDay; day++) {
            wordsByDay[day] = [];
            for (let i = 0; i < wordsPerDay && wordIndex < allWords.length; i++) {
              wordsByDay[day].push(allWords[wordIndex]);
              wordIndex++;
            }
          }
          
          console.log(`DAY range mode: ${startDay}-${endDay}, Total words: ${allWords.length}, Distributed across ${Object.keys(wordsByDay).length} days`);
          
        } else {
          // Original mode: DAY markers in text
          let currentDay: number | null = null;
          
          for (const line of lines) {
            // Check if line starts with "DAY" or "Day" to identify day marker
            const dayMatch = line.match(/^DAY\s*(\d+)/i) || line.match(/^Day\s*(\d+)/i) || line.match(/^(\d+)일차/);
            
            // Check if line indicates to skip/omit the day
            const skipMatch = line.match(/^DAY\s*(\d+)\s*(생략|SKIP|skip)/i) || 
                             line.match(/^Day\s*(\d+)\s*(생략|SKIP|skip)/i) || 
                             line.match(/^(\d+)일차\s*(생략|SKIP|skip)/);
            
            if (skipMatch) {
              // Mark this day for skipping (will clear all words)
              currentDay = parseInt(skipMatch[1]);
              if (!wordsByDay[currentDay]) {
                wordsByDay[currentDay] = []; // Empty array indicates skip
              }
              console.log(`DAY ${currentDay} marked for skipping`);
            } else if (dayMatch) {
              currentDay = parseInt(dayMatch[1]);
              if (!wordsByDay[currentDay]) {
                wordsByDay[currentDay] = [];
              }
            } else if (currentDay !== null) {
              // Parse word line - Use regex to split by one or more tabs OR two or more spaces
              const parts = line.split(/\t+|\s{2,}/);
              const [english, korean, definition = '', synonyms = ''] = parts;
              if (english?.trim() && korean?.trim()) {
                const word = {
                  english: english.trim(),
                  korean: korean.trim(),
                  definition: definition.trim(),
                  synonyms: synonyms.trim()
                };
                wordsByDay[currentDay].push(normalizeWord(word));
              }
            }
          }
        }

        if (Object.keys(wordsByDay).length === 0) {
          alert('유효한 DAY 마커 또는 DAY 범위가 없습니다. "DAY 1" 또는 "DAY 10-DAY 20" 형식으로 표시해주세요.');
          return;
        }

        const response = await fetch(`${serverUrl}/vocabulary-bulk-multi/${activeTab}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ wordsByDay })
        });

        if (!response.ok) {
          throw new Error('Failed to multi-day bulk upload words');
        }

        const data = await response.json();
        setWords(data.words);
        
        // Count skipped days and uploaded days
        const skippedDays = Object.entries(wordsByDay).filter(([_, words]) => words.length === 0).length;
        const uploadedDays = Object.keys(wordsByDay).length - skippedDays;
        
        let message = `총 ${data.totalUploaded}개 단어가 ${uploadedDays}개의 DAY에 성공적으로 업로드되었습니다.`;
        if (skippedDays > 0) {
          message += ` (${skippedDays}개 DAY 생략됨)`;
        }
        alert(message);
        setBulkUploadText('');
        setShowBulkUpload(false);
      }

      await fetchVocabularyData();
    } catch (error) {
      console.error('Error bulk uploading words:', error);
      alert('대량 업로드 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Normalize existing data in the database (admin function)
  const handleNormalizeData = async () => {
    if (!confirm(`Normalize all words in the current tab (${activeTab})? This will remove line breaks and unnecessary spaces.`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${serverUrl}/vocabulary-normalize/${activeTab}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to normalize data');
      }

      const data = await response.json();
      setWords(data.words);
      alert(`성공적으로 ${data.words.length}개 단어가 정규화되었습니다.`);
    } catch (error) {
      console.error('Error normalizing data:', error);
      alert('데이터 정규화 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2d7a7c] to-[#1e6b73] rounded-lg p-6 text-white">
        <h2 className="text-2xl mb-2">Vocabulary Management</h2>
        <p className="text-white/90">
          전체 단어: {words.length}개 (50일 × 40단어)
        </p>
        
        {/* Vocabulary Type Tabs */}
        <div className="flex gap-2 border-b-2 border-gray-200 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('toefl-easy')}
            className={`px-4 py-2 font-bold transition-all whitespace-nowrap ${
              activeTab === 'toefl-easy'
                ? 'border-b-4 -mb-0.5 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            style={{
              borderColor: activeTab === 'toefl-easy' ? '#3B82F6' : 'transparent',
            }}
          >
            <span className="hidden sm:inline">TOEFL 어휘 학습 vol.1</span>
            <span className="sm:hidden">어휘 vol.1</span>
          </button>
          <button
            onClick={() => setActiveTab('toefl-hard')}
            className={`px-4 py-2 font-bold transition-all whitespace-nowrap ${
              activeTab === 'toefl-hard'
                ? 'border-b-4 -mb-0.5 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            style={{
              borderColor: activeTab === 'toefl-hard' ? '#3B82F6' : 'transparent',
            }}
          >
            <span className="hidden sm:inline">TOEFL 어휘 학습 vol.2</span>
            <span className="sm:hidden">어휘 vol.2</span>
          </button>
          <button
            onClick={() => setActiveTab('etymology')}
            className={`px-4 py-2 font-bold transition-all whitespace-nowrap ${
              activeTab === 'etymology'
                ? 'border-b-4 -mb-0.5 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            style={{
              borderColor: activeTab === 'etymology' ? '#3B82F6' : 'transparent',
            }}
          >
            <span className="hidden sm:inline">기출단어</span>
            <span className="sm:hidden">기출</span>
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-4 py-2 font-bold transition-all whitespace-nowrap ${
              activeTab === 'custom'
                ? 'border-b-4 -mb-0.5 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            style={{
              borderColor: activeTab === 'custom' ? '#3B82F6' : 'transparent',
            }}
          >
            <span className="hidden sm:inline">참고서 영단어</span>
            <span className="sm:hidden">참고서</span>
          </button>
        </div>
        
        {/* Tab Description */}
        <p className="text-white/80 text-sm mt-2">
          {activeTab === 'toefl-easy' 
            ? 'TOEFL 필수 어휘 50일 과정을 관리합니다. (vol.1)' 
            : activeTab === 'toefl-hard'
            ? 'TOEFL 고급 어휘 50일 과정을 관리합니다. (vol.2)'
            : activeTab === 'custom'
            ? '사용자 정의 참고서 영단어를 관리합니다.'
            : '단어의 기출 어휘를 관리합니다.'}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-red-800 mb-1">서버 연결 오류</h4>
              <p className="text-sm text-red-700">{error}</p>
              <p className="text-xs text-red-600 mt-2">
                서버 URL: {serverUrl}
              </p>
              <Button
                onClick={fetchVocabularyData}
                size="sm"
                className="mt-3 bg-red-600 text-white hover:bg-red-700"
              >
                다시 시도
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Day Selection */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-800">DAY 선택</h3>
          <Button
            onClick={() => {
              setEditingDayId(null);
              setEditingDayName('');
              setNewDayName('');
              setShowAddDayForm(true);
            }}
            size="sm"
            className="bg-gradient-to-r from-[#e67e22] to-[#f39c12] text-white hover:from-[#d35400] hover:to-[#e67e22]"
          >
            <Plus className="w-4 h-4 mr-2" />
            DAY 추가
          </Button>
        </div>
        <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-2">
          {days.map((day) => {
            const dayWordCount = wordsByDay[day.id]?.length || 0;
            return (
              <div key={day.id} className="relative group">
                <button
                  onClick={() => setSelectedDay(day.id)}
                  className={`w-full px-3 py-2 rounded-lg font-bold text-sm transition-all ${
                    selectedDay === day.id
                      ? 'bg-gradient-to-r from-[#2d7a7c] to-[#1e6b73] text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                  title={`${day.name} (${dayWordCount}개)`}
                >
                  <div>{day.name.length > 8 ? day.name.substring(0, 8) + '...' : day.name}</div>
                  <div className="text-xs opacity-75">({dayWordCount})</div>
                  </button>
                <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditDay(day.id, day.name);
                    }}
                    className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 shadow-md"
                    title="수정"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDay(day.id);
                    }}
                    className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-md"
                    title="삭제"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search and Add Button */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="영어, 한글, 뜻, 동의어로 검색..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
            />
          </div>
          <Button
            onClick={() => {
              resetForm();
              setShowAddForm(true);
              setTimeout(() => {
                addFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
            }}
            className="bg-gradient-to-r from-[#e67e22] to-[#f39c12] text-white hover:from-[#d35400] hover:to-[#e67e22] shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            단어 추가
          </Button>
        </div>
      </div>

      {/* Add Form (only for adding new words, not editing) */}
      <>
        {showAddForm && !editingWord && (
          <div
            ref={addFormRef}
            className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 animate-[fadeSlideUp_0.3s_ease-out]"
          >
            <h3 className="text-xl font-medium text-gray-800 mb-4">
              {`단어 추가 - ${selectedDayName}`}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  영어 단어 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.english}
                  onChange={(e) => setFormData({ ...formData, english: e.target.value })}
                  placeholder="예: accomplish"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  한글 뜻 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.korean}
                  onChange={(e) => setFormData({ ...formData, korean: e.target.value })}
                  placeholder="예: 성취하다"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  영영풀이 (Definition)
                </label>
                <textarea
                  value={formData.definition}
                  onChange={(e) => setFormData({ ...formData, definition: e.target.value })}
                  placeholder="예: to succeed in doing or completing something"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  동의어 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  value={formData.synonyms}
                  onChange={(e) => setFormData({ ...formData, synonyms: e.target.value })}
                  placeholder="예: achieve, complete, fulfill"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-300 text-gray-700 hover:bg-gray-400"
                >
                  <X className="w-4 h-4 mr-2" />
                  취소
                </Button>
                <Button
                  type="button"
                  onClick={handleAddWord}
                  className="bg-gradient-to-r from-[#2d7a7c] to-[#1e6b73] text-white hover:from-[#1e6b73] hover:to-[#005f61]"
                >
                  <Save className="w-4 h-4 mr-2" />
                  추가
                </Button>
              </div>
            </div>
          </div>
        )}
      </>

      {/* Add/Edit Day Form */}
      <>
        {showAddDayForm && (
          <div
            className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 animate-[fadeSlideUp_0.3s_ease-out]"
          >
            <h3 className="text-xl font-medium text-gray-800 mb-4">
              {editingDayId ? `날짜 수정` : `날짜 추가`}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  날짜 이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingDayId ? editingDayName : newDayName}
                  onChange={(e) => editingDayId ? setEditingDayName(e.target.value) : setNewDayName(e.target.value)}
                  placeholder="예: DAY 1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button
                  type="button"
                  onClick={() => {
                    setEditingDayId(null);
                    setEditingDayName('');
                    setNewDayName('');
                    setShowAddDayForm(false);
                  }}
                  className="bg-gray-300 text-gray-700 hover:bg-gray-400"
                >
                  <X className="w-4 h-4 mr-2" />
                  취소
                </Button>
                <Button
                  type="button"
                  onClick={editingDayId ? handleUpdateDay : handleAddDay}
                  className="bg-gradient-to-r from-[#2d7a7c] to-[#1e6b73] text-white hover:from-[#1e6b73] hover:to-[#005f61]"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingDayId ? '수정' : '추가'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </>

      {/* Words List */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 sm:p-6">
        <div 
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-4 cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded-lg transition-colors"
          onClick={() => toggleDayExpansion(selectedDay)}
        >
          <div className="flex items-center gap-2 min-w-0">
            {expandedDays.has(selectedDay) ? (
              <ChevronDown className="w-5 h-5 text-gray-600 shrink-0" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-600 shrink-0" />
            )}
            <h3 className="text-base sm:text-xl font-medium text-gray-800 truncate">
              {selectedDayName} 단어 목록
              <span className="ml-2 text-xs sm:text-sm text-gray-600">
                {activeTab === 'toefl-hard'
                  ? `(${currentDayWords.length}/60개)`
                  : `(${currentDayWords.length}개)`
                }
              </span>
            </h3>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 pl-7 sm:pl-0" onClick={(e) => e.stopPropagation()}>
            {currentDayWords.length > 0 && (
              <Button
                size="sm"
                onClick={handleClearAllDayWords}
                className="bg-red-500 text-white hover:bg-red-600 text-xs sm:text-sm shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">DAY 전체 삭제</span>
                <span className="sm:hidden">전체 삭제</span>
              </Button>
            )}
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600 whitespace-nowrap">
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>총 {currentDayWords.length}개 단어</span>
            </div>
          </div>
        </div>

        {expandedDays.has(selectedDay) && (
          <>
            {filteredWords.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p>
                  {searchQuery ? '검색 결과가 없습니다.' : '이 날짜에 단어가 없습니다.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
            {filteredWords.map((word, index) => (
              <div key={`${word.english}-${index}`}>
                <div
                  className={`border rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors animate-[fadeIn_0.3s_ease-out] ${editingWordIndex === index ? 'border-[#2d7a7c] bg-teal-50/30' : 'border-gray-200'}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                        <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-[#2d7a7c] text-white rounded-full text-xs sm:text-sm font-bold shrink-0">
                          {index + 1}
                        </span>
                        <h4 className="text-base sm:text-xl font-bold text-gray-800 break-all">{word.english}</h4>
                        <span className="text-sm sm:text-lg text-gray-600 break-all">{word.korean}</span>
                        {/* Mobile action buttons inline */}
                        <div className="flex gap-1.5 sm:hidden ml-auto">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => editingWordIndex === index ? resetForm() : startEdit(word, index)}
                            className={`h-7 w-7 p-0 ${editingWordIndex === index ? "border-gray-400 text-gray-500 hover:bg-gray-100" : "border-blue-500 text-blue-500 hover:bg-blue-50"}`}
                          >
                            {editingWordIndex === index ? <X className="w-3.5 h-3.5" /> : <Edit className="w-3.5 h-3.5" />}
                          </Button>
                          <Button
                            size="sm"
                            className="bg-red-500 text-white hover:bg-red-600 h-7 w-7 p-0"
                            onClick={() => handleDeleteWord(word)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                      
                      {word.definition && (
                        <p className="text-xs sm:text-sm text-gray-700 mb-2 pl-0 sm:pl-16">
                          <span className="font-medium">영영풀이:</span> {word.definition}
                        </p>
                      )}
                      
                      {word.synonyms && (
                        <p className="text-xs sm:text-sm text-gray-600 pl-0 sm:pl-16">
                          <span className="font-medium">동의어:</span>{' '}
                          {word.synonyms.split(',').map((syn, i) => (
                            <span key={i} className="inline-block px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-100 text-blue-700 rounded mr-1 mb-1 text-xs sm:text-sm">
                              {syn.trim()}
                            </span>
                          ))}
                        </p>
                      )}
                    </div>
                    
                    {/* Desktop action buttons */}
                    <div className="hidden sm:flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => editingWordIndex === index ? resetForm() : startEdit(word, index)}
                        className={editingWordIndex === index ? "border-gray-400 text-gray-500 hover:bg-gray-100" : "border-blue-500 text-blue-500 hover:bg-blue-50"}
                      >
                        {editingWordIndex === index ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        className="bg-red-500 text-white hover:bg-red-600"
                        onClick={() => handleDeleteWord(word)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Inline Edit Form - appears right below the word being edited */}
                <>
                  {editingWord && editingWordIndex === index && (
                    <div
                      ref={editFormRef}
                      className="overflow-hidden animate-[fadeSlideUp_0.2s_ease-out]"
                    >
                      <div className="bg-white rounded-b-lg shadow-lg border border-t-0 border-[#2d7a7c] p-6 -mt-1">
                        <h3 className="text-lg font-medium text-gray-800 mb-4">
                          {`단어 수정 - ${selectedDayName}`}
                        </h3>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              영어 단어 <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={formData.english}
                              onChange={(e) => setFormData({ ...formData, english: e.target.value })}
                              placeholder="예: accomplish"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              한글 뜻 <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={formData.korean}
                              onChange={(e) => setFormData({ ...formData, korean: e.target.value })}
                              placeholder="예: 성취하다"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              영영풀이 (Definition)
                            </label>
                            <textarea
                              value={formData.definition}
                              onChange={(e) => setFormData({ ...formData, definition: e.target.value })}
                              placeholder="예: to succeed in doing or completing something"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                              rows={3}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              동의어 (쉼표로 구분)
                            </label>
                            <input
                              type="text"
                              value={formData.synonyms}
                              onChange={(e) => setFormData({ ...formData, synonyms: e.target.value })}
                              placeholder="예: achieve, complete, fulfill"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                            />
                          </div>

                          <div className="flex gap-3 justify-end pt-4 border-t">
                            <Button
                              type="button"
                              onClick={resetForm}
                              className="bg-gray-300 text-gray-700 hover:bg-gray-400"
                            >
                              <X className="w-4 h-4 mr-2" />
                              취소
                            </Button>
                            <Button
                              type="button"
                              onClick={handleUpdateWord}
                              className="bg-gradient-to-r from-[#2d7a7c] to-[#1e6b73] text-white hover:from-[#1e6b73] hover:to-[#005f61]"
                            >
                              <Save className="w-4 h-4 mr-2" />
                              수정
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              </div>
            ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Upload/Download Buttons */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex flex-col gap-4">
          <div className="flex gap-4 items-center flex-wrap">
            <Button
              onClick={handleUpload}
              className="bg-gradient-to-r from-[#e67e22] to-[#f39c12] text-white hover:from-[#d35400] hover:to-[#e67e22] shadow-lg"
            >
              <Upload className="w-5 h-5 mr-2" />
              파일 업로드
            </Button>
            <Button
              onClick={() => {
                setBulkUploadText('');
                setBulkUploadTargetDay(selectedDay);
                setShowBulkUpload(true);
              }}
              className="bg-gradient-to-r from-[#005f61] to-[#2d7a7c] text-white hover:from-[#004a4c] hover:to-[#1e6b73] shadow-lg"
            >
              <FileText className="w-5 h-5 mr-2" />
              대량 업로드 (복사-붙여넣기)
            </Button>
            <Button
              onClick={handleDownload}
              className="bg-gradient-to-r from-[#2d7a7c] to-[#1e6b73] text-white hover:from-[#1e6b73] hover:to-[#005f61] shadow-lg"
            >
              <Download className="w-5 h-5 mr-2" />
              단어 다운로드
            </Button>
            <Button
              onClick={() => setShowUploadGuide(!showUploadGuide)}
              className="bg-gray-600 text-white hover:bg-gray-700 shadow-lg"
            >
              <FileText className="w-5 h-5 mr-2" />
              업로드 가이드
            </Button>
            <Button
              onClick={async () => {
                try {
                  const healthUrl = `${serverUrl}/health`;
                  console.log('Testing server health:', healthUrl);
                  const response = await fetch(healthUrl);
                  const data = await response.json();
                  console.log('Server health response:', data);
                  alert(`서버 상태: ${data.status === 'ok' ? '정상 ✅' : '오류 ❌'}`);
                } catch (error) {
                  console.error('Server health check failed:', error);
                  alert(`서버 연결 실패: ${error.message}`);
                }
              }}
              className="bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
            >
              서버 테스트
            </Button>
            <Button
              onClick={handleNormalizeData}
              className="bg-purple-600 text-white hover:bg-purple-700 shadow-lg"
            >
              <Check className="w-5 h-5 mr-2" />
              데이터 정규화
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json,.txt"
              className="hidden"
            />
          </div>
          
          <p className="text-sm text-gray-600">
            <strong>참고:</strong> 파일 업로드, 대량 업로드(텍스트 복사-붙여넣기), 단�� 다운로드 등을 이용할 수 있습니다. 
            Excel에서 복사한 데이터에 줄바꿈이 포함되어 삭제 오류가 발생하면 <strong className="text-purple-600">데이터 정규화</strong> 버튼을 클릭하세요.
          </p>
        </div>
      </div>

      {/* Bulk Upload Form */}
      <>
        {showBulkUpload && (
          <div
            className="bg-white rounded-lg shadow-lg border-2 border-[#005f61] p-6 animate-[fadeSlideUp_0.3s_ease-out]"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-medium text-gray-800">
                <Upload className="inline w-6 h-6 mr-2 text-[#005f61]" />
                대량 단어 업로드
              </h3>
              <button
                onClick={() => setShowBulkUpload(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Upload Mode Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  업로드 방식
                </label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setBulkUploadMode('single-day')}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                      bulkUploadMode === 'single-day'
                        ? 'border-[#005f61] bg-[#005f61]/10 text-[#005f61] font-bold'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-bold">📝 단일 DAY</div>
                      <div className="text-xs mt-1">하나의 DAY에 여러 단어 한번에</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setBulkUploadMode('multi-day')}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                      bulkUploadMode === 'multi-day'
                        ? 'border-[#005f61] bg-[#005f61]/10 text-[#005f61] font-bold'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-bold">📚 다중 DAY</div>
                      <div className="text-xs mt-1">여러 DAY를 한번에 업로드</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Single Day Options */}
              {bulkUploadMode === 'single-day' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      업로드 대상 DAY
                    </label>
                    <select
                      value={bulkUploadTargetDay}
                      onChange={(e) => setBulkUploadTargetDay(parseInt(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                    >
                      {days.map((day) => (
                        <option key={day.id} value={day.id}>
                          {day.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      업로드 옵션
                    </label>
                    <div className="flex items-center gap-4 mt-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          checked={replaceExisting}
                          onChange={() => setReplaceExisting(true)}
                          className="mr-2"
                        />
                        <span className="text-sm">기존 단어 교체</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          checked={!replaceExisting}
                          onChange={() => setReplaceExisting(false)}
                          className="mr-2"
                        />
                        <span className="text-sm">기존 단어 유지 + 추가</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Text Input Area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  단어 입력 {bulkUploadMode === 'multi-day' && <span className="text-red-500">*(DAY 마커 필요)</span>}
                </label>
                <textarea
                  value={bulkUploadText}
                  onChange={(e) => setBulkUploadText(e.target.value)}
                  placeholder={
                    bulkUploadMode === 'single-day'
                      ? `영어단어[Tab]한글뜻[Tab]영영풀이[Tab]동의어 형식으로 입력하세요.\\n\\n예시:\\naccomplish\\t성취하다\\tto succeed in doing\\tachieve, complete\\naccurate\\t정확한\\tcorrect in all details\\tprecise, exact`
                      : `DAY 마커와 함께 입력하세요:\\n\\nDAY 1\\naccomplish\\t성취하다\\tto succeed in doing\\tachieve, complete\\naccurate\\t정확한\\tcorrect in all details\\tprecise, exact\\n\\nDAY 2\\nadapt\\t적응하다\\tto adjust\\tadjust, modify\\nadequate\\t충분한\\tenough for the purpose\\tsufficient, enough`
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent font-mono text-sm"
                  rows={15}
                />
                <p className="text-xs text-gray-600 mt-2">
                  <strong>팁:</strong> Excel/Word에서 복사한 내용을 그대로 붙여넣을 수 있습니다. 
                  {bulkUploadMode === 'multi-day' && ' 각 DAY 시작 전에 \"DAY 1\", \"DAY 2\" 등으�� 표시하세요.'}
                </p>
              </div>

              {/* Format Examples */}
              <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
                <h4 className="font-bold text-sm text-blue-800 mb-2">
                  📌 입력 형식 예시
                </h4>
                {bulkUploadMode === 'single-day' ? (
                  <div className="bg-white border border-blue-200 rounded p-3 font-mono text-xs overflow-x-auto">
                    <pre className="text-gray-800 whitespace-pre">accomplish\t성취하다\tto succeed in doing or completing something\tachieve, complete, fulfill{`\n`}accurate\t정확한\tcorrect in all details; exact\tprecise, exact, correct{`\n`}adapt\t적응하다\tto adjust to new conditions\tadjust, modify, accommodate</pre>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-white border border-blue-200 rounded p-3 font-mono text-xs overflow-x-auto">
                      <div className="text-xs text-blue-700 mb-1 font-sans">✅ 일반 업로드:</div>
                      <pre className="text-gray-800 whitespace-pre">DAY 1{`\n`}accomplish\t성취하다\tto succeed in doing or completing something\tachieve, complete, fulfill{`\n`}accurate\t정확한\tcorrect in all details; exact\tprecise, exact, correct{`\n`}{`\n`}DAY 2{`\n`}adapt\t적응하다\tto adjust to new conditions\tadjust, modify, accommodate{`\n`}adequate\t충분한\tenough for the purpose\tsufficient, enough</pre>
                    </div>
                    <div className="bg-white border border-orange-300 rounded p-3 font-mono text-xs overflow-x-auto">
                      <div className="text-xs text-orange-700 mb-1 font-sans">🔥 DAY 생략 기능:</div>
                      <pre className="text-gray-800 whitespace-pre">DAY 1{`\n`}accomplish\t성취하다\tto succeed in doing\tachieve{`\n`}{`\n`}DAY 2 생략{`\n`}{`\n`}DAY 3{`\n`}adapt\t적응하다\tto adjust\tadjust</pre>
                      <div className="text-xs text-orange-600 mt-2 font-sans">
                        ※ "DAY 2 생략" 또는 "DAY 2 SKIP"으로 표시하면 해당 DAY의 모든 단어가 삭제됩니다.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button
                  type="button"
                  onClick={() => {
                    setBulkUploadText('');
                    setShowBulkUpload(false);
                  }}
                  className="bg-gray-300 text-gray-700 hover:bg-gray-400"
                >
                  <X className="w-4 h-4 mr-2" />
                  취소
                </Button>
                <Button
                  type="button"
                  onClick={handleBulkUpload}
                  disabled={!bulkUploadText.trim() || loading}
                  className="bg-gradient-to-r from-[#005f61] to-[#2d7a7c] text-white hover:from-[#004a4c] hover:to-[#1e6b73] disabled:opacity-50"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {loading ? '업로드 중...' : '업로드 시작'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </>

      {/* Upload Guide */}
      <>
        {showUploadGuide && (
          <div
            className="bg-white rounded-lg shadow-lg border-2 border-[#e67e22] p-6 animate-[fadeSlideUp_0.3s_ease-out]"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-medium text-gray-800">
                <FileText className="inline w-6 h-6 mr-2 text-[#e67e22]" />
                단어 파일 업로드 가이드
              </h3>
              <button
                onClick={() => setShowUploadGuide(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* JSON Format */}
              <div>
                <h4 className="font-bold text-lg text-gray-800 mb-2 flex items-center">
                  <span className="bg-[#2d7a7c] text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 text-sm">1</span>
                  JSON 형식 (.json)
                </h4>
                <p className="text-sm text-gray-700 mb-3">
                  가장 권장되는 형식입니다. 다음과 같은 구조를 따라야 합니다:
                </p>
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-gray-800">{`[\n  {\n    \"english\": \"accomplish\",\n    \"korean\": \"성취하다\",\n    \"definition\": \"to succeed in doing or completing something\",\n    \"synonyms\": \"achieve, complete, fulfill\"\n  },\n  {\n    \"english\": \"accurate\",\n    \"korean\": \"정확한\",\n    \"definition\": \"correct in all details; exact\",\n    \"synonyms\": \"precise, exact, correct\"\n  },\n  {\n    \"english\": \"adapt\",\n    \"korean\": \"적응하다\",\n    \"definition\": \"to adjust to new conditions\",\n    \"synonyms\": \"adjust, modify, accommodate\"\n  }\n]`}</pre>
                </div>
              </div>

              {/* Text Format */}
              <div>
                <h4 className="font-bold text-lg text-gray-800 mb-2 flex items-center">
                  <span className="bg-[#2d7a7c] text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 text-sm">2</span>
                  텍스트 형식 (.txt)
                </h4>
                <p className="text-sm text-gray-700 mb-3">
                  각 단어는 한 줄에 하나씩, 필드는 탭(Tab)으로 구분합니다:
                </p>
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-gray-800">{`accomplish\t성취하다\tto succeed in doing or completing something\tachieve, complete, fulfill\naccurate\t정확한\tcorrect in all details; exact\tprecise, exact, correct\nadapt\t적응하다\tto adjust to new conditions\tadjust, modify, accommodate`}</pre>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  * 순서: 영어단어 [Tab] 한글뜻 [Tab] 영영풀이 [Tab] 동의어
                </p>
              </div>

              {/* Excel/CSV Guidance */}
              <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
                <h4 className="font-bold text-lg text-blue-800 mb-2">
                  💡 Excel을 사용하는 경우
                </h4>
                <p className="text-sm text-blue-700 mb-2">
                  Excel에서 작업 후 다음 단계를 따라주세요:
                </p>
                <ol className="text-sm text-blue-700 list-decimal list-inside space-y-1">
                  <li>Excel에서 4개 열에 데이터 입력 (영어단어 | 한글뜻 | 영영풀이 | 동의어)</li>
                  <li>모든 셀 선택 → 복사</li>
                  <li>메모장 또는 텍스트 에디터에 붙여넣기</li>
                  <li>.txt 파일로 저장</li>
                  <li>위의 \"단어 업로드\" 버튼 클릭하여 업로드</li>
                </ol>
              </div>

              {/* Word Guidance */}
              <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                <h4 className="font-bold text-lg text-yellow-800 mb-2">
                  💡 Word를 사용하는 경우
                </h4>
                <p className="text-sm text-yellow-700 mb-2">
                  Word에서 작업 후 다음 단계를 따라주세요:
                </p>
                <ol className="text-sm text-yellow-700 list-decimal list-inside space-y-1">
                  <li>Word에서 표 형식으로 데이터 입력 (영어단어 | 한글뜻 | 영영풀이 | 동의어)</li>
                  <li>표의 모든 셀 선택 → 복사</li>
                  <li>메모장에 붙여넣기</li>
                  <li>.txt 파일로 저장</li>
                  <li>위의 \"단어 업로드\" 버튼 클릭하여 업로드</li>
                </ol>
              </div>

              {/* Important Notes */}
              <div className="bg-red-50 border border-red-300 rounded-lg p-4">
                <h4 className="font-bold text-lg text-red-800 mb-2">
                  ⚠️ 주의사항
                </h4>
                <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                  <li>모든 필드는 필수입니다 (최소한 영어단어와 한글뜻은 입력해야 합니다)</li>
                  <li>파일 인코딩은 UTF-8을 권장합니다</li>
                  <li>단어를 업로드하면 현재 선택된 DAY에 추가됩니다</li>
                  <li>DAY당 최대 40개의 단어를 권장합니다</li>
                </ul>
              </div>

              {/* Multi-Day Upload Guide */}
              <div className="bg-green-50 border border-green-300 rounded-lg p-4">
                <h4 className="font-bold text-lg text-green-800 mb-2">
                  📚 다중 DAY 업로드 (대량 업로드 기능)
                </h4>
                <p className="text-sm text-green-700 mb-3">
                  "대량 업로드 (복사-붙여넣기)" 기능을 사용하면 여러 DAY의 단어를 한번에 업로드할 수 있습니다:
                </p>
                <div className="space-y-2">
                  <div className="bg-white border border-green-200 rounded p-3">
                    <p className="text-sm text-green-700 font-bold mb-2">1. 단일 DAY 모드:</p>
                    <p className="text-xs text-green-600 mb-2">선택한 하나의 DAY에 여러 단어를 한번에 업로드</p>
                    <pre className="text-xs font-mono text-gray-700 bg-gray-50 p-2 rounded">accomplish	성취하다	to succeed in doing	achieve, complete
accurate	정확한	correct in all details	precise, exact
adapt	적응하다	to adjust	adjust, modify</pre>
                  </div>
                  
                  <div className="bg-white border border-green-200 rounded p-3">
                    <p className="text-sm text-green-700 font-bold mb-2">2. 다중 DAY 모드:</p>
                    <p className="text-xs text-green-600 mb-2">여러 DAY에 각각 단어를 한번에 업로드 (DAY 마커 사용)</p>
                    <pre className="text-xs font-mono text-gray-700 bg-gray-50 p-2 rounded">DAY 1
accomplish	성취하다	to succeed in doing	achieve, complete
accurate	정확한	correct in all details	precise, exact

DAY 2
adapt	적응하다	to adjust	adjust, modify
adequate	충분한	enough	sufficient, enough

DAY 3
advocate	옹호하다	to support	support, promote</pre>
                  </div>
                  
                  <div className="bg-white border border-blue-200 rounded p-3">
                    <p className="text-sm text-blue-700 font-bold mb-2">🚀 3. DAY 범위 자동 분배 (NEW!):</p>
                    <p className="text-xs text-blue-600 mb-2">
                      DAY 10-DAY 20 형식으로 범위를 지정하면 자동 분배
                      {activeTab === 'toefl-hard' ? ' (vol.2: 60개씩)' : activeTab === 'toefl-easy' ? ' (제한 없음)' : ' (제한 없음)'}
                    </p>
                    <pre className="text-xs font-mono text-gray-700 bg-gray-50 p-2 rounded">DAY 10-DAY 20
accomplish\t성취하다\tto succeed in doing\tachieve, complete
accurate\t정확한\tcorrect in all details\tprecise, exact
adapt\t적응하다\tto adjust\tadjust, modify
(... {activeTab === 'toefl-hard' ? '600' : '500'}개 단어 ...)</pre>
                    <p className="text-xs text-blue-600 mt-2">
                      ※ 첫 번째 줄에 "DAY 10-DAY 20" 또는 "DAY 10 - 20" 형식으로 입력하면 {activeTab === 'toefl-hard' ? '600개 단어를 자동으로 DAY 10부터 DAY 20까지 60개씩 분배합니다.' : '단어를 자동으로 DAY 10부터 DAY 20까지 분배합니다.'}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      💡 {activeTab === 'toefl-hard' ? '단어가 60개 미만이면 해당 DAY까지만 채워지고, 넘으면 다음 DAY로 자동 이동합니다.' : 'DAY당 단어 수 제한 없이 자유롭게 입력할 수 있습니다.'}
                    </p>
                  </div>
                  
                  <div className="bg-white border border-orange-200 rounded p-3">
                    <p className="text-sm text-orange-700 font-bold mb-2">🔥 4. DAY 생략 기능:</p>
                    <p className="text-xs text-orange-600 mb-2">특정 DAY의 모든 단어를 삭제하고 싶을 때 사용</p>
                    <pre className="text-xs font-mono text-gray-700 bg-gray-50 p-2 rounded">DAY 1
accomplish\t성취하다\tto succeed in doing\tachieve, complete

DAY 2 생략

DAY 3
advocate\t옹호하다\tto support\tsupport, promote</pre>
                    <p className="text-xs text-orange-600 mt-2">
                      ※ "DAY 2 생략", "DAY 2 SKIP", "DAY 2 skip" 등으로 표시하면 DAY 2의 모든 단어가 삭제됩니다.
                    </p>
                  </div>
                  
                  <p className="text-xs text-green-600 mt-2">
                    💡 <strong>팁 1:</strong> Excel에서 여러 DAY의 데이터를 준비한 후, 각 DAY 앞에 "DAY 1", "DAY 2" 등을 추가하고 전체를 복사하여 붙여넣으세요!
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    💡 <strong>팁 2:</strong> 대량의 단어를 연속된 DAY에 한번에 넣으려면 "DAY 10-DAY 20" 형식을 사용하세요. 
                    {activeTab === 'toefl-hard' ? ' vol.2는 자동으로 60개씩 분배됩니다!' : ' DAY당 제한 없이 자유롭게 분배됩니다!'}
                  </p>
                </div>
              </div>

              {/* Sample Download Button */}
              <div className="flex gap-3 justify-center pt-4 border-t">
                <Button
                  onClick={() => {
                    const sampleData = [
                      {
                        english: "accomplish",
                        korean: "성취하다",
                        definition: "to succeed in doing or completing something",
                        synonyms: "achieve, complete, fulfill"
                      },
                      {
                        english: "accurate",
                        korean: "정확한",
                        definition: "correct in all details; exact",
                        synonyms: "precise, exact, correct"
                      },
                      {
                        english: "adapt",
                        korean: "적응하다",
                        definition: "to adjust to new conditions",
                        synonyms: "adjust, modify, accommodate"
                      }
                    ];
                    const blob = new Blob([JSON.stringify(sampleData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'sample_vocabulary.json';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  className="bg-gradient-to-r from-[#2d7a7c] to-[#1e6b73] text-white hover:from-[#1e6b73] hover:to-[#005f61]"
                >
                  <Download className="w-4 h-4 mr-2" />
                  샘플 JSON 파일 다운로드
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowUploadGuide(false)}
                  className="bg-gray-300 text-gray-700 hover:bg-gray-400"
                >
                  <X className="w-4 h-4 mr-2" />
                  닫기
                </Button>
              </div>
            </div>
          </div>
        )}
      </>
    </div>
  );
}