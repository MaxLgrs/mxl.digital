(() => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const canvas = document.getElementById("starfall");

  if (canvas && !prefersReducedMotion.matches) {
    const ctx = canvas.getContext("2d");
    let stars = [];
    let width = 0;
    let height = 0;
    const colors = [
      "53, 208, 255",
      "182, 255, 92",
      "159, 110, 255",
      "255, 214, 112",
      "255, 255, 255",
    ];

    const rand = (min, max) => Math.random() * (max - min) + min;
    const pickColor = () => colors[Math.floor(Math.random() * colors.length)];

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      const count = Math.min(120, Math.max(60, Math.floor(width / 12)));
      stars = Array.from({ length: count }, () => createStar());
    };

    const createStar = () => ({
      x: rand(0, width),
      y: rand(-height, height),
      length: rand(60, 160),
      speed: rand(0.25, 0.9),
      size: rand(0.7, 1.4),
      opacity: rand(0.18, 0.55),
      twinkle: rand(0, Math.PI * 2),
      color: pickColor(),
    });

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";

      stars.forEach((star) => {
        star.twinkle += 0.008;
        const opacity = Math.max(0.1, Math.min(0.8, star.opacity + Math.sin(star.twinkle) * 0.15));
        const tailX = star.x - star.length;
        const tailY = star.y - star.length * 0.7;

        const gradient = ctx.createLinearGradient(star.x, star.y, tailX, tailY);
        gradient.addColorStop(0, `rgba(${star.color}, ${opacity})`);
        gradient.addColorStop(1, `rgba(${star.color}, 0)`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = star.size;
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        star.x += star.speed * 0.8;
        star.y += star.speed * 1.05;

        if (star.y > height + 150 || star.x > width + 150) {
          star.x = rand(-200, width * 0.4);
          star.y = rand(-200, 0);
          star.color = pickColor();
        }
      });

      requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
  } else if (canvas) {
    canvas.style.display = "none";
  }

  const revealElements = document.querySelectorAll("[data-reveal]");

  if (revealElements.length) {
    if (prefersReducedMotion.matches || !("IntersectionObserver" in window)) {
      revealElements.forEach((el) => el.classList.add("is-visible"));
    } else {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 }
      );
      revealElements.forEach((el) => observer.observe(el));
    }
  }

  const auditForm = document.getElementById("audit-form");
  if (auditForm) {
    const status = document.getElementById("audit-status");
    const submitBtn = auditForm.querySelector("button[type='submit']");
    const defaultLabel = submitBtn ? submitBtn.textContent : "";
    const webhookUrl = "https://n8n.mxl.digital/webhook/d76973ee-23dc-45fc-ac98-8b95d207ade3";

    const setStatus = (type, message) => {
      if (!status) return;
      status.className = `status ${type} is-visible`;
      status.textContent = message;
    };

    auditForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Envoi en cours...";
      }
      setStatus("loading", "Envoi de votre demande d'audit...");

      const formData = new FormData(auditForm);
      const data = Object.fromEntries(formData.entries());

      try {
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error("Webhook error");
        }

        setStatus("success", "Votre demande a ete envoyee. Vous recevrez votre audit par email.");
        auditForm.reset();
      } catch (error) {
        setStatus("error", "Une erreur est survenue. Veuillez reessayer ou nous contacter.");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = defaultLabel || "Recevoir mon audit gratuit";
        }
      }
    });
  }

  const roiForm = document.getElementById("roi-form");
  if (roiForm) {
    const fields = {
      hours: roiForm.querySelector("[name='hours']"),
      hourly: roiForm.querySelector("[name='hourly']"),
      leads: roiForm.querySelector("[name='leads']"),
      conversion: roiForm.querySelector("[name='conversion']"),
      deal: roiForm.querySelector("[name='deal']"),
      monthly: roiForm.querySelector("[name='monthly']"),
    };

    const outputs = {
      savings: document.querySelector("[data-output='monthly-savings']"),
      leadRevenue: document.querySelector("[data-output='lead-revenue']"),
      total: document.querySelector("[data-output='total-impact']"),
      roi: document.querySelector("[data-output='roi']"),
      payback: document.querySelector("[data-output='payback']"),
    };

    const formatter = new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    });

    const update = () => {
      const hours = parseFloat(fields.hours.value || "0");
      const hourly = parseFloat(fields.hourly.value || "0");
      const leads = parseFloat(fields.leads.value || "0");
      const conversion = parseFloat(fields.conversion.value || "0") / 100;
      const deal = parseFloat(fields.deal.value || "0");
      const monthly = parseFloat(fields.monthly.value || "0");

      const monthlySavings = hours * hourly * 4.3;
      const leadRevenue = leads * conversion * deal;
      const totalImpact = monthlySavings + leadRevenue;
      const roi = monthly > 0 ? (totalImpact - monthly) / monthly : 0;
      const payback = totalImpact > 0 ? monthly / totalImpact : 0;

      if (outputs.savings) outputs.savings.textContent = formatter.format(monthlySavings);
      if (outputs.leadRevenue) outputs.leadRevenue.textContent = formatter.format(leadRevenue);
      if (outputs.total) outputs.total.textContent = formatter.format(totalImpact);
      if (outputs.roi) outputs.roi.textContent = `${(roi * 100).toFixed(0)}%`;
      if (outputs.payback) outputs.payback.textContent = `${(payback * 4.3).toFixed(1)} sem.`;
    };

    roiForm.addEventListener("input", update);
    update();
  }

  const previewCards = document.querySelectorAll("[data-portfolio-preview]");
  if (previewCards.length) {
    const previewOverlay = document.querySelector("[data-portfolio-overlay]");
    const previewFrame = document.querySelector("[data-portfolio-frame]");
    const previewViewport = document.querySelector("[data-portfolio-viewport]");
    const previewTitle = document.querySelector("[data-portfolio-title]");
    const previewClose = document.querySelector("[data-portfolio-close]");
    let lastFocused = null;
    let closeTimeout = null;
    let liveHoverTimeout = null;
    let activeLiveCard = null;

    const liveConfig = {
      hoverDelay: 180,
      viewportWidth: 1920,
      viewportHeight: 1080,
    };

    const applyIframeScale = (iframe, container) => {
      if (!iframe || !container) return false;
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (!width || !height) return false;
      const scale = Math.min(width / liveConfig.viewportWidth, height / liveConfig.viewportHeight);
      const scaledWidth = liveConfig.viewportWidth * scale;
      const scaledHeight = liveConfig.viewportHeight * scale;
      const offsetLeft = (width - scaledWidth) / 2;
      const offsetTop = (height - scaledHeight) / 2;
      iframe.style.width = `${liveConfig.viewportWidth}px`;
      iframe.style.height = `${liveConfig.viewportHeight}px`;
      iframe.style.transform = `scale(${scale})`;
      iframe.style.left = `${offsetLeft}px`;
      iframe.style.top = `${offsetTop}px`;
      return true;
    };

    const applyIframeFit = (iframe, container) => {
      if (!iframe || !container) return;
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.style.left = "0";
      iframe.style.top = "0";
      iframe.style.transform = "none";
    };

    const stopLivePreview = (card) => {
      const target = card || activeLiveCard;
      if (!target || !target._live) return;
      const { iframe } = target._live;
      if (iframe && iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
      target.classList.remove("is-live");
      target._live = null;
      if (activeLiveCard === target) {
        activeLiveCard = null;
      }
    };

    const startLivePreview = (card) => {
      if (!card || card._live) return;
      const liveSlot = card.querySelector("[data-portfolio-live]");
      const url = card.getAttribute("data-portfolio-preview");
      if (!liveSlot || !url) return;

      if (activeLiveCard && activeLiveCard !== card) {
        stopLivePreview(activeLiveCard);
      }

      const iframe = document.createElement("iframe");
      const title = card.getAttribute("data-portfolio-title") || "Aperçu du projet";
      iframe.setAttribute("title", title);
      iframe.setAttribute("aria-hidden", "true");
      iframe.setAttribute("tabindex", "-1");
      iframe.loading = "lazy";
      iframe.src = url;
      liveSlot.appendChild(iframe);

      card._live = {
        iframe,
        container: liveSlot,
      };

      iframe.addEventListener(
        "load",
        () => {
          if (!card._live) return;
          let attempts = 0;
          const activate = () => {
            if (!card._live) return;
            const applied = applyIframeScale(iframe, liveSlot);
            if (applied) {
              card.classList.add("is-live");
              activeLiveCard = card;
              return;
            }
            attempts += 1;
            if (attempts < 6) {
              requestAnimationFrame(activate);
            }
          };
          activate();
        },
        { once: true }
      );
    };

    const openPreview = (card) => {
      if (!previewOverlay || !previewFrame) return;
      const url = card.getAttribute("data-portfolio-preview");
      if (!url) return;

      const title = card.getAttribute("data-portfolio-title") || "Aperçu du projet";
      if (previewTitle) previewTitle.textContent = title;
      previewFrame.title = title;
      previewFrame.src = url;
      previewFrame.onload = () => {
        applyIframeFit(previewFrame, previewViewport);
      };
      previewOverlay.hidden = false;
      previewOverlay.setAttribute("aria-hidden", "false");
      requestAnimationFrame(() => {
        previewOverlay.classList.add("is-active");
        applyIframeFit(previewFrame, previewViewport);
      });
      document.body.classList.add("preview-open");
      lastFocused = document.activeElement;
      if (previewClose) previewClose.focus({ preventScroll: true });
    };

    const closePreview = () => {
      if (!previewOverlay || !previewFrame) return;
      previewOverlay.classList.remove("is-active");
      previewOverlay.setAttribute("aria-hidden", "true");
      document.body.classList.remove("preview-open");
      let didCleanup = false;

      const cleanup = () => {
        if (didCleanup) return;
        didCleanup = true;
        previewOverlay.hidden = true;
        previewFrame.src = "about:blank";
        if (lastFocused && typeof lastFocused.focus === "function") {
          lastFocused.focus({ preventScroll: true });
        }
        lastFocused = null;
      };

      if (prefersReducedMotion.matches) {
        cleanup();
        return;
      }

      previewOverlay.addEventListener("transitionend", cleanup, { once: true });
      clearTimeout(closeTimeout);
      closeTimeout = setTimeout(cleanup, 350);
    };

    previewCards.forEach((card) => {
      // Load all live previews immediately
      startLivePreview(card);

      card.addEventListener("click", () => openPreview(card));
    });

    const handleResize = () => {
      previewCards.forEach((card) => {
        if (card._live) {
          applyIframeScale(card._live.iframe, card._live.container);
        }
      });
      if (previewOverlay && !previewOverlay.hidden) {
        applyIframeFit(previewFrame, previewViewport);
      }
    };

    window.addEventListener("resize", handleResize);

    if (previewOverlay) {
      previewOverlay.addEventListener("click", (event) => {
        if (event.target === previewOverlay) {
          closePreview();
        }
      });
    }

    if (previewClose) {
      previewClose.addEventListener("click", closePreview);
    }

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && previewOverlay && !previewOverlay.hidden) {
        closePreview();
      }
    });
  }
})();

/* ================================
   DIRECTUS GLOBAL SETTINGS
================================ */

async function loadGlobalSettings() {
  try {
    const response = await fetch("https://directus.mxl.digital/items/global_settings");
    const result = await response.json();
    const data = result.data;

    // Bouton Audit Gratuit (btn-secondary)
    const auditBtn = document.querySelector(".btn-secondary");
    if (auditBtn && data.primary_cta_label && data.primary_cta_link) {
      auditBtn.textContent = data.primary_cta_label;
      auditBtn.href = data.primary_cta_link;
    }

    // Footer
    const footer = document.querySelector(".footer-text");
    if (footer && data.footer_text) {
      footer.textContent = data.footer_text;
    }

    // SEO Title
    if (data.default_seo_title) {
      document.title = data.default_seo_title;
    }

  } catch (error) {
    console.error("Erreur chargement Directus :", error);
  }
}

document.addEventListener("DOMContentLoaded", loadGlobalSettings);