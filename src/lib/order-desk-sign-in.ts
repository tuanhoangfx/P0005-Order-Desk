import {
  authenticateMirrorSupabase,
  hubAuthEmailFromLogin,
  HUB_INVALID_LOGIN,
  isHubAuthRateLimitError,
  sanitizeHubLoginInput,
  signInWithHubPassword,
} from "@tool-workspace/hub-identity";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getOrderDeskSupabase } from "./supabase";

export async function signInOrderDesk(
  loginInput: string,
  password: string,
  mode: "signin" | "signup",
): Promise<{ error?: string }> {
  const supabase = getOrderDeskSupabase();
  const login = sanitizeHubLoginInput(loginInput);
  const primaryEmail = hubAuthEmailFromLogin(login);

  if (mode === "signup") {
    const result = await authenticateMirrorSupabase({
      client: supabase,
      authEmail: primaryEmail,
      password,
      mode,
      cacheSession: () => {},
      planeLabel: "Order Desk",
    });
    if (result.error) return { error: result.error };
    return {};
  }

  const attempt = async (authEmail: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail, password });
    return { data: { session: data.session }, error };
  };

  const signIn = await signInWithHubPassword(login, attempt, "signin");
  if (!signIn.error && signIn.data?.session) return {};

  const lastError = signIn.error?.message ?? null;
  if (lastError && isHubAuthRateLimitError(lastError)) return { error: lastError };
  if (!lastError || !HUB_INVALID_LOGIN.test(lastError)) {
    return { error: lastError ?? "Order Desk sign-in failed." };
  }

  const mirror = await authenticateMirrorSupabase({
    client: supabase,
    authEmail: primaryEmail,
    password,
    mode: "signup",
    cacheSession: () => {},
    planeLabel: "Order Desk",
  });
  if (mirror.session) return {};
  return { error: mirror.error ?? lastError };
}

export function orderDeskForgotPasswordHandlers(supabase: SupabaseClient) {
  return {
    isHubConfigured: () => true,
    resetPasswordForEmail: async (authEmail: string, redirectTo: string) =>
      supabase.auth.resetPasswordForEmail(authEmail, { redirectTo }),
  };
}
