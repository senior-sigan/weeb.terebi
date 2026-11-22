const keys: Readonly<Record<number, string>> = {
  13: "Enter",
  37: "ArrowLeft",
  38: "ArrowUp",
  39: "ArrowRight",
  40: "ArrowDown",
  10009: "Back",
};

export function remoteKey(event: { key: string; keyCode: number }) {
  if (
    event.key === "Escape" ||
    event.key === "Backspace" ||
    event.key === "XF86Back"
  )
    return "Back";
  return keys[event.keyCode] ?? event.key;
}
