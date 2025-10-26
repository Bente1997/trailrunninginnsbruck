 const communitiesItem = document.querySelector('.communities-item');
  const communitiesTrigger = document.querySelector('.communities-trigger');
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileCommunityToggle = document.querySelector('.mobile-communities-toggle');
  const mobileMegaMenu = document.querySelector('.mobile-mega-menu');

  // ---- Communities dropdown (only if it exists) ----
  if (communitiesItem && communitiesTrigger) {
    communitiesTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      communitiesItem.classList.toggle('active');
      console.log('Communities clicked, active:', communitiesItem.classList.contains('active'));
    });

    // Close mega menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!communitiesItem.contains(e.target)) {
        communitiesItem.classList.remove('active');
      }
    });
  }

  // ---- Mobile menu toggle ----
  if (mobileMenuToggle && mobileMenu) {
    mobileMenuToggle.addEventListener('click', () => {
      mobileMenuToggle.classList.toggle('active');
      mobileMenu.classList.toggle('active');
    });
  }

  // ---- Mobile communities dropdown ----
  if (mobileCommunityToggle && mobileMegaMenu) {
    mobileCommunityToggle.addEventListener('click', () => {
      mobileCommunityToggle.classList.toggle('active');
      mobileMegaMenu.classList.toggle('active');
    });
  }

  // ---- Close mobile menu when clicking links ----
  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenuToggle?.classList.remove('active');
      mobileMenu?.classList.remove('active');
      mobileCommunityToggle?.classList.remove('active');
      mobileMegaMenu?.classList.remove('active');
    });
  });
