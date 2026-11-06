// Mockup helpers: ?theme=dark switches to dark mode, ?offline=1 shows the offline state.
(function () {
  var q = new URLSearchParams(location.search);
  if (q.get("theme") === "dark") document.documentElement.setAttribute("data-theme", "dark");
  if (q.get("offline")) document.documentElement.classList.add("is-offline");
})();
