/* =================================================
   RISKCURITY — script.js
   Gauge · Scroll reveals · Contact form · Riskmate AI
   ================================================= */

const W3F_KEY = 'cfb6d1ab-dc75-4a75-9597-849e23f32d33';

document.addEventListener('DOMContentLoaded', () => {

  /* ════════════════════════════════
     1. NAV TOGGLE
  ════════════════════════════════ */
  const navToggle = document.getElementById('navToggle');
  const navList   = document.getElementById('navList');
  if (navToggle && navList) {
    navToggle.addEventListener('click', () => {
      const open = navList.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.textContent = open ? '\u2715' : '\u2630';
    });
    navList.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => {
        navList.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.textContent = '\u2630';
      })
    );
  }



  /* ════════════════════════════════
     3. SCROLL REVEALS + STAGGER
  ════════════════════════════════ */
  function observe(sel, threshold, once) {
    const els = document.querySelectorAll(sel);
    if (!els.length) return;
    const ob = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in-view');
          if (once !== false) ob.unobserve(e.target);
        }
      });
    }, { threshold: threshold || 0.1 });
    els.forEach(el => ob.observe(el));
  }

  // Basic reveals (fire once)
  observe('.reveal', 0.1);
  observe('.reveal-stagger', 0.08);
  observe('.form-card', 0.1);

  // Stages — fire once per card
  observe('.stage', 0.22);

  // Methodology — stagger cards in sequence + draw line
  const mCards = document.querySelectorAll('.m-card');
  const mGrid  = document.querySelector('.method-grid');
  if (mCards.length && mGrid) {
    const mOb = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          // Stagger: each card gets a slight delay based on index
          const idx = Array.from(mCards).indexOf(e.target);
          const delay = idx * 100; // 100ms stagger
          e.target.style.transitionDelay = `${delay}ms`;
          e.target.classList.add('in-view');
          mOb.unobserve(e.target);

          // Draw the connecting line when the first card appears
          if (!mGrid.classList.contains('line-drawn')) {
            mGrid.classList.add('line-drawn');
          }
        }
      });
    }, { threshold: 0.15 });
    mCards.forEach(c => mOb.observe(c));
  }

  /* ════════════════════════════════
     3b. NAV SHRINK ON SCROLL
  ════════════════════════════════ */
  const siteHeader = document.querySelector('.site-header');
  if (siteHeader && !prefersReducedMotion) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          siteHeader.classList.toggle('scrolled', window.scrollY > 120);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ════════════════════════════════
     3c. STAT NUMBER COUNTERS
  ════════════════════════════════ */
  function animateCounter(el, from, to, suffix, duration) {
    if (prefersReducedMotion) { el.textContent = to + (suffix || ''); return; }
    const t0 = performance.now();
    const isFloat = String(to).includes('.');
    const dur = duration || 1200;
    (function tick(now) {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      const val = from + (to - from) * eased;
      el.textContent = (isFloat ? val.toFixed(1) : Math.round(val)) + (suffix || '');
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  // Watch stat strip for counter triggers
  const statCells = document.querySelectorAll('.stat-cell');
  if (statCells.length) {
    const counterData = [
      // [sn-before from, sn-before to, sn-after from, sn-after to, suffix]
      { before: [0, 23, ''], after: [0, 1, ''] },
      { before: [0, 7.8, ''], after: [0, 2.1, ''] },
      { after: [0, 68, '%'] },
      { custom: true }  // "8 wks" — just fade in, no count
    ];

    let statsRan = false;
    const statsOb = new IntersectionObserver(([entry], ob) => {
      if (entry.isIntersecting && !statsRan) {
        statsRan = true;
        ob.disconnect();

        statCells.forEach((cell, i) => {
          const data = counterData[i];
          if (!data) return;
          const delay = i * 80; // 80ms stagger

          setTimeout(() => {
            if (data.custom) return; // "8 wks" already in HTML

            const beforeEl = cell.querySelector('.sn-before');
            const afterEl  = cell.querySelector('.sn-after');

            if (data.before && beforeEl) {
              animateCounter(beforeEl, data.before[0], data.before[1], data.before[2], 1100);
            }
            if (data.after && afterEl) {
              animateCounter(afterEl, data.after[0], data.after[1], data.after[2], 1300);
            }
          }, delay);
        });
      }
    }, { threshold: 0.3 });

    const statStrip = document.querySelector('.stat-strip');
    if (statStrip) statsOb.observe(statStrip);
  }

  /* ════════════════════════════════
     4. CONTACT FORM
  ════════════════════════════════ */
  const cForm    = document.getElementById('contactForm');
  const cSuccess = document.getElementById('contactSuccess');
  if (cForm) {
    cForm.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = cForm.querySelector('[type=submit]');
      if (btn) { btn.disabled = true; btn.textContent = 'Sending\u2026'; }
      const data = Object.fromEntries(new FormData(cForm).entries());
      delete data.botcheck;
      ['service', 'timeline'].forEach(k => {
        const sel = cForm.elements[k];
        if (sel && sel.selectedOptions && sel.selectedOptions[0]) data[k] = sel.selectedOptions[0].textContent.trim();
      });
      data.phone = data.phone || 'Not provided';
      data.details = data.detail || 'Not provided';
      delete data.detail;
      data.source = 'Homepage Form';
      try {
        const res  = await fetch('https://api.web3forms.com/submit', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_key: W3F_KEY, subject: 'New Assessment Request — Riskcurity', ...data })
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message || 'Submission failed');
      } catch (err) {
        console.error('Form submission failed:', err);
        if (btn) { btn.disabled = false; btn.textContent = 'Send request →'; }
        alert('Sorry, your request could not be sent. Please try again or email riskcurity@gmail.com.\n(' + err.message + ')');
        return;
      }
      if (cForm)    cForm.style.display    = 'none';
      if (cSuccess) cSuccess.style.display = 'block';
    });
  }

  /* ════════════════════════════════
     5. RISKMATE AI
  ════════════════════════════════ */
  const rmTrigger  = document.getElementById('rmTrigger');
  const rmPanel    = document.getElementById('rmPanel');
  const rmClose    = document.getElementById('rmClose');
  const rmGate     = document.getElementById('rmGate');
  const rmChatArea = document.getElementById('rmChat');
  const rmGateForm = document.getElementById('rmGateForm');
  const rmMsgs     = document.getElementById('rmMsgs');
  const rmInput    = document.getElementById('rmInput');
  const rmChatForm = document.getElementById('rmChatForm');

  if (!rmTrigger || !rmPanel || !rmMsgs || !rmInput || !rmChatForm) return;

  let chatUser  = { name: '', email: '' };
  let chatLog   = [];
  let emailSent = false;
  let isBusy    = false;   // prevents double-reply during typing delay

  /* ── open / close ── */
  function openPanel() {
    rmPanel.classList.add('open');
    rmTrigger.setAttribute('aria-expanded', 'true');
    setTimeout(() => {
      const el = rmPanel.querySelector('input:not([disabled]), button:not([disabled])');
      if (el) el.focus();
    }, 60);
  }

  function closePanel() {
    rmPanel.classList.remove('open');
    rmTrigger.setAttribute('aria-expanded', 'false');
    rmTrigger.focus();
    if (chatLog.length && !emailSent) { emailSent = true; sendTranscript(); }
  }

  rmTrigger.addEventListener('click', () =>
    rmPanel.classList.contains('open') ? closePanel() : openPanel()
  );

  // Clicking the "Riskmate AI" label pill also opens the panel
  const rmLabel = document.getElementById('rmLabel');
  if (rmLabel) {
    rmLabel.addEventListener('click', () =>
      rmPanel.classList.contains('open') ? closePanel() : openPanel()
    );
    // Hide label when panel is open (clean look)
    const panelObserver = new MutationObserver(() => {
      const isOpen = rmPanel.classList.contains('open');
      rmLabel.style.opacity      = isOpen ? '0'        : '1';
      rmLabel.style.pointerEvents = isOpen ? 'none'    : 'auto';
      rmLabel.style.transform    = isOpen ? 'translateX(8px)' : 'translateX(0)';
    });
    panelObserver.observe(rmPanel, { attributes: true, attributeFilter: ['class'] });
  }
  if (rmClose) rmClose.addEventListener('click', closePanel);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && rmPanel.classList.contains('open')) closePanel();
  });

  /* ── gate form ── */
  if (rmGateForm) {
    rmGateForm.addEventListener('submit', e => {
      e.preventDefault();
      chatUser.name  = (document.getElementById('rmName')?.value  || '').trim() || 'there';
      chatUser.email = (document.getElementById('rmEmail')?.value || '').trim();

      rmGate.style.display      = 'none';
      rmChatArea.style.display       = 'flex';
      rmChatArea.style.flexDirection = 'column';

      botSay(`Hi ${chatUser.name} — I'm Riskmate, Riskcurity's assistant. Ask me about any of our services, the case study, or how to get started. What would you like to know?`);
      addChips();
      setTimeout(() => rmInput.focus(), 80);
    });
  }

  /* ── chat form ── */
  rmChatForm.addEventListener('submit', e => {
    e.preventDefault();
    const q = rmInput.value.trim();
    if (!q || isBusy) return;

    isBusy = true;
    rmInput.value    = '';
    rmInput.disabled = true;

    userSay(q);
    showTyping(q);
  });

  /* ── helpers ── */

  function userSay(text) {
    chatLog.push({ role: 'user', text });
    const d = document.createElement('div');
    d.className   = 'rm-msg user';
    d.textContent = text;
    rmMsgs.appendChild(d);
    scrollChat();
  }

  function botSay(html) {
    chatLog.push({ role: 'bot', text: html.replace(/<[^>]+>/g, '') });
    const d = document.createElement('div');
    d.className = 'rm-msg bot';
    d.innerHTML = html;
    rmMsgs.appendChild(d);
    scrollChat();
  }

  function showTyping(question) {
    // Create typing bubble
    const bubble = document.createElement('div');
    bubble.className = 'rm-msg bot rm-typing';
    bubble.innerHTML = '<span></span><span></span><span></span>';
    rmMsgs.appendChild(bubble);
    scrollChat();

    // After delay, remove bubble and show real reply
    setTimeout(() => {
      if (bubble.parentNode === rmMsgs) {
        rmMsgs.removeChild(bubble);
      }
      botSay(getAnswer(question));

      rmInput.disabled = false;
      rmInput.focus();
      isBusy = false;
    }, 650);
  }

  function scrollChat() {
    rmMsgs.scrollTop = rmMsgs.scrollHeight;
  }

  function addChips() {
    const wrap = document.createElement('div');
    wrap.className = 'rm-chips';
    [
      ['Pen testing',  'What is pen testing?'],
      ['Compliance',   'How does compliance automation work?'],
      ['SOC 24/7',     'Tell me about 24/7 SOC monitoring'],
      ['Pricing',      'How does pricing work?']
    ].forEach(([label, q]) => {
      const btn = document.createElement('button');
      btn.type        = 'button';
      btn.className   = 'rm-chip';
      btn.textContent = label;
      btn.addEventListener('click', () => {
        if (isBusy) return;
        isBusy           = true;
        rmInput.disabled = true;
        userSay(q);
        showTyping(q);
      });
      wrap.appendChild(btn);
    });
    rmMsgs.appendChild(wrap);
    scrollChat();
  }

  /* ── answer engine ── */
  function getAnswer(q) {
    const l = q.toLowerCase();

    if (/pen.?test|vapt|penetrat|break.in|hack|attack|vulnerab/.test(l))
      return "We test your website, apps, and cloud by trying to break in like real hackers. We show your team every vulnerability with clear proof and step-by-step instructions to fix them. Projects take 5–7 days, and free re-testing is always included.";

    if (/42001|ai.?govern|ai.?manage|aims|iso.?42001/.test(l))
      return "We set up ISO 42001 AI governance standards — ensuring your AI applications meet privacy regulations, maintain data security, and operate with human oversight.";

    if (/nist|800.?53|csf|cis |safeguard/.test(l))
      return "We align your systems with NIST CSF 2.0, NIST SP 800-53, and CIS Controls — essential security frameworks that protect against cyber threats and fulfill client standards.";

    if (/gdpr|ccpa|cpra|hipaa|27701|privacy|pims/.test(l))
      return "We manage data privacy compliance including GDPR, CCPA/CPRA, HIPAA (healthcare data), and ISO 27701 so your company handles customer data safely and legally.";

    if (/fedramp|csa|ccm|cloud.?control/.test(l))
      return "We help cloud providers achieve CSA CCM cloud security standards and prepare for FedRAMP approval to work with US federal agencies.";

    if (/compli|iso.?27001|soc.?2|soc.?1|pci|audit|certif|evidence|paperwork|framework/.test(l))
      return "We automate your compliance for ISO 27001, SOC 2, PCI DSS, GDPR, HIPAA, and more — continuously collecting evidence directly from your tools so you pass audits stress-free.";

    if (/monitor|soc\b|watch|24.?7|alert|incident|threat|detect/.test(l))
      return "Our security team monitors your systems 24/7. When a threat or suspicious activity happens, we investigate and stop it immediately. Our response time is under 15 minutes.";

    if (/ai|agent|automat|bot|llm|langchain/.test(l))
      return "We build custom AI assistants to automate repetitive security tasks and audit document collection safely, always keeping humans in control of key decisions.";

    if (/siem|alert.?rule|false.?alarm|false.?positive|noise|log/.test(l))
      return "We clean up your security tools to filter out useless alert noise. In a recent project, we cut false alarm notifications by 68% so teams only focus on real threats.";

    if (/price|cost|fee|budget|quote|charge|billing|invoice/.test(l))
      return "We charge a simple, flat fee per project quoted upfront. No hourly billing, no surprise costs, and free re-testing is included. Fill in the contact form below and we'll send a clear written proposal within 24 hours.";

    if (/case.?study|result|proof|example|8.?week|7\.8|2\.1|23|payment/.test(l))
      return "A fintech client was facing 23 security findings that blocked a major bank deal. In 8 weeks, we resolved 22 findings, reduced risk from 7.8 to 2.1, passed the audit, and saved the contract.";

    if (/how.?long|timeline|time|fast|quick|duration/.test(l))
      return "Security testing takes 5 to 7 days from start to finish. Full compliance setup (SOC 2 or ISO 27001) takes 4 to 8 weeks depending on your stack.";

    if (/start|begin|get.?start|next.?step|process|how.?work/.test(l))
      return "To get started, fill out the contact form at the bottom of the page. We will review your details and send a proposal within 24 hours.";

    if (/hello|hi\b|hey|good morning|good afternoon/.test(l))
      return `Hello ${chatUser.name || 'there'}! I can answer any questions about security testing, SOC 2 compliance, 24/7 monitoring, or AI tooling. What can I help you with today?`;

    if (/thank|thanks|cheers/.test(l))
      return "You're welcome! If you have more questions later, feel free to ask — or <a href='#contact' style='color:var(--teal);text-decoration:underline'>send us a message</a> and our team will get back to you within 24 hours.";

    // Default fallback
    return `Good question. For specific details, feel free to <a href='#contact' style='color:var(--teal);text-decoration:underline'>fill in our contact form</a> or email <a href='mailto:riskcurity@gmail.com' style='color:var(--teal);text-decoration:underline'>riskcurity@gmail.com</a>. We reply within 24 hours!`;
  }

  /* ── transcript email ── */
  async function sendTranscript() {
    if (!chatLog.length) return;
    const lines = chatLog.map(m => `[${m.role.toUpperCase()}]: ${m.text}`).join('\n\n');
    try {
      await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: W3F_KEY,
          subject: `Riskmate AI chat — ${chatUser.name} (${chatUser.email || 'no email'})`,
          from_name: 'Riskmate AI Widget',
          name: chatUser.name,
          email: chatUser.email || 'no-email@riskcurity.com',
          source: 'Riskmate AI Chat',
          message: `Chat transcript\n${'='.repeat(40)}\nVisitor : ${chatUser.name}\nEmail   : ${chatUser.email}\nTime    : ${new Date().toLocaleString()}\n\n${lines}\n${'='.repeat(40)}`
        })
      });
    } catch (_) {}
  }



  /* ════════════════════════════════
     RATING WIDGET
  ════════════════════════════════ */
  (function initRating() {
    const stars      = Array.from(document.querySelectorAll('.star'));
    const starHint   = document.getElementById('starHint');
    const submitBtn  = document.getElementById('ratingSubmit');
    const ratingForm = document.getElementById('ratingForm');
    const ratSuccess = document.getElementById('ratingSuccess');
    const rsStars    = document.getElementById('rsStars');

    if (!stars.length || !ratingForm) return;

    const hints = { 1:'Poor', 2:'Fair', 3:'Good', 4:'Very good', 5:'Excellent' };
    let selected = 0;

    // Highlight stars up to index
    function paint(upTo, cls) {
      stars.forEach((s, i) => {
        s.classList.toggle(cls, i < upTo);
      });
    }

    // Mouse enter star
    stars.forEach(star => {
      star.addEventListener('mouseenter', () => {
        const v = parseInt(star.dataset.v);
        paint(v, 'hovered');
        if (starHint) starHint.textContent = hints[v] || '';
      });
      star.addEventListener('mouseleave', () => {
        paint(0, 'hovered');
        if (starHint) starHint.textContent = selected ? hints[selected] : '\u00a0';
      });
      star.addEventListener('click', () => {
        selected = parseInt(star.dataset.v);
        paint(selected, 'selected');
        if (starHint) starHint.textContent = hints[selected];
        // Animate the clicked star
        star.style.transform = 'scale(1.35)';
        setTimeout(() => { star.style.transform = ''; }, 220);
        if (submitBtn) submitBtn.disabled = false;
      });
    });

    // Form submit
    ratingForm.addEventListener('submit', async e => {
      e.preventDefault();
      if (!selected) return;

      const btn = submitBtn;
      btn.disabled = true;
      btn.textContent = 'Submitting\u2026';

      const name     = document.getElementById('rv-name')?.value.trim()     || 'Anonymous';
      const email    = document.getElementById('rv-email')?.value.trim()    || '';
      const feedback = document.getElementById('rv-feedback')?.value.trim() || '';
      const stars5   = '\u2605'.repeat(selected) + '\u2606'.repeat(5 - selected);

      try {
        await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_key: W3F_KEY,
            subject: `Client Rating: ${selected}/5 ${stars5} — ${name}`,
            from_name: name,
            name: name,
            email: email || 'no-email@riskcurity.com',
            rating: `${selected}/5`,
            feedback: feedback || 'Not provided',
            source: 'Rating Form',
            message: [
              'CLIENT RATING — RISKCURITY',
              '='.repeat(40),
              `Name    : ${name}`,
              `Email   : ${email || 'not provided'}`,
              `Rating  : ${selected}/5  ${stars5}`,
              `Date    : ${new Date().toLocaleString()}`,
              '',
              'FEEDBACK:',
              feedback || '(no written feedback provided)',
              '='.repeat(40)
            ].join('\n')
          })
        });
      } catch (_) { /* show success anyway */ }

      // Show success
      ratingForm.style.display = 'none';
      ratSuccess.style.display = 'flex';

      // Render chosen stars in success state
      if (rsStars) {
        rsStars.innerHTML = '';
        for (let i = 0; i < 5; i++) {
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.setAttribute('viewBox', '0 0 24 24');
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z');
          if (i < selected) {
            svg.style.fill   = 'var(--amber)';
            svg.style.stroke = 'var(--amber)';
          } else {
            svg.style.fill   = '#E8E5DA';
            svg.style.stroke = '#E8E5DA';
          }
          svg.appendChild(path);
          rsStars.appendChild(svg);
        }
        // Animate stars in
        rsStars.querySelectorAll('svg').forEach((s, i) => {
          s.style.opacity   = '0';
          s.style.transform = 'scale(0.4)';
          s.style.transition= `opacity 0.3s ${i * 0.07}s ease, transform 0.3s ${i * 0.07}s cubic-bezier(.16,1,.3,1)`;
          setTimeout(() => { s.style.opacity = '1'; s.style.transform = 'scale(1)'; }, 60);
        });
      }
    });
  })();

  /* ════════════════════════════════
     6. FAQ ACCORDION HANDLER (CYBERDOM UPGRADE)
  ════════════════════════════════ */
  const faqQuestions = document.querySelectorAll('.faq-question');
  faqQuestions.forEach(btn => {
    const item = btn.closest('.faq-item');
    const answer = item ? item.querySelector('.faq-answer') : null;
    const icon = btn.querySelector('.faq-icon');

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Collapse all other accordion items
      document.querySelectorAll('.faq-item').forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('open');
          const otherBtn = otherItem.querySelector('.faq-question');
          const otherAns = otherItem.querySelector('.faq-answer');
          const otherIcon = otherItem.querySelector('.faq-icon');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
          if (otherAns) otherAns.style.maxHeight = null;
          if (otherIcon) otherIcon.textContent = '+';
        }
      });

      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        if (icon) icon.textContent = '−';
        if (answer) {
          answer.style.maxHeight = (answer.scrollHeight + 32) + 'px';
        }
      } else {
        item.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        if (icon) icon.textContent = '+';
        if (answer) {
          answer.style.maxHeight = null;
        }
      }
    });

    // Keyboard support (Enter & Space keys)
    btn.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
    });
  });

  // Dynamically recalculate height on window resize for open items
  window.addEventListener('resize', () => {
    document.querySelectorAll('.faq-item.open .faq-answer').forEach(ans => {
      ans.style.maxHeight = (ans.scrollHeight + 32) + 'px';
    });
  }, { passive: true });

  /* ════════════════════════════════
     7. LEAD MAGNET MODAL HANDLER
  ════════════════════════════════ */
  const lmTriggers = document.querySelectorAll('.lm-trigger');
  const lmOverlay  = document.getElementById('lmModalOverlay');
  const lmClose    = document.getElementById('lmClose');
  const lmForm     = document.getElementById('lmForm');

  if (lmTriggers.length && lmOverlay) {
    lmTriggers.forEach(t => {
      t.addEventListener('click', (e) => {
        e.preventDefault();
        lmOverlay.classList.add('active');
      });
    });
  }

  if (lmClose && lmOverlay) {
    lmClose.addEventListener('click', () => {
      lmOverlay.classList.remove('active');
    });
    lmOverlay.addEventListener('click', (e) => {
      if (e.target === lmOverlay) lmOverlay.classList.remove('active');
    });
  }

  if (lmForm) {
    lmForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('lmEmail')?.value.trim();
      const name  = document.getElementById('lmName')?.value.trim() || 'Valued Buyer';
      const btn   = lmForm.querySelector('button[type="submit"]');

      if (!email) return;

      btn.disabled = true;
      btn.textContent = 'Generating PDF Checklist…';

      try {
        await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_key: W3F_KEY,
            subject: `Lead Magnet Download: Security Checklist — ${name}`,
            from_name: name,
            name: name,
            email: email,
            source: 'Lead Magnet',
            message: `Lead downloaded Security Self-Assessment Checklist PDF.\nName: ${name}\nEmail: ${email}`
          })
        });
      } catch (_) {}

      // Trigger automatic simulated download of the Checklist
      const blob = new Blob([
        `===================================================\n` +
        `RISKCURITY — B2B Cybersecurity Self-Assessment Checklist\n` +
        `===================================================\n\n` +
        `Hello ${name},\n\n` +
        `Use this 10-point checklist before your next vendor security review or SOC 2 audit:\n\n` +
        `[ ] 1. Multi-Factor Authentication (MFA) enforced on all cloud console & email accounts\n` +
        `[ ] 2. Automated Web Application Security Vulnerability Scanning (Weekly)\n` +
        `[ ] 3. Cloud Storage Buckets (S3 / GCP) set to Private with encryption enabled\n` +
        `[ ] 4. Annual Penetration Test completed by an independent OSCP/CEH certified team\n` +
        `[ ] 5. Centralized Log Retention & SIEM monitoring active 24/7\n` +
        `[ ] 6. Employee Security Awareness Training recorded & updated annually\n` +
        `[ ] 7. Data Protection & Privacy Policy published (GDPR / CCPA compliant)\n` +
        `[ ] 8. Incident Response Plan documented and dry-run tested every 6 months\n` +
        `[ ] 9. Third-party vendor risk assessment protocol enforced\n` +
        `[ ] 10. Automated backup & disaster recovery (DR) restoration tested\n\n` +
        `---------------------------------------------------\n` +
        `Need help closing security gaps? Book an assessment:\n` +
        `Website : https://www.riskcurity.com/\n` +
        `WhatsApp: https://wa.me/923423717545\n` +
        `Email   : riskcurity@gmail.com\n` +
        `===================================================\n`
      ], { type: 'text/plain' });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'Riskcurity_Security_Self_Assessment_Checklist.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      btn.textContent = 'Checklist Downloaded ✓';
      setTimeout(() => {
        if (lmOverlay) lmOverlay.classList.remove('active');
        btn.disabled = false;
        btn.textContent = 'Get Free Checklist PDF →';
      }, 2000);
    });
  }

}); // end DOMContentLoaded

