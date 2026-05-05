/** Appended to `/model` args from the TUI picker for session scope; stripped in `session` slash before `config.set`. */
export const TUI_SESSION_MODEL_FLAG = '--tui-session';
export const looksLikeSlashCommand = text => /^\/[^\s/]*(?:\s|$)/.test(text);
export const parseSlashCommand = cmd => {
  const [name = '', ...rest] = cmd.slice(1).split(/\s+/);
  return {
    arg: rest.join(' '),
    cmd,
    name: name.toLowerCase()
  };
};