import React, { useState, useEffect } from 'react';
import { BrowserRouter, useLocation, useNavigate } from 'react-router';
import imgLogoPng from "figma:asset/8789442c63cae6ce8bee2e41980635b315e3d0a1.png";
import imgImage from "figma:asset/b015191727695c9e8bd91edeb4f1203bfd9cbbf0.png";
import newBannerImage from 'figma:asset/db57c3312386f02546e87bd69c52bd7c8ccf17e0.png';
import newHeaderImage from 'figma:asset/7a77634694d5b4619913a1e06e042c4f51a4a8be.png';
import imgImage1 from "figma:asset/e17945b43c2743639bcbfa961f9b9c7b697fb93e.png";
import imgImage2 from "figma:asset/7615d3db1985346bf3765462a56a60209586cceb.png";
import searchIcon from 'figma:asset/ab6582843d6eb491acced5759e69c588ae59039e.png';
import zooMapImage from 'figma:asset/68cfb904670a085b88221992ab3b674e458ae5d2.png';
import { BookOpen, ClipboardCheck, LayoutGrid, GraduationCap, Clock, Zap, Home, ChevronLeft, ChevronRight } from 'lucide-react';
import { Toaster } from './components/ui/sonner';
import { QuestionUploader } from './components/QuestionUploader';
import { TrainingSection } from './components/TrainingSection';
import { QuestionTypesSection } from './components/QuestionTypesSection';
import { LMSSection, LMSContent } from './components/LMSSection';
import { TPOQuestion, TPOTest } from './components/ContentManagement';
import { AdManagement, Advertisement } from './components/AdManagement';
import { Button } from './components/ui/button';
import { TPOPage } from './components/TPOPage';
import { TestPage } from './components/TestPage';
import { ResizableReadingLayout } from './components/ResizableReadingLayout';
import { ImageWithFallback } from './components/figma/ImageWithFallback';
import { VolumeControl, useVolumeControl } from './components/VolumeControl';
import { SATWord, generateSATWordsForDay } from './components/vocaWordSets';
import { VocabularyDay } from './components/VocabularyManagement';
import { Student, VocabularyScore } from './components/StudentManagement';
import { ListeningM1Wrapper, M1Screen } from './components/ListeningM1Screens';
import { ListeningM2Wrapper, M2Screen } from './components/ListeningM2Wrapper';
import { WritingSectionWrapper, WritingScreen } from './components/WritingSectionWrapper';
import { SpeakingSectionWrapper, SpeakingScreen } from './components/SpeakingSectionWrapper';
import { MobileQuestionNav } from './components/MobileQuestionNav';
import { useTestProgress } from './hooks/useTestProgress';
import { TestProgressRestoreModal } from './components/TestProgressRestoreModal';

import { TPOCard } from './components/TPOCard';
import { TestCard } from './components/TestCard';
import { LandingPage } from './components/LandingPage';
import { LoginForm } from './components/LoginForm';
import { RegistrationForm } from './components/RegistrationForm';
import { LoginPopup } from './components/LoginPopup';
import { RadioOption } from './components/RadioOption';
import { WelcomeLandingPage } from './components/WelcomeLandingPage';
import { HistorySection, TestResult } from './components/HistorySection';
import { ReviewAssistantPanel, ReviewDifficulty, ReviewPatternTrainingRequest, ReviewSection, ReviewVariant } from './components/ReviewAssistantPanel';
import { ReviewTrainingOverlay } from './components/ReviewTrainingOverlay';
import { ShareConfig } from './components/ShareSettings';
import { ReadDailyLifeTemplates, renderDailyLifePassage } from './components/ReadDailyLifeTemplates';
import { isContentLocked } from './utils/subscriptionUtils';
import { SERVER_BASE_URL, getServerHeaders } from './utils/apiConfig';

type TabType = 'Question Types' | 'TPO' | 'Test' | 'History' | 'Training' | 'TOEFL Prep';
type SkillType = 'Listening' | 'Reading' | 'Writing' | 'Speaking' | 'Vocabulary';
type TPORange = 'TPO 1-5';
type TestSetRange = '1-5';
type TestBankType = 'tpo' | 'test' | 'training';
type DeferredDataKey = 'history' | 'questionTypes' | 'training' | 'admin';

function AppContent() {
  // React Router hooks
  const location = useLocation();
  const navigate = useNavigate();
  
  // Volume control
  const { isOpen: isVolumeOpen, buttonRef: volumeButtonRef, toggleVolume, closeVolume } = useVolumeControl();

  // Set document title and favicon on mount
  useEffect(() => {
    document.title = 'AllMyExam - TOEFL';

    // Generate favicon: teal rounded square + white lightning bolt
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Rounded square background with gradient (#00cfe8 → #00a5b8)
      const r = 14;
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.lineTo(64 - r, 0);
      ctx.quadraticCurveTo(64, 0, 64, r);
      ctx.lineTo(64, 64 - r);
      ctx.quadraticCurveTo(64, 64, 64 - r, 64);
      ctx.lineTo(r, 64);
      ctx.quadraticCurveTo(0, 64, 0, 64 - r);
      ctx.lineTo(0, r);
      ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, 0, 64, 64);
      grad.addColorStop(0, '#00cfe8');
      grad.addColorStop(1, '#00a5b8');
      ctx.fillStyle = grad;
      ctx.fill();

      // Bold white lightning bolt (thicker, sharper shape)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(36, 6);
      ctx.lineTo(18, 34);
      ctx.lineTo(29, 34);
      ctx.lineTo(24, 58);
      ctx.lineTo(46, 28);
      ctx.lineTo(35, 28);
      ctx.lineTo(40, 6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link') as HTMLLinkElement;
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.type = 'image/png';
      link.href = canvas.toDataURL('image/png');
    }
  }, []);

  // Landing page state
  const [showLandingPage, setShowLandingPage] = useState(false);
  const [showWelcomePage, setShowWelcomePage] = useState(true);
  
  // Login state
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginFormKey, setLoginFormKey] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInUserName, setLoggedInUserName] = useState<string>(''); // Store logged in user name
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  
  // Registration state
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [registrationFormKey, setRegistrationFormKey] = useState(0);
  
  // Footer visibility state
  const [isFooterVisible, setIsFooterVisible] = useState(true);
  
  // Training interface state (to hide banner)
  const [isInTrainingMode, setIsInTrainingMode] = useState(false);
  
  const [activeTab, setActiveTab] = useState<TabType>('TPO');
  const [activeSkill, setActiveSkill] = useState<SkillType>('Reading');
  const [activeTPORange, setActiveTPORange] = useState<TPORange>('TPO 1-5');
  const [activeTestSetRange, setActiveTestSetRange] = useState<TestSetRange>('1-5');
  const [testBankType, setTestBankType] = useState<TestBankType>('tpo');
  const [showToelfTest, setShowToeflTest] = useState(false);
  const [currentTest, setCurrentTest] = useState<{ tpoNumber: number; section: string } | null>(null);
  
  // Sync state with URL on mount and location change
  useEffect(() => {
    const path = location.pathname;
    const params = new URLSearchParams(location.search);
    
    // Hide welcome page if not on home
    if (path !== '/') {
      setShowWelcomePage(false);
    }
    
    // Map URL to activeTab
    if (path.startsWith('/tpo-tests') || path === '/tpo' || path.startsWith('/tpo/')) {
      setActiveTab('TPO');
      setShowWelcomePage(false);
    } else if (path.startsWith('/specialized-training') || path === '/training') {
      setActiveTab('Training');
      setShowWelcomePage(false);
    } else if (path.startsWith('/question-types')) {
      setActiveTab('Question Types');
      setShowWelcomePage(false);
    } else if (path.startsWith('/history')) {
      setActiveTab('History');
      setShowWelcomePage(false);
    } else if (path.startsWith('/admin') || path.startsWith('/toefl-prep')) {
      setActiveTab('TOEFL Prep');
      setShowWelcomePage(false);
    } else if (path.startsWith('/test')) {
      setActiveTab('Test');
      setShowWelcomePage(false);
    }
    
    // Handle specialized training sub-routes
    if (path.includes('/listening')) {
      setActiveSkill('Listening');
    } else if (path.includes('/reading')) {
      setActiveSkill('Reading');
    } else if (path.includes('/writing')) {
      setActiveSkill('Writing');
    } else if (path.includes('/speaking')) {
      setActiveSkill('Speaking');
    } else if (path.includes('/vocabulary')) {
      setActiveSkill('Vocabulary');
    }
  }, [location]);

  // Show login popup on initial load if not logged in and on a protected tab
  useEffect(() => {
    const protectedTabs: TabType[] = ['TPO', 'Real Test', 'Question Types', 'Training', 'History'];
    // Allow vocabulary training without login
    const isVocabularyPath = location.pathname.includes('/vocabulary');
    if (!isLoggedIn && protectedTabs.includes(activeTab) && !isVocabularyPath) {
      setShowLoginPopup(true);
    }
  }, []); // Only run on mount

  const [showReadingSection, setShowReadingSection] = useState(false);
  const [showFillBlanksTest, setShowFillBlanksTest] = useState(false);
  const [showReadNoticeTest, setShowReadNoticeTest] = useState(false);
  const [showReadNoticeTest2, setShowReadNoticeTest2] = useState(false);
  const [showSocialMediaTest, setShowSocialMediaTest] = useState(false);
  const [showSocialMediaTest2, setShowSocialMediaTest2] = useState(false);
  const [showSocialMediaTest3, setShowSocialMediaTest3] = useState(false);
  const [showModule1Question16, setShowModule1Question16] = useState(false);
  const [showModule1Question17, setShowModule1Question17] = useState(false);
  const [showModule1Question18, setShowModule1Question18] = useState(false);
  const [showModule1Question19, setShowModule1Question19] = useState(false);
  const [showModule1Question20, setShowModule1Question20] = useState(false);
  const [showEndModule1, setShowEndModule1] = useState(false);
  const [showModule1Intro, setShowModule1Intro] = useState(false);
  const [showModule1Details, setShowModule1Details] = useState(false);
  const [showModule2, setShowModule2] = useState(false);
  const [showModule2FillBlanks, setShowModule2FillBlanks] = useState(false);
  const [showModule2Question11, setShowModule2Question11] = useState(false);
  const [showModule2Question12, setShowModule2Question12] = useState(false);
  const [showModule2Question13, setShowModule2Question13] = useState(false);
  const [showModule2Question14, setShowModule2Question14] = useState(false);
  const [showModule2Question15, setShowModule2Question15] = useState(false);
  const [showModule2Question16, setShowModule2Question16] = useState(false);
  const [showModule2Question17, setShowModule2Question17] = useState(false);
  const [showModule2Question18, setShowModule2Question18] = useState(false);
  const [showModule2Question19, setShowModule2Question19] = useState(false);
  const [showModule2Question20, setShowModule2Question20] = useState(false);
  const [showEndModule2, setShowEndModule2] = useState(false);
  const [blankAnswers, setBlankAnswers] = useState<{ [key: number]: string }>({});

  // ── Reading Progress Save/Restore ──
  const readingProgressKey = currentTest
    ? `reading_${testBankType}_${currentTest.tpoNumber}`
    : 'reading_general';

  const {
    savedProgress: readingSavedProgress,
    showRestoreModal: showReadingRestoreModal,
    saveProgress: saveReadingProgress,
    clearProgress: clearReadingProgress,
    restoreProgress: restoreReadingProgress,
    startFresh: startReadingFresh,
  } = useTestProgress({ testType: readingProgressKey, enabled: true });

  // Map current reading screen to string key for progress saving
  const getCurrentReadingScreen = (): string | null => {
    if (showFillBlanksTest) return 'fillBlanks';
    if (showReadNoticeTest) return 'readNotice1';
    if (showReadNoticeTest2) return 'readNotice2';
    if (showSocialMediaTest) return 'socialMedia1';
    if (showSocialMediaTest2) return 'socialMedia2';
    if (showSocialMediaTest3) return 'socialMedia3';
    if (showModule1Question16) return 'q16';
    if (showModule1Question17) return 'q17';
    if (showModule1Question18) return 'q18';
    if (showModule1Question19) return 'q19';
    if (showModule1Question20) return 'q20';
    if (showModule2FillBlanks) return 'm2FillBlanks';
    if (showModule2Question11) return 'm2q11';
    if (showModule2Question12) return 'm2q12';
    if (showModule2Question13) return 'm2q13';
    if (showModule2Question14) return 'm2q14';
    if (showModule2Question15) return 'm2q15';
    if (showModule2Question16) return 'm2q16';
    if (showModule2Question17) return 'm2q17';
    if (showModule2Question18) return 'm2q18';
    if (showModule2Question19) return 'm2q19';
    if (showModule2Question20) return 'm2q20';
    if (showModule2) return 'module2';
    return null;
  };

  // Restore reading screen from saved progress
  const restoreReadingScreen = (screen: string) => {
    const resetAll = () => {
      setShowFillBlanksTest(false); setShowReadNoticeTest(false); setShowReadNoticeTest2(false);
      setShowSocialMediaTest(false); setShowSocialMediaTest2(false); setShowSocialMediaTest3(false);
      setShowModule1Question16(false); setShowModule1Question17(false); setShowModule1Question18(false);
      setShowModule1Question19(false); setShowModule1Question20(false);
      setShowModule2(false); setShowModule2FillBlanks(false);
      setShowModule2Question11(false); setShowModule2Question12(false); setShowModule2Question13(false);
      setShowModule2Question14(false); setShowModule2Question15(false); setShowModule2Question16(false);
      setShowModule2Question17(false); setShowModule2Question18(false); setShowModule2Question19(false);
      setShowModule2Question20(false);
    };
    resetAll();
    const map: Record<string, () => void> = {
      fillBlanks: () => setShowFillBlanksTest(true),
      readNotice1: () => setShowReadNoticeTest(true),
      readNotice2: () => setShowReadNoticeTest2(true),
      socialMedia1: () => setShowSocialMediaTest(true),
      socialMedia2: () => setShowSocialMediaTest2(true),
      socialMedia3: () => setShowSocialMediaTest3(true),
      q16: () => setShowModule1Question16(true),
      q17: () => setShowModule1Question17(true),
      q18: () => setShowModule1Question18(true),
      q19: () => setShowModule1Question19(true),
      q20: () => setShowModule1Question20(true),
      module2: () => setShowModule2(true),
      m2FillBlanks: () => setShowModule2FillBlanks(true),
      m2q11: () => setShowModule2Question11(true),
      m2q12: () => setShowModule2Question12(true),
      m2q13: () => setShowModule2Question13(true),
      m2q14: () => setShowModule2Question14(true),
      m2q15: () => setShowModule2Question15(true),
      m2q16: () => setShowModule2Question16(true),
      m2q17: () => setShowModule2Question17(true),
      m2q18: () => setShowModule2Question18(true),
      m2q19: () => setShowModule2Question19(true),
      m2q20: () => setShowModule2Question20(true),
    };
    map[screen]?.();
    setShowReadingSection(true);
  };

  // Auto-save reading progress when screen changes
  useEffect(() => {
    const screen = getCurrentReadingScreen();
    if (screen) {
      saveReadingProgress({ currentScreen: screen, totalQuestions: 20 });
    }
  }, [showFillBlanksTest, showReadNoticeTest, showReadNoticeTest2, showSocialMediaTest, showSocialMediaTest2, showSocialMediaTest3, showModule1Question16, showModule1Question17, showModule1Question18, showModule1Question19, showModule1Question20, showModule2, showModule2FillBlanks, showModule2Question11, showModule2Question12, showModule2Question13, showModule2Question14, showModule2Question15, showModule2Question16, showModule2Question17, showModule2Question18, showModule2Question19, showModule2Question20]);

  // Listening section states
  const [showReadingIntro, setShowReadingIntro] = useState(false);
  // Listening M1: single state replaces ~27 individual show* states
  const [activeListeningM1Screen, setActiveListeningM1Screen] = useState<M1Screen | null>(null);
  // Listening M2: single state replaces ~20 individual show* states
  const [activeListeningM2Screen, setActiveListeningM2Screen] = useState<M2Screen | null>(null);
  const [showVolumeModal, setShowVolumeModal] = useState(false);
  const [volume, setVolume] = useState(75);
  
  // Writing: single state replaces ~17 individual show* states
  const [activeWritingScreen, setActiveWritingScreen] = useState<WritingScreen | null>(null);
  const [module2BlankAnswers, setModule2BlankAnswers] = useState<{ [key: number]: string }>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [selectedAnswer2, setSelectedAnswer2] = useState<string | null>(null);
  const [selectedAnswer3, setSelectedAnswer3] = useState<string | null>(null);
  const [selectedAnswer4, setSelectedAnswer4] = useState<string | null>(null);
  const [selectedAnswer5, setSelectedAnswer5] = useState<string | null>(null);
  const [selectedAnswer6, setSelectedAnswer6] = useState<string | null>(null);
  const [selectedAnswer7, setSelectedAnswer7] = useState<string | null>(null);
  const [selectedAnswer8, setSelectedAnswer8] = useState<string | null>(null);
  const [selectedAnswer9, setSelectedAnswer9] = useState<string | null>(null);
  const [selectedAnswer10, setSelectedAnswer10] = useState<string | null>(null);
  
  // Speaking: single state replaces ~26 individual show* states
  const [activeSpeakingScreen, setActiveSpeakingScreen] = useState<SpeakingScreen | null>(null);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewTrainingRequest, setReviewTrainingRequest] = useState<ReviewPatternTrainingRequest | null>(null);
  const [currentListeningReviewScreen, setCurrentListeningReviewScreen] = useState<M1Screen | M2Screen | null>(null);
  const [currentWritingReviewScreen, setCurrentWritingReviewScreen] = useState<WritingScreen | null>(null);
  const [currentSpeakingReviewScreen, setCurrentSpeakingReviewScreen] = useState<SpeakingScreen | null>(null);
  
  // LMS Content State
  const [lmsContents, setLmsContents] = useState<LMSContent[]>([]);
  const [tpoTests, setTpoTests] = useState<TPOTest[]>([]);
  const [testTests, setTestTests] = useState<TPOTest[]>([]); // Separate state for Test page
  const [trainingTests, setTrainingTests] = useState<TPOTest[]>([]);
  const [reports, setReports] = useState<TestResult[]>([]); // Reports state
  
  // Question Types & Training Config State (persisted to Supabase)
  const [questionTypesConfig, setQuestionTypesConfig] = useState<any>(null);
  const [trainingConfig, setTrainingConfig] = useState<any>(null);
  const [trainingResults, setTrainingResults] = useState<any[]>([]);
  const [questionTypesResults, setQuestionTypesResults] = useState<any[]>([]);
  
  // Advertisement State
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  
  // TOEFL Prep Password Protection
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isPasswordCorrect, setIsPasswordCorrect] = useState(false);
  const TOEFL_PREP_PASSWORD = 'sw21qa00';
  const APP_CACHE_VERSION = 'v1';
  const APP_CACHE_TTL_MS = 30 * 60 * 1000;
  
  // Advertisements are loaded in the main loadDataFromSupabase useEffect below
  
  // Loading state for Supabase data
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataLoadedSuccessfully, setDataLoadedSuccessfully] = useState(false);
  const [deferredLoadStatus, setDeferredLoadStatus] = useState<Record<DeferredDataKey, 'idle' | 'loading' | 'loaded'>>({
    history: 'idle',
    questionTypes: 'idle',
    training: 'idle',
    admin: 'idle'
  });
  const skipReportsSaveRef = React.useRef(false);
  const skipStudentsSaveRef = React.useRef(false);
  const skipTestResultsSaveRef = React.useRef(false);
  const skipQuestionTypesConfigSaveRef = React.useRef(false);
  const skipTrainingConfigSaveRef = React.useRef(false);
  
  // Mobile detection state
  const [isMobile, setIsMobile] = useState(false);
  
  // Mobile question navigation state - tracks if user is currently solving a question
  const [isInQuestionMode, setIsInQuestionMode] = useState(false);
  
  // Track whether user is in question mode (solving questions from Wrapper components)
  useEffect(() => {
    const inQuestion = !!(
      activeListeningM1Screen ||
      activeListeningM2Screen ||
      activeWritingScreen ||
      activeSpeakingScreen ||
      showReadingSection ||
      showReadingIntro ||
      showModule1Intro ||
      showModule1Details ||
      showFillBlanksTest ||
      showReadNoticeTest ||
      showReadNoticeTest2 ||
      showSocialMediaTest ||
      showSocialMediaTest2 ||
      showSocialMediaTest3 ||
      showModule1Question16 ||
      showModule1Question17 ||
      showModule1Question18 ||
      showModule1Question19 ||
      showModule1Question20 ||
      showEndModule1 ||
      showModule2 ||
      showModule2FillBlanks ||
      showModule2Question11 ||
      showModule2Question12 ||
      showModule2Question13 ||
      showModule2Question14 ||
      showModule2Question15 ||
      showModule2Question16 ||
      showModule2Question17 ||
      showModule2Question18 ||
      showModule2Question19 ||
      showModule2Question20 ||
      showEndModule2
    );
    setIsInQuestionMode(inQuestion);
  }, [
    activeListeningM1Screen, 
    activeListeningM2Screen, 
    activeWritingScreen, 
    activeSpeakingScreen, 
    showReadingSection, 
    showReadingIntro,
    showModule1Intro, 
    showModule1Details, 
    showFillBlanksTest, 
    showReadNoticeTest, 
    showReadNoticeTest2, 
    showSocialMediaTest, 
    showSocialMediaTest2,
    showSocialMediaTest3,
    showModule1Question16,
    showModule1Question17,
    showModule1Question18,
    showModule1Question19,
    showModule1Question20,
    showEndModule1,
    showModule2,
    showModule2FillBlanks,
    showModule2Question11,
    showModule2Question12,
    showModule2Question13,
    showModule2Question14,
    showModule2Question15,
    showModule2Question16,
    showModule2Question17,
    showModule2Question18,
    showModule2Question19,
    showModule2Question20,
    showEndModule2
  ]);
  
  // Share Configuration State
  const [shareConfig, setShareConfig] = useState<ShareConfig>({
    enabled: false,
    wechatEnabled: false,
    smsEnabled: false,
    autoSend: false
  });
  
  // Test Results History State - loaded from Supabase
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  
  // Vocabulary State - Initialize with 2000 words (50 days × 40 words)
  const [vocabularyWords, setVocabularyWords] = useState<SATWord[]>(() => {
    const allWords: SATWord[] = [];
    for (let day = 1; day <= 50; day++) {
      const dayWords = generateSATWordsForDay(day);
      allWords.push(...dayWords);
    }
    return allWords;
  });
  
  // Vocabulary Days State - Initialize with 50 days
  const [vocabularyDays, setVocabularyDays] = useState<VocabularyDay[]>(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      name: `DAY ${i + 1}`
    }));
  });

  // Student Management State
  const [students, setStudents] = useState<Student[]>([]);
  const [vocabularyScores, setVocabularyScores] = useState<VocabularyScore[]>([]);

  // Save students to Supabase whenever they change
  useEffect(() => {
    if (isLoadingData || !dataLoadedSuccessfully || consumeInitialSyncSkip(skipStudentsSaveRef)) return;
    if (students.length === 0) return;
    
    const saveStudents = async () => {
      try {
        const res = await fetch(
          `${SERVER_BASE_URL}/students`,
          {
            method: 'POST',
            headers: {
              ...getServerHeaders(),
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(students)
          }
        );
        if (!res.ok) console.error(`❌ Error saving Students: ${res.status}`);
        else console.log('💾 Saved Students to Supabase');
      } catch (error) {
        console.error('❌ Error saving Students:', error);
      }
    };
    
    saveStudents();
  }, [students, isLoadingData, dataLoadedSuccessfully]);

  // Save test results to Supabase whenever they change
  useEffect(() => {
    if (isLoadingData || !dataLoadedSuccessfully || consumeInitialSyncSkip(skipTestResultsSaveRef)) return;
    
    const saveTestResults = async () => {
      try {
        const res = await fetch(
          `${SERVER_BASE_URL}/test-results`,
          {
            method: 'POST',
            headers: {
              ...getServerHeaders(),
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(testResults)
          }
        );
        if (!res.ok) console.error(`❌ Error saving Test Results: ${res.status}`);
        else console.log('💾 Saved Test Results to Supabase');
      } catch (error) {
        console.error('❌ Error saving Test Results:', error);
      }
    };
    
    saveTestResults();
  }, [testResults, isLoadingData, dataLoadedSuccessfully]);

  // Footer auto-hide on scroll
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    
    const handleScroll = () => {
      // Hide footer when scrolling
      setIsFooterVisible(false);
      
      // Clear existing timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      // Show footer again after 2 seconds of no scrolling
      scrollTimeout = setTimeout(() => {
        setIsFooterVisible(true);
      }, 2000);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, []);

  const tabs: TabType[] = ['TPO', 'Test', 'Question Types', 'Training', 'History'];
  
  // Helper function to change tab with URL navigation
  const handleTabChange = (tab: TabType) => {
    // Check if trying to access TOEFL Prep
    if (tab === 'TOEFL Prep' && !isPasswordCorrect) {
      setShowPasswordModal(true);
      return;
    }
    
    // Always switch tab and close auth forms (consistent with desktop nav behavior)
    setActiveTab(tab);
    setShowLoginForm(false);
    setShowRegistrationForm(false);
    
    const tabRoutes: Record<TabType, string> = {
      'TPO': '/tpo-tests',
      'Test': '/test',
      'Question Types': '/question-types',
      'Training': '/specialized-training',
      'History': '/history',
      'TOEFL Prep': '/admin'
    };
    navigate(tabRoutes[tab]);
    
    // Login check for protected tabs - show popup after tab change
    const protectedTabs: TabType[] = ['TPO', 'Test', 'Question Types', 'Training', 'History'];
    // Allow vocabulary training without login
    const isVocabularyPath = location.pathname.includes('/vocabulary');
    if (!isLoggedIn && protectedTabs.includes(tab) && !isVocabularyPath) {
      setShowLoginPopup(true);
    }
  };
  
  // Handle password verification
  const handlePasswordSubmit = () => {
    if (passwordInput === TOEFL_PREP_PASSWORD) {
      setIsPasswordCorrect(true);
      setShowPasswordModal(false);
      setPasswordInput('');
      setActiveTab('TOEFL Prep');
      navigate('/admin');
    } else {
      alert('비밀번호가 올바르지 않습니다.');
      setPasswordInput('');
    }
  };

  const getAppCacheKey = (key: string) => `app_cache_${APP_CACHE_VERSION}_${key}`;

  const loadCachedData = <T,>(key: string): T | null => {
    try {
      const raw = localStorage.getItem(getAppCacheKey(key));
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.timestamp > APP_CACHE_TTL_MS) {
        localStorage.removeItem(getAppCacheKey(key));
        return null;
      }

      return parsed.data as T;
    } catch {
      return null;
    }
  };

  const saveCachedData = (key: string, data: unknown) => {
    try {
      localStorage.setItem(
        getAppCacheKey(key),
        JSON.stringify({ data, timestamp: Date.now() })
      );
    } catch {
      // Ignore cache write failures.
    }
  };

  const consumeInitialSyncSkip = (ref: React.MutableRefObject<boolean>) => {
    if (!ref.current) return false;
    ref.current = false;
    return true;
  };
  
  // Load data from Supabase on mount
  // Retry-enabled fetch for cold start resilience
  const fetchWithRetry = async (url: string, options: RequestInit, retries = 3, baseDelay = 2000): Promise<Response> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutMs = attempt === 1 ? 15000 : 12000;
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeoutId);
        return response;
      } catch (err: any) {
        const label = url.split('/').pop();
        const isAbort = err?.name === 'AbortError' || (err instanceof DOMException && err.code === 20);
        if (isAbort) {
          console.warn(`⚠️ ${label} attempt ${attempt}/${retries} timed out, retrying...`);
        } else {
          const errMsg = err?.message || String(err || 'unknown error');
          console.warn(`⚠️ ${label} attempt ${attempt}/${retries} failed: ${errMsg}`);
        }
        if (attempt === retries) throw err;
        await new Promise(r => setTimeout(r, baseDelay * attempt));
      }
    }
    throw new Error('fetchWithRetry: unreachable');
  };

  const getSupabaseRequestContext = () => ({
    headers: getServerHeaders(),
    baseUrl: SERVER_BASE_URL
  });

  const fetchSupabaseJson = async (endpoint: string) => {
    const { headers, baseUrl } = getSupabaseRequestContext();
    const res = await fetchWithRetry(`${baseUrl}/${endpoint}`, { headers });
    if (!res.ok) throw new Error(`${endpoint}: ${res.status}`);
    return res.json();
  };

  // Warm up edge function and wait until it responds
  const warmUpServer = async (baseUrl: string, headers: Record<string, string>) => {
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutMs = 10000;
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        const res = await fetch(`${baseUrl}/health`, { headers, signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          console.log(`✅ Edge Function warm-up succeeded on attempt ${attempt}`);
          await new Promise(r => setTimeout(r, attempt > 1 ? 1000 : 300));
          return true;
        }
        console.warn(`⚠️ Warm-up attempt ${attempt}/4: server responded with status ${res.status}`);
      } catch (err: any) {
        const isAbort = err?.name === 'AbortError' || (err instanceof DOMException && err.code === 20);
        const reason = isAbort ? 'Request timed out' : (err?.message || String(err));
        console.log(`🔄 Warm-up attempt ${attempt}/4: ${reason}`);
      }
      if (attempt < 4) {
        await new Promise(r => setTimeout(r, 2000 * attempt));
      }
    }
    console.warn('⚠️ Edge Function warm-up exhausted after 4 attempts, proceeding anyway');
    return false;
  };

  useEffect(() => {
    const loadDataFromSupabase = async () => {
      try {
        setIsLoadingData(true);
        
        const { headers, baseUrl } = getSupabaseRequestContext();

        const cachedTpoTests = loadCachedData<TPOTest[]>('tpo-tests');
        const cachedTestTests = loadCachedData<TPOTest[]>('test-tests');
        const cachedTrainingTests = loadCachedData<TPOTest[]>('training-tests');
        const cachedAdvertisements = loadCachedData<Advertisement[]>('advertisements');

        if (Array.isArray(cachedTpoTests)) {
          setTpoTests(cachedTpoTests);
          console.log('⚡ Loaded cached TPO tests:', cachedTpoTests.length);
        }
        if (Array.isArray(cachedTestTests)) {
          setTestTests(cachedTestTests);
          console.log('⚡ Loaded cached Test tests:', cachedTestTests.length);
        }
        if (Array.isArray(cachedTrainingTests)) {
          setTrainingTests(cachedTrainingTests);
        }
        if (Array.isArray(cachedAdvertisements)) {
          setAdvertisements(cachedAdvertisements);
        }
        
        // Best-effort warm-up only. Do not block critical list loading on it.
        void warmUpServer(baseUrl, headers);

        let anySuccess = false;

        // Batch 1a: TPO/Test lists first for faster initial rendering.
        const batch1a = await Promise.allSettled([
          fetchSupabaseJson('tpo-tests'),
          fetchSupabaseJson('test-tests'),
          fetchSupabaseJson('advertisements'),
        ]);

        if (batch1a[0].status === 'fulfilled') { const d = batch1a[0].value; if (Array.isArray(d)) { setTpoTests(d); saveCachedData('tpo-tests', d); anySuccess = true; console.log('✅ Loaded TPO tests:', d.length); } }
        if (batch1a[1].status === 'fulfilled') { const d = batch1a[1].value; if (Array.isArray(d)) { setTestTests(d); saveCachedData('test-tests', d); anySuccess = true; console.log('✅ Loaded Test tests:', d.length); } }
        if (batch1a[2].status === 'fulfilled') { const d = batch1a[2].value; if (Array.isArray(d)) { setAdvertisements(d); saveCachedData('advertisements', d); anySuccess = true; console.log('✅ Loaded Advertisements:', d.length); } }

        // Batch 1b: Remaining public content after the main lists are available.
        const batch1b = await Promise.allSettled([
          fetchSupabaseJson('lms-contents'),
          fetchSupabaseJson('training-tests'),
        ]);
        
        if (batch1b[0].status === 'fulfilled') { const d = batch1b[0].value; if (Array.isArray(d)) { setLmsContents(d); anySuccess = true; console.log('✅ Loaded LMS contents:', d.length); } }
        if (batch1b[1].status === 'fulfilled') { const d = batch1b[1].value; if (Array.isArray(d)) { setTrainingTests(d); saveCachedData('training-tests', d); anySuccess = true; console.log('✅ Loaded Training tests:', d.length); } }

        if (anySuccess) {
          setDataLoadedSuccessfully(true);
        } else {
          console.error('❌ All data fetches failed - save effects will be suppressed to prevent data loss');
        }
        
      } catch (error) {
        console.error('❌ Error loading data from Supabase:', error);
      } finally {
        setIsLoadingData(false);
      }
    };
    
    loadDataFromSupabase();
  }, []);

  useEffect(() => {
    const loadDeferredData = async () => {
      let target: DeferredDataKey | null = null;

      if (activeTab === 'History') {
        target = 'history';
      } else if (activeTab === 'Question Types') {
        target = 'questionTypes';
      } else if (activeTab === 'Training') {
        target = 'training';
      } else if (activeTab === 'TOEFL Prep' && isPasswordCorrect) {
        target = 'admin';
      }

      if (!target || deferredLoadStatus[target] !== 'idle') {
        return;
      }

      setDeferredLoadStatus(prev => ({ ...prev, [target!]: 'loading' }));

      try {
        let loadedAnything = false;

        if (target === 'history') {
          const [resultsRes, reportsRes] = await Promise.allSettled([
            fetchSupabaseJson('test-results'),
            fetchSupabaseJson('reports')
          ]);

          if (resultsRes.status === 'fulfilled' && Array.isArray(resultsRes.value)) {
            skipTestResultsSaveRef.current = true;
            setTestResults(resultsRes.value);
            loadedAnything = true;
            console.log('✅ Loaded Test Results:', resultsRes.value.length);
          }

          if (reportsRes.status === 'fulfilled' && Array.isArray(reportsRes.value)) {
            skipReportsSaveRef.current = true;
            setReports(reportsRes.value);
            loadedAnything = true;
            console.log('✅ Loaded Reports:', reportsRes.value.length);
          }
        }

        if (target === 'questionTypes') {
          const [configRes, resultsRes] = await Promise.allSettled([
            fetchSupabaseJson('question-types-config'),
            fetchSupabaseJson('question-types-results')
          ]);

          if (configRes.status === 'fulfilled' && configRes.value) {
            skipQuestionTypesConfigSaveRef.current = true;
            setQuestionTypesConfig(configRes.value);
            loadedAnything = true;
            console.log('✅ Loaded Question Types Config');
          }

          if (resultsRes.status === 'fulfilled' && Array.isArray(resultsRes.value)) {
            setQuestionTypesResults(resultsRes.value);
            loadedAnything = true;
            console.log('✅ Loaded Question Types Results:', resultsRes.value.length);
          }
        }

        if (target === 'training') {
          const [configRes, resultsRes] = await Promise.allSettled([
            fetchSupabaseJson('training-config'),
            fetchSupabaseJson('training-results')
          ]);

          if (configRes.status === 'fulfilled' && configRes.value) {
            skipTrainingConfigSaveRef.current = true;
            setTrainingConfig(configRes.value);
            loadedAnything = true;
            console.log('✅ Loaded Training Config');
          }

          if (resultsRes.status === 'fulfilled' && Array.isArray(resultsRes.value)) {
            setTrainingResults(resultsRes.value);
            loadedAnything = true;
            console.log('✅ Loaded Training Results:', resultsRes.value.length);
          }
        }

        if (target === 'admin') {
          const studentsRes = await fetchSupabaseJson('students').catch(() => null);

          if (Array.isArray(studentsRes)) {
            skipStudentsSaveRef.current = true;
            setStudents(studentsRes);
            loadedAnything = true;
            console.log('✅ Loaded Students:', studentsRes.length);
          }
        }

        setDeferredLoadStatus(prev => ({
          ...prev,
          [target!]: loadedAnything ? 'loaded' : 'idle'
        }));
      } catch (error) {
        console.error(`❌ Error loading deferred ${target} data:`, error);
        setDeferredLoadStatus(prev => ({ ...prev, [target!]: 'idle' }));
      }
    };

    void loadDeferredData();
  }, [activeTab, deferredLoadStatus, isPasswordCorrect]);

  // Save LMS contents to Supabase whenever they change
  useEffect(() => {
    if (isLoadingData || !dataLoadedSuccessfully) return; // Don't save during initial load or if load failed
    
    const saveToSupabase = async () => {
      try {
        const res = await fetch(
          `${SERVER_BASE_URL}/lms-contents`,
          {
            method: 'POST',
            headers: {
              ...getServerHeaders(),
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(lmsContents)
          }
        );
        if (!res.ok) console.error(`❌ Error saving LMS contents: ${res.status}`);
        else console.log('💾 Saved LMS contents to Supabase');
      } catch (error) {
        console.error('❌ Error saving LMS contents:', error);
      }
    };
    
    saveToSupabase();
  }, [lmsContents, isLoadingData, dataLoadedSuccessfully]);

  // Save TPO tests to Supabase whenever they change
  useEffect(() => {
    if (isLoadingData || !dataLoadedSuccessfully) return;
    
    const saveToSupabase = async () => {
      try {
        const res = await fetch(
          `${SERVER_BASE_URL}/tpo-tests`,
          {
            method: 'POST',
            headers: {
              ...getServerHeaders(),
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(tpoTests)
          }
        );
        if (!res.ok) console.error(`❌ Error saving TPO tests: ${res.status}`);
        else console.log('💾 Saved TPO tests to Supabase');
      } catch (error) {
        console.error('❌ Error saving TPO tests:', error);
      }
    };
    
    saveToSupabase();
  }, [tpoTests, isLoadingData, dataLoadedSuccessfully]);

  // Save Test tests to Supabase whenever they change
  useEffect(() => {
    if (isLoadingData || !dataLoadedSuccessfully) return;
    
    const saveToSupabase = async () => {
      try {
        const res = await fetch(
          `${SERVER_BASE_URL}/test-tests`,
          {
            method: 'POST',
            headers: {
              ...getServerHeaders(),
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(testTests)
          }
        );
        if (!res.ok) console.error(`❌ Error saving Test tests: ${res.status}`);
        else console.log('💾 Saved Test tests to Supabase');
      } catch (error) {
        console.error('❌ Error saving Test tests:', error);
      }
    };
    
    saveToSupabase();
  }, [testTests, isLoadingData, dataLoadedSuccessfully]);

  // Save Training tests to Supabase whenever they change
  useEffect(() => {
    if (isLoadingData || !dataLoadedSuccessfully) return;

    const saveToSupabase = async () => {
      try {
        const res = await fetch(
          `${SERVER_BASE_URL}/training-tests`,
          {
            method: 'POST',
            headers: {
              ...getServerHeaders(),
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(trainingTests)
          }
        );
        if (!res.ok) console.error(`❌ Error saving Training tests: ${res.status}`);
        else console.log('💾 Saved Training tests to Supabase');
      } catch (error) {
        console.error('❌ Error saving Training tests:', error);
      }
    };

    saveToSupabase();
  }, [trainingTests, isLoadingData, dataLoadedSuccessfully]);

  // Save Reports to Supabase whenever they change
  useEffect(() => {
    if (isLoadingData || !dataLoadedSuccessfully) return;
    
    const saveToSupabase = async () => {
      try {
        const res = await fetch(
          `${SERVER_BASE_URL}/reports`,
          {
            method: 'POST',
            headers: {
              ...getServerHeaders(),
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(reports)
          }
        );
        if (!res.ok) console.error(`❌ Error saving Reports: ${res.status}`);
        else console.log('💾 Saved Reports to Supabase');
      } catch (error) {
        console.error('❌ Error saving Reports:', error);
      }
    };
    
    saveToSupabase();
  }, [reports, isLoadingData, dataLoadedSuccessfully]);

  // Save Question Types Config to Supabase (debounced 1s)
  useEffect(() => {
    if (isLoadingData || !dataLoadedSuccessfully || !questionTypesConfig || consumeInitialSyncSkip(skipQuestionTypesConfigSaveRef)) return;
    
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${SERVER_BASE_URL}/question-types-config`,
          {
            method: 'POST',
            headers: {
              ...getServerHeaders(),
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(questionTypesConfig)
          }
        );
        if (!res.ok) console.error(`❌ Error saving Question Types Config: ${res.status}`);
        else console.log('💾 Saved Question Types Config to Supabase');
      } catch (error) {
        console.error('❌ Error saving Question Types Config:', error);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [questionTypesConfig, isLoadingData, dataLoadedSuccessfully]);

  // Save Training Config to Supabase (debounced 1s)
  useEffect(() => {
    if (isLoadingData || !dataLoadedSuccessfully || !trainingConfig || consumeInitialSyncSkip(skipTrainingConfigSaveRef)) return;
    
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${SERVER_BASE_URL}/training-config`,
          {
            method: 'POST',
            headers: {
              ...getServerHeaders(),
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(trainingConfig)
          }
        );
        if (!res.ok) console.error(`❌ Error saving Training Config: ${res.status}`);
        else console.log('💾 Saved Training Config to Supabase');
      } catch (error) {
        console.error('❌ Error saving Training Config:', error);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [trainingConfig, isLoadingData, dataLoadedSuccessfully]);

  // Save Training Result to Supabase (single append)
  const saveTrainingResultToSupabase = async (result: any) => {
    try {
      const res = await fetch(
        `${SERVER_BASE_URL}/training-results`,
        {
          method: 'POST',
          headers: {
            ...getServerHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(result)
        }
      );
      if (!res.ok) console.error(`❌ Error saving Training Result: ${res.status}`);
      else console.log('💾 Saved Training Result to Supabase');
    } catch (error) {
      console.error('❌ Error saving Training Result:', error);
    }
  };

  // Save Question Types Result to Supabase (single append)
  const saveQuestionTypesResultToSupabase = async (result: any) => {
    try {
      const res = await fetch(
        `${SERVER_BASE_URL}/question-types-results`,
        {
          method: 'POST',
          headers: {
            ...getServerHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(result)
        }
      );
      if (!res.ok) console.error(`❌ Error saving Question Types Result: ${res.status}`);
      else console.log('💾 Saved Question Types Result to Supabase');
    } catch (error) {
      console.error('❌ Error saving Question Types Result:', error);
    }
  };

  // LMS Handlers
  const handleAddLMSContent = (content: LMSContent) => {
    setLmsContents([...lmsContents, content]);
  };

  const handleUpdateLMSContent = (updatedContent: LMSContent) => {
    setLmsContents(lmsContents.map(c => c.id === updatedContent.id ? updatedContent : c));
  };

  const handleDeleteLMSContent = (id: string) => {
    setLmsContents(lmsContents.filter(c => c.id !== id));
  };

  const getTestEndpoint = (testType: TPOTest['testType']) => {
    if (testType === 'TPO') return 'tpo-tests';
    if (testType === 'Training') return 'training-tests';
    return 'test-tests';
  };

  const upsertLocalTestState = (test: TPOTest) => {
    if (test.testType === 'TPO') {
      setTpoTests(prev => {
        const hasExisting = prev.some(existing => existing.id === test.id);
        return hasExisting ? prev.map(existing => existing.id === test.id ? test : existing) : [...prev, test];
      });
      return;
    }

    if (test.testType === 'Training') {
      setTrainingTests(prev => {
        const hasExisting = prev.some(existing => existing.id === test.id);
        return hasExisting ? prev.map(existing => existing.id === test.id ? test : existing) : [...prev, test];
      });
      return;
    }

    setTestTests(prev => {
      const hasExisting = prev.some(existing => existing.id === test.id);
      return hasExisting ? prev.map(existing => existing.id === test.id ? test : existing) : [...prev, test];
    });
  };

  const removeLocalTestState = (test: TPOTest) => {
    if (test.testType === 'TPO') {
      setTpoTests(prev => prev.filter(existing => existing.id !== test.id));
      return;
    }

    if (test.testType === 'Training') {
      setTrainingTests(prev => prev.filter(existing => existing.id !== test.id));
      return;
    }

    setTestTests(prev => prev.filter(existing => existing.id !== test.id));
  };

  const getCurrentResultType = (): TestResult['type'] => {
    if (testBankType === 'tpo') return 'TPO';
    if (testBankType === 'training') return 'Training';
    return 'Test';
  };

  const getCurrentTestLabel = () => {
    const currentType = getCurrentResultType();
    if (!currentTest?.tpoNumber) {
      return currentType;
    }
    return `${currentType} ${currentTest.tpoNumber}`;
  };

  // TPO Test Handlers
  const handleAddTest = async (test: TPOTest) => {
    try {
      const endpoint = getTestEndpoint(test.testType);
      const response = await fetch(
        `${SERVER_BASE_URL}/${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getServerHeaders()
          },
          body: JSON.stringify(test)
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to save test: ${response.status}`);
      }
      
      // Update local state after successful server save
      upsertLocalTestState(test);
      
      console.log(`✅ Saved ${test.testType} ${test.testNumber} to server`);
    } catch (error) {
      console.error('❌ Error saving test:', error);
      alert('테스트 저장 중 오류가 발생했습니다.');
    }
  };

  const handleUpdateTest = async (updatedTest: TPOTest) => {
    try {
      const endpoint = getTestEndpoint(updatedTest.testType);
      const response = await fetch(
        `${SERVER_BASE_URL}/${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getServerHeaders()
          },
          body: JSON.stringify(updatedTest)
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to update test: ${response.status}`);
      }
      
      // Update local state after successful server save
      upsertLocalTestState(updatedTest);
      
      console.log(`✅ Updated ${updatedTest.testType} ${updatedTest.testNumber} on server`);
    } catch (error) {
      console.error('❌ Error updating test:', error);
      alert('테스트 업데이트 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteTest = async (id: string) => {
    try {
      // Find the test to determine its type and number
      const testToDelete = [...tpoTests, ...testTests, ...trainingTests].find(t => t.id === id);
      if (!testToDelete) {
        console.warn('Test not found for deletion');
        return;
      }
      
      const endpoint = getTestEndpoint(testToDelete.testType);
      const response = await fetch(
        `${SERVER_BASE_URL}/${endpoint}/${testToDelete.testNumber}`,
        {
          method: 'DELETE',
          headers: {
            ...getServerHeaders()
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to delete test: ${response.status}`);
      }
      
      // Update local state after successful server deletion
      removeLocalTestState(testToDelete);
      
      console.log(`✅ Deleted ${testToDelete.testType} ${testToDelete.testNumber} from server`);
    } catch (error) {
      console.error('❌ Error deleting test:', error);
      alert('테스트 삭제 중 오류가 발생했습니다.');
    }
  };

  // Clean up any Test type data that was created by the old TPO -> Test copy logic
  useEffect(() => {
    const hasTestTypeData = tpoTests.some(t => t.testType === 'Test');
    if (hasTestTypeData) {
      // Remove all Test type data, keep only TPO type
      const cleanedTests = tpoTests.filter(t => t.testType !== 'Test');
      if (cleanedTests.length !== tpoTests.length) {
        setTpoTests(cleanedTests);
        console.log('Cleaned up old Test type data from TPO tests');
      }
    }
  }, []); // Run only once on mount

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Vocabulary Handlers
  const handleAddWord = (word: SATWord, day: number) => {
    const insertIndex = (day - 1) * 40;
    const newWords = [...vocabularyWords];
    newWords.splice(insertIndex, 0, word);
    // Keep only 40 words per day - remove the last word if needed
    if (newWords.length > vocabularyWords.length) {
      const dayStart = (day - 1) * 40;
      const dayEnd = dayStart + 40;
      const dayWords = newWords.slice(dayStart, dayEnd + 1);
      if (dayWords.length > 40) {
        newWords.splice(dayEnd, 1);
      }
    }
    setVocabularyWords(newWords);
  };

  const handleUpdateWord = (oldWord: SATWord, newWord: SATWord, day: number) => {
    const dayStart = (day - 1) * 40;
    const dayEnd = dayStart + 40;
    const dayWords = vocabularyWords.slice(dayStart, dayEnd);
    const wordIndex = dayWords.findIndex(w => 
      w.english === oldWord.english && 
      w.korean === oldWord.korean
    );
    
    if (wordIndex !== -1) {
      const globalIndex = dayStart + wordIndex;
      const newWords = [...vocabularyWords];
      newWords[globalIndex] = newWord;
      setVocabularyWords(newWords);
    }
  };

  const handleDeleteWord = (word: SATWord, day: number) => {
    const dayStart = (day - 1) * 40;
    const dayEnd = dayStart + 40;
    const dayWords = vocabularyWords.slice(dayStart, dayEnd);
    const wordIndex = dayWords.findIndex(w => 
      w.english === word.english && 
      w.korean === word.korean
    );
    
    if (wordIndex !== -1) {
      const globalIndex = dayStart + wordIndex;
      const newWords = [...vocabularyWords];
      newWords.splice(globalIndex, 1);
      setVocabularyWords(newWords);
    }
  };

  // Vocabulary Day Handlers
  const handleAddDay = (dayName: string) => {
    const newId = vocabularyDays.length > 0 ? Math.max(...vocabularyDays.map(d => d.id)) + 1 : 1;
    const newDay: VocabularyDay = {
      id: newId,
      name: dayName
    };
    setVocabularyDays([...vocabularyDays, newDay]);
  };

  const handleUpdateDay = (dayId: number, newName: string) => {
    setVocabularyDays(vocabularyDays.map(day => 
      day.id === dayId ? { ...day, name: newName } : day
    ));
  };

  const handleDeleteDay = (dayId: number) => {
    // Delete the day and all words associated with it
    const dayIndex = vocabularyDays.findIndex(d => d.id === dayId);
    if (dayIndex === -1) return;
    
    // Remove words for this day (40 words starting at dayIndex * 40)
    const startIndex = dayIndex * 40;
    const newWords = [...vocabularyWords];
    newWords.splice(startIndex, 40);
    setVocabularyWords(newWords);
    
    // Remove the day
    setVocabularyDays(vocabularyDays.filter(d => d.id !== dayId));
  };

  // Student Management Handlers
  const handleAddStudent = (student: Omit<Student, 'id'>) => {
    const newStudent: Student = {
      id: Date.now().toString(),
      ...student
    };
    setStudents([...students, newStudent]);
  };

  const handleUpdateStudent = (student: Student) => {
    setStudents(students.map(s => s.id === student.id ? student : s));
  };

  const handleDeleteStudent = (studentId: string) => {
    setStudents(students.filter(s => s.id !== studentId));
  };

  // Vocabulary Score Handlers
  const handleAddVocabularyScore = (score: Omit<VocabularyScore, 'id'>) => {
    const newScore: VocabularyScore = {
      id: Date.now().toString(),
      ...score
    };
    setVocabularyScores([...vocabularyScores, newScore]);
  };

  const handleUpdateVocabularyScore = (score: VocabularyScore) => {
    setVocabularyScores(vocabularyScores.map(s => s.id === score.id ? score : s));
  };

  const handleDeleteVocabularyScore = (scoreId: string) => {
    setVocabularyScores(vocabularyScores.filter(s => s.id !== scoreId));
  };

  // Test Result Handlers
  const handleAddTestResult = (result: Omit<TestResult, 'id'>) => {
    const newResult: TestResult = {
      id: Date.now().toString(),
      bankType: result.bankType ?? (result.type === 'TPO' ? 'tpo' : result.type === 'Training' ? 'training' : 'test'),
      testNumber: result.testNumber ?? currentTest?.tpoNumber,
      ...result
    };
    setTestResults(prev => [newResult, ...prev]); // Add to beginning for latest first
  };

  const saveSectionResultToHistory = (
    category: 'Reading' | 'Listening' | 'Writing' | 'Speaking',
    totalQuestions: number
  ) => {
    // Collect all selectedAnswers (selectedAnswer, selectedAnswer2..selectedAnswer20)
    const allAnswers: (string | null)[] = [
      selectedAnswer, selectedAnswer2, selectedAnswer3, selectedAnswer4, selectedAnswer5,
      selectedAnswer6, selectedAnswer7, selectedAnswer8, selectedAnswer9, selectedAnswer10,
    ];

    // Match against CMS data to calculate score
    const tpoNum = currentTest?.tpoNumber;
    const cmsTpo = tpoTests?.find((t: any) => t.testNumber === tpoNum);
    const cmsSection = cmsTpo?.sections?.find((s: any) => s.sectionType === category);
    const cmsQuestions = cmsSection?.questions || [];

    let correctCount = 0;
    const wrongAnswers: { questionId: string; questionText: string; userAnswer: string; correctAnswer: string; explanation?: string }[] = [];

    for (let i = 0; i < Math.min(totalQuestions, allAnswers.length); i++) {
      const userAns = allAnswers[i];
      const cmsQ = cmsQuestions[i];
      const correctAns = cmsQ?.correctAnswer;

      if (userAns && correctAns && userAns === correctAns) {
        correctCount++;
      } else if (userAns) {
        wrongAnswers.push({
          questionId: String(i + 1),
          questionText: cmsQ?.questionText || cmsQ?.text || `Question ${i + 1}`,
          userAnswer: userAns,
          correctAnswer: correctAns || '',
          explanation: cmsQ?.explanation,
        });
      }
    }

    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    handleAddTestResult({
      type: getCurrentResultType(),
      category,
      testName: `${getCurrentTestLabel()} - ${category}`,
      testNumber: currentTest?.tpoNumber,
      bankType: testBankType,
      status: 'completed',
      date: new Date().toISOString(),
      score,
      totalQuestions,
      correctAnswers: correctCount,
      wrongAnswers,
      timeSpent: 0,
    });
  };

  // Training Result Handler - saves to both local state and Supabase
  const handleAddTrainingResult = (result: any) => {
    const normalizedResult: Omit<TestResult, 'id'> = {
      type: 'Training',
      category: result.category || result.type || 'Training',
      testName: result.testName || result.title || 'Training',
      testNumber: result.testNumber,
      bankType: 'training',
      trainingType: result.trainingType,
      status: result.status || 'completed',
      date: result.date || result.completedAt || new Date().toISOString(),
      score: result.score ?? 0,
      totalQuestions: result.totalQuestions ?? (parseInt(result.questionCount, 10) || 0),
      correctAnswers: result.correctAnswers ?? 0,
      wrongAnswers: Array.isArray(result.wrongAnswers) ? result.wrongAnswers : [],
      timeSpent: result.timeSpent ?? 0,
    };
    const newResult = {
      id: Date.now().toString(),
      ...normalizedResult,
      savedAt: new Date().toISOString(),
      source: 'training'
    };
    setTrainingResults(prev => [newResult, ...prev]);
    saveTrainingResultToSupabase(newResult);
    // Also save to test results for unified history
    handleAddTestResult(normalizedResult);
  };

  // Question Types Result Handler - saves to both local state and Supabase
  const handleAddQuestionTypesResult = (result: any) => {
    const newResult = {
      id: Date.now().toString(),
      ...result,
      savedAt: new Date().toISOString(),
      source: 'questionTypes'
    };
    setQuestionTypesResults(prev => [newResult, ...prev]);
    saveQuestionTypesResultToSupabase(newResult);
    // Also save to test results for unified history
    handleAddTestResult(result);
  };

  const handleRetryWrongAnswers = (result: TestResult) => {
    // TODO: Implement retry logic - will redirect to appropriate test with only wrong questions
    console.log('Retry wrong answers for:', result);
    alert(`오답 재시도 기능은 곧 구현될 예정입니다.\n틀린 문제: ${result.wrongAnswers.length}개`);
  };

  const handleViewResultDetail = (result: TestResult) => {
    // TODO: Implement detailed result view
    console.log('View detail for:', result);
    alert(`상세 결과 보기 기능은 곧 구현될 예정입니다.`);
  };

  const skills: SkillType[] = ['Listening', 'Reading', 'Writing', 'Speaking'];
  const tpoRanges: TPORange[] = ['TPO 1-5'];

  // Helper function to get current test data
  const getCurrentTestData = (): TPOTest | null => {
    if (!currentTest) return null;
    
    const tests = testBankType === 'tpo'
      ? tpoTests
      : testBankType === 'training'
      ? trainingTests
      : testTests;
    return tests.find(t => t.testNumber === currentTest.tpoNumber) || null;
  };

  // Helper function to get current section data
  const getCurrentSectionData = (sectionType: 'Reading' | 'Listening' | 'Speaking' | 'Writing') => {
    const testData = getCurrentTestData();
    if (!testData) return null;
    
    return testData.sections.find(s => s.sectionType === sectionType) || null;
  };

  // Get test numbers based on selected range
  const getTestNumbers = () => {
    switch (activeTestSetRange) {
      case '1-4': return [1, 2, 3, 4];
      case '5-8': return [5, 6, 7, 8];
      case '9-12': return [9, 10, 11, 12];
      case '13-16': return [13, 14, 15, 16];
      case '17-20': return [17, 18, 19, 20];
      default: return [1, 2, 3, 4];
    }
  };

  const clearReviewContext = () => {
    setReviewTrainingRequest(null);
    setCurrentListeningReviewScreen(null);
    setCurrentWritingReviewScreen(null);
    setCurrentSpeakingReviewScreen(null);
  };

  const launchSection = (
    testNumber: number,
    section: string,
    bankType: 'tpo' | 'test',
    mode: 'start' | 'review' = 'start'
  ) => {
    clearReviewContext();
    setIsReviewMode(mode === 'review');
    setCurrentTest({ tpoNumber: testNumber, section });
    setTestBankType(bankType);

    if (section === 'Listening') {
      setActiveListeningM2Screen(null);
      setActiveListeningM1Screen('intro');
      return;
    }

    if (section === 'Reading') {
      setShowReadingIntro(true);
      return;
    }

    if (section === 'Writing') {
      setActiveWritingScreen('intro');
      return;
    }

    if (section === 'Speaking') {
      setActiveSpeakingScreen('intro');
      return;
    }

    setShowToeflTest(true);
  };

  const normalizeReviewQuestionType = (value?: string) => (value || '').toLowerCase().replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();

  const questionNumberMatches = (questionNumber: TPOQuestion['questionNumber'] | undefined, targetNumber: number) => {
    if (questionNumber === undefined || questionNumber === null) return false;

    if (typeof questionNumber === 'number') {
      return questionNumber === targetNumber;
    }

    const numericValue = Number(questionNumber);
    if (!Number.isNaN(numericValue)) {
      return numericValue === targetNumber;
    }

    const rangeMatch = String(questionNumber).match(/(\d+)\s*-\s*(\d+)/);
    if (rangeMatch) {
      const start = Number(rangeMatch[1]);
      const end = Number(rangeMatch[2]);
      return targetNumber >= start && targetNumber <= end;
    }

    return String(questionNumber).includes(String(targetNumber));
  };

  const findReviewQuestion = (
    sectionType: 'Reading' | 'Listening' | 'Speaking' | 'Writing',
    typeCandidates: string[],
    targetNumber?: number
  ) => {
    const sectionData = getCurrentSectionData(sectionType);
    if (!sectionData) return null;

    const normalizedCandidates = typeCandidates.map((candidate) => normalizeReviewQuestionType(candidate));
    const typedQuestions = sectionData.questions.filter((question) => {
      const normalizedType = normalizeReviewQuestionType(question.questionType);
      return normalizedCandidates.some((candidate) => normalizedType === candidate || normalizedType.includes(candidate) || candidate.includes(normalizedType));
    });

    if (targetNumber !== undefined) {
      const numberedMatch = typedQuestions.find((question) => questionNumberMatches(question.questionNumber, targetNumber));
      if (numberedMatch) return numberedMatch;
    }

    return typedQuestions[0] || (targetNumber !== undefined
      ? sectionData.questions.find((question) => questionNumberMatches(question.questionNumber, targetNumber)) || null
      : null);
  };

  let activeReviewPanel: { section: ReviewSection; variant: ReviewVariant; contentKey: string; questionType?: string; difficulty?: ReviewDifficulty; translationNote?: string; analysisNote?: string; vocabularyNote?: string } | null = null;

  if (isReviewMode) {
    const isReadingQuestionVisible = showReadingSection || showFillBlanksTest || showReadNoticeTest || showReadNoticeTest2 || showSocialMediaTest || showSocialMediaTest2 || showSocialMediaTest3 || showModule1Question16 || showModule1Question17 || showModule1Question18 || showModule1Question19 || showModule1Question20 || showModule2FillBlanks || showModule2Question11 || showModule2Question12 || showModule2Question13 || showModule2Question14 || showModule2Question15 || showModule2Question16 || showModule2Question17 || showModule2Question18 || showModule2Question19 || showModule2Question20;

    if (isReadingQuestionVisible) {
      let readingQuestionType = 'Read an Academic Passage';
      let readingQuestionCandidates = ['Read an Academic Passage', 'Academic Reading'];
      if (showFillBlanksTest || showModule2FillBlanks) readingQuestionType = 'Complete Words';
      if (showFillBlanksTest || showModule2FillBlanks) readingQuestionCandidates = ['Complete Words', 'Fill in the Blanks', 'Cloze Test'];
      else if (showReadNoticeTest || showReadNoticeTest2 || showSocialMediaTest || showSocialMediaTest2 || showSocialMediaTest3) {
        readingQuestionType = 'Read in Daily Life';
        readingQuestionCandidates = ['Read in Daily Life', 'Practical Reading', 'Functional Text'];
      }

      const reviewQuestion = findReviewQuestion('Reading', readingQuestionCandidates);
      activeReviewPanel = {
        section: 'Reading',
        variant: 'reading',
        contentKey: `reading-${currentTest?.tpoNumber ?? 'none'}-${currentTest?.section ?? 'none'}`,
        questionType: readingQuestionType,
        difficulty: reviewQuestion?.difficulty,
        translationNote: reviewQuestion?.translationNote,
        analysisNote: (reviewQuestion as any)?.analysisNote,
        vocabularyNote: reviewQuestion?.vocabularyNote,
      };
    } else if (activeListeningM1Screen || activeListeningM2Screen) {
      const screen = currentListeningReviewScreen || activeListeningM2Screen || activeListeningM1Screen || 'intro';
      if (screen.startsWith('q')) {
        const qNum = parseInt(screen.replace('q', ''), 10);
        let listeningQuestionType = 'Listen and Response';
        let listeningQuestionCandidates = ['Listen and Response'];
        if (qNum >= 9 && qNum <= 10) listeningQuestionType = 'Short Conversation';
        if (qNum >= 9 && qNum <= 10) listeningQuestionCandidates = ['Short Conversation', 'Campus Conversation'];
        else if (qNum >= 11 && qNum <= 12) {
          listeningQuestionType = 'Announcements';
          listeningQuestionCandidates = ['Announcements'];
        } else if (qNum >= 13) {
          listeningQuestionType = 'Academic Talk';
          listeningQuestionCandidates = ['Academic Talk', 'Academic Lecture'];
        }

        const reviewQuestion = findReviewQuestion('Listening', listeningQuestionCandidates, qNum);
        activeReviewPanel = {
          section: 'Listening',
          variant: 'listening',
          contentKey: `listening-${screen}`,
          questionType: listeningQuestionType,
          difficulty: reviewQuestion?.difficulty,
          translationNote: reviewQuestion?.translationNote,
          analysisNote: (reviewQuestion as any)?.analysisNote,
          vocabularyNote: reviewQuestion?.vocabularyNote,
        };
      }
    } else if (activeWritingScreen) {
      const screen = currentWritingReviewScreen || activeWritingScreen;
      const isWritingQuestionScreen = screen.startsWith('bs-q') || screen === 'email-q1' || screen === 'academic-q2';
      if (isWritingQuestionScreen) {
        const variant: ReviewVariant = screen.startsWith('bs-q') ? 'writing-basic' : 'writing-guided';
        let writingQuestionType = 'Build a Sentence';
        let writingQuestionCandidates = ['Build a Sentence'];
        let targetQuestionNumber = Number(screen.replace(/\D/g, '')) || undefined;
        if (screen === 'email-q1') {
          writingQuestionType = 'Write an Email';
          writingQuestionCandidates = ['Write an Email'];
          targetQuestionNumber = 1;
        } else if (screen === 'academic-q2') {
          writingQuestionType = 'Academic Discussion';
          writingQuestionCandidates = ['Academic Discussion'];
          targetQuestionNumber = 2;
        }

        const reviewQuestion = findReviewQuestion('Writing', writingQuestionCandidates, targetQuestionNumber);
        activeReviewPanel = {
          section: 'Writing',
          variant,
          contentKey: `writing-${screen}`,
          questionType: writingQuestionType,
          difficulty: reviewQuestion?.difficulty,
        };
      }
    } else if (activeSpeakingScreen) {
      const screen = currentSpeakingReviewScreen || activeSpeakingScreen;
      if (screen.startsWith('q')) {
        const isRepeat = screen === 'q1' || screen === 'q1-record' || screen === 'q2-prep' || screen === 'q2-record' || screen === 'q3-prep' || screen === 'q3-record' || screen === 'q4-prep' || screen === 'q4-record' || screen === 'q5-prep' || screen === 'q5-record' || screen === 'q6-prep' || screen === 'q6-record' || screen === 'q7-prep' || screen === 'q7-record';
        const variant: ReviewVariant = isRepeat ? 'speaking-repeat' : 'speaking-interview';
        const questionNumber = parseInt(screen.replace(/\D/g, ''), 10);
        const speakingQuestionType = isRepeat ? 'Listen and Repeat' : 'Take an Interview';
        const speakingQuestionCandidates = isRepeat
          ? ['Listen and Repeat', 'Listen and Speak', 'Independent Task']
          : ['Take an Interview', 'Integrated (Read)', 'Integrated Task - Reading/Listening'];
        const reviewQuestion = findReviewQuestion('Speaking', speakingQuestionCandidates, questionNumber);
        activeReviewPanel = {
          section: 'Speaking',
          variant,
          contentKey: `speaking-${screen}`,
          questionType: speakingQuestionType,
          difficulty: reviewQuestion?.difficulty,
        };
      }
    }
  }

  // Show welcome landing page first
  if (showWelcomePage && location.pathname === '/') {
    return <WelcomeLandingPage onStartPractice={() => {
      setShowWelcomePage(false);
      navigate('/tpo-tests');
    }} />;
  }

  // Show landing page if requested
  if (showLandingPage) {
    return <LandingPage onStartTest={() => {
      setShowLandingPage(false);
      navigate('/tpo-tests');
    }} />;
  }

  // Read Notice Test Screen 2 Component (Next question)
  const ReadNoticeTestScreen2 = () => {
    const correctAnswer2 = "By using the Municipal Charter app";
    const answerOptions2 = [
      "By visiting a Municipal Charter office",
      "By accessing the Municipal Charter website",
      "By using the Municipal Charter app",
      "By calling a Municipal Charter customer service representative"
    ];

    // CMS PRIORITY: load same Daily Life question data (Q12 or second Daily Life question)
    const sectionData2 = getCurrentSectionData('Reading');
    // CMS PRIORITY: 번호로 먼저 찾기 (Q12) → 없으면 타입으로 찾기
    const dailyLifeQ2 = sectionData2?.questions.find(q =>
      String(q.questionNumber) === '12' || q.questionNumber === 12
    ) || sectionData2?.questions.filter(q => {
      const t = (q.questionType || '').toLowerCase();
      return t.includes('daily life') || t.includes('read in daily life') ||
        t.includes('practical reading') || t.includes('functional text') ||
        t.includes('notice') || t.includes('실용문');
    })[1] || null;

    const cmsNoticeTitle = dailyLifeQ2?.passageTitle || null;
    const cmsNoticeText = dailyLifeQ2?.passageText || null;
    const cmsQuestionText2 = dailyLifeQ2?.questionText || null;
    const cmsAnswerOptions2 = (dailyLifeQ2?.options && dailyLifeQ2.options.length > 0)
      ? dailyLifeQ2.options : null;

    const handleAnswerSelect2 = (answer: string) => {
      setSelectedAnswer2(answer);
    };

    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="flex bg-[#1e6b73] h-12 sm:h-16 items-center justify-between px-2 sm:px-8 shadow-lg">
          <div className="flex items-center shrink-0">
            <div className="text-white text-sm sm:text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity leading-tight" onClick={() => { setShowReadNoticeTest2(false); setShowReadNoticeTest(false); setShowFillBlanksTest(false); setShowReadingSection(false); setShowToeflTest(false); if (testBankType === 'tpo') { setActiveTab('TPO'); } else { setActiveTab('Test'); } }}>
              *toefl ibt
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button ref={volumeButtonRef} onClick={toggleVolume} className="flex items-center gap-1 sm:gap-3 bg-[#0A6068] border border-white rounded-lg px-2 sm:px-5 py-1.5 sm:py-2 hover:bg-[#084d52] transition-colors">
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-xs sm:text-base">Volume</span>
              <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="white"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
            </button>
            <button className="hidden sm:flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors" onClick={() => { setShowReadNoticeTest2(false); setShowReadNoticeTest(true); }}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Back</span>
            </button>
            <button className="flex items-center gap-1 sm:gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-2 sm:px-5 py-1.5 sm:py-2 hover:bg-gray-100 transition-colors" onClick={() => { setShowReadNoticeTest2(false); setShowSocialMediaTest(true); }}>
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-xs sm:text-base">Next</span>
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="#0A6068"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>
            </button>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-3 sm:px-8 py-2 sm:py-3">
            <div className="flex gap-4 sm:gap-8">
              <div className="text-gray-700 font-['Inter',_sans-serif] text-sm sm:text-base font-bold border-b-2 border-[#1e6b73] pb-2">Reading</div>
              <div className="text-gray-500 text-xs sm:text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">Question 12 of 20</div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto bg-white border border-black">
          <h1 className="hidden sm:block text-xl md:text-2xl lg:text-3xl font-['Inter',_sans-serif] font-bold text-black py-6 lg:py-8 text-center">
            {getDailyLifePageTitle(cmsNoticeTitle, cmsNoticeText)}
          </h1>
          
          <ResizableReadingLayout
            passageTitle={getDailyLifePageTitle(cmsNoticeTitle, cmsNoticeText)}
            passageSummary={<><strong>Municipal Charter</strong><br/>Sign up for paperless billing statements today.</>}
            questionInfo="2/2"
            onBack={() => { setShowReadNoticeTest2(false); setShowReadNoticeTest(true); }}
            onPrev={() => { setShowReadNoticeTest2(false); setShowReadNoticeTest(true); }}
            onNext={() => { setShowReadNoticeTest2(false); setShowSocialMediaTest(true); }}
            onSubmit={() => { setShowReadNoticeTest2(false); setShowSocialMediaTest(true); }}
            leftContent={
              <div className="ml-0 md:ml-4 lg:ml-12">
                {cmsNoticeText
                  ? (renderDailyLifePassage(cmsNoticeText) ?? (
                      <div className="border-[1px] md:border-[2px] lg:border-[3px] border-black p-2 md:p-4 lg:p-6">
                        <div className="border-[1px] md:border-2 border-black p-2 md:p-4 lg:p-6">
                          <p className="text-base font-['Inter',_sans-serif] leading-relaxed whitespace-pre-line">{cmsNoticeText}</p>
                        </div>
                      </div>
                    ))
                  : (
                    <div className="border-[1px] md:border-[2px] lg:border-[3px] border-black p-2 md:p-4 lg:p-6">
                      <div className="border-[1px] md:border-2 border-black p-2 md:p-4 lg:p-6">
                        <h2 className="text-lg md:text-xl lg:text-2xl font-['Inter',_sans-serif] font-bold text-black text-center mb-2 md:mb-4 lg:mb-6">Municipal Charter</h2>
                        <p className="text-base md:text-base text-center font-['Inter',_sans-serif] font-bold text-black mb-2 md:mb-4 lg:mb-6">Sign up for paperless billing statements today.</p>
                        <p className="text-base md:text-base font-['Inter',_sans-serif] leading-relaxed text-black">
                        Safe, convenient, easy. Enroll in paperless billing to receive monthly savings account statements in an electronic PDF document. Access your Municipal Charter account through the mobile app and select account preferences in the upper right-hand corner to enroll.
                        </p>
                      </div>
                    </div>
                  )
                }
              </div>
            }
            rightContent={
              <>
                <h3 className="text-lg sm:text-xl md:text-2xl font-['Inter',_sans-serif] font-bold text-black mb-4 md:mb-8 lg:mb-10">
                  {cmsQuestionText2 || "How can customers enroll in paperless billing?"}
                </h3>
                <div className="space-y-4 md:space-y-4 lg:space-y-6">
                  {(cmsAnswerOptions2 || answerOptions2).map((option, index) => (
                    <RadioOption
                      key={index}
                      id={`option2-${index}`}
                      name="business-type-2"
                      value={option}
                      checked={selectedAnswer2 === option}
                      onChange={() => handleAnswerSelect2(option)}
                      label={option}
                    />
                  ))}
                </div>
              </>
            }
          />
        </div>
        
        <MobileQuestionNav 
          onBack={() => {
            setShowReadNoticeTest2(false);
            setShowReadNoticeTest(true);
          }}
          onHome={() => {
            setShowReadNoticeTest2(false);
            setShowReadNoticeTest(false);
            setShowFillBlanksTest(false);
            setShowReadingSection(false);
            setShowToeflTest(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Test');
            }
          }}
          onNext={() => {
            setShowReadNoticeTest2(false);
            setShowSocialMediaTest(true);
          }}
        />
      </div>
    );
  };

  // Read Social Media Test Screen Component (Question 13)
  const ReadSocialMediaTestScreen = () => {
    const hardcodedAnswer3 = "To describe the variety of products available at the farmer's market";
    const hardcodedOptions3 = [
      "To explain the benefits of organic farming",
      "To describe the variety of products available at the farmer's market",
      "To compare different farmer's markets in the area",
      "To offer advice on starting a stall at the farmer's market"
    ];

    // CMS PRIORITY: 번호(13)로 먼저 찾기
    const sectionData13 = getCurrentSectionData('Reading');
    const cmsQ13 = sectionData13?.questions.find(q =>
      String(q.questionNumber) === '13' || q.questionNumber === 13
    ) || null;

    const cmsPassage13   = cmsQ13?.passageText   || null;
    const cmsTitle13     = cmsQ13?.passageTitle   || null;
    const cmsQuestion13  = cmsQ13?.questionText   || null;
    const cmsOptions13   = (cmsQ13?.options && cmsQ13.options.length > 0) ? cmsQ13.options : null;

    const answerOptions3 = cmsOptions13 || hardcodedOptions3;

    const handleAnswerSelect3 = (answer: string) => {
      setSelectedAnswer3(answer);
    };

    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowSocialMediaTest(false);
                setShowReadNoticeTest2(false);
                setShowReadNoticeTest(false);
                setShowFillBlanksTest(false);
                setShowReadingSection(false);
                setShowToeflTest(false);
                if (testBankType === 'tpo') {
                  setActiveTab('TPO');
                } else {
                  setActiveTab('Test');
                }
              }}
            >
              *toefl ibt
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Volume Button */}
            <button ref={volumeButtonRef} onClick={toggleVolume} className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowSocialMediaTest(false);
                setShowReadNoticeTest2(true);
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Back</span>
            </button>
            
            {/* Next Button */}
            <button 
              className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
              onClick={() => {
                setShowSocialMediaTest(false);
                setShowSocialMediaTest2(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-3 md:px-8 py-3">
            <div className="flex gap-4 md:gap-8">
              <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
                Reading
              </div>
              <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
                Question 13 of 20
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto bg-white border border-black">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-['Inter',_sans-serif] font-bold text-black py-3 md:py-6 lg:py-8 text-center">
            {getDailyLifePageTitle(cmsTitle13, cmsPassage13)}
          </h1>
          
          <ResizableReadingLayout
            leftContent={
              <div className="relative w-full">
                {/* CMS PRIORITY: render template if CMS data exists */}
                {cmsPassage13
                  ? (renderDailyLifePassage(cmsPassage13) ?? (
                      <div className="border-2 border-gray-200 rounded-lg p-4">
                        <p className="font-['Inter',_sans-serif] text-sm whitespace-pre-wrap">{cmsPassage13}</p>
                      </div>
                    ))
                  : (
                    /* Hardcoded fallback: original social media post UI */
                    <div className="relative bg-[#B3B3B3] border border-black rounded-xl p-2 md:p-4">
                      <div className="bg-white border border-black rounded-lg">
                        <div className="bg-[#0A5E63] h-9 md:h-11 rounded-t-lg flex items-center px-2 md:px-4 relative justify-between">
                          <span className="text-white text-xs font-bold">Community Forum</span>
                        </div>
                        <div className="p-3 md:p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#F4A261] flex items-center justify-center">
                              <span className="text-white font-bold text-sm">S</span>
                            </div>
                            <span className="text-sm md:text-base font-['Inter',_sans-serif] font-bold">Sofia Baker</span>
                          </div>
                          <div className="text-xs sm:text-sm md:text-base font-['Inter',_sans-serif] leading-relaxed space-y-2">
                            <p>Every Saturday, our local farmer's market is the place to be! Fresh fruits, veggies, homemade goodies, and unique crafts await you. The Thompson family's organic produce is a must-try, known for its quality and cordial service.</p>
                            <p>Don't miss the bakery stall—get there early for the best bread and pastries, including gluten-free and vegan options.</p>
                            <p>In addition to food, the market sells handmade crafts like jewelry, pottery, and textiles. Plus, enjoy live music while you shop!</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                }
              </div>
            }
            rightContent={
              <>
                <h3 className="text-base sm:text-lg md:text-xl font-['Inter',_sans-serif] font-bold text-black mb-4 md:mb-8 lg:mb-10">
                  {cmsQuestion13 || "What is the main purpose of the post?"}
                </h3>
                
                <div className="space-y-3 md:space-y-4 lg:space-y-6">
                  {answerOptions3.map((option, index) => (
                    <RadioOption
                      key={index}
                      id={`option3-${index}`}
                      name="social-media-purpose"
                      value={option}
                      checked={selectedAnswer3 === option}
                      onChange={() => handleAnswerSelect3(option)}
                      label={option}
                      size="sm"
                    />
                  ))}
                </div>
              </>
            }
          />
        </div>
        
        <MobileQuestionNav 
          onBack={() => {
            setShowSocialMediaTest(false);
            setShowReadNoticeTest2(true);
          }}
          onHome={() => {
            setShowSocialMediaTest(false);
            setShowReadNoticeTest2(false);
            setShowReadNoticeTest(false);
            setShowFillBlanksTest(false);
            setShowReadingSection(false);
            setShowToeflTest(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Test');
            }
          }}
          onNext={() => {
            setShowSocialMediaTest(false);
            setShowSocialMediaTest2(true);
          }}
        />
      </div>
    );
  };

  // Read Social Media Test Screen Component (Question 14)
  const ReadSocialMediaTest2Screen = () => {
    const correctAnswer4_hardcoded = "They provide friendly service and excellent products.";
    const answerOptions4_hardcoded = [
      "They offer cooking tips and recipes.",
      "They offer the lowest prices at the market.",
      "They provide friendly service and excellent products.",
      "They have a beautiful and well-decorated stall."
    ];


    // CMS PRIORITY: 번호(14)로 먼저 찾기
    const sectionDataQ14 = getCurrentSectionData('Reading');
    const cmsQ14 = sectionDataQ14?.questions.find(q =>
      String(q.questionNumber) === '14' || q.questionNumber === 14
    ) || null;
    const cmsPassage14   = cmsQ14?.passageText   || null;
    const cmsTitle14     = cmsQ14?.passageTitle   || null;
    const cmsQuestion14  = cmsQ14?.questionText   || null;
    const answerOptions4 = (cmsQ14?.options && cmsQ14!.options!.length > 0)
      ? cmsQ14!.options! : answerOptions4_hardcoded;

    const handleAnswerSelect4 = (answer: string) => {
      setSelectedAnswer4(answer);
    };

    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowSocialMediaTest2(false);
                setShowReadNoticeTest2(false);
                setShowReadNoticeTest(false);
                setShowFillBlanksTest(false);
                setShowReadingSection(false);
                setShowToeflTest(false);
                if (testBankType === 'tpo') {
                  setActiveTab('TPO');
                } else {
                  setActiveTab('Real Test');
                }
              }}
            >
              *toefl ibt
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Volume Button */}
            <button ref={volumeButtonRef} onClick={toggleVolume} className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowSocialMediaTest2(false);
                setShowSocialMediaTest(true);
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Back</span>
            </button>
            
            {/* Next Button */}
            <button 
              className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
              onClick={() => {
                setShowSocialMediaTest2(false);
                setShowSocialMediaTest3(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-3 md:px-8 py-3">
            <div className="flex gap-4 md:gap-8">
              <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
                Reading
              </div>
              <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
                Question 14 of 20
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto bg-white border border-black">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-['Inter',_sans-serif] font-bold text-black py-3 md:py-6 lg:py-8 text-center">
            {getDailyLifePageTitle(cmsTitle14, cmsPassage14)}
          </h1>
          
          <ResizableReadingLayout
            leftContent={
              <div className="relative w-full">
                {/* CMS PRIORITY: render template if CMS data exists */}
                {cmsPassage14
                  ? (renderDailyLifePassage(cmsPassage14) ?? (
                      <div className="border-2 border-gray-200 rounded-lg p-4">
                        <p className="font-['Inter',_sans-serif] text-sm whitespace-pre-wrap">{cmsPassage14}</p>
                      </div>
                    ))
                  : (
                    <div className="relative bg-[#B3B3B3] border border-black rounded-xl p-2 md:p-4">
                      <div className="bg-white border border-black rounded-lg">
                        <div className="bg-[#0A5E63] h-9 md:h-11 rounded-t-lg flex items-center px-2 md:px-4 justify-between">
                          <span className="text-white text-xs font-bold">Community Forum</span>
                        </div>
                        <div className="p-3 md:p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-full bg-[#F4A261] flex items-center justify-center">
                              <span className="text-white font-bold text-sm">S</span>
                            </div>
                            <span className="text-sm font-['Inter',_sans-serif] font-bold">Sofia Baker</span>
                          </div>
                          <div className="text-xs sm:text-sm font-['Inter',_sans-serif] leading-relaxed space-y-2">
                            <p>Every Saturday, our local farmer's market is the place to be! The Thompson family's organic produce is a must-try, known for its quality and cordial service. Their stall is always bustling with customers.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                }
              </div>
            }
            rightContent={
              <>
                <h3 className="text-base sm:text-lg md:text-xl font-['Inter',_sans-serif] font-bold text-black mb-4 md:mb-8 lg:mb-10">
                  {cmsQuestion14 || "What reason is given for the popularity of the Thompson family's stall?"}
                </h3>
                
                <div className="space-y-3 md:space-y-4 lg:space-y-6">
                  {answerOptions4.map((option, index) => (
                    <RadioOption
                      key={index}
                      id={`option4-${index}`}
                      name="thompson-popularity"
                      value={option}
                      checked={selectedAnswer4 === option}
                      onChange={() => handleAnswerSelect4(option)}
                      label={option}
                      size="sm"
                    />
                  ))}
                </div>
              </>
            }
          />
        </div>
        
        <MobileQuestionNav 
          onBack={() => {
            setShowSocialMediaTest2(false);
            setShowSocialMediaTest(true);
          }}
          onHome={() => {
            setShowSocialMediaTest2(false);
            setShowSocialMediaTest(false);
            setShowReadNoticeTest2(false);
            setShowReadNoticeTest(false);
            setShowFillBlanksTest(false);
            setShowReadingSection(false);
            setShowToeflTest(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Test');
            }
          }}
          onNext={() => {
            setShowSocialMediaTest2(false);
            setShowSocialMediaTest3(true);
          }}
        />
      </div>
    );
  };

  // Read Social Media Test Screen Component (Question 15 - duplicate of Q14)
  const ReadSocialMediaTest3Screen = () => {
    const correctAnswer5_hardcoded = "To get freshly baked bread and pastries before they are gone";
    const answerOptions5_hardcoded = [
      "To get the free samples given in mornings",
      "To get freshly baked bread and pastries before they are gone",
      "To meet the famous baker",
      "To take advantage of early morning discounts"
    ];


    // CMS PRIORITY: 번호(15)로 먼저 찾기
    const sectionDataQ15 = getCurrentSectionData('Reading');
    const cmsQ15 = sectionDataQ15?.questions.find(q =>
      String(q.questionNumber) === '15' || q.questionNumber === 15
    ) || null;
    const cmsPassage15   = cmsQ15?.passageText   || null;
    const cmsTitle15     = cmsQ15?.passageTitle   || null;
    const cmsQuestion15  = cmsQ15?.questionText   || null;
    const answerOptions5 = (cmsQ15?.options && cmsQ15!.options!.length > 0)
      ? cmsQ15!.options! : answerOptions5_hardcoded;

    const handleAnswerSelect5 = (answer: string) => {
      setSelectedAnswer5(answer);
    };

    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowSocialMediaTest3(false);
                setShowReadNoticeTest2(false);
                setShowReadNoticeTest(false);
                setShowFillBlanksTest(false);
                setShowReadingSection(false);
                setShowToeflTest(false);
                if (testBankType === 'tpo') {
                  setActiveTab('TPO');
                } else {
                  setActiveTab('Real Test');
                }
              }}
            >
              *toefl ibt
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Volume Button */}
            <button ref={volumeButtonRef} onClick={toggleVolume} className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowSocialMediaTest3(false);
                setShowSocialMediaTest2(true);
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Back</span>
            </button>
            
            {/* Next Button */}
            <button 
              className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
              onClick={() => {
                setShowSocialMediaTest3(false);
                setShowModule1Question16(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-3 md:px-8 py-3">
            <div className="flex gap-4 md:gap-8">
              <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
                Reading
              </div>
              <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
                Question 15 of 20
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto bg-white border border-black">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-['Inter',_sans-serif] font-bold text-black py-3 md:py-6 lg:py-8 text-center">
            {getDailyLifePageTitle(cmsTitle15, cmsPassage15)}
          </h1>
          
          <ResizableReadingLayout
            leftContent={
              <div className="relative w-full">
                {/* CMS PRIORITY: render template if CMS data exists */}
                {cmsPassage15
                  ? (renderDailyLifePassage(cmsPassage15) ?? (
                      <div className="border-2 border-gray-200 rounded-lg p-4">
                        <p className="font-['Inter',_sans-serif] text-sm whitespace-pre-wrap">{cmsPassage15}</p>
                      </div>
                    ))
                  : (
                    <div className="relative bg-[#B3B3B3] border border-black rounded-xl p-2 md:p-4">
                      <div className="bg-white border border-black rounded-lg">
                        <div className="bg-[#0A5E63] h-9 md:h-11 rounded-t-lg flex items-center px-2 md:px-4 justify-between">
                          <span className="text-white text-xs font-bold">Community Forum</span>
                        </div>
                        <div className="p-3 md:p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-full bg-[#F4A261] flex items-center justify-center">
                              <span className="text-white font-bold text-sm">S</span>
                            </div>
                            <span className="text-sm font-['Inter',_sans-serif] font-bold">Sofia Baker</span>
                          </div>
                          <div className="text-xs sm:text-sm font-['Inter',_sans-serif] leading-relaxed space-y-2">
                            <p>Don't miss the bakery stall—get there early for the best bread and pastries, including gluten-free and vegan options. The smell of freshly baked goods fills the air, and these treats sell out fast!</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                }
              </div>
            }
            rightContent={
              <>
                <h3 className="text-base sm:text-lg md:text-xl font-['Inter',_sans-serif] font-bold text-black mb-4 md:mb-8 lg:mb-10">
                  {cmsQuestion15 || 'Why do customers go to the bakery stall early?'}
                </h3>
                
                <div className="space-y-3 md:space-y-4 lg:space-y-6">
                  {answerOptions5.map((option, index) => (
                    <RadioOption
                      key={index}
                      id={`option5-${index}`}
                      name="bakery-stall-q15"
                      value={option}
                      checked={selectedAnswer5 === option}
                      onChange={() => handleAnswerSelect5(option)}
                      label={option}
                      size="sm"
                    />
                  ))}
                </div>
              </>
            }
          />
        </div>
        
        <MobileQuestionNav 
          onBack={() => {
            setShowSocialMediaTest3(false);
            setShowSocialMediaTest2(true);
          }}
          onHome={() => {
            setShowSocialMediaTest3(false);
            setShowSocialMediaTest2(false);
            setShowSocialMediaTest(false);
            setShowReadNoticeTest2(false);
            setShowReadNoticeTest(false);
            setShowFillBlanksTest(false);
            setShowReadingSection(false);
            setShowToeflTest(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Test');
            }
          }}
          onNext={() => {
            setShowSocialMediaTest3(false);
            setShowModule1Question16(true);
          }}
        />
      </div>
    );
  };

  // [Dead block 1 removed - 5 old _Old*_REMOVE screen components deleted]

  // Module 1 - Question 16 (The Mirror Test - Main Idea)
  const Module1Question16Screen = () => {
    const [selectedAnswer16, setSelectedAnswer16] = useState<string | null>(null);
    const [zoom16, setZoom16] = useState(1);
    
    // CMS PRIORITY: Q16 - academic reading, by number first, exclude Module 2
    const sectionData = getCurrentSectionData('Reading');
    const academicQuestion = sectionData?.questions.find(q => {
      const t = (q.questionType || '').toLowerCase();
      const num = q.questionNumber;
      return !t.includes('module 2') && (num === 16 || num === '16' || String(num) === '16');
    }) || sectionData?.questions.find(q => {
      const t = (q.questionType || '').toLowerCase();
      return !t.includes('module 2') && (t.includes('academic reading') || t.includes('academic') || t.includes('reading passage'));
    });
    
    // Parse CMS data if available (supports both JSON and plain text)
    let passageData: any = null;
    let currentQuestionIndex = 0;
    if (academicQuestion?.passageText) {
      try {
        passageData = JSON.parse(academicQuestion.passageText);
      } catch (e) {
        // passageText is plain text — wrap it so downstream code works uniformly
        passageData = { passage: academicQuestion.passageText };
      }
    }
    
    // CMS PRIORITY: check direct fields on the question object first, then parsed JSON, then hardcoded
    const passageTitle =
      academicQuestion?.passageTitle ||
      passageData?.title ||
      "The Mirror Test";

    const passageText =
      passageData?.passage ||
      `Very young children cannot recognize themselves in a mirror; they usually achieve this milestone around 18 months of age. The ability to recognize oneself in the mirror is considered to be a key component of self-awareness and consciousness for humans. But what about animals?\n\nFor many years, scientists have known that members of the great ape family could recognize themselves in mirrors. They measured this by the "mirror test," which involved putting a colored mark on an ape's body, and then showing the ape its reflection in a mirror. If the ape tried to remove the mark on its own body, the scientists knew that the ape was recognizing its reflection.\n\nApes are close relatives of humans, but in recent years, scientists have discovered that other animals also pass the "mirror test." Elephants and dolphins have shown signs of self-recognition. These, like apes, are highly intelligent animals. But in a more recent experiment, a type of fish called the cleaner fish tried to scrape a mark off its body when it saw itself in the mirror. This suggests that even less intelligent animals may possess more self-awareness than previously suspected.`;

    // CMS PRIORITY: direct question fields > parsed JSON questions > hardcoded
    const cmsQuestionText = academicQuestion?.questionText;
    const cmsOptions = academicQuestion?.options;
    const cmsCorrectAnswer = academicQuestion?.correctAnswer;

    const currentQuestion = {
      questionText:
        cmsQuestionText ||
        passageData?.questions?.[currentQuestionIndex]?.questionText ||
        "Which of the following best states a main idea of the passage?",
      options:
        (cmsOptions && cmsOptions.length > 0 ? cmsOptions : null) ||
        passageData?.questions?.[currentQuestionIndex]?.options || [
          "The mirror test is the only way to measure self-awareness.",
          "Only great apes can recognize themselves in mirrors.",
          "Animals may have more self-awareness than humans previously believed.",
          "Fish are more intelligent than elephants and dolphins."
        ],
      correctAnswer:
        cmsCorrectAnswer ||
        passageData?.questions?.[currentQuestionIndex]?.correctAnswer ||
        "Animals may have more self-awareness than humans previously believed."
    };
    
    const correctAnswer = currentQuestion.correctAnswer;
    const answerOptions = currentQuestion.options;

    const handleWheel16 = (e: React.WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom16(prev => Math.min(Math.max(prev + delta, 0.5), 2));
      }
    };

    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowModule1Question16(false);
                if (testBankType === 'tpo') {
                  setActiveTab('TPO');
                } else {
                  setActiveTab('Real Test');
                }
              }}
            >
              *toefl ibt
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Volume Button */}
            <button ref={volumeButtonRef} onClick={toggleVolume} className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowModule1Question16(false);
                setShowSocialMediaTest3(true);
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Back</span>
            </button>
            
            {/* Next Button */}
            <button 
              className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
              onClick={() => {
                setShowModule1Question16(false);
                setShowModule1Question17(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-8 py-3">
            <div className="flex gap-8">
              <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
                Reading
              </div>
              <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
                Question 16 of 20
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-2 md:p-4 lg:p-8 overflow-auto bg-white border border-black">
          <div className="max-w-7xl mx-auto pl-0">
            <h2 className="text-base sm:text-lg md:text-2xl lg:text-3xl font-['Inter',_sans-serif] font-bold text-center mb-2 md:mb-4 lg:mb-8">{passageTitle}</h2>
            <ResizableReadingLayout
              zoom={zoom16}
              onWheel={handleWheel16}
              leftContent={
                <>
                  <div className="space-y-2 md:space-y-3 lg:space-y-4 text-black font-['Inter',_sans-serif] leading-relaxed text-xs sm:text-sm md:text-base lg:text-lg whitespace-pre-wrap">
                    {passageText}
                  </div>
                </>
              }
              rightContent={
                <>
                  <h3 className="text-base sm:text-lg md:text-xl font-['Inter',_sans-serif] font-bold text-black mb-4 md:mb-6 lg:mb-8 mt-3">{currentQuestion.questionText}</h3>
                
                  <div className="space-y-3 md:space-y-4 lg:space-y-5">
                    {answerOptions.map((option, index) => (
                      <RadioOption
                        key={index}
                        id={`module1-q16-option-${index}`}
                        name="module1-q16"
                        value={option}
                        checked={selectedAnswer16 === option}
                        onChange={() => setSelectedAnswer16(option)}
                        label={option}
                        size="sm"
                      />
                    ))}
                  </div>
                </>
              }
            />
          </div>
        </div>
        
        <MobileQuestionNav 
          onBack={() => {
            setShowModule1Question16(false);
            setShowSocialMediaTest3(true);
          }}
          onHome={() => {
            setShowModule1Question16(false);
            setShowSocialMediaTest3(false);
            setShowSocialMediaTest2(false);
            setShowSocialMediaTest(false);
            setShowReadNoticeTest2(false);
            setShowReadNoticeTest(false);
            setShowFillBlanksTest(false);
            setShowReadingSection(false);
            setShowToeflTest(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onNext={() => {
            setShowModule1Question16(false);
            setShowModule1Question17(true);
          }}
        />
      </div>
    );
  };

  // Module 1 - Question 17
  const Module1Question17Screen = () => {
    const [selectedAnswer17, setSelectedAnswer17] = useState<string | null>(null);
    const [zoom17, setZoom17] = useState(1);
    // CMS PRIORITY: Q17 - academic reading, exclude Module 2 tagged
    const sectionDataQ17 = getCurrentSectionData('Reading');
    const cmsAcQ17 = sectionDataQ17?.questions.find(q => {
      const t = (q.questionType || '').toLowerCase();
      const num = q.questionNumber;
      return !t.includes('module 2') && (num === 17 || num === '17' || String(num) === '17');
    }) || sectionDataQ17?.questions.find(q => {
      const t = (q.questionType || '').toLowerCase();
      return !t.includes('module 2') && (t.includes('academic') || t.includes('reading passage'));
    });

    let parsedAC17: any = null;
    if (cmsAcQ17?.passageText) {
      try { parsedAC17 = JSON.parse(cmsAcQ17!.passageText!); }
      catch { parsedAC17 = { passage: cmsAcQ17!.passageText }; }
    }
    const cmsQItem17 = parsedAC17?.questions?.[1];

    const answerOptions =
      (cmsAcQ17?.options && cmsAcQ17!.options!.length > 0 ? cmsAcQ17!.options! : null) ||
      cmsQItem17?.options ||
      [
      "The mirror test demonstrates self-awareness in animals.",
      "Young children can recognize themselves earlier than 18 months.",
      "Great apes are the only animals that pass the mirror test.",
      "Fish cannot pass the mirror test."
    ];
    const correctAnswer =
      (cmsAcQ17?.correctAnswer as string | undefined) ||
      cmsQItem17?.correctAnswer ||
      "The mirror test demonstrates self-awareness in animals.";

    const handleWheel17 = (e: React.WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom17(prev => Math.min(Math.max(prev + delta, 0.5), 2));
      }
    };

    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowModule1Question17(false);
                if (testBankType === 'tpo') {
                  setActiveTab('TPO');
                } else {
                  setActiveTab('Real Test');
                }
              }}
            >
              *toefl ibt
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button ref={volumeButtonRef} onClick={toggleVolume} className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowModule1Question17(false);
                setShowModule1Question16(true);
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Back</span>
            </button>
            <button 
              className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
              onClick={() => {
                setShowModule1Question17(false);
                setShowModule1Question18(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="bg-white border-b border-gray-300">
          <div className="px-8 py-3">
            <div className="flex gap-8">
              <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
                Reading
              </div>
              <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
                Question 17 of 20
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 p-2 md:p-4 lg:p-8 overflow-auto bg-white border border-black">
          <div className="max-w-7xl mx-auto pl-0">
            <h2 className="text-base sm:text-lg md:text-2xl lg:text-3xl font-['Inter',_sans-serif] font-bold text-center mb-2 md:mb-4 lg:mb-8">{parsedAC17?.title || cmsAcQ17?.passageTitle || "The Mirror Test"}</h2>
            <ResizableReadingLayout
              zoom={zoom17}
              onWheel={handleWheel17}
              leftContent={
                <>
                  {/* CMS PRIORITY: render passage from CMS if available */}
                  {parsedAC17?.passage ? (
                    <div className="text-black font-['Inter',_sans-serif] leading-relaxed text-xs sm:text-sm md:text-base lg:text-lg whitespace-pre-wrap">
                      {parsedAC17!.passage}
                    </div>
                  ) : (
                    <div className="space-y-2 md:space-y-3 lg:space-y-4 text-black font-['Inter',_sans-serif] leading-relaxed text-xs sm:text-sm md:text-base lg:text-lg">
                      <p>Very young children cannot recognize themselves in a mirror; they usually achieve this milestone around 18 months of age. The ability to recognize oneself in the mirror is considered to be a key component of self-awareness and consciousness for humans. But what about animals?</p>
                      <p>For many years, scientists have known that members of the great ape family could recognize themselves in mirrors. They measured this by the "mirror test," which involved putting a colored mark on an ape's body, and then showing the ape its reflection in a mirror. If the ape tried to remove the mark on its own body, the scientists knew that the ape was recognizing its reflection.</p>
                      <p>Apes are close relatives of humans, but in recent years, scientists have discovered that other animals also pass the "mirror test." Elephants and dolphins have shown signs of self-recognition. These, like apes, are highly intelligent animals. But in a more recent experiment, a type of fish called the cleaner fish tried to scrape a mark off its body when it saw itself in the mirror. This suggests that even less intelligent animals may possess more self-awareness than previously suspected.</p>
                    </div>
                  )}
                </>
              }
              rightContent={
                <>
                  <h3 className="text-base sm:text-lg md:text-xl font-['Inter',_sans-serif] font-bold text-black mb-4 md:mb-6 lg:mb-8 mt-3 md:mt-6">{cmsAcQ17?.questionText || cmsQItem17?.questionText || "According to the passage, what is true about the mirror test?"}</h3>
                
                  <div className="space-y-3 md:space-y-4 lg:space-y-5">
                    {answerOptions.map((option, index) => (
                      <RadioOption
                        key={index}
                        id={`module1-q17-option-${index}`}
                        name="module1-q17"
                        value={option}
                        checked={selectedAnswer17 === option}
                        onChange={() => setSelectedAnswer17(option)}
                        label={option}
                        size="sm"
                      />
                    ))}
                  </div>
                </>
              }
            />
          </div>
        </div>
        
        <MobileQuestionNav 
          onBack={() => {
            setShowModule1Question17(false);
            setShowModule1Question16(true);
          }}
          onHome={() => {
            setShowModule1Question17(false);
            setShowModule1Question16(false);
            setShowSocialMediaTest3(false);
            setShowSocialMediaTest2(false);
            setShowSocialMediaTest(false);
            setShowReadNoticeTest2(false);
            setShowReadNoticeTest(false);
            setShowFillBlanksTest(false);
            setShowReadingSection(false);
            setShowToeflTest(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onNext={() => {
            setShowModule1Question17(false);
            setShowModule1Question18(true);
          }}
        />
      </div>
    );
  };

  // Module 1 - Question 18
  const Module1Question18Screen = () => {
    const [selectedAnswer18, setSelectedAnswer18] = useState<string | null>(null);
    const [zoom18, setZoom18] = useState(1);
    // CMS PRIORITY: Q18 - academic reading, exclude Module 2 tagged
    const sectionDataQ18 = getCurrentSectionData('Reading');
    const cmsAcQ18 = sectionDataQ18?.questions.find(q => {
      const t = (q.questionType || '').toLowerCase();
      const num = q.questionNumber;
      return !t.includes('module 2') && (num === 18 || num === '18' || String(num) === '18');
    }) || sectionDataQ18?.questions.find(q => {
      const t = (q.questionType || '').toLowerCase();
      return !t.includes('module 2') && (t.includes('academic') || t.includes('reading passage'));
    });

    let parsedAC18: any = null;
    if (cmsAcQ18?.passageText) {
      try { parsedAC18 = JSON.parse(cmsAcQ18!.passageText!); }
      catch { parsedAC18 = { passage: cmsAcQ18!.passageText }; }
    }
    const cmsQItem18 = parsedAC18?.questions?.[2];

    const answerOptions =
      (cmsAcQ18?.options && cmsAcQ18!.options!.length > 0 ? cmsAcQ18!.options! : null) ||
      cmsQItem18?.options ||
      [
      "Great apes only",
      "Elephants and dolphins",
      "Cleaner fish",
      "Young children"
    ];
    const correctAnswer =
      (cmsAcQ18?.correctAnswer as string | undefined) ||
      cmsQItem18?.correctAnswer ||
      "Elephants and dolphins";

    const handleWheel18 = (e: React.WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom18(prev => Math.min(Math.max(prev + delta, 0.5), 2));
      }
    };

    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowModule1Question18(false);
                if (testBankType === 'tpo') {
                  setActiveTab('TPO');
                } else {
                  setActiveTab('Real Test');
                }
              }}
            >
              *toefl ibt
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button ref={volumeButtonRef} onClick={toggleVolume} className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowModule1Question18(false);
                setShowModule1Question17(true);
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Back</span>
            </button>
            <button 
              className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
              onClick={() => {
                setShowModule1Question18(false);
                setShowModule1Question19(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="bg-white border-b border-gray-300">
          <div className="px-8 py-3">
            <div className="flex gap-8">
              <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
                Reading
              </div>
              <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
                Question 18 of 20
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 p-2 md:p-4 lg:p-8 overflow-auto bg-white border border-black">
          <div className="max-w-7xl mx-auto pl-0">
            <h2 className="text-base sm:text-lg md:text-2xl lg:text-3xl font-['Inter',_sans-serif] font-bold text-center mb-2 md:mb-4 lg:mb-8">{parsedAC18?.title || cmsAcQ18?.passageTitle || "The Mirror Test"}</h2>
            <ResizableReadingLayout
              zoom={zoom18}
              onWheel={handleWheel18}
              leftContent={
                <>
                  {/* CMS PRIORITY: render passage from CMS if available */}
                  {parsedAC18?.passage ? (
                    <div className="text-black font-['Inter',_sans-serif] leading-relaxed text-xs sm:text-sm md:text-base lg:text-lg whitespace-pre-wrap">
                      {parsedAC18!.passage}
                    </div>
                  ) : (
                    <div className="space-y-2 md:space-y-3 lg:space-y-4 text-black font-['Inter',_sans-serif] leading-relaxed text-xs sm:text-sm md:text-base lg:text-lg">
                      <p>Very young children cannot recognize themselves in a mirror; they usually achieve this milestone around 18 months of age. The ability to recognize oneself in the mirror is considered to be a key component of self-awareness and consciousness for humans. But what about animals?</p>
                      <p>For many years, scientists have known that members of the great ape family could recognize themselves in mirrors. They measured this by the "mirror test," which involved putting a colored mark on an ape's body, and then showing the ape its reflection in a mirror. If the ape tried to remove the mark on its own body, the scientists knew that the ape was recognizing its reflection.</p>
                      <p>Apes are close relatives of humans, but in recent years, scientists have discovered that other animals also pass the "mirror test." Elephants and dolphins have shown signs of self-recognition. These, like apes, are highly intelligent animals. But in a more recent experiment, a type of fish called the cleaner fish tried to scrape a mark off its body when it saw itself in the mirror. This suggests that even less intelligent animals may possess more self-awareness than previously suspected.</p>
                    </div>
                  )}
                </>
              }
              rightContent={
                <>
                  <h3 className="text-base sm:text-lg md:text-xl font-['Inter',_sans-serif] font-bold text-black mb-4 md:mb-6 lg:mb-8 mt-3 md:mt-6">{cmsAcQ18?.questionText || cmsQItem18?.questionText || "Which animals besides great apes have shown signs of self-recognition?"}</h3>
                
                  <div className="space-y-3 md:space-y-4 lg:space-y-5">
                    {answerOptions.map((option, index) => (
                      <RadioOption
                        key={index}
                        id={`module1-q18-option-${index}`}
                        name="module1-q18"
                        value={option}
                        checked={selectedAnswer18 === option}
                        onChange={() => setSelectedAnswer18(option)}
                        label={option}
                        size="sm"
                      />
                    ))}
                  </div>
                </>
              }
            />
          </div>
        </div>
        
        <MobileQuestionNav 
          onBack={() => {
            setShowModule1Question18(false);
            setShowModule1Question17(true);
          }}
          onHome={() => {
            setShowModule1Question18(false);
            setShowModule1Question17(false);
            setShowModule1Question16(false);
            setShowSocialMediaTest3(false);
            setShowSocialMediaTest2(false);
            setShowSocialMediaTest(false);
            setShowReadNoticeTest2(false);
            setShowReadNoticeTest(false);
            setShowFillBlanksTest(false);
            setShowReadingSection(false);
            setShowToeflTest(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onNext={() => {
            setShowModule1Question18(false);
            setShowModule1Question19(true);
          }}
        />
      </div>
    );
  };

  // Module 1 - Question 19
  const Module1Question19Screen = () => {
    const [selectedAnswer19, setSelectedAnswer19] = useState<string | null>(null);
    const [zoom19, setZoom19] = useState(1);
    // CMS PRIORITY: Q19 - academic reading, exclude Module 2 tagged
    const sectionDataQ19 = getCurrentSectionData('Reading');
    const cmsAcQ19 = sectionDataQ19?.questions.find(q => {
      const t = (q.questionType || '').toLowerCase();
      const num = q.questionNumber;
      return !t.includes('module 2') && (num === 19 || num === '19' || String(num) === '19');
    }) || sectionDataQ19?.questions.find(q => {
      const t = (q.questionType || '').toLowerCase();
      return !t.includes('module 2') && (t.includes('academic') || t.includes('reading passage'));
    });

    let parsedAC19: any = null;
    if (cmsAcQ19?.passageText) {
      try { parsedAC19 = JSON.parse(cmsAcQ19!.passageText!); }
      catch { parsedAC19 = { passage: cmsAcQ19!.passageText }; }
    }
    const cmsQItem19 = parsedAC19?.questions?.[3];

    const answerOptions =
      (cmsAcQ19?.options && cmsAcQ19!.options!.length > 0 ? cmsAcQ19!.options! : null) ||
      cmsQItem19?.options ||
      [
      "It proves that fish are highly intelligent.",
      "It suggests that self-awareness may be more widespread than previously thought.",
      "It demonstrates that the mirror test is flawed.",
      "It shows that only ocean animals have self-awareness."
    ];
    const correctAnswer =
      (cmsAcQ19?.correctAnswer as string | undefined) ||
      cmsQItem19?.correctAnswer ||
      "It suggests that self-awareness may be more widespread than previously thought.";

    const handleWheel19 = (e: React.WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom19(prev => Math.min(Math.max(prev + delta, 0.5), 2));
      }
    };

    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowModule1Question19(false);
                if (testBankType === 'tpo') {
                  setActiveTab('TPO');
                } else {
                  setActiveTab('Real Test');
                }
              }}
            >
              *toefl ibt
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button ref={volumeButtonRef} onClick={toggleVolume} className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowModule1Question19(false);
                setShowModule1Question18(true);
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Back</span>
            </button>
            <button 
              className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
              onClick={() => {
                setShowModule1Question19(false);
                setShowModule1Question20(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="bg-white border-b border-gray-300">
          <div className="px-8 py-3">
            <div className="flex gap-8">
              <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
                Reading
              </div>
              <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
                Question 19 of 20
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 p-2 md:p-4 lg:p-8 overflow-auto bg-white border border-black">
          <div className="max-w-7xl mx-auto pl-0">
            <h2 className="text-base sm:text-lg md:text-2xl lg:text-3xl font-['Inter',_sans-serif] font-bold text-center mb-2 md:mb-4 lg:mb-8">{parsedAC19?.title || cmsAcQ19?.passageTitle || "The Mirror Test"}</h2>
            <ResizableReadingLayout
              zoom={zoom19}
              onWheel={handleWheel19}
              leftContent={
                <>
                  {/* CMS PRIORITY: render passage from CMS if available */}
                  {parsedAC19?.passage ? (
                    <div className="text-black font-['Inter',_sans-serif] leading-relaxed text-xs sm:text-sm md:text-base lg:text-lg whitespace-pre-wrap">
                      {parsedAC19!.passage}
                    </div>
                  ) : (
                    <div className="space-y-2 md:space-y-3 lg:space-y-4 text-black font-['Inter',_sans-serif] leading-relaxed text-xs sm:text-sm md:text-base lg:text-lg">
                      <p>Very young children cannot recognize themselves in a mirror; they usually achieve this milestone around 18 months of age. The ability to recognize oneself in the mirror is considered to be a key component of self-awareness and consciousness for humans. But what about animals?</p>
                      <p>For many years, scientists have known that members of the great ape family could recognize themselves in mirrors. They measured this by the "mirror test," which involved putting a colored mark on an ape's body, and then showing the ape its reflection in a mirror. If the ape tried to remove the mark on its own body, the scientists knew that the ape was recognizing its reflection.</p>
                      <p>Apes are close relatives of humans, but in recent years, scientists have discovered that other animals also pass the "mirror test." Elephants and dolphins have shown signs of self-recognition. These, like apes, are highly intelligent animals. But in a more recent experiment, a type of fish called the cleaner fish tried to scrape a mark off its body when it saw itself in the mirror. This suggests that even less intelligent animals may possess more self-awareness than previously suspected.</p>
                    </div>
                  )}
                </>
              }
              rightContent={
                <>
                  <h3 className="text-base sm:text-lg md:text-xl font-['Inter',_sans-serif] font-bold text-black mb-4 md:mb-6 lg:mb-8 mt-3 md:mt-6">{cmsAcQ19?.questionText || cmsQItem19?.questionText || "What is the significance of the cleaner fish experiment?"}</h3>
                
                  <div className="space-y-3 md:space-y-4 lg:space-y-5">
                    {answerOptions.map((option, index) => (
                      <RadioOption
                        key={index}
                        id={`module1-q19-option-${index}`}
                        name="module1-q19"
                        value={option}
                        checked={selectedAnswer19 === option}
                        onChange={() => setSelectedAnswer19(option)}
                        label={option}
                        size="sm"
                      />
                    ))}
                  </div>
                </>
              }
            />
          </div>
        </div>
        
        <MobileQuestionNav 
          onBack={() => {
            setShowModule1Question19(false);
            setShowModule1Question18(true);
          }}
          onHome={() => {
            setShowModule1Question19(false);
            setShowModule1Question18(false);
            setShowModule1Question17(false);
            setShowModule1Question16(false);
            setShowSocialMediaTest3(false);
            setShowSocialMediaTest2(false);
            setShowSocialMediaTest(false);
            setShowReadNoticeTest2(false);
            setShowReadNoticeTest(false);
            setShowFillBlanksTest(false);
            setShowReadingSection(false);
            setShowToeflTest(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onNext={() => {
            setShowModule1Question19(false);
            setShowModule1Question20(true);
          }}
        />
      </div>
    );
  };

  // Module 1 - Question 20
  const Module1Question20Screen = () => {
    const [selectedAnswer20, setSelectedAnswer20] = useState<string | null>(null);
    const [zoom20, setZoom20] = useState(1);
    // CMS PRIORITY: Q20 - academic reading, exclude Module 2 tagged
    const sectionDataQ20 = getCurrentSectionData('Reading');
    const cmsAcQ20 = sectionDataQ20?.questions.find(q => {
      const t = (q.questionType || '').toLowerCase();
      const num = q.questionNumber;
      return !t.includes('module 2') && (num === 20 || num === '20' || String(num) === '20');
    }) || sectionDataQ20?.questions.find(q => {
      const t = (q.questionType || '').toLowerCase();
      return !t.includes('module 2') && (t.includes('academic') || t.includes('reading passage'));
    });

    let parsedAC20: any = null;
    if (cmsAcQ20?.passageText) {
      try { parsedAC20 = JSON.parse(cmsAcQ20!.passageText!); }
      catch { parsedAC20 = { passage: cmsAcQ20!.passageText }; }
    }
    const cmsQItem20 = parsedAC20?.questions?.[4];

    const answerOptions =
      (cmsAcQ20?.options && cmsAcQ20!.options!.length > 0 ? cmsAcQ20!.options! : null) ||
      cmsQItem20?.options ||
      [
      "At birth",
      "Around 6 months of age",
      "Around 18 months of age",
      "At 3 years of age"
    ];
    const correctAnswer =
      (cmsAcQ20?.correctAnswer as string | undefined) ||
      cmsQItem20?.correctAnswer ||
      "Around 18 months of age";

    const handleWheel20 = (e: React.WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom20(prev => Math.min(Math.max(prev + delta, 0.5), 2));
      }
    };

    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowModule1Question20(false);
                if (testBankType === 'tpo') {
                  setActiveTab('TPO');
                } else {
                  setActiveTab('Real Test');
                }
              }}
            >
              *toefl ibt
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button ref={volumeButtonRef} onClick={toggleVolume} className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowModule1Question20(false);
                setShowModule1Question19(true);
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Back</span>
            </button>
            <button 
              className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
              onClick={() => {
                setShowModule1Question20(false);
                setShowEndModule1(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="bg-white border-b border-gray-300">
          <div className="px-8 py-3">
            <div className="flex gap-8">
              <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
                Reading
              </div>
              <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
                Question 20 of 20
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 p-2 md:p-4 lg:p-8 overflow-auto bg-white border border-black">
          <div className="max-w-7xl mx-auto pl-0">
            <h2 className="text-base sm:text-lg md:text-2xl lg:text-3xl font-['Inter',_sans-serif] font-bold text-center mb-2 md:mb-4 lg:mb-8">{parsedAC20?.title || cmsAcQ20?.passageTitle || "The Mirror Test"}</h2>
            <ResizableReadingLayout
              zoom={zoom20}
              onWheel={handleWheel20}
              leftContent={
                <>
                  {/* CMS PRIORITY: render passage from CMS if available */}
                  {parsedAC20?.passage ? (
                    <div className="text-black font-['Inter',_sans-serif] leading-relaxed text-xs sm:text-sm md:text-base lg:text-lg whitespace-pre-wrap">
                      {parsedAC20!.passage}
                    </div>
                  ) : (
                    <div className="space-y-2 md:space-y-3 lg:space-y-4 text-black font-['Inter',_sans-serif] leading-relaxed text-xs sm:text-sm md:text-base lg:text-lg">
                      <p>Very young children cannot recognize themselves in a mirror; they usually achieve this milestone around 18 months of age. The ability to recognize oneself in the mirror is considered to be a key component of self-awareness and consciousness for humans. But what about animals?</p>
                      <p>For many years, scientists have known that members of the great ape family could recognize themselves in mirrors. They measured this by the "mirror test," which involved putting a colored mark on an ape's body, and then showing the ape its reflection in a mirror. If the ape tried to remove the mark on its own body, the scientists knew that the ape was recognizing its reflection.</p>
                      <p>Apes are close relatives of humans, but in recent years, scientists have discovered that other animals also pass the "mirror test." Elephants and dolphins have shown signs of self-recognition. These, like apes, are highly intelligent animals. But in a more recent experiment, a type of fish called the cleaner fish tried to scrape a mark off its body when it saw itself in the mirror. This suggests that even less intelligent animals may possess more self-awareness than previously suspected.</p>
                    </div>
                  )}
                </>
              }
              rightContent={
                <>
                  <h3 className="text-base sm:text-lg md:text-xl font-['Inter',_sans-serif] font-bold text-black mb-4 md:mb-6 lg:mb-8 mt-3 md:mt-6">{cmsAcQ20?.questionText || cmsQItem20?.questionText || "According to the passage, when do children typically recognize themselves in a mirror?"}</h3>
                
                  <div className="space-y-3 md:space-y-4 lg:space-y-5">
                    {answerOptions.map((option, index) => (
                      <RadioOption
                        key={index}
                        id={`module1-q20-option-${index}`}
                        name="module1-q20"
                        value={option}
                        checked={selectedAnswer20 === option}
                        onChange={() => setSelectedAnswer20(option)}
                        label={option}
                        size="sm"
                      />
                    ))}
                  </div>
                </>
              }
            />
          </div>
        </div>
        
        <MobileQuestionNav 
          onBack={() => {
            setShowModule1Question20(false);
            setShowModule1Question19(true);
          }}
          onHome={() => {
            setShowModule1Question20(false);
            setShowModule1Question19(false);
            setShowModule1Question18(false);
            setShowModule1Question17(false);
            setShowModule1Question16(false);
            setShowSocialMediaTest3(false);
            setShowSocialMediaTest2(false);
            setShowSocialMediaTest(false);
            setShowReadNoticeTest2(false);
            setShowReadNoticeTest(false);
            setShowFillBlanksTest(false);
            setShowReadingSection(false);
            setShowToeflTest(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onNext={() => {
            setShowModule1Question20(false);
            setShowEndModule1(true);
          }}
        />
      </div>
    );
  };

  // End of Module 1 Screen
  const EndModule1Screen = () => {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowEndModule1(false);
                if (testBankType === 'tpo') {
                  setActiveTab('TPO');
                } else {
                  setActiveTab('Real Test');
                }
              }}
            >
              *toefl ibt
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Next Button */}
            <button 
              className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
              onClick={() => {
                setShowEndModule1(false);
                setShowModule2(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Tab */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-8 py-3">
            <div className="text-gray-700 font-['Inter',_sans-serif] font-bold">
              Reading
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-12 overflow-auto bg-white flex items-center justify-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-['Inter',_sans-serif] font-bold text-gray-800 mb-8">End of Reading Section</h1>
            <p className="text-base font-['Inter',_sans-serif] text-gray-700">
              Thank you for completing the reading section.
            </p>
          </div>
        </div>
        
        <MobileQuestionNav 
          onBack={() => {
            setShowEndModule1(false);
            setShowModule1Question20(true);
          }}
          onHome={() => {
            setShowEndModule1(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onNext={() => {
            setShowEndModule1(false);
            setShowModule2(true);
          }}
        />
      </div>
    );
  };

  // Module 2 Screen
  const Module2Screen = () => {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowModule2(false);
                if (testBankType === 'tpo') {
                  setActiveTab('TPO');
                } else {
                  setActiveTab('Real Test');
                }
              }}
            >
              *toefl ibt
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Volume Button */}
            <button ref={volumeButtonRef} onClick={toggleVolume} className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Begin Button */}
            <button 
              className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
              onClick={() => {
                setShowModule2(false);
                setShowModule2FillBlanks(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Begin</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Tab */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-8 py-3">
            <div className="text-gray-700 font-['Inter',_sans-serif] font-bold">
              Reading
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-12 overflow-auto bg-white flex items-center justify-center">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-['Inter',_sans-serif] font-bold text-black mb-8">Module 2</h1>
            <p className="text-lg font-['Inter',_sans-serif] text-gray-700">
              In an actual test, the clock will show you how much time you have to complete Module 2.
            </p>
          </div>
        </div>
        
        <MobileQuestionNav 
          onBack={() => {
            setShowModule2(false);
            setShowEndModule1(true);
          }}
          onHome={() => {
            setShowModule2(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onNext={() => {
            setShowModule2(false);
            setShowModule2FillBlanks(true);
          }}
        />
      </div>
    );
  };

  // Module 2 - Fill in the Blanks (Questions 1-10)
  const Module2FillBlanksScreen = () => {
    const [m2InputValues, setM2InputValues] = React.useState<Record<number, string>>({});
    const [m2FilledInputs, setM2FilledInputs] = React.useState<Record<number, boolean>>({});
    const { isOpen: isM2FBVolumeOpen, buttonRef: m2FBVolumeButtonRef, toggleVolume: toggleM2FBVolume, closeVolume: closeM2FBVolume } = useVolumeControl();

    const CHAR_UNIT_WIDTH = 20;
    const isMobileM2FB = typeof window !== 'undefined' && window.innerWidth < 640;

    // CMS PRIORITY: parse Module 2 fill-blanks from CMS passageText "word[answer:maxLength]" format
    const m2SectionData = getCurrentSectionData('Reading');
    // First: look for question explicitly tagged as Module 2
    const m2FillBlanksQuestion = m2SectionData?.questions.find(q => {
      const t = (q.questionType || '').toLowerCase();
      return (
        t.includes('module 2') && (
          t.includes('complete words') ||
          t.includes('fill in the blank') ||
          t.includes('cloze test') ||
          t.includes('빈칸') ||
          t.includes('fillblanks') ||
          t.includes('fill-in')
        )
      );
    }) || m2SectionData?.questions.find(q => {
      // Fallback: any complete words question (Module 1 style, for backward compat)
      const t = (q.questionType || '').toLowerCase();
      return (
        t.includes('complete words') ||
        t.includes('fill in the blank') ||
        t.includes('cloze test') ||
        t.includes('빈칸') ||
        t.includes('fillblanks') ||
        t.includes('fill-in')
      );
    });

    const parseM2CmsPassage = (raw: string): { m2ParsedInputs: {id:number;maxLength:number;answer:string}[]; m2NormalizedPassage: string } => {
      const m2ParsedInputs: {id:number;maxLength:number;answer:string}[] = [];
      let idx = 0;
      const m2NormalizedPassage = raw.replace(/\[([^\]]+):(\d+)\]/g, (_match: string, answer: string, maxLen: string) => {
        m2ParsedInputs.push({ id: idx, maxLength: parseInt(maxLen), answer });
        return `[${idx++}]`;
      });
      return { m2ParsedInputs, m2NormalizedPassage };
    };

    let m2Inputs: {id:number;maxLength:number;answer?:string}[];
    let m2NormalizedPassage = '';

    const rawM2Passage = m2FillBlanksQuestion?.passageText || '';
    // Support both [answer:maxLen] format AND already-normalized [N] format
    const hasM2CmsFormat = /\[[^\]]+:\d+\]/.test(rawM2Passage);
    const hasNormalizedFormat = /\[\d+\]/.test(rawM2Passage);

    if (hasM2CmsFormat) {
      const { m2ParsedInputs, m2NormalizedPassage: np } = parseM2CmsPassage(rawM2Passage);
      m2Inputs = m2ParsedInputs;
      m2NormalizedPassage = np;
    } else if (hasNormalizedFormat) {
      // Already normalized [0],[1]... format — extract inputs from blank count
      const blanks: {id:number;maxLength:number;answer?:string}[] = [];
      let idx = 0;
      rawM2Passage.replace(/\[(\d+)\]/g, () => { blanks.push({ id: idx, maxLength: 5 }); idx++; return ''; });
      m2Inputs = blanks.length > 0 ? blanks : Array.from({length:10}, (_, i) => ({ id: i, maxLength: 5 }));
      m2NormalizedPassage = rawM2Passage;
    } else if (m2FillBlanksQuestion?.blanks && m2FillBlanksQuestion.blanks.length > 0) {
      m2Inputs = m2FillBlanksQuestion.blanks.map((b, i) => ({ id: i, maxLength: b.maxLength, answer: b.answer }));
      m2NormalizedPassage = rawM2Passage;
    } else {
      m2Inputs = [
        { id: 0, maxLength: 1 },  // is
        { id: 1, maxLength: 2 },  // into
        { id: 2, maxLength: 4 },  // regions
        { id: 3, maxLength: 2 },  // with
        { id: 4, maxLength: 3 },  // roles
        { id: 5, maxLength: 2 },  // its
        { id: 6, maxLength: 2 },  // part
        { id: 7, maxLength: 4 },  // involved
        { id: 8, maxLength: 5 },  // cognitive
        { id: 9, maxLength: 2 },  // such
      ];
    }

    const handleM2InputChange = (id: number, value: string) => {
      setM2InputValues(prev => ({ ...prev, [id]: value }));
      if (value.length >= m2Inputs[id].maxLength) {
        setM2FilledInputs(prev => ({ ...prev, [id]: true }));
      } else {
        setM2FilledInputs(prev => ({ ...prev, [id]: false }));
      }
      if (value.length === m2Inputs[id].maxLength) {
        const nextId = id + 1;
        if (nextId < m2Inputs.length) {
          setTimeout(() => {
            const nextInput = document.querySelector(`input[data-input-id="m2-${nextId}"]`) as HTMLInputElement;
            if (nextInput) nextInput.focus();
          }, 0);
        }
      }
    };

    const handleM2Focus = (id: number) => {
      const value = m2InputValues[id] || '';
      if (value.length < m2Inputs[id].maxLength) {
        setM2FilledInputs(prev => ({ ...prev, [id]: false }));
      }
    };

    const handleM2Blur = (id: number) => {
      if (m2InputValues[id] && m2InputValues[id].length > 0) {
        setM2FilledInputs(prev => ({ ...prev, [id]: true }));
      }
    };

    const handleM2KeyPress = (e: React.KeyboardEvent, id: number) => {
      if (e.key === 'Enter') {
        (e.target as HTMLInputElement).blur();
      }
    };

    const getM2TextWidth = (text: string): number => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return text.length * 14;
      context.font = "1.25rem 'Inter', sans-serif";
      const metrics = context.measureText(text);
      return Math.ceil(metrics.width) + 4;
    };

    const getM2InputWidth = (id: number): string => {
      const value = m2InputValues[id] || '';
      const maxLen = m2Inputs[id].maxLength;
      if (value.length >= maxLen) {
        return `${getM2TextWidth(value)}px`;
      }
      const mobileOffset = isMobileM2FB ? CHAR_UNIT_WIDTH : 0;
      return `${maxLen * CHAR_UNIT_WIDTH - mobileOffset}px`;
    };

    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        <div className="flex-1 flex flex-col overflow-auto">
          {/* Header */}
          <div className="bg-[#1e6b73] h-12 sm:h-14 flex items-center justify-between px-3 sm:px-8 shrink-0 relative">
            <div className="flex items-center min-w-0 shrink">
              <div 
                className="text-white text-lg sm:text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity truncate"
                onClick={() => {
                  setShowModule2FillBlanks(false);
                  if (testBankType === 'tpo') {
                    setActiveTab('TPO');
                  } else {
                    setActiveTab('Real Test');
                  }
                }}
              >
                *toefl ibt
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button 
                ref={m2FBVolumeButtonRef as React.RefObject<HTMLButtonElement>}
                className={`flex items-center gap-1.5 sm:gap-3 border rounded-lg px-3 sm:px-5 py-1.5 sm:py-2 transition-colors ${
                  isM2FBVolumeOpen 
                    ? 'bg-white border-white text-[#1e6b73]' 
                    : 'bg-[#0A6068] border-white text-white hover:bg-[#084d52]'
                }`}
                onClick={toggleM2FBVolume}
              >
                <span className="font-['Inter',_sans-serif] font-semibold text-sm sm:text-base">Volume</span>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill={isM2FBVolumeOpen ? '#1e6b73' : 'white'}>
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </svg>
              </button>
              <button 
                className="flex items-center gap-1.5 sm:gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-3 sm:px-5 py-1.5 sm:py-2 hover:bg-gray-100 transition-colors"
                onClick={() => {
                  setShowModule2FillBlanks(false);
                  setShowModule2Question11(true);
                }}
              >
                <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-sm sm:text-base">Next</span>
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="#0A6068">
                  <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Navigation tabs */}
          <div className="bg-white border-b border-gray-300 shrink-0">
            <div className="px-3 sm:px-8 py-2 sm:py-3">
              <div className="flex gap-4 sm:gap-8">
                <div className="text-gray-700 font-['Inter',_sans-serif] text-sm sm:text-base font-bold border-b-2 border-[#1e6b73] pb-2">
                  Reading
                </div>
                <div className="text-gray-500 text-xs sm:text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
                  Question 1-10
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 bg-white overflow-auto">
            <div className="p-4 sm:p-5 md:p-12 pt-8 sm:pt-16 md:pt-24 flex flex-col items-center">
              <h1 className="mb-10 sm:mb-12 md:mb-14 text-xl sm:text-2xl md:text-[1.75rem] text-black font-bold font-['Inter',_sans-serif] text-center px-2">
                Fill in the missing letters in the paragraph.
              </h1>

              <div className="max-w-[900px] w-full text-lg sm:text-lg md:text-[1.25rem] leading-[1.8] sm:leading-relaxed md:leading-[1.8] text-black font-['Inter',_sans-serif] px-1 sm:px-4" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                {/* CMS PRIORITY: dynamic passage renderer */}
                {m2NormalizedPassage ? (() => {
                  const parts: React.ReactNode[] = [];
                  let key = 0;
                  const regex = /\[(\d+)\]/g;
                  let lastIndex = 0;
                  let match;
                  while ((match = regex.exec(m2NormalizedPassage)) !== null) {
                    const id = parseInt(match[1]);
                    const before = m2NormalizedPassage.substring(lastIndex, match.index);
                    if (before) parts.push(<span key={`t${key++}`}>{before}</span>);
                    parts.push(
                      <input key={`i${id}`} type="text" data-input-id={`m2-${id}`}
                        className={`m2-gap-input ${m2FilledInputs[id] ? 'filled' : ''}`}
                        maxLength={m2Inputs[id]?.maxLength || 5}
                        value={m2InputValues[id] || ''}
                        onChange={(e) => handleM2InputChange(id, e.target.value)}
                        onFocus={() => handleM2Focus(id)} onBlur={() => handleM2Blur(id)}
                        onKeyPress={(e) => handleM2KeyPress(e, id)}
                        style={{ width: getM2InputWidth(id) }} />
                    );
                    lastIndex = match.index + match[0].length;
                  }
                  if (lastIndex < m2NormalizedPassage.length) parts.push(<span key={`t${key++}`}>{m2NormalizedPassage.substring(lastIndex)}</span>);
                  return parts;
                })() : (
                  <>
                The human brain is a complex organ responsible for controlling all bodily functions and enabling thought, emotion, and memory. It i<input
                  type="text" data-input-id="m2-0"
                  className={`m2-gap-input ${m2FilledInputs[0] ? 'filled' : ''}`}
                  maxLength={m2Inputs[0].maxLength} value={m2InputValues[0] || ''}
                  onChange={(e) => handleM2InputChange(0, e.target.value)}
                  onFocus={() => handleM2Focus(0)} onBlur={() => handleM2Blur(0)}
                  onKeyPress={(e) => handleM2KeyPress(e, 0)} style={{ width: getM2InputWidth(0) }}
                /> divided in<input
                  type="text" data-input-id="m2-1"
                  className={`m2-gap-input ${m2FilledInputs[1] ? 'filled' : ''}`}
                  maxLength={m2Inputs[1].maxLength} value={m2InputValues[1] || ''}
                  onChange={(e) => handleM2InputChange(1, e.target.value)}
                  onFocus={() => handleM2Focus(1)} onBlur={() => handleM2Blur(1)}
                  onKeyPress={(e) => handleM2KeyPress(e, 1)} style={{ width: getM2InputWidth(1) }}
                /> several reg<input
                  type="text" data-input-id="m2-2"
                  className={`m2-gap-input ${m2FilledInputs[2] ? 'filled' : ''}`}
                  maxLength={m2Inputs[2].maxLength} value={m2InputValues[2] || ''}
                  onChange={(e) => handleM2InputChange(2, e.target.value)}
                  onFocus={() => handleM2Focus(2)} onBlur={() => handleM2Blur(2)}
                  onKeyPress={(e) => handleM2KeyPress(e, 2)} style={{ width: getM2InputWidth(2) }}
                />, each wi<input
                  type="text" data-input-id="m2-3"
                  className={`m2-gap-input ${m2FilledInputs[3] ? 'filled' : ''}`}
                  maxLength={m2Inputs[3].maxLength} value={m2InputValues[3] || ''}
                  onChange={(e) => handleM2InputChange(3, e.target.value)}
                  onFocus={() => handleM2Focus(3)} onBlur={() => handleM2Blur(3)}
                  onKeyPress={(e) => handleM2KeyPress(e, 3)} style={{ width: getM2InputWidth(3) }}
                /> specific ro<input
                  type="text" data-input-id="m2-4"
                  className={`m2-gap-input ${m2FilledInputs[4] ? 'filled' : ''}`}
                  maxLength={m2Inputs[4].maxLength} value={m2InputValues[4] || ''}
                  onChange={(e) => handleM2InputChange(4, e.target.value)}
                  onFocus={() => handleM2Focus(4)} onBlur={() => handleM2Blur(4)}
                  onKeyPress={(e) => handleM2KeyPress(e, 4)} style={{ width: getM2InputWidth(4) }}
                />. The cerebrum, i<input
                  type="text" data-input-id="m2-5"
                  className={`m2-gap-input ${m2FilledInputs[5] ? 'filled' : ''}`}
                  maxLength={m2Inputs[5].maxLength} value={m2InputValues[5] || ''}
                  onChange={(e) => handleM2InputChange(5, e.target.value)}
                  onFocus={() => handleM2Focus(5)} onBlur={() => handleM2Blur(5)}
                  onKeyPress={(e) => handleM2KeyPress(e, 5)} style={{ width: getM2InputWidth(5) }}
                /> largest pa<input
                  type="text" data-input-id="m2-6"
                  className={`m2-gap-input ${m2FilledInputs[6] ? 'filled' : ''}`}
                  maxLength={m2Inputs[6].maxLength} value={m2InputValues[6] || ''}
                  onChange={(e) => handleM2InputChange(6, e.target.value)}
                  onFocus={() => handleM2Focus(6)} onBlur={() => handleM2Blur(6)}
                  onKeyPress={(e) => handleM2KeyPress(e, 6)} style={{ width: getM2InputWidth(6) }}
                />, is invo<input
                  type="text" data-input-id="m2-7"
                  className={`m2-gap-input ${m2FilledInputs[7] ? 'filled' : ''}`}
                  maxLength={m2Inputs[7].maxLength} value={m2InputValues[7] || ''}
                  onChange={(e) => handleM2InputChange(7, e.target.value)}
                  onFocus={() => handleM2Focus(7)} onBlur={() => handleM2Blur(7)}
                  onKeyPress={(e) => handleM2KeyPress(e, 7)} style={{ width: getM2InputWidth(7) }}
                /> in higher cogn<input
                  type="text" data-input-id="m2-8"
                  className={`m2-gap-input ${m2FilledInputs[8] ? 'filled' : ''}`}
                  maxLength={m2Inputs[8].maxLength} value={m2InputValues[8] || ''}
                  onChange={(e) => handleM2InputChange(8, e.target.value)}
                  onFocus={() => handleM2Focus(8)} onBlur={() => handleM2Blur(8)}
                  onKeyPress={(e) => handleM2KeyPress(e, 8)} style={{ width: getM2InputWidth(8) }}
                /> functions su<input
                  type="text" data-input-id="m2-9"
                  className={`m2-gap-input ${m2FilledInputs[9] ? 'filled' : ''}`}
                  maxLength={m2Inputs[9].maxLength} value={m2InputValues[9] || ''}
                  onChange={(e) => handleM2InputChange(9, e.target.value)}
                  onFocus={() => handleM2Focus(9)} onBlur={() => handleM2Blur(9)}
                  onKeyPress={(e) => handleM2KeyPress(e, 9)} style={{ width: getM2InputWidth(9) }}
                /> as reasoning, planning, and language. The cerebellum coordinates movement and balance, while the brainstem controls vital bodily functions like breathing and heart rate. Together, they enable the brain to perform its various tasks.
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <VolumeControl isOpen={isM2FBVolumeOpen} onClose={closeM2FBVolume} buttonRef={m2FBVolumeButtonRef} />
        
        <MobileQuestionNav 
          onBack={() => {
            setShowModule2FillBlanks(false);
            setShowModule2(true);
          }}
          onHome={() => {
            setShowModule2FillBlanks(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onNext={() => {
            setShowModule2FillBlanks(false);
            setShowModule2Question11(true);
          }}
        />
      </div>
    );
  };

  // Module 2 - Question 11 (Email - Art Workshop Date)
  const Module2Question11Screen = () => {
    const [selectedAnswer11, setSelectedAnswer11] = useState<string | null>(null);
    const correctAnswer = "September 12th";

    const answerOptions = [
      "September 10th",
      "September 12th",
      "September 20th",
      "September 30th"
    ];

    // CMS PRIORITY: load Module 2 question 11 from CMS
    const cmsSection11 = getCurrentSectionData('Reading');
    // 1순위: Module 2 태그 + 번호 일치
    // 2순위: Module 2 태그된 Daily Life 문제 중 0번째
    // 3순위: 번호만 일치 (Module 1 fallback)
    const cmsDailyQ11 = cmsSection11?.questions.find(q => {
      const t = (q.questionType || '').toLowerCase();
      const num = q.questionNumber;
      return t.includes('module 2') && (num === 11 || num === '11' || String(num) === '11');
    }) || cmsSection11?.questions.filter(q => {
      const t = (q.questionType || '').toLowerCase();
      return t.includes('module 2') && (
        t.includes('daily life') || t.includes('read in daily life') ||
        t.includes('notice') || t.includes('email') || t.includes('social media') ||
        t.includes('실용문')
      );
    })[0] || cmsSection11?.questions.find(q => {
      const num = q.questionNumber;
      return num === 11 || num === '11' || String(num) === '11';
    }) || null;

    const cmsPassageText11 = cmsDailyQ11?.passageText || null;
    const cmsPassageTitle11 = cmsDailyQ11?.passageTitle || null;
    const cmsQuestionText11 = cmsDailyQ11?.questionText || null;
    const cmsAnswerOptions11 = (cmsDailyQ11?.options && cmsDailyQ11!.options!.length > 0)
      ? cmsDailyQ11!.options! : null;
    const cmsCorrectAnswer11 = cmsDailyQ11?.correctAnswer as string | null || null;


    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="flex bg-[#1e6b73] h-12 sm:h-16 items-center justify-between px-2 sm:px-8 shadow-lg">
          <div className="flex items-center shrink-0">
            <div className="text-white text-sm sm:text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity leading-tight" onClick={() => { setShowModule2Question11(false); if (testBankType === 'tpo') { setActiveTab('TPO'); } else { setActiveTab('Real Test'); } }}>
              *toefl ibt
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button ref={volumeButtonRef} onClick={toggleVolume} className="flex items-center gap-1 sm:gap-3 bg-[#0A6068] border border-white rounded-lg px-2 sm:px-5 py-1.5 sm:py-2 hover:bg-[#084d52] transition-colors">
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-xs sm:text-base">Volume</span>
              <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="white"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
            </button>
            <button className="flex items-center gap-1 sm:gap-2 bg-[#0A6068] border border-white rounded-lg px-2 sm:px-5 py-1.5 sm:py-2 hover:bg-[#084d52] transition-colors" onClick={() => { setShowModule2Question11(false); setShowModule2FillBlanks(true); }}>
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="white"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-xs sm:text-base">Back</span>
            </button>
            <button className="flex items-center gap-1 sm:gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-2 sm:px-5 py-1.5 sm:py-2 hover:bg-gray-100 transition-colors" onClick={() => { setShowModule2Question11(false); setShowModule2Question12(true); }}>
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-xs sm:text-base">Next</span>
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="#0A6068"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>
            </button>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-3 sm:px-8 py-2 sm:py-3">
            <div className="flex gap-4 sm:gap-8">
              <div className="text-gray-700 font-['Inter',_sans-serif] text-sm sm:text-base font-bold border-b-2 border-[#1e6b73] pb-2">Reading</div>
              <div className="text-gray-500 text-xs sm:text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">Question 11 of 20</div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto bg-white border border-black">
          <h1 className="hidden sm:block text-xl md:text-2xl lg:text-3xl font-['Inter',_sans-serif] font-bold text-black py-6 lg:py-8 text-center">{getDailyLifePageTitle(cmsPassageTitle11, cmsPassageText11)}</h1>
          
          <ResizableReadingLayout
            passageTitle={getDailyLifePageTitle(null, cmsPassageText11)}
            passageSummary={<><strong>Art Workshop Reservation Confirmation</strong><br/>From: artforeveryone@dmail.com</>}
            questionInfo="1/2"
            onBack={() => { setShowModule2Question11(false); setShowModule2FillBlanks(true); }}
            onNext={() => { setShowModule2Question11(false); setShowModule2Question12(true); }}
            onSubmit={() => { setShowModule2Question11(false); setShowModule2Question12(true); }}
            leftContent={
              <div className="relative w-full">
                {/* CMS PRIORITY: render template from CMS passageText JSON */}
                {cmsPassageText11
                  ? (renderDailyLifePassage(cmsPassageText11) ?? (
                      <div className="border-2 border-gray-200 rounded-lg p-4">
                        <p className="font-[\'Inter\',_sans-serif] text-sm whitespace-pre-wrap">{cmsPassageText11}</p>
                      </div>
                    ))
                  : (
              <div className="relative w-full">
                <div className="border-2 md:border-4 border-[#1e6b73] rounded-lg overflow-hidden bg-white" style={{ color: '#1e6b73' }}>
                  <div className="bg-white">
                    <div className="flex border-b-2 border-[#1e6b73]">
                      <div className="bg-[#1e6b73] text-white font-['Inter',_sans-serif] font-bold px-2 sm:px-4 py-2 w-16 sm:w-24 text-sm sm:text-base">To:</div>
                      <div className="flex-1 bg-white px-2 sm:px-4 py-2 font-['Inter',_sans-serif] text-sm sm:text-base">edward56L@dmail.com</div>
                    </div>
                    <div className="flex border-b-2 border-[#1e6b73]">
                      <div className="bg-[#1e6b73] text-white font-['Inter',_sans-serif] font-bold px-2 sm:px-4 py-2 w-16 sm:w-24 text-sm sm:text-base">From:</div>
                      <div className="flex-1 bg-white px-2 sm:px-4 py-2 font-['Inter',_sans-serif] text-sm sm:text-base">artforeveryone@dmail.com</div>
                    </div>
                    <div className="flex border-b-2 border-[#1e6b73]">
                      <div className="bg-[#1e6b73] text-white font-['Inter',_sans-serif] font-bold px-2 sm:px-4 py-2 w-16 sm:w-24 text-sm sm:text-base">Date:</div>
                      <div className="flex-1 bg-white px-2 sm:px-4 py-2 font-['Inter',_sans-serif] text-sm sm:text-base">10/09/2025</div>
                    </div>
                    <div className="flex border-b-2 border-[#1e6b73]">
                      <div className="bg-[#1e6b73] text-white font-['Inter',_sans-serif] font-bold px-2 sm:px-4 py-2 w-16 sm:w-24 text-sm sm:text-base">Subject:</div>
                      <div className="flex-1 bg-white px-2 sm:px-4 py-2 font-['Inter',_sans-serif] text-sm sm:text-base">Art Workshop Reservation Confirmation</div>
                    </div>
                  </div>
                  <div className="p-3 sm:p-6 bg-white border-2 sm:border-4 border-current m-1 sm:m-2 max-h-[400px] overflow-y-auto text-sm sm:text-base">
                    <p className="font-['Inter',_sans-serif] mb-4 text-sm sm:text-base">Dear Ms. Edwards,</p>
                    <p className="font-['Inter',_sans-serif] mb-4 text-sm sm:text-base">
                      The reservation for the art workshop that you made on September 10th has been confirmed. The workshop will take place on September 20th at 3:00 PM. All necessary arts supplies will be provided, but please bring your own apron or smock.
                    </p>
                    <p className="font-['Inter',_sans-serif] mb-4 text-sm sm:text-base">Best regards,</p>
                    <p className="font-['Inter',_sans-serif] text-sm sm:text-base">Laura Bennett</p>
                  </div>
                </div>
              </div>
                  )
                }
              </div>
            }
            rightContent={
              <>
                <h3 className="text-base sm:text-lg md:text-xl font-['Inter',_sans-serif] font-bold text-black mb-4 md:mb-8 lg:mb-10">{cmsQuestionText11 || "When is the date of the art workshop?"}</h3>
                <div className="space-y-3 md:space-y-4 lg:space-y-6">
                  {(cmsAnswerOptions11 || answerOptions).map((option, index) => (
                    <RadioOption
                      key={index}
                      id={`module2-q11-option-${index}`}
                      name="module2-q11"
                      value={option}
                      checked={selectedAnswer11 === option}
                      onChange={() => setSelectedAnswer11(option)}
                      label={option}
                      size="sm"
                    />
                  ))}
                </div>
              </>
            }
          />
        </div>
        
        <MobileQuestionNav 
          onBack={() => {
            setShowModule2Question11(false);
            setShowModule2FillBlanks(true);
          }}
          onHome={() => {
            setShowModule2Question11(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onNext={() => {
            setShowModule2Question11(false);
            setShowModule2Question12(true);
          }}
        />
      </div>
    );
  };

  // Module 2 - Question 12 (Email - What to bring)
  const Module2Question12Screen = () => {
    const [selectedAnswer12, setSelectedAnswer12] = useState<string | null>(null);
    const correctAnswer = "A protective garment";

    const answerOptions = [
      "A payment method",
      "Extra paint",
      "A protective garment",
      "Proof of reservation"
    ];

    // CMS PRIORITY: load Module 2 question 12 from CMS
    const cmsSection12 = getCurrentSectionData('Reading');
    const cmsDailyQ12 = cmsSection12?.questions.find(q => {
      const t = (q.questionType || '').toLowerCase();
      const num = q.questionNumber;
      return t.includes('module 2') && (num === 12 || num === '12' || String(num) === '12');
    }) || cmsSection12?.questions.filter(q => {
      const t = (q.questionType || '').toLowerCase();
      return t.includes('module 2') && (
        t.includes('daily life') || t.includes('read in daily life') ||
        t.includes('notice') || t.includes('email') || t.includes('social media') || t.includes('실용문')
      );
    })[0] || cmsSection12?.questions.find(q => {
      const num = q.questionNumber;
      return num === 12 || num === '12' || String(num) === '12';
    }) || null;

    const cmsPassageText12 = cmsDailyQ12?.passageText || null;
    const cmsPassageTitle12 = cmsDailyQ12?.passageTitle || null;
    const cmsQuestionText12 = cmsDailyQ12?.questionText || null;
    const cmsAnswerOptions12 = (cmsDailyQ12?.options && cmsDailyQ12!.options!.length > 0)
      ? cmsDailyQ12!.options! : null;
    const cmsCorrectAnswer12 = cmsDailyQ12?.correctAnswer as string | null || null;


    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowModule2Question12(false);
                if (testBankType === 'tpo') {
                  setActiveTab('TPO');
                } else {
                  setActiveTab('Real Test');
                }
              }}
            >
              *toefl ibt
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Volume Button */}
            <button ref={volumeButtonRef} onClick={toggleVolume} className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowModule2Question12(false);
                setShowModule2Question11(true);
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Back</span>
            </button>
            
            {/* Next Button */}
            <button 
              className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
              onClick={() => {
                setShowModule2Question12(false);
                setShowModule2Question13(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-3 md:px-8 py-3">
            <div className="flex gap-4 md:gap-8">
              <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
                Reading
              </div>
              <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
                Question 12 of 20
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto bg-white border border-black">
          <h1 className="hidden sm:block text-xl md:text-2xl lg:text-3xl font-['Inter',_sans-serif] font-bold text-black py-6 lg:py-8 text-center">{getDailyLifePageTitle(cmsPassageTitle12, cmsPassageText12)}</h1>
          
          <ResizableReadingLayout
            passageTitle={getDailyLifePageTitle(null, cmsPassageText12)}
            passageSummary={<><strong>Art Workshop Reservation Confirmation</strong><br/>From: artforeveryone@dmail.com</>}
            questionInfo="2/2"
            onBack={() => { setShowModule2Question12(false); setShowModule2Question11(true); }}
            onPrev={() => { setShowModule2Question12(false); setShowModule2Question11(true); }}
            onNext={() => { setShowModule2Question12(false); setShowModule2Question13(true); }}
            onSubmit={() => { setShowModule2Question12(false); setShowModule2Question13(true); }}
            leftContent={
              <div className="relative w-full">
                {/* CMS PRIORITY */}
                {cmsPassageText12
                  ? (renderDailyLifePassage(cmsPassageText12) ?? (
                      <div className="border-2 border-gray-200 rounded-lg p-4">
                        <p className="font-[\'Inter\',_sans-serif] text-sm whitespace-pre-wrap">{cmsPassageText12}</p>
                      </div>
                    ))
                  : (
                    <div className="relative w-full">
                <div className="border-2 md:border-4 border-[#1e6b73] rounded-lg overflow-hidden bg-white" style={{ color: '#1e6b73' }}>
                  {/* Email Header Fields */}
                  <div className="bg-white">
                    <div className="flex border-b-2 border-[#1e6b73]">
                      <div className="bg-[#1e6b73] text-white font-['Inter',_sans-serif] font-bold px-2 sm:px-4 py-2 w-16 sm:w-24 text-sm sm:text-base">To:</div>
                      <div className="flex-1 bg-white px-2 sm:px-4 py-2 font-['Inter',_sans-serif] text-sm sm:text-base">edward56L@dmail.com</div>
                    </div>
                    <div className="flex border-b-2 border-[#1e6b73]">
                      <div className="bg-[#1e6b73] text-white font-['Inter',_sans-serif] font-bold px-2 sm:px-4 py-2 w-16 sm:w-24 text-sm sm:text-base">From:</div>
                      <div className="flex-1 bg-white px-2 sm:px-4 py-2 font-['Inter',_sans-serif] text-sm sm:text-base">artforeveryone@dmail.com</div>
                    </div>
                    <div className="flex border-b-2 border-[#1e6b73]">
                      <div className="bg-[#1e6b73] text-white font-['Inter',_sans-serif] font-bold px-2 sm:px-4 py-2 w-16 sm:w-24 text-sm sm:text-base">Date:</div>
                      <div className="flex-1 bg-white px-2 sm:px-4 py-2 font-['Inter',_sans-serif] text-sm sm:text-base">10/09/2025</div>
                    </div>
                    <div className="flex border-b-2 border-[#1e6b73]">
                      <div className="bg-[#1e6b73] text-white font-['Inter',_sans-serif] font-bold px-2 sm:px-4 py-2 w-16 sm:w-24 text-sm sm:text-base">Subject:</div>
                      <div className="flex-1 bg-white px-2 sm:px-4 py-2 font-['Inter',_sans-serif] text-sm sm:text-base">Art Workshop Reservation Confirmation</div>
                    </div>
                  </div>
                  
                  {/* Email Body */}
                  <div className="p-3 sm:p-6 bg-white border-2 sm:border-4 border-current m-1 sm:m-2 max-h-[400px] overflow-y-auto text-sm sm:text-base">
                    <p className="font-['Inter',_sans-serif] mb-4 text-sm sm:text-base">Dear Ms. Edwards,</p>
                    <p className="font-['Inter',_sans-serif] mb-4 text-sm sm:text-base">
                      The reservation for the art workshop that you made on September 10th has been confirmed. The workshop will take place on September 20th at 3:00 PM. All necessary arts supplies will be provided, but please bring your own apron or smock.
                    </p>
                    <p className="font-['Inter',_sans-serif] mb-4 text-sm sm:text-base">Best regards,</p>
                    <p className="font-['Inter',_sans-serif] text-sm sm:text-base">Laura Bennett</p>
                  </div>
                </div>

                    </div>
                  )
                }
              </div>
            }
            rightContent={
              <>
                <h3 className="text-base sm:text-lg md:text-xl font-['Inter',_sans-serif] font-bold text-black mb-4 md:mb-8 lg:mb-10">{cmsQuestionText12 || "What should Ms. Edwards bring to the workshop?"}</h3>
                
                <div className="space-y-3 md:space-y-4 lg:space-y-6">
                  {(cmsAnswerOptions12 || answerOptions).map((option, index) => (
                    <RadioOption
                      key={index}
                      id={`module2-q12-option-${index}`}
                      name="module2-q12"
                      value={option}
                      checked={selectedAnswer12 === option}
                      onChange={() => setSelectedAnswer12(option)}
                      label={option}
                      size="sm"
                    />
                  ))}
                </div>
              </>
            }
          />
        </div>
        
        <MobileQuestionNav 
          onBack={() => {
            setShowModule2Question12(false);
            setShowModule2Question11(true);
          }}
          onHome={() => {
            setShowModule2Question12(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onNext={() => {
            setShowModule2Question12(false);
            setShowModule2Question13(true);
          }}
        />
      </div>
    );
  };

  // Module 2 - Question 13 (Email - Main Purpose)
  const Module2Question13Screen = () => {
    const [selectedAnswer13, setSelectedAnswer13] = useState<string | null>(null);
    const correctAnswer = "To announce a discount available to fitness-center members";

    const answerOptions = [
      "To attract customers to a new fitness center",
      "To provide Ms. Nguyen with an opportunity to provide expert personal training",
      "To celebrate Ms. Nguyen's achievements in wellness",
      "To announce a discount available to fitness-center members"
    ];

    // CMS PRIORITY: load Module 2 question 13 from CMS
    const cmsSection13 = getCurrentSectionData('Reading');
    const cmsDailyQ13 = cmsSection13?.questions.find(q => {
      const t = (q.questionType || '').toLowerCase();
      const num = q.questionNumber;
      return t.includes('module 2') && (num === 13 || num === '13' || String(num) === '13');
    }) || cmsSection13?.questions.filter(q => {
      const t = (q.questionType || '').toLowerCase();
      return t.includes('module 2') && (
        t.includes('daily life') || t.includes('read in daily life') ||
        t.includes('notice') || t.includes('email') || t.includes('social media') || t.includes('실용문')
      );
    })[1] || cmsSection13?.questions.find(q => {
      const num = q.questionNumber;
      return num === 13 || num === '13' || String(num) === '13';
    }) || null;

    const cmsPassageText13 = cmsDailyQ13?.passageText || null;
    const cmsPassageTitle13 = cmsDailyQ13?.passageTitle || null;
    const cmsQuestionText13 = cmsDailyQ13?.questionText || null;
    const cmsAnswerOptions13 = (cmsDailyQ13?.options && cmsDailyQ13!.options!.length > 0)
      ? cmsDailyQ13!.options! : null;
    const cmsCorrectAnswer13 = cmsDailyQ13?.correctAnswer as string | null || null;


    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowModule2Question13(false);
                if (testBankType === 'tpo') {
                  setActiveTab('TPO');
                } else {
                  setActiveTab('Real Test');
                }
              }}
            >
              *toefl ibt
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Volume Button */}
            <button ref={volumeButtonRef} onClick={toggleVolume} className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowModule2Question13(false);
                setShowModule2Question12(true);
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Back</span>
            </button>
            
            {/* Next Button */}
            <button 
              className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
              onClick={() => {
                setShowModule2Question13(false);
                setShowModule2Question14(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-3 md:px-8 py-3">
            <div className="flex gap-4 md:gap-8">
              <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
                Reading
              </div>
              <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
                Question 13 of 20
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto bg-white border border-black">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-['Inter',_sans-serif] font-bold text-black py-3 md:py-6 lg:py-8 text-center">{getDailyLifePageTitle(cmsPassageTitle13, cmsPassageText13)}</h1>
          
          <ResizableReadingLayout
            passageTitle={getDailyLifePageTitle(null, cmsPassageText13)}
            passageSummary={<><strong>Grand Opening Invitation</strong><br/>From: part.gymworkers@dmail.com</>}
            questionInfo="1/3"
            onBack={() => { setShowModule2Question13(false); setShowModule2Question12(true); }}
            onPrev={() => { setShowModule2Question13(false); setShowModule2Question12(true); }}
            onNext={() => { setShowModule2Question13(false); setShowModule2Question14(true); }}
            onSubmit={() => { setShowModule2Question13(false); setShowModule2Question14(true); }}
            leftContent={
              <div className="relative w-full">
                {/* CMS PRIORITY: render template from CMS passageText JSON */}
                {cmsPassageText13
                  ? (renderDailyLifePassage(cmsPassageText13) ?? (
                      <div className="border-2 border-gray-200 rounded-lg p-4">
                        <p className="font-[\'Inter\',_sans-serif] text-sm whitespace-pre-wrap">{cmsPassageText13}</p>
                      </div>
                    ))
                  : (
              <div className="relative w-full">
                {/* CMS PRIORITY: render template from CMS passageText JSON */}
                {cmsPassageText13
                  ? (renderDailyLifePassage(cmsPassageText13) ?? (
                      <div className="border-2 border-gray-200 rounded-lg p-4">
                        <p className="font-[\'Inter\',_sans-serif] text-sm whitespace-pre-wrap">{cmsPassageText13}</p>
                      </div>
                    ))
                  : (
              <div className="relative w-full">
                <div className="border-2 md:border-4 border-[#9d5a2f] rounded-lg overflow-hidden bg-white">
                  {/* Email Header Fields */}
                  <div className="bg-white">
                    <div className="flex border-b-2 border-[#9d5a2f]">
                      <div className="bg-[#9d5a2f] text-white font-['Inter',_sans-serif] font-bold px-4 py-2 w-24 text-base">To:</div>
                      <div className="flex-1 bg-white px-4 py-2 font-['Inter',_sans-serif] text-base">nguyenbooklover@dmail.com</div>
                    </div>
                    <div className="flex border-b-2 border-[#9d5a2f]">
                      <div className="bg-[#9d5a2f] text-white font-['Inter',_sans-serif] font-bold px-4 py-2 w-24 text-base">From:</div>
                      <div className="flex-1 bg-white px-4 py-2 font-['Inter',_sans-serif] text-base">part.gymworkers@dmail.com</div>
                    </div>
                    <div className="flex border-b-2 border-[#9d5a2f]">
                      <div className="bg-[#9d5a2f] text-white font-['Inter',_sans-serif] font-bold px-4 py-2 w-24 text-base">Subject:</div>
                      <div className="flex-1 bg-white px-4 py-2 font-['Inter',_sans-serif] text-base">You're Invited – Bring Friends & Family to Our Grand Opening!</div>
                    </div>
                  </div>
                  
                  {/* Email Body */}
                  <div className="p-3 md:p-5 bg-white border-2 md:border-4 border-[#9d5a2f] m-1 md:m-2 max-h-[450px] overflow-y-auto text-sm md:text-base">
                    <p className="font-['Inter',_sans-serif] mb-3">Dear Ms. Nguyen,</p>
                    <p className="font-['Inter',_sans-serif] mb-3">
                      We're excited to invite you—and your friends and family—to the grand opening of our new branch at 25 Orchid Street, happening next Monday. This event is a great opportunity to explore our state-of-the-art facility, featuring top-tier equipment, energizing group classes, and expert personal training.
                    </p>
                    <p className="font-['Inter',_sans-serif] mb-3">
                      This celebration, exclusively for our valued members and their guests, will include guided tours, live fitness demonstrations, and complimentary refreshments. It's the perfect chance to experience our community-focused approach to wellness and introduce others to a space designed for all fitness levels.
                    </p>
                    <p className="font-['Inter',_sans-serif] mb-3">
                      Bring your friends and family! We're offering a special one-day-only discount on memberships for all attendees.
                    </p>
                    <p className="font-['Inter',_sans-serif] mb-3">
                      For questions or to RSVP, contact our customer service team at 555-1234.
                    </p>
                    <p className="font-['Inter',_sans-serif] mb-2">Warm regards,</p>
                    <p className="font-['Inter',_sans-serif]">John Parker</p>
                  </div>
                </div>
              </div>
                  )
                }
              </div>
                  )
                }
              </div>
            }
            rightContent={
              <>
                <h3 className="text-base sm:text-lg md:text-xl font-['Inter',_sans-serif] font-bold text-black mb-4 md:mb-8 lg:mb-10">{cmsQuestionText13 || "What is the main purpose of the email?"}</h3>
                
                <div className="space-y-3 md:space-y-4 lg:space-y-6">
                  {(cmsAnswerOptions13 || answerOptions).map((option, index) => (
                    <RadioOption
                      key={index}
                      id={`module2-q13-option-${index}`}
                      name="module2-q13"
                      value={option}
                      checked={selectedAnswer13 === option}
                      onChange={() => setSelectedAnswer13(option)}
                      label={option}
                      size="sm"
                    />
                  ))}
                </div>
              </>
            }
          />
        </div>
        
        <MobileQuestionNav 
          onBack={() => {
            setShowModule2Question13(false);
            setShowModule2Question12(true);
          }}
          onHome={() => {
            setShowModule2Question13(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onNext={() => {
            setShowModule2Question13(false);
            setShowModule2Question14(true);
          }}
        />
      </div>
    );
  };

  // Module 2 - Question 14 (Email - Relationship inference)
  const Module2Question14Screen = () => {
    const [selectedAnswer14, setSelectedAnswer14] = useState<string | null>(null);
    const correctAnswer = "She is a member at one of the fitness center's other locations.";

    const answerOptions = [
      "She helps the fitness center to organize activities.",
      "She has already explored the new facility.",
      "She is a member at one of the fitness center's other locations.",
      "She is new to using fitness centers and exercise equipment."
    ];

    // CMS PRIORITY: load Module 2 question 14 from CMS
    const cmsSection14 = getCurrentSectionData('Reading');
    const cmsDailyQ14 = cmsSection14?.questions.find(q => {
      const t = (q.questionType || '').toLowerCase();
      const num = q.questionNumber;
      return t.includes('module 2') && (num === 14 || num === '14' || String(num) === '14');
    }) || cmsSection14?.questions.filter(q => {
      const t = (q.questionType || '').toLowerCase();
      return t.includes('module 2') && (
        t.includes('daily life') || t.includes('read in daily life') ||
        t.includes('notice') || t.includes('email') || t.includes('social media') || t.includes('실용문')
      );
    })[2] || cmsSection14?.questions.find(q => {
      const num = q.questionNumber;
      return num === 14 || num === '14' || String(num) === '14';
    }) || null;

    const cmsPassageText14 = cmsDailyQ14?.passageText || null;
    const cmsPassageTitle14 = cmsDailyQ14?.passageTitle || null;
    const cmsQuestionText14 = cmsDailyQ14?.questionText || null;
    const cmsAnswerOptions14 = (cmsDailyQ14?.options && cmsDailyQ14!.options!.length > 0)
      ? cmsDailyQ14!.options! : null;
    const cmsCorrectAnswer14 = cmsDailyQ14?.correctAnswer as string | null || null;


    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowModule2Question14(false);
                if (testBankType === 'tpo') {
                  setActiveTab('TPO');
                } else {
                  setActiveTab('Real Test');
                }
              }}
            >
              *toefl ibt
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Volume Button */}
            <button ref={volumeButtonRef} onClick={toggleVolume} className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowModule2Question14(false);
                setShowModule2Question13(true);
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Back</span>
            </button>
            
            {/* Next Button */}
            <button 
              className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
              onClick={() => {
                setShowModule2Question14(false);
                setShowModule2Question15(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-3 md:px-8 py-3">
            <div className="flex gap-4 md:gap-8">
              <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
                Reading
              </div>
              <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
                Question 14 of 20
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto bg-white border border-black">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-['Inter',_sans-serif] font-bold text-black py-3 md:py-6 lg:py-8 text-center">{getDailyLifePageTitle(cmsPassageTitle14, cmsPassageText14)}</h1>
          
          <ResizableReadingLayout
            passageTitle={getDailyLifePageTitle(null, cmsPassageText14)}
            passageSummary={<><strong>Grand Opening Invitation</strong><br/>From: part.gymworkers@dmail.com</>}
            questionInfo="2/3"
            onBack={() => { setShowModule2Question14(false); setShowModule2Question13(true); }}
            onPrev={() => { setShowModule2Question14(false); setShowModule2Question13(true); }}
            onNext={() => { setShowModule2Question14(false); setShowModule2Question15(true); }}
            onSubmit={() => { setShowModule2Question14(false); setShowModule2Question15(true); }}
            leftContent={
              <div className="relative w-full">
                {/* CMS PRIORITY */}
                {cmsPassageText14
                  ? (renderDailyLifePassage(cmsPassageText14) ?? (
                      <div className="border-2 border-gray-200 rounded-lg p-4">
                        <p className="font-[\'Inter\',_sans-serif] text-sm whitespace-pre-wrap">{cmsPassageText14}</p>
                      </div>
                    ))
                  : (
                    <div className="relative w-full">
                <div className="border-2 md:border-4 border-[#9d5a2f] rounded-lg overflow-hidden bg-white">
                  {/* Email Header Fields */}
                  <div className="bg-white">
                    <div className="flex border-b-2 border-[#9d5a2f]">
                      <div className="bg-[#9d5a2f] text-white font-['Inter',_sans-serif] font-bold px-4 py-2 w-24 text-base">To:</div>
                      <div className="flex-1 bg-white px-4 py-2 font-['Inter',_sans-serif] text-base">nguyenbooklover@dmail.com</div>
                    </div>
                    <div className="flex border-b-2 border-[#9d5a2f]">
                      <div className="bg-[#9d5a2f] text-white font-['Inter',_sans-serif] font-bold px-4 py-2 w-24 text-base">From:</div>
                      <div className="flex-1 bg-white px-4 py-2 font-['Inter',_sans-serif] text-base">part.gymworkers@dmail.com</div>
                    </div>
                    <div className="flex border-b-2 border-[#9d5a2f]">
                      <div className="bg-[#9d5a2f] text-white font-['Inter',_sans-serif] font-bold px-4 py-2 w-24 text-base">Subject:</div>
                      <div className="flex-1 bg-white px-4 py-2 font-['Inter',_sans-serif] text-base">You're Invited – Bring Friends & Family to Our Grand Opening!</div>
                    </div>
                  </div>
                  
                  {/* Email Body */}
                  <div className="p-3 md:p-5 bg-white border-2 md:border-4 border-[#9d5a2f] m-1 md:m-2 max-h-[450px] overflow-y-auto text-sm md:text-base">
                    <p className="font-['Inter',_sans-serif] mb-3">Dear Ms. Nguyen,</p>
                    <p className="font-['Inter',_sans-serif] mb-3">
                      We're excited to invite you—and your friends and family—to the grand opening of our new branch at 25 Orchid Street, happening next Monday. This event is a great opportunity to explore our state-of-the-art facility, featuring top-tier equipment, energizing group classes, and expert personal training.
                    </p>
                    <p className="font-['Inter',_sans-serif] mb-3">
                      This celebration, exclusively for our valued members and their guests, will include guided tours, live fitness demonstrations, and complimentary refreshments. It's the perfect chance to experience our community-focused approach to wellness and introduce others to a space designed for all fitness levels.
                    </p>
                    <p className="font-['Inter',_sans-serif] mb-3">
                      Bring your friends and family! We're offering a special one-day-only discount on memberships for all attendees.
                    </p>
                    <p className="font-['Inter',_sans-serif] mb-3">
                      For questions or to RSVP, contact our customer service team at 555-1234.
                    </p>
                    <p className="font-['Inter',_sans-serif] mb-2">Warm regards,</p>
                    <p className="font-['Inter',_sans-serif]">John Parker</p>
                  </div>
                </div>

                    </div>
                  )
                }
              </div>
            }
            rightContent={
              <>
                <h3 className="text-base sm:text-lg md:text-xl font-['Inter',_sans-serif] font-bold text-black mb-4 md:mb-8 lg:mb-10">{cmsQuestionText14 || "What can be inferred about Ms. Nguyen's relationship with the fitness center?"}</h3>
                
                <div className="space-y-3 md:space-y-4 lg:space-y-6">
                  {(cmsAnswerOptions14 || answerOptions).map((option, index) => (
                    <RadioOption
                      key={index}
                      id={`module2-q14-option-${index}`}
                      name="module2-q14"
                      value={option}
                      checked={selectedAnswer14 === option}
                      onChange={() => setSelectedAnswer14(option)}
                      label={option}
                      size="sm"
                    />
                  ))}
                </div>
              </>
            }
          />
        </div>
        
        <MobileQuestionNav 
          onBack={() => {
            setShowModule2Question14(false);
            setShowModule2Question13(true);
          }}
          onHome={() => {
            setShowModule2Question14(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onNext={() => {
            setShowModule2Question14(false);
            setShowModule2Question15(true);
          }}
        />
      </div>
    );
  };

  // Module 2 - Question 15 (Email - Bakery stall question duplicate of Module 1 Q15)
  const Module2Question15Screen = () => {
    const [selectedAnswer15, setSelectedAnswer15] = useState<string | null>(null);
    const correctAnswer = "To get freshly baked bread and pastries before they are gone";

    const answerOptions = [
      "To get the free samples given in mornings",
      "To get freshly baked bread and pastries before they are gone",
      "To meet the famous baker",
      "To take advantage of early morning discounts"
    ];

    // CMS PRIORITY: load Module 2 question 15 from CMS
    const cmsSection15 = getCurrentSectionData('Reading');
    const cmsDailyQ15 = cmsSection15?.questions.find(q => {
      const t = (q.questionType || '').toLowerCase();
      const num = q.questionNumber;
      return t.includes('module 2') && (num === 15 || num === '15' || String(num) === '15');
    }) || cmsSection15?.questions.filter(q => {
      const t = (q.questionType || '').toLowerCase();
      return t.includes('module 2') && (
        t.includes('daily life') || t.includes('read in daily life') ||
        t.includes('notice') || t.includes('email') || t.includes('social media') || t.includes('실용문')
      );
    })[3] || cmsSection15?.questions.find(q => {
      const num = q.questionNumber;
      return num === 15 || num === '15' || String(num) === '15';
    }) || null;

    const cmsPassageText15 = cmsDailyQ15?.passageText || null;
    const cmsPassageTitle15 = cmsDailyQ15?.passageTitle || null;
    const cmsQuestionText15 = cmsDailyQ15?.questionText || null;
    const cmsAnswerOptions15 = (cmsDailyQ15?.options && cmsDailyQ15!.options!.length > 0)
      ? cmsDailyQ15!.options! : null;
    const cmsCorrectAnswer15 = cmsDailyQ15?.correctAnswer as string | null || null;


    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowModule2Question15(false);
                if (testBankType === 'tpo') {
                  setActiveTab('TPO');
                } else {
                  setActiveTab('Real Test');
                }
              }}
            >
              *toefl ibt
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Volume Button */}
            <button ref={volumeButtonRef} onClick={toggleVolume} className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowModule2Question15(false);
                setShowModule2Question14(true);
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Back</span>
            </button>
            
            {/* Next Button */}
            <button 
              className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
              onClick={() => {
                setShowModule2Question15(false);
                setShowModule2Question16(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-3 md:px-8 py-3">
            <div className="flex gap-4 md:gap-8">
              <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
                Reading
              </div>
              <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
                Question 15 of 20
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto bg-white border border-black">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-['Inter',_sans-serif] font-bold text-black py-3 md:py-6 lg:py-8 text-center">{getDailyLifePageTitle(cmsPassageTitle15, cmsPassageText15)}</h1>
          
          <ResizableReadingLayout
            passageTitle={getDailyLifePageTitle(null, cmsPassageText15)}
            passageSummary={<><strong>Grand Opening Invitation</strong><br/>From: part.gymworkers@dmail.com</>}
            questionInfo="3/3"
            onBack={() => { setShowModule2Question15(false); setShowModule2Question14(true); }}
            onPrev={() => { setShowModule2Question15(false); setShowModule2Question14(true); }}
            onNext={() => { setShowModule2Question15(false); setShowModule2Question16(true); }}
            onSubmit={() => { setShowModule2Question15(false); setShowModule2Question16(true); }}
            leftContent={
              <div className="relative w-full">
                {/* CMS PRIORITY */}
                {cmsPassageText15
                  ? (renderDailyLifePassage(cmsPassageText15) ?? (
                      <div className="border-2 border-gray-200 rounded-lg p-4">
                        <p className="font-['Inter',_sans-serif] text-sm sm:text-base whitespace-pre-wrap">{cmsPassageText15}</p>
                      </div>
                    ))
                  : (
                <div className="relative w-full">
                  <div className="border-2 md:border-4 border-[#9d5a2f] rounded-lg overflow-hidden bg-white">
                  {/* Email Header Fields */}
                  <div className="bg-white">
                    <div className="flex border-b-2 border-[#9d5a2f]">
                      <div className="bg-[#9d5a2f] text-white font-['Inter',_sans-serif] font-bold px-4 py-2 w-24 text-base">To:</div>
                      <div className="flex-1 bg-white px-4 py-2 font-['Inter',_sans-serif] text-base">nguyenbooklover@dmail.com</div>
                    </div>
                    <div className="flex border-b-2 border-[#9d5a2f]">
                      <div className="bg-[#9d5a2f] text-white font-['Inter',_sans-serif] font-bold px-4 py-2 w-24 text-base">From:</div>
                      <div className="flex-1 bg-white px-4 py-2 font-['Inter',_sans-serif] text-base">part.gymworkers@dmail.com</div>
                    </div>
                    <div className="flex border-b-2 border-[#9d5a2f]">
                      <div className="bg-[#9d5a2f] text-white font-['Inter',_sans-serif] font-bold px-4 py-2 w-24 text-base">Subject:</div>
                      <div className="flex-1 bg-white px-4 py-2 font-['Inter',_sans-serif] text-base">You're Invited – Bring Friends & Family to Our Grand Opening!</div>
                    </div>
                  </div>
                  
                  {/* Email Body */}
                  <div className="p-3 md:p-5 bg-white border-2 md:border-4 border-[#9d5a2f] m-1 md:m-2 max-h-[450px] overflow-y-auto text-sm md:text-base">
                    <p className="font-['Inter',_sans-serif] mb-3">Dear Ms. Nguyen,</p>
                    <p className="font-['Inter',_sans-serif] mb-3">
                      We're excited to invite you—and your friends and family—to the grand opening of our new branch at 25 Orchid Street, happening next Monday. This event is a great opportunity to explore our state-of-the-art facility, featuring top-tier equipment, energizing group classes, and expert personal training.
                    </p>
                    <p className="font-['Inter',_sans-serif] mb-3">
                      This celebration, exclusively for our valued members and their guests, will include guided tours, live fitness demonstrations, and complimentary refreshments. It's the perfect chance to experience our community-focused approach to wellness and introduce others to a space designed for all fitness levels.
                    </p>
                    <p className="font-['Inter',_sans-serif] mb-3">
                      Bring your friends and family! We're offering a special one-day-only discount on memberships for all attendees.
                    </p>
                    <p className="font-['Inter',_sans-serif] mb-3">
                      For questions or to RSVP, contact our customer service team at 555-1234.
                    </p>
                    <p className="font-['Inter',_sans-serif] mb-2">Warm regards,</p>
                    <p className="font-['Inter',_sans-serif]">John Parker</p>
                  </div>
                </div>
                </div>
                  )}
              </div>
            }
            rightContent={
              <>
                <h3 className="text-base sm:text-lg md:text-xl font-['Inter',_sans-serif] font-bold text-black mb-4 md:mb-8 lg:mb-10">{cmsQuestionText15 || "Why do customers go to the bakery stall early?"}</h3>
                
                <div className="space-y-3 md:space-y-4 lg:space-y-6">
                  {(cmsAnswerOptions15 || answerOptions).map((option, index) => (
                    <RadioOption
                      key={index}
                      id={`module2-q15-option-${index}`}
                      name="module2-q15"
                      value={option}
                      checked={selectedAnswer15 === option}
                      onChange={() => setSelectedAnswer15(option)}
                      label={option}
                      size="sm"
                    />
                  ))}
                </div>
              </>
            }
          />
        </div>
        
        <MobileQuestionNav 
          onBack={() => {
            setShowModule2Question15(false);
            setShowModule2Question14(true);
          }}
          onHome={() => {
            setShowModule2Question15(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onNext={() => {
            setShowModule2Question15(false);
            setShowModule2Question16(true);
          }}
        />
      </div>
    );
  };

  // Module 2 - Question 16 (The Paradox of Choice - Main Idea)
  const Module2Question16Screen = () => {
    const [selectedAnswer16, setSelectedAnswer16] = useState<string | null>(null);
    const [zoom16, setZoom16] = useState(1);
    const correctAnswer = "Limiting consumer choices can lead to higher satisfaction.";

    const answerOptions = [
      "Effective marketing strategies focus on increasing product options.",
      "Modern consumer culture is driven by a demand for fewer products.",
      "Individualism enhances consumer contentment.",
      "Limiting consumer choices can lead to higher satisfaction."
    ];

    const handleWheel16 = (e: React.WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom16(prev => Math.min(Math.max(prev + delta, 0.5), 2));
      }
    };

    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowModule2Question16(false);
                if (testBankType === 'tpo') {
                  setActiveTab('TPO');
                } else {
                  setActiveTab('Real Test');
                }
              }}
            >
              *toefl ibt
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Volume Button */}
            <button ref={volumeButtonRef} onClick={toggleVolume} className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowModule2Question16(false);
                setShowModule2Question15(true);
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Back</span>
            </button>
            
            {/* Next Button */}
            <button 
              className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
              onClick={() => {
                setShowModule2Question16(false);
                setShowModule2Question17(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-8 py-3">
            <div className="flex gap-8">
              <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
                Reading
              </div>
              <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
                Question 16 of 20
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-2 md:p-4 lg:p-8 overflow-auto bg-white border border-black">
          <div className="max-w-7xl mx-auto pl-0">
            <h2 className="text-base sm:text-lg md:text-2xl lg:text-3xl font-['Inter',_sans-serif] font-bold text-center mb-2 md:mb-4 lg:mb-8">The Paradox of Choice</h2>
            <ResizableReadingLayout
              zoom={zoom16}
              onWheel={handleWheel16}
              passageTitle="The Paradox of Choice"
              passageSummary={<><strong>The Paradox of Choice</strong><br/>More options can lead to less satisfaction.</>}
              questionInfo="1/5"
              onBack={() => { setShowModule2Question16(false); setShowModule2Question15(true); }}
              onPrev={() => { setShowModule2Question16(false); setShowModule2Question15(true); }}
              onNext={() => { setShowModule2Question16(false); setShowModule2Question17(true); }}
              onSubmit={() => { setShowModule2Question16(false); setShowModule2Question17(true); }}
              leftContent={
                <>
                  <div className="space-y-2 md:space-y-3 lg:space-y-4 text-black font-['Inter',_sans-serif] leading-relaxed text-xs sm:text-sm md:text-base lg:text-lg">
                    <p>
                      The paradox of choice, a concept popularized by psychologist Barry Schwartz, suggests that more options can lead to less satisfaction. While the freedom to choose is fundamental to consumer culture, an overabundance of choices—from groceries to electronics—can overwhelm individuals, causing anxiety and decision fatigue. This paradox implies that the vast array of possibilities available today might actually diminish consumer contentment, as the fear of making the wrong choice looms large.
                    </p>
                    
                    <p>
                      Research supports this notion. In an experiment, psychologist Sheena Iyengar found that shoppers were more likely to purchase jam when offered 6 varieties instead of 24. The limited selection eased the decision process, reducing the pressure to find the 'perfect' option and making the experience more enjoyable. This phenomenon reveals that fewer choices can sometimes make consumers happier, which is a valuable insight for marketers and retailers aiming to boost satisfaction by curating their offerings.
                    </p>
                    
                    <p>
                      The paradox also has broader implications. In individualistic cultures, where personal choice is highly valued, the burden of decision-making can be significant. Conversely, collectivist cultures, which often provide fewer choices, report higher levels of contentment. This dynamic suggests that understanding cultural differences in consumer psychology can help businesses optimize their product strategies and enhance overall well-being.
                    </p>
                  </div>
                </>
              }
              rightContent={
                <>
                  <h3 className="text-xl font-['Inter',_sans-serif] font-bold text-black mb-8 mt-3">Which of the following best states a main idea of the passage?</h3>
                
                  <div className="space-y-5">
                    {answerOptions.map((option, index) => (
                      <RadioOption
                        key={index}
                        id={`module2-q16-option-${index}`}
                        name="module2-q16"
                        value={option}
                        checked={selectedAnswer16 === option}
                        onChange={() => setSelectedAnswer16(option)}
                        label={option}
                      />
                    ))}
                  </div>
                </>
              }
            />
          </div>
        </div>
        
        <MobileQuestionNav 
          onBack={() => {
            setShowModule2Question16(false);
            setShowModule2Question15(true);
          }}
          onHome={() => {
            setShowModule2Question16(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onNext={() => {
            setShowModule2Question16(false);
            setShowModule2Question17(true);
          }}
        />
      </div>
    );
  };

  // Module 2 - Question 17 (The Paradox of Choice - Decision Fatigue Effect)
  const Module2Question17Screen = () => {
    const [selectedAnswer17, setSelectedAnswer17] = useState<string | null>(null);
    const correctAnswer = "Anxiety about making the wrong choice";

    const answerOptions = [
      "Desire to make the same choices as other consumers",
      "Anxiety about making the wrong choice",
      "Preference for consumer cultures",
      "Enhanced freedom to choose"
    ];

    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowModule2Question17(false);
                if (testBankType === 'tpo') {
                  setActiveTab('TPO');
                } else {
                  setActiveTab('Real Test');
                }
              }}
            >
              *toefl ibt
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Volume Button */}
            <button ref={volumeButtonRef} onClick={toggleVolume} className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowModule2Question17(false);
                setShowModule2Question16(true);
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Back</span>
            </button>
            
            {/* Next Button */}
            <button 
              className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
              onClick={() => {
                setShowModule2Question17(false);
                setShowModule2Question18(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="bg-white">
          <div className="px-8 py-3">
            <div className="flex gap-8">
              <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
                Reading
              </div>
              <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
                Question 17 of 20
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-2 md:p-4 lg:p-8 overflow-auto bg-white border border-black">
          <div className="max-w-7xl mx-auto pl-0">
            <h2 className="text-base sm:text-lg md:text-2xl lg:text-3xl font-['Inter',_sans-serif] font-bold text-center mb-2 md:mb-4 lg:mb-8">The Paradox of Choice</h2>
            <ResizableReadingLayout
              passageTitle="The Paradox of Choice"
              passageSummary={<><strong>The Paradox of Choice</strong><br/>More options can lead to less satisfaction.</>}
              questionInfo="2/5"
              onBack={() => { setShowModule2Question17(false); setShowModule2Question16(true); }}
              onPrev={() => { setShowModule2Question17(false); setShowModule2Question16(true); }}
              onNext={() => { setShowModule2Question17(false); setShowModule2Question18(true); }}
              onSubmit={() => { setShowModule2Question17(false); setShowModule2Question18(true); }}
              leftContent={
                <>
                  <div className="space-y-2 md:space-y-3 lg:space-y-4 text-black font-['Inter',_sans-serif] leading-relaxed text-xs sm:text-sm md:text-base lg:text-lg">
                  <p>
                    The paradox of choice, a concept popularized by psychologist Barry Schwartz, suggests that more options can lead to less satisfaction. While the freedom to choose is fundamental to consumer culture, an overabundance of choices—from groceries to electronics—can overwhelm individuals, causing anxiety and decision fatigue. This paradox implies that the vast array of possibilities available today might actually diminish consumer contentment, as the fear of making the wrong choice looms large.
                  </p>
                  
                  <p>
                    Research supports this notion. In an experiment, psychologist Sheena Iyengar found that shoppers were more likely to purchase jam when offered 6 varieties instead of 24. The limited selection eased the decision process, reducing the pressure to find the 'perfect' option and making the experience more enjoyable. This phenomenon reveals that fewer choices can sometimes make consumers happier, which is a valuable insight for marketers and retailers aiming to boost satisfaction by curating their offerings.
                  </p>
                  
                  <p>
                    The paradox also has broader implications. In individualistic cultures, where personal choice is highly valued, the burden of decision-making can be significant. Conversely, collectivist cultures, which often provide fewer choices, report higher levels of contentment. This dynamic suggests that understanding cultural differences in consumer psychology can help businesses optimize their product strategies and enhance overall well-being.
                  </p>
                </div>
              </>
            }
            rightContent={
              <div className="flex-1 max-w-xl">
                <h3 className="text-xl font-['Inter',_sans-serif] font-bold text-black mb-8 mt-3">What is one effect of decision fatigue as mentioned in the passage?</h3>
                
                <div className="space-y-5">
                  {answerOptions.map((option, index) => (
                    <RadioOption
                      key={index}
                      id={`module2-q17-option-${index}`}
                      name="module2-q17"
                      value={option}
                      checked={selectedAnswer17 === option}
                      onChange={() => setSelectedAnswer17(option)}
                      label={option}
                    />
                  ))}
                </div>
              </div>
            }
            />
          </div>
        </div>
        
        <MobileQuestionNav 
          onBack={() => {
            setShowModule2Question17(false);
            setShowModule2Question16(true);
          }}
          onHome={() => {
            setShowModule2Question17(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onNext={() => {
            setShowModule2Question17(false);
            setShowModule2Question18(true);
          }}
        />
      </div>
    );
  };

  // Module 2 - Question 18 (The Paradox of Choice - Iyengar's Experiment)
  const Module2Question18Screen = () => {
    const [selectedAnswer18, setSelectedAnswer18] = useState<string | null>(null);
    const correctAnswer = "To provide evidence supporting the paradox of choice";

    const answerOptions = [
      "To highlight the effectiveness of marketing strategies",
      "To explain the methodology used in consumer psychology",
      "To provide evidence supporting the paradox of choice",
      "To criticize the abundance of products in modern markets"
    ];

    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowModule2Question18(false);
                if (testBankType === 'tpo') {
                  setActiveTab('TPO');
                } else {
                  setActiveTab('Real Test');
                }
              }}
            >
              *toefl ibt
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Volume Button */}
            <button ref={volumeButtonRef} onClick={toggleVolume} className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowModule2Question18(false);
                setShowModule2Question17(true);
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Back</span>
            </button>
            
            {/* Next Button */}
            <button 
              className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
              onClick={() => {
                setShowModule2Question18(false);
                setShowModule2Question19(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="bg-white">
          <div className="px-8 py-3">
            <div className="flex gap-8">
              <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
                Reading
              </div>
              <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
                Question 18 of 20
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-2 md:p-4 lg:p-8 overflow-auto bg-white border border-black">
          <div className="max-w-7xl mx-auto pl-0">
            <h2 className="text-base sm:text-lg md:text-2xl lg:text-3xl font-['Inter',_sans-serif] font-bold text-center mb-2 md:mb-4 lg:mb-8">The Paradox of Choice</h2>
            <ResizableReadingLayout
              passageTitle="The Paradox of Choice"
              passageSummary={<><strong>The Paradox of Choice</strong><br/>More options can lead to less satisfaction.</>}
              questionInfo="3/5"
              onBack={() => { setShowModule2Question18(false); setShowModule2Question17(true); }}
              onPrev={() => { setShowModule2Question18(false); setShowModule2Question17(true); }}
              onNext={() => { setShowModule2Question18(false); setShowModule2Question19(true); }}
              onSubmit={() => { setShowModule2Question18(false); setShowModule2Question19(true); }}
              leftContent={
                <>
                  <div className="space-y-2 md:space-y-3 lg:space-y-4 text-black font-['Inter',_sans-serif] leading-relaxed text-xs sm:text-sm md:text-base lg:text-lg">
                  <p>
                    The paradox of choice, a concept popularized by psychologist Barry Schwartz, suggests that more options can lead to less satisfaction. While the freedom to choose is fundamental to consumer culture, an overabundance of choices—from groceries to electronics—can overwhelm individuals, causing anxiety and decision fatigue. This paradox implies that the vast array of possibilities available today might actually diminish consumer contentment, as the fear of making the wrong choice looms large.
                  </p>
                  
                  <p>
                    Research supports this notion. In an experiment, psychologist Sheena Iyengar found that shoppers were more likely to purchase jam when offered 6 varieties instead of 24. The limited selection eased the decision process, reducing the pressure to find the 'perfect' option and making the experience more enjoyable. This phenomenon reveals that fewer choices can sometimes make consumers happier, which is a valuable insight for marketers and retailers aiming to boost satisfaction by curating their offerings.
                  </p>
                  
                  <p>
                    The paradox also has broader implications. In individualistic cultures, where personal choice is highly valued, the burden of decision-making can be significant. Conversely, collectivist cultures, which often provide fewer choices, report higher levels of contentment. This dynamic suggests that understanding cultural differences in consumer psychology can help businesses optimize their product strategies and enhance overall well-being.
                  </p>
                </div>
              </>
            }
            rightContent={
              <div className="flex-1 max-w-xl">
                <h3 className="text-xl font-['Inter',_sans-serif] font-bold text-black mb-8 mt-3">Why does the author mention Sheena Iyengar's experiment?</h3>
                
                <div className="space-y-5">
                  {answerOptions.map((option, index) => (
                    <RadioOption
                      key={index}
                      id={`module2-q18-option-${index}`}
                      name="module2-q18"
                      value={option}
                      checked={selectedAnswer18 === option}
                      onChange={() => setSelectedAnswer18(option)}
                      label={option}
                    />
                  ))}
                </div>
              </div>
            }
            />
          </div>
        </div>
        
        <MobileQuestionNav 
          onBack={() => {
            setShowModule2Question18(false);
            setShowModule2Question17(true);
          }}
          onHome={() => {
            setShowModule2Question18(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onNext={() => {
            setShowModule2Question18(false);
            setShowModule2Question19(true);
          }}
        />
      </div>
    );
  };

  // Module 2 - Question 19 (Vocabulary - "curating")
  const Module2Question19Screen = () => {
    const [selectedAnswer19, setSelectedAnswer19] = useState<string | null>(null);
    const correctAnswer = "organizing";

    const answerOptions = [
      "eliminating",
      "organizing",
      "increasing",
      "changing"
    ];

    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowModule2Question19(false);
                if (testBankType === 'tpo') {
                  setActiveTab('TPO');
                } else {
                  setActiveTab('Real Test');
                }
              }}
            >
              *toefl ibt
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Volume Button */}
            <button ref={volumeButtonRef} onClick={toggleVolume} className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowModule2Question19(false);
                setShowModule2Question18(true);
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Back</span>
            </button>
            
            {/* Next Button */}
            <button 
              className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
              onClick={() => {
                setShowModule2Question19(false);
                setShowModule2Question20(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="bg-white">
          <div className="px-8 py-3">
            <div className="flex gap-8">
              <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
                Reading
              </div>
              <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
                Question 19 of 20
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-2 md:p-4 lg:p-8 overflow-auto bg-white border border-black">
          <div className="max-w-7xl mx-auto pl-0">
            <h2 className="text-base sm:text-lg md:text-2xl lg:text-3xl font-['Inter',_sans-serif] font-bold text-center mb-2 md:mb-4 lg:mb-8">The Paradox of Choice</h2>
            <ResizableReadingLayout
              passageTitle="The Paradox of Choice"
              passageSummary={<><strong>The Paradox of Choice</strong><br/>More options can lead to less satisfaction.</>}
              questionInfo="4/5"
              onBack={() => { setShowModule2Question19(false); setShowModule2Question18(true); }}
              onPrev={() => { setShowModule2Question19(false); setShowModule2Question18(true); }}
              onNext={() => { setShowModule2Question19(false); setShowModule2Question20(true); }}
              onSubmit={() => { setShowModule2Question19(false); setShowModule2Question20(true); }}
              leftContent={
                <>
                  <div className="space-y-2 md:space-y-3 lg:space-y-4 text-black font-['Inter',_sans-serif] leading-relaxed text-xs sm:text-sm md:text-base lg:text-lg">
                  <p>
                    The paradox of choice, a concept popularized by psychologist Barry Schwartz, suggests that more options can lead to less satisfaction. While the freedom to choose is fundamental to consumer culture, an overabundance of choices—from groceries to electronics—can overwhelm individuals, causing anxiety and decision fatigue. This paradox implies that the vast array of possibilities available today might actually diminish consumer contentment, as the fear of making the wrong choice looms large.
                  </p>
                  
                  <p>
                    Research supports this notion. In an experiment, psychologist Sheena Iyengar found that shoppers were more likely to purchase jam when offered 6 varieties instead of 24. The limited selection eased the decision process, reducing the pressure to find the 'perfect' option and making the experience more enjoyable. This phenomenon reveals that fewer choices can sometimes make consumers happier, which is a valuable insight for marketers and retailers aiming to boost satisfaction by <span className="bg-[#2D9DA7] text-white px-1">curating</span> their offerings.
                  </p>
                  
                  <p>
                    The paradox also has broader implications. In individualistic cultures, where personal choice is highly valued, the burden of decision-making can be significant. Conversely, collectivist cultures, which often provide fewer choices, report higher levels of contentment. This dynamic suggests that understanding cultural differences in consumer psychology can help businesses optimize their product strategies and enhance overall well-being.
                  </p>
                </div>
              </>
            }
            rightContent={
              <div className="flex-1 max-w-xl">
                <h3 className="text-xl font-['Inter',_sans-serif] font-bold text-black mb-8 mt-3">The word "curating" in the passage is closest in meaning to</h3>
                
                <div className="space-y-5">
                  {answerOptions.map((option, index) => (
                    <RadioOption
                      key={index}
                      id={`module2-q19-option-${index}`}
                      name="module2-q19"
                      value={option}
                      checked={selectedAnswer19 === option}
                      onChange={() => setSelectedAnswer19(option)}
                      label={option}
                    />
                  ))}
                </div>
              </div>
            }
            />
          </div>
        </div>
        
        <MobileQuestionNav 
          onBack={() => {
            setShowModule2Question19(false);
            setShowModule2Question18(true);
          }}
          onHome={() => {
            setShowModule2Question19(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onNext={() => {
            setShowModule2Question19(false);
            setShowModule2Question20(true);
          }}
        />
      </div>
    );
  };

  // Module 2 - Question 20 (Inference - Collectivist Cultures)
  const Module2Question20Screen = () => {
    const [selectedAnswer20, setSelectedAnswer20] = useState<string | null>(null);
    const correctAnswer = "They generally have fewer choices available.";

    const answerOptions = [
      "They tend to report lower levels of satisfaction.",
      "They are more affected by the paradox of choice.",
      "They generally have fewer choices available.",
      "They prefer individual decision-making."
    ];

    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowModule2Question20(false);
                if (testBankType === 'tpo') {
                  setActiveTab('TPO');
                } else {
                  setActiveTab('Real Test');
                }
              }}
            >
              *toefl ibt
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Volume Button */}
            <button ref={volumeButtonRef} onClick={toggleVolume} className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowModule2Question20(false);
                setShowModule2Question19(true);
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Back</span>
            </button>
            
            {/* Next Button */}
            <button 
              className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
              onClick={() => {
                setShowModule2Question20(false);
                // Save reading result to history
                saveSectionResultToHistory('Reading', 20);
                clearReadingProgress();
                setShowEndModule2(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Submit</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="bg-white">
          <div className="px-8 py-3">
            <div className="flex gap-8">
              <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
                Reading
              </div>
              <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
                Question 20 of 20
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-2 md:p-4 lg:p-8 overflow-auto bg-white border border-black">
          <div className="max-w-7xl mx-auto pl-0">
            <h2 className="text-base sm:text-lg md:text-2xl lg:text-3xl font-['Inter',_sans-serif] font-bold text-center mb-2 md:mb-4 lg:mb-8">The Paradox of Choice</h2>
            <ResizableReadingLayout
              passageTitle="The Paradox of Choice"
              passageSummary={<><strong>The Paradox of Choice</strong><br/>More options can lead to less satisfaction.</>}
              questionInfo="5/5"
              onBack={() => { setShowModule2Question20(false); setShowModule2Question19(true); }}
              onPrev={() => { setShowModule2Question20(false); setShowModule2Question19(true); }}
              onNext={() => { setShowModule2Question20(false); saveSectionResultToHistory('Reading', 20); clearReadingProgress(); setShowEndModule2(true); }}
              onSubmit={() => { setShowModule2Question20(false); saveSectionResultToHistory('Reading', 20); clearReadingProgress(); setShowEndModule2(true); }}
              leftContent={
                <>
                  <div className="space-y-2 md:space-y-3 lg:space-y-4 text-black font-['Inter',_sans-serif] leading-relaxed text-xs sm:text-sm md:text-base lg:text-lg">
                  <p>
                    The paradox of choice, a concept popularized by psychologist Barry Schwartz, suggests that more options can lead to less satisfaction. While the freedom to choose is fundamental to consumer culture, an overabundance of choices—from groceries to electronics—can overwhelm individuals, causing anxiety and decision fatigue. This paradox implies that the vast array of possibilities available today might actually diminish consumer contentment, as the fear of making the wrong choice looms large.
                  </p>
                  
                  <p>
                    Research supports this notion. In an experiment, psychologist Sheena Iyengar found that shoppers were more likely to purchase jam when offered 6 varieties instead of 24. The limited selection eased the decision process, reducing the pressure to find the 'perfect' option and making the experience more enjoyable. This phenomenon reveals that fewer choices can sometimes make consumers happier, which is a valuable insight for marketers and retailers aiming to boost satisfaction by curating their offerings.
                  </p>
                  
                  <p>
                    The paradox also has broader implications. In individualistic cultures, where personal choice is highly valued, the burden of decision-making can be significant. Conversely, collectivist cultures, which often provide fewer choices, report higher levels of contentment. This dynamic suggests that understanding cultural differences in consumer psychology can help businesses optimize their product strategies and enhance overall well-being.
                  </p>
                </div>
              </>
            }
            rightContent={
              <div className="flex-1 max-w-xl">
                <h3 className="text-xl font-['Inter',_sans-serif] font-bold text-black mb-8 mt-3">What can be inferred about consumers in collectivist cultures?</h3>
                
                <div className="space-y-5">
                  {answerOptions.map((option, index) => (
                    <RadioOption
                      key={index}
                      id={`module2-q20-option-${index}`}
                      name="module2-q20"
                      value={option}
                      checked={selectedAnswer20 === option}
                      onChange={() => setSelectedAnswer20(option)}
                      label={option}
                    />
                  ))}
                </div>
              </div>
            }
            />
          </div>
        </div>
        
        <MobileQuestionNav 
          onBack={() => {
            setShowModule2Question20(false);
            setShowModule2Question19(true);
          }}
          onHome={() => {
            setShowModule2Question20(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onNext={() => {
            setShowModule2Question20(false);
                saveSectionResultToHistory('Reading', 20);
            clearReadingProgress();
            setShowEndModule2(true);
          }}
        />
      </div>
    );
  };

  // End of Module 2 Screen - Reading Complete, transition to Listening
  const EndModule2Screen = () => {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowEndModule2(false);
                if (testBankType === 'tpo') {
                  setActiveTab('TPO');
                } else {
                  setActiveTab('Test');
                }
              }}
            >
              *toefl ibt
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* View Results Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowEndModule2(false);
                setActiveTab('History');
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
                <path d="M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zM5 3h14c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2z"/>
              </svg>
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">View Results</span>
            </button>
            {/* Continue to Listening Button */}
            <button 
              className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
              onClick={() => {
                setShowEndModule2(false);
                setActiveListeningM1Screen('intro');
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Continue to Listening</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Tab */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-8 py-3">
            <div className="text-gray-700 font-['Inter',_sans-serif] font-bold">
              Reading
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto bg-white flex items-center justify-center">
          <div className="max-w-lg mx-auto text-center px-6">
            <div className="w-20 h-20 mx-auto mb-6 bg-[#e6f5f5] rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-[#1e6b73]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4"/>
                <circle cx="12" cy="12" r="10"/>
              </svg>
            </div>
            <h1 className="text-3xl font-['Inter',_sans-serif] font-bold text-gray-800 mb-4">Reading Section Complete!</h1>
            <p className="text-lg font-['Inter',_sans-serif] text-gray-600 mb-8">
              You have completed all 20 reading questions. Your results have been saved and can be reviewed in the History tab.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                className="flex items-center justify-center gap-2 bg-[#1e6b73] text-white rounded-lg px-6 py-3 hover:bg-[#165b62] transition-colors font-['Inter',_sans-serif] font-semibold"
                onClick={() => {
                  setShowEndModule2(false);
                  setActiveListeningM1Screen('intro');
                }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M12 12h.01M8 12a4 4 0 014-4"/>
                </svg>
                Continue to Listening Section
              </button>
              <button 
                className="flex items-center justify-center gap-2 bg-white border-2 border-[#1e6b73] text-[#1e6b73] rounded-lg px-6 py-3 hover:bg-gray-50 transition-colors font-['Inter',_sans-serif] font-semibold"
                onClick={() => {
                  setShowEndModule2(false);
                  setActiveTab('History');
                }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                </svg>
                View Results in History
              </button>
            </div>
          </div>
        </div>
        
        <MobileQuestionNav 
          onBack={() => {
            setShowEndModule2(false);
            setShowModule2Question20(true);
          }}
          onHome={() => {
            setShowEndModule2(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Test');
            }
          }}
          onNext={() => {
            setShowEndModule2(false);
            setActiveListeningM1Screen('intro');
          }}
          nextLabel="Listening"
        />
      </div>
    );
  };

  // Reading Section Introduction Screen
  const ReadingIntroScreen = () => {
    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
        {/* Top Header */}
        <div className="bg-[#1e6b73] h-12 sm:h-16 flex items-center justify-between px-4 sm:px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-lg sm:text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowReadingIntro(false);
                if (testBankType === 'tpo') {
                  setActiveTab('TPO');
                } else {
                  setActiveTab('Real Test');
                }
              }}
            >
              *toefl ibt
            </div>
          </div>
          
          {/* Begin Button */}
          <button 
            className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-3 sm:px-5 py-1.5 sm:py-2 hover:bg-gray-100 transition-colors"
            onClick={() => {
              setShowReadingIntro(false);
              setShowModule1Intro(true);
            }}
          >
            <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-sm sm:text-base">Begin</span>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
              <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
            </svg>
          </button>
        </div>

        {/* Tab */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-4 sm:px-8 py-2 sm:py-3">
            <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2 inline-block text-sm sm:text-base">
              Reading
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto bg-white flex items-start sm:items-center justify-center">
          <div className="max-w-4xl px-4 sm:px-8 py-6 sm:py-12">
            <h2 className="hidden sm:block text-3xl font-['Inter',_sans-serif] text-gray-800 mb-8">Reading Section</h2>
            <div className="hidden sm:block w-24 h-1 bg-gray-300 mb-8"></div>
            
            <div className="space-y-4 sm:space-y-6 text-gray-700 font-['Inter',_sans-serif] leading-relaxed text-sm sm:text-base">
              <p>
                In the reading section, you will answer 35–48 questions to demonstrate how well you understand academic and non-academic texts in English. There are three types of tasks.
              </p>

              <div className="my-4 sm:my-8">
                <table className="w-full border border-black text-sm sm:text-base">
                  <thead>
                    <tr className="bg-[#2d7a7c] text-white">
                      <th className="border border-black px-3 sm:px-6 py-2 sm:py-3 text-left font-['Inter',_sans-serif]">Type of Task</th>
                      <th className="border border-black px-3 sm:px-6 py-2 sm:py-3 text-left font-['Inter',_sans-serif]">Description</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    <tr>
                      <td className="border border-black px-3 sm:px-6 py-2 sm:py-3 font-['Inter',_sans-serif]">Complete the Words</td>
                      <td className="border border-black px-3 sm:px-6 py-2 sm:py-3 font-['Inter',_sans-serif]">Fill in the missing letters in a paragraph.</td>
                    </tr>
                    <tr>
                      <td className="border border-black px-3 sm:px-6 py-2 sm:py-3 font-['Inter',_sans-serif]">Read in Daily Life</td>
                      <td className="border border-black px-3 sm:px-6 py-2 sm:py-3 font-['Inter',_sans-serif]">Answer questions about everyday reading material.</td>
                    </tr>
                    <tr>
                      <td className="border border-black px-3 sm:px-6 py-2 sm:py-3 font-['Inter',_sans-serif]">Read an Academic Passage</td>
                      <td className="border border-black px-3 sm:px-6 py-2 sm:py-3 font-['Inter',_sans-serif]">Answer questions about academic passages.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        
        <MobileQuestionNav 
          onHome={() => {
            setShowReadingIntro(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onNext={() => {
            setShowReadingIntro(false);
            setShowModule1Intro(true);
          }}
          hideBack={true}
        />
      </div>
    );
  };

  // [EXTRACTED] Listening M1 screens → /components/ListeningM1Screens.tsx
  // [Dead block 2 fully removed - Listening M1 inline screens deleted, now in /components/ListeningM1Screens.tsx]

  // Volume Modal Component
  const VolumeModal = () => {
    // Calculate the number of bars based on volume (20 bars total)
    const totalBars = 20;
    const activeBars = Math.round((volume / 100) * totalBars);

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-[450px] relative">
          {/* Close Button */}
          <button 
            onClick={() => setShowVolumeModal(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>

          {/* Volume Bars */}
          <div className="flex items-end justify-center gap-1.5 h-32 mb-8">
            {Array.from({ length: totalBars }).map((_, index) => {
              const barHeight = 20 + (index * 4); // Progressive height
              const isActive = index < activeBars;
              return (
                <div
                  key={index}
                  className={`w-4 rounded-full transition-all duration-200 ${
                    isActive ? 'bg-[#1e6b73]' : 'bg-gray-300'
                  }`}
                  style={{ height: `${barHeight}px` }}
                />
              );
            })}
          </div>

          {/* Volume Slider */}
          <div className="relative">
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
              style={{
                background: `linear-gradient(to right, #e5e7eb 0%, #e5e7eb ${volume}%, #e5e7eb ${volume}%, #e5e7eb 100%)`
              }}
            />
            <style>{`
              .slider-thumb::-webkit-slider-thumb {
                appearance: none;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                background: #1e6b73;
                cursor: pointer;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              }
              .slider-thumb::-moz-range-thumb {
                width: 28px;
                height: 28px;
                border-radius: 50%;
                background: #1e6b73;
                cursor: pointer;
                border: none;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              }
            `}</style>
          </div>
        </div>
      </div>
    );
  };


  // Helper: derive page title from CMS passageTitle or template structure
  const getDailyLifePageTitle = (passageTitle: string | null, passageText: string | null): string => {
    if (passageTitle) return passageTitle;
    if (!passageText) return 'Read a notice.';
    try {
      const parsed = JSON.parse(passageText);
      const structureMap: Record<string, string> = {
        email: 'Read an email.',
        notice: 'Read a notice.',
        social_media: 'Read a social media post.',
        advertisement: 'Read an advertisement.',
        article: 'Read a news article.',
        form: 'Read a form.',
      };
      return structureMap[parsed.structure] || 'Read a notice.';
    } catch {
      return 'Read a notice.';
    }
  };

  // Read Notice Test Screen Component
  const ReadNoticeTestScreen = () => {
    // Get dynamic question data from CMS
    // CMS PRIORITY: flexible type matching (case-insensitive, multiple keywords)
    const sectionData = getCurrentSectionData('Reading');
    // CMS PRIORITY: 번호로 먼저 찾기 (Q11) → 없으면 타입으로 찾기
    const dailyLifeQuestion = sectionData?.questions.find(q =>
      String(q.questionNumber) === '11' || q.questionNumber === 11
    ) || sectionData?.questions.find(q => {
      const t = (q.questionType || '').toLowerCase();
      return (
        t.includes('daily life') ||
        t.includes('read in daily life') ||
        t.includes('practical reading') ||
        t.includes('functional text') ||
        t.includes('notice') ||
        t.includes('실용문')
      );
    });

    // CMS PRIORITY: direct fields first, then hardcoded fallback
    const correctAnswer =
      (dailyLifeQuestion?.correctAnswer as string) || "A bank";
    const answerOptions =
      (dailyLifeQuestion?.options && dailyLifeQuestion.options.length > 0
        ? dailyLifeQuestion.options
        : null) || [
      "An Internet provider",
      "A computer company",
      "A paper company",
      "A bank"
    ];
    // CMS passage fields for the notice content (used in JSX below if available)
    const cmsNoticeTitle = dailyLifeQuestion?.passageTitle || null;
    const cmsNoticeText = dailyLifeQuestion?.passageText || null;
    const cmsQuestionText = dailyLifeQuestion?.questionText || null;


    // Apply CMS overrides
    const finalAnswerOptions = (dailyLifeQuestion?.options && dailyLifeQuestion.options.length > 0)
      ? dailyLifeQuestion.options : answerOptions;
    const finalCorrectAnswer = (dailyLifeQuestion?.correctAnswer as string) || correctAnswer;
    const handleAnswerSelect = (answer: string) => {
      setSelectedAnswer(answer);
    };

    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
        {/* Header */}
        <div className="flex bg-[#1e6b73] h-12 sm:h-16 items-center justify-between px-2 sm:px-8 shadow-lg">
          <div className="flex items-center shrink-0">
            <div 
              className="text-white text-sm sm:text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity leading-tight"
              onClick={() => {
                setShowReadNoticeTest(false);
                setShowFillBlanksTest(false);
                setShowReadingSection(false);
                setShowToeflTest(false);
                if (testBankType === 'tpo') { setActiveTab('TPO'); } else { setActiveTab('Real Test'); }
              }}
            >
              *toefl ibt
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button ref={volumeButtonRef} onClick={toggleVolume} className="flex items-center gap-1 sm:gap-3 bg-[#0A6068] border border-white rounded-lg px-2 sm:px-5 py-1.5 sm:py-2 hover:bg-[#084d52] transition-colors">
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-xs sm:text-base">Volume</span>
              <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="white"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
            </button>
            <button className="hidden sm:flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors" onClick={() => { setShowReadNoticeTest(false); setShowFillBlanksTest(true); }}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Back</span>
            </button>
            <button className="flex items-center gap-1 sm:gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-2 sm:px-5 py-1.5 sm:py-2 hover:bg-gray-100 transition-colors" onClick={() => { setShowReadNoticeTest(false); setShowReadNoticeTest2(true); }}>
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-xs sm:text-base">Next</span>
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="#0A6068"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>
            </button>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-3 sm:px-8 py-2 sm:py-3">
            <div className="flex gap-4 sm:gap-8">
              <div className="text-gray-700 font-['Inter',_sans-serif] text-sm sm:text-base font-bold border-b-2 border-[#1e6b73] pb-2">Reading</div>
              <div className="text-gray-500 text-xs sm:text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">Question 11 of 20</div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto bg-white border border-black">
          <h1 className="hidden sm:block text-xl md:text-2xl lg:text-3xl font-['Inter',_sans-serif] font-bold text-black py-6 lg:py-8 text-center">
            {getDailyLifePageTitle(cmsNoticeTitle, cmsNoticeText)}
          </h1>
          
          <ResizableReadingLayout
            passageTitle={getDailyLifePageTitle(cmsNoticeTitle, cmsNoticeText)}
            passageSummary={cmsNoticeTitle
              ? <><strong>{cmsNoticeTitle}</strong></>
              : <><strong>Municipal Charter</strong><br/>Sign up for paperless billing statements today.</>}
            questionInfo="1/1"
            onBack={() => { setShowReadNoticeTest(false); setShowFillBlanksTest(true); }}
            onNext={() => { setShowReadNoticeTest(false); setShowReadNoticeTest2(true); }}
            onSubmit={() => { setShowReadNoticeTest(false); setShowReadNoticeTest2(true); }}
            leftContent={
              <div className="ml-0 md:ml-4 lg:ml-12">
                {/* CMS PRIORITY: parse JSON template and render correct visual format */}
                {cmsNoticeText
                  ? (renderDailyLifePassage(cmsNoticeText) ?? (
                      // Plain text fallback (not a JSON template)
                      <div className="border-[1px] md:border-[2px] lg:border-[3px] border-black p-2 md:p-4 lg:p-6">
                        <div className="border-[1px] md:border-2 border-black p-2 md:p-4 lg:p-6">
                          <p className="text-base font-['Inter',_sans-serif] leading-relaxed whitespace-pre-line">{cmsNoticeText}</p>
                        </div>
                      </div>
                    ))
                  : (
                    // Hardcoded fallback (no CMS data)
                    <div className="border-[1px] md:border-[2px] lg:border-[3px] border-black p-2 md:p-4 lg:p-6">
                      <div className="border-[1px] md:border-2 border-black p-2 md:p-4 lg:p-6">
                        <h2 className="text-lg md:text-xl lg:text-2xl font-['Inter',_sans-serif] font-bold text-center mb-2 md:mb-4 lg:mb-6">Municipal Charter</h2>
                        <p className="text-base md:text-base text-center font-['Inter',_sans-serif] font-medium mb-2 md:mb-4 lg:mb-6">Sign up for paperless billing statements today.</p>
                        <p className="text-base md:text-base font-['Inter',_sans-serif] leading-relaxed">
                          Safe, convenient, easy. Enroll in paperless billing to receive 
                          monthly savings account statements in an electronic PDF 
                          document. Access your Municipal Charter account through 
                          the mobile app and select account preferences in the upper 
                          right-hand corner to enroll.
                        </p>
                      </div>
                    </div>
                  )
                }
              </div>
            }
            rightContent={
              <>
                {/* CMS PRIORITY: use CMS question text if available */}
                <h3 className="text-lg sm:text-2xl font-['Inter',_sans-serif] font-bold text-black mb-6 sm:mb-10">
                  {cmsQuestionText || "What type of business issued the notice?"}
                </h3>
                <div className="space-y-5 sm:space-y-6">
                  {finalAnswerOptions.map((option, index) => (
                    <RadioOption
                      key={index}
                      id={`option-${index}`}
                      name="business-type"
                      value={option}
                      checked={selectedAnswer === option}
                      onChange={() => handleAnswerSelect(option)}
                      label={option}
                    />
                  ))}
                </div>
              </>
            }
          />
        </div>
        
        <MobileQuestionNav 
          onBack={() => {
            setShowReadNoticeTest(false);
            setShowFillBlanksTest(true);
          }}
          onHome={() => {
            setShowReadNoticeTest(false);
            setShowFillBlanksTest(false);
            setShowReadingSection(false);
            setShowToeflTest(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onNext={() => {
            setShowReadNoticeTest(false);
            setShowReadNoticeTest2(true);
          }}
        />
      </div>
    );
  };

  // Fill Blanks Test Screen Component
  const FillBlanksTestScreen = () => {
    const [inputValues, setInputValues] = React.useState<Record<number, string>>({});
    const [filledInputs, setFilledInputs] = React.useState<Record<number, boolean>>({});
    const { isOpen: isFBVolumeOpen, buttonRef: fbVolumeButtonRef, toggleVolume: toggleFBVolume, closeVolume: closeFBVolume } = useVolumeControl();
    
    const CHAR_UNIT_WIDTH = 20; // CSS background-size의 가로 폭과 일치
    const isMobileFB = typeof window !== 'undefined' && window.innerWidth < 640;
    
    // Get dynamic question data from CMS
    // CMS PRIORITY: flexible type matching (case-insensitive, multiple keywords)
    const sectionData = getCurrentSectionData('Reading');
    // CMS PRIORITY: flexible type matching — Module 1 only (exclude Module 2 tagged questions)
    const fillBlanksQuestion = sectionData?.questions.find(q => {
      const t = (q.questionType || '').toLowerCase();
      const isModule2 = t.includes('module 2');
      const isFillBlanks = (
        t.includes('complete words') ||
        t.includes('fill in the blank') ||
        t.includes('cloze test') ||
        t.includes('빈칸') ||
        t.includes('fillblanks') ||
        t.includes('fill-in')
      );
      return isFillBlanks && !isModule2;
    }) || sectionData?.questions.find(q => {
      // Fallback: any fill-blanks question (backward compat)
      const t = (q.questionType || '').toLowerCase();
      return (
        t.includes('complete words') ||
        t.includes('fill in the blank') ||
        t.includes('cloze test') ||
        t.includes('빈칸') ||
        t.includes('fillblanks') ||
        t.includes('fill-in')
      );
    });
    
    // Debug logging
    React.useEffect(() => {
      console.log('🔍 FillBlanksTest Debug:', {
        currentTest,
        testBankType,
        testData: getCurrentTestData(),
        sectionData,
        fillBlanksQuestion,
        hasPassageText: !!fillBlanksQuestion?.passageText,
        hasBlanks: !!fillBlanksQuestion?.blanks
      });
    }, []);
    
    // CMS PRIORITY: Parse CMS passageText format "word[answer:maxLength]" e.g. "sh[ow:2]"
    // This converts CMS format into the blanks array + normalized passage used by the renderer.
    const parseCmsPassage = (raw: string): { inputs: {id:number;maxLength:number;answer:string}[]; normalizedPassage: string } => {
      const parsedInputs: {id:number;maxLength:number;answer:string}[] = [];
      let idx = 0;
      // Match pattern: [answer:maxLength]  e.g. [ow:2] or [tion:4]
      const normalized = raw.replace(/\[([^\]]+):(\d+)\]/g, (_match, answer, maxLen) => {
        parsedInputs.push({ id: idx, maxLength: parseInt(maxLen), answer });
        return `[${idx++}]`;
      });
      return { inputs: parsedInputs, normalizedPassage: normalized };
    };

    // Determine inputs and passage: CMS passageText (word[answer:N] format) > CMS blanks array > hardcoded
    let inputs: {id:number;maxLength:number;answer:string}[];
    let normalizedPassage: string = '';

    const rawCmsPassage = fillBlanksQuestion?.passageText || '';
    const hasCmsFormat = rawCmsPassage.includes(':[') || /\[[^\]]+:\d+\]/.test(rawCmsPassage);
    const hasNormalizedFormat = /\[\d+\]/.test(rawCmsPassage) && !hasCmsFormat;

    if (hasCmsFormat) {
      // CMS format: "sh[ow:2] the loca[tion:4]..."
      const parsed = parseCmsPassage(rawCmsPassage);
      inputs = parsed.inputs;
      normalizedPassage = parsed.normalizedPassage;
    } else if (hasNormalizedFormat) {
      // Already normalized [0],[1]... — use passage as-is, build dummy inputs
      const blanks: {id:number;maxLength:number;answer:string}[] = [];
      let idx = 0;
      rawCmsPassage.replace(/\[(\d+)\]/g, () => { blanks.push({ id: idx, maxLength: 5, answer: '' }); idx++; return ''; });
      inputs = blanks.length > 0 ? blanks : Array.from({length:10}, (_, i) => ({ id: i, maxLength: 5, answer: '' }));
      normalizedPassage = rawCmsPassage;
    } else if (fillBlanksQuestion?.blanks && fillBlanksQuestion.blanks.length > 0) {
      // Legacy blanks array format
      inputs = fillBlanksQuestion.blanks.map((blank, i) => ({ id: i, maxLength: blank.maxLength, answer: blank.answer }));
      normalizedPassage = rawCmsPassage; // already has [N] markers or empty
    } else {
      // Hardcoded fallback
      inputs = [
        { id: 0, maxLength: 3, answer: 'ght' }, // might
        { id: 1, maxLength: 2, answer: 'at' }, // that
        { id: 2, maxLength: 3, answer: 'ple' }, // people
        { id: 3, maxLength: 2, answer: 'ly' }, // only
        { id: 4, maxLength: 3, answer: 'sic' }, // basic
        { id: 5, maxLength: 4, answer: 'ever' }, // However
        { id: 6, maxLength: 1, answer: 's' }, // is
        { id: 7, maxLength: 2, answer: 'om' }, // from
        { id: 8, maxLength: 3, answer: 'ord' }, // record
        { id: 9, maxLength: 4, answer: 'nces' }, // dances
      ];
    }

    const questionText = fillBlanksQuestion?.questionText || 'Fill in the missing letters in the paragraph.';
    // passageText here is the normalized passage (with [N] markers), used by renderPassageWithInputs
    const passageText = normalizedPassage;

    // Helper function to render passage with input fields
    const renderPassageWithInputs = () => {
      if (!passageText) {
        // Return hardcoded default passage
        return null; // Will use existing JSX below
      }
      
      // Parse passage text with [0], [1], etc. markers
      const parts: any[] = [];
      let key = 0;
      
      // Find all [N] markers and split text
      const regex = /\[(\d+)\]/g;
      let lastIndex = 0;
      let match;
      
      while ((match = regex.exec(passageText)) !== null) {
        const inputId = parseInt(match[1]);
        const beforeText = passageText.substring(lastIndex, match.index);
        
        if (beforeText) {
          parts.push(<span key={`text-${key++}`}>{beforeText}</span>);
        }
        
        parts.push(
          <input
            key={`input-${inputId}`}
            type="text"
            data-input-id={inputId}
            className={`gap-input ${filledInputs[inputId] ? 'filled' : ''}`}
            maxLength={inputs[inputId]?.maxLength || 5}
            value={inputValues[inputId] || ''}
            onChange={(e) => handleInputChange(inputId, e.target.value)}
            onFocus={() => handleFocus(inputId)}
            onBlur={() => handleBlur(inputId)}
            onKeyPress={(e) => handleKeyPress(e, inputId)}
            style={{ width: getInputWidth(inputId) }}
          />
        );
        
        lastIndex = match.index + match[0].length;
      }
      
      // Add remaining text
      if (lastIndex < passageText.length) {
        parts.push(<span key={`text-${key++}`}>{passageText.substring(lastIndex)}</span>);
      }
      
      return parts;
    };

    const handleInputChange = (id: number, value: string) => {
      setInputValues(prev => ({ ...prev, [id]: value }));
      
      // Mark as filled when all characters are entered
      if (value.length >= inputs[id].maxLength) {
        setFilledInputs(prev => ({ ...prev, [id]: true }));
      } else {
        setFilledInputs(prev => ({ ...prev, [id]: false }));
      }
      
      // Auto-focus next input when current input reaches maxLength
      if (value.length === inputs[id].maxLength) {
        const nextId = id + 1;
        if (nextId < inputs.length) {
          setTimeout(() => {
            const nextInput = document.querySelector(`input[data-input-id="${nextId}"]`) as HTMLInputElement;
            if (nextInput) {
              nextInput.focus();
            }
          }, 0);
        }
      }
    };

    const handleFocus = (id: number) => {
      // Keep filled state if input is already fully filled
      const value = inputValues[id] || '';
      if (value.length < inputs[id].maxLength) {
        setFilledInputs(prev => ({ ...prev, [id]: false }));
      }
    };

    const handleBlur = (id: number) => {
      if (inputValues[id] && inputValues[id].length > 0) {
        setFilledInputs(prev => ({ ...prev, [id]: true }));
      }
    };

    const handleKeyPress = (e: React.KeyboardEvent, id: number) => {
      if (e.key === 'Enter') {
        (e.target as HTMLInputElement).blur();
      }
    };

    // Helper function to calculate text width with proper font settings
    const getTextWidth = (text: string): number => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return text.length * 14;
      
      // Match the actual paragraph font (normal weight, not bold)
      context.font = "1.25rem 'Inter', sans-serif";
      const metrics = context.measureText(text);
      
      // Minimal extra space for natural text flow
      return Math.ceil(metrics.width) + 4;
    };

    // Calculate input width: keep full size while typing, shrink only when fully filled
    const getInputWidth = (id: number): string => {
      const value = inputValues[id] || '';
      const maxLen = inputs[id].maxLength;
      if (value.length >= maxLen) {
        // Fully filled: shrink to fit actual text width
        return `${getTextWidth(value)}px`;
      }
      // Empty or partially filled: maintain full dashed width
      // On mobile, subtract one dash unit to compensate for rendering difference
      const mobileOffset = isMobileFB ? CHAR_UNIT_WIDTH : 0;
      return `${maxLen * CHAR_UNIT_WIDTH - mobileOffset}px`;
    };

    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Content layout */}
        <div className="flex-1 flex flex-col overflow-auto">
          {/* Header */}
          <div className="bg-[#1e6b73] h-12 sm:h-14 flex items-center justify-between px-3 sm:px-8 shrink-0 relative">
            <div className="flex items-center min-w-0 shrink">
              <div 
                className="text-white text-lg sm:text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity truncate"
                onClick={() => {
                  setShowFillBlanksTest(false);
                  setShowReadingSection(false);
                  setShowToeflTest(false);
                  if (testBankType === 'tpo') {
                    setActiveTab('TPO');
                  } else {
                    setActiveTab('Real Test');
                  }
                }}
              >
                *toefl ibt
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Volume Button */}
              <button 
                ref={fbVolumeButtonRef as React.RefObject<HTMLButtonElement>}
                className={`flex items-center gap-1.5 sm:gap-3 border rounded-lg px-3 sm:px-5 py-1.5 sm:py-2 transition-colors ${
                  isFBVolumeOpen 
                    ? 'bg-white border-white text-[#1e6b73]' 
                    : 'bg-[#0A6068] border-white text-white hover:bg-[#084d52]'
                }`}
                onClick={toggleFBVolume}
              >
                <span className="font-['Inter',_sans-serif] font-semibold text-sm sm:text-base">Volume</span>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill={isFBVolumeOpen ? '#1e6b73' : 'white'}>
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </svg>
              </button>
              
              {/* Next Button */}
              <button 
                className="flex items-center gap-1.5 sm:gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-3 sm:px-5 py-1.5 sm:py-2 hover:bg-gray-100 transition-colors"
                onClick={() => {
                  setShowFillBlanksTest(false);
                  setShowReadNoticeTest(true);
                }}
              >
                <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-sm sm:text-base">Next</span>
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="#0A6068">
                  <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Navigation tabs - same width as header & content */}
          <div className="bg-white border-b border-gray-300 shrink-0">
            <div className="px-3 sm:px-8 py-2 sm:py-3">
              <div className="flex gap-4 sm:gap-8">
                <div className="text-gray-700 font-['Inter',_sans-serif] text-sm sm:text-base font-bold border-b-2 border-[#1e6b73] pb-2">
                  Reading
                </div>
                <div className="text-gray-500 text-xs sm:text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
                  Question 1-10
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 bg-white overflow-auto">
            <div className="p-4 sm:p-5 md:p-12 pt-8 sm:pt-16 md:pt-24 flex flex-col items-center">
          <h1 className="mb-10 sm:mb-12 md:mb-14 text-xl sm:text-2xl md:text-[1.75rem] text-black font-bold font-['Inter',_sans-serif] text-center px-2">
            Fill in the missing letters in the paragraph.
          </h1>

          <div className="max-w-[900px] w-full text-lg sm:text-lg md:text-[1.25rem] leading-[1.8] sm:leading-relaxed md:leading-[1.8] text-black font-['Inter',_sans-serif] px-1 sm:px-4" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
            {/* CMS PRIORITY: render CMS passage dynamically using passageText + inputs */}
            {renderPassageWithInputs() || (
              <>
            We know from drawings that have been preserved in caves for over 10,000 years that early humans performed dances as a group activity. We mi<input
              type="text"
              data-input-id="0"
              className={`gap-input ${filledInputs[0] ? 'filled' : ''}`}
              maxLength={inputs[0].maxLength}
              value={inputValues[0] || ''}
              onChange={(e) => handleInputChange(0, e.target.value)}
              onFocus={() => handleFocus(0)}
              onBlur={() => handleBlur(0)}
              onKeyPress={(e) => handleKeyPress(e, 0)}
              style={{ width: getInputWidth(0) }}
            /> think th<input
              type="text"
              data-input-id="1"
              className={`gap-input ${filledInputs[1] ? 'filled' : ''}`}
              maxLength={inputs[1].maxLength}
              value={inputValues[1] || ''}
              onChange={(e) => handleInputChange(1, e.target.value)}
              onFocus={() => handleFocus(1)}
              onBlur={() => handleBlur(1)}
              onKeyPress={(e) => handleKeyPress(e, 1)}
              style={{ width: getInputWidth(1) }}
            /> prehistoric peo<input
              type="text"
              data-input-id="2"
              className={`gap-input ${filledInputs[2] ? 'filled' : ''}`}
              maxLength={inputs[2].maxLength}
              value={inputValues[2] || ''}
              onChange={(e) => handleInputChange(2, e.target.value)}
              onFocus={() => handleFocus(2)}
              onBlur={() => handleBlur(2)}
              onKeyPress={(e) => handleKeyPress(e, 2)}
              style={{ width: getInputWidth(2) }}
            /> concentrated on<input
              type="text"
              data-input-id="3"
              className={`gap-input ${filledInputs[3] ? 'filled' : ''}`}
              maxLength={inputs[3].maxLength}
              value={inputValues[3] || ''}
              onChange={(e) => handleInputChange(3, e.target.value)}
              onFocus={() => handleFocus(3)}
              onBlur={() => handleBlur(3)}
              onKeyPress={(e) => handleKeyPress(e, 3)}
              style={{ width: getInputWidth(3) }}
            /> on ba<input
              type="text"
              data-input-id="4"
              className={`gap-input ${filledInputs[4] ? 'filled' : ''}`}
              maxLength={inputs[4].maxLength}
              value={inputValues[4] || ''}
              onChange={(e) => handleInputChange(4, e.target.value)}
              onFocus={() => handleFocus(4)}
              onBlur={() => handleBlur(4)}
              onKeyPress={(e) => handleKeyPress(e, 4)}
              style={{ width: getInputWidth(4) }}
            /> survival. How<input
              type="text"
              data-input-id="5"
              className={`gap-input ${filledInputs[5] ? 'filled' : ''}`}
              maxLength={inputs[5].maxLength}
              value={inputValues[5] || ''}
              onChange={(e) => handleInputChange(5, e.target.value)}
              onFocus={() => handleFocus(5)}
              onBlur={() => handleBlur(5)}
              onKeyPress={(e) => handleKeyPress(e, 5)}
              style={{ width: getInputWidth(5) }}
            />, it i<input
              type="text"
              data-input-id="6"
              className={`gap-input ${filledInputs[6] ? 'filled' : ''}`}
              maxLength={inputs[6].maxLength}
              value={inputValues[6] || ''}
              onChange={(e) => handleInputChange(6, e.target.value)}
              onFocus={() => handleFocus(6)}
              onBlur={() => handleBlur(6)}
              onKeyPress={(e) => handleKeyPress(e, 6)}
              style={{ width: getInputWidth(6) }}
            /> clear fr<input
              type="text"
              data-input-id="7"
              className={`gap-input ${filledInputs[7] ? 'filled' : ''}`}
              maxLength={inputs[7].maxLength}
              value={inputValues[7] || ''}
              onChange={(e) => handleInputChange(7, e.target.value)}
              onFocus={() => handleFocus(7)}
              onBlur={() => handleBlur(7)}
              onKeyPress={(e) => handleKeyPress(e, 7)}
              style={{ width: getInputWidth(7) }}
            /> the rec<input
              type="text"
              data-input-id="8"
              className={`gap-input ${filledInputs[8] ? 'filled' : ''}`}
              maxLength={inputs[8].maxLength}
              value={inputValues[8] || ''}
              onChange={(e) => handleInputChange(8, e.target.value)}
              onFocus={() => handleFocus(8)}
              onBlur={() => handleBlur(8)}
              onKeyPress={(e) => handleKeyPress(e, 8)}
              style={{ width: getInputWidth(8) }}
            /> that dan<input
              type="text"
              data-input-id="9"
              className={`gap-input ${filledInputs[9] ? 'filled' : ''}`}
              maxLength={inputs[9].maxLength}
              value={inputValues[9] || ''}
              onChange={(e) => handleInputChange(9, e.target.value)}
              onFocus={() => handleFocus(9)}
              onBlur={() => handleBlur(9)}
              onKeyPress={(e) => handleKeyPress(e, 9)}
              style={{ width: getInputWidth(9) }}
            /> was important to them.
              </>
            )}
          </div>
            </div>
          </div>
        </div>
        
        {/* Volume Control Dropdown */}
        <VolumeControl isOpen={isFBVolumeOpen} onClose={closeFBVolume} buttonRef={fbVolumeButtonRef} />
        
        <MobileQuestionNav 
          onBack={() => {
            setShowFillBlanksTest(false);
            setShowModule1Details(true);
          }}
          onHome={() => {
            setShowFillBlanksTest(false);
            setShowReadingSection(false);
            setShowToeflTest(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onNext={() => {
            setShowFillBlanksTest(false);
            setShowReadNoticeTest(true);
          }}
        />
      </div>
    );
  };

  // TOEFL Reading Section Screen Component
  const ReadingSectionScreen = () => {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Reading Progress Restore Modal — Reading 소개 화면 진입 시에만 표시 */}
        {/* Header */}
        <div className="bg-[#1e6b73] h-12 sm:h-16 flex items-center justify-between px-4 sm:px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-lg sm:text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowReadingSection(false);
                setShowToeflTest(false);
                if (testBankType === 'tpo') {
                  setActiveTab('TPO');
                } else {
                  setActiveTab('Real Test');
                }
              }}
            >
              *toefl ibt
            </div>
          </div>
          {/* Begin Button */}
          <button 
            className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-3 sm:px-5 py-1.5 sm:py-2 hover:bg-gray-100 transition-colors"
            onClick={() => {
              setShowReadingSection(false);
              setShowModule1Intro(true);
            }}
          >
            <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-sm sm:text-base">Begin</span>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
              <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
            </svg>
          </button>
        </div>

        {/* Navigation tabs */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-4 sm:px-8 py-2 sm:py-3">
            <div className="text-gray-700 font-['Inter',_sans-serif] font-bold text-sm sm:text-base">
              Reading
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto bg-white flex items-start sm:items-center justify-center">
          <div className="max-w-4xl px-4 sm:px-8 py-6 sm:py-12">
            <h2 className="hidden sm:block text-3xl font-['Inter',_sans-serif] text-gray-800 mb-8">Reading Section</h2>
            <div className="hidden sm:block w-24 h-1 bg-gray-300 mb-8"></div>
            
            <div className="space-y-4 sm:space-y-6 text-gray-700 font-['Inter',_sans-serif] leading-relaxed text-sm sm:text-base">
              <p>
                In the reading section, you will answer 35–48 questions to demonstrate how well you 
                understand academic and non-academic texts in English. There are three types of tasks.
              </p>

              <div className="my-4 sm:my-8">
                <table className="w-full border border-black text-sm sm:text-base">
                  <thead>
                    <tr className="bg-[#2d7a7c] text-white">
                      <th className="border border-black px-3 sm:px-6 py-2 sm:py-3 text-left font-['Inter',_sans-serif]">Type of Task</th>
                      <th className="border border-black px-3 sm:px-6 py-2 sm:py-3 text-left font-['Inter',_sans-serif]">Description</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    <tr>
                      <td className="border border-black px-3 sm:px-6 py-2 sm:py-3 font-['Inter',_sans-serif]">Complete the Words</td>
                      <td className="border border-black px-3 sm:px-6 py-2 sm:py-3 font-['Inter',_sans-serif]">Fill in the missing letters in a paragraph.</td>
                    </tr>
                    <tr>
                      <td className="border border-black px-3 sm:px-6 py-2 sm:py-3 font-['Inter',_sans-serif]">Read in Daily Life</td>
                      <td className="border border-black px-3 sm:px-6 py-2 sm:py-3 font-['Inter',_sans-serif]">Answer questions about everyday reading material.</td>
                    </tr>
                    <tr>
                      <td className="border border-black px-3 sm:px-6 py-2 sm:py-3 font-['Inter',_sans-serif]">Read an Academic Passage</td>
                      <td className="border border-black px-3 sm:px-6 py-2 sm:py-3 font-['Inter',_sans-serif]">Answer questions about academic passages.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        
        <MobileQuestionNav 
          onHome={() => {
            setShowReadingSection(false);
            setShowToeflTest(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onNext={() => {
            setShowReadingSection(false);
            setShowModule1Intro(true);
          }}
          hideBack={true}
        />
      </div>
    );
  };

  // Module 1 Intro Screen Component
  const Module1IntroScreen = () => {
    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
        {/* Header */}
        <div className="bg-[#1e6b73] h-12 sm:h-16 flex items-center justify-between px-4 sm:px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-lg sm:text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowModule1Intro(false);
                setShowReadingSection(false);
                setShowToeflTest(false);
                if (testBankType === 'tpo') {
                  setActiveTab('TPO');
                } else {
                  setActiveTab('Real Test');
                }
              }}
            >
              *toefl ibt
            </div>
          </div>
          {/* Begin Button */}
          <button 
            className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-3 sm:px-5 py-1.5 sm:py-2 hover:bg-gray-100 transition-colors"
            onClick={() => {
              setShowModule1Intro(false);
              setShowFillBlanksTest(true);
            }}
          >
            <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-sm sm:text-base">Begin</span>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
              <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
            </svg>
          </button>
        </div>

        {/* Navigation tabs */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-4 sm:px-8 py-2 sm:py-3">
            <div className="text-gray-700 font-['Inter',_sans-serif] font-bold text-sm sm:text-base">
              Reading
            </div>
          </div>
        </div>

        {/* Main content - Centered */}
        <div className="flex-1 flex items-start sm:items-center justify-center bg-white p-6 sm:p-12 pt-8 sm:pt-12">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-2xl sm:text-4xl font-['Inter',_sans-serif] font-bold text-black mb-4 sm:mb-8">Module 1</h1>
            
            <div className="text-gray-700 font-['Inter',_sans-serif] leading-relaxed space-y-4 sm:space-y-6">
              <p className="text-base sm:text-lg">
                The clock will show you how much time you have to complete Module 1.
              </p>
              
              <p className="text-base sm:text-lg">
                You can use <strong>Next</strong> and <strong>Back</strong> to move to the next question or return to previous questions within the same module.
              </p>

              <p className="text-base sm:text-lg">
                You WILL NOT be able to return to Module 1 once you have begun Module 2.
              </p>
            </div>
          </div>
        </div>
        
        <MobileQuestionNav 
          onBack={() => {
            setShowModule1Intro(false);
            setShowReadingIntro(true);
          }}
          onHome={() => {
            setShowModule1Intro(false);
            setShowReadingSection(false);
            setShowToeflTest(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onNext={() => {
            setShowModule1Intro(false);
            setShowFillBlanksTest(true);
          }}
        />
      </div>
    );
  };

  // Module 1 Details Screen Component
  const Module1DetailsScreen = () => {
    const [hideTime, setHideTime] = useState(false);
    
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowModule1Details(false);
                setShowModule1Intro(false);
                setShowReadingSection(false);
                setShowToeflTest(false);
                if (testBankType === 'tpo') {
                  setActiveTab('TPO');
                } else {
                  setActiveTab('Real Test');
                }
              }}
            >
              *toefl ibt
            </div>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="bg-white border-b border-gray-300 flex items-center justify-between px-8 py-3">
          <div className="text-gray-700 font-['Inter',_sans-serif] font-bold">
            Reading
          </div>
          <div className="flex items-center gap-4">
            {!hideTime && (
              <div className="text-gray-700 font-['Inter',_sans-serif]">
                00:11:30
              </div>
            )}
            <button 
              className="flex items-center gap-2 text-[#1e6b73] hover:underline"
              onClick={() => setHideTime(!hideTime)}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
              <span className="font-['Inter',_sans-serif]">{hideTime ? 'Show' : 'Hide'} Time</span>
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-12 overflow-auto bg-white border border-black">
          <div className="max-w-4xl">
            <h1 className="text-3xl font-['Inter',_sans-serif] font-bold text-gray-800 mb-8 pb-4 border-b-2 border-gray-300">
              Module 1
            </h1>
            
            <div className="text-gray-700 font-['Inter',_sans-serif] leading-relaxed space-y-6 mt-6">
              <p>
                The clock will show you how much time you have to complete Module 1.
              </p>
              
              <p>
                You can use <span className="font-semibold">Next</span> and <span className="font-semibold">Back</span> to move to the next question or return to previous questions within the same module.
              </p>
              
              <p>
                You WILL NOT be able to return to Module 1 once you have begun Module 2.
              </p>
            </div>
          </div>
        </div>
        
        <MobileQuestionNav 
          onHome={() => {
            setShowModule1Details(false);
            setShowModule1Intro(false);
            setShowReadingSection(false);
            setShowToeflTest(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onNext={() => {
            setShowModule1Details(false);
            setShowFillBlanksTest(true);
          }}
          hideBack
        />
      </div>
    );
  };

  // TOEFL Test Screen Component
  const ToeflTestScreen = () => {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="bg-[#2d7a7c] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-bold tracking-wider cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowToeflTest(false);
                setShowReadingSection(false);
                if (testBankType === 'tpo') {
                  setActiveTab('TPO');
                } else {
                  setActiveTab('Real Test');
                }
              }}
            >
              *toefl ibt
            </div>
          </div>
          {/* Continue Button */}
          <button 
            className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
            onClick={() => {
              if (currentTest?.section === 'Reading') {
                setShowToeflTest(false);
                setShowFillBlanksTest(true);
              }
            }}
          >
            <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Continue</span>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
              <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
            </svg>
          </button>
        </div>

        {/* Navigation tabs */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-8 py-3">
            <div className="text-gray-700 font-['Inter',_sans-serif] font-bold">
              Reading
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-12 overflow-auto bg-white border border-black">
          <div className="max-w-4xl">
            <h1 className="text-3xl font-['Inter',_sans-serif] font-bold text-gray-800 mb-8 pb-4 border-b-2 border-gray-300">Reading Section</h1>
            
            <div className="text-gray-700 font-['Inter',_sans-serif] leading-relaxed mb-8 mt-6">
              <p>
                In the reading section, you will answer 35–48 questions to demonstrate how well you 
                understand academic and non-academic texts in English. There are three types of tasks.
              </p>
            </div>

            {/* Task table */}
            <div className="border border-black overflow-hidden inline-block">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#2d7a7c] text-white">
                    <th className="px-6 py-3 text-left font-['Inter',_sans-serif] border-r-2 border-black">Type of Task</th>
                    <th className="px-6 py-3 text-left font-['Inter',_sans-serif]">Description</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  <tr className="border-b-2 border-black">
                    <td className="px-6 py-3 font-['Inter',_sans-serif] border-r-2 border-black">Complete the Words</td>
                    <td className="px-6 py-3 font-['Inter',_sans-serif]">
                      Fill in the missing letters in a paragraph.
                    </td>
                  </tr>
                  <tr className="border-b-2 border-black">
                    <td className="px-6 py-3 font-['Inter',_sans-serif] border-r-2 border-black">Read in Daily Life</td>
                    <td className="px-6 py-3 font-['Inter',_sans-serif]">
                      Answer questions about everyday reading material.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3 font-['Inter',_sans-serif] border-r-2 border-black">Read an Academic Passage</td>
                    <td className="px-6 py-3 font-['Inter',_sans-serif]">
                      Answer questions about academic passages.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const TPOCard = ({
    number,
    onStartTest,
    onReviewTest,
    isLocked = false,
    onUnlockClick,
  }: {
    number: number;
    onStartTest?: (section: string) => void;
    onReviewTest?: (section: string) => void;
    isLocked?: boolean;
    onUnlockClick?: () => void;
  }) => {
    const [hoveredSection, setHoveredSection] = useState<string | null>(null);

    const handleStartTest = (section: string) => {
      if (isLocked && onUnlockClick) {
        onUnlockClick();
        return;
      }

      localStorage.removeItem(`tpo_progress_tpo_${number}_${section}`);
      if (onStartTest) {
        onStartTest(section);
        return;
      }

      launchSection(number, section, 'tpo', 'start');
    };

    const handleContinueTest = (section: string) => {
      if (isLocked && onUnlockClick) {
        onUnlockClick();
        return;
      }

      const saved = localStorage.getItem(`tpo_progress_tpo_${number}_${section}`);
      if (!saved) {
        alert('저장된 진행 상황이 없습니다. Start를 눌러 새로 시작하세요.');
        return;
      }

      launchSection(number, section, 'tpo', 'start');
    };

    const handleReviewTest = (section: string) => {
      if (isLocked && onUnlockClick) {
        onUnlockClick();
        return;
      }

      localStorage.removeItem(`tpo_progress_tpo_${number}_${section}`);
      if (onReviewTest) {
        onReviewTest(section);
        return;
      }

      launchSection(number, section, 'tpo', 'review');
    };

    const hasSavedProgress = (section: string) => !!localStorage.getItem(`tpo_progress_tpo_${number}_${section}`);

    const hoverBgClass = 'bg-gradient-to-r from-[#e3f2fd] to-[#bbdefb] shadow-md';
    const defaultBgClass = 'bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100';
    const buttonHoverClass = 'bg-gradient-to-r from-[#2563eb] to-[#3b82f6] text-white shadow-md transform scale-105';
    const continueHoverClass = 'bg-gradient-to-r from-[#0D9488] to-[#14B8A6] text-white shadow-md transform scale-105';

    const renderSectionRow = (sectionName: string, sectionType: string, isLast = false) => (
      <div
        className={`h-20 relative ${isLast ? 'rounded-b-[12px]' : 'rounded-[8px]'} shrink-0 w-full cursor-pointer transition-all duration-300 ${
          hoveredSection === sectionName.toLowerCase() ? hoverBgClass : defaultBgClass
        }`}
        onMouseEnter={() => setHoveredSection(sectionName.toLowerCase())}
        onMouseLeave={() => setHoveredSection(null)}
      >
        <div className="relative size-full">
          <div className="box-border flex h-20 items-center justify-between px-4 relative w-full">
            <div className="flex flex-col font-['Inter',_sans-serif] font-bold justify-center text-[#1a2832] text-[16px] tracking-wide">
              <p>{sectionName}</p>
            </div>
            <div className="flex items-center gap-1.5">
              {hasSavedProgress(sectionType) && (
                <div
                  className={`flex items-center justify-center h-[28px] rounded-[14px] px-3 transition-all duration-300 cursor-pointer shadow-sm ${
                    hoveredSection === sectionName.toLowerCase() ? continueHoverClass : 'bg-[#E6F7F5] text-[#0D9488] hover:bg-[#CCEFEC]'
                  }`}
                  onClick={() => handleContinueTest(sectionType)}
                >
                  <p className="font-['Inter',_sans-serif] font-bold text-[11px] text-center">Continue</p>
                </div>
              )}
              <div
                className={`flex items-center justify-center h-[28px] rounded-[14px] px-3 transition-all duration-300 cursor-pointer shadow-sm ${
                  hoveredSection === sectionName.toLowerCase() ? buttonHoverClass : 'bg-[rgba(0,0,0,0.05)] text-[#374151] hover:bg-[rgba(0,0,0,0.1)]'
                }`}
                onClick={() => handleStartTest(sectionType)}
              >
                <p className="font-['Inter',_sans-serif] font-bold text-[11px] text-center">Start</p>
              </div>
              <div
                className="flex items-center justify-center h-[28px] rounded-[14px] px-3 transition-all duration-300 cursor-pointer shadow-sm bg-[#f4efe6] text-[#8b5e1a] hover:bg-[#eadfcd]"
                onClick={() => handleReviewTest(sectionType)}
              >
                <p className="font-['Inter',_sans-serif] font-bold text-[11px] text-center">Review</p>
              </div>
            </div>
            {!isLast && <div className="absolute bg-[#e5e7eb] bottom-0 h-[0.5px] left-3 right-3" />}
          </div>
        </div>
      </div>
    );

    const tpoMeta = tpoTests.find(t => t.testType === 'TPO' && t.testNumber === number);

    return (
      <div className="bg-white rounded-[12px] shadow-lg border border-gray-200 w-full max-w-[268px] transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
        <div className="bg-gradient-to-r from-[#2d7a7c] to-[#3d8a8c] rounded-t-[12px] shadow-md flex items-center justify-between px-4 py-3 min-h-[52px]">
          <p className="font-['Inter',_sans-serif] font-bold text-[24px] text-white tracking-wide">TPO {number}</p>
          {tpoMeta && (tpoMeta.year || tpoMeta.month) && (
            <div className="flex items-center gap-1.5 shrink-0">
              {tpoMeta.year && (
                <span className="text-xs px-2.5 py-1 bg-white/25 text-white rounded-full font-bold tracking-wide border border-white/40">
                  {tpoMeta.year}
                </span>
              )}
              {tpoMeta.month && (
                <span className="text-xs px-2.5 py-1 bg-[#e67e22] text-white rounded-full font-bold shadow-sm">
                  {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][tpoMeta.month - 1]}
                </span>
              )}
            </div>
          )}
        </div>
        {renderSectionRow('Reading', 'Reading')}
        {renderSectionRow('Listening', 'Listening')}
        {renderSectionRow('Writing', 'Writing')}
        {renderSectionRow('Speaking', 'Speaking', true)}
      </div>
    );
  };

  const RealTestCard = ({ number }: { number: number }) => {
    const [hoveredSection, setHoveredSection] = useState<string | null>(null);

    const handleStartTest = (section: string) => {
      localStorage.removeItem(`tpo_progress_real_${number}_${section}`);
      setCurrentTest({ tpoNumber: number, section });
      setTestBankType('test');
      setShowToeflTest(true);
    };

    const handleContinueTest = (section: string) => {
      const saved = localStorage.getItem(`tpo_progress_real_${number}_${section}`);
      if (!saved) {
        alert('저장된 진행 상황이 없습니다. Start를 눌러 새로 시작하세요.');
        return;
      }
      setCurrentTest({ tpoNumber: number, section });
      setTestBankType('test');
      setShowToeflTest(true);
    };

    const hasSavedProgress = (section: string) => !!localStorage.getItem(`tpo_progress_real_${number}_${section}`);

    const hoverBgClass = 'bg-gradient-to-r from-[#e3f2fd] to-[#bbdefb] shadow-md';
    const defaultBgClass = 'bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100';
    const buttonHoverClass = 'bg-gradient-to-r from-[#2563eb] to-[#3b82f6] text-white shadow-md transform scale-105';
    const continueHoverClass = 'bg-gradient-to-r from-[#0D9488] to-[#14B8A6] text-white shadow-md transform scale-105';

    const renderSectionRow = (sectionName: string, sectionType: string, isLast = false) => (
      <div
        className={`h-20 relative ${isLast ? 'rounded-b-[12px]' : 'rounded-[8px]'} shrink-0 w-full cursor-pointer transition-all duration-300 ${
          hoveredSection === sectionName.toLowerCase() ? hoverBgClass : defaultBgClass
        }`}
        onMouseEnter={() => setHoveredSection(sectionName.toLowerCase())}
        onMouseLeave={() => setHoveredSection(null)}
      >
        <div className="relative size-full">
          <div className="box-border flex h-20 items-center justify-between px-4 relative w-full">
            <div className="flex flex-col font-['Inter',_sans-serif] font-bold justify-center text-[#1a2832] text-[16px] tracking-wide">
              <p>{sectionName}</p>
            </div>
            <div className="flex items-center gap-1.5">
              {hasSavedProgress(sectionType) && (
                <div
                  className={`flex items-center justify-center h-[28px] rounded-[14px] px-3 transition-all duration-300 cursor-pointer shadow-sm ${
                    hoveredSection === sectionName.toLowerCase() ? continueHoverClass : 'bg-[#E6F7F5] text-[#0D9488] hover:bg-[#CCEFEC]'
                  }`}
                  onClick={() => handleContinueTest(sectionType)}
                >
                  <p className="font-['Inter',_sans-serif] font-bold text-[11px] text-center">Continue</p>
                </div>
              )}
              <div
                className={`flex items-center justify-center h-[28px] rounded-[14px] px-3 transition-all duration-300 cursor-pointer shadow-sm ${
                  hoveredSection === sectionName.toLowerCase() ? buttonHoverClass : 'bg-[rgba(0,0,0,0.05)] text-[#374151] hover:bg-[rgba(0,0,0,0.1)]'
                }`}
                onClick={() => handleStartTest(sectionType)}
              >
                <p className="font-['Inter',_sans-serif] font-bold text-[11px] text-center">Start</p>
              </div>
            </div>
            {!isLast && <div className="absolute bg-[#e5e7eb] bottom-0 h-[0.5px] left-3 right-3" />}
          </div>
        </div>
      </div>
    );

    return (
      <div className="bg-white rounded-[12px] shadow-lg border border-gray-200 w-full max-w-[268px] transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
        <div className="bg-gradient-to-r from-[#2d7a7c] to-[#3d8a8c] h-16 relative rounded-t-[12px] shadow-md">
          <div className="absolute box-border content-stretch flex items-center justify-start left-0 px-4 py-0 right-0 top-0">
            <div className="basis-0 content-stretch flex flex-col grow h-16 items-start justify-start min-h-px min-w-px relative shrink-0">
              <div className="flex flex-col font-['Inter',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[24px] text-white w-full tracking-wide">
                <p className="leading-[64px]">Real Test {number}</p>
              </div>
            </div>
          </div>
        </div>
        {renderSectionRow('Reading', 'Reading')}
        {renderSectionRow('Listening', 'Listening')}
        {renderSectionRow('Writing', 'Writing')}
        {renderSectionRow('Speaking', 'Speaking', true)}
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Toaster position="top-right" richColors />
      {/* Reading Section Intro */}
      {showReadingIntro && <ReadingIntroScreen />}

      {/* Reading Progress Restore Modal — 최상위에서 렌더링 (리스닝과 동일한 방식) */}
      {showReadingRestoreModal && readingSavedProgress && (
        <TestProgressRestoreModal
          savedProgress={readingSavedProgress}
          themeColor="#1e6b73"
          onRestore={() => {
            restoreReadingProgress();
            if (readingSavedProgress.currentScreen) {
              restoreReadingScreen(readingSavedProgress.currentScreen);
            }
          }}
          onStartFresh={() => {
            startReadingFresh();
            clearReadingProgress();
          }}
        />
      )}
      {showReadingSection && <ReadingSectionScreen />}
      
      {/* Module 1 Intro Screen */}
      {showModule1Intro && <Module1IntroScreen />}
      
      {/* Module 1 Details Screen */}
      {showModule1Details && <Module1DetailsScreen />}
      
      {/* Fill Blanks Test Screen (Question 10) */}
      {showFillBlanksTest && <FillBlanksTestScreen />}
      
      {/* Read Notice Test Screen (Question 11) */}
      {showReadNoticeTest && <ReadNoticeTestScreen />}
      
      {/* Read Notice Test Screen 2 (Question 12) */}
      {showReadNoticeTest2 && <ReadNoticeTestScreen2 />}
      
      {/* Social Media Test Screen (Question 13) */}
      {showSocialMediaTest && <ReadSocialMediaTestScreen />}
      
      {/* Social Media Test Screen 2 (Question 14) */}
      {showSocialMediaTest2 && <ReadSocialMediaTest2Screen />}
      
      {/* Social Media Test Screen 3 (Question 15) */}
      {showSocialMediaTest3 && <ReadSocialMediaTest3Screen />}
      
      {/* Module 1 Questions 16-20 */}
      {showModule1Question16 && <Module1Question16Screen />}
      {showModule1Question17 && <Module1Question17Screen />}
      {showModule1Question18 && <Module1Question18Screen />}
      {showModule1Question19 && <Module1Question19Screen />}
      {showModule1Question20 && <Module1Question20Screen />}
      
      {/* End of Module 1 Screen */}
      {showEndModule1 && <EndModule1Screen />}
      
      {/* Module 2 Screen */}
      {showModule2 && <Module2Screen />}
      
      {/* Module 2 Questions */}
      {showModule2FillBlanks && <Module2FillBlanksScreen />}
      {showModule2Question11 && <Module2Question11Screen />}
      {showModule2Question12 && <Module2Question12Screen />}
      {showModule2Question13 && <Module2Question13Screen />}
      {showModule2Question14 && <Module2Question14Screen />}
      {showModule2Question15 && <Module2Question15Screen />}
      {showModule2Question16 && <Module2Question16Screen />}
      {showModule2Question17 && <Module2Question17Screen />}
      {showModule2Question18 && <Module2Question18Screen />}
      {showModule2Question19 && <Module2Question19Screen />}
      {showModule2Question20 && <Module2Question20Screen />}
      
      {/* End of Module 2 / Reading Complete Screen */}
      {showEndModule2 && <EndModule2Screen />}
      
      {/* Listening Section - M1 Wrapper */}
      {activeListeningM1Screen && (
        <ListeningM1Wrapper
          initialScreen={activeListeningM1Screen}
          onScreenChange={setCurrentListeningReviewScreen}
          onHome={() => {
            setActiveListeningM1Screen(null);
            clearReviewContext();
            setIsReviewMode(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Test');
            }
          }}
          onComplete={() => {
            setActiveListeningM1Screen(null);
            setActiveListeningM2Screen('q1');
          }}
          getCmsListeningQuestion={(qNumber: number) => {
            const sectionData = getCurrentSectionData('Listening');
            return sectionData?.questions.find(q =>
              (q.questionNumber === qNumber || q.questionNumber === String(qNumber) || String(q.questionNumber) === String(qNumber)) &&
              !(q.questionType || '').toLowerCase().includes('module 2')
            ) || null;
          }}
        />
      )}
      {/* Listening Section - M2 Wrapper */}
      {activeListeningM2Screen && (
        <ListeningM2Wrapper
          initialScreen={activeListeningM2Screen}
          onScreenChange={setCurrentListeningReviewScreen}
          onHome={() => {
            setActiveListeningM2Screen(null);
            clearReviewContext();
            setIsReviewMode(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Test');
            }
          }}
          onComplete={() => {
            setActiveListeningM2Screen(null);
            clearReviewContext();
            setIsReviewMode(false);
            saveSectionResultToHistory('Listening', 34);
          }}
          onVolumeClick={() => setShowVolumeModal(true)}
          onBackToM1={() => {
            setActiveListeningM2Screen(null);
            setActiveListeningM1Screen('module2-intro');
          }}
          getCmsListeningQuestion={(qNumber: number) => {
            const sectionData = getCurrentSectionData('Listening');
            // Module 2 문제만 찾기 (questionType에 'Module 2' 포함)
            const q = sectionData?.questions.find(q =>
              (q.questionNumber === qNumber || q.questionNumber === String(qNumber) || String(q.questionNumber) === String(qNumber)) &&
              (q.questionType || '').toLowerCase().includes('module 2')
            );
            // Module 2 필터로 못 찾으면 전체에서 찾기 (fallback)
            return q || sectionData?.questions.find(q =>
              q.questionNumber === qNumber || q.questionNumber === String(qNumber) || String(q.questionNumber) === String(qNumber)
            ) || null;
          }}
        />
      )}

      {/* Writing Section Wrapper */}
      {activeWritingScreen && (
        <WritingSectionWrapper
          initialScreen={activeWritingScreen}
          onScreenChange={setCurrentWritingReviewScreen}
          onHome={() => {
            setActiveWritingScreen(null);
            clearReviewContext();
            setIsReviewMode(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Test');
            }
          }}
          onComplete={() => {
            setActiveWritingScreen(null);
            clearReviewContext();
            setIsReviewMode(false);
            saveSectionResultToHistory('Writing', 12);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Test');
            }
          }}
        />
      )}

      {/* Speaking Section Wrapper */}
      {activeSpeakingScreen && (
        <SpeakingSectionWrapper
          initialScreen={activeSpeakingScreen}
          onScreenChange={setCurrentSpeakingReviewScreen}
          questions={getCurrentSectionData('Speaking')?.questions || []}
          testData={getCurrentTestData()}
          onHome={() => {
            setActiveSpeakingScreen(null);
            clearReviewContext();
            setIsReviewMode(false);
          }}
          onComplete={() => {
            setActiveSpeakingScreen(null);
            clearReviewContext();
            setIsReviewMode(false);
            saveSectionResultToHistory('Speaking', 11);
          }}
        />
      )}

      {activeReviewPanel && !reviewTrainingRequest && (
        <ReviewAssistantPanel
          section={activeReviewPanel.section}
          variant={activeReviewPanel.variant}
          contentKey={activeReviewPanel.contentKey}
          questionType={activeReviewPanel.questionType}
          currentDifficulty={activeReviewPanel.difficulty}
          onStartTraining={setReviewTrainingRequest}
          translationNote={activeReviewPanel.translationNote}
          analysisNote={activeReviewPanel.analysisNote}
          vocabularyNote={activeReviewPanel.vocabularyNote}
        />
      )}

      {activeReviewPanel && reviewTrainingRequest && (
        <ReviewTrainingOverlay
          section={activeReviewPanel.section}
          title={reviewTrainingRequest.title}
          questionType={reviewTrainingRequest.questionType || activeReviewPanel.questionType}
          difficulty={reviewTrainingRequest.difficulty || activeReviewPanel.difficulty}
          trainingTests={trainingTests}
          onClose={() => setReviewTrainingRequest(null)}
        />
      )}
      
      {/* Volume Control */}
      <VolumeControl isOpen={isVolumeOpen} onClose={closeVolume} buttonRef={volumeButtonRef} />
      
      {/* TOEFL Test Screen Overlay */}
      {showToelfTest && !showReadingSection && !showFillBlanksTest && !showReadNoticeTest && !showReadNoticeTest2 && <ToeflTestScreen />}
      {/* Header */}
      <div className="bg-white box-border content-stretch flex flex-col h-[70px] md:h-[80px] items-center justify-start relative shadow-[0px_0px_12px_0px_rgba(0,0,0,0.15)] shrink-0 w-full">
        <div className="content-stretch flex items-center justify-between relative shrink-0 w-full max-w-[1200px] px-3 md:px-8">
          {/* Logo */}
          <div className="flex items-center">
            <div 
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                // Always go to LMS page
                setShowLandingPage(false);
                setShowLoginForm(false);
                setShowRegistrationForm(false);
                handleTabChange('TOEFL Prep');
              }}
            >
              <div className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-lg shadow-md" style={{ backgroundColor: '#00bcd4' }}>
                <Zap className="w-5 h-5 md:w-6 md:h-6 text-white fill-white" strokeWidth={0} />
              </div>
              <span className="hidden md:inline text-xl md:text-2xl font-extrabold tracking-tight" style={{ color: '#005f61' }}>
                AllMyExam<span style={{ color: '#00bcd4' }}>-TOEFL</span>
              </span>
              <span className="md:hidden text-base font-extrabold tracking-tight" style={{ color: '#005f61' }}>
                AME<span style={{ color: '#00bcd4' }}>-T</span>
              </span>
            </div>
          </div>
          
          {/* Navigation - Hidden on mobile */}
          <div className="content-stretch hidden md:flex items-center justify-center relative shrink-0 overflow-x-auto scrollbar-hide">
            <div className="content-stretch flex h-[70px] md:h-[80px] items-start justify-start relative shrink-0 min-w-max">
              {tabs.map((tab, index) => (
                <div 
                  key={tab}
                  className={`content-stretch flex flex-col h-full items-center justify-center relative shrink-0 px-2 md:px-6 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                    activeTab === tab ? 'text-[#005f61]' : 'text-[#1a1a1a] hover:text-[#005f61]'
                  }`}
                  onClick={() => {
                    // Check if login is required for this tab
                    const requiresLogin = ['TPO', 'Test', 'Real Test', 'Question Types', 'Training', 'History'].includes(tab);
                    // Allow vocabulary training without login
                    const isVocabularyPath = location.pathname.includes('/vocabulary');
                    
                    // Always switch tab and close auth forms
                    setActiveTab(tab);
                    setShowLoginForm(false);
                    setShowRegistrationForm(false);
                    
                    // Show login popup if login is required and user is not logged in
                    if (requiresLogin && !isLoggedIn && !isVocabularyPath) {
                      setShowLoginPopup(true);
                    }
                  }}
                >
                  <div className={`flex flex-col font-['Inter',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[10px] md:text-[16px] text-center font-bold tracking-wide ${
                    activeTab === tab ? 'text-[#005f61]' : 'text-[#1a1a1a]'
                  }`}>
                    <p className="leading-[70px] md:leading-[80px] whitespace-nowrap">
                      <span className="hidden md:inline">{tab}</span>
                      <span className="md:hidden">{tab === 'Question Types' ? 'Q Types' : tab === 'Training' ? 'Train' : tab}</span>
                    </p>
                  </div>
                  {activeTab === tab && (
                    <div className="absolute bg-gradient-to-r from-[#005f61] to-[#0891b2] bottom-2 md:bottom-4 h-0.5 md:h-1 left-1/2 transform -translate-x-1/2 rounded-full w-6 md:w-8 shadow-sm" />
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Right side - Login, Join */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* History Button - Visible on mobile */}
            <button 
              onClick={() => {
                setActiveTab('History');
                setShowLoginForm(false);
                setShowRegistrationForm(false);
                
                // Show login popup if user is not logged in
                if (!isLoggedIn) {
                  setShowLoginPopup(true);
                }
              }}
              className={`md:hidden px-3 py-2 rounded-lg font-['Inter',_sans-serif] font-bold text-xs transition-all duration-300 transform hover:scale-105 shadow-sm ${
                activeTab === 'History'
                  ? 'bg-gradient-to-r from-[#005f61] to-[#0891b2] text-white hover:shadow-lg' 
                  : 'bg-white text-[#005f61] border-2 border-[#005f61] hover:bg-[#005f61] hover:text-white'
              }`}
            >
              History
            </button>

            {/* Login Button or User Greeting */}
            {!isLoggedIn ? (
              <button 
                onClick={() => {
                  setShowLoginForm(true);
                  setShowRegistrationForm(false);
                  setLoginFormKey(prev => prev + 1);
                }}
                className={`px-3 md:px-6 py-2 md:py-3 rounded-lg font-['Inter',_sans-serif] font-bold text-xs md:text-base transition-all duration-300 transform hover:scale-105 shadow-sm ${
                  showLoginForm 
                    ? 'bg-[#005f61] text-white hover:bg-[#004d56]' 
                    : 'bg-transparent text-[#005f61] border-2 border-[#005f61] hover:bg-[#005f61]/10'
                }`}
              >
                Login
              </button>
            ) : (
              <div className="px-3 md:px-6 py-2 md:py-3 flex items-center gap-2">
                <span className="text-xs md:text-base font-['Inter',_sans-serif] font-bold text-[#005f61]">
                  Hello!
                </span>
                <span className="text-xs md:text-base font-['Inter',_sans-serif] font-bold text-[#e67e22]">
                  {loggedInUserName}
                </span>
              </div>
            )}
            
            {/* Join/Registration Button (when not logged in) or Logout Button (when logged in) */}
            {!isLoggedIn ? (
              <button 
                onClick={() => {
                  setShowRegistrationForm(true);
                  setShowLoginForm(false);
                  setRegistrationFormKey(prev => prev + 1);
                }}
                className={`px-3 md:px-6 py-2 md:py-3 rounded-lg font-['Inter',_sans-serif] font-bold text-xs md:text-base transition-all duration-300 transform hover:scale-105 shadow-sm ${
                  showRegistrationForm 
                    ? 'bg-[#005f61] text-white hover:bg-[#004d56]' 
                    : 'bg-[#005f61] text-white hover:bg-[#004d56]'
                }`}
              >
                <span className="md:hidden">Join</span>
                <span className="hidden md:inline">Registration</span>
              </button>
            ) : (
              <button 
                onClick={() => {
                  // Logout: Reset login state
                  setIsLoggedIn(false);
                  setLoggedInUserName('');
                  setShowLoginForm(false);
                  setShowRegistrationForm(false);
                }}
                className="px-3 md:px-6 py-2 md:py-3 rounded-lg font-['Inter',_sans-serif] font-bold text-xs md:text-base transition-all duration-300 transform hover:scale-105 shadow-sm bg-[#005f61] text-white hover:bg-[#004d56]"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Login Form Below Navigation */}
      {showLoginForm && (
        <LoginForm 
          key={loginFormKey} 
          onClose={() => setShowLoginForm(false)}
          onLoginSuccess={(username) => {
            setIsLoggedIn(true);
            setLoggedInUserName(username);
            setShowLoginForm(false);
            setShowLoginPopup(false);
          }}
        />
      )}

      {/* Registration Form Below Navigation */}
      {showRegistrationForm && (
        <RegistrationForm 
          key={registrationFormKey} 
          onClose={() => setShowRegistrationForm(false)}
          onRegisterSuccess={() => {
            setShowRegistrationForm(false);
            setShowLoginForm(true);
            setLoginFormKey(prev => prev + 1);
          }}
        />
      )}

      {/* Login Popup */}
      <LoginPopup 
        isOpen={showLoginPopup && !isLoggedIn}
        onClose={() => setShowLoginPopup(false)}
        onLoginClick={() => {
          setShowLoginPopup(false);
          setShowLoginForm(true);
          setShowRegistrationForm(false);
          setLoginFormKey(prev => prev + 1);
        }}
      />

      {/* Banner */}
      {!showLoginForm && !showRegistrationForm && !isInTrainingMode && (
        <div className="h-[130px] md:h-[140px] bg-gradient-to-r from-[#2d7a7c] to-[#1e6b73] relative shrink-0 w-full shadow-lg">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-['Inter',_sans-serif] font-bold text-white tracking-wide">
                TOEFL Preparation
              </h1>
              <p className="text-base md:text-lg text-white/90 mt-2 font-['Inter',_sans-serif] font-medium">
                Your Path to Success
              </p>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-4 left-8 w-16 h-16 bg-white/10 rounded-full"></div>
          <div className="absolute bottom-4 right-12 w-12 h-12 bg-white/10 rounded-full"></div>
          <div className="absolute top-1/2 right-1/4 w-8 h-8 bg-white/5 rounded-full"></div>
        </div>
      )}

      {/* Main Content */}
      {!showLoginForm && !showRegistrationForm && activeTab === 'Question Types' && (
        <QuestionTypesSection 
          activeSkill={activeSkill}
          setActiveSkill={setActiveSkill}
          lmsContents={lmsContents}
          onTrainingStateChange={setIsInTrainingMode}
          advertisements={advertisements}
          onSaveResult={handleAddQuestionTypesResult}
          savedConfig={questionTypesConfig}
          onSaveConfig={setQuestionTypesConfig}
          practiceResults={questionTypesResults}
        />
      )}

      {!showLoginForm && !showRegistrationForm && activeTab === 'Question Types-old' && (
        <div className="bg-gradient-to-b from-white to-gray-50 relative shrink-0 w-full shadow-sm">
          {/* Skills Navigation */}
          <div className="border-b border-gray-200 bg-white">
            <div className="max-w-7xl mx-auto px-8 py-6">
              <h2 className="text-2xl font-bold text-[#2d5a5d] mb-4">TOEFL Question Types</h2>
              <div className="flex gap-3">
                {skills.map((skill) => (
                  <button
                    key={skill}
                    className={`px-6 py-3 rounded-lg font-bold text-sm transition-all duration-300 transform hover:scale-105 shadow-md ${
                      activeSkill === skill
                        ? 'bg-gradient-to-r from-[#e67e22] to-[#f39c12] text-white hover:from-[#d35400] hover:to-[#e67e22]'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-sm'
                    }`}
                    onClick={() => setActiveSkill(skill)}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Skill Content Section */}
          <div className="max-w-7xl mx-auto px-3 md:px-8 py-4 md:py-8">
            <div className="bg-white rounded-xl shadow-lg p-4 md:p-8 border border-gray-200">
              {activeSkill === 'Reading' && (
                <div>
                  <h3 className="text-2xl md:text-3xl text-[#2d5a5d] mb-3 md:mb-4">Reading Question Types</h3>
                  <p className="text-gray-700 mb-4 md:mb-6 leading-relaxed text-sm md:text-base">
                    학술적 지문 이해 능력 평가
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-[#2d7a7c] rounded-full flex items-center justify-center mb-4 shadow-md">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <h4 className="text-[#2d5a5d] mb-2">Vocabulary Questions</h4>
                      <p className="text-xs text-gray-600 mb-4">문맥 속 단어 의미</p>
                      <button className="w-full bg-[#3b5998] text-white py-2.5 px-4 rounded-lg hover:bg-[#2d4373] transition-colors">
                        훈련 시작
                      </button>
                    </div>

                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-[#2d7a7c] rounded-full flex items-center justify-center mb-4 shadow-md">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h4 className="text-[#2d5a5d] mb-2">Factual Information</h4>
                      <p className="text-xs text-gray-600 mb-4">사실 정보 찾기</p>
                      <button className="w-full bg-[#3b5998] text-white py-2.5 px-4 rounded-lg hover:bg-[#2d4373] transition-colors">
                        훈련 시작
                      </button>
                    </div>

                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-[#2d7a7c] rounded-full flex items-center justify-center mb-4 shadow-md">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <h4 className="text-[#2d5a5d] mb-2">Inference Questions</h4>
                      <p className="text-xs text-gray-600 mb-4">내용 추론</p>
                      <button className="w-full bg-[#3b5998] text-white py-2.5 px-4 rounded-lg hover:bg-[#2d4373] transition-colors">
                        훈��� 시작
                      </button>
                    </div>

                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-[#2d7a7c] rounded-full flex items-center justify-center mb-4 shadow-md">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h4 className="text-[#2d5a5d] mb-2">Summary Questions</h4>
                      <p className="text-xs text-gray-600 mb-4">전체 내용을 요약하는 문제입니다.</p>
                      <button className="w-full bg-[#3b5998] text-white py-2.5 px-4 rounded-lg hover:bg-[#2d4373] transition-colors">
                        훈련 시작
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeSkill === 'Listening' && (
                <div>
                  <h3 className="text-3xl text-[#2d5a5d] mb-4">Listening Question Types</h3>
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    TOEFL Listening 섹션은 강의와 대화를 듣고 이해하는 능력을 평가합니다. 주요 아이디어 파악, 세부 정보 이해, 화자의 의도 파악 등을 테스트합니다.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-[#2d7a7c] rounded-full flex items-center justify-center mb-4 shadow-md">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                      </div>
                      <h4 className="text-[#2d5a5d] mb-2">Main Idea Questions</h4>
                      <p className="text-xs text-gray-600 mb-4">대화나 강의의 주요 아이디어를 파악하는 문제입니다.</p>
                      <button className="w-full bg-[#3b5998] text-white py-2.5 px-4 rounded-lg hover:bg-[#2d4373] transition-colors">
                        훈련 시작
                      </button>
                    </div>

                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-[#2d7a7c] rounded-full flex items-center justify-center mb-4 shadow-md">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                      <h4 className="text-[#2d5a5d] mb-2">Detail Questions</h4>
                      <p className="text-xs text-gray-600 mb-4">특정 세부 정보�� 듣고 이해하는 문제입니다.</p>
                      <button className="w-full bg-[#3b5998] text-white py-2.5 px-4 rounded-lg hover:bg-[#2d4373] transition-colors">
                        훈련 시작
                      </button>
                    </div>

                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-[#2d7a7c] rounded-full flex items-center justify-center mb-4 shadow-md">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      </div>
                      <h4 className="text-[#2d5a5d] mb-2">Function Questions</h4>
                      <p className="text-xs text-gray-600 mb-4">화자가 말한 내용의 기능을 파악하는 문제입니다.</p>
                      <button className="w-full bg-[#3b5998] text-white py-2.5 px-4 rounded-lg hover:bg-[#2d4373] transition-colors">
                        훈련 시작
                      </button>
                    </div>

                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-[#2d7a7c] rounded-full flex items-center justify-center mb-4 shadow-md">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h4 className="text-[#2d5a5d] mb-2">Attitude Questions</h4>
                      <p className="text-xs text-gray-600 mb-4">화자의 태도나 의견을 파악하는 문제입니다.</p>
                      <button className="w-full bg-[#3b5998] text-white py-2.5 px-4 rounded-lg hover:bg-[#2d4373] transition-colors">
                        훈련 시작
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeSkill === 'Speaking' && (
                <div>
                  <h3 className="text-3xl text-[#2d5a5d] mb-4">Speaking Question Types</h3>
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    TOEFL Speaking 섹션은 영어로 효과적으로 말하는 능력을 평가합니다. ��립형과 통합형 과제를 통해 다양한 주제에 대해 명확하게 의사를 전달하는 능력을 테스트합니다.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-[#2d7a7c] rounded-full flex items-center justify-center mb-4 shadow-md">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <h4 className="text-[#2d5a5d] mb-2">Independent Task</h4>
                      <p className="text-xs text-gray-600 mb-4">개인적인 경험이나 의견을 바탕으로 답변하는 문제입니다.</p>
                      <button className="w-full bg-[#3b5998] text-white py-2.5 px-4 rounded-lg hover:bg-[#2d4373] transition-colors">
                        훈련 시작
                      </button>
                    </div>

                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-[#2d7a7c] rounded-full flex items-center justify-center mb-4 shadow-md">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      </div>
                      <h4 className="text-[#2d5a5d] mb-2">Integrated Task</h4>
                      <p className="text-xs text-gray-600 mb-4">읽기와 듣기 자료를 통합하여 답변하는 ��제입니다.</p>
                      <button className="w-full bg-[#3b5998] text-white py-2.5 px-4 rounded-lg hover:bg-[#2d4373] transition-colors">
                        훈련 시작
                      </button>
                    </div>

                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-[#2d7a7c] rounded-full flex items-center justify-center mb-4 shadow-md">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <h4 className="text-[#2d5a5d] mb-2">Campus Situation</h4>
                      <p className="text-xs text-gray-600 mb-4">캠퍼스 상황에 대한 대화를 듣고 요약하는 문제입니다.</p>
                      <button className="w-full bg-[#3b5998] text-white py-2.5 px-4 rounded-lg hover:bg-[#2d4373] transition-colors">
                        훈련 시작
                      </button>
                    </div>

                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-[#2d7a7c] rounded-full flex items-center justify-center mb-4 shadow-md">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <h4 className="text-[#2d5a5d] mb-2">Academic Course</h4>
                      <p className="text-xs text-gray-600 mb-4">학술 강의를 듣고 요약하는 문제입니다.</p>
                      <button className="w-full bg-[#3b5998] text-white py-2.5 px-4 rounded-lg hover:bg-[#2d4373] transition-colors">
                        훈련 시작
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeSkill === 'Writing' && (
                <div>
                  <h3 className="text-3xl text-[#2d5a5d] mb-4">Writing Question Types</h3>
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    TOEFL Writing 섹션은 학술적 글쓰기 능력을 평가합니다. 통합형 쓰기와 독립형 쓰기를 통해 정보를 종합하고 논리적으로 표현하는 능력을 테스트합니다.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-[#2d7a7c] rounded-full flex items-center justify-center mb-4 shadow-md">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h4 className="text-[#2d5a5d] mb-2">Integrated Writing Task</h4>
                      <p className="text-xs text-gray-600 mb-4">읽기 자료와 강의를 듣고 요약 및 비교하는 ��세이를 작성합니다.</p>
                      <button className="w-full bg-[#3b5998] text-white py-2.5 px-4 rounded-lg hover:bg-[#2d4373] transition-colors">
                        훈련 시작
                      </button>
                    </div>

                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-[#2d7a7c] rounded-full flex items-center justify-center mb-4 shadow-md">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                      <h4 className="text-[#2d5a5d] mb-2">Independent Writing Task</h4>
                      <p className="text-xs text-gray-600 mb-4">주어진 주제에 대한 자신의 의견을 논리적으로 전���하는 에세이를 작성합니다.</p>
                      <button className="w-full bg-[#3b5998] text-white py-2.5 px-4 rounded-lg hover:bg-[#2d4373] transition-colors">
                        훈련 시작
                      </button>
                    </div>

                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-[#2d7a7c] rounded-full flex items-center justify-center mb-4 shadow-md">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                        </svg>
                      </div>
                      <h4 className="text-[#2d5a5d] mb-2">Organization & Development</h4>
                      <p className="text-xs text-gray-600 mb-4">논리적인 구조와 충분한 내용 전개가 평가됩니다.</p>
                      <button className="w-full bg-[#3b5998] text-white py-2.5 px-4 rounded-lg hover:bg-[#2d4373] transition-colors">
                        훈련 시작
                      </button>
                    </div>

                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-[#2d7a7c] rounded-full flex items-center justify-center mb-4 shadow-md">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                      </div>
                      <h4 className="text-[#2d5a5d] mb-2">Language Use</h4>
                      <p className="text-xs text-gray-600 mb-4">어휘 사용, 문법, ���현의 정확성이 평가됩니다.</p>
                      <button className="w-full bg-[#3b5998] text-white py-2.5 px-4 rounded-lg hover:bg-[#2d4373] transition-colors">
                        훈련 시작
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!showLoginForm && !showRegistrationForm && activeTab === 'TPO' && (
        <TPOPage
          isMobile={isMobile}
          isLoading={isLoadingData && tpoTests.length === 0}
          activeTestSetRange={activeTestSetRange}
          setActiveTestSetRange={setActiveTestSetRange}
          tpoTests={tpoTests}
          isContentLocked={isContentLocked}
          setActiveTab={setActiveTab}
          setCurrentTest={setCurrentTest}
          setTestBankType={setTestBankType}
          setShowListeningIntro={(v: any) => { if (v) { clearReviewContext(); setIsReviewMode(false); setActiveListeningM1Screen('intro'); } }}
          setShowReadingIntro={(v: boolean) => { if (v) { clearReviewContext(); setIsReviewMode(false); } setShowReadingIntro(v); }}
          setShowWritingIntro={(v: any) => { if (v) { clearReviewContext(); setIsReviewMode(false); setActiveWritingScreen('intro'); } }}
          setShowSpeakingIntro={(v: any) => { if (v) { clearReviewContext(); setIsReviewMode(false); setActiveSpeakingScreen('intro'); } }}
          setShowToeflTest={setShowToeflTest}
          onReviewTest={(number, section) => launchSection(number, section, 'tpo', 'review')}
          TPOCard={TPOCard}
          TestCard={TestCard}
          advertisements={advertisements}
        />
      )}

      {!showLoginForm && !showRegistrationForm && activeTab === 'Test' && (
        <TestPage
          isMobile={isMobile}
          isLoading={isLoadingData && testTests.length === 0}
          activeTestSetRange={activeTestSetRange}
          setActiveTestSetRange={setActiveTestSetRange}
          testTests={testTests}
          isContentLocked={isContentLocked}
          setActiveTab={setActiveTab}
          setCurrentTest={setCurrentTest}
          setTestBankType={setTestBankType}
          setShowListeningIntro={(v: any) => { if (v) { clearReviewContext(); setIsReviewMode(false); setActiveListeningM1Screen('intro'); } }}
          setShowReadingIntro={(v: boolean) => { if (v) { clearReviewContext(); setIsReviewMode(false); } setShowReadingIntro(v); }}
          setShowWritingIntro={(v: any) => { if (v) { clearReviewContext(); setIsReviewMode(false); setActiveWritingScreen('intro'); } }}
          setShowSpeakingIntro={(v: any) => { if (v) { clearReviewContext(); setIsReviewMode(false); setActiveSpeakingScreen('intro'); } }}
          setShowToeflTest={setShowToeflTest}
          onReviewTest={(number, section) => launchSection(number, section, 'test', 'review')}
          TestCard={TestCard}
          advertisements={advertisements}
        />
      )}

      {activeTab === 'Training' && (
        <TrainingSection 
          uploadedFiles={[]}
          onStartTest={(testInfo) => {
            console.log('Starting training test:', testInfo);
            // You can add logic here to start the training test
          }}
          setActiveTab={handleTabChange}
          lmsContents={lmsContents}
          tpoTests={[...tpoTests, ...testTests, ...trainingTests]}
          advertisements={advertisements}
          onSaveResult={handleAddTrainingResult}
          savedConfig={trainingConfig}
          onSaveConfig={setTrainingConfig}
          practiceResults={trainingResults}
        />
      )}

      {activeTab === 'History' && (
        <HistorySection 
          themeColor="#005f61"
          results={testResults}
          tpoTests={[...tpoTests, ...testTests, ...trainingTests]}
          onRetryWrongAnswers={(result) => {
            console.log('Retrying wrong answers:', result);
            // Logic to retry wrong answers
          }}
          onRestartTest={(result, startFresh) => {
            console.log(`Restart test: ${result.testName}, startFresh: ${startFresh}`);
            
            // Parse test number and section from result
            if (result.type === 'Training') {
              const subject = result.category || 'Reading';

              if (startFresh) {
                localStorage.removeItem('test_progress_reading');
                localStorage.removeItem('test_progress_listening_m1');
                localStorage.removeItem('test_progress_listening_m2');
                localStorage.removeItem('test_progress_writing');
                localStorage.removeItem('test_progress_speaking');
              }

              handleTabChange('Training');
              const trainingRoutes: Record<string, string> = {
                Reading: '/specialized-training/reading',
                Listening: '/specialized-training/listening',
                Writing: '/specialized-training/writing',
                Speaking: '/specialized-training/speaking',
                Vocabulary: '/specialized-training/vocabulary'
              };
              navigate(trainingRoutes[subject] || '/specialized-training');
              toast.success(startFresh ? '트레이닝을 처음부터 다시 시작합니다!' : '트레이닝으로 이동합니다!');
              return;
            }

            const tpoMatch = result.testName.match(/TPO\s+(\d+)/i);
            const testMatch = result.testName.match(/Test\s+(\d+)/i);
            const tpoNumber = result.testNumber ?? (tpoMatch ? parseInt(tpoMatch[1]) : testMatch ? parseInt(testMatch[1]) : null);
            
            if (!tpoNumber) {
              console.error('Could not parse test number from:', result.testName);
              toast.error('테스트 번호를 찾을 수 없습니다.');
              return;
            }
            
            const section = result.category || 'Reading';
            const testType = result.type === 'TPO' ? 'tpo' : 'test';
            
            // Clear progress if starting fresh
            if (startFresh) {
              localStorage.removeItem('test_progress_reading');
              localStorage.removeItem('test_progress_listening_m1');
              localStorage.removeItem('test_progress_listening_m2');
              localStorage.removeItem('test_progress_writing');
              localStorage.removeItem('test_progress_speaking');
            }
            
            // Set current test and navigate to the appropriate section
            setCurrentTest({ tpoNumber, section });
            setTestBankType(testType);
            
            // Navigate to the appropriate screen based on section
            if (section === 'Reading') {
              setShowReadingIntro(true);
            } else if (section === 'Listening') {
              setActiveListeningM1Screen('intro');
            } else if (section === 'Writing') {
              setActiveWritingScreen('intro');
            } else if (section === 'Speaking') {
              setActiveSpeakingScreen('intro');
            }
            
            // Switch to Test tab to show the test
            handleTabChange(result.type === 'TPO' ? 'TPO' : 'Test');
            
            toast.success(startFresh ? '처음부터 새로 시작합니다!' : '저장된 위치에서 계속 진행합니다!');
          }}
          onViewDetail={(result) => {
            console.log('Viewing detail:', result);
            // Logic to view detail
          }}
          shareConfig={shareConfig}
          onShareConfigChange={setShareConfig}
          studentName={loggedInUserName || 'Student'}
          advertisements={advertisements}
          isLoggedIn={isLoggedIn}
          onRequestLogin={() => setShowLoginPopup(true)}
          onDeleteResult={(resultId) => {
            setTestResults(prev => prev.filter(r => r.id !== resultId));
            toast.success('기록이 삭제되었습니다.');
          }}
        />
      )}

      {activeTab === 'TOEFL Prep' && (
        <LMSSection
          contents={lmsContents}
          onAddContent={handleAddLMSContent}
          onUpdateContent={handleUpdateLMSContent}
          onDeleteContent={handleDeleteLMSContent}
          tpoTests={[...tpoTests, ...testTests, ...trainingTests]}
          onAddTest={handleAddTest}
          onUpdateTest={handleUpdateTest}
          onDeleteTest={handleDeleteTest}
          vocabularyWords={vocabularyWords}
          vocabularyDays={vocabularyDays}
          onAddWord={handleAddWord}
          onUpdateWord={handleUpdateWord}
          onDeleteWord={handleDeleteWord}
          onAddDay={handleAddDay}
          onUpdateDay={handleUpdateDay}
          onDeleteDay={handleDeleteDay}
          students={students}
          onAddStudent={handleAddStudent}
          onUpdateStudent={handleUpdateStudent}
          onDeleteStudent={handleDeleteStudent}
          vocabularyScores={vocabularyScores}
          onAddVocabularyScore={handleAddVocabularyScore}
          onUpdateVocabularyScore={handleUpdateVocabularyScore}
          onDeleteVocabularyScore={handleDeleteVocabularyScore}
          shareConfig={shareConfig}
          onShareConfigChange={setShareConfig}
        />
      )}

      {/* Bottom Navigation - Mobile */}
      {isMobile && !isInQuestionMode && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
          <div className="grid grid-cols-5 h-16">
            <button
              onClick={() => handleTabChange('TPO')}
              className={`flex flex-col items-center justify-center gap-0.5 transition-all ${
                activeTab === 'TPO' 
                  ? 'text-[#005f61]' 
                  : 'text-gray-500'
              }`}
            >
              <BookOpen className={`w-5 h-5 ${activeTab === 'TPO' ? 'text-[#005f61]' : 'text-gray-500'}`} />
              <span className="text-[10px] font-medium">TPO</span>
            </button>

            <button
              onClick={() => handleTabChange('Test')}
              className={`flex flex-col items-center justify-center gap-0.5 transition-all ${
                activeTab === 'Test' 
                  ? 'text-[#005f61]' 
                  : 'text-gray-500'
              }`}
            >
              <ClipboardCheck className={`w-5 h-5 ${activeTab === 'Test' ? 'text-[#005f61]' : 'text-gray-500'}`} />
              <span className="text-[10px] font-medium">Test</span>
            </button>

            <button
              onClick={() => handleTabChange('Question Types')}
              className={`flex flex-col items-center justify-center gap-0.5 transition-all ${
                activeTab === 'Question Types' 
                  ? 'text-[#005f61]' 
                  : 'text-gray-500'
              }`}
            >
              <LayoutGrid className={`w-5 h-5 ${activeTab === 'Question Types' ? 'text-[#005f61]' : 'text-gray-500'}`} />
              <span className="text-[10px] font-medium">Types</span>
            </button>

            <button
              onClick={() => handleTabChange('Training')}
              className={`flex flex-col items-center justify-center gap-0.5 transition-all ${
                activeTab === 'Training' 
                  ? 'text-[#005f61]' 
                  : 'text-gray-500'
              }`}
            >
              <GraduationCap className={`w-5 h-5 ${activeTab === 'Training' ? 'text-[#005f61]' : 'text-gray-500'}`} />
              <span className="text-[10px] font-medium">Train</span>
            </button>

            <button
              onClick={() => handleTabChange('History')}
              className={`flex flex-col items-center justify-center gap-0.5 transition-all ${
                activeTab === 'History' 
                  ? 'text-[#005f61]' 
                  : 'text-gray-500'
              }`}
            >
              <Clock className={`w-5 h-5 ${activeTab === 'History' ? 'text-[#005f61]' : 'text-gray-500'}`} />
              <span className="text-[10px] font-medium">History</span>
            </button>
          </div>
        </div>
      )}

      {/* Password Modal for TOEFL Prep */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-[#2d5a5d] mb-4">TOEFL Prep 접근</h2>
            <p className="text-gray-600 mb-6">관리자 비밀번호를 입력해주세요.</p>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              placeholder="비밀번호 입력"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d7a7c] mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordInput('');
                }}
                className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                취소
              </Button>
              <Button
                onClick={handlePasswordSubmit}
                className="flex-1 bg-[#2d7a7c] text-white hover:bg-[#1e6b73]"
              >
                확인
              </Button>
            </div>
          </div>
        </div>
      )}

      <Toaster />
    </div>
  );
}

// Wrap AppContent with BrowserRouter
// Force rebuild - cache fix
export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}