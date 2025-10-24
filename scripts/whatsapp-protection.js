document.addEventListener('DOMContentLoaded', function() {
    const whatsappTriggers = document.querySelectorAll('[data-whatsapp-trigger="true"]');
    const securityModal = document.getElementById('whatsappSecurityModal');
    const closeButton = document.getElementById('closeWhatsappModal');
    const answerInput = document.getElementById('whatsappAnswerInput');
    const revealButton = document.getElementById('revealWhatsappLinkBtn');
    const whatsappActualLinkDisplay = document.getElementById('whatsappActualLinkDisplay');
    const whatsappFinalLink = document.getElementById('whatsappFinalLink');
    const overlayBackdrop = securityModal ? securityModal.querySelector('[data-whatsapp-overlay-backdrop]') : null;
    const body = document.body;

    if (!securityModal || !closeButton || !answerInput || !revealButton || !whatsappActualLinkDisplay || !whatsappFinalLink) {
        return;
    }

    // De daadwerkelijke WhatsApp-link
    const part1 = "https://chat.whatsapp.com/";
    const part2 = "ICT82FBZBG79QvGE2LoOCA"; // Dit is je unieke groepscode
    const fullWhatsappLink = part1 + part2;

    function resetModalState() {
        answerInput.value = '';
        answerInput.placeholder = 'Your answer';
        answerInput.classList.remove('border-red-500', 'hidden');
        whatsappActualLinkDisplay.classList.add('hidden');
        revealButton.classList.remove('hidden');

        const oldSuccessMessage = securityModal.querySelector('.text-green-600');
        if (oldSuccessMessage) {
            oldSuccessMessage.remove();
        }
    }

    function openWhatsappModal() {
        resetModalState();
        securityModal.classList.remove('hidden');
        body.classList.add('overflow-hidden');
        answerInput.focus();
    }

    function closeWhatsappModal() {
        securityModal.classList.add('hidden');
        body.classList.remove('overflow-hidden');
    }

    // 1. Wanneer een WhatsApp-triggerknop wordt geklikt
    whatsappTriggers.forEach(function(trigger) {
        trigger.addEventListener('click', function(event) {
            event.preventDefault();
            openWhatsappModal();
        });
    });

    // 2. Wanneer de "Sluiten" knop in de modal wordt geklikt
    closeButton.addEventListener('click', function() {
        closeWhatsappModal();
    });

    if (overlayBackdrop) {
        overlayBackdrop.addEventListener('click', closeWhatsappModal);
    }

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && !securityModal.classList.contains('hidden')) {
            closeWhatsappModal();
        }
    });

    // 3. Wanneer de "Toon Link" knop in de modal wordt geklikt
    revealButton.addEventListener('click', function() {
        const userAnswer = answerInput.value.trim().toLowerCase();
        
        if (userAnswer === 'tien' || userAnswer === '10') {
            whatsappFinalLink.href = fullWhatsappLink;
            whatsappActualLinkDisplay.classList.remove('hidden');
            answerInput.classList.add('hidden');
            revealButton.classList.add('hidden');

            const successMessage = document.createElement('p');
            successMessage.className = 'mt-2 text-green-600';
            successMessage.textContent = 'Correct answer! You can now join the Whatsapp group.';
            whatsappActualLinkDisplay.parentNode.insertBefore(successMessage, whatsappActualLinkDisplay);
        } else {
            answerInput.value = '';
            answerInput.placeholder = 'Wrong answer. Try again!';
            answerInput.classList.add('border-red-500');
            setTimeout(() => {
                answerInput.classList.remove('border-red-500');
                answerInput.placeholder = 'Your answer';
            }, 2000);
        }
    });

    // 4. Optioneel: activeer de knop ook bij Enter in het invoerveld
    answerInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            revealButton.click();
        }
    });
});
