// Loads the app's real CSS Modules into a static mockup, scoped the way Next.js scopes them.
// Usage: <script src="/design/system/mockup.js" data-modules="/components/layout/AppHeader.module.css ..."></script>
// A class `.header` in AppHeader.module.css becomes `.AppHeader__header`, so write class="AppHeader__header" in the markup.
// The styles are fetched, never copied, so a mockup always matches the current app.
(function () {
  const script = document.currentScript;
  const paths = (script.dataset.modules || '').split(/\s+/).filter(Boolean);

  function scope(css, prefix) {
    // url(...) values (data URIs, links) contain dots that are not class selectors, so set them aside first.
    const urls = [];
    const safe = css.replace(/url\([^)]*\)/g, (match) => `__URL${urls.push(match) - 1}__`);
    const scoped = safe.replace(/\.([a-zA-Z_][\w-]*)/g, `.${prefix}__$1`);
    return scoped.replace(/__URL(\d+)__/g, (_, i) => urls[Number(i)]);
  }

  Promise.all(
    paths.map(async (path) => {
      const response = await fetch(path);
      if (!response.ok) throw new Error(`mockup.js: cannot load ${path} (${response.status})`);
      const prefix = path.split('/').pop().replace('.module.css', '');
      const style = document.createElement('style');
      style.dataset.module = prefix;
      style.textContent = scope(await response.text(), prefix);
      return style;
    }),
  ).then((styles) => {
    // Inserted before the mockup's own <style> blocks, so mockup-only styles can override the app's.
    const first = document.head.querySelector('style');
    styles.forEach((style) => document.head.insertBefore(style, first));
  });
})();
