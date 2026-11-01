/**
 * VideoLectureButton.tsx — 학생용 "📺 선생님 강의 보기" 버튼 + 재생 모달
 * -----------------------------------------------------------------------------
 * 사용처: TPO/Test/Training 리뷰 화면의 각 문제 해설 영역.
 *
 * 동작:
 *  1) 마운트 시 getVideoByKey(questionKey) 로 해당 문제의 영상 조회.
 *  2) 없으면 아무것도 렌더하지 않음 (null) — 버튼 자체가 숨겨짐.
 *  3) 있으면 큼지막한 📺 버튼 노출. 클릭 시 VideoPlayerModal 오픈.
 *  4) 모달 오픈 직후 checkVideoAccess() 로 접근 권한 확인.
 *     - 'trial'    : 재생 가능 + "무료 체험 N일 남음" 상단 안내
 *     - 'licensed' : 재생 가능
 *     - 'login_required' / 'trial_expired' : 안내 카드 + CTA 노출
 *  5) 재생 가능 시 YouTube/Bilibili 중 입력된 것만 탭으로 노출.
 *     사용자가 "재생" 눌러야 iframe 로드 (자동 재생 X, 데이터 절약).
 *  6) 재생 시작 시 logVideoClick(key, provider) 호출 — 분석용 로그.
 */
import { useEffect, useState } from 'react';
import { Film, X, Youtube, ExternalLink, Loader2, Lock, Clock, Play } from 'lucide-react';
import { getVideoByKey, logVideoClick, type QuestionVideo } from '../utils/questionVideos';
import { checkVideoAccess, type VideoAccessResult } from '../utils/videoAccess';

type Provider = 'youtube' | 'bilibili';

// ── URL → embed 변환 ─────────────────────────────────────────────────
function extractYoutubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) {
      return u.pathname.replace(/^\//, '').split('/')[0] || null;
    }
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return v;
      // youtube.com/embed/XXX 형식
      const m = u.pathname.match(/\/embed\/([a-zA-Z0-9_-]+)/);
      if (m) return m[1];
      // youtube.com/shorts/XXX
      const s = u.pathname.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
      if (s) return s[1];
    }
  } catch { /* ignore */ }
  return null;
}

function youtubeEmbedUrl(url: string, startSec = 0): string | null {
  const id = extractYoutubeId(url);
  if (!id) return null;
  const q = startSec > 0 ? `?start=${Math.floor(startSec)}` : '';
  return `https://www.youtube.com/embed/${id}${q}`;
}

function extractBilibiliBvid(url: string): string | null {
  try {
    const u = new URL(url);
    // bilibili.com/video/BV1xx4y1x7qd/
    const m = u.pathname.match(/\/video\/(BV[a-zA-Z0-9]+)/);
    if (m) return m[1];
    // bvid 가 쿼리로 올 수도 있음
    const bv = u.searchParams.get('bvid');
    if (bv) return bv;
  } catch { /* ignore */ }
  return null;
}

function bilibiliEmbedUrl(url: string, startSec = 0): string | null {
  const bvid = extractBilibiliBvid(url);
  if (!bvid) return null;
  const t = startSec > 0 ? `&t=${Math.floor(startSec)}` : '';
  return `https://player.bilibili.com/player.html?bvid=${bvid}&page=1&high_quality=1&danmaku=0${t}`;
}

// ── 메인 — 버튼 ──────────────────────────────────────────────────────
interface VideoLectureButtonProps {
  questionKey:    string | null | undefined;
  themeColor?:    string;
  size?:          'sm' | 'md';
  onRequestLogin?: () => void;
}

export function VideoLectureButton({
  questionKey,
  themeColor = '#005f61',
  size = 'md',
  onRequestLogin,
}: VideoLectureButtonProps) {
  const [video, setVideo] = useState<QuestionVideo | null>(null);
  const [checked, setChecked] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!questionKey) { setVideo(null); setChecked(true); return; }
    setChecked(false);
    (async () => {
      const v = await getVideoByKey(questionKey);
      if (!cancelled) {
        setVideo(v);
        setChecked(true);
      }
    })();
    return () => { cancelled = true; };
  }, [questionKey]);

  if (!checked) return null;        // 조회 중엔 자리 비움
  if (!video)   return null;        // 영상 없는 문제 → 버튼 숨김

  const padding = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm';
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 font-bold text-white rounded-lg shadow-sm hover:opacity-90 active:scale-95 transition-all ${padding}`}
        style={{ backgroundColor: themeColor }}
        title="선생님 강의 영상 보기"
      >
        <Film className={iconSize} />
        📺 선생님 강의 보기
      </button>

      {open && (
        <VideoPlayerModal
          video={video}
          themeColor={themeColor}
          onClose={() => setOpen(false)}
          onRequestLogin={onRequestLogin}
        />
      )}
    </>
  );
}

// ── 작은 "영상 있음" 뱃지 — 문제 리스트/히스토리용 (클릭 안 됨) ────────────
export function VideoAvailableBadge({ questionKey, themeColor = '#005f61' }: {
  questionKey: string | null | undefined;
  themeColor?: string;
}) {
  const [hasVideo, setHasVideo] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!questionKey) { setHasVideo(false); return; }
    (async () => {
      const v = await getVideoByKey(questionKey);
      if (!cancelled) setHasVideo(!!v);
    })();
    return () => { cancelled = true; };
  }, [questionKey]);

  if (!hasVideo) return null;
  return (
    <span
      className="inline-flex items-center justify-center text-[10px]"
      title="선생님 강의 영상 있음"
      aria-label="영상 있음"
      style={{ color: themeColor }}
    >
      🎥
    </span>
  );
}

// ── 재생 모달 ─────────────────────────────────────────────────────────
function VideoPlayerModal({
  video, themeColor, onClose, onRequestLogin,
}: {
  video: QuestionVideo;
  themeColor: string;
  onClose: () => void;
  onRequestLogin?: () => void;
}) {
  const availableProviders: Provider[] = [];
  if (video.youtube_url)  availableProviders.push('youtube');
  if (video.bilibili_url) availableProviders.push('bilibili');

  const [access, setAccess] = useState<VideoAccessResult | null>(null);
  const [provider, setProvider] = useState<Provider>(availableProviders[0] || 'youtube');
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await checkVideoAccess();
      if (!cancelled) setAccess(r);
    })();
    return () => { cancelled = true; };
  }, []);

  const start = () => {
    setPlaying(true);
    logVideoClick(video.question_key, provider);
  };

  const youtubeSrc  = provider === 'youtube'  && video.youtube_url  ? youtubeEmbedUrl(video.youtube_url, video.start_sec) : null;
  const bilibiliSrc = provider === 'bilibili' && video.bilibili_url ? bilibiliEmbedUrl(video.bilibili_url, video.start_sec) : null;
  const activeSrc   = provider === 'youtube' ? youtubeSrc : bilibiliSrc;
  const activeHref  = provider === 'youtube' ? video.youtube_url : video.bilibili_url;

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between gap-2 px-4 md:px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2 min-w-0">
            <Film className="w-5 h-5 shrink-0" style={{ color: themeColor }} />
            <h3 className="text-sm md:text-base font-bold text-gray-900 truncate">
              {video.title || '선생님 강의'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 접근 상태별 분기 */}
        {!access ? (
          <div className="p-12 text-center">
            <Loader2 className="w-7 h-7 text-gray-400 mx-auto animate-spin mb-2" />
            <p className="text-sm text-gray-500">권한 확인 중…</p>
          </div>
        ) : !access.allowed ? (
          <AccessGateCard
            access={access}
            themeColor={themeColor}
            onRequestLogin={onRequestLogin}
          />
        ) : (
          <>
            {/* trial 안내 — 무료 체험 중일 때만 */}
            {access.status === 'trial' && typeof access.trialDaysLeft === 'number' && (
              <div
                className="px-4 py-2 text-xs font-semibold flex items-center gap-2"
                style={{ backgroundColor: `${themeColor}0f`, color: themeColor }}
              >
                <Clock className="w-3.5 h-3.5" />
                무료 체험 {access.trialDaysLeft}일 남았어요. 이후엔 수강권 등록이 필요합니다.
              </div>
            )}

            {/* provider 탭 (유튜브/빌리빌리 둘 다 있을 때만) */}
            {availableProviders.length > 1 && (
              <div className="flex items-center gap-1 px-4 pt-3 border-b border-gray-100">
                <ProviderTab
                  active={provider === 'youtube'}
                  onClick={() => { setProvider('youtube'); setPlaying(false); }}
                  themeColor={themeColor}
                  icon={<Youtube className="w-4 h-4 text-red-600" />}
                  label="YouTube"
                />
                <ProviderTab
                  active={provider === 'bilibili'}
                  onClick={() => { setProvider('bilibili'); setPlaying(false); }}
                  themeColor={themeColor}
                  icon={<ExternalLink className="w-4 h-4 text-sky-600" />}
                  label="Bilibili"
                />
              </div>
            )}

            {/* 플레이어 영역 */}
            <div className="flex-1 overflow-y-auto">
              <div className="relative bg-black" style={{ aspectRatio: '16 / 9' }}>
                {playing && activeSrc ? (
                  <iframe
                    key={activeSrc}
                    src={activeSrc}
                    title={video.title || '선생님 강의'}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    frameBorder={0}
                  />
                ) : (
                  <button
                    onClick={start}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white hover:bg-black/40 transition-colors"
                  >
                    <div className="w-16 h-16 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center">
                      <Play className="w-8 h-8 ml-1" fill="currentColor" />
                    </div>
                    <span className="text-sm font-bold">
                      {provider === 'youtube' ? 'YouTube 로 재생' : 'Bilibili 로 재생'}
                    </span>
                  </button>
                )}
              </div>

              {/* 하단 메타 */}
              <div className="px-4 md:px-5 py-3 flex items-center justify-between gap-2 flex-wrap text-xs text-gray-500">
                <span>문제 : <span className="font-semibold text-gray-700">{video.question_key}</span></span>
                {activeHref && (
                  <a
                    href={activeHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold hover:underline"
                    style={{ color: themeColor }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {provider === 'youtube' ? 'YouTube 에서 열기' : 'Bilibili 에서 열기'}
                  </a>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ProviderTab({ active, onClick, themeColor, icon, label }: {
  active: boolean; onClick: () => void; themeColor: string; icon: React.ReactNode; label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-colors ${
        active ? '' : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
      style={active ? { color: themeColor, borderColor: themeColor } : {}}
    >
      {icon}
      {label}
    </button>
  );
}

function AccessGateCard({ access, themeColor, onRequestLogin }: {
  access: VideoAccessResult;
  themeColor: string;
  onRequestLogin?: () => void;
}) {
  const isLogin = access.status === 'login_required';
  return (
    <div className="p-8 md:p-10 text-center">
      <div
        className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${themeColor}15` }}
      >
        <Lock className="w-7 h-7" style={{ color: themeColor }} />
      </div>
      <h4 className="text-base font-bold text-gray-900 mb-1">
        {isLogin ? '로그인이 필요해요' : '무료 체험이 끝났어요'}
      </h4>
      <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed mb-5">
        {access.reason || (isLogin
          ? '선생님 강의 영상을 보려면 먼저 로그인하거나 가입해 주세요. 가입하면 10일 동안 모든 강의가 무료예요.'
          : '무료 체험 10일이 끝났어요. 수강권을 등록하면 모든 강의를 다시 볼 수 있어요.')}
      </p>
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {isLogin ? (
          <button
            onClick={() => onRequestLogin?.()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold text-white rounded-lg hover:opacity-90 shadow-sm"
            style={{ backgroundColor: themeColor }}
          >
            로그인 / 가입하기
          </button>
        ) : (
          <>
            <a
              href="https://wa.me/821012345678"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold text-white rounded-lg hover:opacity-90 shadow-sm"
              style={{ backgroundColor: themeColor }}
            >
              수강권 문의
            </a>
            <span className="text-xs text-gray-400">관리자에게 코드 요청 후 "활성화 코드" 입력</span>
          </>
        )}
      </div>
    </div>
  );
}
