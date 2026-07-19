# 수강권 확인 시스템 (Subscription Verification)

## 개요
사용자의 수강권(구독) 상태를 확인하고, 유료 콘텐츠 접근을 제어하는 시스템입니다. Supabase에 구독 정보를 저장하고 localStorage에 캐시합니다.

## 파일 구조

| 파일 | 설명 |
|------|------|
| `subscriptionUtils.ts` | 수강권 활성 상태 확인 함수 (hasActiveSubscription, isContentLocked) |
| `SubscriptionManagement.tsx` | 관리자용 수강권 관리 UI (추가/수정/삭제/CSV 내보내기) |
| `readingHighlights.ts` | 수강권 만료일 기반 하이라이트 저장 제어 (getSubscriptionExpiryDate) |

## 핵심 로직

### 수강권 확인 (subscriptionUtils.ts)
```typescript
// localStorage에서 구독 정보 조회
function hasActiveSubscription(): boolean {
  const subscriptions = JSON.parse(localStorage.getItem('toefl_subscriptions') || '[]');
  const currentUser = JSON.parse(localStorage.getItem('toefl_current_user') || '{}');
  
  if (!currentUser.email) return false;
  
  const userSubscription = subscriptions.find(
    sub => sub.email === currentUser.email && sub.status === 'Active'
  );
  
  if (!userSubscription) return false;
  
  // 만료일 확인
  const expiryDate = new Date(userSubscription.expiryDate);
  return expiryDate >= new Date();
}
```

### 수강권 만료일 조회 (readingHighlights.ts)
```typescript
function getSubscriptionExpiryDate(): Date | null {
  // localStorage에서 구독 정보 조회
  // → 해당 사용자의 Active 구독 찾기
  // → expiryDate 반환 (없으면 null)
}
```

### 하이라이트 저장 제어
- 수강권이 없으면 하이라이트 저장 안 함 (`getSubscriptionExpiryDate() === null`)
- 만료된 하이라이트는 자동 제외 (`gt('expires_at', now())`)
- 수강권 만료일을 하이라이트의 expires_at으로 설정

## 데이터 흐름
```
1. 관리자가 SubscriptionManagement.tsx에서 구독 생성
2. Supabase에 저장 (POST /subscriptions)
3. 클라이언트가 localStorage에 캐시 (toefl_subscriptions)
4. 사용자 로그인 시 localStorage에서 구독 조회
5. 유료 콘텐츠 접근 시 hasActiveSubscription() 확인
6. 하이라이트 저장 시 getSubscriptionExpiryDate() 확인
```

## 인용 시 주의사항
- 구독 정보는 Supabase와 localStorage 양쪽에 저장
- `hasActiveSubscription()`은 만료일을 기준으로 판단
- `isContentLocked()`는 deprecated (항상 false 반환, 실제 권한은 launchSection에서 처리)
- Subscription 타입: `Digital TOEFL` | `High School Success` | `Free`
- Status: `Active` | `Expired` | `Cancelled`

## 의존성
- `@supabase/supabase-js` (서버 저장)
- `lucide-react` (UI 아이콘)
- `apiConfig.ts` (SERVER_BASE_URL)