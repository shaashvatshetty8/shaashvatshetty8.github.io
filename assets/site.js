/* Shared behaviour: theme, nav, reveal, counters, filters, tabs. */
(function () {
  'use strict';

  /* ---------- Theme ---------- */
  var root = document.documentElement;
  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  var saved = load('theme');
  if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);

  function toggleTheme() {
    var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    store('theme', next);
  }

  /* ---------- Boot ---------- */
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* theme buttons */
    Array.prototype.forEach.call(document.querySelectorAll('[data-theme-toggle]'), function (b) {
      b.addEventListener('click', toggleTheme);
    });

    /* mobile menu */
    var menu = document.getElementById('mobileMenu');
    var menuBtn = document.querySelector('[data-menu-toggle]');
    if (menu && menuBtn) {
      menuBtn.addEventListener('click', function () {
        var open = !menu.hidden;
        menu.hidden = open;
        menuBtn.setAttribute('aria-expanded', String(!open));
      });
      Array.prototype.forEach.call(menu.querySelectorAll('a'), function (a) {
        a.addEventListener('click', function () {
          menu.hidden = true;
          menuBtn.setAttribute('aria-expanded', 'false');
        });
      });
    }

    /* header state + scroll progress + back-to-top */
    var header = document.querySelector('.site-header');
    var bar = document.querySelector('.scroll-bar');
    var top = document.querySelector('.to-top');
    function onScroll() {
      var y = window.scrollY || 0;
      if (header) header.classList.toggle('is-stuck', y > 8);
      if (bar) {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (h > 0 ? Math.min(100, (y / h) * 100) : 0) + '%';
      }
      if (top) top.classList.toggle('is-on', y > 700);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    if (top) top.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    });

    /* reveal on scroll */
    var revealables = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || reduced) {
      Array.prototype.forEach.call(revealables, function (el) { el.classList.add('is-in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      Array.prototype.forEach.call(revealables, function (el, i) {
        el.style.transitionDelay = Math.min(i % 6, 5) * 55 + 'ms';
        io.observe(el);
      });
    }

    /* safety net: if the observer never fires, show everything anyway */
    setTimeout(function () {
      Array.prototype.forEach.call(document.querySelectorAll('.reveal:not(.is-in)'), function (el) {
        el.classList.add('is-in');
      });
    }, 2500);

    /* card spotlight follows cursor */
    Array.prototype.forEach.call(document.querySelectorAll('.card'), function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });

    /* animated counters */
    var counters = document.querySelectorAll('[data-count]');
    if (counters.length) {
      var run = function (el) {
        var target = parseFloat(el.getAttribute('data-count'));
        var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
        if (reduced || isNaN(target)) { el.textContent = target.toFixed(dec); return; }
        var t0 = null, dur = 1100;
        var step = function (ts) {
          if (t0 === null) t0 = ts;
          var p = Math.min(1, (ts - t0) / dur);
          var e = 1 - Math.pow(1 - p, 3);
          el.textContent = (target * e).toFixed(dec);
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      };
      if (!('IntersectionObserver' in window)) {
        Array.prototype.forEach.call(counters, run);
      } else {
        var co = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) { run(en.target); co.unobserve(en.target); }
          });
        }, { threshold: 0.4 });
        Array.prototype.forEach.call(counters, function (el) { co.observe(el); });
      }
    }

    /* hero rotating role */
    var role = document.getElementById('roleText');
    if (role) {
      var words = (role.getAttribute('data-words') || '').split('|').filter(Boolean);
      if (words.length) {
        if (reduced) {
          role.textContent = words[0];
        } else {
          var wi = 0, ci = 0, del = false;
          var tick = function () {
            var w = words[wi];
            ci += del ? -1 : 1;
            role.textContent = w.slice(0, ci);
            var wait = del ? 34 : 62;
            if (!del && ci === w.length) { del = true; wait = 1700; }
            else if (del && ci === 0) { del = false; wi = (wi + 1) % words.length; wait = 320; }
            setTimeout(tick, wait);
          };
          setTimeout(tick, 600);
        }
      }
    }

    /* project filters */
    var chips = document.querySelectorAll('[data-filter]');
    if (chips.length) {
      var items = document.querySelectorAll('[data-tags]');
      Array.prototype.forEach.call(chips, function (chip) {
        chip.addEventListener('click', function () {
          var key = chip.getAttribute('data-filter');
          Array.prototype.forEach.call(chips, function (c) {
            c.classList.toggle('is-on', c === chip);
            c.setAttribute('aria-pressed', String(c === chip));
          });
          Array.prototype.forEach.call(items, function (it) {
            var tags = it.getAttribute('data-tags') || '';
            it.hidden = !(key === 'all' || tags.split(' ').indexOf(key) !== -1);
          });
        });
      });
    }

    /* tabs */
    var tabs = document.querySelectorAll('[role="tab"]');
    if (tabs.length) {
      var select = function (tab) {
        Array.prototype.forEach.call(tabs, function (t) {
          var on = t === tab;
          t.setAttribute('aria-selected', String(on));
          t.tabIndex = on ? 0 : -1;
          var panel = document.getElementById(t.getAttribute('aria-controls'));
          if (panel) panel.hidden = !on;
        });
      };
      Array.prototype.forEach.call(tabs, function (tab, i) {
        tab.addEventListener('click', function () { select(tab); });
        tab.addEventListener('keydown', function (e) {
          var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
          if (!d) return;
          e.preventDefault();
          var n = tabs[(i + d + tabs.length) % tabs.length];
          n.focus(); select(n);
        });
      });
    }

    /* mark current nav link */
    var here = location.pathname.split('/').pop() || 'index.html';
    Array.prototype.forEach.call(document.querySelectorAll('.nav-links a'), function (a) {
      var href = a.getAttribute('href') || '';
      if (href === here || (here === 'index.html' && href === './')) a.classList.add('is-active');
    });
  });
})();
