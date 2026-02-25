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
import { BookOpen, ClipboardCheck, LayoutGrid, GraduationCap, Clock } from 'lucide-react';
import { Toaster } from './components/ui/sonner';
import { QuestionUploader } from './components/QuestionUploader';
import { TrainingSection } from './components/TrainingSection';
import { QuestionTypesSection } from './components/QuestionTypesSection';
import { LMSSection, LMSContent } from './components/LMSSection';
import { TPOTest } from './components/ContentManagement';
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
import { ListeningM2Q1 } from './components/ListeningM2Q1';
import { ListeningM2Q2 } from './components/ListeningM2Q2';
import { ListeningM2Q3 } from './components/ListeningM2Q3';
import { ListeningM2Q4 } from './components/ListeningM2Q4';
import { ListeningM2Q5 } from './components/ListeningM2Q5';
import { ListeningM2Q6 } from './components/ListeningM2Q6';
import { ListeningM2Q7 } from './components/ListeningM2Q7';
import { ListeningM2Q8 } from './components/ListeningM2Q8';
import { ListeningM2Q9 } from './components/ListeningM2Q9';
import { ListeningM2Q10 } from './components/ListeningM2Q10';
import { ListeningM2Q11 } from './components/ListeningM2Q11';
import { ListeningM2Q12 } from './components/ListeningM2Q12';
import { ListeningM2Q13 } from './components/ListeningM2Q13';
import { ListeningM2Q14 } from './components/ListeningM2Q14';
import { ListeningM2Q15 } from './components/ListeningM2Q15';
import { ListeningM2Q16 } from './components/ListeningM2Q16';
import { ListeningM2Announcement } from './components/ListeningM2Announcement';
import { ListeningM2Lecture } from './components/ListeningM2Lecture';
import { ListeningM2End } from './components/ListeningM2End';
import { ListeningM2Conversation } from './components/ListeningM2Conversation';
import { WritingIntro } from './components/WritingIntro';
import { WritingBuildSentenceIntro } from './components/WritingBuildSentenceIntro';
import { WritingBuildSentenceQ1 } from './components/WritingBuildSentenceQ1';
import { WritingBuildSentenceQ2 } from './components/WritingBuildSentenceQ2';
import { WritingBuildSentenceQ3 } from './components/WritingBuildSentenceQ3';
import { WritingBuildSentenceQ4 } from './components/WritingBuildSentenceQ4';
import { WritingBuildSentenceQ5 } from './components/WritingBuildSentenceQ5';
import { WritingBuildSentenceQ6 } from './components/WritingBuildSentenceQ6';
import { WritingBuildSentenceQ7 } from './components/WritingBuildSentenceQ7';
import { WritingBuildSentenceQ8 } from './components/WritingBuildSentenceQ8';
import { WritingBuildSentenceQ9 } from './components/WritingBuildSentenceQ9';
import { WritingBuildSentenceQ10 } from './components/WritingBuildSentenceQ10';
import { WritingEmailIntro } from './components/WritingEmailIntro';
import { WritingEmailQ1 } from './components/WritingEmailQ1';
import { WritingAcademicDiscussionIntro } from './components/WritingAcademicDiscussionIntro';
import { WritingAcademicDiscussionQ2 } from './components/WritingAcademicDiscussionQ2';
import { WritingEnd } from './components/WritingEnd';
import { SpeakingIntro } from './components/SpeakingIntro';
import { SpeakingListenRepeatIntro } from './components/SpeakingListenRepeatIntro';
import { SpeakingQ1 } from './components/SpeakingQ1';
import { SpeakingQ2Prep } from './components/SpeakingQ2Prep';
import { SpeakingQ2Record } from './components/SpeakingQ2Record';
import { SpeakingQ3Prep } from './components/SpeakingQ3Prep';
import { SpeakingQ3Record } from './components/SpeakingQ3Record';
import { SpeakingQ4Prep } from './components/SpeakingQ4Prep';
import { SpeakingQ4Record } from './components/SpeakingQ4Record';
import { SpeakingQ5Prep } from './components/SpeakingQ5Prep';
import { SpeakingQ5Record } from './components/SpeakingQ5Record';
import { SpeakingQ6Prep } from './components/SpeakingQ6Prep';
import { SpeakingQ6Record } from './components/SpeakingQ6Record';
import { SpeakingQ7Prep } from './components/SpeakingQ7Prep';
import { SpeakingQ7Record } from './components/SpeakingQ7Record';
import { SpeakingTakeInterviewIntro } from './components/SpeakingTakeInterviewIntro';
import { SpeakingInterviewIntro } from './components/SpeakingInterviewIntro';
import { SpeakingQ8Prep } from './components/SpeakingQ8Prep';
import { SpeakingQ8Record } from './components/SpeakingQ8Record';
import { SpeakingQ9Prep } from './components/SpeakingQ9Prep';
import { SpeakingQ9Record } from './components/SpeakingQ9Record';
import { SpeakingQ10Prep } from './components/SpeakingQ10Prep';
import { SpeakingQ10Record } from './components/SpeakingQ10Record';
import { SpeakingQ11Prep } from './components/SpeakingQ11Prep';
import { SpeakingQ11Record } from './components/SpeakingQ11Record';
import { TPOCard } from './components/TPOCard';
import { TestCard } from './components/TestCard';
import { LandingPage } from './components/LandingPage';
import { LoginForm } from './components/LoginForm';
import { RegistrationForm } from './components/RegistrationForm';
import { LoginPopup } from './components/LoginPopup';
import { WelcomeLandingPage } from './components/WelcomeLandingPage';
import { HistorySection, TestResult } from './components/HistorySection';
import { ShareConfig } from './components/ShareSettings';
import { isContentLocked } from './utils/subscriptionUtils';
import { projectId, publicAnonKey } from './utils/supabase/info';

type TabType = 'Question Types' | 'TPO' | 'Test' | 'History' | 'Training' | 'TOEFL Prep';
type SkillType = 'Listening' | 'Reading' | 'Writing' | 'Speaking' | 'Vocabulary';
type TPORange = 'TPO 75-66' | 'TPO 65-56' | 'TPO 55-46' | 'TPO 45-36' | 'TPO 35-26' | 'TPO 25-16' | 'TPO 15-6' | 'TPO 5-1';
type TestSetRange = '1-4' | '5-8' | '9-12' | '13-16' | '17-20';
type TestBankType = 'tpo' | 'real';

function AppContent() {
  // React Router hooks
  const location = useLocation();
  const navigate = useNavigate();
  
  // Volume control
  const { isOpen: isVolumeOpen, buttonRef: volumeButtonRef, toggleVolume, closeVolume } = useVolumeControl();
  
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
  const [activeTPORange, setActiveTPORange] = useState<TPORange>('TPO 75-66');
  const [activeTestSetRange, setActiveTestSetRange] = useState<TestSetRange>('1-4');
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
    if (!isLoggedIn && protectedTabs.includes(activeTab)) {
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
  const [blankAnswers, setBlankAnswers] = useState<{ [key: number]: string }>({});
  
  // Listening section states
  const [showReadingIntro, setShowReadingIntro] = useState(false);
  const [showListeningIntro, setShowListeningIntro] = useState(false);
  const [showListeningModule1Intro, setShowListeningModule1Intro] = useState(false);
  const [showListeningQuestion1, setShowListeningQuestion1] = useState(false);
  const [showListeningQuestion2, setShowListeningQuestion2] = useState(false);
  const [showListeningQuestion3, setShowListeningQuestion3] = useState(false);
  const [showListeningQuestion4, setShowListeningQuestion4] = useState(false);
  const [showListeningQuestion5, setShowListeningQuestion5] = useState(false);
  const [showListeningQuestion6, setShowListeningQuestion6] = useState(false);
  const [showListeningQuestion7, setShowListeningQuestion7] = useState(false);
  const [showListeningQuestion8, setShowListeningQuestion8] = useState(false);
  const [showListeningModule2Intro, setShowListeningModule2Intro] = useState(false);
  const [showListeningConversation, setShowListeningConversation] = useState(false);
  const [showListeningQuestion9, setShowListeningQuestion9] = useState(false);
  const [showListeningQuestion10, setShowListeningQuestion10] = useState(false);
  const [showListeningConversation2, setShowListeningConversation2] = useState(false);
  const [showListeningQuestion11, setShowListeningQuestion11] = useState(false);
  const [showListeningQuestion12, setShowListeningQuestion12] = useState(false);
  const [showListeningAnnouncement, setShowListeningAnnouncement] = useState(false);
  const [showListeningQuestion13, setShowListeningQuestion13] = useState(false);
  const [showListeningQuestion14, setShowListeningQuestion14] = useState(false);
  const [showListeningPodcast, setShowListeningPodcast] = useState(false);
  const [showListeningQuestion15, setShowListeningQuestion15] = useState(false);
  const [showListeningQuestion16, setShowListeningQuestion16] = useState(false);
  const [showListeningQuestion17, setShowListeningQuestion17] = useState(false);
  const [showListeningQuestion18, setShowListeningQuestion18] = useState(false);
  const [showListeningEndModule1, setShowListeningEndModule1] = useState(false);
  const [showListeningModule2, setShowListeningModule2] = useState(false);
  const [showListeningM2Q1, setShowListeningM2Q1] = useState(false);
  const [showListeningM2Q2, setShowListeningM2Q2] = useState(false);
  const [showListeningM2Q3, setShowListeningM2Q3] = useState(false);
  const [showListeningM2Q4, setShowListeningM2Q4] = useState(false);
  const [showListeningM2Q5, setShowListeningM2Q5] = useState(false);
  const [showListeningM2Q6, setShowListeningM2Q6] = useState(false);
  const [showListeningM2Q7, setShowListeningM2Q7] = useState(false);
  const [showListeningM2Q8, setShowListeningM2Q8] = useState(false);
  const [showListeningM2Q9, setShowListeningM2Q9] = useState(false);
  const [showListeningM2Q10, setShowListeningM2Q10] = useState(false);
  const [showListeningM2Q11, setShowListeningM2Q11] = useState(false);
  const [showListeningM2Q12, setShowListeningM2Q12] = useState(false);
  const [showListeningM2Q13, setShowListeningM2Q13] = useState(false);
  const [showListeningM2Q14, setShowListeningM2Q14] = useState(false);
  const [showListeningM2Q15, setShowListeningM2Q15] = useState(false);
  const [showListeningM2Q16, setShowListeningM2Q16] = useState(false);
  const [showListeningM2Announcement, setShowListeningM2Announcement] = useState(false);
  const [showListeningM2Lecture, setShowListeningM2Lecture] = useState(false);
  const [showListeningM2End, setShowListeningM2End] = useState(false);
  const [showListeningM2Conversation, setShowListeningM2Conversation] = useState(false);
  const [showVolumeModal, setShowVolumeModal] = useState(false);
  const [volume, setVolume] = useState(75);
  
  // Writing section states
  const [showWritingIntro, setShowWritingIntro] = useState(false);
  const [showWritingBuildSentenceIntro, setShowWritingBuildSentenceIntro] = useState(false);
  const [showWritingBuildSentenceQ1, setShowWritingBuildSentenceQ1] = useState(false);
  const [showWritingBuildSentenceQ2, setShowWritingBuildSentenceQ2] = useState(false);
  const [showWritingBuildSentenceQ3, setShowWritingBuildSentenceQ3] = useState(false);
  const [showWritingBuildSentenceQ4, setShowWritingBuildSentenceQ4] = useState(false);
  const [showWritingBuildSentenceQ5, setShowWritingBuildSentenceQ5] = useState(false);
  const [showWritingBuildSentenceQ6, setShowWritingBuildSentenceQ6] = useState(false);
  const [showWritingBuildSentenceQ7, setShowWritingBuildSentenceQ7] = useState(false);
  const [showWritingBuildSentenceQ8, setShowWritingBuildSentenceQ8] = useState(false);
  const [showWritingBuildSentenceQ9, setShowWritingBuildSentenceQ9] = useState(false);
  const [showWritingBuildSentenceQ10, setShowWritingBuildSentenceQ10] = useState(false);
  const [showWritingEmailIntro, setShowWritingEmailIntro] = useState(false);
  const [showWritingEmailQ1, setShowWritingEmailQ1] = useState(false);
  const [showWritingAcademicDiscussionIntro, setShowWritingAcademicDiscussionIntro] = useState(false);
  const [showWritingAcademicDiscussionQ2, setShowWritingAcademicDiscussionQ2] = useState(false);
  const [showWritingEnd, setShowWritingEnd] = useState(false);
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
  
  // Speaking section states
  const [showSpeakingIntro, setShowSpeakingIntro] = useState(false);
  const [showSpeakingListenRepeatIntro, setShowSpeakingListenRepeatIntro] = useState(false);
  const [showSpeakingQ1, setShowSpeakingQ1] = useState(false);
  const [showSpeakingQ2Prep, setShowSpeakingQ2Prep] = useState(false);
  const [showSpeakingQ2Record, setShowSpeakingQ2Record] = useState(false);
  const [showSpeakingQ3Prep, setShowSpeakingQ3Prep] = useState(false);
  const [showSpeakingQ3Record, setShowSpeakingQ3Record] = useState(false);
  const [showSpeakingQ4Prep, setShowSpeakingQ4Prep] = useState(false);
  const [showSpeakingQ4Record, setShowSpeakingQ4Record] = useState(false);
  const [showSpeakingQ5Prep, setShowSpeakingQ5Prep] = useState(false);
  const [showSpeakingQ5Record, setShowSpeakingQ5Record] = useState(false);
  const [showSpeakingQ6Prep, setShowSpeakingQ6Prep] = useState(false);
  const [showSpeakingQ6Record, setShowSpeakingQ6Record] = useState(false);
  const [showSpeakingQ7Prep, setShowSpeakingQ7Prep] = useState(false);
  const [showSpeakingQ7Record, setShowSpeakingQ7Record] = useState(false);
  const [showSpeakingTakeInterviewIntro, setShowSpeakingTakeInterviewIntro] = useState(false);
  const [showSpeakingInterviewIntro, setShowSpeakingInterviewIntro] = useState(false);
  const [showSpeakingQ8Prep, setShowSpeakingQ8Prep] = useState(false);
  const [showSpeakingQ8Record, setShowSpeakingQ8Record] = useState(false);
  const [showSpeakingQ9Prep, setShowSpeakingQ9Prep] = useState(false);
  const [showSpeakingQ9Record, setShowSpeakingQ9Record] = useState(false);
  const [showSpeakingQ10Prep, setShowSpeakingQ10Prep] = useState(false);
  const [showSpeakingQ10Record, setShowSpeakingQ10Record] = useState(false);
  const [showSpeakingQ11Prep, setShowSpeakingQ11Prep] = useState(false);
  const [showSpeakingQ11Record, setShowSpeakingQ11Record] = useState(false);
  
  // LMS Content State
  const [lmsContents, setLmsContents] = useState<LMSContent[]>([]);
  const [tpoTests, setTpoTests] = useState<TPOTest[]>([]);
  const [testTests, setTestTests] = useState<TPOTest[]>([]); // Separate state for Test page
  const [reports, setReports] = useState<TestResult[]>([]); // Reports state
  
  // Advertisement State
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  
  // TOEFL Prep Password Protection
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isPasswordCorrect, setIsPasswordCorrect] = useState(false);
  const TOEFL_PREP_PASSWORD = 'sw21qa00';
  
  // Advertisements are loaded in the main loadDataFromSupabase useEffect below
  
  // Loading state for Supabase data
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // Mobile detection state
  const [isMobile, setIsMobile] = useState(false);
  
  // Share Configuration State
  const [shareConfig, setShareConfig] = useState<ShareConfig>({
    enabled: false,
    wechatEnabled: false,
    smsEnabled: false,
    autoSend: false
  });
  
  // Test Results History State - with sample data for testing
  const [testResults, setTestResults] = useState<TestResult[]>([
    {
      id: '1',
      type: 'TPO',
      category: 'Reading',
      testName: 'TPO 75 - Reading',
      date: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
      score: 85,
      totalQuestions: 10,
      correctAnswers: 8,
      wrongAnswers: [
        {
          questionId: 'q3',
          questionText: 'What is the main idea of paragraph 3?',
          userAnswer: 'B',
          correctAnswer: 'C',
          explanation: 'Paragraph 3 focuses on the historical context...'
        },
        {
          questionId: 'q7',
          questionText: 'According to the passage, which of the following is true?',
          userAnswer: 'A',
          correctAnswer: 'D',
          explanation: 'The passage states that...'
        }
      ],
      timeSpent: 1200
    },
    {
      id: '2',
      type: 'Training',
      category: 'Reading',
      testName: 'Fill in the Blanks',
      date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      score: 70,
      totalQuestions: 10,
      correctAnswers: 7,
      wrongAnswers: [
        {
          questionId: 'q2',
          questionText: 'Choose the correct word to fill the blank.',
          userAnswer: 'however',
          correctAnswer: 'therefore',
          explanation: 'The context requires a cause-effect transition.'
        },
        {
          questionId: 'q5',
          questionText: 'Select the appropriate transition word.',
          userAnswer: 'moreover',
          correctAnswer: 'nevertheless',
          explanation: 'This sentence shows contrast, not addition.'
        },
        {
          questionId: 'q9',
          questionText: 'Fill in the blank with the best word.',
          userAnswer: 'increase',
          correctAnswer: 'decrease',
          explanation: 'The passage indicates a reduction.'
        }
      ],
      timeSpent: 600
    },
    {
      id: '3',
      type: 'Vocabulary',
      category: 'Vocabulary',
      testName: 'DAY 1 단어 테스트',
      date: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
      score: 95,
      totalQuestions: 40,
      correctAnswers: 38,
      wrongAnswers: [
        {
          questionId: 'q12',
          questionText: 'ambiguous',
          userAnswer: 'clear',
          correctAnswer: '모호한',
          explanation: ''
        },
        {
          questionId: 'q28',
          questionText: 'arbitrary',
          userAnswer: '필수적인',
          correctAnswer: '임의적인',
          explanation: ''
        }
      ],
      timeSpent: 480
    }
  ]);
  
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

  // Load students from localStorage on mount and listen for changes
  useEffect(() => {
    const loadStudents = () => {
      const cmsStudents = JSON.parse(localStorage.getItem('cms_students') || '[]');
      setStudents(cmsStudents);
    };

    // Initial load
    loadStudents();

    // Listen for storage changes (from registration form in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cms_students') {
        loadStudents();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Save students to localStorage whenever they change (but don't dispatch event to avoid loop)
  useEffect(() => {
    if (students.length > 0) {
      localStorage.setItem('cms_students', JSON.stringify(students));
    }
  }, [students]);

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
    
    // Login check for protected tabs
    const protectedTabs: TabType[] = ['TPO', 'Test', 'Question Types', 'Training', 'History'];
    if (!isLoggedIn && protectedTabs.includes(tab)) {
      setShowLoginPopup(true);
      return;
    }
    
    setActiveTab(tab);
    const tabRoutes: Record<TabType, string> = {
      'TPO': '/tpo-tests',
      'Test': '/test',
      'Question Types': '/question-types',
      'Training': '/specialized-training',
      'History': '/history',
      'TOEFL Prep': '/admin'
    };
    navigate(tabRoutes[tab]);
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
  
  // Load data from Supabase on mount
  useEffect(() => {
    const loadDataFromSupabase = async () => {
      try {
        setIsLoadingData(true);
        
        const headers = { 'Authorization': `Bearer ${publicAnonKey}` };
        const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-e46cd33a`;
        
        // Use Promise.allSettled so one failure doesn't block others
        const [lmsResult, tpoResult, testResult, adsResult, reportsResult] = await Promise.allSettled([
          fetch(`${baseUrl}/lms-contents`, { headers }),
          fetch(`${baseUrl}/tpo-tests`, { headers }),
          fetch(`${baseUrl}/test-tests`, { headers }),
          fetch(`${baseUrl}/advertisements`, { headers }),
          fetch(`${baseUrl}/reports`, { headers }),
        ]);
        
        // Load LMS Contents
        if (lmsResult.status === 'fulfilled' && lmsResult.value.ok) {
          try {
            const lmsData = await lmsResult.value.json();
            if (lmsData && Array.isArray(lmsData)) {
              setLmsContents(lmsData);
              console.log('✅ Loaded LMS contents from Supabase:', lmsData.length);
            }
          } catch (e) { console.error('❌ Error parsing LMS data:', e); }
        } else {
          console.warn('⚠️ Failed to fetch LMS contents');
        }
        
        // Load TPO Tests
        if (tpoResult.status === 'fulfilled' && tpoResult.value.ok) {
          try {
            const tpoData = await tpoResult.value.json();
            if (tpoData && Array.isArray(tpoData)) {
              setTpoTests(tpoData);
              console.log('✅ Loaded TPO tests from Supabase:', tpoData.length);
            }
          } catch (e) { console.error('❌ Error parsing TPO data:', e); }
        } else {
          console.warn('⚠️ Failed to fetch TPO tests');
        }
        
        // Load Test Tests
        if (testResult.status === 'fulfilled' && testResult.value.ok) {
          try {
            const testData = await testResult.value.json();
            if (testData && Array.isArray(testData)) {
              setTestTests(testData);
              console.log('✅ Loaded Test tests from Supabase:', testData.length);
            }
          } catch (e) { console.error('❌ Error parsing Test data:', e); }
        } else {
          console.warn('⚠️ Failed to fetch Test tests');
        }
        
        // Load Advertisements
        if (adsResult.status === 'fulfilled' && adsResult.value.ok) {
          try {
            const adsData = await adsResult.value.json();
            if (adsData && Array.isArray(adsData)) {
              setAdvertisements(adsData);
              console.log('✅ Loaded Advertisements from Supabase:', adsData.length);
            }
          } catch (e) { console.error('❌ Error parsing Ads data:', e); }
        } else {
          console.warn('⚠️ Failed to fetch Advertisements');
        }
        
        // Load Reports
        if (reportsResult.status === 'fulfilled' && reportsResult.value.ok) {
          try {
            const reportsData = await reportsResult.value.json();
            if (reportsData && Array.isArray(reportsData)) {
              setReports(reportsData);
              console.log('✅ Loaded Reports from Supabase:', reportsData.length);
            }
          } catch (e) { console.error('❌ Error parsing Reports data:', e); }
        } else {
          console.warn('⚠️ Failed to fetch Reports');
        }
        
      } catch (error) {
        console.error('❌ Error loading data from Supabase:', error);
      } finally {
        setIsLoadingData(false);
      }
    };
    
    loadDataFromSupabase();
  }, []);

  // Save LMS contents to Supabase whenever they change
  useEffect(() => {
    if (isLoadingData) return; // Don't save during initial load
    
    const saveToSupabase = async () => {
      try {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-e46cd33a/lms-contents`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(lmsContents)
          }
        );
        console.log('💾 Saved LMS contents to Supabase');
      } catch (error) {
        console.error('❌ Error saving LMS contents:', error);
      }
    };
    
    saveToSupabase();
  }, [lmsContents, isLoadingData]);

  // Save TPO tests to Supabase whenever they change
  useEffect(() => {
    if (isLoadingData) return;
    
    const saveToSupabase = async () => {
      try {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-e46cd33a/tpo-tests`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(tpoTests)
          }
        );
        console.log('💾 Saved TPO tests to Supabase');
      } catch (error) {
        console.error('❌ Error saving TPO tests:', error);
      }
    };
    
    saveToSupabase();
  }, [tpoTests, isLoadingData]);

  // Save Test tests to Supabase whenever they change
  useEffect(() => {
    if (isLoadingData) return;
    
    const saveToSupabase = async () => {
      try {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-e46cd33a/test-tests`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(testTests)
          }
        );
        console.log('💾 Saved Test tests to Supabase');
      } catch (error) {
        console.error('❌ Error saving Test tests:', error);
      }
    };
    
    saveToSupabase();
  }, [testTests, isLoadingData]);

  // Save Reports to Supabase whenever they change
  useEffect(() => {
    if (isLoadingData) return;
    
    const saveToSupabase = async () => {
      try {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-e46cd33a/reports`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(reports)
          }
        );
        console.log('💾 Saved Reports to Supabase');
      } catch (error) {
        console.error('❌ Error saving Reports:', error);
      }
    };
    
    saveToSupabase();
  }, [reports, isLoadingData]);

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

  // TPO Test Handlers
  const handleAddTest = (test: TPOTest) => {
    if (test.testType === 'Test') {
      setTestTests([...testTests, test]);
    } else {
      setTpoTests([...tpoTests, test]);
    }
  };

  const handleUpdateTest = (updatedTest: TPOTest) => {
    if (updatedTest.testType === 'Test') {
      setTestTests(testTests.map(t => t.id === updatedTest.id ? updatedTest : t));
    } else {
      setTpoTests(tpoTests.map(t => t.id === updatedTest.id ? updatedTest : t));
    }
  };

  const handleDeleteTest = (id: string) => {
    // Try to delete from both arrays (one will match)
    setTpoTests(tpoTests.filter(t => t.id !== id));
    setTestTests(testTests.filter(t => t.id !== id));
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
      ...result
    };
    setTestResults([newResult, ...testResults]); // Add to beginning for latest first
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
  const tpoRanges: TPORange[] = ['TPO 75-66', 'TPO 65-56', 'TPO 55-46', 'TPO 45-36', 'TPO 35-26', 'TPO 25-16', 'TPO 15-6', 'TPO 5-1'];

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

    const handleAnswerSelect2 = (answer: string) => {
      setSelectedAnswer2(answer);
    };

    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
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
            <button className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowReadNoticeTest2(false);
                setShowReadNoticeTest(true);
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
                setShowReadNoticeTest2(false);
                setShowSocialMediaTest(true);
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
                Question 12 of 20
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-hidden bg-white border border-black">
          <h1 className="text-3xl font-['Inter',_sans-serif] font-bold text-black py-8 text-center">Read a notice.</h1>
          
          <ResizableReadingLayout
            leftContent={
              <div className="border-[3px] border-black p-6 ml-12">
                <div className="border-2 border-black p-6">
                  <h2 className="text-2xl font-['Inter',_sans-serif] font-bold text-black text-center mb-6">Municipal Charter</h2>
                  <p className="text-center font-['Inter',_sans-serif] font-bold text-black mb-6">Sign up for paperless billing statements today.</p>
                  
                  <p className="font-['Inter',_sans-serif] leading-relaxed text-black">
                  Safe, convenient, easy. Enroll in paperless billing to receive monthly savings account statements in an electronic PDF document. Access your Municipal Charter account through the mobile app and select account preferences in the upper right-hand corner to enroll.
                  </p>
                </div>
              </div>
            }
            rightContent={
              <>
                <h3 className="text-2xl font-['Inter',_sans-serif] font-bold text-black mb-10">How can customers enroll in paperless billing?</h3>
                
                <div className="space-y-6">
                  {answerOptions2.map((option, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <input
                          type="radio"
                          id={`option2-${index}`}
                          name="business-type-2"
                          value={option}
                          checked={selectedAnswer2 === option}
                          onChange={() => handleAnswerSelect2(option)}
                          className={`w-5 h-5 mt-0.5 appearance-none rounded-full cursor-pointer border-[2px] ${
                            selectedAnswer2 === option
                              ? 'border-[#0d9488]'
                              : 'border-black'
                          }`}
                        />
                        {selectedAnswer2 === option && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] bg-[#0d9488] rounded-full pointer-events-none"></div>
                        )}
                      </div>
                      <label htmlFor={`option2-${index}`} className="font-['Inter',_sans-serif] text-black cursor-pointer leading-relaxed text-lg">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </>
            }
          />
        </div>
      </div>
    );
  };

  // Read Social Media Test Screen Component (Question 13)
  const ReadSocialMediaTestScreen = () => {
    const correctAnswer3 = "To describe the variety of products available at the farmer's market";
    const answerOptions3 = [
      "To explain the benefits of organic farming",
      "To describe the variety of products available at the farmer's market",
      "To compare different farmer's markets in the area",
      "To offer advice on starting a stall at the farmer's market"
    ];

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
            <button className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
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
          <div className="px-8 py-3">
            <div className="flex gap-8">
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
        <div className="flex-1 overflow-hidden bg-white border border-black">
          <h1 className="text-3xl font-['Inter',_sans-serif] font-bold text-black py-8 text-center">Read a social media post.</h1>
          
          <ResizableReadingLayout
            leftContent={
              <div className="flex-shrink-0 relative" style={{ width: '580px', height: '680px', marginLeft: '-15px' }}>
                {/* Outer gray border */}
                <div className="absolute inset-0 bg-[#B3B3B3] border border-black rounded-xl">
                  {/* Inner white container */}
                  <div className="absolute left-4 top-4 right-4 bottom-4 bg-white border border-black rounded-lg">
                    {/* Header */}
                    <div className="bg-[#0A5E63] h-11 rounded-t-lg flex items-center px-4 relative justify-between">
                      {/* Left side - Camera icon */}
                      <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="white">
                        <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
                        <circle cx="12" cy="12" r="3" fill="white"/>
                      </svg>
                      
                      {/* Center - Search bar */}
                      <div className="flex-1 mx-4 h-7 bg-[#004D4F] rounded-full flex items-center px-3">
                        <div className="flex-1"></div>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                          <circle cx="11" cy="11" r="8"/>
                          <path d="M21 21l-4.35-4.35"/>
                        </svg>
                      </div>
                      
                      {/* Right side - Message icon */}
                      <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="white">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                      </svg>
                    </div>

                    {/* Content */}
                    <div className="flex flex-col" style={{ height: 'calc(100% - 44px)' }}>
                      <div className="p-5">
                        {/* Profile */}
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-10 h-10 rounded-full bg-[#F4A261] flex items-center justify-center overflow-hidden">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white">
                              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                            </svg>
                          </div>
                          <span className="font-['Inter',_sans-serif] font-bold">Sofia Baker</span>
                        </div>

                        {/* Post content */}
                        <div className="space-y-3 font-['Inter',_sans-serif] font-normal leading-relaxed">
                          <p>
                            Every Saturday, our local farmer's market is the place to be! Fresh fruits, veggies, homemade goodies, and unique crafts await you. The Thompson family's organic produce is a must-try, known for its quality and cordial service. Their stall is always bustling with customers eager to buy fresh, pesticide-free vegetables from the welcoming staff.
                          </p>
                          <p>
                            Don't miss the bakery stall—get there early for the best bread and pastries, including gluten-free and vegan options. The smell of freshly baked goods fills the air, and these treats sell out fast!
                          </p>
                          <p>
                            In addition to food, the market sells handmade crafts like jewelry, pottery, and textiles. These unique items make perfect gifts and support local artisans. Plus, enjoy live music while you shop. Talented local musicians help create a vibrant atmosphere, and the community spirit makes it a delightful experience for all. See you there!
                          </p>
                        </div>
                      </div>

                      {/* Like and Comment section */}
                      <div className="border-t border-gray-300 p-4 mt-auto">
                        <div className="flex items-center gap-6 text-gray-600 justify-end">
                          <button className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                            </svg>
                            <span className="font-['Inter',_sans-serif] font-medium">Like</span>
                          </button>
                          <button className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            <span className="font-['Inter',_sans-serif] font-medium">Comment</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Decorative borders */}
                <div className="absolute" style={{ left: '1px', top: '1px', width: '580px', height: '680px', border: '2px solid black', borderRadius: '12px', pointerEvents: 'none' }}></div>
                
                {/* Corner dots */}
                <div className="absolute w-3 h-3 bg-black rounded-full" style={{ left: '285px', top: '11px' }}></div>
                <div className="absolute w-3 h-3 bg-black rounded-full" style={{ left: '285px', bottom: '9px' }}></div>
              </div>
            }
            rightContent={
              <>
                <h3 className="text-lg font-['Inter',_sans-serif] font-bold text-black mb-10">What is the main purpose of the post?</h3>
                
                <div className="space-y-6">
                  {answerOptions3.map((option, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <input
                          type="radio"
                          id={`option3-${index}`}
                          name="social-media-purpose"
                          value={option}
                          checked={selectedAnswer3 === option}
                          onChange={() => handleAnswerSelect3(option)}
                          className={`w-5 h-5 mt-0.5 appearance-none rounded-full cursor-pointer border-[2px] ${
                            selectedAnswer3 === option
                              ? 'border-[#0d9488]'
                              : 'border-black'
                          }`}
                        />
                        {selectedAnswer3 === option && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] bg-[#0d9488] rounded-full pointer-events-none"></div>
                        )}
                      </div>
                      <label htmlFor={`option3-${index}`} className="font-['Inter',_sans-serif] text-black cursor-pointer leading-relaxed text-lg">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </>
            }
          />
        </div>
      </div>
    );
  };

  // Read Social Media Test Screen Component (Question 14)
  const ReadSocialMediaTest2Screen = () => {
    const correctAnswer4 = "They provide friendly service and excellent products.";
    const answerOptions4 = [
      "They offer cooking tips and recipes.",
      "They offer the lowest prices at the market.",
      "They provide friendly service and excellent products.",
      "They have a beautiful and well-decorated stall."
    ];

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
            <button className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
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
          <div className="px-8 py-3">
            <div className="flex gap-8">
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
        <div className="flex-1 overflow-hidden bg-white border border-black">
          <h1 className="text-3xl font-['Inter',_sans-serif] font-bold text-black py-8 text-center">Read a social media post.</h1>
          
          <ResizableReadingLayout
            leftContent={
              <div className="flex-shrink-0 relative" style={{ width: '580px', height: '680px', marginLeft: '-15px' }}>
                {/* Outer gray border */}
                <div className="absolute inset-0 bg-[#B3B3B3] border border-black rounded-xl">
                  {/* Inner white container */}
                  <div className="absolute left-4 top-4 right-4 bottom-4 bg-white border border-black rounded-lg">
                    {/* Header */}
                    <div className="bg-[#0A5E63] h-11 rounded-t-lg flex items-center px-4 relative justify-between">
                      {/* Left side - Camera icon */}
                      <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="white">
                        <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
                        <circle cx="12" cy="12" r="3" fill="white"/>
                      </svg>
                      
                      {/* Center - Search bar */}
                      <div className="flex-1 mx-4 h-7 bg-[#004D4F] rounded-full flex items-center px-3">
                        <div className="flex-1"></div>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                          <circle cx="11" cy="11" r="8"/>
                          <path d="M21 21l-4.35-4.35"/>
                        </svg>
                      </div>
                      
                      {/* Right side - Message icon */}
                      <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="white">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                      </svg>
                    </div>

                    {/* Content */}
                    <div className="flex flex-col" style={{ height: 'calc(100% - 44px)' }}>
                      <div className="p-5">
                        {/* Profile */}
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-10 h-10 rounded-full bg-[#F4A261] flex items-center justify-center overflow-hidden">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white">
                              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                            </svg>
                          </div>
                          <span className="font-['Inter',_sans-serif] font-bold">Sofia Baker</span>
                        </div>

                        {/* Post content */}
                        <div className="space-y-3 font-['Inter',_sans-serif] font-normal leading-relaxed">
                          <p>
                            Every Saturday, our local farmer's market is the place to be! Fresh fruits, veggies, homemade goodies, and unique crafts await you. The Thompson family's organic produce is a must-try, known for its quality and cordial service. Their stall is always bustling with customers eager to buy fresh, pesticide-free vegetables from the welcoming staff.
                          </p>
                          <p>
                            Don't miss the bakery stall—get there early for the best bread and pastries, including gluten-free and vegan options. The smell of freshly baked goods fills the air, and these treats sell out fast!
                          </p>
                          <p>
                            In addition to food, the market sells handmade crafts like jewelry, pottery, and textiles. These unique items make perfect gifts and support local artisans. Plus, enjoy live music while you shop. Talented local musicians help create a vibrant atmosphere, and the community spirit makes it a delightful experience for all. See you there!
                          </p>
                        </div>
                      </div>

                      {/* Like and Comment section */}
                      <div className="border-t border-gray-300 p-4 mt-auto">
                        <div className="flex items-center gap-6 text-gray-600 justify-end">
                          <button className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                            </svg>
                            <span className="font-['Inter',_sans-serif] font-medium">Like</span>
                          </button>
                          <button className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            <span className="font-['Inter',_sans-serif] font-medium">Comment</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Decorative borders */}
                <div className="absolute" style={{ left: '1px', top: '1px', width: '580px', height: '680px', border: '2px solid black', borderRadius: '12px', pointerEvents: 'none' }}></div>
                
                {/* Corner dots */}
                <div className="absolute w-3 h-3 bg-black rounded-full" style={{ left: '285px', top: '11px' }}></div>
                <div className="absolute w-3 h-3 bg-black rounded-full" style={{ left: '285px', bottom: '9px' }}></div>
              </div>
            }
            rightContent={
              <>
                <h3 className="text-lg font-['Inter',_sans-serif] font-bold text-black mb-10">What reason is given for the popularity of the Thompson family's stall?</h3>
                
                <div className="space-y-6">
                  {answerOptions4.map((option, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <input
                          type="radio"
                          id={`option4-${index}`}
                          name="thompson-popularity"
                          value={option}
                          checked={selectedAnswer4 === option}
                          onChange={() => handleAnswerSelect4(option)}
                          className={`w-5 h-5 mt-0.5 appearance-none rounded-full cursor-pointer border-[2px] ${
                            selectedAnswer4 === option
                              ? 'border-[#0d9488]'
                              : 'border-black'
                          }`}
                        />
                        {selectedAnswer4 === option && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] bg-[#0d9488] rounded-full pointer-events-none"></div>
                        )}
                      </div>
                      <label htmlFor={`option4-${index}`} className="font-['Inter',_sans-serif] text-black cursor-pointer leading-relaxed text-lg">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </>
            }
          />
        </div>
      </div>
    );
  };

  // Read Social Media Test Screen Component (Question 15)
  const ReadSocialMediaTest3Screen = () => {
    const correctAnswer5 = "To get freshly baked bread and pastries before they are gone";
    const answerOptions5 = [
      "To get the free samples given in mornings",
      "To get freshly baked bread and pastries before they are gone",
      "To meet the famous baker",
      "To take advantage of early morning discounts"
    ];

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
            <button className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
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
          <div className="px-8 py-3">
            <div className="flex gap-8">
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
        <div className="flex-1 overflow-hidden bg-white border border-black">
          <h1 className="text-3xl font-['Inter',_sans-serif] font-bold text-black py-8 text-center">Read a social media post.</h1>
          
          <ResizableReadingLayout
            leftContent={
              <div className="flex-shrink-0 relative" style={{ width: '580px', height: '680px', marginLeft: '-15px' }}>
                {/* Outer gray border */}
                <div className="absolute inset-0 bg-[#B3B3B3] border border-black rounded-xl">
                  {/* Inner white container */}
                  <div className="absolute left-4 top-4 right-4 bottom-4 bg-white border border-black rounded-lg">
                    {/* Header */}
                    <div className="bg-[#0A5E63] h-11 rounded-t-lg flex items-center px-4 relative justify-between">
                      {/* Left side - Camera icon */}
                      <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="white">
                        <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
                        <circle cx="12" cy="12" r="3" fill="white"/>
                      </svg>
                      
                      {/* Center - Search bar */}
                      <div className="flex-1 mx-4 h-7 bg-[#004D4F] rounded-full flex items-center px-3">
                        <div className="flex-1"></div>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                          <circle cx="11" cy="11" r="8"/>
                          <path d="M21 21l-4.35-4.35"/>
                        </svg>
                      </div>
                      
                      {/* Right side - Message icon */}
                      <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="white">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                      </svg>
                    </div>

                    {/* Content */}
                    <div className="flex flex-col" style={{ height: 'calc(100% - 44px)' }}>
                      <div className="p-5">
                        {/* Profile */}
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-10 h-10 rounded-full bg-[#F4A261] flex items-center justify-center overflow-hidden">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white">
                              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                            </svg>
                          </div>
                          <span className="font-['Inter',_sans-serif] font-bold">Sofia Baker</span>
                        </div>

                        {/* Post content */}
                        <div className="space-y-3 font-['Inter',_sans-serif] font-normal leading-relaxed">
                          <p>
                            Every Saturday, our local farmer's market is the place to be! Fresh fruits, veggies, homemade goodies, and unique crafts await you. The Thompson family's organic produce is a must-try, known for its quality and cordial service. Their stall is always bustling with customers eager to buy fresh, pesticide-free vegetables from the welcoming staff.
                          </p>
                          <p>
                            Don't miss the bakery stall—get there early for the best bread and pastries, including gluten-free and vegan options. The smell of freshly baked goods fills the air, and these treats sell out fast!
                          </p>
                          <p>
                            In addition to food, the market sells handmade crafts like jewelry, pottery, and textiles. These unique items make perfect gifts and support local artisans. Plus, enjoy live music while you shop. Talented local musicians help create a vibrant atmosphere, and the community spirit makes it a delightful experience for all. See you there!
                          </p>
                        </div>
                      </div>

                      {/* Like and Comment section */}
                      <div className="border-t border-gray-300 p-4 mt-auto">
                        <div className="flex items-center gap-6 text-gray-600 justify-end">
                          <button className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                            </svg>
                            <span className="font-['Inter',_sans-serif] font-medium">Like</span>
                          </button>
                          <button className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            <span className="font-['Inter',_sans-serif] font-medium">Comment</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Decorative borders */}
                <div className="absolute" style={{ left: '1px', top: '1px', width: '580px', height: '680px', border: '2px solid black', borderRadius: '12px', pointerEvents: 'none' }}></div>
                
                {/* Corner dots */}
                <div className="absolute w-3 h-3 bg-black rounded-full" style={{ left: '285px', top: '11px' }}></div>
                <div className="absolute w-3 h-3 bg-black rounded-full" style={{ left: '285px', bottom: '9px' }}></div>
              </div>
            }
            rightContent={
              <>
                <h3 className="text-lg font-['Inter',_sans-serif] font-bold text-black mb-10">Why do customers go to the bakery stall early?</h3>
                
                <div className="space-y-6">
                  {answerOptions5.map((option, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <input
                          type="radio"
                          id={`option5-${index}`}
                          name="bakery-early"
                          value={option}
                          checked={selectedAnswer5 === option}
                          onChange={() => handleAnswerSelect5(option)}
                          className={`w-5 h-5 mt-0.5 appearance-none rounded-full cursor-pointer border-[2px] ${
                            selectedAnswer5 === option
                              ? 'border-[#0d9488]'
                              : 'border-black'
                          }`}
                        />
                        {selectedAnswer5 === option && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] bg-[#0d9488] rounded-full pointer-events-none"></div>
                        )}
                      </div>
                      <label htmlFor={`option5-${index}`} className="font-['Inter',_sans-serif] text-black cursor-pointer leading-relaxed text-lg">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </>
            }
          />
        </div>
      </div>
    );
  };

  // [Removed: MirrorTest Screen Components 16-20 - Using Module1Question16-20 instead]

  // OLD Module 1 - Question 16 - TO BE REMOVED
  const _OldModule1Question16Screen_REMOVE = () => {
    const correctAnswer6 = "Research on animal cognition";
    
    const answerOptions6 = [
      "Stages of early childhood development",
      "Research on animal cognition",
      "Differences between apes, elephants, and dolphins",
      "Recent experiments on fish"
    ];

    const handleAnswerSelect6 = (answer: string) => {
      setSelectedAnswer6(answer);
    };

    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowMirrorTest(false);
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
            >
              *toefl ibt
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Volume Button */}
            <button className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowMirrorTest(false);
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
                setShowMirrorTest(false);
                setShowMirrorTest2(true);
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
        <div className="flex-1 p-12 overflow-auto bg-white border border-black">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-['Inter',_sans-serif] font-bold text-black mb-10 text-center">The Mirror Test</h1>
            
            <div className="flex gap-16 items-start pl-0">
              {/* Left side - Passage */}
              <div className="flex-1 max-w-xl">
                <div className="space-y-4 font-['Inter',_sans-serif] leading-relaxed text-black text-lg">
                  <p>
                    Very young children cannot recognize themselves in a mirror; they usually achieve this milestone around 18 months of age. The ability to recognize oneself in the mirror is considered to be a key component of self-awareness and consciousness for humans. But what about animals?
                  </p>
                  <p>
                    For many years, scientists have known that members of the great ape family could recognize themselves in mirrors. They measured this by the "mirror test," which involved putting a colored mark on an ape's body, and then showing the ape its reflection in a mirror. If the ape tried to remove the mark on its own body, the scientists knew that the ape was recognizing its reflection.
                  </p>
                  <p>
                    Apes are close relatives of humans, but in recent years, scientists have discovered that other animals also pass the "mirror test." Elephants and dolphins have shown signs of self-recognition. These, like apes, are highly intelligent animals. But in a more recent experiment, a type of fish called the cleaner fish tried to scrape a mark off its body when it saw itself in the mirror. This suggests that even less intelligent animals may possess more self-awareness than previously suspected.
                  </p>
                </div>
              </div>

              {/* Right side - Question */}
              <div className="flex-1 max-w-xl">
                <h3 className="text-xl font-['Inter',_sans-serif] font-bold text-black mb-8">What is the passage mainly about?</h3>
                
                <div className="space-y-6">
                  {answerOptions6.map((option, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <input
                          type="radio"
                          id={`option6-${index}`}
                          name="mirror-main-idea"
                          value={option}
                          checked={selectedAnswer6 === option}
                          onChange={() => handleAnswerSelect6(option)}
                          className={`w-5 h-5 mt-0.5 appearance-none rounded-full cursor-pointer border-[2px] border-black`}
                        />
                        {selectedAnswer6 === option && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] bg-[#0d9488] rounded-full pointer-events-none"></div>
                        )}
                      </div>
                      <label htmlFor={`option6-${index}`} className="font-['Inter',_sans-serif] text-black cursor-pointer leading-relaxed text-lg">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // OLD Mirror Test Screen Component (Question 17 - Vocabulary) - TO BE REMOVED
  const _OldMirrorTest2Screen_REMOVE = () => {
    const correctAnswer7 = "accomplishment";
    
    const answerOptions7 = [
      "accomplishment",
      "distance",
      "weight",
      "discovery"
    ];

    const handleAnswerSelect7 = (answer: string) => {
      setSelectedAnswer7(answer);
    };

    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowMirrorTest2(false);
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
            >
              *toefl ibt
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Volume Button */}
            <button className="flex items-center gap-3 bg-[#0A6068] border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowMirrorTest2(false);
                setShowMirrorTest(true);
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
                setShowMirrorTest2(false);
                setShowMirrorTest3(true);
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
                Question 17 of 20
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-12 overflow-auto bg-white border border-black">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-['Inter',_sans-serif] font-bold text-black mb-10 text-center">The Mirror Test</h1>
            
            <div className="flex gap-16 items-start pl-0">
              {/* Left side - Passage with highlighted word */}
              <div className="flex-1 max-w-xl">
                <div className="space-y-4 font-['Inter',_sans-serif] leading-relaxed text-black text-lg">
                  <p>
                    Very young children cannot recognize themselves in a mirror; they usually achieve this <span className="bg-[#0A5E63] text-white px-1">milestone</span> around 18 months of age. The ability to recognize oneself in the mirror is considered to be a key component of self-awareness and consciousness for humans. But what about animals?
                  </p>
                  <p>
                    For many years, scientists have known that members of the great ape family could recognize themselves in mirrors. They measured this by the "mirror test," which involved putting a colored mark on an ape's body, and then showing the ape its reflection in a mirror. If the ape tried to remove the mark on its own body, the scientists knew that the ape was recognizing its reflection.
                  </p>
                  <p>
                    Apes are close relatives of humans, but in recent years, scientists have discovered that other animals also pass the "mirror test." Elephants and dolphins have shown signs of self-recognition. These, like apes, are highly intelligent animals. But in a more recent experiment, a type of fish called the cleaner fish tried to scrape a mark off its body when it saw itself in the mirror. This suggests that even less intelligent animals may possess more self-awareness than previously suspected.
                  </p>
                </div>
              </div>

              {/* Right side - Question */}
              <div className="flex-1 max-w-xl">
                <h3 className="text-xl font-['Inter',_sans-serif] font-bold text-black mb-8">The word "milestone" in the first sentence is closest in meaning to</h3>
                
                <div className="space-y-6">
                  {answerOptions7.map((option, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <input
                          type="radio"
                          id={`option7-${index}`}
                          name="milestone-meaning"
                          value={option}
                          checked={selectedAnswer7 === option}
                          onChange={() => handleAnswerSelect7(option)}
                          className={`w-5 h-5 mt-0.5 appearance-none rounded-full cursor-pointer border-[2px] border-black`}
                        />
                        {selectedAnswer7 === option && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] bg-[#0d9488] rounded-full pointer-events-none"></div>
                        )}
                      </div>
                      <label htmlFor={`option7-${index}`} className="font-['Inter',_sans-serif] text-black cursor-pointer leading-relaxed text-lg">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // OLD Mirror Test Screen Component (Question 18) - TO BE REMOVED
  const _OldMirrorTest3Screen_REMOVE = () => {
    const correctAnswer8 = "It helped them determine whether the animals recognized themselves.";
    
    const answerOptions8 = [
      "It made it possible to track the animals' movements.",
      "It helped them determine whether the animals recognized themselves.",
      "It made it easier to tell the animals apart.",
      "It showed whether some animals can detect color differences."
    ];

    const handleAnswerSelect8 = (answer: string) => {
      setSelectedAnswer8(answer);
    };

    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowMirrorTest3(false);
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
            >
              *toefl ibt
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Volume Button */}
            <button className="flex items-center gap-3 bg-[#0A6068] border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowMirrorTest3(false);
                setShowMirrorTest2(true);
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
                setShowMirrorTest3(false);
                setShowMirrorTest4(true);
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
                Question 18 of 20
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-12 overflow-auto bg-white border border-black">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-['Inter',_sans-serif] font-bold text-black mb-10 text-center">The Mirror Test</h1>
            
            <div className="flex gap-16 items-start pl-0">
              {/* Left side - Passage */}
              <div className="flex-1 max-w-xl">
                <div className="space-y-4 font-['Inter',_sans-serif] leading-relaxed text-black text-lg">
                  <p>
                    Very young children cannot recognize themselves in a mirror; they usually achieve this milestone around 18 months of age. The ability to recognize oneself in the mirror is considered to be a key component of self-awareness and consciousness for humans. But what about animals?
                  </p>
                  <p>
                    For many years, scientists have known that members of the great ape family could recognize themselves in mirrors. They measured this by the "mirror test," which involved putting a colored mark on an ape's body, and then showing the ape its reflection in a mirror. If the ape tried to remove the mark on its own body, the scientists knew that the ape was recognizing its reflection.
                  </p>
                  <p>
                    Apes are close relatives of humans, but in recent years, scientists have discovered that other animals also pass the "mirror test." Elephants and dolphins have shown signs of self-recognition. These, like apes, are highly intelligent animals. But in a more recent experiment, a type of fish called the cleaner fish tried to scrape a mark off its body when it saw itself in the mirror. This suggests that even less intelligent animals may possess more self-awareness than previously suspected.
                  </p>
                </div>
              </div>

              {/* Right side - Question */}
              <div className="flex-1 max-w-xl">
                <h3 className="text-xl font-['Inter',_sans-serif] font-bold text-black mb-8">Why did scientists put colored marks on animals' bodies?</h3>
                
                <div className="space-y-6">
                  {answerOptions8.map((option, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <input
                          type="radio"
                          id={`option8-${index}`}
                          name="colored-marks-reason"
                          value={option}
                          checked={selectedAnswer8 === option}
                          onChange={() => handleAnswerSelect8(option)}
                          className={`w-5 h-5 mt-0.5 appearance-none rounded-full cursor-pointer border-[2px] border-black`}
                        />
                        {selectedAnswer8 === option && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] bg-[#0d9488] rounded-full pointer-events-none"></div>
                        )}
                      </div>
                      <label htmlFor={`option8-${index}`} className="font-['Inter',_sans-serif] text-black cursor-pointer leading-relaxed text-lg">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // OLD Mirror Test Screen Component (Question 19) - TO BE REMOVED
  const _OldMirrorTest4Screen_REMOVE = () => {
    const correctAnswer9 = "They can recognize themselves in mirrors.";
    
    const answerOptions9 = [
      "They can recognize themselves in mirrors.",
      "They are highly intelligent animals.",
      "They possess qualities in common with apes.",
      "They understand certain signs from other animals."
    ];

    const handleAnswerSelect9 = (answer: string) => {
      setSelectedAnswer9(answer);
    };

    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowMirrorTest4(false);
                setShowMirrorTest3(false);
                setShowMirrorTest2(false);
                setShowMirrorTest(false);
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
            >
              *toefl ibt
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Volume Button */}
            <button className="flex items-center gap-3 bg-[#0A6068] border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowMirrorTest4(false);
                setShowMirrorTest3(true);
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
                setShowMirrorTest4(false);
                setShowMirrorTest5(true);
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
                Question 19 of 20
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-12 overflow-auto bg-white border border-black">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-['Inter',_sans-serif] font-bold text-black mb-16 text-center">The Mirror Test</h1>
            
            <div className="flex gap-20 items-start pl-0">
              {/* Left side - Passage */}
              <div className="flex-1">
                <div className="space-y-6 font-['Inter',_sans-serif] leading-relaxed text-black text-lg">
                  <p>
                    Very young children cannot recognize themselves in a mirror; they usually achieve this milestone around 18 months of age. The ability to recognize oneself in the mirror is considered to be a key component of self-awareness and consciousness for humans. But what about animals?
                  </p>
                  <p>
                    For many years, scientists have known that members of the great ape family could recognize themselves in mirrors. They measured this by the "mirror test," which involved putting a colored mark on an ape's body, and then showing the ape its reflection in a mirror. If the ape tried to remove the mark on its own body, the scientists knew that the ape was recognizing its reflection.
                  </p>
                  <p>
                    Apes are close relatives of humans, but in recent years, scientists have discovered that other animals also pass the "mirror test." Elephants and dolphins have shown signs of self-recognition. These, like apes, are highly intelligent animals. But in a more recent experiment, a type of fish called the cleaner fish tried to scrape a mark off its body when it saw itself in the mirror. This suggests that even less intelligent animals may possess more self-awareness than previously suspected.
                  </p>
                </div>
              </div>

              {/* Right side - Question */}
              <div className="w-[500px]">
                <h3 className="text-xl font-['Inter',_sans-serif] font-bold text-black mb-8">According to the passage, all of the following are true about elephants EXCEPT:</h3>
                
                <div className="space-y-6">
                  {answerOptions9.map((option, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <input
                          type="radio"
                          id={`option9-${index}`}
                          name="elephant-except"
                          value={option}
                          checked={selectedAnswer9 === option}
                          onChange={() => handleAnswerSelect9(option)}
                          className={`w-5 h-5 mt-0.5 appearance-none rounded-full cursor-pointer border-[2px] border-black`}
                        />
                        {selectedAnswer9 === option && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] bg-[#0d9488] rounded-full pointer-events-none"></div>
                        )}
                      </div>
                      <label htmlFor={`option9-${index}`} className="font-['Inter',_sans-serif] text-black cursor-pointer leading-relaxed text-lg">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // OLD Mirror Test Screen Component (Question 20) - TO BE REMOVED  
  const _OldMirrorTest5Screen_REMOVE = () => {
    const correctAnswer10 = "To suggest that a wide range of animals may possess self-awareness";
    
    const answerOptions10 = [
      "To suggest that a wide range of animals may possess self-awareness",
      "To imply that ocean animals are highly intelligent",
      "To demonstrate a flaw in a recent experiment",
      "To provide an example of an animal that does not recognize itself"
    ];

    const handleAnswerSelect10 = (answer: string) => {
      setSelectedAnswer10(answer);
    };

    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowMirrorTest5(false);
                setShowMirrorTest4(false);
                setShowMirrorTest3(false);
                setShowMirrorTest2(false);
                setShowMirrorTest(false);
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
            >
              *toefl ibt
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Volume Button */}
            <button className="flex items-center gap-3 bg-[#0A6068] border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowMirrorTest5(false);
                setShowMirrorTest4(true);
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
                setShowMirrorTest5(false);
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
        <div className="flex-1 p-12 overflow-auto bg-white border border-black">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-['Inter',_sans-serif] font-bold text-black mb-16 text-center">The Mirror Test</h1>
            
            <div className="flex gap-20 items-start pl-0">
              {/* Left side - Passage */}
              <div className="flex-1">
                <div className="space-y-6 font-['Inter',_sans-serif] leading-relaxed text-black text-lg">
                  <p>
                    Very young children cannot recognize themselves in a mirror; they usually achieve this milestone around 18 months of age. The ability to recognize oneself in the mirror is considered to be a key component of self-awareness and consciousness for humans. But what about animals?
                  </p>
                  <p>
                    For many years, scientists have known that members of the great ape family could recognize themselves in mirrors. They measured this by the "mirror test," which involved putting a colored mark on an ape's body, and then showing the ape its reflection in a mirror. If the ape tried to remove the mark on its own body, the scientists knew that the ape was recognizing its reflection.
                  </p>
                  <p>
                    Apes are close relatives of humans, but in recent years, scientists have discovered that other animals also pass the "mirror test." Elephants and dolphins have shown signs of self-recognition. These, like apes, are highly intelligent animals. But in a more recent experiment, a type of fish called the cleaner fish tried to scrape a mark off its body when it saw itself in the mirror. This suggests that even less intelligent animals may possess more self-awareness than previously suspected.
                  </p>
                </div>
              </div>

              {/* Right side - Question */}
              <div className="w-[500px]">
                <h3 className="text-xl font-['Inter',_sans-serif] font-bold text-black mb-8">Why does the author mention cleaner fish?</h3>
                
                <div className="space-y-6">
                  {answerOptions10.map((option, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <input
                          type="radio"
                          id={`option10-${index}`}
                          name="cleaner-fish"
                          value={option}
                          checked={selectedAnswer10 === option}
                          onChange={() => handleAnswerSelect10(option)}
                          className={`w-5 h-5 mt-0.5 appearance-none rounded-full cursor-pointer border-[2px] border-black`}
                        />
                        {selectedAnswer10 === option && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] bg-[#0d9488] rounded-full pointer-events-none"></div>
                        )}
                      </div>
                      <label htmlFor={`option10-${index}`} className="font-['Inter',_sans-serif] text-black cursor-pointer leading-relaxed text-lg">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Module 1 - Question 16 (The Mirror Test - Main Idea)
  const Module1Question16Screen = () => {
    const [selectedAnswer16, setSelectedAnswer16] = useState<string | null>(null);
    const [zoom16, setZoom16] = useState(1);
    const correctAnswer = "Animals may have more self-awareness than humans previously believed.";

    const answerOptions = [
      "The mirror test is the only way to measure self-awareness.",
      "Only great apes can recognize themselves in mirrors.",
      "Animals may have more self-awareness than humans previously believed.",
      "Fish are more intelligent than elephants and dolphins."
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
            <button className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
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
        <div className="flex-1 p-8 overflow-auto bg-white border border-black">
          <div className="max-w-7xl mx-auto pl-0">
            <h2 className="text-3xl font-['Inter',_sans-serif] font-bold text-center mb-8">The Mirror Test</h2>
            <ResizableReadingLayout
              zoom={zoom16}
              onWheel={handleWheel16}
              leftContent={
                <>
                  <div className="space-y-4 text-black font-['Inter',_sans-serif] leading-relaxed text-lg">
                    <p>
                      Very young children cannot recognize themselves in a mirror; they usually achieve this milestone around 18 months of age. The ability to recognize oneself in the mirror is considered to be a key component of self-awareness and consciousness for humans. But what about animals?
                    </p>
                    
                    <p>
                      For many years, scientists have known that members of the great ape family could recognize themselves in mirrors. They measured this by the "mirror test," which involved putting a colored mark on an ape's body, and then showing the ape its reflection in a mirror. If the ape tried to remove the mark on its own body, the scientists knew that the ape was recognizing its reflection.
                    </p>
                    
                    <p>
                      Apes are close relatives of humans, but in recent years, scientists have discovered that other animals also pass the "mirror test." Elephants and dolphins have shown signs of self-recognition. These, like apes, are highly intelligent animals. But in a more recent experiment, a type of fish called the cleaner fish tried to scrape a mark off its body when it saw itself in the mirror. This suggests that even less intelligent animals may possess more self-awareness than previously suspected.
                    </p>
                  </div>
                </>
              }
              rightContent={
                <>
                  <h3 className="text-xl font-['Inter',_sans-serif] font-bold text-black mb-8 mt-3">Which of the following best states a main idea of the passage?</h3>
                
                  <div className="space-y-5">
                    {answerOptions.map((option, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="relative flex-shrink-0">
                          <input
                            type="radio"
                            id={`module1-q16-option-${index}`}
                            name="module1-q16"
                            value={option}
                            checked={selectedAnswer16 === option}
                            onChange={() => setSelectedAnswer16(option)}
                            className={`w-5 h-5 mt-0.5 appearance-none rounded-full cursor-pointer border-[2px] border-black`}
                          />
                          {selectedAnswer16 === option && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] bg-[#0d9488] rounded-full pointer-events-none"></div>
                          )}
                        </div>
                        <label htmlFor={`module1-q16-option-${index}`} className="font-['Inter',_sans-serif] text-black cursor-pointer leading-relaxed text-lg">
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                </>
              }
            />
          </div>
        </div>
      </div>
    );
  };

  // Module 1 - Question 17
  const Module1Question17Screen = () => {
    const [selectedAnswer17, setSelectedAnswer17] = useState<string | null>(null);
    const [zoom17, setZoom17] = useState(1);
    const correctAnswer = "The mirror test demonstrates self-awareness in animals.";

    const answerOptions = [
      "The mirror test demonstrates self-awareness in animals.",
      "Young children can recognize themselves earlier than 18 months.",
      "Great apes are the only animals that pass the mirror test.",
      "Fish cannot pass the mirror test."
    ];

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
            <button className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
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

        <div className="flex-1 p-8 overflow-auto bg-white border border-black">
          <div className="max-w-7xl mx-auto pl-0">
            <h2 className="text-3xl font-['Inter',_sans-serif] font-bold text-center mb-8">The Mirror Test</h2>
            <ResizableReadingLayout
              zoom={zoom17}
              onWheel={handleWheel17}
              leftContent={
                <>
                  <div className="space-y-4 text-black font-['Inter',_sans-serif] leading-relaxed text-lg">
                    <p>
                      Very young children cannot recognize themselves in a mirror; they usually achieve this milestone around 18 months of age. The ability to recognize oneself in the mirror is considered to be a key component of self-awareness and consciousness for humans. But what about animals?
                    </p>
                    
                    <p>
                      For many years, scientists have known that members of the great ape family could recognize themselves in mirrors. They measured this by the "mirror test," which involved putting a colored mark on an ape's body, and then showing the ape its reflection in a mirror. If the ape tried to remove the mark on its own body, the scientists knew that the ape was recognizing its reflection.
                    </p>
                    
                    <p>
                      Apes are close relatives of humans, but in recent years, scientists have discovered that other animals also pass the "mirror test." Elephants and dolphins have shown signs of self-recognition. These, like apes, are highly intelligent animals. But in a more recent experiment, a type of fish called the cleaner fish tried to scrape a mark off its body when it saw itself in the mirror. This suggests that even less intelligent animals may possess more self-awareness than previously suspected.
                    </p>
                  </div>
                </>
              }
              rightContent={
                <>
                  <h3 className="text-xl font-['Inter',_sans-serif] font-bold text-black mb-8 mt-6">According to the passage, what is true about the mirror test?</h3>
                
                  <div className="space-y-5">
                    {answerOptions.map((option, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="relative flex-shrink-0">
                          <input
                            type="radio"
                            id={`module1-q17-option-${index}`}
                            name="module1-q17"
                            value={option}
                            checked={selectedAnswer17 === option}
                            onChange={() => setSelectedAnswer17(option)}
                            className={`w-5 h-5 mt-0.5 appearance-none rounded-full cursor-pointer border-[2px] border-black`}
                          />
                          {selectedAnswer17 === option && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] bg-[#0d9488] rounded-full pointer-events-none"></div>
                          )}
                        </div>
                        <label htmlFor={`module1-q17-option-${index}`} className="font-['Inter',_sans-serif] text-black cursor-pointer leading-relaxed text-lg">
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                </>
              }
            />
          </div>
        </div>
      </div>
    );
  };

  // Module 1 - Question 18
  const Module1Question18Screen = () => {
    const [selectedAnswer18, setSelectedAnswer18] = useState<string | null>(null);
    const [zoom18, setZoom18] = useState(1);
    const correctAnswer = "Elephants and dolphins";

    const answerOptions = [
      "Great apes only",
      "Elephants and dolphins",
      "Cleaner fish",
      "Young children"
    ];

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
            <button className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
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

        <div className="flex-1 p-8 overflow-auto bg-white border border-black">
          <div className="max-w-7xl mx-auto pl-0">
            <h2 className="text-3xl font-['Inter',_sans-serif] font-bold text-center mb-8">The Mirror Test</h2>
            <ResizableReadingLayout
              zoom={zoom18}
              onWheel={handleWheel18}
              leftContent={
                <>
                  <div className="space-y-4 text-black font-['Inter',_sans-serif] leading-relaxed text-lg">
                    <p>
                      Very young children cannot recognize themselves in a mirror; they usually achieve this milestone around 18 months of age. The ability to recognize oneself in the mirror is considered to be a key component of self-awareness and consciousness for humans. But what about animals?
                    </p>
                    
                    <p>
                      For many years, scientists have known that members of the great ape family could recognize themselves in mirrors. They measured this by the "mirror test," which involved putting a colored mark on an ape's body, and then showing the ape its reflection in a mirror. If the ape tried to remove the mark on its own body, the scientists knew that the ape was recognizing its reflection.
                    </p>
                    
                    <p>
                      Apes are close relatives of humans, but in recent years, scientists have discovered that other animals also pass the "mirror test." Elephants and dolphins have shown signs of self-recognition. These, like apes, are highly intelligent animals. But in a more recent experiment, a type of fish called the cleaner fish tried to scrape a mark off its body when it saw itself in the mirror. This suggests that even less intelligent animals may possess more self-awareness than previously suspected.
                    </p>
                  </div>
                </>
              }
              rightContent={
                <>
                  <h3 className="text-xl font-['Inter',_sans-serif] font-bold text-black mb-8 mt-6">Which animals besides great apes have shown signs of self-recognition?</h3>
                
                  <div className="space-y-5">
                    {answerOptions.map((option, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="relative flex-shrink-0">
                          <input
                            type="radio"
                            id={`module1-q18-option-${index}`}
                            name="module1-q18"
                            value={option}
                            checked={selectedAnswer18 === option}
                            onChange={() => setSelectedAnswer18(option)}
                            className={`w-5 h-5 mt-0.5 appearance-none rounded-full cursor-pointer border-[2px] border-black`}
                          />
                          {selectedAnswer18 === option && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] bg-[#0d9488] rounded-full pointer-events-none"></div>
                          )}
                        </div>
                        <label htmlFor={`module1-q18-option-${index}`} className="font-['Inter',_sans-serif] text-black cursor-pointer leading-relaxed text-lg">
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                </>
              }
            />
          </div>
        </div>
      </div>
    );
  };

  // Module 1 - Question 19
  const Module1Question19Screen = () => {
    const [selectedAnswer19, setSelectedAnswer19] = useState<string | null>(null);
    const [zoom19, setZoom19] = useState(1);
    const correctAnswer = "It suggests that self-awareness may be more widespread than previously thought.";

    const answerOptions = [
      "It proves that fish are highly intelligent.",
      "It suggests that self-awareness may be more widespread than previously thought.",
      "It demonstrates that the mirror test is flawed.",
      "It shows that only ocean animals have self-awareness."
    ];

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
            <button className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
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

        <div className="flex-1 p-8 overflow-auto bg-white border border-black">
          <div className="max-w-7xl mx-auto pl-0">
            <h2 className="text-3xl font-['Inter',_sans-serif] font-bold text-center mb-8">The Mirror Test</h2>
            <ResizableReadingLayout
              zoom={zoom19}
              onWheel={handleWheel19}
              leftContent={
                <>
                  <div className="space-y-4 text-black font-['Inter',_sans-serif] leading-relaxed text-lg">
                    <p>
                      Very young children cannot recognize themselves in a mirror; they usually achieve this milestone around 18 months of age. The ability to recognize oneself in the mirror is considered to be a key component of self-awareness and consciousness for humans. But what about animals?
                    </p>
                    
                    <p>
                      For many years, scientists have known that members of the great ape family could recognize themselves in mirrors. They measured this by the "mirror test," which involved putting a colored mark on an ape's body, and then showing the ape its reflection in a mirror. If the ape tried to remove the mark on its own body, the scientists knew that the ape was recognizing its reflection.
                    </p>
                    
                    <p>
                      Apes are close relatives of humans, but in recent years, scientists have discovered that other animals also pass the "mirror test." Elephants and dolphins have shown signs of self-recognition. These, like apes, are highly intelligent animals. But in a more recent experiment, a type of fish called the cleaner fish tried to scrape a mark off its body when it saw itself in the mirror. This suggests that even less intelligent animals may possess more self-awareness than previously suspected.
                    </p>
                  </div>
                </>
              }
              rightContent={
                <>
                  <h3 className="text-xl font-['Inter',_sans-serif] font-bold text-black mb-8 mt-6">What is the significance of the cleaner fish experiment?</h3>
                
                  <div className="space-y-5">
                    {answerOptions.map((option, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="relative flex-shrink-0">
                          <input
                            type="radio"
                            id={`module1-q19-option-${index}`}
                            name="module1-q19"
                            value={option}
                            checked={selectedAnswer19 === option}
                            onChange={() => setSelectedAnswer19(option)}
                            className={`w-5 h-5 mt-0.5 appearance-none rounded-full cursor-pointer border-[2px] border-black`}
                          />
                          {selectedAnswer19 === option && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] bg-[#0d9488] rounded-full pointer-events-none"></div>
                          )}
                        </div>
                        <label htmlFor={`module1-q19-option-${index}`} className="font-['Inter',_sans-serif] text-black cursor-pointer leading-relaxed text-lg">
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                </>
              }
            />
          </div>
        </div>
      </div>
    );
  };

  // Module 1 - Question 20
  const Module1Question20Screen = () => {
    const [selectedAnswer20, setSelectedAnswer20] = useState<string | null>(null);
    const [zoom20, setZoom20] = useState(1);
    const correctAnswer = "Around 18 months of age";

    const answerOptions = [
      "At birth",
      "Around 6 months of age",
      "Around 18 months of age",
      "At 3 years of age"
    ];

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
            <button className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
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

        <div className="flex-1 p-8 overflow-auto bg-white border border-black">
          <div className="max-w-7xl mx-auto pl-0">
            <h2 className="text-3xl font-['Inter',_sans-serif] font-bold text-center mb-8">The Mirror Test</h2>
            <ResizableReadingLayout
              zoom={zoom20}
              onWheel={handleWheel20}
              leftContent={
                <>
                  <div className="space-y-4 text-black font-['Inter',_sans-serif] leading-relaxed text-lg">
                    <p>
                      Very young children cannot recognize themselves in a mirror; they usually achieve this milestone around 18 months of age. The ability to recognize oneself in the mirror is considered to be a key component of self-awareness and consciousness for humans. But what about animals?
                    </p>
                    
                    <p>
                      For many years, scientists have known that members of the great ape family could recognize themselves in mirrors. They measured this by the "mirror test," which involved putting a colored mark on an ape's body, and then showing the ape its reflection in a mirror. If the ape tried to remove the mark on its own body, the scientists knew that the ape was recognizing its reflection.
                    </p>
                    
                    <p>
                      Apes are close relatives of humans, but in recent years, scientists have discovered that other animals also pass the "mirror test." Elephants and dolphins have shown signs of self-recognition. These, like apes, are highly intelligent animals. But in a more recent experiment, a type of fish called the cleaner fish tried to scrape a mark off its body when it saw itself in the mirror. This suggests that even less intelligent animals may possess more self-awareness than previously suspected.
                    </p>
                  </div>
                </>
              }
              rightContent={
                <>
                  <h3 className="text-xl font-['Inter',_sans-serif] font-bold text-black mb-8 mt-6">According to the passage, when do children typically recognize themselves in a mirror?</h3>
                
                  <div className="space-y-5">
                    {answerOptions.map((option, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="relative flex-shrink-0">
                          <input
                            type="radio"
                            id={`module1-q20-option-${index}`}
                            name="module1-q20"
                            value={option}
                            checked={selectedAnswer20 === option}
                            onChange={() => setSelectedAnswer20(option)}
                            className={`w-5 h-5 mt-0.5 appearance-none rounded-full cursor-pointer border-[2px] border-black`}
                          />
                          {selectedAnswer20 === option && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] bg-[#0d9488] rounded-full pointer-events-none"></div>
                          )}
                        </div>
                        <label htmlFor={`module1-q20-option-${index}`} className="font-['Inter',_sans-serif] text-black cursor-pointer leading-relaxed text-lg">
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                </>
              }
            />
          </div>
        </div>
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
            <button className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
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
      </div>
    );
  };

  // Module 2 - Fill in the Blanks (Questions 1-10)
  const Module2FillBlanksScreen = () => {
    const handleBlankChange = (blankNumber: number, value: string) => {
      setModule2BlankAnswers(prev => ({
        ...prev,
        [blankNumber]: value
      }));
    };

    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
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
          <div className="flex items-center gap-3">
            {/* Volume Button */}
            <button className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Next Button */}
            <button 
              className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
              onClick={() => {
                setShowModule2FillBlanks(false);
                setShowModule2Question11(true);
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
                Questions 1-10 of 20
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-8 overflow-auto bg-white border border-black">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-3xl font-['Inter',_sans-serif] font-bold text-black mb-12 text-center">Fill in the missing letters in the paragraph.</h1>
            
            <div className="p-0">
              <p className="font-['Inter',_sans-serif] leading-relaxed text-black text-lg">
                The human brain is a complex organ responsible for controlling all bodily functions and enabling thought, emotion, 
                and memory. It i<input 
                  type="text" 
                  className="inline-block w-8 mx-1 px-1 border-b-2 border-gray-400 focus:border-[#1e6b73] focus:outline-none bg-gray-100 text-center"
                  value={module2BlankAnswers[1] || ''}
                  onChange={(e) => handleBlankChange(1, e.target.value)}
                  maxLength={1}
                /> divided in<input 
                  type="text" 
                  className="inline-block w-8 mx-1 px-1 border-b-2 border-gray-400 focus:border-[#1e6b73] focus:outline-none bg-gray-100 text-center"
                  value={module2BlankAnswers[2] || ''}
                  onChange={(e) => handleBlankChange(2, e.target.value)}
                  maxLength={2}
                /> several reg<input 
                  type="text" 
                  className="inline-block w-16 mx-1 px-1 border-b-2 border-gray-400 focus:border-[#1e6b73] focus:outline-none bg-gray-100 text-center"
                  value={module2BlankAnswers[3] || ''}
                  onChange={(e) => handleBlankChange(3, e.target.value)}
                  maxLength={4}
                />, each wi<input 
                  type="text" 
                  className="inline-block w-8 mx-1 px-1 border-b-2 border-gray-400 focus:border-[#1e6b73] focus:outline-none bg-gray-100 text-center"
                  value={module2BlankAnswers[4] || ''}
                  onChange={(e) => handleBlankChange(4, e.target.value)}
                  maxLength={2}
                /> specific ro<input 
                  type="text" 
                  className="inline-block w-12 mx-1 px-1 border-b-2 border-gray-400 focus:border-[#1e6b73] focus:outline-none bg-gray-100 text-center"
                  value={module2BlankAnswers[5] || ''}
                  onChange={(e) => handleBlankChange(5, e.target.value)}
                  maxLength={3}
                />. The cerebrum, i<input 
                  type="text" 
                  className="inline-block w-8 mx-1 px-1 border-b-2 border-gray-400 focus:border-[#1e6b73] focus:outline-none bg-gray-100 text-center"
                  value={module2BlankAnswers[6] || ''}
                  onChange={(e) => handleBlankChange(6, e.target.value)}
                  maxLength={2}
                /> largest pa<input 
                  type="text" 
                  className="inline-block w-8 mx-1 px-1 border-b-2 border-gray-400 focus:border-[#1e6b73] focus:outline-none bg-gray-100 text-center"
                  value={module2BlankAnswers[7] || ''}
                  onChange={(e) => handleBlankChange(7, e.target.value)}
                  maxLength={2}
                />, is 
                invo<input 
                  type="text" 
                  className="inline-block w-16 mx-1 px-1 border-b-2 border-gray-400 focus:border-[#1e6b73] focus:outline-none bg-gray-100 text-center"
                  value={module2BlankAnswers[8] || ''}
                  onChange={(e) => handleBlankChange(8, e.target.value)}
                  maxLength={4}
                /> in higher cogn<input 
                  type="text" 
                  className="inline-block w-20 mx-1 px-1 border-b-2 border-gray-400 focus:border-[#1e6b73] focus:outline-none bg-gray-100 text-center"
                  value={module2BlankAnswers[9] || ''}
                  onChange={(e) => handleBlankChange(9, e.target.value)}
                  maxLength={5}
                /> functions su<input 
                  type="text" 
                  className="inline-block w-8 mx-1 px-1 border-b-2 border-gray-400 focus:border-[#1e6b73] focus:outline-none bg-gray-100 text-center"
                  value={module2BlankAnswers[10] || ''}
                  onChange={(e) => handleBlankChange(10, e.target.value)}
                  maxLength={2}
                /> as reasoning, planning, and language. The cerebellum coordinates 
                movement and balance, while the brainstem controls vital bodily functions like breathing and heart rate. Together, 
                they enable the brain to perform its various tasks.
              </p>
            </div>
          </div>
        </div>
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

    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowModule2Question11(false);
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
            <button className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowModule2Question11(false);
                setShowModule2FillBlanks(true);
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
                setShowModule2Question11(false);
                setShowModule2Question12(true);
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
                Question 11 of 20
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-8 overflow-auto bg-white border border-black">
          <div className="max-w-7xl mx-auto pl-0">
            <h2 className="text-3xl font-['Inter',_sans-serif] font-bold text-center mb-8">Read an email.</h2>
          
            <ResizableReadingLayout
              showDivider={true}
              leftPadding="pl-2 pr-6"
              leftContent={
                <div className="w-[580px] ml-0 border-4 border-[#1e6b73] rounded-lg overflow-hidden bg-white">
                  {/* Email Header Fields */}
                  <div className="bg-white">
                    <div className="flex border-b-2 border-[#1e6b73]">
                      <div className="bg-[#1e6b73] text-white font-['Inter',_sans-serif] font-bold px-4 py-2 w-24 text-base">To:</div>
                      <div className="flex-1 bg-white px-4 py-2 font-['Inter',_sans-serif] text-base">edward56L@dmail.com</div>
                    </div>
                    <div className="flex border-b-2 border-[#1e6b73]">
                      <div className="bg-[#1e6b73] text-white font-['Inter',_sans-serif] font-bold px-4 py-2 w-24 text-base">From:</div>
                      <div className="flex-1 bg-white px-4 py-2 font-['Inter',_sans-serif] text-base">artforeveryone@dmail.com</div>
                    </div>
                    <div className="flex border-b-2 border-[#1e6b73]">
                      <div className="bg-[#1e6b73] text-white font-['Inter',_sans-serif] font-bold px-4 py-2 w-24 text-base">Date:</div>
                      <div className="flex-1 bg-white px-4 py-2 font-['Inter',_sans-serif] text-base">10/09/2025</div>
                    </div>
                    <div className="flex border-b-2 border-[#1e6b73]">
                      <div className="bg-[#1e6b73] text-white font-['Inter',_sans-serif] font-bold px-4 py-2 w-24 text-base">Subject:</div>
                      <div className="flex-1 bg-white px-4 py-2 font-['Inter',_sans-serif] text-base">Art Workshop Reservation Confirmation</div>
                    </div>
                  </div>
                  
                  {/* Email Body */}
                  <div className="p-6 bg-white border-4 border-[#1e6b73] m-2 max-h-[400px] overflow-y-auto">
                    <p className="font-['Inter',_sans-serif] mb-4 text-base">Dear Ms. Edwards,</p>
                    <p className="font-['Inter',_sans-serif] mb-4 text-base">
                      The reservation for the art workshop that you made on September 10th has been confirmed. The workshop will take place on September 20th at 3:00 PM. All necessary arts supplies will be provided, but please bring your own apron or smock.
                    </p>
                    <p className="font-['Inter',_sans-serif] mb-4 text-base">Best regards,</p>
                    <p className="font-['Inter',_sans-serif] text-base">Laura Bennett</p>
                  </div>
                </div>
              }
              rightContent={
                <div className="flex-1 max-w-xl">
                  <h3 className="text-2xl font-['Inter',_sans-serif] font-bold text-black mb-10">When is the date of the art workshop?</h3>
                
                <div className="space-y-6">
                  {answerOptions.map((option, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <input
                          type="radio"
                          id={`module2-q11-option-${index}`}
                          name="module2-q11"
                          value={option}
                          checked={selectedAnswer11 === option}
                          onChange={() => setSelectedAnswer11(option)}
                          className={`w-5 h-5 mt-0.5 appearance-none rounded-full cursor-pointer border-[2px] border-black`}
                        />
                        {selectedAnswer11 === option && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] bg-[#0d9488] rounded-full pointer-events-none"></div>
                        )}
                      </div>
                      <label htmlFor={`module2-q11-option-${index}`} className="font-['Inter',_sans-serif] text-black cursor-pointer leading-relaxed text-lg">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            }
            />
          </div>
        </div>
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
            <button className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
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
          <div className="px-8 py-3">
            <div className="flex gap-8">
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
        <div className="flex-1 p-8 overflow-auto bg-white border border-black">
          <div className="max-w-7xl mx-auto pl-0">
            <h2 className="text-3xl font-['Inter',_sans-serif] font-bold text-center mb-8">Read an email.</h2>
          
            <ResizableReadingLayout
              showDivider={true}
              leftPadding="pl-2 pr-6"
              leftContent={
                <div className="w-[580px] ml-0 border-4 border-[#1e6b73] rounded-lg overflow-hidden bg-white">
                  {/* Email Header Fields */}
                  <div className="bg-white">
                    <div className="flex border-b-2 border-[#1e6b73]">
                      <div className="bg-[#1e6b73] text-white font-['Inter',_sans-serif] font-bold px-4 py-2 w-24 text-base">To:</div>
                      <div className="flex-1 bg-white px-4 py-2 font-['Inter',_sans-serif] text-base">edward56L@dmail.com</div>
                    </div>
                    <div className="flex border-b-2 border-[#1e6b73]">
                      <div className="bg-[#1e6b73] text-white font-['Inter',_sans-serif] font-bold px-4 py-2 w-24 text-base">From:</div>
                      <div className="flex-1 bg-white px-4 py-2 font-['Inter',_sans-serif] text-base">artforeveryone@dmail.com</div>
                    </div>
                    <div className="flex border-b-2 border-[#1e6b73]">
                      <div className="bg-[#1e6b73] text-white font-['Inter',_sans-serif] font-bold px-4 py-2 w-24 text-base">Date:</div>
                      <div className="flex-1 bg-white px-4 py-2 font-['Inter',_sans-serif] text-base">10/09/2025</div>
                    </div>
                    <div className="flex border-b-2 border-[#1e6b73]">
                      <div className="bg-[#1e6b73] text-white font-['Inter',_sans-serif] font-bold px-4 py-2 w-24 text-base">Subject:</div>
                      <div className="flex-1 bg-white px-4 py-2 font-['Inter',_sans-serif] text-base">Art Workshop Reservation Confirmation</div>
                    </div>
                  </div>
                  
                  {/* Email Body */}
                  <div className="p-6 bg-white border-4 border-[#1e6b73] m-2 max-h-[400px] overflow-y-auto">
                    <p className="font-['Inter',_sans-serif] mb-4 text-base">Dear Ms. Edwards,</p>
                    <p className="font-['Inter',_sans-serif] mb-4 text-base">
                      The reservation for the art workshop that you made on September 10th has been confirmed. The workshop will take place on September 20th at 3:00 PM. All necessary arts supplies will be provided, but please bring your own apron or smock.
                    </p>
                    <p className="font-['Inter',_sans-serif] mb-4 text-base">Best regards,</p>
                    <p className="font-['Inter',_sans-serif] text-base">Laura Bennett</p>
                  </div>
                </div>
              }
              rightContent={
                <div className="flex-1 max-w-xl">
                  <h3 className="text-2xl font-['Inter',_sans-serif] font-bold text-black mb-10">What should Ms. Edwards bring to the workshop?</h3>
                
                <div className="space-y-6">
                  {answerOptions.map((option, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <input
                          type="radio"
                          id={`module2-q12-option-${index}`}
                          name="module2-q12"
                          value={option}
                          checked={selectedAnswer12 === option}
                          onChange={() => setSelectedAnswer12(option)}
                          className={`w-5 h-5 mt-0.5 appearance-none rounded-full cursor-pointer border-[2px] border-black`}
                        />
                        {selectedAnswer12 === option && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] bg-[#0d9488] rounded-full pointer-events-none"></div>
                        )}
                      </div>
                      <label htmlFor={`module2-q12-option-${index}`} className="font-['Inter',_sans-serif] text-black cursor-pointer leading-relaxed text-lg">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            }
            />
          </div>
        </div>
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
            <button className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
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
          <div className="px-8 py-3">
            <div className="flex gap-8">
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
        <div className="flex-1 p-8 overflow-auto bg-white border border-black">
          <div className="max-w-7xl mx-auto pl-0">
            <h2 className="text-3xl font-['Inter',_sans-serif] font-bold text-center mb-8">Read an email.</h2>
          
            <ResizableReadingLayout
              showDivider={false}
              leftPadding="pl-2 pr-6"
              leftContent={
                <div className="w-[580px] ml-0 border-4 border-[#9d5a2f] rounded-lg overflow-hidden bg-white">
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
                <div className="p-5 bg-white border-4 border-[#9d5a2f] m-2 max-h-[450px] overflow-y-auto text-base">
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
            }
            rightContent={
              <div className="flex-1 max-w-xl">
                <h3 className="text-2xl font-['Inter',_sans-serif] font-bold text-black mb-10">What is the main purpose of the email?</h3>
                
                <div className="space-y-6">
                  {answerOptions.map((option, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <input
                          type="radio"
                          id={`module2-q13-option-${index}`}
                          name="module2-q13"
                          value={option}
                          checked={selectedAnswer13 === option}
                          onChange={() => setSelectedAnswer13(option)}
                          className={`w-5 h-5 mt-0.5 appearance-none rounded-full cursor-pointer border-[2px] border-black`}
                        />
                        {selectedAnswer13 === option && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] bg-[#0d9488] rounded-full pointer-events-none"></div>
                        )}
                      </div>
                      <label htmlFor={`module2-q13-option-${index}`} className="font-['Inter',_sans-serif] text-black cursor-pointer leading-relaxed text-lg">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            }
            />
          </div>
        </div>
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
            <button className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
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
          <div className="px-8 py-3">
            <div className="flex gap-8">
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
        <div className="flex-1 p-8 overflow-auto bg-white border border-black">
          <div className="max-w-7xl mx-auto pl-0">
            <h2 className="text-3xl font-['Inter',_sans-serif] font-bold text-center mb-8">Read an email.</h2>
          
            <ResizableReadingLayout
              showDivider={false}
              leftPadding="pl-2 pr-6"
              leftContent={
                <div className="w-[580px] ml-0 border-4 border-[#9d5a2f] rounded-lg overflow-hidden bg-white">
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
                <div className="p-5 bg-white border-4 border-[#9d5a2f] m-2 max-h-[450px] overflow-y-auto text-base">
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
            }
            rightContent={
              <div className="flex-1 max-w-xl">
                <h3 className="text-2xl font-['Inter',_sans-serif] font-bold text-black mb-10">What can be inferred about Ms. Nguyen's relationship with the fitness center?</h3>
                
                <div className="space-y-6">
                  {answerOptions.map((option, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <input
                          type="radio"
                          id={`module2-q14-option-${index}`}
                          name="module2-q14"
                          value={option}
                          checked={selectedAnswer14 === option}
                          onChange={() => setSelectedAnswer14(option)}
                          className={`w-5 h-5 mt-0.5 appearance-none rounded-full cursor-pointer border-[2px] border-black`}
                        />
                        {selectedAnswer14 === option && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] bg-[#0d9488] rounded-full pointer-events-none"></div>
                        )}
                      </div>
                      <label htmlFor={`module2-q14-option-${index}`} className="font-['Inter',_sans-serif] text-black cursor-pointer leading-relaxed text-lg">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            }
            />
          </div>
        </div>
      </div>
    );
  };

  // Module 2 - Question 15 (Email - Target audience)
  const Module2Question15Screen = () => {
    const [selectedAnswer15, setSelectedAnswer15] = useState<string | null>(null);
    const correctAnswer = "Community members of all fitness levels";

    const answerOptions = [
      "Expert personal trainers",
      "Top-tier athletes",
      "Existing fitness-center members",
      "Community members of all fitness levels"
    ];

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
            <button className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
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
          <div className="px-8 py-3">
            <div className="flex gap-8">
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
        <div className="flex-1 p-8 overflow-auto bg-white border border-black">
          <div className="max-w-7xl mx-auto pl-0">
            <h2 className="text-3xl font-['Inter',_sans-serif] font-bold text-center mb-8">Read an email.</h2>
          
            <ResizableReadingLayout
            showDivider={false}
            leftPadding="pl-2 pr-6"
            leftContent={
              <div className="w-[580px] ml-0 border-4 border-[#9d5a2f] rounded-lg overflow-hidden bg-white">
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
                <div className="p-5 bg-white border-4 border-[#9d5a2f] m-2 max-h-[450px] overflow-y-auto text-base">
                  <p className="font-['Inter',_sans-serif] mb-3">Dear Ms. Nguyen,</p>
                    <p className="font-['Inter',_sans-serif] mb-3">
                      We're excited to invite you���and your friends and family—to the grand opening of our new branch at 25 Orchid Street, happening next Monday. This event is a great opportunity to explore our state-of-the-art facility, featuring top-tier equipment, energizing group classes, and expert personal training.
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
            }
            rightContent={
              <div className="flex-1 max-w-xl">
                <h3 className="text-2xl font-['Inter',_sans-serif] font-bold text-black mb-10">The new fitness center is intended for use by which of the following groups of people?</h3>
                
                <div className="space-y-6">
                  {answerOptions.map((option, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <input
                          type="radio"
                          id={`module2-q15-option-${index}`}
                          name="module2-q15"
                          value={option}
                          checked={selectedAnswer15 === option}
                          onChange={() => setSelectedAnswer15(option)}
                          className={`w-5 h-5 mt-0.5 appearance-none rounded-full cursor-pointer border-[2px] border-black`}
                        />
                        {selectedAnswer15 === option && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] bg-[#0d9488] rounded-full pointer-events-none"></div>
                        )}
                      </div>
                      <label htmlFor={`module2-q15-option-${index}`} className="font-['Inter',_sans-serif] text-black cursor-pointer leading-relaxed text-lg">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            }
            />
          </div>
        </div>
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
            <button className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
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
        <div className="flex-1 p-8 overflow-auto bg-white border border-black">
          <div className="max-w-7xl mx-auto pl-0">
            <h2 className="text-3xl font-['Inter',_sans-serif] font-bold text-center mb-8">The Paradox of Choice</h2>
            <ResizableReadingLayout
              zoom={zoom16}
              onWheel={handleWheel16}
              leftContent={
                <>
                  <div className="space-y-4 text-black font-['Inter',_sans-serif] leading-relaxed text-lg">
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
                      <div key={index} className="flex items-start gap-3">
                        <div className="relative flex-shrink-0">
                          <input
                            type="radio"
                            id={`module2-q16-option-${index}`}
                            name="module2-q16"
                            value={option}
                            checked={selectedAnswer16 === option}
                            onChange={() => setSelectedAnswer16(option)}
                            className={`w-5 h-5 mt-0.5 appearance-none rounded-full cursor-pointer border-[2px] border-black`}
                          />
                          {selectedAnswer16 === option && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] bg-[#0d9488] rounded-full pointer-events-none"></div>
                          )}
                        </div>
                        <label htmlFor={`module2-q16-option-${index}`} className="font-['Inter',_sans-serif] text-black cursor-pointer leading-relaxed text-lg">
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                </>
              }
            />
          </div>
        </div>
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
            <button className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
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
        <div className="flex-1 p-8 overflow-auto bg-white border border-black">
          <div className="max-w-7xl mx-auto pl-0">
            <h2 className="text-3xl font-['Inter',_sans-serif] font-bold text-center mb-8">The Paradox of Choice</h2>
            <ResizableReadingLayout
              leftContent={
                <>
                  <div className="space-y-4 text-black font-['Inter',_sans-serif] leading-relaxed text-lg">
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
                    <div key={index} className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <input
                          type="radio"
                          id={`module2-q17-option-${index}`}
                          name="module2-q17"
                          value={option}
                          checked={selectedAnswer17 === option}
                          onChange={() => setSelectedAnswer17(option)}
                          className={`w-5 h-5 mt-0.5 appearance-none rounded-full cursor-pointer border-[2px] border-black`}
                        />
                        {selectedAnswer17 === option && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] bg-[#0d9488] rounded-full pointer-events-none"></div>
                        )}
                      </div>
                      <label htmlFor={`module2-q17-option-${index}`} className="font-['Inter',_sans-serif] text-black cursor-pointer leading-relaxed text-lg">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            }
            />
          </div>
        </div>
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
            <button className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
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
        <div className="flex-1 p-8 overflow-auto bg-white border border-black">
          <div className="max-w-7xl mx-auto pl-0">
            <h2 className="text-3xl font-['Inter',_sans-serif] font-bold text-center mb-8">The Paradox of Choice</h2>
            <ResizableReadingLayout
              leftContent={
                <>
                  <div className="space-y-4 text-black font-['Inter',_sans-serif] leading-relaxed text-lg">
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
                    <div key={index} className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <input
                          type="radio"
                          id={`module2-q18-option-${index}`}
                          name="module2-q18"
                          value={option}
                          checked={selectedAnswer18 === option}
                          onChange={() => setSelectedAnswer18(option)}
                          className={`w-5 h-5 mt-0.5 appearance-none rounded-full cursor-pointer border-[2px] border-black`}
                        />
                        {selectedAnswer18 === option && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] bg-[#0d9488] rounded-full pointer-events-none"></div>
                        )}
                      </div>
                      <label htmlFor={`module2-q18-option-${index}`} className="font-['Inter',_sans-serif] text-black cursor-pointer leading-relaxed text-lg">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            }
            />
          </div>
        </div>
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
            <button className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
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
        <div className="flex-1 p-8 overflow-auto bg-white border border-black">
          <div className="max-w-7xl mx-auto pl-0">
            <h2 className="text-3xl font-['Inter',_sans-serif] font-bold text-center mb-8">The Paradox of Choice</h2>
            <ResizableReadingLayout
              leftContent={
                <>
                  <div className="space-y-4 text-black font-['Inter',_sans-serif] leading-relaxed text-lg">
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
                    <div key={index} className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <input
                          type="radio"
                          id={`module2-q19-option-${index}`}
                          name="module2-q19"
                          value={option}
                          checked={selectedAnswer19 === option}
                          onChange={() => setSelectedAnswer19(option)}
                          className={`w-5 h-5 mt-0.5 appearance-none rounded-full cursor-pointer border-[2px] border-black`}
                        />
                        {selectedAnswer19 === option && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] bg-[#0d9488] rounded-full pointer-events-none"></div>
                        )}
                      </div>
                      <label htmlFor={`module2-q19-option-${index}`} className="font-['Inter',_sans-serif] text-black cursor-pointer leading-relaxed text-lg">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            }
            />
          </div>
        </div>
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
            <button className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
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
                // End of Module 2
                console.log("End of Module 2");
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
        <div className="flex-1 p-8 overflow-auto bg-white border border-black">
          <div className="max-w-7xl mx-auto pl-0">
            <h2 className="text-3xl font-['Inter',_sans-serif] font-bold text-center mb-8">The Paradox of Choice</h2>
            <ResizableReadingLayout
              leftContent={
                <>
                  <div className="space-y-4 text-black font-['Inter',_sans-serif] leading-relaxed text-lg">
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
                    <div key={index} className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <input
                          type="radio"
                          id={`module2-q20-option-${index}`}
                          name="module2-q20"
                          value={option}
                          checked={selectedAnswer20 === option}
                          onChange={() => setSelectedAnswer20(option)}
                          className={`w-5 h-5 mt-0.5 appearance-none rounded-full cursor-pointer border-[2px] border-black`}
                        />
                        {selectedAnswer20 === option && option === correctAnswer && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] bg-[#0d9488] rounded-full pointer-events-none"></div>
                        )}
                      </div>
                      <label htmlFor={`module2-q20-option-${index}`} className="font-['Inter',_sans-serif] text-black cursor-pointer leading-relaxed text-lg">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            }
            />
          </div>
        </div>
      </div>
    );
  };

  // Reading Section Introduction Screen
  const ReadingIntroScreen = () => {
    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
        {/* Top Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
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
            className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
            onClick={() => {
              setShowReadingIntro(false);
              setShowModule1Intro(true);
            }}
          >
            <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Begin</span>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
              <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
            </svg>
          </button>
        </div>

        {/* Tab */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-8 py-3">
            <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2 inline-block">
              Reading
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto bg-white flex items-center justify-center">
          <div className="max-w-4xl px-8 py-12">
            <h2 className="text-3xl font-['Inter',_sans-serif] text-gray-800 mb-8">Reading Section</h2>
            <div className="w-24 h-1 bg-gray-300 mb-8"></div>
            
            <div className="space-y-6 text-gray-700 font-['Inter',_sans-serif] leading-relaxed">
              <p>
                In the reading section, you will answer 35–48 questions to demonstrate how well you understand academic and non-academic texts in English. There are three types of tasks.
              </p>

              <div className="my-8">
                <table className="w-full border border-black">
                  <thead>
                    <tr className="bg-[#2d7a7c] text-white">
                      <th className="border border-black px-6 py-3 text-left font-['Inter',_sans-serif]">Type of Task</th>
                      <th className="border border-black px-6 py-3 text-left font-['Inter',_sans-serif]">Description</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    <tr>
                      <td className="border border-black px-6 py-3 font-['Inter',_sans-serif]">Complete the Words</td>
                      <td className="border border-black px-6 py-3 font-['Inter',_sans-serif]">Fill in the missing letters in a paragraph.</td>
                    </tr>
                    <tr>
                      <td className="border border-black px-6 py-3 font-['Inter',_sans-serif]">Read in Daily Life</td>
                      <td className="border border-black px-6 py-3 font-['Inter',_sans-serif]">Answer questions about everyday reading material.</td>
                    </tr>
                    <tr>
                      <td className="border border-black px-6 py-3 font-['Inter',_sans-serif]">Read an Academic Passage</td>
                      <td className="border border-black px-6 py-3 font-['Inter',_sans-serif]">Answer questions about academic passages.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Listening Section Introduction Screen
  const ListeningIntroScreen = () => {
    useEffect(() => {
      // Speak the instructions using British voice
      if ('speechSynthesis' in window) {
        const text = "In the listening section, you will answer 35 to 45 questions to demonstrate how well you understand spoken English. There are three types of tasks: Listen and Choose a Response, Conversations, and Lectures. You will not be able to return to previous questions.";
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Get available voices and find a British voice
        const setVoice = () => {
          const voices = window.speechSynthesis.getVoices();
          
          // Try to find British English voice (female or male)
          const britishVoice = voices.find(voice => 
            voice.lang === 'en-GB' || voice.lang === 'en-UK'
          );
          
          utterance.voice = britishVoice || voices[0];
          utterance.lang = 'en-GB';
          utterance.rate = 0.9;
          
          window.speechSynthesis.speak(utterance);
        };
        
        if (window.speechSynthesis.getVoices().length > 0) {
          setVoice();
        } else {
          window.speechSynthesis.onvoiceschanged = setVoice;
        }
      }
      
      return () => {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
        }
      };
    }, []);

    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
        {/* Top Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowListeningIntro(false);
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
            <button 
              ref={volumeButtonRef}
              onClick={toggleVolume}
              className={`flex items-center gap-3 rounded-lg px-5 py-2 transition-colors ${
                isVolumeOpen 
                  ? 'bg-white border border-[#0A6068] hover:bg-gray-50' 
                  : 'bg-[#0A6068] border border-white hover:bg-[#084d52]'
              }`}
            >
              <span className={`font-['Inter',_sans-serif] font-semibold text-base ${
                isVolumeOpen ? 'text-[#0A6068]' : 'text-white'
              }`}>Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill={isVolumeOpen ? '#0A6068' : 'white'}>
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Begin Button */}
            <button 
              className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
              onClick={() => {
                setShowListeningIntro(false);
                setShowListeningModule1Intro(true);
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
            <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2 inline-block">
              Listening
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto bg-white flex items-center justify-center">
          <div className="max-w-4xl">
            <h2 className="text-3xl font-['Inter',_sans-serif] text-gray-800 mb-8">Listening Section</h2>
            <div className="w-24 h-1 bg-gray-300 mb-8"></div>
            
            <div className="space-y-6 text-gray-700 font-['Inter',_sans-serif] leading-relaxed">
              <p>
                In the listening section, you will answer 35–45 questions to demonstrate how well you understand spoken English. There are three types of tasks.
              </p>

              <div className="my-8">
                <table className="w-full border border-black">
                  <thead>
                    <tr className="bg-[#2d7a7c] text-white">
                      <th className="border border-black px-6 py-3 text-left font-['Inter',_sans-serif]">Type of Task</th>
                      <th className="border border-black px-6 py-3 text-left font-['Inter',_sans-serif]">Description</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    <tr>
                      <td className="border border-black px-6 py-3 font-['Inter',_sans-serif]">Listen and Choose a Response</td>
                      <td className="border border-black px-6 py-3 font-['Inter',_sans-serif]">Select the best response to the question or statement.</td>
                    </tr>
                    <tr>
                      <td className="border border-black px-6 py-3 font-['Inter',_sans-serif]">Conversations</td>
                      <td className="border border-black px-6 py-3 font-['Inter',_sans-serif]">Answer questions about short conversations.</td>
                    </tr>
                    <tr>
                      <td className="border border-black px-6 py-3 font-['Inter',_sans-serif]">Announcements and Academic Talks</td>
                      <td className="border border-black px-6 py-3 font-['Inter',_sans-serif]">Answer questions about announcements and academic talks.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p>
                You WILL NOT be able to return to previous questions.
              </p>
            </div>
          </div>
        </div>

        {/* Volume Control Dropdown */}
        <VolumeControl isOpen={isVolumeOpen} onClose={closeVolume} buttonRef={volumeButtonRef} />
      </div>
    );
  };

  // Listening Module 1 Introduction Screen
  const ListeningModule1IntroScreen = () => {
    useEffect(() => {
      // Speak the instructions using British voice
      if ('speechSynthesis' in window) {
        const text = "Module 1. You can use Next to move to the next question. The first task is Listen and Choose a Response. In this task, you will listen to a sentence or question. You will then read four sentences and choose the option that is the best response.";
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Get available voices and find a British voice
        const setVoice = () => {
          const voices = window.speechSynthesis.getVoices();
          
          // Try to find British English voice (female or male)
          const britishVoice = voices.find(voice => 
            voice.lang === 'en-GB' || voice.lang === 'en-UK'
          );
          
          utterance.voice = britishVoice || voices[0];
          utterance.lang = 'en-GB';
          utterance.rate = 0.9;
          
          window.speechSynthesis.speak(utterance);
        };
        
        if (window.speechSynthesis.getVoices().length > 0) {
          setVoice();
        } else {
          window.speechSynthesis.onvoiceschanged = setVoice;
        }
      }
      
      return () => {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
        }
      };
    }, []);

    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
        {/* Top Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowListeningModule1Intro(false);
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
            <button 
              ref={volumeButtonRef}
              onClick={toggleVolume}
              className={`flex items-center gap-3 rounded-lg px-5 py-2 transition-colors ${
                isVolumeOpen 
                  ? 'bg-white border border-[#0A6068] hover:bg-gray-50' 
                  : 'bg-[#0A6068] border border-white hover:bg-[#084d52]'
              }`}
            >
              <span className={`font-['Inter',_sans-serif] font-semibold text-base ${
                isVolumeOpen ? 'text-[#0A6068]' : 'text-white'
              }`}>Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill={isVolumeOpen ? '#0A6068' : 'white'}>
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowListeningModule1Intro(false);
                setShowListeningIntro(true);
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Back</span>
            </button>
            
            {/* Begin Button */}
            <button 
              className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
              onClick={() => {
                setShowListeningModule1Intro(false);
                setShowListeningQuestion1(true);
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
            <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2 inline-block">
              Listening
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-12 overflow-auto bg-white flex items-center justify-center">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-['Inter',_sans-serif] font-bold text-black mb-8">Module 1</h1>
            
            <div className="space-y-6 text-gray-700 font-['Inter',_sans-serif] leading-relaxed">
              <p className="text-lg">
                In an actual test, the clock will show you how much time you have to complete each question.
              </p>

              <p className="text-lg">
                You can use <strong>Next</strong> to move to the next question.
              </p>

              <p className="text-lg">
                The first task is <strong>Listen and Choose a Response</strong>. In this task, you will listen to a sentence or question. You will then read four sentences and choose the option that is the best response.
              </p>
            </div>
          </div>
        </div>

        {/* Volume Control Dropdown */}
        <VolumeControl isOpen={isVolumeOpen} onClose={closeVolume} buttonRef={volumeButtonRef} />
      </div>
    );
  };

  // Listening Question 1 Screen
  const ListeningQuestion1Screen = () => {
    const [selectedAnswerL1, setSelectedAnswerL1] = useState<string | null>(null);

    const answerOptions = [
      "As a matter of fact, I was returning a book.",
      "Yes, you can find it in the reference section.",
      "I don't think I'll have enough time to do that.",
      "Actually, I think I can get there a little earlier."
    ];

    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
        {/* Top Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowListeningQuestion1(false);
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
            <button 
              ref={volumeButtonRef}
              onClick={toggleVolume}
              className={`flex items-center gap-3 rounded-lg px-5 py-2 transition-colors ${
                isVolumeOpen 
                  ? 'bg-white border border-[#0A6068] hover:bg-gray-50' 
                  : 'bg-[#0A6068] border border-white hover:bg-[#084d52]'
              }`}
            >
              <span className={`font-['Inter',_sans-serif] font-semibold text-base ${
                isVolumeOpen ? 'text-[#0A6068]' : 'text-white'
              }`}>Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill={isVolumeOpen ? '#0A6068' : 'white'}>
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowListeningQuestion1(false);
                setShowListeningModule1Intro(true);
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
                setShowListeningQuestion1(false);
                setShowListeningQuestion2(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Tab with Question number */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-8 py-3">
            <div className="flex gap-8">
              <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
                Listening
              </div>
              <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
                Question 1 of 18
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-8 overflow-auto bg-white border border-black">
          <h2 className="text-3xl font-['Inter',_sans-serif] font-bold text-gray-800 mb-8 text-center">Choose the best response.</h2>
          
          <div className="max-w-5xl ml-auto mr-[12%]">
            <div className="flex gap-16 items-start mt-12">
              {/* Left side - Image */}
              <div className="flex-shrink-0">
                <div className="w-96 h-96 bg-white rounded-lg overflow-hidden">
                  <ImageWithFallback 
                    src="figma:asset/559710b6fff885c2420dd98060822dbf40037a0f.png" 
                    alt="Professional woman"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Right side - Options */}
              <div className="flex-1 max-w-xl mt-8">
                <div className="space-y-6">
                  {answerOptions.map((option, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="relative flex-shrink-0">
                        <input
                          type="radio"
                          id={`listening-q1-option-${index}`}
                          name="listening-q1"
                          value={option}
                          checked={selectedAnswerL1 === option}
                          onChange={() => setSelectedAnswerL1(option)}
                          className={`w-5 h-5 mt-0.5 appearance-none rounded-full cursor-pointer border-[2px] border-black`}
                        />
                        {selectedAnswerL1 === option && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] bg-[#0d9488] rounded-full pointer-events-none"></div>
                        )}
                      </div>
                      <label htmlFor={`listening-q1-option-${index}`} className="font-['Inter',_sans-serif] text-gray-800 cursor-pointer leading-relaxed text-lg">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Volume Control Dropdown */}
        <VolumeControl isOpen={isVolumeOpen} onClose={closeVolume} buttonRef={volumeButtonRef} />
      </div>
    );
  };

  // Listening Question 2 Screen
  const ListeningQuestion2Screen = () => {
    const [selectedAnswerL2, setSelectedAnswerL2] = useState<string | null>(null);

    const answerOptions = [
      "I nearly missed the bus.",
      "Every 30 minutes.",
      "I can help you find it.",
      "I'll take the subway instead."
    ];

    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
        {/* Top Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowListeningQuestion2(false);
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
            <button 
              ref={volumeButtonRef}
              onClick={toggleVolume}
              className={`flex items-center gap-3 rounded-lg px-5 py-2 transition-colors ${
                isVolumeOpen 
                  ? 'bg-white border border-[#0A6068] hover:bg-gray-50' 
                  : 'bg-[#0A6068] border border-white hover:bg-[#084d52]'
              }`}
            >
              <span className={`font-['Inter',_sans-serif] font-semibold text-base ${
                isVolumeOpen ? 'text-[#0A6068]' : 'text-white'
              }`}>Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill={isVolumeOpen ? '#0A6068' : 'white'}>
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowListeningQuestion2(false);
                setShowListeningQuestion1(true);
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
                setShowListeningQuestion2(false);
                setShowListeningQuestion3(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Tab with Question number */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-8 py-3">
            <div className="flex gap-8">
              <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
                Listening
              </div>
              <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
                Question 2 of 18
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-8 overflow-auto bg-white border border-black">
          <h2 className="text-3xl font-['Inter',_sans-serif] font-bold text-gray-800 mb-8 text-center">Choose the best response.</h2>
          
          <div className="max-w-5xl ml-auto mr-[12%]">
            <div className="flex gap-16 items-start mt-12">
              {/* Left side - Image */}
              <div className="flex-shrink-0">
                <div className="w-96 h-96 bg-white rounded-lg overflow-hidden">
                  <ImageWithFallback 
                    src="figma:asset/e6e44b102681fb9e4b0935b0297fb5945a6c9025.png" 
                    alt="Professional man"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Right side - Options */}
              <div className="flex-1 max-w-xl mt-8">
                <div className="space-y-6">
                  {answerOptions.map((option, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="relative flex-shrink-0">
                        <input
                          type="radio"
                          id={`listening-q2-option-${index}`}
                          name="listening-q2"
                          value={option}
                          checked={selectedAnswerL2 === option}
                          onChange={() => setSelectedAnswerL2(option)}
                          className={`w-5 h-5 mt-0.5 appearance-none rounded-full cursor-pointer border-[2px] border-black`}
                        />
                        {selectedAnswerL2 === option && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] bg-[#0d9488] rounded-full pointer-events-none"></div>
                        )}
                      </div>
                      <label htmlFor={`listening-q2-option-${index}`} className="font-['Inter',_sans-serif] text-gray-800 cursor-pointer leading-relaxed text-lg">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Volume Control Dropdown */}
        <VolumeControl isOpen={isVolumeOpen} onClose={closeVolume} buttonRef={volumeButtonRef} />
      </div>
    );
  };

  // Listening Question 3 Screen
  const ListeningQuestion3Screen = () => {
    const [selectedAnswerL3, setSelectedAnswerL3] = useState<string | null>(null);

    const answerOptions = [
      "Yes, you're allowed to do that.",
      "Use the convenient chat feature.",
      "No, I don't mind.",
      "They provide good service."
    ];

    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
        {/* Top Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowListeningQuestion3(false);
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
            <button 
              ref={volumeButtonRef}
              onClick={toggleVolume}
              className={`flex items-center gap-3 rounded-lg px-5 py-2 transition-colors ${
                isVolumeOpen 
                  ? 'bg-white border border-[#0A6068] hover:bg-gray-50' 
                  : 'bg-[#0A6068] border border-white hover:bg-[#084d52]'
              }`}
            >
              <span className={`font-['Inter',_sans-serif] font-semibold text-base ${
                isVolumeOpen ? 'text-[#0A6068]' : 'text-white'
              }`}>Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill={isVolumeOpen ? '#0A6068' : 'white'}>
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowListeningQuestion3(false);
                setShowListeningQuestion2(true);
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
                setShowListeningQuestion3(false);
                setShowListeningQuestion4(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Tab with Question number */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-8 py-3">
            <div className="flex gap-8">
              <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
                Listening
              </div>
              <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
                Question 3 of 18
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-8 overflow-auto bg-white border border-black">
          <h2 className="text-3xl font-['Inter',_sans-serif] font-bold text-gray-800 mb-8 text-center">Choose the best response.</h2>
          
          <div className="max-w-5xl ml-auto mr-[12%]">
            <div className="flex gap-16 items-start mt-12">
              {/* Left side - Image */}
              <div className="flex-shrink-0">
                <div className="w-96 h-96 bg-white rounded-lg overflow-hidden border border-gray-300">
                  <ImageWithFallback 
                    src="figma:asset/761cc24661c0a5be83b157554a227b1138189dbd.png" 
                    alt="Professional woman"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Right side - Options */}
              <div className="flex-1 max-w-xl mt-8">
                <div className="space-y-6">
                  {answerOptions.map((option, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="relative flex-shrink-0">
                        <input
                          type="radio"
                          id={`listening-q3-option-${index}`}
                          name="listening-q3"
                          value={option}
                          checked={selectedAnswerL3 === option}
                          onChange={() => setSelectedAnswerL3(option)}
                          className={`w-5 h-5 mt-0.5 appearance-none rounded-full cursor-pointer border-[2px] border-black`}
                        />
                        {selectedAnswerL3 === option && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] bg-[#0d9488] rounded-full pointer-events-none"></div>
                        )}
                      </div>
                      <label htmlFor={`listening-q3-option-${index}`} className="font-['Inter',_sans-serif] text-gray-800 cursor-pointer leading-relaxed text-lg">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Volume Control Dropdown */}
        <VolumeControl isOpen={isVolumeOpen} onClose={closeVolume} buttonRef={volumeButtonRef} />
      </div>
    );
  };

  // Listening Question 4 Screen
  const ListeningQuestion4Screen = () => {
    const [selectedAnswerL4, setSelectedAnswerL4] = useState<string | null>(null);

    const answerOptions = [
      "Oh, that's too early.",
      "How about tomorrow night then?",
      "She arrived this afternoon.",
      "No, that's not necessary."
    ];

    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
        {/* Top Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowListeningQuestion4(false);
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
            <button 
              className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => setShowVolumeModal(true)}
            >
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowListeningQuestion4(false);
                setShowListeningQuestion3(true);
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
                setShowListeningQuestion4(false);
                setShowListeningQuestion5(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Tab with Question number */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-8 py-3">
            <div className="flex gap-8">
              <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
                Listening
              </div>
              <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
                Question 4 of 18
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-8 overflow-auto bg-white border border-black">
          <h2 className="text-3xl font-['Inter',_sans-serif] font-bold text-gray-800 mb-8 text-center">Choose the best response.</h2>
          
          <div className="max-w-5xl ml-auto mr-[12%]">
            <div className="flex gap-16 items-start mt-12">
              {/* Left side - Image */}
              <div className="flex-shrink-0">
                <div className="w-96 h-96 bg-white rounded-lg overflow-hidden border border-gray-300">
                  <ImageWithFallback 
                    src="figma:asset/106c05c8ba610dce0c795a9263ccd84ed5cd1ad7.png" 
                    alt="Professional woman"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Right side - Options */}
              <div className="flex-1 max-w-xl mt-8">
                <div className="space-y-6">
                  {answerOptions.map((option, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="relative flex-shrink-0">
                        <input
                          type="radio"
                          id={`listening-q4-option-${index}`}
                          name="listening-q4"
                          value={option}
                          checked={selectedAnswerL4 === option}
                          onChange={() => setSelectedAnswerL4(option)}
                          className={`w-5 h-5 mt-0.5 appearance-none rounded-full cursor-pointer border-[2px] border-black`}
                        />
                        {selectedAnswerL4 === option && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] bg-[#0d9488] rounded-full pointer-events-none"></div>
                        )}
                      </div>
                      <label htmlFor={`listening-q4-option-${index}`} className="font-['Inter',_sans-serif] text-gray-800 cursor-pointer leading-relaxed text-lg">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Listening Question 5 Screen
  const ListeningQuestion5Screen = () => {
    const [selectedAnswerL5, setSelectedAnswerL5] = useState<string | null>(null);

    const answerOptions = [
      "No, it's my package.",
      "It's just around the corner!",
      "I think he's come home already.",
      "Let's check the schedule online."
    ];

    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
        {/* Top Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowListeningQuestion5(false);
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
            <button 
              className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => setShowVolumeModal(true)}
            >
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowListeningQuestion5(false);
                setShowListeningQuestion4(true);
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
                setShowListeningQuestion5(false);
                setShowListeningQuestion6(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Tab with Question number */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-8 py-3">
            <div className="flex gap-8">
              <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
                Listening
              </div>
              <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
                Question 5 of 18
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-8 overflow-auto bg-white border border-black">
          <h2 className="text-3xl font-['Inter',_sans-serif] font-bold text-gray-800 mb-8 text-center">Choose the best response.</h2>
          
          <div className="max-w-5xl ml-auto mr-[12%]">
            <div className="flex gap-16 items-start mt-12">
              {/* Left side - Image */}
              <div className="flex-shrink-0">
                <div className="w-96 h-96 bg-white rounded-lg overflow-hidden border border-gray-300">
                  <ImageWithFallback 
                    src="figma:asset/87f17a73bd8b0e1ebeb8ca5d5f1270d6c6199407.png" 
                    alt="Professional man"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Right side - Options */}
              <div className="flex-1 max-w-xl mt-8">
                <div className="space-y-6">
                  {answerOptions.map((option, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="relative flex-shrink-0">
                        <input
                          type="radio"
                          id={`listening-q5-option-${index}`}
                          name="listening-q5"
                          value={option}
                          checked={selectedAnswerL5 === option}
                          onChange={() => setSelectedAnswerL5(option)}
                          className={`w-5 h-5 mt-0.5 appearance-none rounded-full cursor-pointer border-[2px] border-black`}
                        />
                        {selectedAnswerL5 === option && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] bg-[#0d9488] rounded-full pointer-events-none"></div>
                        )}
                      </div>
                      <label htmlFor={`listening-q5-option-${index}`} className="font-['Inter',_sans-serif] text-gray-800 cursor-pointer leading-relaxed text-lg">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Listening Question 6 Screen
  const ListeningQuestion6Screen = () => {
    const [selectedAnswerL6, setSelectedAnswerL6] = useState<string | null>(null);

    const answerOptions = [
      "I can help you with that.",
      "You don't need any more information.",
      "You have a lot of questions, don't you?",
      "You haven't given me your number yet."
    ];

    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
        {/* Top Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowListeningQuestion6(false);
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
            <button 
              className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => setShowVolumeModal(true)}
            >
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowListeningQuestion6(false);
                setShowListeningQuestion5(true);
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
                setShowListeningQuestion6(false);
                setShowListeningQuestion7(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Tab with Question number */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-8 py-3">
            <div className="flex gap-8">
              <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
                Listening
              </div>
              <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
                Question 6 of 18
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-8 overflow-auto bg-white border border-black">
          <h2 className="text-3xl font-['Inter',_sans-serif] font-bold text-gray-800 mb-8 text-center">Choose the best response.</h2>
          
          <div className="max-w-5xl ml-auto mr-[12%]">
            <div className="flex gap-16 items-start mt-12">
              {/* Left side - Image */}
              <div className="flex-shrink-0">
                <div className="w-96 h-96 bg-white rounded-lg overflow-hidden border border-gray-300">
                  <ImageWithFallback 
                    src="figma:asset/024ebf1fdfffc719b343309ab50a05ed0dccca60.png" 
                    alt="Professional woman"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Right side - Options */}
              <div className="flex-1 max-w-xl mt-8">
                <div className="space-y-6">
                  {answerOptions.map((option, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="relative flex-shrink-0">
                        <input
                          type="radio"
                          id={`listening-q6-option-${index}`}
                          name="listening-q6"
                          value={option}
                          checked={selectedAnswerL6 === option}
                          onChange={() => setSelectedAnswerL6(option)}
                          className={`w-5 h-5 mt-0.5 appearance-none rounded-full cursor-pointer border-[2px] border-black`}
                        />
                        {selectedAnswerL6 === option && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] bg-[#0d9488] rounded-full pointer-events-none"></div>
                        )}
                      </div>
                      <label htmlFor={`listening-q6-option-${index}`} className="font-['Inter',_sans-serif] text-gray-800 cursor-pointer leading-relaxed text-lg">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Listening Question 7 Screen
  const ListeningQuestion7Screen = () => {
    const [selectedAnswerL7, setSelectedAnswerL7] = useState<string | null>(null);

    const answerOptions = [
      "Yes, there is a major power outage.",
      "Yes, it's under renovation.",
      "Yes, it's closed all day on Sunday.",
      "Yes, they're having a huge sale."
    ];

    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
        {/* Top Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowListeningQuestion7(false);
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
            <button 
              className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => setShowVolumeModal(true)}
            >
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowListeningQuestion7(false);
                setShowListeningQuestion6(true);
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
                setShowListeningQuestion7(false);
                setShowListeningQuestion8(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Tab with Question number */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-8 py-3">
            <div className="flex gap-8">
              <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
                Listening
              </div>
              <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
                Question 7 of 18
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-8 overflow-auto bg-white border border-black">
          <h2 className="text-3xl font-['Inter',_sans-serif] font-bold text-gray-800 mb-8 text-center">Choose the best response.</h2>
          
          <div className="max-w-5xl ml-auto mr-[12%]">
            <div className="flex gap-16 items-start mt-12">
              {/* Left side - Image */}
              <div className="flex-shrink-0">
                <div className="w-96 h-96 bg-white rounded-lg overflow-hidden border border-gray-300">
                  <ImageWithFallback 
                    src="figma:asset/6088c89895169cfa510855d17be58c1aff14624b.png" 
                    alt="Professional woman"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Right side - Options */}
              <div className="flex-1 max-w-xl mt-8">
                <div className="space-y-6">
                  {answerOptions.map((option, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="relative flex-shrink-0">
                        <input
                          type="radio"
                          id={`listening-q7-option-${index}`}
                          name="listening-q7"
                          value={option}
                          checked={selectedAnswerL7 === option}
                          onChange={() => setSelectedAnswerL7(option)}
                          className={`w-5 h-5 mt-0.5 appearance-none rounded-full cursor-pointer border-[2px] border-black`}
                        />
                        {selectedAnswerL7 === option && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] bg-[#0d9488] rounded-full pointer-events-none"></div>
                        )}
                      </div>
                      <label htmlFor={`listening-q7-option-${index}`} className="font-['Inter',_sans-serif] text-gray-800 cursor-pointer leading-relaxed text-lg">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Listening Question 8 Screen
  const ListeningQuestion8Screen = () => {
    const [selectedAnswerL8, setSelectedAnswerL8] = useState<string | null>(null);

    const answerOptions = [
      "I overslept.",
      "No, not very well.",
      "Have you asked your professor?",
      "I forgot to look."
    ];

    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
        {/* Top Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowListeningQuestion8(false);
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
            <button 
              className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => setShowVolumeModal(true)}
            >
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowListeningQuestion8(false);
                setShowListeningQuestion7(true);
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
                setShowListeningQuestion8(false);
                setShowListeningModule2Intro(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Tab with Question number */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-8 py-3">
            <div className="flex gap-8">
              <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
                Listening
              </div>
              <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
                Question 8 of 18
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-8 overflow-auto bg-white border border-black">
          <h2 className="text-3xl font-['Inter',_sans-serif] font-bold text-gray-800 mb-8 text-center">Choose the best response.</h2>
          
          <div className="max-w-5xl ml-auto mr-[12%]">
            <div className="flex gap-16 items-start mt-12">
              {/* Left side - Image */}
              <div className="flex-shrink-0">
                <div className="w-96 h-96 bg-white rounded-lg overflow-hidden border border-gray-300">
                  <ImageWithFallback 
                    src="figma:asset/4c55e2f8f9b3c54696a79ebe79ec1909ee5eb814.png" 
                    alt="Professional man"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Right side - Options */}
              <div className="flex-1 max-w-xl mt-8">
                <div className="space-y-6">
                  {answerOptions.map((option, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="relative flex-shrink-0">
                        <input
                          type="radio"
                          id={`listening-q8-option-${index}`}
                          name="listening-q8"
                          value={option}
                          checked={selectedAnswerL8 === option}
                          onChange={() => setSelectedAnswerL8(option)}
                          className={`w-5 h-5 mt-0.5 appearance-none rounded-full cursor-pointer border-[2px] border-black`}
                        />
                        {selectedAnswerL8 === option && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] bg-[#0d9488] rounded-full pointer-events-none"></div>
                        )}
                      </div>
                      <label htmlFor={`listening-q8-option-${index}`} className="font-['Inter',_sans-serif] text-gray-800 cursor-pointer leading-relaxed text-lg">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Listening Module 2 Intro Screen - Conversation, Announcement, and Academic Talk
  const ListeningModule2IntroScreen = () => {
    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
        {/* Top Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowListeningModule2Intro(false);
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
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowListeningModule2Intro(false);
                setShowListeningQuestion8(true);
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Back</span>
            </button>
            
            {/* Begin Button */}
            <button 
              className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
              onClick={() => {
                setShowListeningModule2Intro(false);
                setShowListeningConversation(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Begin</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Tab with Section title */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-8 py-3">
            <div className="text-gray-700 font-['Inter',_sans-serif] font-bold">
              Listening
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex items-start justify-center p-8 overflow-auto bg-white border border-black">
          <div className="max-w-4xl w-full">
            <h1 className="text-3xl font-bold font-['Inter',_sans-serif] text-gray-800 mb-8">
              Conversation, Announcement, and Academic Talk
            </h1>
            
            <div className="space-y-6">
              <p className="text-gray-700 font-['Inter',_sans-serif] text-lg leading-relaxed">
                You will listen only one time and then answer questions.
              </p>
              
              <p className="text-gray-700 font-['Inter',_sans-serif] text-lg leading-relaxed">
                In an actual test, the clock will indicate how much time you have to answer.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Listening Conversation Screen
  const ListeningConversationScreen = () => {
    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
        {/* Top Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowListeningConversation(false);
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
            <button 
              className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => setShowVolumeModal(true)}
            >
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowListeningConversation(false);
                setShowListeningModule2Intro(true);
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
                setShowListeningConversation(false);
                setShowListeningQuestion9(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Tab with Section title */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-8 py-3">
            <div className="text-gray-700 font-['Inter',_sans-serif] font-bold">
              Listening
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col p-8 overflow-auto bg-white border border-black">
          <h1 className="text-3xl font-bold font-['Inter',_sans-serif] text-gray-800 mb-8 text-center mt-4">
            Listen to a conversation.
          </h1>
          
          {/* Conversation Image */}
          <div className="flex-1 flex justify-center items-center">
            <div className="w-96 h-96 flex items-center justify-center">
              <ImageWithFallback 
                src="figma:asset/8ab5a0faa349e01b474fec2471b80ae5d15ee9c2.png" 
                alt="Two people having a conversation"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Listening Question 9 Screen
  const ListeningQuestion9Screen = () => {
    const [selectedAnswerL9, setSelectedAnswerL9] = useState<string | null>(null);

    const answerOptions = [
      "See a play",
      "Change her clothes",
      "Go shopping",
      "Eat dinner"
    ];

    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
        {/* Top Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowListeningQuestion9(false);
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
            <button 
              className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => setShowVolumeModal(true)}
            >
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowListeningQuestion9(false);
                setShowListeningConversation(true);
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
                setShowListeningQuestion9(false);
                setShowListeningQuestion10(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Tab with Question number */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-8 py-3">
            <div className="flex gap-8">
              <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
                Listening
              </div>
              <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
                Question 9 of 18
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-8 overflow-auto bg-white border border-black">
          <div className="max-w-5xl ml-auto mr-[12%]">
            <div className="flex gap-16 items-start mt-12">
              {/* Left side - Image */}
              <div className="flex-shrink-0">
                <div className="w-96 h-96 bg-white rounded-lg overflow-hidden">
                  <ImageWithFallback 
                    src="figma:asset/6afae4c5ed26e9701533630f2d06ae8fbfc84e8a.png" 
                    alt="Two people talking"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Right side - Options */}
              <div className="flex-1 max-w-xl mt-8">
                <h2 className="text-xl font-semibold font-['Inter',_sans-serif] text-gray-800 mb-6">What does the woman imply that she was about to do?</h2>
                <div className="space-y-6">
                  {answerOptions.map((option, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="relative flex-shrink-0">
                        <input
                          type="radio"
                          id={`listening-q9-option-${index}`}
                          name="listening-q9"
                          value={option}
                          checked={selectedAnswerL9 === option}
                          onChange={() => setSelectedAnswerL9(option)}
                          className={`w-5 h-5 mt-0.5 appearance-none rounded-full cursor-pointer border-[2px] border-black`}
                        />
                        {selectedAnswerL9 === option && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] bg-[#0d9488] rounded-full pointer-events-none"></div>
                        )}
                      </div>
                      <label htmlFor={`listening-q9-option-${index}`} className="font-['Inter',_sans-serif] text-gray-800 cursor-pointer leading-relaxed text-lg">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Listening Question 10 Screen
  const ListeningQuestion10Screen = () => {
    const [selectedAnswerL10, setSelectedAnswerL10] = useState<string | null>(null);

    const answerOptions = [
      "He forgot what the woman wanted him to buy.",
      "He forgot about the timing of their plans.",
      "He forgot what they were going to eat for dinner.",
      "He forgot to buy salmon and salad at the supermarket."
    ];

    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
        {/* Top Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowListeningQuestion10(false);
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
            <button 
              className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => setShowVolumeModal(true)}
            >
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowListeningQuestion10(false);
                setShowListeningQuestion9(true);
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
                setShowListeningQuestion10(false);
                setShowListeningConversation2(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Tab with Question number */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-8 py-3">
            <div className="flex gap-8">
              <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
                Listening
              </div>
              <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
                Question 10 of 18
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-8 overflow-auto bg-white border border-black">
          <div className="max-w-5xl ml-auto mr-[12%]">
            <div className="flex gap-16 items-start mt-12">
              {/* Left side - Image */}
              <div className="flex-shrink-0">
                <div className="w-96 h-96 bg-white rounded-lg overflow-hidden">
                  <ImageWithFallback 
                    src="figma:asset/ce0ff74f78d369c8fda983844c33ae9d0523ceb8.png" 
                    alt="Two people talking"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Right side - Options */}
              <div className="flex-1 max-w-xl mt-8">
                <h2 className="text-xl font-semibold font-['Inter',_sans-serif] text-gray-800 mb-6">Why does the man say "I'd forget my head if it wasn't screwed on"?</h2>
                <div className="space-y-6">
                  {answerOptions.map((option, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="relative flex-shrink-0">
                        <input
                          type="radio"
                          id={`listening-q10-option-${index}`}
                          name="listening-q10"
                          value={option}
                          checked={selectedAnswerL10 === option}
                          onChange={() => setSelectedAnswerL10(option)}
                          className={`w-5 h-5 mt-0.5 appearance-none rounded-full cursor-pointer border-[2px] border-black`}
                        />
                        {selectedAnswerL10 === option && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] bg-[#0d9488] rounded-full pointer-events-none"></div>
                        )}
                      </div>
                      <label htmlFor={`listening-q10-option-${index}`} className="font-['Inter',_sans-serif] text-gray-800 cursor-pointer leading-relaxed text-lg">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Listening Conversation 2 Screen
  const ListeningConversation2Screen = () => {
    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
        {/* Top Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowListeningConversation2(false);
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
            <button 
              className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => setShowVolumeModal(true)}
            >
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowListeningConversation2(false);
                setShowListeningQuestion10(true);
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
                setShowListeningConversation2(false);
                setShowListeningQuestion11(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Tab with Section title */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-8 py-3">
            <div className="text-gray-700 font-['Inter',_sans-serif] font-bold">
              Listening
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col p-8 overflow-auto bg-white border border-black">
          <h1 className="text-3xl font-bold font-['Inter',_sans-serif] text-gray-800 mb-8 text-center mt-4">
            Listen to a conversation.
          </h1>
          
          {/* Conversation Image */}
          <div className="flex-1 flex justify-center items-center">
            <div className="w-96 h-96 flex items-center justify-center">
              <ImageWithFallback 
                src="figma:asset/8a3602403236fbaf317e334c954d119fb2258219.png" 
                alt="Two people having a conversation"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Listening Question 11 Screen
  const ListeningQuestion11Screen = () => {
    const [selectedAnswerL11, setSelectedAnswerL11] = useState<string | null>(null);

    const answerOptions = [
      "An air-conditioner is leaking.",
      "A room is too hot.",
      "An elevator needs maintenance.",
      "A window will not open."
    ];

    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
        {/* Top Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowListeningQuestion11(false);
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
            <button 
              className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => setShowVolumeModal(true)}
            >
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowListeningQuestion11(false);
                setShowListeningConversation2(true);
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
                setShowListeningQuestion11(false);
                setShowListeningQuestion12(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Tab with Question number */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-8 py-3">
            <div className="flex gap-8">
              <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
                Listening
              </div>
              <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
                Question 11 of 18
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-8 overflow-auto bg-white border border-black">
          <div className="max-w-5xl ml-auto mr-[12%]">
            <div className="flex gap-16 items-start mt-12">
              {/* Left side - Image */}
              <div className="flex-shrink-0">
                <div className="w-96 h-96 bg-white rounded-lg overflow-hidden">
                  <ImageWithFallback 
                    src="figma:asset/13659b077a6a6ad6e26a1ad0fdd7981f1a18954f.png" 
                    alt="Two people talking"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Right side - Options */}
              <div className="flex-1 max-w-xl mt-8">
                <h2 className="text-xl font-semibold font-['Inter',_sans-serif] text-gray-800 mb-6">Why did the woman call a technician?</h2>
                <div className="space-y-6">
                  {answerOptions.map((option, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="relative flex-shrink-0">
                        <input
                          type="radio"
                          id={`listening-q11-option-${index}`}
                          name="listening-q11"
                          value={option}
                          checked={selectedAnswerL11 === option}
                          onChange={() => setSelectedAnswerL11(option)}
                          className={`w-5 h-5 mt-0.5 appearance-none rounded-full cursor-pointer border-[2px] border-black`}
                        />
                        {selectedAnswerL11 === option && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] bg-[#0d9488] rounded-full pointer-events-none"></div>
                        )}
                      </div>
                      <label htmlFor={`listening-q11-option-${index}`} className="font-['Inter',_sans-serif] text-gray-800 cursor-pointer leading-relaxed text-lg">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Listening Question 12 Screen
  const ListeningQuestion12Screen = () => {
    const [selectedAnswerL12, setSelectedAnswerL12] = useState<string | null>(null);

    const answerOptions = [
      "Finish an assignment early",
      "Wait for a service agent",
      "Open a door",
      "Take a break early"
    ];

    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
        {/* Top Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowListeningQuestion12(false);
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
            <button 
              className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => setShowVolumeModal(true)}
            >
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowListeningQuestion12(false);
                setShowListeningQuestion11(true);
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
                setShowListeningQuestion12(false);
                setShowListeningAnnouncement(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Tab with Question number */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-8 py-3">
            <div className="flex gap-8">
              <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
                Listening
              </div>
              <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
                Question 12 of 18
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-8 overflow-auto bg-white border border-black">
          <div className="max-w-5xl ml-auto mr-[12%]">
            <div className="flex gap-16 items-start mt-12">
              {/* Left side - Image */}
              <div className="flex-shrink-0">
                <div className="w-96 h-96 bg-white rounded-lg overflow-hidden">
                  <ImageWithFallback 
                    src="figma:asset/47697f6ab52bf594bc282812f5dd72d75a3bf242.png" 
                    alt="Two people talking"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Right side - Options */}
              <div className="flex-1 max-w-xl mt-8">
                <h2 className="text-xl font-semibold font-['Inter',_sans-serif] text-gray-800 mb-6">What does the woman suggest the man do?</h2>
                <div className="space-y-6">
                  {answerOptions.map((option, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="relative flex-shrink-0">
                        <input
                          type="radio"
                          id={`listening-q12-option-${index}`}
                          name="listening-q12"
                          value={option}
                          checked={selectedAnswerL12 === option}
                          onChange={() => setSelectedAnswerL12(option)}
                          className={`w-5 h-5 mt-0.5 appearance-none rounded-full cursor-pointer border-[2px] border-black`}
                        />
                        {selectedAnswerL12 === option && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] bg-[#0d9488] rounded-full pointer-events-none"></div>
                        )}
                      </div>
                      <label htmlFor={`listening-q12-option-${index}`} className="font-['Inter',_sans-serif] text-gray-800 cursor-pointer leading-relaxed text-lg">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Listening Announcement Screen
  const ListeningAnnouncementScreen = () => {
    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
        {/* Top Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowListeningAnnouncement(false);
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
            <button 
              className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => setShowVolumeModal(true)}
            >
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowListeningAnnouncement(false);
                setShowListeningQuestion12(true);
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
                setShowListeningAnnouncement(false);
                setShowListeningQuestion13(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Tab with Section title */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-8 py-3">
            <div className="text-gray-700 font-['Inter',_sans-serif] font-bold">
              Listening
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col p-8 overflow-auto bg-white border border-black">
          <h1 className="text-3xl font-bold font-['Inter',_sans-serif] text-gray-800 mb-8 text-center mt-4">
            Listen to an announcement in a classroom.
          </h1>
          
          {/* Announcement Image */}
          <div className="flex-1 flex justify-center items-center">
            <div className="w-96 h-96 flex items-center justify-center">
              <ImageWithFallback 
                src="figma:asset/a1c69f0392872fa2e403399482f99b4b6e513854.png" 
                alt="Instructor making an announcement"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Listening Question 13 Screen
  const ListeningQuestion13Screen = () => {
    const [selectedAnswerL13, setSelectedAnswerL13] = useState<string | null>(null);

    const answerOptions = [
      "A guest lecture",
      "A different location for a class",
      "Requirements for a class",
      "A new university science course"
    ];

    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
        {/* Top Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowListeningQuestion13(false);
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
            <button 
              className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => setShowVolumeModal(true)}
            >
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowListeningQuestion13(false);
                setShowListeningAnnouncement(true);
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
                setShowListeningQuestion13(false);
                setShowListeningQuestion14(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Tab with Question number */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-8 py-3">
            <div className="flex gap-8">
              <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
                Listening
              </div>
              <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
                Question 13 of 18
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-8 overflow-auto bg-white border border-black">
          <div className="max-w-5xl ml-auto mr-[12%]">
            <div className="flex gap-16 items-start mt-12">
              {/* Left side - Image */}
              <div className="flex-shrink-0">
                <div className="w-96 h-96 bg-white rounded-lg overflow-hidden">
                  <ImageWithFallback 
                    src="figma:asset/fb06c2fe27d261fd1b71284022aecb3403ddb56e.png" 
                    alt="Instructor"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Right side - Options */}
              <div className="flex-1 max-w-xl mt-8">
                <h2 className="text-xl font-semibold font-['Inter',_sans-serif] text-gray-800 mb-6">What is the announcement about?</h2>
                <div className="space-y-6">
                  {answerOptions.map((option, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="relative flex-shrink-0">
                        <input
                          type="radio"
                          id={`listening-q13-option-${index}`}
                          name="listening-q13"
                          value={option}
                          checked={selectedAnswerL13 === option}
                          onChange={() => setSelectedAnswerL13(option)}
                          className={`w-5 h-5 mt-0.5 appearance-none rounded-full cursor-pointer border-[2px] border-black`}
                        />
                        {selectedAnswerL13 === option && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] bg-[#0d9488] rounded-full pointer-events-none"></div>
                        )}
                      </div>
                      <label htmlFor={`listening-q13-option-${index}`} className="font-['Inter',_sans-serif] text-gray-800 cursor-pointer leading-relaxed text-lg">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Listening Question 14 Screen
  const ListeningQuestion14Screen = () => {
    const [selectedAnswerL14, setSelectedAnswerL14] = useState<string | null>(null);

    const answerOptions = [
      "To encourage students to read her work",
      "To indicate why she was invited to the university",
      "To compare her to other invited experts",
      "To explain why students should arrive early"
    ];

    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
        {/* Top Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowListeningQuestion14(false);
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
            <button 
              className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => setShowVolumeModal(true)}
            >
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowListeningQuestion14(false);
                setShowListeningQuestion13(true);
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
                setShowListeningQuestion14(false);
                setShowListeningPodcast(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Tab with Question number */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-8 py-3">
            <div className="flex gap-8">
              <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
                Listening
              </div>
              <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
                Question 14 of 18
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-8 overflow-auto bg-white border border-black">
          <div className="max-w-5xl ml-auto mr-[12%]">
            <div className="flex gap-16 items-start mt-12">
              {/* Left side - Image */}
              <div className="flex-shrink-0">
                <div className="w-96 h-96 bg-white rounded-lg overflow-hidden">
                  <ImageWithFallback 
                    src="figma:asset/efcab72f017251c00131ff0a1420fc0c66f12fd8.png" 
                    alt="Instructor"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Right side - Options */}
              <div className="flex-1 max-w-xl mt-8">
                <h2 className="text-xl font-semibold font-['Inter',_sans-serif] text-gray-800 mb-6">Why does the professor mention Dr. Palmer's popularity?</h2>
                <div className="space-y-6">
                  {answerOptions.map((option, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="relative flex-shrink-0">
                        <input
                          type="radio"
                          id={`listening-q14-option-${index}`}
                          name="listening-q14"
                          value={option}
                          checked={selectedAnswerL14 === option}
                          onChange={() => setSelectedAnswerL14(option)}
                          className={`w-5 h-5 mt-0.5 appearance-none rounded-full cursor-pointer border-[2px] border-black`}
                        />
                        {selectedAnswerL14 === option && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] bg-[#0d9488] rounded-full pointer-events-none"></div>
                        )}
                      </div>
                      <label htmlFor={`listening-q14-option-${index}`} className="font-['Inter',_sans-serif] text-gray-800 cursor-pointer leading-relaxed text-lg">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Listening Podcast Screen
  const ListeningPodcastScreen = () => {
    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
        {/* Top Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowListeningPodcast(false);
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
            <button 
              className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => setShowVolumeModal(true)}
            >
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowListeningPodcast(false);
                setShowListeningQuestion14(true);
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
                setShowListeningPodcast(false);
                setShowListeningQuestion15(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Tab with Section title */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-8 py-3">
            <div className="text-gray-700 font-['Inter',_sans-serif] font-bold">
              Listening
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col p-8 overflow-auto bg-white border border-black">
          <h1 className="text-3xl font-bold font-['Inter',_sans-serif] text-gray-800 mb-8 text-center mt-4">
            Listen to a talk on a podcast about psychology.
          </h1>
          
          {/* Podcast Image */}
          <div className="flex-1 flex justify-center items-center">
            <div className="w-96 h-96 flex items-center justify-center">
              <ImageWithFallback 
                src="figma:asset/66701e530788c1c664d05a246d0567f5889c51d3.png" 
                alt="Woman in purple sweater"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Listening Question 15 Screen
  const ListeningQuestion15Screen = () => {
    const [selectedAnswerL15, setSelectedAnswerL15] = useState<string | null>(null);

    const answerOptions = [
      "How psychologists study attention",
      "How to keep the mind focused",
      "Two types of fascination",
      "The benefits of hard fascination"
    ];

    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
        {/* Top Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowListeningQuestion15(false);
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
            <button 
              className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => setShowVolumeModal(true)}
            >
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowListeningQuestion15(false);
                setShowListeningPodcast(true);
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
                setShowListeningQuestion15(false);
                setShowListeningQuestion16(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Tab with Question number */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-8 py-3">
            <div className="flex gap-8">
              <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
                Listening
              </div>
              <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
                Question 15 of 18
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-8 overflow-auto bg-white border border-black">
          <div className="max-w-5xl ml-auto mr-[12%]">
            <div className="flex gap-16 items-start mt-12">
              {/* Left side - Image */}
              <div className="flex-shrink-0">
                <div className="w-96 h-96 bg-white rounded-lg overflow-hidden">
                  <ImageWithFallback 
                    src="figma:asset/4e77653c981388d7af50fd23fa950dabf10c0022.png" 
                    alt="Woman in purple sweater"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Right side - Options */}
              <div className="flex-1 max-w-xl mt-8">
                <h2 className="text-xl font-semibold font-['Inter',_sans-serif] text-gray-800 mb-6">What is the topic of the talk?</h2>
                <div className="space-y-6">
                  {answerOptions.map((option, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="relative flex-shrink-0">
                        <input
                          type="radio"
                          id={`listening-q15-option-${index}`}
                          name="listening-q15"
                          value={option}
                          checked={selectedAnswerL15 === option}
                          onChange={() => setSelectedAnswerL15(option)}
                          className={`w-5 h-5 mt-0.5 appearance-none rounded-full cursor-pointer border-[2px] border-black`}
                        />
                        {selectedAnswerL15 === option && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] bg-[#0d9488] rounded-full pointer-events-none"></div>
                        )}
                      </div>
                      <label htmlFor={`listening-q15-option-${index}`} className="font-['Inter',_sans-serif] text-gray-800 cursor-pointer leading-relaxed text-lg">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Listening Question 16 Screen
  const ListeningQuestion16Screen = () => {
    const [selectedAnswerL16, setSelectedAnswerL16] = useState<string | null>(null);

    const answerOptions = [
      "To compare different types of movies",
      "To introduce a concept in psychology",
      "To explain how movies affect emotions",
      "To encourage listeners to watch more movies"
    ];

    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
        {/* Top Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowListeningQuestion16(false);
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
            <button 
              className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => setShowVolumeModal(true)}
            >
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowListeningQuestion16(false);
                setShowListeningQuestion15(true);
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
                setShowListeningQuestion16(false);
                setShowListeningQuestion17(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Tab with Question number */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-8 py-3">
            <div className="flex gap-8">
              <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
                Listening
              </div>
              <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
                Question 16 of 18
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-8 overflow-auto bg-white border border-black">
          <div className="max-w-5xl ml-auto mr-[12%]">
            <div className="flex gap-16 items-start mt-12">
              {/* Left side - Image */}
              <div className="flex-shrink-0">
                <div className="w-96 h-96 bg-white rounded-lg overflow-hidden">
                  <ImageWithFallback 
                    src="figma:asset/09ba679e2cd7019b60211c3199dc7fa58f690120.png" 
                    alt="Woman in purple sweater"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Right side - Options */}
              <div className="flex-1 max-w-xl mt-8">
                <h2 className="text-xl font-semibold font-['Inter',_sans-serif] text-gray-800 mb-6">Why does the speaker mention a movie?</h2>
                <div className="space-y-6">
                  {answerOptions.map((option, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="relative flex-shrink-0">
                        <input
                          type="radio"
                          id={`listening-q16-option-${index}`}
                          name="listening-q16"
                          value={option}
                          checked={selectedAnswerL16 === option}
                          onChange={() => setSelectedAnswerL16(option)}
                          className={`w-5 h-5 mt-0.5 appearance-none rounded-full cursor-pointer border-[2px] border-black`}
                        />
                        {selectedAnswerL16 === option && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] bg-[#0d9488] rounded-full pointer-events-none"></div>
                        )}
                      </div>
                      <label htmlFor={`listening-q16-option-${index}`} className="font-['Inter',_sans-serif] text-gray-800 cursor-pointer leading-relaxed text-lg">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Listening Question 17 Screen
  const ListeningQuestion17Screen = () => {
    const [selectedAnswerL17, setSelectedAnswerL17] = useState<string | null>(null);

    const answerOptions = [
      "It is similar to her experience watching a good movie.",
      "Her mind has space for thoughts unrelated to nature.",
      "She needs to put in special effort to stay focused on flowers and trees.",
      "She gets mental fatigue from her mind engaging in hard fascination."
    ];

    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
        {/* Top Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowListeningQuestion17(false);
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
            <button 
              className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => setShowVolumeModal(true)}
            >
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowListeningQuestion17(false);
                setShowListeningQuestion16(true);
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
                setShowListeningQuestion17(false);
                setShowListeningQuestion18(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Tab with Question number */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-8 py-3">
            <div className="flex gap-8">
              <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
                Listening
              </div>
              <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
                Question 17 of 18
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-8 overflow-auto bg-white border border-black">
          <div className="max-w-5xl ml-auto mr-[12%]">
            <div className="flex gap-16 items-start mt-12">
              {/* Left side - Image */}
              <div className="flex-shrink-0">
                <div className="w-96 h-96 bg-white rounded-lg overflow-hidden">
                  <ImageWithFallback 
                    src="figma:asset/54932e093e04cac6cac7aaabab49b2c98893a14f.png" 
                    alt="Woman in purple sweater"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Right side - Options */}
              <div className="flex-1 max-w-xl mt-8">
                <h2 className="text-xl font-semibold font-['Inter',_sans-serif] text-gray-800 mb-6">What does the speaker say about her walk in the park?</h2>
                <div className="space-y-6">
                  {answerOptions.map((option, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="relative flex-shrink-0">
                        <input
                          type="radio"
                          id={`listening-q17-option-${index}`}
                          name="listening-q17"
                          value={option}
                          checked={selectedAnswerL17 === option}
                          onChange={() => setSelectedAnswerL17(option)}
                          className={`w-5 h-5 mt-0.5 appearance-none rounded-full cursor-pointer border-[2px] border-black`}
                        />
                        {selectedAnswerL17 === option && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[14px] h-[14px] bg-[#0d9488] rounded-full pointer-events-none"></div>
                        )}
                      </div>
                      <label htmlFor={`listening-q17-option-${index}`} className="font-['Inter',_sans-serif] text-gray-800 cursor-pointer leading-relaxed text-lg">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Listening Question 18 Screen
  const ListeningQuestion18Screen = () => {
    const [selectedAnswerL18, setSelectedAnswerL18] = useState<string | null>(null);

    const answerOptions = [
      "It is involved in soft fascination.",
      "It leads to irritability and stress.",
      "It is easily tired from overuse.",
      "Its effect is unknown to psychologists."
    ];

    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
        {/* Top Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowListeningQuestion18(false);
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
            <button 
              className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => setShowVolumeModal(true)}
            >
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowListeningQuestion18(false);
                setShowListeningQuestion17(true);
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
                setShowListeningQuestion18(false);
                setShowListeningEndModule1(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Tab with Question number */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-8 py-3">
            <div className="flex gap-8">
              <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
                Listening
              </div>
              <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
                Question 18 of 18
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-8 overflow-auto bg-white border border-black">
          <div className="max-w-5xl ml-auto mr-[12%]">
            <div className="flex gap-16 items-start mt-12">
              {/* Left side - Image */}
              <div className="flex-shrink-0">
                <div className="w-96 h-96 bg-white rounded-lg overflow-hidden">
                  <ImageWithFallback 
                    src="figma:asset/1ea056cdd00efe83fc60681cea24b852bd1755a6.png" 
                    alt="Woman in purple sweater"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Right side - Options */}
              <div className="flex-1 max-w-xl mt-8">
                <h2 className="text-xl font-semibold font-['Inter',_sans-serif] text-gray-800 mb-6">What does the speaker say about Default Mode Network?</h2>
                <div className="space-y-6">
                  {answerOptions.map((option, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="relative flex-shrink-0">
                        <input
                          type="radio"
                          id={`listening-q18-option-${index}`}
                          name="listening-q18"
                          value={option}
                          checked={selectedAnswerL18 === option}
                          onChange={() => setSelectedAnswerL18(option)}
                          className={`w-5 h-5 mt-0.5 appearance-none rounded-full cursor-pointer border-[2px] border-black`}
                        />
                        {selectedAnswerL18 === option && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] bg-[#0d9488] rounded-full pointer-events-none"></div>
                        )}
                      </div>
                      <label htmlFor={`listening-q18-option-${index}`} className="font-['Inter',_sans-serif] text-gray-800 cursor-pointer leading-relaxed text-lg">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Listening End of Module 1 Screen
  const ListeningEndModule1Screen = () => {
    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
        {/* Top Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowListeningEndModule1(false);
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
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowListeningEndModule1(false);
                setShowListeningQuestion18(true);
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
                setShowListeningEndModule1(false);
                setShowListeningModule2(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Tab with Section title */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-8 py-3">
            <div className="text-gray-700 font-['Inter',_sans-serif] font-bold">
              Listening
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex items-center justify-center p-12 overflow-auto bg-white">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-['Inter',_sans-serif] font-bold text-black mb-8">
              End of Module 1
            </h1>
            
            <div className="space-y-6 text-gray-700 font-['Inter',_sans-serif] leading-relaxed">
              <p className="text-lg">This is the end of Module 1 of the Listening section.</p>
              
              <p className="text-lg">You will now begin Module 2.</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Listening Module 2 Screen
  const ListeningModule2Screen = () => {
    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
        {/* Top Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setShowListeningModule2(false);
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
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowListeningModule2(false);
                setShowListeningEndModule1(true);
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
                setShowListeningModule2(false);
                setShowListeningM2Q1(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Tab with Section title */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-8 py-3">
            <div className="text-gray-700 font-['Inter',_sans-serif] font-bold">
              Listening
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex items-center justify-center p-12 overflow-auto bg-white">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-['Inter',_sans-serif] font-bold text-black mb-8">
              Module 2
            </h1>
            
            <div className="space-y-6 text-gray-700 font-['Inter',_sans-serif] leading-relaxed">
              <p className="text-lg">In an actual test, the clock will show you how much time you have to complete each question.</p>
              
              <p className="text-lg">
                You can use <strong>Next</strong> to move to the next question.
              </p>
              
              <p className="text-lg">
                The first task is <strong>Listen and Choose a Response</strong>. In this task, you will listen to a sentence or question. You will then read four sentences and choose the option that is the best response.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

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

  // Read Notice Test Screen Component
  const ReadNoticeTestScreen = () => {
    const correctAnswer = "A bank";
    const answerOptions = [
      "An Internet provider",
      "A computer company", 
      "A paper company",
      "A bank"
    ];

    const handleAnswerSelect = (answer: string) => {
      setSelectedAnswer(answer);
    };

    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
        {/* Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
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
            <button className="flex items-center gap-3 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors">
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-base">Volume</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {/* Back Button */}
            <button 
              className="flex items-center gap-2 bg-[#0A6068] border border-white rounded-lg px-5 py-2 hover:bg-[#084d52] transition-colors"
              onClick={() => {
                setShowReadNoticeTest(false);
                setShowFillBlanksTest(true);
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
                setShowReadNoticeTest(false);
                setShowReadNoticeTest2(true);
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
                Question 11 of 20
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-hidden bg-white border border-black">
          <h1 className="text-3xl font-['Inter',_sans-serif] font-bold text-black py-8 text-center">Read a notice.</h1>
          
          <ResizableReadingLayout
            leftContent={
              <div className="border-[3px] border-black p-6 ml-12">
                <div className="border-2 border-black p-6">
                  <h2 className="text-2xl font-['Inter',_sans-serif] font-bold text-center mb-6">Municipal Charter</h2>
                  <p className="text-center font-['Inter',_sans-serif] font-medium mb-6">Sign up for paperless billing statements today.</p>
                  
                  <p className="font-['Inter',_sans-serif] leading-relaxed">
                    Safe, convenient, easy. Enroll in paperless billing to receive 
                    monthly savings account statements in an electronic PDF 
                    document. Access your Municipal Charter account through 
                    the mobile app and select account preferences in the upper 
                    right-hand corner to enroll.
                  </p>
                </div>
              </div>
            }
            rightContent={
              <>
                <h3 className="text-2xl font-['Inter',_sans-serif] font-bold text-black mb-10">What type of business issued the notice?</h3>
                
                <div className="space-y-6">
                  {answerOptions.map((option, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <input
                          type="radio"
                          id={`option-${index}`}
                          name="business-type"
                          value={option}
                          checked={selectedAnswer === option}
                          onChange={() => handleAnswerSelect(option)}
                          className="w-5 h-5 mt-0.5 appearance-none rounded-full cursor-pointer border-[2px] border-black"
                        />
                        {selectedAnswer === option && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[18px] h-[18px] bg-[#0d9488] rounded-full pointer-events-none"></div>
                        )}
                      </div>
                      <label htmlFor={`option-${index}`} className="font-['Inter',_sans-serif] text-black cursor-pointer leading-relaxed text-lg">
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </>
            }
          />
        </div>
      </div>
    );
  };

  // Fill Blanks Test Screen Component
  const FillBlanksTestScreen = () => {
    const [inputValues, setInputValues] = React.useState<Record<number, string>>({});
    const [filledInputs, setFilledInputs] = React.useState<Record<number, boolean>>({});
    
    const CHAR_UNIT_WIDTH = 20; // CSS background-size의 가로 폭과 일치
    
    const inputs = [
      { id: 0, maxLength: 3 }, // might
      { id: 1, maxLength: 2 }, // that
      { id: 2, maxLength: 3 }, // people
      { id: 3, maxLength: 2 }, // only
      { id: 4, maxLength: 3 }, // basic
      { id: 5, maxLength: 4 }, // However
      { id: 6, maxLength: 1 }, // is
      { id: 7, maxLength: 2 }, // from
      { id: 8, maxLength: 3 }, // record
      { id: 9, maxLength: 4 }, // dance
    ];

    const handleInputChange = (id: number, value: string) => {
      setInputValues(prev => ({ ...prev, [id]: value }));
      
      // Auto-focus next input when current input reaches maxLength
      if (value.length === inputs[id].maxLength) {
        // Find next input index
        const nextId = id + 1;
        if (nextId < inputs.length) {
          // Focus next input after a small delay to ensure state update
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
      setFilledInputs(prev => ({ ...prev, [id]: false }));
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
      if (!context) return text.length * 25; // fallback increased
      
      // Match the actual font used in the inputs
      context.font = "bold 1.5rem 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
      const metrics = context.measureText(text);
      
      // Add more padding to ensure full text visibility (increased from 8 to 24)
      return Math.ceil(metrics.width) + 24;
    };

    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
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
          <div className="flex items-center gap-4">
            {/* Next Button */}
            <button 
              className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
              onClick={() => {
                setShowFillBlanksTest(false);
                setShowReadNoticeTest(true);
              }}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Next</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation tabs with question number */}
        <div className="bg-white border-b border-gray-300">
          <div className="px-8 py-3">
            <div className="flex gap-8">
              <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
                Reading
              </div>
              <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
                Question 1-10
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-5 md:p-12 overflow-auto bg-white flex flex-col items-center justify-center">
          <h1 className="mb-12 md:mb-16 text-2xl md:text-[2rem] text-black font-['Segoe_UI',_Tahoma,_Geneva,_Verdana,_sans-serif]">
            Fill in the missing letters in the paragraph.
          </h1>

          <div className="max-w-[900px] text-xl md:text-[1.5rem] leading-relaxed md:leading-[1.8] text-[#333] font-['Segoe_UI',_Tahoma,_Geneva,_Verdana,_sans-serif] px-4" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
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
              style={{
                width: inputValues[0] && inputValues[0].length > 0
                  ? `${getTextWidth(inputValues[0])}px`
                  : `${inputs[0].maxLength * CHAR_UNIT_WIDTH}px`
              }}
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
              style={{
                width: inputValues[1] && inputValues[1].length > 0
                  ? `${getTextWidth(inputValues[1])}px`
                  : `${inputs[1].maxLength * CHAR_UNIT_WIDTH}px`
              }}
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
              style={{
                width: inputValues[2] && inputValues[2].length > 0
                  ? `${getTextWidth(inputValues[2])}px`
                  : `${inputs[2].maxLength * CHAR_UNIT_WIDTH}px`
              }}
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
              style={{
                width: inputValues[3] && inputValues[3].length > 0
                  ? `${getTextWidth(inputValues[3])}px`
                  : `${inputs[3].maxLength * CHAR_UNIT_WIDTH}px`
              }}
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
              style={{
                width: inputValues[4] && inputValues[4].length > 0
                  ? `${getTextWidth(inputValues[4])}px`
                  : `${inputs[4].maxLength * CHAR_UNIT_WIDTH}px`
              }}
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
              style={{
                width: inputValues[5] && inputValues[5].length > 0
                  ? `${getTextWidth(inputValues[5])}px`
                  : `${inputs[5].maxLength * CHAR_UNIT_WIDTH}px`
              }}
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
              style={{
                width: inputValues[6] && inputValues[6].length > 0
                  ? `${getTextWidth(inputValues[6])}px`
                  : `${inputs[6].maxLength * CHAR_UNIT_WIDTH}px`
              }}
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
              style={{
                width: inputValues[7] && inputValues[7].length > 0
                  ? `${getTextWidth(inputValues[7])}px`
                  : `${inputs[7].maxLength * CHAR_UNIT_WIDTH}px`
              }}
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
              style={{
                width: inputValues[8] && inputValues[8].length > 0
                  ? `${getTextWidth(inputValues[8])}px`
                  : `${inputs[8].maxLength * CHAR_UNIT_WIDTH}px`
              }}
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
              style={{
                width: inputValues[9] && inputValues[9].length > 0
                  ? `${getTextWidth(inputValues[9])}px`
                  : `${inputs[9].maxLength * CHAR_UNIT_WIDTH}px`
              }}
            /> was important to them.
          </div>
        </div>

        <style>{`
          .gap-input {
            display: inline-block;
            background-color: #d8d8d8;
            border: none;
            border-radius: 3px;
            background-image: linear-gradient(to right, #333 0%, #333 60%, transparent 60%, transparent 100%);
            background-size: 20px 2px;
            background-position: left bottom 3px;
            background-repeat: repeat-x;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #000000;
            padding: 0 8px;
            margin: 0;
            outline: none;
            text-align: center;
            font-weight: 700;
            font-size: 1.5rem;
            letter-spacing: 4px;
            height: 1.6em;
            vertical-align: baseline;
            transition: width 0.2s ease, background-color 0.2s;
            box-sizing: border-box;
            line-height: 1.6;
            min-width: 30px;
          }

          .gap-input.filled {
            background-image: none;
            background-color: #d8d8d8;
            font-weight: 600;
            font-size: 1.5rem;
            letter-spacing: normal;
            text-align: center;
            padding: 0 8px;
            border-radius: 4px;
            cursor: pointer;
            box-sizing: border-box;
            color: #000000;
            line-height: 1.6;
            min-width: 30px;
          }

          .gap-input:focus {
            background-color: #ccc;
          }

          .gap-input::selection {
            background: #888;
            color: white;
          }
        `}</style>
      </div>
    );
  };

  // TOEFL Reading Section Screen Component
  const ReadingSectionScreen = () => {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
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
            className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
            onClick={() => {
              setShowReadingSection(false);
              setShowModule1Intro(true);
            }}
          >
            <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Begin</span>
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

        {/* Main content */}
        <div className="flex-1 overflow-auto bg-white flex items-center justify-center">
          <div className="max-w-4xl">
            <h2 className="text-3xl font-['Inter',_sans-serif] text-gray-800 mb-8">Reading Section</h2>
            <div className="w-24 h-1 bg-gray-300 mb-8"></div>
            
            <div className="space-y-6 text-gray-700 font-['Inter',_sans-serif] leading-relaxed">
              <p>
                In the reading section, you will answer 35–48 questions to demonstrate how well you 
                understand academic and non-academic texts in English. There are three types of tasks.
              </p>

              <div className="my-8">
                <table className="w-full border border-black">
                  <thead>
                    <tr className="bg-[#2d7a7c] text-white">
                      <th className="border border-black px-6 py-3 text-left font-['Inter',_sans-serif]">Type of Task</th>
                      <th className="border border-black px-6 py-3 text-left font-['Inter',_sans-serif]">Description</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    <tr>
                      <td className="border border-black px-6 py-3 font-['Inter',_sans-serif]">Complete the Words</td>
                      <td className="border border-black px-6 py-3 font-['Inter',_sans-serif]">Fill in the missing letters in a paragraph.</td>
                    </tr>
                    <tr>
                      <td className="border border-black px-6 py-3 font-['Inter',_sans-serif]">Read in Daily Life</td>
                      <td className="border border-black px-6 py-3 font-['Inter',_sans-serif]">Answer questions about everyday reading material.</td>
                    </tr>
                    <tr>
                      <td className="border border-black px-6 py-3 font-['Inter',_sans-serif]">Read an Academic Passage</td>
                      <td className="border border-black px-6 py-3 font-['Inter',_sans-serif]">Answer questions about academic passages.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Module 1 Intro Screen Component
  const Module1IntroScreen = () => {
    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
        {/* Header */}
        <div className="bg-[#1e6b73] h-16 flex items-center justify-between px-8 shadow-lg">
          <div className="flex items-center">
            <div 
              className="text-white text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
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
            className="flex items-center gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-5 py-2 hover:bg-gray-100 transition-colors"
            onClick={() => {
              setShowModule1Intro(false);
              setShowFillBlanksTest(true);
            }}
          >
            <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-base">Begin</span>
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

        {/* Main content - Centered */}
        <div className="flex-1 flex items-center justify-center bg-white p-12">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-['Inter',_sans-serif] font-bold text-black mb-8">Module 1</h1>
            
            <div className="text-gray-700 font-['Inter',_sans-serif] leading-relaxed space-y-6">
              <p className="text-lg">
                The clock will show you how much time you have to complete Module 1.
              </p>
              
              <p className="text-lg">
                You can use <strong>Next</strong> and <strong>Back</strong> to move to the next question or return to previous questions within the same module.
              </p>

              <p className="text-lg">
                You WILL NOT be able to return to Module 1 once you have begun Module 2.
              </p>
            </div>
          </div>
        </div>
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

  const TPOCard = ({ number }: { number: number }) => {
    const [hoveredSection, setHoveredSection] = useState<string | null>(null);

    const handleStartTest = (section: string) => {
      setCurrentTest({ tpoNumber: number, section });
      setTestBankType('tpo');
      
      // If Listening section, show Listening intro
      if (section === 'Listening') {
        setShowListeningIntro(true);
      } else if (section === 'Reading') {
        // Show Reading Section intro
        setShowReadingIntro(true);
      } else if (section === 'Writing') {
        // Show Writing Section intro
        setShowWritingIntro(true);
      } else if (section === 'Speaking') {
        // Show Speaking Section intro
        setShowSpeakingIntro(true);
      } else {
        setShowToeflTest(true);
      }
    };

    const hoverBgClass = 'bg-gradient-to-r from-[#e3f2fd] to-[#bbdefb] shadow-md';
    const defaultBgClass = 'bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100';
    const buttonHoverClass = 'bg-gradient-to-r from-[#2563eb] to-[#3b82f6] text-white shadow-md transform scale-105';

    return (
      <div className="bg-white rounded-[12px] shadow-lg border border-gray-200 w-full max-w-[268px] transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2d7a7c] to-[#3d8a8c] h-16 relative rounded-t-[12px] shadow-md">
          <div className="absolute box-border content-stretch flex items-center justify-start left-0 px-4 py-0 right-0 top-0">
            <div className="basis-0 content-stretch flex flex-col grow h-16 items-start justify-start min-h-px min-w-px relative shrink-0">
              <div className="flex flex-col font-['Inter',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[24px] text-white w-full tracking-wide">
                <p className="leading-[64px]">TPO {number}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reading Section */}
        <div 
          className={`h-20 relative rounded-[8px] shrink-0 w-full cursor-pointer transition-all duration-300 ${
            hoveredSection === 'reading' ? hoverBgClass : defaultBgClass
          }`}
          onMouseEnter={() => setHoveredSection('reading')}
          onMouseLeave={() => setHoveredSection(null)}
        >
          <div className="relative size-full">
            <div className="box-border flex h-20 items-center justify-between px-4 relative w-full">
              <div className="flex flex-col font-['Inter',_sans-serif] font-bold justify-center text-[#1a2832] text-[16px] tracking-wide">
                <p>Reading</p>
              </div>
              <div 
                className={`flex items-center justify-center h-[30px] rounded-[15px] w-20 transition-all duration-300 cursor-pointer shadow-sm ${
                  hoveredSection === 'reading' ? buttonHoverClass : 'bg-[rgba(0,0,0,0.05)] text-[#374151] hover:bg-[rgba(0,0,0,0.1)]'
                }`}
                onClick={() => handleStartTest('Reading')}
              >
                <p className="font-['Inter',_sans-serif] font-bold text-[12px] text-center">Start Test</p>
              </div>
              <div className="absolute bg-[#e5e7eb] bottom-0 h-[0.5px] left-3 w-[232px]" />
            </div>
          </div>
        </div>

        {/* Listening Section */}
        <div 
          className={`h-20 relative rounded-[8px] shrink-0 w-full cursor-pointer transition-all duration-300 ${
            hoveredSection === 'listening' ? hoverBgClass : defaultBgClass
          }`}
          onMouseEnter={() => setHoveredSection('listening')}
          onMouseLeave={() => setHoveredSection(null)}
        >
          <div className="relative size-full">
            <div className="box-border flex h-20 items-center justify-between px-4 relative w-full">
              <div className="flex flex-col font-['Inter',_sans-serif] font-bold justify-center text-[#1a2832] text-[16px] tracking-wide">
                <p>Listening</p>
              </div>
              <div 
                className={`flex items-center justify-center h-[30px] rounded-[15px] w-20 transition-all duration-300 cursor-pointer shadow-sm ${
                  hoveredSection === 'listening' ? buttonHoverClass : 'bg-[rgba(0,0,0,0.05)] text-[#374151] hover:bg-[rgba(0,0,0,0.1)]'
                }`}
                onClick={() => handleStartTest('Listening')}
              >
                <p className="font-['Inter',_sans-serif] font-bold text-[12px] text-center">Start Test</p>
              </div>
              <div className="absolute bg-[#e5e7eb] bottom-0 h-[0.5px] left-3 w-[232px]" />
            </div>
          </div>
        </div>

        {/* Writing Section */}
        <div 
          className={`h-20 relative rounded-[8px] shrink-0 w-full cursor-pointer transition-all duration-300 ${
            hoveredSection === 'writing' ? hoverBgClass : defaultBgClass
          }`}
          onMouseEnter={() => setHoveredSection('writing')}
          onMouseLeave={() => setHoveredSection(null)}
        >
          <div className="relative size-full">
            <div className="box-border flex h-20 items-center justify-between px-4 relative w-full">
              <div className="flex flex-col font-['Inter',_sans-serif] font-bold justify-center text-[#1a2832] text-[16px] tracking-wide">
                <p>Writing</p>
              </div>
              <div 
                className={`flex items-center justify-center h-[30px] rounded-[15px] w-20 transition-all duration-300 cursor-pointer shadow-sm ${
                  hoveredSection === 'writing' ? buttonHoverClass : 'bg-[rgba(0,0,0,0.05)] text-[#374151] hover:bg-[rgba(0,0,0,0.1)]'
                }`}
                onClick={() => handleStartTest('Writing')}
              >
                <p className="font-['Inter',_sans-serif] font-bold text-[12px] text-center">Start Test</p>
              </div>
              <div className="absolute bg-[#e5e7eb] bottom-0 h-[0.5px] left-3 w-[232px]" />
            </div>
          </div>
        </div>

        {/* Speaking Section */}
        <div 
          className={`h-20 relative rounded-b-[12px] shrink-0 w-full cursor-pointer transition-all duration-300 ${
            hoveredSection === 'speaking' ? hoverBgClass : defaultBgClass
          }`}
          onMouseEnter={() => setHoveredSection('speaking')}
          onMouseLeave={() => setHoveredSection(null)}
        >
          <div className="relative size-full">
            <div className="box-border flex h-20 items-center justify-between px-4 relative w-full">
              <div className="flex flex-col font-['Inter',_sans-serif] font-bold justify-center text-[#1a2832] text-[16px] tracking-wide">
                <p>Speaking</p>
              </div>
              <div 
                className={`flex items-center justify-center h-[30px] rounded-[15px] w-20 transition-all duration-300 cursor-pointer shadow-sm ${
                  hoveredSection === 'speaking' ? buttonHoverClass : 'bg-[rgba(0,0,0,0.05)] text-[#374151] hover:bg-[rgba(0,0,0,0.1)]'
                }`}
                onClick={() => handleStartTest('Speaking')}
              >
                <p className="font-['Inter',_sans-serif] font-bold text-[12px] text-center">Start Test</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const RealTestCard = ({ number }: { number: number }) => {
    const [hoveredSection, setHoveredSection] = useState<string | null>(null);

    const handleStartTest = (section: string) => {
      setCurrentTest({ tpoNumber: number, section });
      setTestBankType('real');
      setShowToeflTest(true);
    };

    const hoverBgClass = 'bg-gradient-to-r from-[#e3f2fd] to-[#bbdefb] shadow-md';
    const defaultBgClass = 'bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100';
    const buttonHoverClass = 'bg-gradient-to-r from-[#2563eb] to-[#3b82f6] text-white shadow-md transform scale-105';

    return (
      <div className="bg-white rounded-[12px] shadow-lg border border-gray-200 w-full max-w-[268px] transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2d7a7c] to-[#3d8a8c] h-16 relative rounded-t-[12px] shadow-md">
          <div className="absolute box-border content-stretch flex items-center justify-start left-0 px-4 py-0 right-0 top-0">
            <div className="basis-0 content-stretch flex flex-col grow h-16 items-start justify-start min-h-px min-w-px relative shrink-0">
              <div className="flex flex-col font-['Inter',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[24px] text-white w-full tracking-wide">
                <p className="leading-[64px]">Real Test {number}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reading Section */}
        <div 
          className={`h-20 relative rounded-[8px] shrink-0 w-full cursor-pointer transition-all duration-300 ${
            hoveredSection === 'reading' ? hoverBgClass : defaultBgClass
          }`}
          onMouseEnter={() => setHoveredSection('reading')}
          onMouseLeave={() => setHoveredSection(null)}
        >
          <div className="relative size-full">
            <div className="box-border flex h-20 items-center justify-between px-4 relative w-full">
              <div className="flex flex-col font-['Inter',_sans-serif] font-bold justify-center text-[#1a2832] text-[16px] tracking-wide">
                <p>Reading</p>
              </div>
              <div 
                className={`flex items-center justify-center h-[30px] rounded-[15px] w-20 transition-all duration-300 cursor-pointer shadow-sm ${
                  hoveredSection === 'reading' ? buttonHoverClass : 'bg-[rgba(0,0,0,0.05)] text-[#374151] hover:bg-[rgba(0,0,0,0.1)]'
                }`}
                onClick={() => handleStartTest('Reading')}
              >
                <p className="font-['Inter',_sans-serif] font-bold text-[12px] text-center">Start Test</p>
              </div>
              <div className="absolute bg-[#e5e7eb] bottom-0 h-[0.5px] left-3 w-[232px]" />
            </div>
          </div>
        </div>

        {/* Listening Section */}
        <div 
          className={`h-20 relative rounded-[8px] shrink-0 w-full cursor-pointer transition-all duration-300 ${
            hoveredSection === 'listening' ? hoverBgClass : defaultBgClass
          }`}
          onMouseEnter={() => setHoveredSection('listening')}
          onMouseLeave={() => setHoveredSection(null)}
        >
          <div className="relative size-full">
            <div className="box-border flex h-20 items-center justify-between px-4 relative w-full">
              <div className="flex flex-col font-['Inter',_sans-serif] font-bold justify-center text-[#1a2832] text-[16px] tracking-wide">
                <p>Listening</p>
              </div>
              <div 
                className={`flex items-center justify-center h-[30px] rounded-[15px] w-20 transition-all duration-300 cursor-pointer shadow-sm ${
                  hoveredSection === 'listening' ? buttonHoverClass : 'bg-[rgba(0,0,0,0.05)] text-[#374151] hover:bg-[rgba(0,0,0,0.1)]'
                }`}
                onClick={() => handleStartTest('Listening')}
              >
                <p className="font-['Inter',_sans-serif] font-bold text-[12px] text-center">Start Test</p>
              </div>
              <div className="absolute bg-[#e5e7eb] bottom-0 h-[0.5px] left-3 w-[232px]" />
            </div>
          </div>
        </div>

        {/* Writing Section */}
        <div 
          className={`h-20 relative rounded-[8px] shrink-0 w-full cursor-pointer transition-all duration-300 ${
            hoveredSection === 'writing' ? hoverBgClass : defaultBgClass
          }`}
          onMouseEnter={() => setHoveredSection('writing')}
          onMouseLeave={() => setHoveredSection(null)}
        >
          <div className="relative size-full">
            <div className="box-border flex h-20 items-center justify-between px-4 relative w-full">
              <div className="flex flex-col font-['Inter',_sans-serif] font-bold justify-center text-[#1a2832] text-[16px] tracking-wide">
                <p>Writing</p>
              </div>
              <div 
                className={`flex items-center justify-center h-[30px] rounded-[15px] w-20 transition-all duration-300 cursor-pointer shadow-sm ${
                  hoveredSection === 'writing' ? buttonHoverClass : 'bg-[rgba(0,0,0,0.05)] text-[#374151] hover:bg-[rgba(0,0,0,0.1)]'
                }`}
                onClick={() => handleStartTest('Writing')}
              >
                <p className="font-['Inter',_sans-serif] font-bold text-[12px] text-center">Start Test</p>
              </div>
              <div className="absolute bg-[#e5e7eb] bottom-0 h-[0.5px] left-3 w-[232px]" />
            </div>
          </div>
        </div>

        {/* Speaking Section */}
        <div 
          className={`h-20 relative rounded-b-[12px] shrink-0 w-full cursor-pointer transition-all duration-300 ${
            hoveredSection === 'speaking' ? hoverBgClass : defaultBgClass
          }`}
          onMouseEnter={() => setHoveredSection('speaking')}
          onMouseLeave={() => setHoveredSection(null)}
        >
          <div className="relative size-full">
            <div className="box-border flex h-20 items-center justify-between px-4 relative w-full">
              <div className="flex flex-col font-['Inter',_sans-serif] font-bold justify-center text-[#1a2832] text-[16px] tracking-wide">
                <p>Speaking</p>
              </div>
              <div 
                className={`flex items-center justify-center h-[30px] rounded-[15px] w-20 transition-all duration-300 cursor-pointer shadow-sm ${
                  hoveredSection === 'speaking' ? buttonHoverClass : 'bg-[rgba(0,0,0,0.05)] text-[#374151] hover:bg-[rgba(0,0,0,0.1)]'
                }`}
                onClick={() => handleStartTest('Speaking')}
              >
                <p className="font-['Inter',_sans-serif] font-bold text-[12px] text-center">Start Test</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Toaster position="top-right" richColors />
      {/* Reading Section Intro */}
      {showReadingIntro && <ReadingIntroScreen />}
      
      {/* TOEFL Reading Section Screen (Questions 1-10) */}
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
      
      {/* Listening Section Screens */}
      {showListeningIntro && <ListeningIntroScreen />}
      {showListeningModule1Intro && <ListeningModule1IntroScreen />}
      {showListeningQuestion1 && <ListeningQuestion1Screen />}
      {showListeningQuestion2 && <ListeningQuestion2Screen />}
      {showListeningQuestion3 && <ListeningQuestion3Screen />}
      {showListeningQuestion4 && <ListeningQuestion4Screen />}
      {showListeningQuestion5 && <ListeningQuestion5Screen />}
      {showListeningQuestion6 && <ListeningQuestion6Screen />}
      {showListeningQuestion7 && <ListeningQuestion7Screen />}
      {showListeningQuestion8 && <ListeningQuestion8Screen />}
      {showListeningModule2Intro && <ListeningModule2IntroScreen />}
      {showListeningConversation && <ListeningConversationScreen />}
      {showListeningQuestion9 && <ListeningQuestion9Screen />}
      {showListeningQuestion10 && <ListeningQuestion10Screen />}
      {showListeningConversation2 && <ListeningConversation2Screen />}
      {showListeningQuestion11 && <ListeningQuestion11Screen />}
      {showListeningQuestion12 && <ListeningQuestion12Screen />}
      {showListeningAnnouncement && <ListeningAnnouncementScreen />}
      {showListeningQuestion13 && <ListeningQuestion13Screen />}
      {showListeningQuestion14 && <ListeningQuestion14Screen />}
      {showListeningPodcast && <ListeningPodcastScreen />}
      {showListeningQuestion15 && <ListeningQuestion15Screen />}
      {showListeningQuestion16 && <ListeningQuestion16Screen />}
      {showListeningQuestion17 && <ListeningQuestion17Screen />}
      {showListeningQuestion18 && <ListeningQuestion18Screen />}
      {showListeningEndModule1 && <ListeningEndModule1Screen />}
      {showListeningModule2 && <ListeningModule2Screen />}
      {showListeningM2Q1 && (
        <ListeningM2Q1
          onBack={() => {
            setShowListeningM2Q1(false);
            setShowListeningModule2(true);
          }}
          onNext={() => {
            setShowListeningM2Q1(false);
            setShowListeningM2Q2(true);
          }}
          onHome={() => {
            setShowListeningM2Q1(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onVolumeClick={() => setShowVolumeModal(true)}
        />
      )}
      {showListeningM2Q2 && (
        <ListeningM2Q2
          onBack={() => {
            setShowListeningM2Q2(false);
            setShowListeningM2Q1(true);
          }}
          onNext={() => {
            setShowListeningM2Q2(false);
            setShowListeningM2Q3(true);
          }}
          onHome={() => {
            setShowListeningM2Q2(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onVolumeClick={() => setShowVolumeModal(true)}
        />
      )}
      {showListeningM2Q3 && (
        <ListeningM2Q3
          onBack={() => {
            setShowListeningM2Q3(false);
            setShowListeningM2Q2(true);
          }}
          onNext={() => {
            setShowListeningM2Q3(false);
            setShowListeningM2Q4(true);
          }}
          onHome={() => {
            setShowListeningM2Q3(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onVolumeClick={() => setShowVolumeModal(true)}
        />
      )}
      {showListeningM2Q4 && (
        <ListeningM2Q4
          onBack={() => {
            setShowListeningM2Q4(false);
            setShowListeningM2Q3(true);
          }}
          onNext={() => {
            setShowListeningM2Q4(false);
            setShowListeningM2Q5(true);
          }}
          onHome={() => {
            setShowListeningM2Q4(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onVolumeClick={() => setShowVolumeModal(true)}
        />
      )}
      {showListeningM2Q5 && (
        <ListeningM2Q5
          onBack={() => {
            setShowListeningM2Q5(false);
            setShowListeningM2Q4(true);
          }}
          onNext={() => {
            setShowListeningM2Q5(false);
            setShowListeningM2Q6(true);
          }}
          onHome={() => {
            setShowListeningM2Q5(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onVolumeClick={() => setShowVolumeModal(true)}
        />
      )}
      {showListeningM2Q6 && (
        <ListeningM2Q6
          onBack={() => {
            setShowListeningM2Q6(false);
            setShowListeningM2Q5(true);
          }}
          onNext={() => {
            setShowListeningM2Q6(false);
            setShowListeningM2Q7(true);
          }}
          onHome={() => {
            setShowListeningM2Q6(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onVolumeClick={() => setShowVolumeModal(true)}
        />
      )}
      {showListeningM2Q7 && (
        <ListeningM2Q7
          onBack={() => {
            setShowListeningM2Q7(false);
            setShowListeningM2Q6(true);
          }}
          onNext={() => {
            setShowListeningM2Q7(false);
            setShowListeningM2Q8(true);
          }}
          onHome={() => {
            setShowListeningM2Q7(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onVolumeClick={() => setShowVolumeModal(true)}
        />
      )}
      {showListeningM2Q8 && (
        <ListeningM2Q8
          onBack={() => {
            setShowListeningM2Q8(false);
            setShowListeningM2Q7(true);
          }}
          onNext={() => {
            setShowListeningM2Q8(false);
            setShowListeningM2Conversation(true);
          }}
          onHome={() => {
            setShowListeningM2Q8(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onVolumeClick={() => setShowVolumeModal(true)}
        />
      )}
      {showListeningM2Conversation && (
        <ListeningM2Conversation
          onBack={() => {
            setShowListeningM2Conversation(false);
            setShowListeningM2Q8(true);
          }}
          onNext={() => {
            setShowListeningM2Conversation(false);
            setShowListeningM2Q9(true);
          }}
          onHome={() => {
            setShowListeningM2Conversation(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onVolumeClick={() => setShowVolumeModal(true)}
        />
      )}
      {showListeningM2Q9 && (
        <ListeningM2Q9
          onBack={() => {
            setShowListeningM2Q9(false);
            setShowListeningM2Conversation(true);
          }}
          onNext={() => {
            setShowListeningM2Q9(false);
            setShowListeningM2Q10(true);
          }}
          onHome={() => {
            setShowListeningM2Q9(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onVolumeClick={() => setShowVolumeModal(true)}
        />
      )}
      {showListeningM2Q10 && (
        <ListeningM2Q10
          onBack={() => {
            setShowListeningM2Q10(false);
            setShowListeningM2Q9(true);
          }}
          onNext={() => {
            setShowListeningM2Q10(false);
            setShowListeningM2Announcement(true);
          }}
          onHome={() => {
            setShowListeningM2Q10(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onVolumeClick={() => setShowVolumeModal(true)}
        />
      )}
      {showListeningM2Announcement && (
        <ListeningM2Announcement
          onBack={() => {
            setShowListeningM2Announcement(false);
            setShowListeningM2Q10(true);
          }}
          onNext={() => {
            setShowListeningM2Announcement(false);
            setShowListeningM2Q11(true);
          }}
          onHome={() => {
            setShowListeningM2Announcement(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onVolumeClick={() => setShowVolumeModal(true)}
        />
      )}
      {showListeningM2Q11 && (
        <ListeningM2Q11
          onBack={() => {
            setShowListeningM2Q11(false);
            setShowListeningM2Announcement(true);
          }}
          onNext={() => {
            setShowListeningM2Q11(false);
            setShowListeningM2Q12(true);
          }}
          onHome={() => {
            setShowListeningM2Q11(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onVolumeClick={() => setShowVolumeModal(true)}
        />
      )}
      {showListeningM2Q12 && (
        <ListeningM2Q12
          onBack={() => {
            setShowListeningM2Q12(false);
            setShowListeningM2Q11(true);
          }}
          onNext={() => {
            setShowListeningM2Q12(false);
            setShowListeningM2Lecture(true);
          }}
          onHome={() => {
            setShowListeningM2Q12(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onVolumeClick={() => setShowVolumeModal(true)}
        />
      )}
      {showListeningM2Lecture && (
        <ListeningM2Lecture
          onBack={() => {
            setShowListeningM2Lecture(false);
            setShowListeningM2Q12(true);
          }}
          onNext={() => {
            setShowListeningM2Lecture(false);
            setShowListeningM2Q13(true);
          }}
          onHome={() => {
            setShowListeningM2Lecture(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onVolumeClick={() => setShowVolumeModal(true)}
        />
      )}
      {showListeningM2Q13 && (
        <ListeningM2Q13
          onBack={() => {
            setShowListeningM2Q13(false);
            setShowListeningM2Lecture(true);
          }}
          onNext={() => {
            setShowListeningM2Q13(false);
            setShowListeningM2Q14(true);
          }}
          onHome={() => {
            setShowListeningM2Q13(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onVolumeClick={() => setShowVolumeModal(true)}
        />
      )}
      {showListeningM2Q14 && (
        <ListeningM2Q14
          onBack={() => {
            setShowListeningM2Q14(false);
            setShowListeningM2Q13(true);
          }}
          onNext={() => {
            setShowListeningM2Q14(false);
            setShowListeningM2Q15(true);
          }}
          onHome={() => {
            setShowListeningM2Q14(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onVolumeClick={() => setShowVolumeModal(true)}
        />
      )}
      {showListeningM2Q15 && (
        <ListeningM2Q15
          onBack={() => {
            setShowListeningM2Q15(false);
            setShowListeningM2Q14(true);
          }}
          onNext={() => {
            setShowListeningM2Q15(false);
            setShowListeningM2Q16(true);
          }}
          onHome={() => {
            setShowListeningM2Q15(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onVolumeClick={() => setShowVolumeModal(true)}
        />
      )}
      {showListeningM2Q16 && (
        <ListeningM2Q16
          onBack={() => {
            setShowListeningM2Q16(false);
            setShowListeningM2Q15(true);
          }}
          onNext={() => {
            setShowListeningM2Q16(false);
            setShowListeningM2End(true);
          }}
          onHome={() => {
            setShowListeningM2Q16(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onVolumeClick={() => setShowVolumeModal(true)}
        />
      )}
      {showListeningM2End && (
        <ListeningM2End
          onBack={() => {
            setShowListeningM2End(false);
            setShowListeningM2Q16(true);
          }}
          onNext={() => {
            setShowListeningM2End(false);
            // Next section - can be added later
          }}
          onHome={() => {
            setShowListeningM2End(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onVolumeClick={() => setShowVolumeModal(true)}
        />
      )}

      {/* Writing Section Components */}
      {showWritingIntro && (
        <WritingIntro
          onNext={() => {
            setShowWritingIntro(false);
            setShowWritingBuildSentenceIntro(true);
          }}
          onHome={() => {
            setShowWritingIntro(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
        />
      )}
      {showWritingBuildSentenceIntro && (
        <WritingBuildSentenceIntro
          onBack={() => {
            setShowWritingBuildSentenceIntro(false);
            setShowWritingIntro(true);
          }}
          onNext={() => {
            setShowWritingBuildSentenceIntro(false);
            setShowWritingBuildSentenceQ1(true);
          }}
          onHome={() => {
            setShowWritingBuildSentenceIntro(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
        />
      )}
      {showWritingBuildSentenceQ1 && (
        <WritingBuildSentenceQ1
          onBack={() => {
            setShowWritingBuildSentenceQ1(false);
            setShowWritingBuildSentenceIntro(true);
          }}
          onNext={() => {
            setShowWritingBuildSentenceQ1(false);
            setShowWritingBuildSentenceQ2(true);
          }}
          onHome={() => {
            setShowWritingBuildSentenceQ1(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
        />
      )}
      {showWritingBuildSentenceQ2 && (
        <WritingBuildSentenceQ2
          onBack={() => {
            setShowWritingBuildSentenceQ2(false);
            setShowWritingBuildSentenceQ1(true);
          }}
          onNext={() => {
            setShowWritingBuildSentenceQ2(false);
            setShowWritingBuildSentenceQ3(true);
          }}
          onHome={() => {
            setShowWritingBuildSentenceQ2(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
        />
      )}
      {showWritingBuildSentenceQ3 && (
        <WritingBuildSentenceQ3
          onBack={() => {
            setShowWritingBuildSentenceQ3(false);
            setShowWritingBuildSentenceQ2(true);
          }}
          onNext={() => {
            setShowWritingBuildSentenceQ3(false);
            setShowWritingBuildSentenceQ4(true);
          }}
          onHome={() => {
            setShowWritingBuildSentenceQ3(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
        />
      )}
      {showWritingBuildSentenceQ4 && (
        <WritingBuildSentenceQ4
          onBack={() => {
            setShowWritingBuildSentenceQ4(false);
            setShowWritingBuildSentenceQ3(true);
          }}
          onNext={() => {
            setShowWritingBuildSentenceQ4(false);
            setShowWritingBuildSentenceQ5(true);
          }}
          onHome={() => {
            setShowWritingBuildSentenceQ4(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
        />
      )}
      {showWritingBuildSentenceQ5 && (
        <WritingBuildSentenceQ5
          onBack={() => {
            setShowWritingBuildSentenceQ5(false);
            setShowWritingBuildSentenceQ4(true);
          }}
          onNext={() => {
            setShowWritingBuildSentenceQ5(false);
            setShowWritingBuildSentenceQ6(true);
          }}
          onHome={() => {
            setShowWritingBuildSentenceQ5(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
        />
      )}
      {showWritingBuildSentenceQ6 && (
        <WritingBuildSentenceQ6
          onBack={() => {
            setShowWritingBuildSentenceQ6(false);
            setShowWritingBuildSentenceQ5(true);
          }}
          onNext={() => {
            setShowWritingBuildSentenceQ6(false);
            setShowWritingBuildSentenceQ7(true);
          }}
          onHome={() => {
            setShowWritingBuildSentenceQ6(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
        />
      )}
      {showWritingBuildSentenceQ7 && (
        <WritingBuildSentenceQ7
          onBack={() => {
            setShowWritingBuildSentenceQ7(false);
            setShowWritingBuildSentenceQ6(true);
          }}
          onNext={() => {
            setShowWritingBuildSentenceQ7(false);
            setShowWritingBuildSentenceQ8(true);
          }}
          onHome={() => {
            setShowWritingBuildSentenceQ7(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
        />
      )}
      {showWritingBuildSentenceQ8 && (
        <WritingBuildSentenceQ8
          onBack={() => {
            setShowWritingBuildSentenceQ8(false);
            setShowWritingBuildSentenceQ7(true);
          }}
          onNext={() => {
            setShowWritingBuildSentenceQ8(false);
            setShowWritingBuildSentenceQ9(true);
          }}
          onHome={() => {
            setShowWritingBuildSentenceQ8(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
        />
      )}
      {showWritingBuildSentenceQ9 && (
        <WritingBuildSentenceQ9
          onBack={() => {
            setShowWritingBuildSentenceQ9(false);
            setShowWritingBuildSentenceQ8(true);
          }}
          onNext={() => {
            setShowWritingBuildSentenceQ9(false);
            setShowWritingBuildSentenceQ10(true);
          }}
          onHome={() => {
            setShowWritingBuildSentenceQ9(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
        />
      )}
      {showWritingBuildSentenceQ10 && (
        <WritingBuildSentenceQ10
          onBack={() => {
            setShowWritingBuildSentenceQ10(false);
            setShowWritingBuildSentenceQ9(true);
          }}
          onNext={() => {
            setShowWritingBuildSentenceQ10(false);
            setShowWritingEmailIntro(true);
          }}
          onHome={() => {
            setShowWritingBuildSentenceQ10(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
        />
      )}
      {showWritingEmailIntro && (
        <WritingEmailIntro
          onNext={() => {
            setShowWritingEmailIntro(false);
            setShowWritingEmailQ1(true);
          }}
          onHome={() => {
            setShowWritingEmailIntro(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
        />
      )}
      {showWritingEmailQ1 && (
        <WritingEmailQ1
          onBack={() => {
            setShowWritingEmailQ1(false);
            setShowWritingEmailIntro(true);
          }}
          onNext={() => {
            setShowWritingEmailQ1(false);
            setShowWritingAcademicDiscussionIntro(true);
          }}
          onHome={() => {
            setShowWritingEmailQ1(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
        />
      )}
      {showWritingAcademicDiscussionIntro && (
        <WritingAcademicDiscussionIntro
          onBegin={() => {
            setShowWritingAcademicDiscussionIntro(false);
            setShowWritingAcademicDiscussionQ2(true);
          }}
          onHome={() => {
            setShowWritingAcademicDiscussionIntro(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
        />
      )}
      {showWritingAcademicDiscussionQ2 && (
        <WritingAcademicDiscussionQ2
          onBack={() => {
            setShowWritingAcademicDiscussionQ2(false);
            setShowWritingAcademicDiscussionIntro(true);
          }}
          onNext={() => {
            setShowWritingAcademicDiscussionQ2(false);
            setShowWritingEnd(true);
          }}
          onHome={() => {
            setShowWritingAcademicDiscussionQ2(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
        />
      )}
      {showWritingEnd && (
        <WritingEnd
          onNext={() => {
            setShowWritingEnd(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
          onHome={() => {
            setShowWritingEnd(false);
            if (testBankType === 'tpo') {
              setActiveTab('TPO');
            } else {
              setActiveTab('Real Test');
            }
          }}
        />
      )}

      {/* Speaking Section */}
      {showSpeakingIntro && (
        <SpeakingIntro
          onNext={() => {
            setShowSpeakingIntro(false);
            setShowSpeakingListenRepeatIntro(true);
          }}
          onLogoClick={() => {
            setShowSpeakingIntro(false);
            // Reset to landing page - all states are already false
          }}
        />
      )}

      {showSpeakingListenRepeatIntro && (
        <SpeakingListenRepeatIntro
          onNext={() => {
            setShowSpeakingListenRepeatIntro(false);
            setShowSpeakingQ1(true);
          }}
          onVolumeClick={toggleVolume}
          isVolumeOpen={isVolumeOpen}
          volumeButtonRef={volumeButtonRef}
          onLogoClick={() => {
            setShowSpeakingListenRepeatIntro(false);
            // Reset to landing page - all states are already false
          }}
        />
      )}

      {showSpeakingQ1 && (
        <SpeakingQ1
          onNext={() => {
            setShowSpeakingQ1(false);
            setShowSpeakingQ2Prep(true);
          }}
          onHome={() => {
            setShowSpeakingQ1(false);
          }}
        />
      )}

      {showSpeakingQ2Prep && (
        <SpeakingQ2Prep
          onNext={() => {
            setShowSpeakingQ2Prep(false);
            setShowSpeakingQ2Record(true);
          }}
          onHome={() => {
            setShowSpeakingQ2Prep(false);
          }}
          onVolumeClick={toggleVolume}
          isVolumeOpen={isVolumeOpen}
          volumeButtonRef={volumeButtonRef}
        />
      )}

      {showSpeakingQ2Record && (
        <SpeakingQ2Record
          onNext={() => {
            setShowSpeakingQ2Record(false);
            setShowSpeakingQ3Prep(true);
          }}
          onHome={() => {
            setShowSpeakingQ2Record(false);
          }}
        />
      )}

      {showSpeakingQ3Prep && (
        <SpeakingQ3Prep
          onNext={() => {
            setShowSpeakingQ3Prep(false);
            setShowSpeakingQ3Record(true);
          }}
          onHome={() => {
            setShowSpeakingQ3Prep(false);
          }}
          onVolumeClick={toggleVolume}
          isVolumeOpen={isVolumeOpen}
          volumeButtonRef={volumeButtonRef}
        />
      )}

      {showSpeakingQ3Record && (
        <SpeakingQ3Record
          onNext={() => {
            setShowSpeakingQ3Record(false);
            setShowSpeakingQ4Prep(true);
          }}
          onHome={() => {
            setShowSpeakingQ3Record(false);
          }}
        />
      )}

      {showSpeakingQ4Prep && (
        <SpeakingQ4Prep
          onNext={() => {
            setShowSpeakingQ4Prep(false);
            setShowSpeakingQ4Record(true);
          }}
          onHome={() => {
            setShowSpeakingQ4Prep(false);
          }}
          onVolumeClick={toggleVolume}
          isVolumeOpen={isVolumeOpen}
          volumeButtonRef={volumeButtonRef}
        />
      )}

      {showSpeakingQ4Record && (
        <SpeakingQ4Record
          onNext={() => {
            setShowSpeakingQ4Record(false);
            setShowSpeakingQ5Record(true);
          }}
          onHome={() => {
            setShowSpeakingQ4Record(false);
          }}
        />
      )}

      {showSpeakingQ5Record && (
        <SpeakingQ5Record
          onNext={() => {
            setShowSpeakingQ5Record(false);
            setShowSpeakingQ6Record(true);
          }}
          onHome={() => {
            setShowSpeakingQ5Record(false);
          }}
          onVolumeClick={toggleVolume}
          isVolumeOpen={isVolumeOpen}
          volumeButtonRef={volumeButtonRef}
        />
      )}

      {showSpeakingQ6Record && (
        <SpeakingQ6Record
          onNext={() => {
            setShowSpeakingQ6Record(false);
            setShowSpeakingQ7Record(true);
          }}
          onHome={() => {
            setShowSpeakingQ6Record(false);
          }}
          onVolumeClick={toggleVolume}
          isVolumeOpen={isVolumeOpen}
          volumeButtonRef={volumeButtonRef}
        />
      )}

      {showSpeakingQ7Record && (
        <SpeakingQ7Record
          onNext={() => {
            setShowSpeakingQ7Record(false);
            setShowSpeakingTakeInterviewIntro(true);
          }}
          onHome={() => {
            setShowSpeakingQ7Record(false);
          }}
          onVolumeClick={toggleVolume}
          isVolumeOpen={isVolumeOpen}
          volumeButtonRef={volumeButtonRef}
        />
      )}

      {showSpeakingTakeInterviewIntro && (
        <SpeakingTakeInterviewIntro
          onNext={() => {
            setShowSpeakingTakeInterviewIntro(false);
            setShowSpeakingInterviewIntro(true);
          }}
          onHome={() => {
            setShowSpeakingTakeInterviewIntro(false);
          }}
        />
      )}

      {showSpeakingInterviewIntro && (
        <SpeakingInterviewIntro
          onNext={() => {
            setShowSpeakingInterviewIntro(false);
            setShowSpeakingQ8Record(true);
          }}
          onHome={() => {
            setShowSpeakingInterviewIntro(false);
          }}
        />
      )}

      {showSpeakingQ8Record && (
        <SpeakingQ8Record
          onNext={() => {
            setShowSpeakingQ8Record(false);
            setShowSpeakingQ9Record(true);
          }}
          onHome={() => {
            setShowSpeakingQ8Record(false);
          }}
          onVolumeClick={toggleVolume}
          isVolumeOpen={isVolumeOpen}
          volumeButtonRef={volumeButtonRef}
        />
      )}

      {showSpeakingQ9Record && (
        <SpeakingQ9Record
          onNext={() => {
            setShowSpeakingQ9Record(false);
            setShowSpeakingQ10Record(true);
          }}
          onHome={() => {
            setShowSpeakingQ9Record(false);
          }}
          onVolumeClick={toggleVolume}
          isVolumeOpen={isVolumeOpen}
          volumeButtonRef={volumeButtonRef}
        />
      )}

      {showSpeakingQ10Record && (
        <SpeakingQ10Record
          onNext={() => {
            setShowSpeakingQ10Record(false);
            setShowSpeakingQ11Record(true);
          }}
          onHome={() => {
            setShowSpeakingQ10Record(false);
          }}
          onVolumeClick={toggleVolume}
          isVolumeOpen={isVolumeOpen}
          volumeButtonRef={volumeButtonRef}
        />
      )}

      {showSpeakingQ11Record && (
        <SpeakingQ11Record
          onNext={() => {
            setShowSpeakingQ11Record(false);
            // Speaking section complete - navigate to next section
          }}
          onHome={() => {
            setShowSpeakingQ11Record(false);
          }}
          onVolumeClick={toggleVolume}
          isVolumeOpen={isVolumeOpen}
          volumeButtonRef={volumeButtonRef}
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
              className="text-xl md:text-3xl font-['Inter',_sans-serif] font-bold text-[#005f61] tracking-wide cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                // Always go to LMS page
                setShowLandingPage(false);
                setShowLoginForm(false);
                setShowRegistrationForm(false);
                handleTabChange('TOEFL Prep');
              }}
            >
              <span className="hidden md:inline">TOEFL Prep</span>
              <span className="md:hidden">TOEFL</span>
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
                    
                    // Always switch tab and close auth forms
                    setActiveTab(tab);
                    setShowLoginForm(false);
                    setShowRegistrationForm(false);
                    
                    // Show login popup if login is required and user is not logged in
                    if (requiresLogin && !isLoggedIn) {
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
                  localStorage.removeItem('toefl_current_user');
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
          onSaveResult={handleAddTestResult}
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
                        훈련 시작
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
          activeTestSetRange={activeTestSetRange}
          setActiveTestSetRange={setActiveTestSetRange}
          tpoTests={tpoTests}
          isContentLocked={isContentLocked}
          setActiveTab={setActiveTab}
          setCurrentTest={setCurrentTest}
          setTestBankType={setTestBankType}
          setShowListeningIntro={setShowListeningIntro}
          setShowReadingIntro={setShowReadingIntro}
          setShowWritingIntro={setShowWritingIntro}
          setShowSpeakingIntro={setShowSpeakingIntro}
          setShowToeflTest={setShowToeflTest}
          TPOCard={TPOCard}
          TestCard={TestCard}
          advertisements={advertisements}
        />
      )}

      {!showLoginForm && !showRegistrationForm && activeTab === 'Test' && (
        <TestPage
          isMobile={isMobile}
          activeTestSetRange={activeTestSetRange}
          setActiveTestSetRange={setActiveTestSetRange}
          testTests={testTests}
          isContentLocked={isContentLocked}
          setActiveTab={setActiveTab}
          setCurrentTest={setCurrentTest}
          setTestBankType={setTestBankType}
          setShowListeningIntro={setShowListeningIntro}
          setShowReadingIntro={setShowReadingIntro}
          setShowWritingIntro={setShowWritingIntro}
          setShowSpeakingIntro={setShowSpeakingIntro}
          setShowToeflTest={setShowToeflTest}
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
          tpoTests={[...tpoTests, ...testTests]}
          advertisements={advertisements}
        />
      )}

      {activeTab === 'History' && (
        <HistorySection 
          themeColor="#005f61"
          results={testResults}
          onRetryWrongAnswers={(result) => {
            console.log('Retrying wrong answers:', result);
            // Logic to retry wrong answers
          }}
          onViewDetail={(result) => {
            console.log('Viewing detail:', result);
            // Logic to view detail
          }}
          shareConfig={shareConfig}
          onShareConfigChange={setShareConfig}
          studentName="张伟"
          advertisements={advertisements}
        />
      )}

      {activeTab === 'TOEFL Prep' && (
        <LMSSection
          contents={lmsContents}
          onAddContent={handleAddLMSContent}
          onUpdateContent={handleUpdateLMSContent}
          onDeleteContent={handleDeleteLMSContent}
          tpoTests={[...tpoTests, ...testTests]}
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
      {isMobile && (
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
export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}