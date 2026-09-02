/**
 * Sets `data-theme` before paint to prevent a flash. Slime AI ships light-only
 * today; the dark palette exists in globals.css and this hook is the single
 * place to flip on a user-facing theme toggle later.
 */
const THEME_BOOTSTRAP = `
(function () {
  try {
    var stored = localStorage.getItem("slime-theme");
    var theme = stored === "dark" || stored === "light" ? stored : "light";
    document.documentElement.dataset.theme = theme;
  } catch (e) {
    document.documentElement.dataset.theme = "light";
  }
})();
`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />;
}
