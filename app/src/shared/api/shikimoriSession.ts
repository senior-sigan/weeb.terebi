import { record, text } from "./anime365";

declare const __SHIKIMORI_CLIENT_ID__: string;
declare const __SHIKIMORI_CLIENT_SECRET__: string;

const origin = "https://shikimori.io";
const redirect = "urn:ietf:wg:oauth:2.0:oob";
const storageKey = "weebterebi.shikimori.session.v1";

export interface ShikimoriAccount {
  id: number;
  name: string;
}

interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface Session extends Tokens {
  account: ShikimoriAccount;
}

interface ApiOptions {
  method?: "GET" | "POST" | "PATCH";
  body?: object;
}

export const canConnectShikimori = Boolean(
  __SHIKIMORI_CLIENT_ID__ && __SHIKIMORI_CLIENT_SECRET__,
);

function readSession(): Session | null {
  if (!canConnectShikimori) return null;
  try {
    const value = record(
      JSON.parse(localStorage.getItem(storageKey) ?? "null"),
    );
    const account = record(value["account"]);
    const id = account["id"];
    const expiresAt = value["expiresAt"];
    const accessToken = text(value["accessToken"]);
    const refreshToken = text(value["refreshToken"]);
    return value["clientId"] === __SHIKIMORI_CLIENT_ID__ &&
      typeof id === "number" &&
      Number.isSafeInteger(id) &&
      id > 0 &&
      typeof expiresAt === "number" &&
      Number.isFinite(expiresAt) &&
      accessToken &&
      refreshToken
      ? {
          account: { id, name: text(account["name"]) },
          accessToken,
          refreshToken,
          expiresAt,
        }
      : null;
  } catch {
    return null;
  }
}

let session = readSession();
let refreshing: { account: ShikimoriAccount; result: Promise<Session> } | null =
  null;

export function shikimoriAccount() {
  return session?.account ?? null;
}

export function disconnectShikimori() {
  localStorage.removeItem(storageKey);
  session = null;
}

function saveSession(value: Session) {
  localStorage.setItem(
    storageKey,
    JSON.stringify({
      ...value,
      clientId: __SHIKIMORI_CLIENT_ID__,
    }),
  );
  session = value;
  return value;
}

export function shikimoriAuthorizationUrl() {
  const params = new URLSearchParams({
    client_id: __SHIKIMORI_CLIENT_ID__,
    redirect_uri: redirect,
    response_type: "code",
    scope: "user_rates",
  });
  return `${origin}/oauth/authorize?${params}`;
}

function requestJson({
  path,
  method = "GET",
  accessToken,
  body,
}: {
  path: string;
  method?: NonNullable<ApiOptions["method"]>;
  accessToken?: string;
  body?: FormData | string;
}): Promise<{ status: number; data: unknown }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, `${origin}/${path}`);
    xhr.responseType = "json";
    xhr.timeout = 15000;
    if (accessToken)
      xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    if (typeof body === "string")
      xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onload = () => resolve({ status: xhr.status, data: xhr.response });
    xhr.onerror = xhr.ontimeout = () =>
      reject(new Error("Нет связи с Shikimori"));
    xhr.send(body);
  });
}

async function exchangeToken(grant: Record<string, string>): Promise<Tokens> {
  const body = new FormData();
  for (const [key, value] of Object.entries({
    client_id: __SHIKIMORI_CLIENT_ID__,
    client_secret: __SHIKIMORI_CLIENT_SECRET__,
    ...grant,
  }))
    body.set(key, value);
  const response = await requestJson({
    path: "oauth/token",
    method: "POST",
    body,
  });
  const data = record(response.data);
  if (data["error"] === "invalid_client")
    throw new Error(
      "Shikimori отклонил OAuth-клиент. Проверьте настройки сборки.",
    );
  if (data["error"] === "invalid_grant")
    throw new Error(
      "Код или сессия истекли. Откройте Shikimori и получите новый код.",
    );
  const accessToken = text(data["access_token"]);
  const refreshToken = text(data["refresh_token"]);
  const seconds = data["expires_in"];
  if (
    response.status !== 200 ||
    !accessToken ||
    !refreshToken ||
    typeof seconds !== "number" ||
    !Number.isFinite(seconds) ||
    seconds <= 0
  )
    throw new Error("Shikimori не выдал токены");
  return { accessToken, refreshToken, expiresAt: Date.now() + seconds * 1000 };
}

export async function connectShikimori(code: string) {
  if (!canConnectShikimori) throw new Error("Настройте OAuth-клиент Shikimori");
  const tokens = await exchangeToken({
    grant_type: "authorization_code",
    redirect_uri: redirect,
    code: code.trim(),
  });
  const profile = await requestJson({
    path: "api/users/whoami",
    accessToken: tokens.accessToken,
  });
  const data = record(profile.data);
  const id = data["id"];
  if (
    profile.status !== 200 ||
    typeof id !== "number" ||
    !Number.isSafeInteger(id) ||
    id <= 0
  )
    throw new Error("Не удалось проверить профиль Shikimori");
  return saveSession({
    ...tokens,
    account: { id, name: text(data["nickname"]) },
  }).account;
}

function requireSession(account: ShikimoriAccount) {
  if (session?.account !== account)
    throw new Error("Подключите профиль Shikimori");
  return session;
}

function refresh(current: Session) {
  if (refreshing?.account === current.account) return refreshing.result;
  const result = exchangeToken({
    grant_type: "refresh_token",
    refresh_token: current.refreshToken,
  }).then((tokens) => {
    if (session !== current) throw new Error("Сессия Shikimori изменилась");
    return saveSession({ ...tokens, account: current.account });
  });
  const clear = () => {
    if (refreshing?.result === result) refreshing = null;
  };
  result.then(clear, clear);
  refreshing = { account: current.account, result };
  return result;
}

export async function shikimoriApi(
  account: ShikimoriAccount,
  path: string,
  options: ApiOptions = {},
) {
  const current = requireSession(account);
  const active =
    current.expiresAt <= Date.now() + 30000 ? await refresh(current) : current;
  const request = {
    path: `api/${path}`,
    method: options.method ?? "GET",
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  };
  let response = await requestJson({
    ...request,
    accessToken: active.accessToken,
  });
  if (response.status === 401) {
    const latest = requireSession(account);
    const next = latest === active ? await refresh(active) : latest;
    response = await requestJson({ ...request, accessToken: next.accessToken });
  }
  requireSession(account);
  if (response.status < 200 || response.status >= 300)
    throw new Error(`Shikimori вернул ошибку ${response.status}`);
  return response.data;
}
