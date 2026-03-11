/**
 * Haptic feedback for key actions. Respects device support.
 */

import * as Haptics from "expo-haptics";

let hapticsAvailable: boolean | null = null;

export async function isHapticsAvailable(): Promise<boolean> {
  if (hapticsAvailable !== null) return hapticsAvailable;
  try {
    hapticsAvailable = await Haptics.isAvailableAsync();
    return hapticsAvailable;
  } catch {
    hapticsAvailable = false;
    return false;
  }
}

export async function hapticSuccess(): Promise<void> {
  if (!(await isHapticsAvailable())) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    /* ignore */
  }
}

export async function hapticNudge(): Promise<void> {
  if (!(await isHapticsAvailable())) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    /* ignore */
  }
}

export async function hapticWarning(): Promise<void> {
  if (!(await isHapticsAvailable())) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {
    /* ignore */
  }
}
