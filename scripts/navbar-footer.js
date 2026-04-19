/**
 * DNA Trails - Global UI Components
 * Handles Navbar, Footer and WhatsApp Security Modal
 */

async function initGlobalComponents() {
    try {
        const [navRes, footerRes] = await Promise.all([
            fetch('/components/navbar.html'),
            fetch('/components/footer.html')
        ]);

        if (navRes.ok) {
            document.getElementById('navbar-placeholder').innerHTML = await navRes.text();
            initMobileMenu(); 
        }

        if (footerRes.ok) {
            document.getElementById('footer-placeholder').innerHTML = await footerRes.text();
            // Nadat de footer is geladen, initialiseren we de modal logica
            initWhatsappLogic(); 
        }
    } catch (err) {
        console.error("Global Components Error:", err);
    }
}

function initMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const menu = document.querySelector('.mobile-menu');
    if (toggle && menu) {
        toggle.onclick = (e) => {
            e.preventDefault();
            menu.classList.toggle('active');
            toggle.classList.toggle('active');
        };
    }
}

function initWhatsappLogic() {
    const modal = document.getElementById('whatsappSecurityModal');
    const closeBtn = document.getElementById('closeWhatsappModal');
    const revealBtn = document.getElementById('revealWhatsappLinkBtn');
    const input = document.getElementById('whatsappAnswerInput');
    const linkDisplay = document.getElementById('whatsappActualLinkDisplay');
    const finalLink = document.getElementById('whatsappFinalLink');
    const backdrop = document.querySelector('[data-whatsapp-overlay-backdrop]');

    // Zoek naar ALLE triggers (zowel de sticky button als die in de footer)
    const triggers = document.querySelectorAll('[data-whatsapp-trigger="true"], #stickyWhatsappTrigger, #initialWhatsappTrigger');

    if (!modal || triggers.length === 0) return;

    // Open modal voor elke gevonden trigger
    triggers.forEach(trigger => {
        trigger.onclick = (e) => {
            e.preventDefault();
            modal.classList.remove('hidden');
            input.focus();
        };
    });

    const closeModal = () => {
        modal.classList.add('hidden');
        if (input) input.value = '';
        if (linkDisplay) linkDisplay.classList.add('hidden');
    };

    if (closeBtn) closeBtn.onclick = closeModal;
    if (backdrop) backdrop.onclick = closeModal;

    if (revealBtn) {
        revealBtn.onclick = () => {
            // De bot-check: 25 - 15 = 10
            if (input.value.trim() === '10') {
                finalLink.href = "https://chat.whatsapp.com/ICT82FBZBG79QvGE2LoOCA";
                linkDisplay.classList.remove('hidden');
            } else {
                alert("Not quite! Try the math again.");
                input.value = '';
            }
        };
    }

    // Enter-toets ondersteuning voor het input veld
    input.onkeypress = (e) => {
        if (e.key === 'Enter') revealBtn.click();
    };
}

document.addEventListener('DOMContentLoaded', initGlobalComponents);