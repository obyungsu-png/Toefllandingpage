import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Upload, X, Check } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface ParsedQuestion {
  type: 'fillblanks' | 'readnotice' | 'readpassage';
  title?: string;
  content: string;
  blanks?: Array<{ id: number; word: string; position: number; context: string }>;
  notice?: {
    title: string;
    subtitle?: string;
    body: string;
  };
  question?: string;
  options?: string[];
  correctAnswer?: string;
}

export function QuestionUploader() {
  const [isOpen, setIsOpen] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [previewMode, setPreviewMode] = useState(false);

  const parseHTML = (html: string): ParsedQuestion[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const questions: ParsedQuestion[] = [];

    // Parse Fill Blanks questions
    const fillBlanksElements = doc.querySelectorAll('fillblanks, .fillblanks, [data-type="fillblanks"]');
    fillBlanksElements.forEach((element) => {
      const title = element.querySelector('title, .title, h1, h2')?.textContent || 'Fill in the missing letters in the paragraph.';
      const paragraph = element.querySelector('paragraph, .paragraph, p')?.innerHTML || '';
      
      const blanks: Array<{ id: number; word: string; position: number; context: string }> = [];
      let blankId = 1;
      
      // Parse blanks from HTML like: some text <blank word="at">...</blank> more text
      const blankElements = element.querySelectorAll('blank, .blank, [data-blank]');
      blankElements.forEach((blank) => {
        const word = blank.getAttribute('word') || blank.getAttribute('data-word') || blank.textContent?.trim() || '';
        if (word) {
          blanks.push({
            id: blankId++,
            word,
            position: blankId - 1,
            context: ''
          });
        }
      });

      questions.push({
        type: 'fillblanks',
        title,
        content: paragraph,
        blanks
      });
    });

    // Parse Read Notice questions
    const readNoticeElements = doc.querySelectorAll('readnotice, .readnotice, [data-type="readnotice"]');
    readNoticeElements.forEach((element) => {
      const noticeTitle = element.querySelector('noticetitle, .notice-title, .title')?.textContent || 'Notice';
      const noticeSubtitle = element.querySelector('noticesubtitle, .notice-subtitle, .subtitle')?.textContent || '';
      const noticeBody = element.querySelector('noticebody, .notice-body, .body, p')?.textContent || '';
      const question = element.querySelector('question, .question')?.textContent || 'What type of business issued the notice?';
      
      const options: string[] = [];
      const optionElements = element.querySelectorAll('option, .option, li');
      optionElements.forEach((opt) => {
        const optText = opt.textContent?.trim();
        if (optText) options.push(optText);
      });

      const correctAnswer = element.querySelector('answer, .answer, [data-correct]')?.textContent?.trim() || '';

      questions.push({
        type: 'readnotice',
        notice: {
          title: noticeTitle,
          subtitle: noticeSubtitle,
          body: noticeBody
        },
        question,
        options,
        correctAnswer
      });
    });

    // Parse Read Academic Passage questions
    const readPassageElements = doc.querySelectorAll('readpassage, .readpassage, [data-type="readpassage"]');
    readPassageElements.forEach((element) => {
      const title = element.querySelector('title, .title, h1, h2')?.textContent || 'Read an academic passage.';
      const passage = element.querySelector('passage, .passage, article, p')?.textContent || '';
      const question = element.querySelector('question, .question')?.textContent || '';
      
      const options: string[] = [];
      const optionElements = element.querySelectorAll('option, .option, li');
      optionElements.forEach((opt) => {
        const optText = opt.textContent?.trim();
        if (optText) options.push(optText);
      });

      const correctAnswer = element.querySelector('answer, .answer, [data-correct]')?.textContent?.trim() || '';

      questions.push({
        type: 'readpassage',
        title,
        content: passage,
        question,
        options,
        correctAnswer
      });
    });

    return questions;
  };

  const handleParse = () => {
    try {
      const parsed = parseHTML(htmlContent);
      if (parsed.length === 0) {
        toast.error('未能解析任何问题。请检查HTML格式。');
        return;
      }
      setParsedQuestions(parsed);
      setPreviewMode(true);
      toast.success(`成功解析 ${parsed.length} 个问题！`);
    } catch (error) {
      toast.error('解析失败，请检查HTML格式。');
      console.error(error);
    }
  };

  const handleSave = () => {
    // Here you would save the parsed questions to your state management or database
    // For now, we'll just show a success message and log to console
    console.log('Saving questions:', parsedQuestions);
    toast.success('问题已保存！');
    setIsOpen(false);
    setHtmlContent('');
    setParsedQuestions([]);
    setPreviewMode(false);
  };

  const handleReset = () => {
    setHtmlContent('');
    setParsedQuestions([]);
    setPreviewMode(false);
  };

  const exampleHTML = `<!-- Fill Blanks 示例 -->
<fillblanks>
  <title>Fill in the missing letters in the paragraph.</title>
  <paragraph>
    We know from drawings that have been preserved in caves for over 10,000 years 
    that early humans performed dances as a group activity. We might think 
    th<blank word="at"></blank> prehistoric peo<blank word="ple"></blank> 
    concentrated o<blank word="n"></blank> on ba<blank word="sic"></blank> survival.
  </paragraph>
</fillblanks>

<!-- Read Notice 示例 -->
<readnotice>
  <noticetitle>Municipal Charter</noticetitle>
  <noticesubtitle>Sign up for paperless billing statements today.</noticesubtitle>
  <noticebody>
    Safe, convenient, easy. Enroll in paperless billing to receive 
    monthly savings account statements in an electronic PDF document. 
    Access your Municipal Charter account through the mobile app and 
    select account preferences in the upper right-hand corner to enroll.
  </noticebody>
  <question>What type of business issued the notice?</question>
  <option>An Internet provider</option>
  <option>A computer company</option>
  <option>A paper company</option>
  <option>A bank</option>
  <answer>A bank</answer>
</readnotice>`;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="border-2 border-blue-500 text-blue-600 hover:bg-blue-50 hover:border-blue-600 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <Upload className="w-4 h-4 mr-2" />
          上传题目
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Upload className="w-5 h-5 text-blue-600" />
            TOEFL 问题上传系统
          </DialogTitle>
          <DialogDescription>
            上传和解析 TOEFL 练习题，支持填空题、阅读公告和学术阅读等多种题型。
          </DialogDescription>
        </DialogHeader>
        
        {!previewMode ? (
          <div className="space-y-4">
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                粘贴HTML格式的问题内容：
              </label>
              <Textarea
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                placeholder="在此粘贴HTML格式的问题..."
                className="min-h-[400px] font-mono text-sm"
              />
            </div>
            
            <details className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <summary className="cursor-pointer font-medium text-gray-700 hover:text-blue-600">
                查看HTML格式示例
              </summary>
              <pre className="mt-3 text-xs bg-white p-3 rounded border border-gray-200 overflow-x-auto">
                {exampleHTML}
              </pre>
            </details>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                取消
              </Button>
              <Button 
                onClick={handleParse}
                disabled={!htmlContent.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                解析问题
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-800">解析成功！</p>
                <p className="text-sm text-green-700 mt-1">
                  成功解析了 {parsedQuestions.length} 个问题
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {parsedQuestions.map((q, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-500">
                      问题 #{index + 1}
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                      {q.type === 'fillblanks' ? '填空题' : 
                       q.type === 'readnotice' ? '阅读公告' : '学术阅读'}
                    </span>
                  </div>
                  
                  {q.type === 'fillblanks' && (
                    <div>
                      <p className="font-medium text-gray-900 mb-2">{q.title}</p>
                      <p className="text-sm text-gray-600 mb-2">空格数量: {q.blanks?.length || 0}</p>
                      <div className="text-sm text-gray-500 bg-gray-50 p-2 rounded">
                        {q.blanks?.map(b => b.word).join(', ')}
                      </div>
                    </div>
                  )}
                  
                  {q.type === 'readnotice' && (
                    <div>
                      <p className="font-medium text-gray-900 mb-1">{q.notice?.title}</p>
                      {q.notice?.subtitle && (
                        <p className="text-sm text-gray-600 mb-2">{q.notice.subtitle}</p>
                      )}
                      <p className="font-medium text-gray-800 mt-3 mb-2">{q.question}</p>
                      <div className="text-sm text-gray-600">
                        选项数量: {q.options?.length || 0}
                      </div>
                    </div>
                  )}
                  
                  {q.type === 'readpassage' && (
                    <div>
                      <p className="font-medium text-gray-900 mb-2">{q.title}</p>
                      <p className="font-medium text-gray-800 mb-2">{q.question}</p>
                      <div className="text-sm text-gray-600">
                        选项数量: {q.options?.length || 0}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={handleReset}>
                <X className="w-4 h-4 mr-2" />
                重新上传
              </Button>
              <Button 
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="w-4 h-4 mr-2" />
                保存问题
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
