(function () {
  'use strict';

  // ---------- 配置 ----------
  const CONFIG = {
    PANEL_ID: 'x-article-outline-panel',
    // 一级章节：优先语义类（支持多级 longform-header-one/two/three），兜底文本启发式
    HEADER_CLASS_SELECTOR: '[class*="longform-header"]',
    FALLBACK_BLOCK_SELECTOR: '[class*="longform-unstyled"]',
    // 中文序数 / 数字序号 / 常见结语词（仅用于兜底识别，限制短文本降低误报）
    FALLBACK_TITLE_RE: /^(一|二|三|四|五|六|七|八|九|十|十一|十二|十三|十四|十五)[、.．:：\s]|^第[一二三四五六七八九十百\d]+[章节部分][、.．:：\s]|^\d{1,2}[、.．]\s*\S|^(写在最后|结语|总结|写在前面|写在开篇|后记|尾声)[:：\s]?/,
    MAX_FALLBACK_LEN: 45,          // 兜底标题最大长度（超过按正文处理）
    SCROLL_OFFSET: 72,             // 滚动到章节的顶部偏移（X 顶部 sticky 导航 53px + 缓冲）
    LAYOUT_STYLE_ID: 'x-article-layout-style',
    NAV_COLLAPSED_WIDTH: 88,       // 左侧导航折叠后的图标条宽度
    WIDER_RATIO: 0.15,             // 文章页中间主栏/正文加宽比例（600→690 等）
    AUTHOR_HANDLE: 'StoryComicAI', // 插件署名/引导关注的作者账号
    FOLLOW_KEY: 'xao-follow-state', // 关注状态缓存
    FOLLOW_TTL: 5 * 60 * 1000,    // 关注状态缓存 5 分钟（缩短，减少"已关注仍显示"的窗口）
  };

  // 左导航折叠状态（用户手动控制，localStorage 记忆）
  const LS_COLLAPSE_KEY = 'x-article-nav-collapsed';
  let navCollapsed = false;
  try { navCollapsed = localStorage.getItem(LS_COLLAPSE_KEY) === '1'; } catch (e) {}

  // 底部署名卡显示状态：仅未关注作者时展示（关注后整卡隐藏），无手动关闭途径
  let isFollowing = false;

  async function checkFollowing() {
    try {
      // 读缓存（30 分钟内不重复请求）
      try {
        const c = JSON.parse(localStorage.getItem(CONFIG.FOLLOW_KEY) || '');
        if (c && typeof c.following === 'boolean' && Date.now() - c.ts < CONFIG.FOLLOW_TTL) {
          isFollowing = c.following;
          return;
        }
      } catch (e) {}
      const ct0 = (document.cookie.match(/\bct0=([^;]+)/) || [])[1] || '';
      const BEARER = 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA';
      const res = await fetch(
        '/i/api/1.1/friendships/lookup.json?screen_name=' + CONFIG.AUTHOR_HANDLE,
        {
          headers: {
            'authorization': BEARER,
            'x-csrf-token': ct0,
            'x-twitter-active-user': 'yes',
            'x-twitter-client-language': 'zh-cn',
          },
          credentials: 'include',
        }
      );
      if (res.status === 200) {
        const j = await res.json();
        const u = Array.isArray(j) ? j[0] : null;
        isFollowing = !!(u && Array.isArray(u.connections) && u.connections.includes('following'));
        try {
          localStorage.setItem(CONFIG.FOLLOW_KEY, JSON.stringify({ following: isFollowing, ts: Date.now() }));
        } catch (e) {}
      }
      // 非 200 视为失败，保持默认（显示关注按钮）
    } catch (e) {
      // 失败兜底：不设置 isFollowing，保持显示关注按钮
    }
  }

  // ---------- 工具 ----------
  function clearPanel() {
    document.getElementById(CONFIG.PANEL_ID)?.remove();
  }

  // ---------- 侧栏卡片定位（X 文章页右侧栏） ----------
  // 结构：sidebarColumn > 内容容器 > div[aria-label="当前趋势"]（外层容器，含搜索框等全部卡片）
  //       > 卡片列表 > [搜索卡, 相关用户卡, 直播卡, 趋势卡, 页脚卡, ...]
  // 搜索卡特征：包含 [data-testid="SearchBox_Search_Input"]
  function getSidebarState() {
    const outer = document.querySelector('div[aria-label="当前趋势"]');
    if (!outer) return { list: null, searchCard: null };
    const list = outer.firstElementChild;
    const searchInput = document.querySelector('[data-testid="SearchBox_Search_Input"]');
    let searchCard = null;
    if (list && searchInput) {
      for (const c of list.children) {
        if (c.contains(searchInput)) { searchCard = c; break; }
      }
    }
    return { list, searchCard };
  }

  // 隐藏除搜索框外的所有侧栏卡片（相关用户/直播/趋势/页脚），保留搜索卡 + 大纲面板
  function hideExtraCards() {
    const { list, searchCard } = getSidebarState();
    if (!list) return;
    for (const card of list.children) {
      if (card === searchCard) continue;
      if (card.id === CONFIG.PANEL_ID) continue;
      card.style.display = 'none';
    }
  }

  // 恢复所有侧栏卡片（离开文章页时）
  function showAllCards() {
    const { list } = getSidebarState();
    if (!list) return;
    for (const card of list.children) card.style.display = '';
  }

  // 大纲面板挂载：插到搜索卡之后（搜索框下方）
  function mountPanel(panel) {
    const { list, searchCard } = getSidebarState();
    const sidebar = document.querySelector('[data-testid="sidebarColumn"]');
    if (searchCard && searchCard.parentNode) {
      searchCard.parentNode.insertBefore(panel, searchCard.nextSibling);
    } else if (list && list.parentNode) {
      list.parentNode.insertBefore(panel, list.nextSibling);
    } else if (sidebar) {
      sidebar.insertBefore(panel, sidebar.firstChild);
    }
  }

  // 文章页专属布局：左侧导航折叠成图标条 + 中间主栏/正文加宽（仅文章页生效，非文章页恢复）
  // 基于当前 X 桌面布局锚点（header > div 为导航列；primaryColumn 600px）实测验证可行，X 改版需复查
  function applyArticleLayout(on) {
    let style = document.getElementById(CONFIG.LAYOUT_STYLE_ID);
    if (on && !style) {
      style = document.createElement('style');
      style.id = CONFIG.LAYOUT_STYLE_ID;
      const wA = 567 * (1 + CONFIG.WIDER_RATIO);   // 文章正文加宽
      const PEN = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='white' d='M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z'/%3E%3C/svg%3E";
      style.textContent = [
        'header > div { width: ' + CONFIG.NAV_COLLAPSED_WIDTH + 'px !important; }',
        'header [dir="ltr"] { display: none !important; }',
        'header [data-testid="SideNav_NewTweet_Button"] { width: 48px !important; height: 48px !important; min-width: 0 !important; max-width: 48px !important; min-height: 48px !important; max-height: 48px !important; border-radius: 999px !important; padding: 0 !important; margin: 8px auto 0 !important; justify-content: center !important; align-items: center !important; display: flex !important; background-image: url("' + PEN + '") !important; background-repeat: no-repeat !important; background-position: center !important; background-size: 20px 20px !important; }',
        '[data-testid="twitterArticleReadView"] { max-width: 657px !important; width: 657px !important; }',
        '[class~="r-obd0qt"][class~="r-16y2uox"] { display: none !important; }',
        '[class~="r-l00any"] { margin-left: 4px !important; }',
      ].join('\n');
      document.head.appendChild(style);
    } else if (!on && style) {
      style.remove();
    }
  }

  let savedPrimaryClass = ''; // primaryColumn 原始 class，恢复时用
  let primaryEl = null;
  let primaryChild = null; // primaryColumn 第一个子元素，恢复时清样式

  // 中间主栏：去掉 X class + 占满宽度 + flex 居中，内容子元素限宽居中（全局生效，离开恢复）
  function applyPrimaryColumn() {
    const el = document.querySelector('[data-testid="primaryColumn"]');
    if (!el) return;
    primaryEl = el;
    if (el.className) {
      if (!savedPrimaryClass) savedPrimaryClass = el.className;
      el.removeAttribute('class');
    }
    el.style.width = '100%';
    el.style.margin = '0 12px';
    el.style.display = 'flex';
    el.style.justifyContent = 'center';
    const first = el.firstElementChild;
    if (first) {
      primaryChild = first;
      first.style.maxWidth = '1280px';
      first.style.flex = '1';
    }
  }

  function restorePrimaryColumn() {
    if (primaryEl) {
      if (savedPrimaryClass) { primaryEl.className = savedPrimaryClass; savedPrimaryClass = ''; }
      primaryEl.style.width = '';
      primaryEl.style.margin = '';
      primaryEl.style.display = '';
      primaryEl.style.justifyContent = '';
      if (primaryChild) {
        primaryChild.style.maxWidth = '';
        primaryChild.style.flex = '';
        primaryChild = null;
      }
      primaryEl = null;
    }
  }

  // compose/articles 创作页专属：header 清 class + 导航列去 r-pt392 + main 内容 width 100%
  let savedComposeHeaderClass = '';
  let savedComposeNavClass = '';

  function applyComposeLayout(on) {
    const header = document.querySelector('header');
    if (on) {
      if (header) {
        if (header.className) {
          if (!savedComposeHeaderClass) savedComposeHeaderClass = header.className;
          header.removeAttribute('class');
        }
        const first = header.firstElementChild;
        if (first && first.className) {
          if (!savedComposeNavClass) savedComposeNavClass = first.className;
          if (first.classList.contains('r-pt392')) first.classList.remove('r-pt392');
        }
      }
      const main = document.querySelector('main');
      if (main && main.firstElementChild) main.firstElementChild.style.width = '100%';
      // 板块导航区（仅创作页）：root-header 限宽 375，detail-header flex 伸展
      const rootH = document.querySelector('[aria-labelledby="root-header"]');
      if (rootH) {
        rootH.style.margin = '0';
        rootH.style.maxWidth = '350px';
        ensureComposeFold(rootH); // 「更多」同级右侧加折叠图标，切换 root-header 显隐
      }
      const detailH = document.querySelector('[aria-labelledby="detail-header"]');
      if (detailH) {
        detailH.style.margin = '0';
        detailH.style.flex = '1';
        detailH.style.maxWidth = 'unset';
      }
      // 工具条区元素（含 r-z7pwl0，排除 detail-header）：max-width 1280px
      document.querySelectorAll('[class~="r-z7pwl0"]:not([aria-labelledby="detail-header"])').forEach((el) => {
        el.style.maxWidth = '1280px';
      });
      // 样式工具栏：#toolbar-styling-buttons 居中
      const toolbar = document.getElementById('toolbar-styling-buttons');
      if (toolbar) toolbar.style.justifyContent = 'center';
      // 文章实体视图：垂直居中
      const aev = document.querySelector('[data-testid="articleEntityView"]');
      if (aev) aev.style.alignItems = 'center';
      // 文章阅读视图：自适应宽度（!important 覆盖折叠样式的 657px 限宽）
      const tav = document.querySelector('[data-testid="twitterArticleReadView"]');
      if (tav) {
        tav.style.setProperty('max-width', 'unset', 'important');
        tav.style.setProperty('width', 'unset', 'important');
      }
      // 某个布局元素：横向反排
      const rev = document.querySelector('[class="css-g5y9jx r-1pz39u2 r-13awgt0 r-18u37iz r-1xnzce8 r-1p0dtai r-1d2f490 r-u8s1d r-zchlnj r-ipm5af"]');
      if (rev) rev.style.flexDirection = 'row-reverse';
      // 元素 r-18jsvk2：垂直居中
      const c18 = document.querySelector('[class="css-g5y9jx r-18jsvk2"]');
      if (c18) c18.style.alignItems = 'center';
    } else if (savedComposeHeaderClass || savedComposeNavClass) {
      // 仅当进过 compose 页（有改动痕迹）才恢复，避免在普通页面无条件清 main width / 动 header
      if (header) {
        if (savedComposeHeaderClass) { header.className = savedComposeHeaderClass; savedComposeHeaderClass = ''; }
        const first = header.firstElementChild;
        if (first && savedComposeNavClass) { first.className = savedComposeNavClass; savedComposeNavClass = ''; }
      }
      const main = document.querySelector('main');
      if (main && main.firstElementChild) main.firstElementChild.style.width = '';
    }
  }

  // compose 页 root-header 折叠图标：放在指定容器（r-1awozwy r-18u37iz r-6413gk r-1heobfl r-vsjdig）作为最后一个子元素，点击切换 root-header 显隐（幂等，只保留一个）
  function ensureComposeFold(rootH) {
    const container = document.querySelector('[class="css-g5y9jx r-1awozwy r-18u37iz r-6413gk r-1heobfl r-vsjdig"]');
    if (!container) return;
    // 幂等：容器内已有折叠按钮则跳过
    if ([...container.children].some((c) => c.classList && c.classList.contains('xao-compose-fold'))) {
      return;
    }
    const foldBtn = document.createElement('button');
    foldBtn.type = 'button';
    foldBtn.className = 'xao-compose-fold';
    foldBtn.title = '折叠/展开';
    foldBtn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"></rect><line x1="9" y1="4" x2="9" y2="20"></line></svg>';
    foldBtn.style.cssText =
      'display:flex;align-items:center;justify-content:center;width:36px;height:36px;border:0;border-radius:999px;background:none;color:rgb(83,100,113);cursor:pointer;padding:0;flex-shrink:0;';
    const svg = foldBtn.querySelector('svg');
    if (svg) svg.style.cssText = 'width:18px;height:18px;display:block;';
    foldBtn.addEventListener('mouseenter', () => {
      foldBtn.style.background = 'rgba(29,155,240,0.1)';
      foldBtn.style.color = 'rgb(29,155,240)';
    });
    foldBtn.addEventListener('mouseleave', () => {
      foldBtn.style.background = '';
      foldBtn.style.color = 'rgb(83,100,113)';
    });
    foldBtn.addEventListener('click', () => {
      const hidden = rootH.style.display === 'none';
      rootH.style.display = hidden ? '' : 'none';
    });
    container.appendChild(foldBtn); // 作为容器最后一个子元素
  }

  // 折叠开关：更新状态 + 记忆 + 应用布局 + 同步按钮提示
  function setNavCollapsed(v) {
    navCollapsed = v;
    try { localStorage.setItem(LS_COLLAPSE_KEY, v ? '1' : '0'); } catch (e) {}
    applyArticleLayout(v);
    syncCollapseBtn(); // 同步 logo 显隐与按钮位置
    syncNavBtnTitle();
  }

  // 文章页侧边栏贴左（无论折叠与否），覆盖 X 导航列 margin-left:60px
  function setNavSnug(on) {
    let s = document.getElementById('x-article-nav-snug');
    if (on && !s) {
      s = document.createElement('style');
      s.id = 'x-article-nav-snug';
      s.textContent = [
        'header > div { margin-left: 0 !important; }',
        'main > div:first-child { width: 100% !important; }',
        '[data-testid="sidebarColumn"] { margin-right: 6px !important; }',
      ].join('\n');
      document.head.appendChild(s);
    } else if (!on && s) {
      s.remove();
    }
  }

  let navBtn = null; // 左导航顶部的折叠图标按钮
  let navLogoEl = null; // 缓存的 logo 引用（防瞬时查找失败）
  let navH1El = null; // 缓存的 h1 容器引用
  let savedH1Class = ''; // h1 原始 class，离开文章页时恢复
  let savedHeaderClass = ''; // <header> 原始 class，离开文章页时恢复
  let savedTweetWrapClass = ''; // 发帖按钮外层容器原始 class（折叠时去掉 r-e7q0ms）

  // 去掉元素上的 r-1ye8kvj class（home 页某模块，幂等）
  function stripYe8kvj() {
    document.querySelectorAll('.r-f8sm7e.r-13qz1uu.r-1ye8kvj').forEach((el) => {
      el.classList.remove('r-1ye8kvj');
    });
  }

  // 撤销历史误伤：之前用通用选择器把非板块导航的 r-f8sm7e+r-13qz1uu 元素（如主页时间线/文章页元素）设成了 375px，这里恢复原样
  function undoNavSectionMiss() {
    document.querySelectorAll('[class~="r-f8sm7e"][class~="r-13qz1uu"]').forEach((el) => {
      if (el.classList.contains('r-th6na') || el.classList.contains('r-z7pwl0')) return;
      if (el.style.maxWidth === '375px') el.style.maxWidth = '';
      if (el.style.margin === '0') el.style.margin = '';
    });
  }

  // 折叠图标按钮（与 X logo 同在侧边栏顶部）：
  // - 非折叠：X logo + 折叠图标 左右并排
  // - 折叠：  仅折叠图标（logo 隐藏，图标居中）
  // 幂等健壮：logo 瞬时查不到时用缓存续命，避免"图标偶尔渲染不出来"
  function syncCollapseBtn() {
    const fresh = document.querySelector('header a[aria-label="X"]') || document.querySelector('header a[href="/home"]');
    if (fresh) navLogoEl = fresh;
    const logo = fresh || (navLogoEl && navLogoEl.isConnected ? navLogoEl : null);
    if (!logo) return; // 彻底找不到时放弃，由 2s 兜底定时器重试
    // 确保按钮样式注入（独立于面板样式，非文章页也必须生效）
    if (!document.getElementById('xao-nav-style')) {
      const ns = document.createElement('style');
      ns.id = 'xao-nav-style';
      ns.textContent = NAV_BTN_STYLE;
      document.head.appendChild(ns);
    }
    const container = logo.parentElement;
    if (container) navH1El = container;
    const cont = container || navH1El;
    if (!cont) return;
    if (!navBtn || !navBtn.isConnected) {
      navBtn = document.createElement('button');
      navBtn.type = 'button';
      navBtn.className = 'xao-nav-collapse-btn';
      navBtn.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"></rect><line x1="9" y1="4" x2="9" y2="20"></line></svg>';
      navBtn.addEventListener('click', () => setNavCollapsed(!navCollapsed));
      cont.appendChild(navBtn); // 放在 logo 右侧
    }
    // 每轮确保容器布局（X React 重渲染可能清掉 inline 样式 / 恢复 class）
    const outer = cont.parentElement; // h1 外层容器
    // 折叠时外层不占满宽（只有居中图标），非折叠占满容纳 logo+图标贴边
    if (outer) outer.style.width = navCollapsed ? '' : '100%';
    if (cont.className) {
      if (!savedH1Class) savedH1Class = cont.className; // 记住原始 class
      cont.removeAttribute('class'); // 去掉 h1 的所有 X class
    }
    // 去掉 <header> 本身的 X class（保存原始以恢复）
    const header = cont.closest('header');
    if (header && header.className) {
      if (!savedHeaderClass) savedHeaderClass = header.className;
      header.removeAttribute('class');
    }
    cont.style.display = 'flex';
    cont.style.alignItems = 'center';
    cont.style.width = '100%';
    cont.style.margin = '0'; // 去掉 h1 默认外边距
    if (navCollapsed) {
      logo.style.display = 'none';
      cont.style.justifyContent = 'center'; // 只留折叠图标，居中
    } else {
      logo.style.display = '';
      cont.style.justifyContent = 'space-between'; // X logo 左、折叠图标右，贴两边
    }
    // 折叠时：发帖按钮外层容器去掉 r-e7q0ms（90% 宽度限制，折叠导航下不适应）
    const wrap = document.querySelector('[data-testid="SideNav_NewTweet_Button"]');
    if (wrap) {
      const wc = wrap.parentElement;
      if (wc) {
        if (navCollapsed) {
          if (!savedTweetWrapClass) savedTweetWrapClass = wc.className; // 记住原始 class
          if (wc.classList.contains('r-e7q0ms')) wc.classList.remove('r-e7q0ms');
        } else if (savedTweetWrapClass) {
          wc.className = savedTweetWrapClass; savedTweetWrapClass = '';
        }
      }
    }
    syncNavBtnTitle();
  }

  // 恢复 X logo（离开文章页时）
  function removeCollapseBtn() {
    if (navBtn && navBtn.isConnected) navBtn.remove();
    navBtn = null;
    const ns = document.getElementById('xao-nav-style');
    if (ns) ns.remove(); // 清理独立按钮样式
    const logo = document.querySelector('header a[aria-label="X"]');
    if (logo) {
      logo.style.display = '';
      const hdr = logo.closest('header');
      if (hdr && savedHeaderClass) { hdr.className = savedHeaderClass; savedHeaderClass = ''; } // 恢复 header class
      const wrap = document.querySelector('[data-testid="SideNav_NewTweet_Button"]');
      const wc = wrap ? wrap.parentElement : null;
      if (wc && savedTweetWrapClass) { wc.className = savedTweetWrapClass; savedTweetWrapClass = ''; } // 恢复发帖按钮容器 class
      const c = logo.parentElement;
      if (c) {
        if (savedH1Class) { c.className = savedH1Class; savedH1Class = ''; } // 恢复 h1 class
        c.style.display = '';
        c.style.alignItems = '';
        c.style.justifyContent = '';
        c.style.width = '';
        c.style.margin = '';
        const o = c.parentElement;
        if (o) o.style.width = '';
      }
    }
  }

  function syncNavBtnTitle() {
    if (!navBtn) return;
    navBtn.title = navCollapsed ? '展开导航' : '折叠导航';
    navBtn.setAttribute('aria-label', navCollapsed ? '展开导航' : '折叠导航');
  }

  // ---------- 标题提取 ----------
  function extractMeta() {
    const titleEl = document.querySelector('[data-testid="twitter-article-title"]');
    const title = titleEl ? titleEl.innerText.replace(/\s+/g, ' ').trim() : null;

    const rich = document.querySelector('[data-testid="twitterArticleRichTextView"]');
    if (!rich) return { title, sections: [] };

    const seen = new Set();
    const sections = [];

    const push = (text, el, level) => {
      const t = text.replace(/\s+/g, ' ').trim();
      if (!t || seen.has(t)) return; // DraftJS 双层渲染去重
      seen.add(t);
      sections.push({ text: t, el, level });
    };

    // 方式 1：语义标题（支持多级：longform-header-one → 一级，-two → 二级，-three → 三级）
    rich.querySelectorAll(CONFIG.HEADER_CLASS_SELECTOR).forEach((h) => {
      const cls = (h.className || '').toString();
      let level = 1;
      if (cls.includes('longform-header-three')) level = 3;
      else if (cls.includes('longform-header-two')) level = 2;
      else if (cls.includes('longform-header-one')) level = 1;
      push(h.innerText, h, level);
    });

    // 方式 2：兜底 —— 无语义标题时，用中文序数/数字/结语词启发式
    if (sections.length === 0) {
      rich.querySelectorAll(CONFIG.FALLBACK_BLOCK_SELECTOR).forEach((d) => {
        const t = d.innerText.trim();
        if (t.length === 0 || t.length > CONFIG.MAX_FALLBACK_LEN) return;
        if (CONFIG.FALLBACK_TITLE_RE.test(t)) push(t, d, 1);
      });
    }

    return { title, sections };
  }

  // ---------- 面板构建 ----------
  // 折叠按钮独立样式（不依赖面板样式，非文章页也必须生效，否则按钮渲染不出来）
  // 显式 svg 描边色（不依赖 currentColor 继承），防深色模式/主题判断导致图标不可见
  const NAV_BTN_STYLE = `
    .xao-nav-collapse-btn {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 50px !important;
      height: 50px !important;
      margin: 0 !important;
      padding: 0 !important;
      border: 0 !important;
      border-radius: 999px !important;
      background: transparent !important;
      color: rgb(15,20,25) !important;
      cursor: pointer !important;
      flex-shrink: 0 !important;
      appearance: none;
      -webkit-appearance: none;
    }
    .xao-nav-collapse-btn svg {
      width: 24px !important;
      height: 24px !important;
      display: block !important;
      stroke: rgb(15,20,25);
    }
    .xao-nav-collapse-btn:hover { background: rgba(29,155,240,0.1) !important; color: rgb(29,155,240) !important; }
    .xao-nav-collapse-btn:hover svg { stroke: rgb(29,155,240); }
    @media (prefers-color-scheme: dark) {
      .xao-nav-collapse-btn { color: rgb(231,233,234) !important; }
      .xao-nav-collapse-btn svg { stroke: rgb(231,233,234); }
      .xao-nav-collapse-btn:hover { background: rgba(29,155,240,0.2) !important; color: rgb(29,155,240) !important; }
      .xao-nav-collapse-btn:hover svg { stroke: rgb(29,155,240); }
    }
  `;

  const PANEL_STYLE = `
    #${CONFIG.PANEL_ID} {
      margin: 28px 0 16px;
      border-radius: 16px;
      background: rgb(255,255,255);
      box-shadow: rgba(0,0,0,0) 0 0 0 0, rgba(0,0,0,0) 0 0 0 0;
      overflow: hidden;
    }
    @media (prefers-color-scheme: dark) {
      #${CONFIG.PANEL_ID} { background: rgb(22,24,28); }
    }
    #${CONFIG.PANEL_ID} .xao-header {
      height: 24px;
      padding: 0;
    }
    /* 左导航顶部折叠图标按钮（与 X logo 并排，取代仅限折叠时） */
    #${CONFIG.PANEL_ID} .xao-title {
      padding: 0 16px 10px;
      font-size: 16px;
      font-weight: 800;
      line-height: 22px;
      color: rgb(15,20,25);
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      cursor: pointer;
    }
    @media (prefers-color-scheme: dark) {
      #${CONFIG.PANEL_ID} .xao-title { color: rgb(231,233,234); }
    }
    #${CONFIG.PANEL_ID} .xao-list {
      max-height: calc(100vh - 190px);
      overflow-y: auto;
      padding: 4px 8px 12px;
    }
    #${CONFIG.PANEL_ID} .xao-item {
      display: block;
      width: 100%;
      text-align: left;
      border: 0;
      background: none;
      padding: 7px 8px;
      margin: 0;
      border-radius: 8px;
      font-size: 14px;
      line-height: 20px;
      color: rgb(83,100,113);
      cursor: pointer;
      font-family: inherit;
    }
    #${CONFIG.PANEL_ID} .xao-item:hover { background: rgba(0,0,0,0.05); color: rgb(15,20,25); }
    #${CONFIG.PANEL_ID} .xao-item[data-level="1"] { color: rgb(15,20,25); font-weight: 700; }
    #${CONFIG.PANEL_ID} .xao-item[data-level="2"] { padding-left: 20px; }
    #${CONFIG.PANEL_ID} .xao-item[data-level="3"] { padding-left: 30px; font-size: 13px; }
    #${CONFIG.PANEL_ID} .xao-item.xao-active {
      color: rgb(15,20,25);
      font-size: 16px;
      font-weight: 800;
    }
    @media (prefers-color-scheme: dark) {
      #${CONFIG.PANEL_ID} .xao-item:hover { background: rgba(255,255,255,0.08); color: rgb(231,233,234); }
      #${CONFIG.PANEL_ID} .xao-item.xao-active { color: rgb(231,233,234); font-size: 16px; font-weight: 800; }
      #${CONFIG.PANEL_ID} .xao-item[data-level="1"] { color: rgb(231,233,234); }
    }
    #${CONFIG.PANEL_ID} .xao-credit-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 7px 8px;
      margin: 0;
      border-radius: 8px;
      font-size: 14px;
      line-height: 20px;
      color: rgb(83,100,113);
      font-family: inherit;
    }
    #${CONFIG.PANEL_ID} .xao-credit-row:hover { background: rgba(0,0,0,0.05); color: rgb(15,20,25); }
    #${CONFIG.PANEL_ID} .xao-credit-row b { color: rgb(15,20,25); font-weight: 800; }
    @media (prefers-color-scheme: dark) {
      #${CONFIG.PANEL_ID} .xao-credit-row:hover { background: rgba(255,255,255,0.08); color: rgb(231,233,234); }
      #${CONFIG.PANEL_ID} .xao-credit-row b { color: rgb(231,233,234); }
    }
    #${CONFIG.PANEL_ID} .xao-credit-follow {
      flex-shrink: 0;
      background: rgb(15,20,25);
      color: rgb(255,255,255);
      border: 0;
      border-radius: 999px;
      padding: 4px 12px;
      font-size: 12px;
      font-weight: 700;
      line-height: 18px;
      cursor: pointer;
      text-decoration: none;
      font-family: inherit;
    }
    #${CONFIG.PANEL_ID} .xao-credit-follow:hover { opacity: 0.8; }
    @media (prefers-color-scheme: dark) {
      #${CONFIG.PANEL_ID} .xao-credit-follow { background: rgb(231,233,234); color: rgb(15,20,25); }
    }
  `;

  let outlineObs = null; // 模块级滚动高亮 observer，重建时释放

  function buildPanel(meta) {
    clearPanel();
    if (outlineObs) outlineObs.disconnect();
    if (!meta.sections.length && !meta.title) return;

    const panel = document.createElement('div');
    panel.id = CONFIG.PANEL_ID;

    let html = '<div class="xao-header"></div>';
    if (meta.title) {
      html += `<div class="xao-title">${escapeHtml(meta.title)}</div>`;
    }
    // 引导关注：作为大纲最后一个"子标题"（无卡片背景，右侧黑底白字关注按钮）
    const creditHtml =
      '<div class="xao-credit-row">' +
      `<span>由 <b>@${CONFIG.AUTHOR_HANDLE}</b> 出品</span>` +
      `<a class="xao-credit-follow" href="https://x.com/${CONFIG.AUTHOR_HANDLE}" target="_blank" rel="noopener">关注</a>` +
      '</div>';
    if (meta.sections.length) {
      html += '<div class="xao-list">';
      meta.sections.forEach((s, i) => {
        html += `<button type="button" class="xao-item" data-level="${s.level || 1}" data-idx="${i}">${escapeHtml(s.text)}</button>`;
      });
      html += creditHtml;
      html += '</div>';
    } else {
      html += creditHtml;
    }
    panel.innerHTML = html;

    mountPanel(panel);

    // 样式
    let style = document.getElementById('xao-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'xao-style';
      style.textContent = PANEL_STYLE;
      document.head.appendChild(style);
    }

    // 点击章节：瞬间跳转（无滚动动画）+ 立即高亮所点章节
    const items = panel.querySelectorAll('.xao-item');
    items.forEach((btn, i) => {
      btn.addEventListener('click', () => {
        const top =
          meta.sections[i].el.getBoundingClientRect().top + window.scrollY - CONFIG.SCROLL_OFFSET;
        window.scrollTo({ top: Math.max(top, 0), behavior: 'instant' });
        items.forEach((b) => b.classList.remove('xao-active'));
        btn.classList.add('xao-active');
      });
    });

    // 异步检测关注状态：当前用户已关注作者 → 整个引导条目都不展示（只留标题 + 大纲）
    checkFollowing().then(() => {
      if (isFollowing) {
        const credit = panel.querySelector('.xao-credit-row');
        if (credit) credit.remove();
      }
    });

    // 点击标题：跳回文章开头（标题 3 行截断，悬停可看全文）
    const titleBtn = panel.querySelector('.xao-title');
    if (titleBtn) {
      if (meta.title) titleBtn.title = meta.title;
      titleBtn.addEventListener('click', () => {
        const read = document.querySelector('[data-testid="twitterArticleReadView"]');
        if (read) {
          const top = read.getBoundingClientRect().top + window.scrollY - CONFIG.SCROLL_OFFSET;
          window.scrollTo({ top: Math.max(top, 0), behavior: 'instant' });
        }
        items.forEach((b) => b.classList.remove('xao-active'));
      });
    }

    // 滚动高亮（IntersectionObserver）
    if ('IntersectionObserver' in window && meta.sections.length > 1) {
      outlineObs = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) {
              const idx = meta.sections.findIndex((s) => s.el === en.target);
              if (idx === -1) return;
              items.forEach((b, i) => b.classList.toggle('xao-active', i === idx));
            }
          });
        },
        { rootMargin: '-15% 0px -70% 0px', threshold: 0 }
      );
      meta.sections.forEach((s) => outlineObs.observe(s.el));
    }

    return panel;
  }

  function escapeHtml(s) {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ---------- 主流程（幂等，防 MutationObserver 死循环） ----------
  let lastUrl = location.href;
  let lastMetaKey = '';   // 上次构建时的内容指纹；相同则不碰 DOM
  let scheduled = false;  // 同帧去抖

  function ensureOutline() {
    if (scheduled) return;
    scheduled = true;
    try {
      const sidebar = document.querySelector('[data-testid="sidebarColumn"]');
      const isArticle = !!document.querySelector('[data-testid="twitterArticleReadView"]');

      // 长文创作页专属处理（无 sidebar，独立于侧边栏逻辑；含 /compose/articles 下所有子页面）
      if (location.pathname.startsWith('/compose/articles')) {
        applyComposeLayout(true);
        // compose 页也需要侧边栏能力：折叠布局 + 贴左 + 折叠按钮
        applyArticleLayout(navCollapsed);
        setNavSnug(true);
        syncCollapseBtn();
        return;
      }
      applyComposeLayout(false);

      if (!sidebar) {
        // 无侧栏（移动端等）：全部恢复
        showAllCards();
        applyArticleLayout(false);
        setNavSnug(false);
        restorePrimaryColumn();
        removeCollapseBtn();
        if (document.getElementById(CONFIG.PANEL_ID)) clearPanel();
        lastMetaKey = '';
        return;
      }

      // 侧边栏修改全局生效（所有桌面 X 页面）：贴左 + 折叠图标 + 折叠能力 + 主栏调整
      applyPrimaryColumn();
      stripYe8kvj();
      undoNavSectionMiss();
      applyArticleLayout(navCollapsed);
      setNavSnug(true);
      syncCollapseBtn();

      if (isArticle) {
        // 文章页专属：右栏精简 + 大纲面板
        hideExtraCards();
        const meta = extractMeta();
        const key = JSON.stringify([meta.title, meta.sections.map((s) => s.text)]);
        if (key !== lastMetaKey) {
          lastMetaKey = key;
          buildPanel(meta);
        }
      } else {
        // 非文章页：右栏保持原生，清理大纲
        showAllCards();
        if (document.getElementById(CONFIG.PANEL_ID)) clearPanel();
        lastMetaKey = '';
      }
    } finally {
      scheduled = false;
    }
  }

  // SPA 路由变化：仅 URL 变化时清状态并等新页面渲染
  let obTimer = null;
  function onDomChange() {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      clearPanel();
      lastMetaKey = '';
      window.setTimeout(ensureOutline, 400);
      return;
    }
    // 节流：DOM 高频变化（如 compose 页加载草稿列表）合并为一次处理，
    // 避免每帧都跑全量布局处理拖累主线程导致页面卡住
    if (obTimer) return;
    obTimer = window.setTimeout(() => {
      obTimer = null;
      ensureOutline();
    }, 200);
  }

  // 监听 DOM 变化（文章内容异步渲染）。面板构建是幂等的：
  // 内容指纹未变时 ensureOutline 不产生任何 DOM 写入，循环随即终止。
  const mo = new MutationObserver(onDomChange);
  mo.observe(document.body, { childList: true, subtree: true });

  // 初始化 + 低频兜底（幂等，无副作用）
  ensureOutline();
  window.setInterval(ensureOutline, 2000);
})();
