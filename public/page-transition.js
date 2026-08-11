(function () {
  "use strict";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  var overlay = document.createElement("div");
  overlay.className = "page-transition";
  document.body.appendChild(overlay);

  var isCurtain =
    document.body.getAttribute("data-transition") === "curtain";
  if (isCurtain) {
    overlay.classList.add("curtain");
  }

  var enterDuration = isCurtain ? 780 : 580;
  var exitDuration = 460;

  function hideOverlay() {
    overlay.classList.remove("animating", "enter", "exit");
    overlay.style.visibility = "hidden";
  }

  function playEnter() {
    overlay.style.visibility = "visible";
    overlay.classList.add("animating", "enter");
    window.setTimeout(hideOverlay, enterDuration);
  }

  document.addEventListener("click", function (event) {
    var anchor = event.target.closest
      ? event.target.closest("a[href]")
      : null;
    if (!anchor) return;

    var href = anchor.getAttribute("href");
    if (
      !href ||
      href.indexOf("#") === 0 ||
      /^(https?:|mailto:|tel:)/.test(href)
    ) {
      return;
    }

    if (overlay.classList.contains("animating")) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    overlay.classList.remove("curtain");
    overlay.style.visibility = "visible";
    overlay.classList.add("animating", "exit");

    window.setTimeout(function () {
      window.location.href = href;
    }, exitDuration);
  });

  playEnter();
})();
