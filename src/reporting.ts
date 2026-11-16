const SUB_APP_ID = "spin-the-wheels";

interface EventData {
  type: "game_started" | "word_presented";
  lang: string;
  level_id?: string;
  word?: string;
}

export function emitGameEvent(
  data: EventData,
  userId: string,
  bridge: Window["ReactNativeWebView"] | undefined = window.ReactNativeWebView,
): void {
  if (typeof bridge?.postMessage !== "function") return;

  try {
    const payloadId = createUuid();
    bridge.postMessage(
      JSON.stringify({
        type: "cr_event",
        payload: {
          payload_id: payloadId,
          cr_user_id: userId,
          sub_app_id: SUB_APP_ID,
          payload_version: 1,
          collection: "user_sessions_data",
          timestamp: new Date().toISOString(),
          data,
        },
      }),
    );
  } catch (error) {
    console.error("Could not report game event.", error);
  }
}

function createUuid(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex[4]}${hex[5]}-${hex[6]}${hex[7]}-${hex[8]}${hex[9]}-${hex.slice(10).join("")}`;
}
