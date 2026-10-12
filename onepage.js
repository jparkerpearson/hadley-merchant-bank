(() => {
  const navigation = performance.getEntriesByType("navigation")[0];
  if (navigation?.type !== "reload") return;

  // Disable restoration before the browser lays out the page.
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  if (location.hash) {
    history.replaceState(history.state, "", location.pathname + location.search);
  }
  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  };
  window.addEventListener("pageshow", scrollToTop, { once: true });
})();
