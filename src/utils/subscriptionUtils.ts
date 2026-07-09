// Check if user has an active subscription
export function hasActiveSubscription(): boolean {
  const subscriptions = JSON.parse(localStorage.getItem('toefl_subscriptions') || '[]');
  const currentUser = JSON.parse(localStorage.getItem('toefl_current_user') || '{}');
  
  if (!currentUser.email) {
    return false;
  }

  const userSubscription = subscriptions.find((sub: any) => 
    sub.email === currentUser.email && sub.status === 'Active'
  );

  if (!userSubscription) {
    return false;
  }

  // Check if subscription is still valid
  const expiryDate = new Date(userSubscription.expiryDate);
  const today = new Date();
  
  return expiryDate >= today;
}

// Check if specific content should be locked
// Deprecated: localStorage-based subscription system replaced by Supabase license system
// Always return false to allow access; actual permission check is done in launchSection
export function isContentLocked(index: number, lockedFrom: number = 3): boolean {
  return false;
}
