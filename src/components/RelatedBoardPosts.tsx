/**
 * RelatedBoardPosts.tsx — 특정 문제(question_key) 에 묶인 Board Q&A 를
 * 리뷰 화면 안에 간단히 노출.
 *
 * - 글이 없으면 null 리턴 (영역 자체가 안 뜸)
 * - 각 글의 제목·답변 요약·답변 상태를 작은 카드로 표시
 * - "Board 에서 자세히 보기" 링크로 전체 게시판으로 이동 (해시 라우팅)
 */
import { useEffect, useState } from 'react';
import { MessageSquare, CheckCircle2, Clock, ExternalLink } from 'lucide-react';
import { listPostsByQuestionKey, type BoardPost } from '../utils/boardPosts';

interface RelatedBoardPostsProps {
  questionKey: string | null | undefined;
  themeColor?: string;
}

export function RelatedBoardPosts({ questionKey, themeColor = '#005f61' }: RelatedBoardPostsProps) {
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!questionKey) { setPosts([]); setLoaded(true); return; }
    setLoaded(false);
    (async () => {
      const list = await listPostsByQuestionKey(questionKey);
      if (!cancelled) {
        setPosts(list);
        setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [questionKey]);

  if (!loaded || posts.length === 0) return null;

  return (
    <div
      className="mt-3 rounded-lg border p-3"
      style={{ borderColor: `${themeColor}30`, backgroundColor: `${themeColor}08` }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <MessageSquare className="w-4 h-4" style={{ color: themeColor }} />
          <span className="text-xs font-bold" style={{ color: themeColor }}>
            💬 이 문제에 관한 Q&amp;A ({posts.length})
          </span>
        </div>
        <a
          href="#/board"
          className="inline-flex items-center gap-0.5 text-[11px] font-semibold hover:underline"
          style={{ color: themeColor }}
          onClick={(e) => {
            // SPA 네비게이션 (해시) — React Router 가 /board 로 전환
            e.preventDefault();
            if (typeof window !== 'undefined') {
              window.location.hash = '#/board';
            }
          }}
        >
          Board 에서 보기
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <ul className="space-y-1.5">
        {posts.slice(0, 3).map(p => {
          const answered = !!p.answer_body;
          return (
            <li key={p.id} className="bg-white rounded-md border border-gray-200 p-2">
              <div className="flex items-start gap-2">
                {answered ? (
                  <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: themeColor }} />
                ) : (
                  <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-600" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 truncate">
                    {p.title}
                  </p>
                  {answered ? (
                    <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2">
                      {p.answer_body}
                    </p>
                  ) : (
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      답변 대기 중
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
        {posts.length > 3 && (
          <li className="text-[10px] text-gray-500 text-center pt-1">
            외 {posts.length - 3}건 더 — Board 에서 모두 보기
          </li>
        )}
      </ul>
    </div>
  );
}
