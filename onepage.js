(() => {
  const navigation = performance.getEntriesByType("navigation")[0];
  if (navigation?.type !== "reload") return;

  // Run before page layout so reloads do not restore an old scroll offset.
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  if (location.hash) {
    history.replaceState(history.state, "", location.pathname + location.search);
  }
  const resetScroll = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  };
  window.addEventListener("pageshow", resetScroll, { once: true });
})();
