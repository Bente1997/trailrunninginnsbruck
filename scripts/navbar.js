document.addEventListener('DOMContentLoaded', function () {
  // --- Mobiele hoofdmenu toggle ---
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

  // --- Desktop Dropdown voor Communities ---
  const communitiesDropdownButton = document.getElementById('communities-dropdown-button');
  const communitiesDropdownMenu = document.getElementById('communities-dropdown-menu');

  // De desktop-versie heeft een hover-effect via Tailwind's `group-hover:block`
  // dus een click-functionaliteit is hier optioneel en kan conflicteren met hover.
  // Ik laat de click functionaliteit hieronder staan, mocht je deze toch willen,
  // maar als je puur op hover wilt, kun je dit deel verwijderen.
  if (communitiesDropdownButton && communitiesDropdownMenu) {
    communitiesDropdownButton.addEventListener('click', (event) => {
      // Voorkom dat de klik onmiddellijk het menu sluit als gevolg van de document click listener
      event.stopPropagation();
      const isExpanded = communitiesDropdownButton.getAttribute('aria-expanded') === 'true';
      communitiesDropdownButton.setAttribute('aria-expanded', !isExpanded);
      communitiesDropdownMenu.classList.toggle('hidden', isExpanded);
    });

    // Sluit de dropdown bij klikken buiten de dropdown of knop
    document.addEventListener('click', (event) => {
      if (!communitiesDropdownButton.contains(event.target) && !communitiesDropdownMenu.contains(event.target)) {
        communitiesDropdownMenu.classList.add('hidden');
        communitiesDropdownButton.setAttribute('aria-expanded', 'false');
      }
    });
  }


  // --- Mobiele Dropdown voor Communities ---
  const mobileCommunitiesDropdownButton = document.getElementById('mobile-communities-dropdown-button');
  const mobileCommunitiesDropdownMenu = document.getElementById('mobile-communities-dropdown-menu');

  if (mobileCommunitiesDropdownButton && mobileCommunitiesDropdownMenu) {
    mobileCommunitiesDropdownButton.addEventListener('click', () => {
      const isExpanded = mobileCommunitiesDropdownButton.getAttribute('aria-expanded') === 'true';
      mobileCommunitiesDropdownButton.setAttribute('aria-expanded', !isExpanded);
      mobileCommunitiesDropdownMenu.classList.toggle('hidden', isExpanded);
    });
  }
}); // Sluiting van de DOMContentLoaded function()