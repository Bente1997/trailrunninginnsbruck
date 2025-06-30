document.addEventListener('DOMContentLoaded', function() {
    const initialTrigger = document.getElementById('initialWhatsappTrigger');
    const securityModal = document.getElementById('whatsappSecurityModal');
    const closeButton = document.getElementById('closeWhatsappModal');
    const answerInput = document.getElementById('whatsappAnswerInput');
    const revealButton = document.getElementById('revealWhatsappLinkBtn');
    const whatsappActualLinkDisplay = document.getElementById('whatsappActualLinkDisplay');
    const whatsappFinalLink = document.getElementById('whatsappFinalLink');

    // De daadwerkelijke WhatsApp-link
    const part1 = "https://chat.whatsapp.com/";
    const part2 = "ICT82FBZBG79QvGE2LoOCA"; // Dit is je unieke groepscode
    const fullWhatsappLink = part1 + part2;

    // 1. Wanneer de initiële WhatsApp-knop wordt geklikt
    initialTrigger.addEventListener('click', function(event) {
        event.preventDefault(); // Voorkom dat de browser naar '#' springt
        securityModal.classList.remove('hidden'); // Toon de modal
        answerInput.value = ''; // Zorg ervoor dat het invoerveld leeg is
        answerInput.placeholder = 'Your answer'; // Reset placeholder
        answerInput.classList.remove('border-red-500'); // Verwijder rode rand
        whatsappActualLinkDisplay.classList.add('hidden'); // Verberg de finale link
        revealButton.classList.remove('hidden'); // Zorg dat de knop weer zichtbaar is
        answerInput.classList.remove('hidden'); // Zorg dat input weer zichtbaar is
        
        // Verwijder eventuele eerder toegevoegde succesberichten
        const oldSuccessMessage = securityModal.querySelector('.text-green-600');
        if (oldSuccessMessage) {
            oldSuccessMessage.remove();
        }
    });

    // 2. Wanneer de "Sluiten" knop in de modal wordt geklikt
    closeButton.addEventListener('click', function() {
        securityModal.classList.add('hidden'); // Verberg de modal
    });

    // 3. Wanneer de "Toon Link" knop in de modal wordt geklikt
    revealButton.addEventListener('click', function() {
        const userAnswer = answerInput.value.trim().toLowerCase();
        
        if (userAnswer === 'tien' || userAnswer === '10') {
            whatsappFinalLink.href = fullWhatsappLink; // Voeg de href toe
            whatsappActualLinkDisplay.classList.remove('hidden'); // Maak de finale link zichtbaar
            answerInput.classList.add('hidden'); // Verberg het invoerveld
            revealButton.classList.add('hidden'); // Verberg de knop
            
            // Voeg een bevestigingsbericht toe
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