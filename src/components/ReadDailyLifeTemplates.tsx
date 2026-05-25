import React, { useState } from 'react';
import { Button } from './ui/button';
import { Plus, Save, Eye, Trash2, FileText, Mail, MessageSquare, Megaphone, Newspaper, ShoppingCart, ClipboardList } from 'lucide-react';
// motion removed - using CSS animations
import type { TPOQuestion } from './ContentManagement';

// Template definition
export interface DailyLifeTemplate {
  id: string;
  name: string;
  icon: string; // icon key
  category: 'notice' | 'email' | 'social_media' | 'advertisement' | 'article' | 'form' | 'custom';
  // HTML structure template with {{placeholders}}
  structure: string;
  // Default field values
  fields: Record<string, string>;
  // Field labels (for the editor UI)
  fieldLabels: Record<string, string>;
}

// Built-in sample templates
const BUILT_IN_TEMPLATES: DailyLifeTemplate[] = [
  {
    id: 'notice-1',
    name: 'Public Notice (공지문)',
    icon: 'clipboard',
    category: 'notice',
    structure: 'notice',
    fields: {
      title: 'Municipal Charter',
      subtitle: 'Sign up for paperless billing statements today.',
      body: 'Safe, convenient, easy. Enroll in paperless billing to receive monthly savings account statements in an electronic PDF document. Access your Municipal Charter account through the mobile app and select account preferences in the upper right-hand corner to enroll.',
    },
    fieldLabels: {
      title: 'Notice Title',
      subtitle: 'Subtitle / Tagline',
      body: 'Body Text',
    }
  },
  {
    id: 'email-1',
    name: 'Email (이메일)',
    icon: 'mail',
    category: 'email',
    structure: 'email',
    fields: {
      to: 'edward56L@dmail.com',
      from: 'artforeveryone@dmail.com',
      date: 'September 2',
      subject: 'Your Membership Renewal',
      body: 'Dear Edward,\n\nThank you for being a valued member of Art For Everyone. We noticed that your annual membership is set to expire on October 1st.\n\nTo continue enjoying unlimited access to our galleries, workshops, and special exhibitions, please renew your membership before the expiration date.\n\nBest regards,\nMembership Services Team',
    },
    fieldLabels: {
      to: 'To',
      from: 'From',
      date: 'Date',
      subject: 'Subject',
      body: 'Email Body',
    }
  },
  {
    id: 'social-1',
    name: 'Social Media Post (소셜미디어)',
    icon: 'message',
    category: 'social_media',
    structure: 'social_media',
    fields: {
      platform: 'Community Forum',
      username: '@GreenLiving_Sara',
      timestamp: '2 hours ago',
      content: 'Just discovered that our local farmers market is now open every Wednesday AND Saturday! The fresh organic produce is amazing and the prices are so much better than the supermarket. Plus, you\'re supporting local farmers. Win-win!',
      likes: '47',
      comments: '12',
      shares: '8',
    },
    fieldLabels: {
      platform: 'Platform Name',
      username: 'Username',
      timestamp: 'Time Stamp',
      content: 'Post Content',
      likes: 'Likes',
      comments: 'Comments',
      shares: 'Shares',
    }
  },
  {
    id: 'ad-1',
    name: 'Advertisement (광고)',
    icon: 'megaphone',
    category: 'advertisement',
    structure: 'advertisement',
    fields: {
      headline: 'GRAND OPENING SALE',
      business: 'TechWorld Electronics',
      offer: 'Up to 50% OFF on all laptops and tablets this weekend only!',
      details: '• Free screen protector with every purchase\n• Extended warranty available\n• Free delivery on orders over $100\n• Open 9 AM - 9 PM, Saturday & Sunday',
      location: '123 Main Street, Downtown Plaza',
      contact: 'www.techworldelectronics.com | (555) 123-4567',
    },
    fieldLabels: {
      headline: 'Headline',
      business: 'Business Name',
      offer: 'Main Offer',
      details: 'Details',
      location: 'Location',
      contact: 'Contact Info',
    }
  },
  {
    id: 'article-1',
    name: 'News Article (뉴스 기사)',
    icon: 'newspaper',
    category: 'article',
    structure: 'article',
    fields: {
      source: 'The Daily Tribune',
      headline: 'City Council Approves New Public Library Branch',
      date: 'March 5, 2026',
      author: 'By Jennifer Chen, Staff Reporter',
      body: 'The City Council voted unanimously last night to approve the construction of a new public library branch in the Riverside neighborhood. The $4.2 million project is expected to break ground this summer and open its doors to the public by late 2027.\n\nThe new facility will include a children\'s reading room, a technology lab, and community meeting spaces.',
    },
    fieldLabels: {
      source: 'News Source',
      headline: 'Headline',
      date: 'Date',
      author: 'Author',
      body: 'Article Body',
    }
  },
  {
    id: 'form-1',
    name: 'Order/Form (주문서/양식)',
    icon: 'shopping',
    category: 'form',
    structure: 'form',
    fields: {
      title: 'Office Supply Order Form',
      company: 'QuickShip Office Supplies',
      tableHeaders: 'Item,Quantity,Unit Price,Total',
      tableRows: 'Copy Paper (500 sheets),10,$4.50,$45.00\nBallpoint Pens (box of 12),5,$3.25,$16.25\nFile Folders (pack of 50),3,$7.99,$23.97\nSticky Notes (pack of 6),8,$2.50,$20.00',
      footer: 'Subtotal: $105.22\nShipping: $8.99\nTotal: $114.21\n\nDelivery estimated: 3-5 business days',
    },
    fieldLabels: {
      title: 'Form Title',
      company: 'Company Name',
      tableHeaders: 'Table Headers (comma-separated)',
      tableRows: 'Table Rows (comma-separated per row, newline per row)',
      footer: 'Footer / Summary',
    }
  },
];

const iconMap: Record<string, React.ReactNode> = {
  clipboard: <ClipboardList className="w-5 h-5" />,
  mail: <Mail className="w-5 h-5" />,
  message: <MessageSquare className="w-5 h-5" />,
  megaphone: <Megaphone className="w-5 h-5" />,
  newspaper: <Newspaper className="w-5 h-5" />,
  shopping: <ShoppingCart className="w-5 h-5" />,
  custom: <FileText className="w-5 h-5" />,
};

interface ReadDailyLifeTemplatesProps {
  onSave?: (question: TPOQuestion) => void;
  testType?: string;
  testNumber?: number;
  savedTemplates?: DailyLifeTemplate[];
  onSaveTemplate?: (template: DailyLifeTemplate) => void;
  onDeleteTemplate?: (id: string) => void;
}

export function ReadDailyLifeTemplates({
  onSave,
  testType = 'TPO',
  testNumber = 1,
  savedTemplates = [],
  onSaveTemplate,
  onDeleteTemplate
}: ReadDailyLifeTemplatesProps) {
  const allTemplates = [...BUILT_IN_TEMPLATES, ...savedTemplates];
  const [selectedTemplate, setSelectedTemplate] = useState<DailyLifeTemplate | null>(null);
  const [editedFields, setEditedFields] = useState<Record<string, string>>({});
  const [previewMode, setPreviewMode] = useState(false);
  const [questionText, setQuestionText] = useState('What type of business issued the notice?');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [showNewTemplateForm, setShowNewTemplateForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState<Partial<DailyLifeTemplate>>({
    name: '',
    category: 'custom',
    icon: 'custom',
    fields: {},
    fieldLabels: {},
  });
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  
  // Question metadata fields
  const [questionNumber, setQuestionNumber] = useState('1');
  const [questionType, setQuestionType] = useState('Read in Daily Life');
  const [module, setModule] = useState<'Module 1' | 'Module 2'>('Module 1');
  const [difficulty, setDifficulty] = useState<'쉬움' | '보통' | '어려움'>('보통');

  // Color theme for template rendering
  const COLOR_THEMES = [
    { id: 'teal',   label: '기본 (Teal)',   primary: '#1e6b73', border: '#1e6b73', bg: '#1e6b73', text: 'white' },
    { id: 'gray',   label: '회색 (Gray)',   primary: '#6b7280', border: '#6b7280', bg: '#6b7280', text: 'white' },
    { id: 'blue',   label: '파란색 (Blue)', primary: '#2563eb', border: '#2563eb', bg: '#2563eb', text: 'white' },
    { id: 'black',  label: '검은색 (Black)', primary: '#111827', border: '#111827', bg: '#111827', text: 'white' },
    { id: 'purple', label: '자주색 (Purple)', primary: '#7c3aed', border: '#7c3aed', bg: '#7c3aed', text: 'white' },
    { id: 'orange', label: '주황색 (Orange)', primary: '#ea580c', border: '#ea580c', bg: '#ea580c', text: 'white' },
  ] as const;
  type ColorThemeId = typeof COLOR_THEMES[number]['id'];
  const [colorThemeId, setColorThemeId] = useState<ColorThemeId>('teal');
  const colorTheme = COLOR_THEMES.find(t => t.id === colorThemeId) || COLOR_THEMES[0];

  const selectTemplate = (template: DailyLifeTemplate) => {
    setSelectedTemplate(template);
    setEditedFields({ ...template.fields });
    setPreviewMode(false);
  };

  const updateField = (key: string, value: string) => {
    setEditedFields(prev => ({ ...prev, [key]: value }));
  };

  // Render preview based on template structure (uses colorTheme)
  const renderPreview = () => {
    if (!selectedTemplate) return null;
    const f = editedFields;
    const c = colorTheme.primary; // main color hex

    switch (selectedTemplate.structure) {
      case 'notice':
        return (
          <div className="border-[3px] p-6" style={{ borderColor: c }}>
            <div className="border-2 p-6" style={{ borderColor: c }}>
              {f.title && <h2 className="text-2xl font-[\'Inter\',_sans-serif] font-bold text-center mb-4" style={{ color: c }}>{f.title}</h2>}
              {f.subtitle && <p className="text-center font-[\'Inter\',_sans-serif] font-medium mb-4">{f.subtitle}</p>}
              {f.body && <p className="font-[\'Inter\',_sans-serif] leading-relaxed whitespace-pre-wrap">{f.body}</p>}
            </div>
          </div>
        );

      case 'email':
        return (
          <div className="rounded-lg overflow-hidden border-4" style={{ borderColor: c }}>
            <div className="bg-white">
              {['to', 'from', 'date', 'subject'].map(key => f[key] ? (
                <div key={key} className="flex border-b-2" style={{ borderColor: c }}>
                  <div className="font-[\'Inter\',_sans-serif] font-bold px-4 py-2 w-24 text-sm capitalize text-white" style={{ backgroundColor: c }}>{key}:</div>
                  <div className="flex-1 bg-white px-4 py-2 font-[\'Inter\',_sans-serif] text-sm">{f[key]}</div>
                </div>
              ) : null)}
            </div>
            <div className="p-4 font-[\'Inter\',_sans-serif] leading-relaxed text-sm whitespace-pre-wrap border-4 m-1" style={{ borderColor: c }}>
              {f.body}
            </div>
          </div>
        );

      case 'social_media':
        return (
          <div className="border-2 border-gray-300 rounded-xl overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-300 text-white font-[\'Inter\',_sans-serif] font-bold text-sm" style={{ backgroundColor: c }}>
              {f.platform}
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: c }}>
                  {(f.username || 'U')[1]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-[\'Inter\',_sans-serif] font-bold text-sm">{f.username}</p>
                  <p className="text-xs text-gray-500">{f.timestamp}</p>
                </div>
              </div>
              <p className="font-[\'Inter\',_sans-serif] leading-relaxed text-sm mb-3 whitespace-pre-wrap">{f.content}</p>
              <div className="flex gap-4 text-xs text-gray-500 border-t border-gray-200 pt-2">
                {f.likes && <span>♥ {f.likes}</span>}
                {f.comments && <span>💬 {f.comments}</span>}
                {f.shares && <span>↗ {f.shares}</span>}
              </div>
            </div>
          </div>
        );

      case 'advertisement':
        return (
          <div className="border-4 border-double p-6" style={{ borderColor: c }}>
            <div className="text-center mb-4">
              <h2 className="text-2xl font-[\'Inter\',_sans-serif] font-black tracking-wide" style={{ color: c }}>{f.headline}</h2>
              {f.business && <p className="font-[\'Inter\',_sans-serif] font-bold text-lg mt-1">{f.business}</p>}
            </div>
            {f.offer && (
              <div className="rounded-lg p-4 mb-4 text-center border-2" style={{ borderColor: c, backgroundColor: c + '15' }}>
                <p className="font-[\'Inter\',_sans-serif] font-bold text-lg" style={{ color: c }}>{f.offer}</p>
              </div>
            )}
            {f.details && <div className="font-[\'Inter\',_sans-serif] text-sm leading-relaxed whitespace-pre-wrap mb-4">{f.details}</div>}
            <div className="border-t-2 pt-3 text-center" style={{ borderColor: c }}>
              {f.location && <p className="font-[\'Inter\',_sans-serif] text-sm font-medium">{f.location}</p>}
              {f.contact && <p className="font-[\'Inter\',_sans-serif] text-xs text-gray-600 mt-1">{f.contact}</p>}
            </div>
          </div>
        );

      case 'article':
        return (
          <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
            <div className="text-white px-4 py-2 text-center" style={{ backgroundColor: c }}>
              <span className="font-[\'Georgia\',_serif] font-bold text-lg italic">{f.source}</span>
            </div>
            <div className="p-5">
              <h2 className="text-xl font-[\'Georgia\',_serif] font-bold mb-2">{f.headline}</h2>
              <div className="flex items-center gap-3 text-xs text-gray-500 mb-4 border-b border-gray-200 pb-3">
                {f.date && <span>{f.date}</span>}
                {f.author && <><span>|</span><span>{f.author}</span></>}
              </div>
              <p className="font-[\'Georgia\',_serif] leading-relaxed text-sm whitespace-pre-wrap">{f.body}</p>
            </div>
          </div>
        );

      case 'form':
        return (
          <div className="border-2 border-gray-400 rounded-lg overflow-hidden">
            <div className="text-white px-4 py-3 text-center" style={{ backgroundColor: c }}>
              <h2 className="font-[\'Inter\',_sans-serif] font-bold">{f.title}</h2>
              {f.company && <p className="text-xs text-white/80">{f.company}</p>}
            </div>
            <div className="p-4">
              {f.tableHeaders && f.tableRows && (
                <table className="w-full border-collapse mb-4">
                  <thead>
                    <tr style={{ backgroundColor: c + '20' }}>
                      {f.tableHeaders.split(',').map((h: string, i: number) => (
                        <th key={i} className="border px-3 py-2 text-xs font-[\'Inter\',_sans-serif] font-bold text-left" style={{ borderColor: c }}>{h.trim()}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {f.tableRows.split('\n').filter((r: string) => r.trim()).map((row: string, i: number) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {row.split(',').map((cell: string, j: number) => (
                          <td key={j} className="border px-3 py-2 text-xs font-[\'Inter\',_sans-serif]" style={{ borderColor: c }}>{cell.trim()}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {f.footer && <div className="text-xs font-[\'Inter\',_sans-serif] whitespace-pre-wrap text-gray-700 border-t pt-3" style={{ borderColor: c }}>{f.footer}</div>}
            </div>
          </div>
        );

      default:
        return (
          <div className="border-2 border-gray-300 rounded-lg p-5 space-y-3">
            {Object.entries(f).map(([key, value]) => (
              <div key={key}>
                <p className="text-xs font-bold uppercase mb-1" style={{ color: c }}>{selectedTemplate.fieldLabels[key] || key}</p>
                <p className="font-[\'Inter\',_sans-serif] text-sm whitespace-pre-wrap">{String(value)}</p>
              </div>
            ))}
          </div>
        );
    }
  }
  // Add new field to custom template
  const addFieldToNewTemplate = () => {
    if (!newFieldName.trim()) return;
    const key = newFieldName.trim().toLowerCase().replace(/\s+/g, '_');
    setNewTemplate(prev => ({
      ...prev,
      fields: { ...prev.fields, [key]: '' },
      fieldLabels: { ...prev.fieldLabels, [key]: newFieldLabel || newFieldName },
    }));
    setNewFieldName('');
    setNewFieldLabel('');
  };

  // Save new template
  const saveNewTemplate = () => {
    if (!newTemplate.name || !onSaveTemplate) return;
    const template: DailyLifeTemplate = {
      id: `custom-${Date.now()}`,
      name: newTemplate.name,
      icon: newTemplate.icon || 'custom',
      category: (newTemplate.category as any) || 'custom',
      structure: 'custom',
      fields: newTemplate.fields || {},
      fieldLabels: newTemplate.fieldLabels || {},
    };
    onSaveTemplate(template);
    setShowNewTemplateForm(false);
    setNewTemplate({ name: '', category: 'custom', icon: 'custom', fields: {}, fieldLabels: {} });
  };

  // Save as TPOQuestion
  const handleSave = () => {
    if (!onSave || !selectedTemplate) return;

    const question: TPOQuestion = {
      id: `q-daily-${Date.now()}`,
      questionNumber: questionNumber, // Keep as string or number
      questionText: questionText,
      questionType: `${questionType} (${module})`, // Include module in questionType
      options: options.filter(o => o.trim()),
      correctAnswer: correctAnswer,
      difficulty: difficulty,
      passageText: JSON.stringify({
        templateId: selectedTemplate.id,
        structure: selectedTemplate.structure,
        color: colorThemeId,
        fields: editedFields,
      }),
    };

    onSave(question);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2d7a7c] to-[#1e6b73] p-4 md:p-5">
        <h2 className="text-lg md:text-xl text-white font-bold flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Read in Daily Life - Template Builder
        </h2>
        <p className="text-white/80 text-sm mt-1">
          샘플 템플릿을 선택하여 문제를 빠르게 만들 수 있습니다
        </p>
      </div>

      <div className="p-4 md:p-6 space-y-5">
        {/* Template Selection Grid */}
        {!selectedTemplate && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {allTemplates.map(template => (
                <button
                  key={template.id}
                  onClick={() => selectTemplate(template)}
                  className="group relative flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-xl hover:border-[#1e6b73] hover:bg-[#f0f9f9] transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-[#e8f4f4] text-[#1e6b73] flex items-center justify-center group-hover:bg-[#1e6b73] group-hover:text-white transition-all">
                    {iconMap[template.icon] || iconMap.custom}
                  </div>
                  <span className="text-sm font-medium text-gray-800 text-center">{template.name}</span>
                  <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                    {template.category}
                  </span>
                  {/* Delete button for custom templates */}
                  {template.id.startsWith('custom-') && onDeleteTemplate && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteTemplate(template.id); }}
                      className="absolute top-1 right-1 p-1 rounded-full bg-red-100 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </button>
              ))}

              {/* Add New Template Button */}
              <button
                onClick={() => setShowNewTemplateForm(true)}
                className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#e67e22] hover:bg-orange-50 transition-all"
              >
                <Plus className="w-8 h-8 text-gray-400" />
                <span className="text-sm font-medium text-gray-500">새 템플릿 추가</span>
              </button>
            </div>

            {/* New Template Form */}
            <>
              {showNewTemplateForm && (
                <div
                  className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3 animate-[fadeSlideUp_0.2s_ease-out]"
                >
                  <h3 className="font-bold text-orange-800 text-sm">새 템플릿 만들기</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Template Name</label>
                      <input
                        type="text"
                        value={newTemplate.name || ''}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]"
                        placeholder="예: 도서관 게시판"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={newTemplate.category || 'custom'}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]"
                      >
                        <option value="notice">Notice</option>
                        <option value="email">Email</option>
                        <option value="social_media">Social Media</option>
                        <option value="advertisement">Advertisement</option>
                        <option value="article">Article</option>
                        <option value="form">Form/Table</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                  </div>

                  {/* Add Fields */}
                  <div className="border-t border-orange-200 pt-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">Fields (입력 필드 추가)</p>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newFieldName}
                        onChange={(e) => setNewFieldName(e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-xs"
                        placeholder="Field key (e.g., title)"
                      />
                      <input
                        type="text"
                        value={newFieldLabel}
                        onChange={(e) => setNewFieldLabel(e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-xs"
                        placeholder="Label (e.g., 제목)"
                      />
                      <Button size="sm" onClick={addFieldToNewTemplate} className="bg-[#2d7a7c] text-white text-xs px-3">
                        추가
                      </Button>
                    </div>
                    {Object.entries(newTemplate.fieldLabels || {}).length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(newTemplate.fieldLabels || {}).map(([key, label]) => (
                          <span key={key} className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                            {label as string} ({key})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => setShowNewTemplateForm(false)} className="text-xs">
                      취소
                    </Button>
                    <Button
                      size="sm"
                      onClick={saveNewTemplate}
                      className="bg-gradient-to-r from-[#e67e22] to-[#f39c12] text-white text-xs"
                      disabled={!newTemplate.name || Object.keys(newTemplate.fields || {}).length === 0}
                    >
                      <Save className="w-3 h-3 mr-1" />
                      템플릿 저장
                    </Button>
                  </div>
                </div>
              )}
            </>
          </>
        )}

        {/* Template Editor */}
        {selectedTemplate && (
          <div className="space-y-4">
            {/* Back to templates */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => { setSelectedTemplate(null); setPreviewMode(false); }}
                className="text-sm text-[#1e6b73] hover:underline flex items-center gap-1"
              >
                ← 템플릿 목록으로 돌아가기
              </button>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={previewMode ? 'default' : 'outline'}
                  onClick={() => setPreviewMode(!previewMode)}
                  className={previewMode ? 'bg-[#2d7a7c] text-white' : ''}
                >
                  {previewMode ? <Eye className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                  {previewMode ? 'Preview ON' : 'Preview'}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-[#f0f9f9] p-3 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-[#1e6b73] text-white flex items-center justify-center">
                {iconMap[selectedTemplate.icon] || iconMap.custom}
              </div>
              <div>
                <p className="font-bold text-[#1e6b73] text-sm">{selectedTemplate.name}</p>
                <p className="text-xs text-gray-500">{selectedTemplate.category}</p>
              </div>
            </div>

            {previewMode ? (
              /* Preview */
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="bg-[#1e6b73] h-8 flex items-center px-4 rounded-t">
                  <span className="text-white font-bold text-xs">*toefl ibt - Preview</span>
                </div>
                <div className="bg-white p-6 rounded-b">
                  <h2 className="text-xl font-['Inter',_sans-serif] font-bold text-center mb-6">
                    Read a {selectedTemplate.category === 'notice' ? 'notice' : selectedTemplate.category === 'email' ? 'n email' : selectedTemplate.category === 'social_media' ? ' social media post' : selectedTemplate.category === 'advertisement' ? 'n advertisement' : selectedTemplate.category === 'article' ? 'n article' : selectedTemplate.category === 'form' ? ' form' : ' document'}.
                  </h2>
                  <div className="max-w-[550px] mx-auto">
                    {renderPreview()}
                  </div>
                </div>
              </div>
            ) : (
              /* Editor Fields */
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-700">Content Fields</h3>
                {Object.entries(selectedTemplate.fieldLabels).map(([key, label]) => {
                  const value = editedFields[key] || '';
                  const isLongField = key === 'body' || key === 'content' || key === 'details' || key === 'tableRows' || key === 'footer';
                  
                  return (
                    <div key={key}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                      {isLongField ? (
                        <textarea
                          value={value}
                          onChange={(e) => updateField(key, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]"
                          rows={5}
                        />
                      ) : (
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => updateField(key, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Question & Answer Section */}
            <div className="border-t border-gray-200 pt-4 space-y-3">
              <h3 className="text-sm font-bold text-gray-700">Question & Answers</h3>
              
              {/* Question Metadata Fields */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border-2 border-blue-200">
                <h4 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  문제 정보
                </h4>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Question Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={questionNumber}
                      onChange={(e) => setQuestionNumber(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Question Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={questionType}
                      onChange={(e) => setQuestionType(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c] focus:border-transparent"
                    >
                      <option value="Read in Daily Life">Read in Daily Life</option>
                      <option value="Practical Reading">Practical Reading</option>
                      <option value="Functional Text">Functional Text</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Module <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    {(['Module 1', 'Module 2'] as const).map((mod) => (
                      <button
                        key={mod}
                        type="button"
                        onClick={() => setModule(mod)}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border-2 transition-all ${
                          module === mod
                            ? mod === 'Module 1'
                              ? 'bg-[#1e6b73] border-[#1e6b73] text-white shadow-sm'
                              : 'bg-orange-500 border-orange-500 text-white shadow-sm'
                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'
                        }`}
                      >
                        {mod}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Question Text</label>
                <input
                  type="text"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2d7a7c]"
                  placeholder="What type of business issued the notice?"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Answer Options</label>
                <div className="space-y-2">
                  {options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={correctAnswer === opt && opt.trim() !== ''}
                        onChange={() => setCorrectAnswer(opt)}
                        className="accent-[#1e6b73]"
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...options];
                          newOpts[i] = e.target.value;
                          setOptions(newOpts);
                        }}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#2d7a7c]"
                        placeholder={`Option ${i + 1}`}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-1">정답 옵션의 라디오 버튼을 선택하세요</p>
              </div>

              {/* Color Theme Selector */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  색상 테마 (Color Theme)
                </label>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setColorThemeId(theme.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition-all ${
                        colorThemeId === theme.id
                          ? 'border-gray-800 shadow-md scale-105'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                      style={{ backgroundColor: theme.primary, color: 'white' }}
                      title={theme.label}
                    >
                      {colorThemeId === theme.id && <span>✓</span>}
                      {theme.label.split(' (')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty Selector */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  난이도 (Difficulty)
                </label>
                <div className="flex gap-2">
                  {(['쉬움', '보통', '어려움'] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setDifficulty(level)}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all ${
                        difficulty === level
                          ? level === '쉬움'
                            ? 'bg-green-100 border-green-500 text-green-700'
                            : level === '보통'
                            ? 'bg-blue-100 border-blue-500 text-blue-700'
                            : 'bg-red-100 border-red-500 text-red-700'
                          : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'
                      }`}
                    >
                      {level === '쉬움' ? '🟢 쉬움' : level === '보통' ? '🔵 보통' : '🔴 어려움'}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Save Button */}
            {onSave && (
              <div className="flex gap-3 justify-end pt-3 border-t border-gray-200">
                <Button
                  onClick={handleSave}
                  className="bg-gradient-to-r from-[#2d7a7c] to-[#1e6b73] text-white"
                  disabled={!questionText || options.filter(o => o.trim()).length < 2 || !correctAnswer}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {testType} {testNumber}에 저장
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Standalone CMS template renderer ───────────────────────────────────────
// Parses the JSON stored in CMS passageText and renders the correct visual
// template. Used by App.tsx test screens so they don't show raw JSON.
//
// JSON shape expected:
//   { "templateId": "email-1", "structure": "email", "fields": { ... } }
//
export function renderDailyLifePassage(passageText: string): React.ReactNode | null {
  if (!passageText) return null;

  // Try to parse as JSON template
  let parsed: { structure?: string; fields?: Record<string, string>; color?: string } | null = null;
  try {
    parsed = JSON.parse(passageText);
  } catch {
    return null; // plain text — caller handles it
  }

  if (!parsed?.structure || !parsed?.fields) return null;

  const f = parsed.fields;

  // Color theme: use saved color or default teal
  const COLOR_MAP: Record<string, string> = {
    teal:   '#1e6b73',
    gray:   '#6b7280',
    blue:   '#2563eb',
    black:  '#111827',
    purple: '#7c3aed',
    orange: '#ea580c',
  };
  const c = COLOR_MAP[parsed.color || 'teal'] || '#1e6b73';

  switch (parsed.structure) {
    case 'notice':
      return (
        <div className="border-[3px] p-4 md:p-6" style={{ borderColor: c }}>
          <div className="border-2 p-4 md:p-6" style={{ borderColor: c }}>
            {f.title && <h2 className="text-xl md:text-2xl font-['Inter',_sans-serif] font-bold text-center mb-3 md:mb-4">{f.title}</h2>}
            {f.subtitle && <p className="text-center font-['Inter',_sans-serif] font-medium mb-3 md:mb-4">{f.subtitle}</p>}
            {f.body && <p className="font-['Inter',_sans-serif] leading-relaxed whitespace-pre-wrap text-sm md:text-base">{f.body}</p>}
          </div>
        </div>
      );

    case 'email':
      return (
        <div className="border-2 md:border-4 rounded-lg overflow-hidden bg-white" style={{ borderColor: c }}>
          <div className="bg-white">
            {['to', 'from', 'date', 'subject'].map(key => f[key] ? (
              <div key={key} className="flex border-b-2" style={{ borderColor: c }}>
                <div className="text-white font-['Inter',_sans-serif] font-bold px-2 sm:px-4 py-2 w-16 sm:w-24 text-xs sm:text-sm capitalize" style={{ backgroundColor: c }}>{key}:</div>
                <div className="flex-1 bg-white px-2 sm:px-4 py-2 font-['Inter',_sans-serif] text-xs sm:text-sm">{f[key]}</div>
              </div>
            ) : null)}
          </div>
          <div className="p-3 sm:p-6 font-['Inter',_sans-serif] leading-relaxed text-xs sm:text-sm whitespace-pre-wrap border-2 sm:border-4 border-[#1e6b73] m-1 sm:m-2 max-h-[400px] overflow-y-auto">
            {f.body}
          </div>
        </div>
      );

    case 'social_media':
      return (
        <div className="border-2 border-gray-300 rounded-xl overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
            <span className="font-['Inter',_sans-serif] font-bold text-sm text-gray-800">{f.platform}</span>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: c }}>
                {(f.username || 'U')[1]?.toUpperCase() ?? 'U'}
              </div>
              <div>
                <p className="font-['Inter',_sans-serif] font-bold text-sm">{f.username}</p>
                <p className="text-xs text-gray-500">{f.timestamp}</p>
              </div>
            </div>
            <p className="font-['Inter',_sans-serif] leading-relaxed text-sm mb-3 whitespace-pre-wrap">{f.content}</p>
            <div className="flex gap-4 text-xs text-gray-500 border-t border-gray-200 pt-2">
              {f.likes && <span>♥ {f.likes}</span>}
              {f.comments && <span>💬 {f.comments}</span>}
              {f.shares && <span>↗ {f.shares}</span>}
            </div>
          </div>
        </div>
      );

    case 'advertisement':
      return (
        <div className="border-4 border-double border-black p-4 md:p-6">
          <div className="text-center mb-4">
            <h2 className="text-xl md:text-2xl font-['Inter',_sans-serif] font-black tracking-wide">{f.headline}</h2>
            {f.business && <p className="font-['Inter',_sans-serif] font-bold text-base md:text-lg mt-1">{f.business}</p>}
          </div>
          {f.offer && (
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-4 text-center">
              <p className="font-['Inter',_sans-serif] font-bold text-base md:text-lg">{f.offer}</p>
            </div>
          )}
          {f.details && <div className="font-['Inter',_sans-serif] text-sm leading-relaxed whitespace-pre-wrap mb-4">{f.details}</div>}
          <div className="border-t-2 border-black pt-3 text-center">
            {f.location && <p className="font-['Inter',_sans-serif] text-sm font-medium">{f.location}</p>}
            {f.contact && <p className="font-['Inter',_sans-serif] text-xs text-gray-600 mt-1">{f.contact}</p>}
          </div>
        </div>
      );

    case 'article':
      return (
        <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
          <div className="text-white px-4 py-2 text-center" style={{ backgroundColor: c }}>
            <span className="font-['Georgia',_serif] font-bold text-lg italic">{f.source}</span>
          </div>
          <div className="p-4 md:p-5">
            <h2 className="text-lg md:text-xl font-['Georgia',_serif] font-bold mb-2">{f.headline}</h2>
            <div className="flex items-center gap-3 text-xs text-gray-500 mb-4 border-b border-gray-200 pb-3">
              {f.date && <span>{f.date}</span>}
              {f.author && <><span>|</span><span>{f.author}</span></>}
            </div>
            <p className="font-['Georgia',_serif] leading-relaxed text-sm whitespace-pre-wrap">{f.body}</p>
          </div>
        </div>
      );

    case 'form':
      return (
        <div className="border-2 border-gray-400 rounded-lg overflow-hidden">
          <div className="text-white px-4 py-3 text-center" style={{ backgroundColor: c }}>
            <h2 className="font-['Inter',_sans-serif] font-bold">{f.title}</h2>
            {f.company && <p className="text-xs text-white/80">{f.company}</p>}
          </div>
          <div className="p-4">
            {f.tableHeaders && f.tableRows && (
              <table className="w-full border-collapse mb-4">
                <thead>
                  <tr className="bg-gray-100">
                    {f.tableHeaders.split(',').map((h, i) => (
                      <th key={i} className="border border-gray-300 px-3 py-2 text-xs font-['Inter',_sans-serif] font-bold text-left">{h.trim()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {f.tableRows.split('\n').filter(r => r.trim()).map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {row.split(',').map((cell, j) => (
                        <td key={j} className="border border-gray-300 px-3 py-2 text-xs font-['Inter',_sans-serif]">{cell.trim()}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {f.footer && <div className="text-xs font-['Inter',_sans-serif] whitespace-pre-wrap text-gray-700 border-t border-gray-300 pt-3">{f.footer}</div>}
          </div>
        </div>
      );

    default:
      // Custom: render all fields as labelled content
      return (
        <div className="border-2 border-gray-300 rounded-lg p-5 space-y-3">
          {Object.entries(f).map(([key, value]) => (
            <div key={key}>
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">{key}</p>
              <p className="font-['Inter',_sans-serif] text-sm whitespace-pre-wrap">{value}</p>
            </div>
          ))}
        </div>
      );
  }
}
