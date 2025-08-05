import { errAsync, okAsync, type ResultAsync } from "neverthrow";

export const getUserEmail = (
  env: Env,
  request: Request,
): ResultAsync<string, Error> => {
  // モック環境では固定のメールアドレスを返す
  if (env.AUTH_MOCK) {
    return okAsync("mock-user");
  }

  const cookieHeader = request.headers.get("Cookie") || "";
  const cfAuth = cookieHeader
    .split(";")
    .find((cookie) => cookie.trim().startsWith("CF_Authorization="))
    ?.split("=")[1]
    ?.trim();

  // JWT をデコード（署名検証なし）
  let decodedJWT: { email?: string } | null = null;
  if (cfAuth) {
    try {
      // JWT は header.payload.signature の形式
      const parts = cfAuth.split(".");
      if (parts.length === 3) {
        // payload 部分（2番目）をデコード
        const payload = parts[1];
        // Base64URL を Base64 に変換
        const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
        // パディングを追加
        const padded = base64.padEnd(
          base64.length + ((4 - (base64.length % 4)) % 4),
          "=",
        );
        // デコード
        const decoded = atob(padded);
        decodedJWT = JSON.parse(decoded);

        // email が存在する場合は userId として使用
        if (decodedJWT?.email) {
          return okAsync(decodedJWT.email);
        }
      }
    } catch (e) {
      return errAsync(new Error(`JWT decode error${e}`));
    }
  }
  return errAsync(new Error("Email not found in JWT or invalid JWT format"));
};
