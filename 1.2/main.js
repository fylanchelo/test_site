// Без JavaScript мобильная навигация остаётся видимой.
    const menuButton = document.querySelector('.menu-toggle');
    const navigation = document.querySelector('.navigation');
    const header = document.querySelector('.site-header');
    const headerInner = document.querySelector('.header-inner');
    const navigationLinks = [...navigation.querySelectorAll('a[href^="#"]')];
    const navigationSections = navigationLinks.map((link) => document.getElementById(link.hash.slice(1)));
    const mobileViewport = window.matchMedia('(max-width: 760px)');
    let updatePending = false;

    function setMenuOpen(isOpen, restoreFocus = false) {
      const open = isOpen && mobileViewport.matches;
      navigation.classList.toggle('is-open', open);
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
      if (!open && restoreFocus && mobileViewport.matches) menuButton.focus();
    }

    function setCurrentSection(sectionId) {
      navigationLinks.forEach((link) => {
        if (link.hash === '#' + sectionId) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }

    function updatePagePosition() {
      updatePending = false;
      const headerHeight = header.getBoundingClientRect().height;
      document.documentElement.style.setProperty('--header-height', headerHeight + 'px');
      let currentSection = '';
      navigationSections.forEach((section) => {
        if (section.getBoundingClientRect().top <= headerHeight + 24) currentSection = section.id;
      });
      // Последний раздел может быть ниже порога даже после прокрутки до самого низа.
      if (window.scrollY > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) {
        currentSection = navigationSections[navigationSections.length - 1].id;
      }
      setCurrentSection(currentSection);
    }

    function schedulePositionUpdate() {
      if (!updatePending) {
        updatePending = true;
        window.requestAnimationFrame(updatePagePosition);
      }
    }

    menuButton.addEventListener('click', () => {
      setMenuOpen(menuButton.getAttribute('aria-expanded') !== 'true');
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
        event.preventDefault();
        setMenuOpen(false, true);
      }
    });
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href^="#"]');
      const regularClick = event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;
      if (link && regularClick && !event.defaultPrevented) {
        const destination = document.getElementById(link.hash.slice(1));
        if (destination) {
          setMenuOpen(false);
          // Сохраняем обычный переход по якорю и историю, но убираем фокус из скрытого меню.
          destination.focus({ preventScroll: true });
          setCurrentSection(destination.id);
        }
      } else if (!headerInner.contains(event.target)) {
        setMenuOpen(false, navigation.contains(document.activeElement));
      }
    });
    document.addEventListener('focusin', (event) => {
      if (!headerInner.contains(event.target)) setMenuOpen(false);
    });
    mobileViewport.addEventListener('change', (event) => {
      const navigationHadFocus = navigation.contains(document.activeElement);
      const toggleHadFocus = document.activeElement === menuButton;
      setMenuOpen(false);
      if (event.matches && navigationHadFocus) menuButton.focus();
      else if (!event.matches && toggleHadFocus) {
        const currentLink = navigationLinks.find((link) => link.hasAttribute('aria-current'));
        (currentLink || navigationLinks[0]).focus();
      }
      schedulePositionUpdate();
    });
    window.addEventListener('scroll', schedulePositionUpdate, { passive: true });
    window.addEventListener('resize', schedulePositionUpdate);
    window.addEventListener('hashchange', schedulePositionUpdate);
    if ('ResizeObserver' in window) new ResizeObserver(schedulePositionUpdate).observe(header);
    document.documentElement.classList.add('js');
    updatePagePosition();
