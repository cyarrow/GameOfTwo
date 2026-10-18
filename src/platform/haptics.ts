/**
 * 手機震動回饋（支援的裝置才有）。只用在有意義的時刻：輪到你、你贏了，
 * 避免震太多讓人習慣性忽略。
 */
export function haptic(pattern: number | number[]) {
  try {
    // 瀏覽器規定使用者點過頁面之後才能震動，否則會被擋下並在主控台警告
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
    navigator.vibrate?.(pattern);
  } catch {
    // 不支援就算了
  }
}
