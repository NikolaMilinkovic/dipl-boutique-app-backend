function betterConsoleLog(message: string, log: unknown): void {
  if (typeof log === "string" && isJSON(log)) {
    console.log(message, JSON.stringify(JSON.parse(log), null, 2));
  } else {
    console.log(message, log);
  }
}

function betterErrorLog(message: string, log: unknown): void {
  if (typeof log === "string" && isJSON(log)) {
    console.error(message, JSON.stringify(JSON.parse(log), null, 2));
    console.error(log);
  } else {
    console.error(message);
    console.error(log);
  }
}

function isJSON(value: unknown): boolean {
  if (typeof value !== "string") return false;
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

export { betterConsoleLog, betterErrorLog };
