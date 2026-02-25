import { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Plus, Edit, Trash2, Search, User, Calendar, BarChart3, AlertTriangle, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PersonalResultsDashboard, VocabularyResult, TPOResult, TestResult, TrainingResult } from './PersonalResultsDashboard';

export interface Student {
  id: string;
  name: string;
  email: string;
  enrolledDate: string;
  phoneNumber?: string; // Optional phone number from registration
  registeredVia?: 'registration_form' | 'manual'; // Track how student was added
}

export interface VocabularyScore {
  id: string;
  studentId: string;
  date: string; // ISO date string
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  wrongWords: string[]; // English words that were answered incorrectly
  testType: 'multiple' | 'subjective' | 'mixed';
  dayRange: string; // e.g., "DAY 1-5"
}

interface StudentManagementProps {
  students: Student[];
  scores: VocabularyScore[];
  onAddStudent: (student: Omit<Student, 'id'>) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onAddScore: (score: Omit<VocabularyScore, 'id'>) => void;
  onDeleteStudentData: (studentId: string) => void;
}

export function StudentManagement({
  students,
  scores,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onAddScore,
  onDeleteStudentData
}: StudentManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());
  const [showPersonalDashboard, setShowPersonalDashboard] = useState<Student | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });

  // Get unique months from scores
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    scores.forEach(score => {
      const date = new Date(score.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.add(monthKey);
    });
    return Array.from(months).sort().reverse();
  }, [scores]);

  // Filter students by search query
  const filteredStudents = useMemo(() => {
    return students.filter(student => 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [students, searchQuery]);

  // Get scores for a student
  const getStudentScores = (studentId: string) => {
    let studentScores = scores.filter(score => score.studentId === studentId);
    
    if (selectedMonth !== 'all') {
      studentScores = studentScores.filter(score => {
        const date = new Date(score.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        return monthKey === selectedMonth;
      });
    }
    
    return studentScores.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // Calculate student statistics
  const getStudentStats = (studentId: string) => {
    const studentScores = getStudentScores(studentId);
    
    if (studentScores.length === 0) {
      return {
        totalTests: 0,
        averageScore: 0,
        bestScore: 0,
        worstScore: 0,
        totalQuestions: 0,
        totalCorrect: 0
      };
    }

    const totalTests = studentScores.length;
    const totalQuestions = studentScores.reduce((sum, score) => sum + score.totalQuestions, 0);
    const totalCorrect = studentScores.reduce((sum, score) => sum + score.correctAnswers, 0);
    const averageScore = Math.round((totalCorrect / totalQuestions) * 100) || 0;
    const bestScore = Math.max(...studentScores.map(s => s.percentage));
    const worstScore = Math.min(...studentScores.map(s => s.percentage));

    return {
      totalTests,
      averageScore,
      bestScore,
      worstScore,
      totalQuestions,
      totalCorrect
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim()) {
      alert('이름과 이메일을 모두 입력해주세요.');
      return;
    }

    if (editingStudent) {
      onUpdateStudent({
        ...editingStudent,
        name: formData.name,
        email: formData.email
      });
    } else {
      onAddStudent({
        name: formData.name,
        email: formData.email,
        enrolledDate: new Date().toISOString()
      });
    }

    setFormData({ name: '', email: '' });
    setShowAddForm(false);
    setEditingStudent(null);
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      email: student.email
    });
    setShowAddForm(true);
  };

  const handleDelete = (student: Student) => {
    const studentScores = scores.filter(s => s.studentId === student.id);
    
    if (studentScores.length > 0) {
      const confirmMessage = `${student.name} 학생의 모든 데이터(${studentScores.length}개의 성적 기록)가 삭제됩니다. 계속하시겠습니까?`;
      if (!window.confirm(confirmMessage)) {
        return;
      }
      onDeleteStudentData(student.id);
    } else {
      if (!window.confirm(`${student.name} 학생을 삭제하시겠습니까?`)) {
        return;
      }
      onDeleteStudent(student.id);
    }
  };

  const toggleStudentExpanded = (studentId: string) => {
    const newExpanded = new Set(expandedStudents);
    if (newExpanded.has(studentId)) {
      newExpanded.delete(studentId);
    } else {
      newExpanded.add(studentId);
    }
    setExpandedStudents(newExpanded);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMonthDisplay = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    return `${year}년 ${month}월`;
  };

  // Convert VocabularyScore to VocabularyResult for PersonalResultsDashboard
  const convertToVocabularyResults = (studentId: string): VocabularyResult[] => {
    return scores
      .filter(score => score.studentId === studentId)
      .map(score => ({
        id: score.id,
        date: score.date,
        dayRange: score.dayRange,
        totalQuestions: score.totalQuestions,
        correctAnswers: score.correctAnswers,
        percentage: score.percentage,
        testType: score.testType,
        wrongWords: score.wrongWords,
        timeSpent: Math.floor(Math.random() * 30) + 10 // Mock time data
      }));
  };

  // Show Personal Dashboard if selected
  if (showPersonalDashboard) {
    return (
      <PersonalResultsDashboard
        studentId={showPersonalDashboard.id}
        studentName={showPersonalDashboard.name}
        vocabularyResults={convertToVocabularyResults(showPersonalDashboard.id)}
        tpoResults={[]} // Mock data - to be implemented
        testResults={[]} // Mock data - to be implemented
        trainingResults={[]} // Mock data - to be implemented
        onClose={() => setShowPersonalDashboard(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">학생 관리</h2>
          <p className="text-sm text-gray-600 mt-1">학생 정보 및 단어 시험 성적 관리</p>
        </div>
        <Button
          onClick={() => {
            setEditingStudent(null);
            setFormData({ name: '', email: '' });
            setShowAddForm(true);
          }}
          className="bg-gradient-to-r from-[#005f61] to-[#2d7a7c] text-white hover:from-[#004a4c] hover:to-[#1e6b73]"
        >
          <Plus className="w-4 h-4 mr-2" />
          학생 추가
        </Button>
      </div>

      {/* Add/Edit Student Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-lg shadow-md border border-gray-200 p-6"
          >
            <h3 className="font-bold text-lg mb-4">
              {editingStudent ? '학생 정보 수정' : '새 학생 추가'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이름 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d7a7c]"
                  placeholder="학생 이름"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일 *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d7a7c]"
                  placeholder="student@example.com"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingStudent(null);
                    setFormData({ name: '', email: '' });
                  }}
                  variant="outline"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-[#005f61] to-[#2d7a7c] text-white"
                >
                  {editingStudent ? '수정' : '추가'}
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="학생 이름 또는 이메일로 검색..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d7a7c]"
            />
          </div>
          <div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d7a7c]"
            >
              <option value="all">전체 기간</option>
              {availableMonths.map(month => (
                <option key={month} value={month}>
                  {formatMonthDisplay(month)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="space-y-4">
        {filteredStudents.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
            <User className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">
              {searchQuery ? '검색 결과가 없습니다.' : '등록된 학생이 없습니다.'}
            </p>
          </div>
        ) : (
          filteredStudents.map(student => {
            const stats = getStudentStats(student.id);
            const studentScores = getStudentScores(student.id);
            const isExpanded = expandedStudents.has(student.id);

            return (
              <div
                key={student.id}
                className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
              >
                {/* Student Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#2d7a7c] to-[#1e6b73] flex items-center justify-center text-white font-bold text-lg">
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-gray-800">{student.name}</h3>
                          {student.registeredVia === 'registration_form' && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                              회원가입
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{student.email}</p>
                        {student.phoneNumber && (
                          <p className="text-sm text-gray-600">전화: {student.phoneNumber}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          등록일: {formatDate(student.enrolledDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEdit(student)}
                        variant="outline"
                        size="sm"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        수정
                      </Button>
                      <Button
                        onClick={() => handleDelete(student)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        삭제
                      </Button>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-600 mb-1">시험 횟수</p>
                      <p className="text-xl font-bold text-blue-600">{stats.totalTests}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-600 mb-1">평균 점수</p>
                      <p className="text-xl font-bold text-green-600">{stats.averageScore}%</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-600 mb-1">최고 점수</p>
                      <p className="text-xl font-bold text-purple-600">{stats.bestScore}%</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-600 mb-1">최저 점수</p>
                      <p className="text-xl font-bold text-orange-600">{stats.worstScore}%</p>
                    </div>
                    <div className="bg-teal-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-600 mb-1">정답률</p>
                      <p className="text-xl font-bold text-teal-600">
                        {stats.totalQuestions > 0 
                          ? `${stats.totalCorrect}/${stats.totalQuestions}`
                          : '0/0'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Toggle Details Button */}
                  {studentScores.length > 0 && (
                    <div className="space-y-2">
                      <Button
                        onClick={() => setShowPersonalDashboard(student)}
                        className="w-full text-white mb-2"
                        style={{ backgroundColor: '#3B4A8C' }}
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        개인 결과 분석 보기
                      </Button>
                      <Button
                        onClick={() => toggleStudentExpanded(student.id)}
                        variant="outline"
                        className="w-full"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-2" />
                            상세 성적 숨기기
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-2" />
                            상세 성적 보기 ({studentScores.length}개)
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Detailed Scores */}
                <AnimatePresence>
                  {isExpanded && studentScores.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-gray-200 bg-gray-50"
                    >
                      <div className="p-6">
                        <h4 className="font-bold text-sm text-gray-700 mb-4 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4" />
                          시험 기록
                          {selectedMonth !== 'all' && (
                            <span className="text-xs font-normal text-gray-500">
                              ({formatMonthDisplay(selectedMonth)})
                            </span>
                          )}
                        </h4>
                        <div className="space-y-3">
                          {studentScores.map((score, index) => (
                            <div
                              key={score.id}
                              className="bg-white rounded-lg p-4 border border-gray-200"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="font-medium text-gray-800">
                                    시험 #{studentScores.length - index}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatDate(score.date)}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className={`text-2xl font-bold ${
                                    score.percentage >= 80 ? 'text-green-600' :
                                    score.percentage >= 60 ? 'text-orange-600' :
                                    'text-red-600'
                                  }`}>
                                    {score.percentage}%
                                  </p>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-3 text-sm">
                                <div>
                                  <p className="text-gray-600">범위</p>
                                  <p className="font-medium">{score.dayRange}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600">정답</p>
                                  <p className="font-medium text-green-600">
                                    {score.correctAnswers}/{score.totalQuestions}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-600">유형</p>
                                  <p className="font-medium">
                                    {score.testType === 'multiple' && '객관식'}
                                    {score.testType === 'subjective' && '주관식'}
                                    {score.testType === 'mixed' && '혼합'}
                                  </p>
                                </div>
                              </div>
                              {score.wrongWords.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <p className="text-xs text-gray-600 mb-2">
                                    틀린 단어 ({score.wrongWords.length}개):
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {score.wrongWords.map((word, i) => (
                                      <span
                                        key={i}
                                        className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded"
                                      >
                                        {word}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}