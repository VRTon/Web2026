(function () {
  "use strict";

  var root = document.documentElement;
  var body = document.body;
  var statusMessage = document.getElementById("status-message");
  var preferenceKey = "vrton-preferences";
  var languageKey = "vrton-language";
  var defaults = {
    theme: "system",
    textSize: "normal",
    highContrast: false,
    reduceMotion: false,
    underlineLinks: false
  };

  function readStorage(key, fallback) {
    try {
      var value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // The site remains fully usable when storage is unavailable.
    }
  }

  function announce(message) {
    if (!statusMessage) return;
    statusMessage.textContent = "";
    window.setTimeout(function () {
      statusMessage.textContent = message;
    }, 30);
  }

  function getPreferences() {
    var saved = readStorage(preferenceKey, {});
    return {
      theme: saved.theme || defaults.theme,
      textSize: saved.textSize || defaults.textSize,
      highContrast: Boolean(saved.highContrast),
      reduceMotion: Boolean(saved.reduceMotion),
      underlineLinks: Boolean(saved.underlineLinks)
    };
  }

  function applyPreferences(preferences, persist) {
    root.dataset.theme = preferences.theme;
    root.dataset.textSize = preferences.textSize;

    if (preferences.highContrast) root.dataset.highContrast = "true";
    else delete root.dataset.highContrast;

    if (preferences.reduceMotion) root.dataset.reduceMotion = "true";
    else delete root.dataset.reduceMotion;

    if (preferences.underlineLinks) root.dataset.underlineLinks = "true";
    else delete root.dataset.underlineLinks;

    if (persist) writeStorage(preferenceKey, preferences);
    updateThemeButtons(preferences.theme);
  }

  function updateThemeButtons(theme) {
    var icons = { system: "◐", light: "☀", dark: "☾" };
    document.querySelectorAll(".theme-toggle").forEach(function (button) {
      var icon = button.querySelector("span");
      if (icon) icon.textContent = icons[theme] || icons.system;
      button.dataset.theme = theme;
    });
  }

  function syncPreferenceForm(dialog, preferences) {
    var theme = dialog.querySelector('input[name="theme"][value="' + preferences.theme + '"]');
    var textSize = dialog.querySelector('input[name="text-size"][value="' + preferences.textSize + '"]');
    if (theme) theme.checked = true;
    if (textSize) textSize.checked = true;

    var highContrast = dialog.querySelector('input[name="high-contrast"]');
    var reduceMotion = dialog.querySelector('input[name="reduce-motion"]');
    var underlineLinks = dialog.querySelector('input[name="underline-links"]');
    if (highContrast) highContrast.checked = preferences.highContrast;
    if (reduceMotion) reduceMotion.checked = preferences.reduceMotion;
    if (underlineLinks) underlineLinks.checked = preferences.underlineLinks;
  }

  function preferencesFromForm(dialog) {
    var theme = dialog.querySelector('input[name="theme"]:checked');
    var textSize = dialog.querySelector('input[name="text-size"]:checked');
    return {
      theme: theme ? theme.value : defaults.theme,
      textSize: textSize ? textSize.value : defaults.textSize,
      highContrast: Boolean(dialog.querySelector('input[name="high-contrast"]:checked')),
      reduceMotion: Boolean(dialog.querySelector('input[name="reduce-motion"]:checked')),
      underlineLinks: Boolean(dialog.querySelector('input[name="underline-links"]:checked'))
    };
  }

  var preferences = getPreferences();
  applyPreferences(preferences, false);

  var preferenceDialog = document.getElementById("accessibility-dialog");
  var lastDialogTrigger = null;

  document.querySelectorAll("[data-open-accessibility]").forEach(function (button) {
    button.addEventListener("click", function () {
      if (!preferenceDialog) return;
      lastDialogTrigger = button;
      syncPreferenceForm(preferenceDialog, getPreferences());
      if (typeof preferenceDialog.showModal === "function") {
        preferenceDialog.showModal();
      } else {
        preferenceDialog.setAttribute("open", "");
      }
    });
  });

  if (preferenceDialog) {
    preferenceDialog.addEventListener("change", function () {
      var next = preferencesFromForm(preferenceDialog);
      applyPreferences(next, true);
      announce(document.documentElement.lang === "es" ? "Preferencias guardadas" : "Preferences saved");
    });

    preferenceDialog.addEventListener("close", function () {
      if (lastDialogTrigger) lastDialogTrigger.focus();
    });

    preferenceDialog.addEventListener("click", function (event) {
      if (event.target === preferenceDialog) preferenceDialog.close();
    });

    var resetButton = document.getElementById("reset-preferences");
    if (resetButton) {
      resetButton.addEventListener("click", function () {
        applyPreferences(defaults, true);
        syncPreferenceForm(preferenceDialog, defaults);
        announce(document.documentElement.lang === "es" ? "Preferencias restablecidas" : "Preferences reset");
      });
    }
  }

  document.querySelectorAll(".theme-toggle").forEach(function (button) {
    button.addEventListener("click", function () {
      var order = ["system", "light", "dark"];
      var current = getPreferences();
      var index = order.indexOf(current.theme);
      current.theme = order[(index + 1) % order.length];
      applyPreferences(current, true);
      announce(document.documentElement.lang === "es" ? "Tema actualizado" : "Theme updated");
    });
  });

  var navToggle = document.querySelector(".nav-toggle");
  var navPanel = document.getElementById("primary-navigation");

  function setNavigation(open) {
    if (!navToggle || !navPanel) return;
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? navToggle.dataset.closeLabel : navToggle.dataset.openLabel);
    navPanel.classList.toggle("is-open", open);
    body.classList.toggle("nav-open", open);
  }

  if (navToggle && navPanel) {
    navToggle.addEventListener("click", function () {
      setNavigation(navToggle.getAttribute("aria-expanded") !== "true");
    });

    navPanel.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setNavigation(false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setNavigation(false);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 820) setNavigation(false);
    });
  }

  function showNotice(message) {
    var currentToast = document.querySelector(".notice-toast");
    if (currentToast) currentToast.remove();

    var toast = document.createElement("div");
    toast.className = "notice-toast";
    toast.setAttribute("role", "status");
    toast.textContent = message;
    document.body.appendChild(toast);

    window.setTimeout(function () {
      toast.remove();
    }, 6500);
  }

  document.querySelectorAll("[data-notice]").forEach(function (element) {
    element.addEventListener("click", function () {
      showNotice(element.dataset.notice);
    });
  });

  function setupAboutCarousel() {
    var carousel = document.querySelector("[data-about-carousel]");
    if (!carousel) return;

    var slides = Array.prototype.slice.call(carousel.querySelectorAll("[data-carousel-slide]"));
    var dots = Array.prototype.slice.call(carousel.querySelectorAll("[data-carousel-dot]"));
    var controls = carousel.querySelector("[data-carousel-controls]");
    var progress = carousel.querySelector("[data-carousel-progress] span");
    var progressTrack = carousel.querySelector("[data-carousel-progress]");
    var currentLabel = carousel.querySelector("[data-carousel-current]");
    var previousButton = carousel.querySelector("[data-carousel-previous]");
    var nextButton = carousel.querySelector("[data-carousel-next]");
    var toggleButton = carousel.querySelector("[data-carousel-toggle]");
    var toggleIcon = carousel.querySelector("[data-carousel-toggle-icon]");
    var interval = Number(carousel.dataset.interval) || 10000;
    var currentIndex = 0;
    var elapsed = 0;
    var startedAt = null;
    var animationFrame = null;
    var manuallyPaused = root.dataset.reduceMotion === "true";
    var pointerPaused = false;
    var focusPaused = false;
    var visibilityPaused = document.hidden;

    if (slides.length < 2 || !progress || !controls || !progressTrack) return;

    controls.hidden = false;
    progressTrack.hidden = false;
    carousel.classList.add("is-ready");

    function shouldPause() {
      return manuallyPaused || pointerPaused || focusPaused || visibilityPaused;
    }

    function updateToggle() {
      if (!toggleButton || !toggleIcon) return;
      toggleButton.setAttribute("aria-label", manuallyPaused ? toggleButton.dataset.playLabel : toggleButton.dataset.pauseLabel);
      toggleIcon.textContent = manuallyPaused ? "▶" : "Ⅱ";
    }

    function setProgress(value) {
      progress.style.transform = "scaleX(" + Math.max(0, Math.min(1, value)) + ")";
    }

    function stopClock() {
      if (startedAt !== null) {
        elapsed = Math.min(interval, elapsed + (window.performance.now() - startedAt));
        startedAt = null;
      }
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
      carousel.classList.add("is-paused");
      setProgress(elapsed / interval);
    }

    function renderClock(now) {
      var total = elapsed + (now - startedAt);
      if (total >= interval) {
        showSlide(currentIndex + 1, false);
        return;
      }
      setProgress(total / interval);
      animationFrame = window.requestAnimationFrame(renderClock);
    }

    function startClock() {
      if (shouldPause() || startedAt !== null) return;
      carousel.classList.remove("is-paused");
      startedAt = window.performance.now();
      animationFrame = window.requestAnimationFrame(renderClock);
    }

    function syncClock() {
      if (shouldPause()) stopClock();
      else startClock();
    }

    function resetClock() {
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
      animationFrame = null;
      elapsed = 0;
      startedAt = null;
      setProgress(0);
      syncClock();
    }

    function showSlide(nextIndex, wasManual) {
      currentIndex = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, index) {
        var active = index === currentIndex;
        slide.hidden = !active;
        slide.classList.toggle("is-active", active);
      });
      dots.forEach(function (dot, index) {
        dot.setAttribute("aria-current", String(index === currentIndex));
      });
      if (currentLabel) currentLabel.textContent = String(currentIndex + 1);

      if (wasManual) {
        manuallyPaused = true;
        updateToggle();
        announce(slides[currentIndex].dataset.carouselTitle || "");
      }
      resetClock();
    }

    if (previousButton) {
      previousButton.addEventListener("click", function () {
        showSlide(currentIndex - 1, true);
      });
    }

    if (nextButton) {
      nextButton.addEventListener("click", function () {
        showSlide(currentIndex + 1, true);
      });
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        showSlide(index, true);
      });
    });

    if (toggleButton) {
      toggleButton.addEventListener("click", function () {
        manuallyPaused = !manuallyPaused;
        updateToggle();
        if (manuallyPaused) {
          stopClock();
          announce(toggleButton.dataset.playLabel);
        } else {
          resetClock();
          announce(toggleButton.dataset.pauseLabel);
        }
      });
    }

    carousel.addEventListener("pointerenter", function () {
      pointerPaused = true;
      syncClock();
    });

    carousel.addEventListener("pointerleave", function () {
      pointerPaused = false;
      syncClock();
    });

    carousel.addEventListener("focusin", function () {
      focusPaused = true;
      syncClock();
    });

    carousel.addEventListener("focusout", function () {
      window.setTimeout(function () {
        focusPaused = carousel.contains(document.activeElement);
        syncClock();
      }, 0);
    });

    document.addEventListener("visibilitychange", function () {
      visibilityPaused = document.hidden;
      syncClock();
    });

    if (window.MutationObserver) {
      new MutationObserver(function () {
        if (root.dataset.reduceMotion === "true") {
          manuallyPaused = true;
          updateToggle();
          stopClock();
        }
      }).observe(root, { attributes: true, attributeFilter: ["data-reduce-motion"] });
    }

    updateToggle();
    resetClock();
  }

  setupAboutCarousel();

  function probeCommunityImage(item) {
    return new Promise(function (resolve) {
      var image = item.querySelector("img");
      var source = image ? image.getAttribute("src") : "";
      if (!source) {
        resolve(false);
        return;
      }

      var probe = new Image();
      probe.onload = function () {
        resolve(probe.naturalWidth > 0 && probe.naturalHeight > 0);
      };
      probe.onerror = function () {
        resolve(false);
      };
      probe.src = source;
    });
  }

  function setupCommunityWings() {
    document.querySelectorAll("[data-community-wings]").forEach(function (stage) {
      var leftWing = stage.querySelector('[data-community-wing="left"]');
      var rightWing = stage.querySelector('[data-community-wing="right"]');
      var items = Array.prototype.slice.call(stage.querySelectorAll("[data-community-item]"));
      if (!leftWing || !rightWing || !items.length) return;

      stage.classList.add("is-randomizing");

      Promise.all(items.map(probeCommunityImage)).then(function (availability) {
        var availableItems = items.filter(function (item, index) {
          return availability[index];
        });

        for (var index = availableItems.length - 1; index > 0; index -= 1) {
          var randomIndex = Math.floor(Math.random() * (index + 1));
          var currentItem = availableItems[index];
          availableItems[index] = availableItems[randomIndex];
          availableItems[randomIndex] = currentItem;
        }

        items.forEach(function (item) {
          item.hidden = true;
        });

        availableItems.forEach(function (item, index) {
          item.hidden = index >= 12;
          if (index < 6) leftWing.appendChild(item);
          else rightWing.appendChild(item);
        });

        items.filter(function (item) {
          return availableItems.indexOf(item) === -1;
        }).forEach(function (item) {
          rightWing.appendChild(item);
        });

        leftWing.hidden = availableItems.length === 0;
        rightWing.hidden = availableItems.length <= 6;
        stage.classList.remove("is-randomizing");
        stage.dataset.communityCandidates = String(items.length);
        stage.dataset.communityAvailable = String(availableItems.length);
        stage.dataset.communityVisible = String(Math.min(12, availableItems.length));
        stage.dataset.communityWingsReady = "true";
      }).catch(function () {
        stage.classList.remove("is-randomizing");
        stage.dataset.communityWingsReady = "error";
      });
    });
  }

  setupCommunityWings();

  document.querySelectorAll(".language-switcher a, .footer-languages a").forEach(function (link) {
    link.addEventListener("click", function () {
      var language = link.textContent.trim().toLowerCase();
      if (language === "es" || language === "en") writeStorage(languageKey, language);
    });
  });

  function applyRememberedLanguage() {
    var preferred = readStorage(languageKey, "");
    var active = body.dataset.language;
    var path = window.location.pathname;
    if (!preferred || preferred === active || path === "/404.html") return;

    if (preferred === "en" && path.indexOf("/en/") !== 0) {
      window.location.replace("/en" + (path === "/" ? "/" : path) + window.location.search + window.location.hash);
    } else if (preferred === "es" && path.indexOf("/en/") === 0) {
      var spanishPath = path.slice(3) || "/";
      window.location.replace(spanishPath + window.location.search + window.location.hash);
    }
  }

  applyRememberedLanguage();

  document.querySelectorAll("[data-local-timezone]").forEach(function (element) {
    try {
      element.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch (error) {
      element.textContent = "UTC";
    }
  });

  var scheduleGrid = document.querySelector("[data-schedule-grid]");
  if (scheduleGrid) {
    function dateInTimeZone(dateTime, timeZone) {
      var match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/.exec(dateTime);
      if (!match) return new Date(NaN);

      var targetUtc = Date.UTC(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3]),
        Number(match[4]),
        Number(match[5]),
        Number(match[6])
      );
      var zoneFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23"
      });

      function offsetAt(timestamp) {
        var values = {};
        zoneFormatter.formatToParts(new Date(timestamp)).forEach(function (part) {
          if (part.type !== "literal") values[part.type] = Number(part.value);
        });
        return Date.UTC(values.year, values.month - 1, values.day, values.hour, values.minute, values.second) - timestamp;
      }

      var provisional = targetUtc - offsetAt(targetUtc);
      return new Date(targetUtc - offsetAt(provisional));
    }

    function formatScheduleRange(startAt, endAt, showEnd) {
      var officialTimeZone = scheduleGrid.dataset.officialTimezone || "America/Santiago";
      var start = dateInTimeZone(startAt, officialTimeZone);
      var end = dateInTimeZone(endAt, officialTimeZone);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "";

      var timeFormatter = new Intl.DateTimeFormat(body.dataset.language === "en" ? "en-US" : "es-CL", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });
      if (showEnd === false) return timeFormatter.format(start);
      return timeFormatter.format(start) + "–" + timeFormatter.format(end);
    }

    document.querySelectorAll("[data-schedule-time]").forEach(function (timeElement) {
      var formattedRange = formatScheduleRange(timeElement.dataset.startAt, timeElement.dataset.endAt, timeElement.dataset.showEnd !== "false");
      if (formattedRange) timeElement.textContent = formattedRange;
    });

    var scheduleDialog = document.getElementById("schedule-dialog");
    if (scheduleDialog) {
      var dialogTitle = scheduleDialog.querySelector("[data-schedule-dialog-title]");
      var dialogTime = scheduleDialog.querySelector("[data-schedule-dialog-time]");
      var dialogInstance = scheduleDialog.querySelector("[data-schedule-dialog-instance]");
      var dialogDescription = scheduleDialog.querySelector("[data-schedule-dialog-description]");

      document.querySelectorAll("[data-schedule-activity]").forEach(function (activityButton) {
        activityButton.addEventListener("click", function () {
          dialogTitle.textContent = activityButton.dataset.activityTitle;
          dialogTime.textContent = formatScheduleRange(activityButton.dataset.activityStart, activityButton.dataset.activityEnd, activityButton.dataset.showEnd !== "false");
          dialogInstance.textContent = activityButton.dataset.activityInstance;
          dialogDescription.textContent = activityButton.dataset.activityDescription;
          dialogDescription.hidden = !activityButton.dataset.activityDescription;

          if (typeof scheduleDialog.showModal === "function") scheduleDialog.showModal();
          else scheduleDialog.setAttribute("open", "");
        });
      });

      scheduleDialog.addEventListener("click", function (event) {
        if (event.target === scheduleDialog) scheduleDialog.close();
      });
    }
  }

  var imageDialog = document.getElementById("image-dialog");
  if (imageDialog) {
    var dialogImage = imageDialog.querySelector("img");
    document.querySelectorAll("[data-gallery-image]").forEach(function (button) {
      button.addEventListener("click", function () {
        dialogImage.src = button.dataset.galleryImage;
        dialogImage.alt = button.dataset.galleryAlt || "";
        if (typeof imageDialog.showModal === "function") imageDialog.showModal();
        else imageDialog.setAttribute("open", "");
      });
    });

    imageDialog.addEventListener("click", function (event) {
      if (event.target === imageDialog) imageDialog.close();
    });
  }

  function setupLegalPage() {
    var legalContainer = document.querySelector(".legal-document");
    if (!legalContainer) return;

    var language = body.dataset.language === "en" ? "en" : "es";
    var labels = language === "es" ? {
      contents: "Contenido",
      print: "Imprimir",
      home: "Volver al inicio"
    } : {
      contents: "Contents",
      print: "Print",
      home: "Back to home"
    };

    var headings = Array.prototype.slice.call(legalContainer.querySelectorAll(".legal-section h2, .legal-section h3"));
    if (headings.length) {
      var toc = document.createElement("nav");
      toc.className = "legal-toc";
      toc.setAttribute("aria-label", labels.contents);
      var tocTitle = document.createElement("h2");
      tocTitle.textContent = labels.contents;
      var list = document.createElement("ol");

      headings.forEach(function (heading, index) {
        if (!heading.id) heading.id = "section-" + (index + 1);
        var item = document.createElement("li");
        var link = document.createElement("a");
        link.href = "#" + heading.id;
        link.textContent = heading.textContent;
        item.appendChild(link);
        list.appendChild(item);
      });

      toc.appendChild(tocTitle);
      toc.appendChild(list);
      var firstSection = legalContainer.querySelector(".legal-section");
      legalContainer.insertBefore(toc, firstSection);
    }

    var toolbar = document.createElement("div");
    toolbar.className = "reading-tools";
    toolbar.setAttribute("aria-label", body.dataset.readLabel);

    var readButton = document.createElement("button");
    readButton.type = "button";
    readButton.className = "button button-secondary button-small";
    readButton.textContent = body.dataset.readLabel;

    var pauseButton = document.createElement("button");
    pauseButton.type = "button";
    pauseButton.className = "button button-secondary button-small";
    pauseButton.textContent = body.dataset.pauseLabel;
    pauseButton.disabled = true;

    var stopButton = document.createElement("button");
    stopButton.type = "button";
    stopButton.className = "button button-secondary button-small";
    stopButton.textContent = body.dataset.stopLabel;
    stopButton.disabled = true;

    var printButton = document.createElement("button");
    printButton.type = "button";
    printButton.className = "button button-secondary button-small";
    printButton.textContent = labels.print;

    toolbar.appendChild(readButton);
    toolbar.appendChild(pauseButton);
    toolbar.appendChild(stopButton);
    toolbar.appendChild(printButton);

    var documentHeader = legalContainer.querySelector(".legal-document-header");
    if (documentHeader && documentHeader.nextSibling) legalContainer.insertBefore(toolbar, documentHeader.nextSibling);
    else legalContainer.insertBefore(toolbar, legalContainer.firstChild);

    var synth = window.speechSynthesis;
    var utterance = null;

    function stopReading() {
      if (synth) synth.cancel();
      utterance = null;
      pauseButton.disabled = true;
      stopButton.disabled = true;
      pauseButton.textContent = body.dataset.pauseLabel;
    }

    readButton.addEventListener("click", function () {
      if (!synth || typeof window.SpeechSynthesisUtterance !== "function") {
        showNotice(language === "es" ? "La lectura por voz no está disponible en este navegador." : "Text to speech is not available in this browser.");
        return;
      }

      stopReading();
      var readableSections = Array.prototype.slice.call(legalContainer.querySelectorAll(".legal-section"));
      var text = readableSections.map(function (section) {
        return section.innerText;
      }).join(". ");

      utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === "es" ? "es-ES" : "en-US";
      utterance.rate = 1;
      utterance.onend = stopReading;
      utterance.onerror = stopReading;
      synth.speak(utterance);
      pauseButton.disabled = false;
      stopButton.disabled = false;
    });

    pauseButton.addEventListener("click", function () {
      if (!synth || !utterance) return;
      if (synth.paused) {
        synth.resume();
        pauseButton.textContent = body.dataset.pauseLabel;
      } else {
        synth.pause();
        pauseButton.textContent = body.dataset.resumeLabel;
      }
    });

    stopButton.addEventListener("click", stopReading);
    printButton.addEventListener("click", function () {
      window.print();
    });

    window.addEventListener("beforeunload", stopReading);
  }

  setupLegalPage();
}());
