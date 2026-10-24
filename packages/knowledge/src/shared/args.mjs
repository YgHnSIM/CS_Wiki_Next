export function parseCliArgs(argv = process.argv.slice(2), { valuedOptions = [] } = {}) {
  const args = [...argv];
  const valuedSet = new Set(valuedOptions);

  function hasFlag(name) {
    const flag = name.startsWith("--") ? name : `--${name}`;
    return args.includes(flag);
  }

  function getOption(name, fallback = undefined) {
    const rawName = name.replace(/^--/, "");
    const prefix = `--${rawName}=`;
    const eqArg = args.find((arg) => arg.startsWith(prefix));
    if (eqArg !== undefined) return eqArg.slice(prefix.length);
    const index = args.indexOf(`--${rawName}`);
    if (index >= 0 && index + 1 < args.length) return args[index + 1];
    return fallback;
  }

  function getPositionals() {
    const result = [];
    for (let index = 0; index < args.length; index += 1) {
      const arg = args[index];
      if (arg.startsWith("--")) {
        const raw = arg.slice(2);
        if (!raw.includes("=") && valuedSet.has(raw)) {
          index += 1;
        }
        continue;
      }
      result.push(arg);
    }
    return result;
  }

  return {
    args,
    hasFlag,
    getOption,
    getPositionals
  };
}
