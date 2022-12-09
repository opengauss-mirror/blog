export function getNewPath(lang: string, path: string) {
  const newLang = lang === 'zh' ? 'en' : 'zh';
  return path.replace(`/${lang}/`, `/${newLang}/`);
}
