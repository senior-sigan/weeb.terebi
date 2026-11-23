declare const __ACCESS_TOKEN__: string;
export const origin = "https://smotret-anime.app";

export function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? { ...value } : {};
}

export function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function request(url: string, type: "json" | "text"): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.responseType = type;
    xhr.timeout = 20000;
    xhr.onerror = xhr.ontimeout = () =>
      reject(new Error("Нет связи с сервером"));
    xhr.onload = () => {
      if (xhr.status === 401 || xhr.status === 403)
        reject(
          new Error("Anime 365 ограничил доступ. Проверьте токен и подписку."),
        );
      else if (xhr.status !== 200) reject(new Error("Сервер не вернул данные"));
      else resolve(xhr.response);
    };
    xhr.send();
  });
}

export async function api(path: string, params: Record<string, string> = {}) {
  return publicApi(path, { ...params, access_token: __ACCESS_TOKEN__ });
}

export async function publicApi(path: string, params: Record<string, string>) {
  const query = new URLSearchParams(params);
  const result = record(
    await request(`${origin}/api/${path}?${query}`, "json"),
  );
  if (result["data"] == null) throw new Error("Anime 365 не вернул данные");
  return result["data"];
}
