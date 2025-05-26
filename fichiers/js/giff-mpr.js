document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURATION ET INITIALISATION FIREBASE ---
    const firebaseConfig = {
        apiKey: "AIzaSyCfm_Rq_lma5JVsWRt_qLxpUvgEQ4I6k5g", // Remplacez par votre clé réelle
        authDomain: "giffmpr-test.firebaseapp.com",
        databaseURL: "https://giffmpr-test-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: "giffmpr-test",
        storageBucket: "giffmpr-test.firebasestorage.app",
        messagingSenderId: "348590054088",
        appId: "1:348590054088:web:22639eeebdb6ea4050a3fd",
        measurementId: "G-FNH1VZRJ34"
    };
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();

    // --- SÉLECTEURS D'ÉLÉMENTS ---
    const topLoginBtn = document.getElementById('top-login-btn');
    const adminOnlyTabs = document.querySelectorAll('.admin-only');
    const headerPersonnelControls = document.getElementById('header-personnel-controls');
    const headerCalendarControls = document.getElementById('header-calendar-controls');
    const headerStatsControls = document.getElementById('header-stats-controls'); // Assurez-vous que cet ID existe dans le HTML
    const personnelView = document.getElementById('personnel-view');
    const calendarView = document.getElementById('calendar-view');
    const statsView = document.getElementById('stats-view'); // Assurez-vous que cet ID existe dans le HTML
    const personnelList = document.getElementById('personnel-list');
    const statsList = document.getElementById('stats-list'); // Assurez-vous que cet ID existe dans le HTML de la vue stats
    const addPersonnelBtn = document.getElementById('add-personnel-btn');
    const searchInput = document.getElementById('searchInput');
    const filterInput = document.getElementById('filterInput');
    const statsSearchInput = document.getElementById('statsSearchInput'); // Assurez-vous que cet ID existe dans le HTML
    const statsFilterInput = document.getElementById('statsFilterInput'); // Assurez-vous que cet ID existe dans le HTML
    const personnelModal = document.getElementById('personnel-modal');
    const confirmModal = document.getElementById('confirm-modal');
    const closeButton = document.querySelector('#personnel-modal .close-button');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
    const personnelForm = document.getElementById('personnel-form');
    const modalTitle = document.getElementById('modal-title');
    const submitBtn = document.getElementById('submit-btn');
    const personnelIdInput = document.getElementById('personnel-id');
    const navItems = document.querySelectorAll(".navigation .list");
    const navUl = document.querySelector(".navigation ul");
    const indicator = document.querySelector(".navigation .indicator");
    const settingsView = document.getElementById('settings-view');
    const deadlineInput = document.getElementById('deadline-input');
    const saveDeadlineBtn = document.getElementById('save-deadline-btn');
    const deadlineMessage = document.getElementById('deadline-message');
    const customPromptModal = document.getElementById('custom-prompt-modal');
    const customPasswordInput = document.getElementById('custom-password-input');
    const customPromptOkBtn = document.getElementById('custom-prompt-ok-btn');
    const customPromptCancelBtn = document.getElementById('custom-prompt-cancel-btn');
    const resetAllDataBtn = document.getElementById('reset-all-data-btn');

    // --- NOUVEAU: Sélecteurs pour la modale de matricule ---
    const matriculeConfirmModal = document.getElementById('matricule-confirm-modal');
    const matriculeInput = document.getElementById('matricule-input');
    const matriculeOkBtn = document.getElementById('matricule-ok-btn');
    const matriculeCancelBtn = document.getElementById('matricule-cancel-btn');


    // --- SÉLECTEURS CALENDRIER DISPONIBILITÉS (Spécifiques) ---
    const calendarDaysContainer = document.querySelector('#calendar-view .calendar-days');
    const calendarMonthPicker = document.querySelector('#calendar-view #month-picker');
    const calendarYearHeader = document.querySelector('#calendar-view #year');
    const calendarMonthList = document.querySelector('#calendar-view .month-list');
    const calendarPreYearBtn = document.querySelector('#calendar-view #pre-year');
    const calendarNextYearBtn = document.querySelector('#calendar-view #next-year');
    const dispoDayText = document.querySelector('#calendar-view .day-text-formate');
    const dispoTimeText = document.querySelector('#calendar-view .time-formate');
    const dispoDateText = document.querySelector('#calendar-view .date-formate');
    const calendarPersonnelSelector = document.getElementById('calendar-personnel-selector');
    const calendarSearchInput = document.getElementById('calendar-search-input');
    const calendarSearchResults = document.getElementById('calendar-search-results');
    const selectedPersonnelName = document.getElementById('selected-personnel-name');
    const deselectPersonnelBtn = document.getElementById('deselect-personnel-btn');

    // --- SÉLECTEURS VUE ÉQUIPES ---
    const teamsView = document.getElementById('teams-view');
    const teamsCalendarDaysContainer = document.getElementById('teams-calendar-days');
    const generatedTeamsContainer = document.getElementById('generated-teams-container');
    const potentialReplacementsContainer = document.getElementById('potential-replacements-container');
    const eventTypeModal = document.getElementById('event-type-modal');
    const eventTypeForm = document.getElementById('event-type-form');
    const eventModalTitle = document.getElementById('event-modal-title');
    const eventDateInput = document.getElementById('event-date');
    const eventCancelBtn = document.getElementById('event-cancel-btn');

    // --- SÉLECTEURS MODALE DE REMPLACEMENT ---
    const replacePersonnelModal = document.getElementById('replace-personnel-modal');
    const replaceModalTitle = document.getElementById('replace-modal-title');
    const roleToReplaceEl = document.getElementById('role-to-replace');
    const replacementOptionsContainer = document.getElementById('replacement-options-container');
    const replaceCancelBtn = document.getElementById('replace-cancel-btn');
    if (replacePersonnelModal) replacePersonnelModal.querySelector('.close-button').addEventListener('click', () => closeModal(replacePersonnelModal));
    if (replaceCancelBtn) replaceCancelBtn.addEventListener('click', () => closeModal(replacePersonnelModal));


    // --- ÉTAT GLOBAL ---
    let allPersonnel = {};
    let allAvailabilities = {};
    let allEvents = {};
    let allAssignedTeams = {}; // Pour stocker les équipes figées/manuelles
    let selectedPersonnel = null;
    let isAdmin = false;
    let availabilityDeadline = null;
    let selectedTeamDate = null; // Utilisé pour la vue Équipes
    let currentReplacementInfo = {}; // Pour stocker les infos lors d'un remplacement
    let currentWorkingTeam = null; // Pour stocker l'équipe en cours de modification (figée ou non)
    let matriculeSessionAuth = {}; // NOUVEAU: Pour stocker les authentifications par matricule de la session

    // --- FONCTIONS UTILITAIRES (showMessage, showCustomPrompt, showGenericConfirmModal) ---
    function showMessage(message, type) {
        const messageContainer = document.createElement('div');
        messageContainer.className = `message-container ${type}`;
        messageContainer.innerHTML = `<h3>${type === 'success' ? 'Succès' : type === 'error' ? 'Erreur' : 'Attention'}</h3><p>${message}</p>`;
        document.body.appendChild(messageContainer);
        messageContainer.classList.add('show');
        setTimeout(() => {
            messageContainer.classList.remove('show');
            setTimeout(() => { if (document.body.contains(messageContainer)) { document.body.removeChild(messageContainer); } }, 500);
        }, 3000);
    }
    function showCustomPrompt(message, callback) {
        const modal = document.getElementById('custom-prompt-modal');
        const passwordInput = document.getElementById('custom-password-input');
        const okBtn = document.getElementById('custom-prompt-ok-btn');
        const cancelBtn = document.getElementById('custom-prompt-cancel-btn');
        const modalParagraph = modal.querySelector('p');
        if (modalParagraph) modalParagraph.textContent = message;
        passwordInput.value = '';
        modal.classList.add('visible');
        okBtn.onclick = () => { modal.classList.remove('visible'); callback(passwordInput.value); };
        cancelBtn.onclick = () => { modal.classList.remove('visible'); callback(null); };
        passwordInput.focus();
    }
    const genericConfirmModal = document.createElement('div');
    genericConfirmModal.className = 'modal';
    genericConfirmModal.id = 'generic-confirm-modal';
    genericConfirmModal.innerHTML = `<div class="modal-content"><h4 class="modal-title-confirm" id="generic-confirm-title">Confirmation requise</h4><p id="generic-confirm-message">Êtes-vous sûr ?</p><div class="modal-actions"><button id="generic-confirm-cancel-btn" class="btn-secondary">Annuler</button><button id="generic-confirm-ok-btn" class="btn-danger">Confirmer</button></div></div>`;
    document.body.appendChild(genericConfirmModal);
    const genericConfirmTitleEl = document.getElementById('generic-confirm-title');
    const genericConfirmMessageEl = document.getElementById('generic-confirm-message');
    const genericConfirmOkBtn = document.getElementById('generic-confirm-ok-btn');
    const genericConfirmCancelBtn = document.getElementById('generic-confirm-cancel-btn');

    function showGenericConfirmModal(message, onConfirm, onCancel, title = "Confirmation requise", okButtonClass = "btn-danger", okButtonText = "Confirmer") {
        genericConfirmTitleEl.textContent = title;
        genericConfirmMessageEl.innerHTML = message;
        genericConfirmOkBtn.className = 'btn-primary'; // Clear existing classes
        okButtonClass.split(' ').forEach(cls => { if (cls) genericConfirmOkBtn.classList.add(cls); });
        genericConfirmOkBtn.textContent = okButtonText;
        genericConfirmModal.classList.add('visible');

        genericConfirmOkBtn.currentOnConfirm = onConfirm;
        genericConfirmCancelBtn.currentOnCancel = onCancel;

        genericConfirmOkBtn.onclick = () => {
            closeModal(genericConfirmModal);
            if (genericConfirmOkBtn.currentOnConfirm) genericConfirmOkBtn.currentOnConfirm();
        };
        genericConfirmCancelBtn.onclick = () => {
            closeModal(genericConfirmModal);
            if (genericConfirmCancelBtn.currentOnCancel) genericConfirmCancelBtn.currentOnCancel();
        };
        genericConfirmModal.onclick = (e) => {
            if (e.target === genericConfirmModal) {
                closeModal(genericConfirmModal);
                if (genericConfirmCancelBtn.currentOnCancel) genericConfirmCancelBtn.currentOnCancel();
            }
        };
    }


    // --- LOGIQUE DE NAVIGATION ---
    function moveIndicator(element) {
        if (!element || !indicator) return;
        setTimeout(() => {
            const E_width = element.offsetWidth;
            const E_left = element.offsetLeft;
            const i_width = indicator.offsetWidth;
            const newX = (E_width / 2 - i_width / 2) + E_left;
            navUl.style.setProperty("--indicator-x-pos", `${newX}px`);
            navUl.classList.add("indicator-ready");
            const shockwave = indicator.querySelector(".shockwave") || document.createElement("div");
            shockwave.className = "shockwave";
            indicator.innerHTML = "";
            indicator.appendChild(shockwave);
            const icon = element.querySelector(".icon ion-icon");
            if (icon) indicator.appendChild(icon.cloneNode(true));
            indicator.classList.remove("landed");
        }, 50);
    }

    // --- GESTION DE L'AUTHENTIFICATION ET DE L'UI ---
    const ADMIN_PASSWORD = "Aspf66220*";
    function updateAdminUI() {
        const loginIcon = topLoginBtn.querySelector('ion-icon');
        const currentlyActiveTab = document.querySelector('.navigation .list.active');
        if (isAdmin) {
            adminOnlyTabs.forEach(tab => tab.style.display = 'list-item');
            loginIcon.setAttribute('name', 'log-out-outline');
            topLoginBtn.setAttribute('title', 'Déconnexion');
            if (currentlyActiveTab) moveIndicator(currentlyActiveTab);
        } else {
            adminOnlyTabs.forEach(tab => tab.style.display = 'none');
            loginIcon.setAttribute('name', 'log-in-outline');
            topLoginBtn.setAttribute('title', 'Connexion');
            if (currentlyActiveTab && currentlyActiveTab.classList.contains('admin-only')) {
                setActiveTab(navItems[0]);
            } else if (currentlyActiveTab) {
                moveIndicator(currentlyActiveTab);
            }
        }
    }
    topLoginBtn.addEventListener('click', () => {
        if (isAdmin) {
            isAdmin = false;
            sessionStorage.removeItem('isAdmin');
            matriculeSessionAuth = {}; // Réinitialiser l'authentification matricule
            showMessage('Vous avez été déconnecté.', 'warning');
            updateAdminUI();
            const activeTab = document.querySelector('.navigation .list.active');
            if (activeTab) updateActiveView(activeTab);
        } else {
            showCustomPrompt("Veuillez entrer le mot de passe administrateur :", (password) => {
                if (password === ADMIN_PASSWORD) {
                    isAdmin = true;
                    sessionStorage.setItem('isAdmin', 'true');
                    matriculeSessionAuth = {}; // Réinitialiser l'authentification matricule
                    showMessage('Connexion réussie !', 'success');
                    updateAdminUI();
                    const activeTab = document.querySelector('.navigation .list.active');
                    if (activeTab) updateActiveView(activeTab);
                } else if (password !== null) {
                    showMessage('Mot de passe incorrect.', 'error');
                }
            });
        }
    });
    if (sessionStorage.getItem('isAdmin') === 'true') { isAdmin = true; }

    // --- GESTION DE LA DATE LIMITE ---
    const deadlineRef = database.ref('config/deadline');
    saveDeadlineBtn.addEventListener('click', () => {
        if (!isAdmin) return;
        const newDeadline = deadlineInput.value;
        deadlineRef.set(newDeadline || null).then(() => showMessage('Date et heure limites enregistrées !', 'success')).catch(err => showMessage('Erreur: ' + err.message, 'error'));
    });
    deadlineRef.on('value', (snapshot) => {
        availabilityDeadline = snapshot.val();
        if (availabilityDeadline) {
            deadlineInput.value = availabilityDeadline;
            const dateObj = new Date(availabilityDeadline);
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            const formattedDate = new Intl.DateTimeFormat('fr-FR', options).format(dateObj);
            deadlineMessage.innerHTML = `Date et heure limites pour la saisie : <strong>${formattedDate}</strong>`;
            deadlineMessage.style.display = 'block';
        } else {
            deadlineMessage.style.display = 'none';
            deadlineInput.value = '';
        }
    });

    // --- FONCTIONS UTILITAIRES ET GESTION MODALS ---
    const toBase64 = (str) => str ? btoa(unescape(encodeURIComponent(str))) : "";
    const fromBase64 = (str) => str ? decodeURIComponent(escape(atob(str))) : "";
    const openModal = (modal) => modal.classList.add('visible');
    const closeModal = (modal) => modal.classList.remove('visible');

    addPersonnelBtn.addEventListener('click', () => {
        if (!isAdmin) return;
        personnelForm.reset();
        personnelIdInput.value = '';
        modalTitle.textContent = 'Ajouter du Personnel';
        submitBtn.textContent = 'Ajouter';
        openModal(personnelModal);
    });
    if (closeButton) closeButton.addEventListener('click', () => closeModal(personnelModal));
    if (confirmCancelBtn) confirmCancelBtn.addEventListener('click', () => closeModal(confirmModal));
    if (eventTypeModal) eventTypeModal.querySelector('.close-button').addEventListener('click', () => closeModal(eventTypeModal));
    if (eventCancelBtn) eventCancelBtn.addEventListener('click', () => closeModal(eventTypeModal));
    if (customPromptCancelBtn) customPromptCancelBtn.addEventListener('click', () => closeModal(customPromptModal));
    if (matriculeCancelBtn) matriculeCancelBtn.addEventListener('click', () => closeModal(matriculeConfirmModal));

    window.addEventListener('click', (e) => {
        if (e.target === personnelModal) closeModal(personnelModal);
        if (e.target === confirmModal) closeModal(confirmModal);
        if (e.target === eventTypeModal) closeModal(eventTypeModal);
        if (e.target === customPromptModal) closeModal(customPromptModal);
        if (e.target === matriculeConfirmModal) closeModal(matriculeConfirmModal);
        if (replacePersonnelModal && e.target === replacePersonnelModal) closeModal(replacePersonnelModal);
        if (genericConfirmModal && e.target === genericConfirmModal) {
             closeModal(genericConfirmModal);
             if (genericConfirmCancelBtn.currentOnCancel) genericConfirmCancelBtn.currentOnCancel();
        }
    });

    // --- LOGIQUE DE GESTION DU PERSONNEL ---
    personnelForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!isAdmin) return;
        const matriculeValue = document.getElementById('matricule').value;
        if (!/^\d{3,6}$/.test(matriculeValue)) {
            showMessage('Le matricule doit contenir entre 3 et 6 chiffres.', 'error');
            return;
        }
        const personnelData = {
            nom: toBase64(document.getElementById('nom').value),
            prenom: toBase64(document.getElementById('prenom').value),
            matricule: toBase64(matriculeValue),
            commentaire: toBase64(document.getElementById('commentaire').value),
            fonctions: Array.from(document.querySelectorAll('input[name="fonctions"]:checked')).map(el => toBase64(el.value))
        };
        const id = personnelIdInput.value;
        const dbRef = id ? database.ref('personnel/' + id) : database.ref('personnel').push();
        dbRef.update(personnelData).then(() => { closeModal(personnelModal); showMessage(id ? 'Personnel modifié !' : 'Personnel ajouté !', 'success'); }).catch(err => showMessage('Erreur: ' + err.message, 'error'));
    });

    const renderPersonnel = (personnelDataToRender) => {
        if (!personnelList) return;
        personnelList.innerHTML = '';
        const searchTerm = searchInput.value.toLowerCase();
        const filterTerm = filterInput.value;

        for (const id in personnelDataToRender) {
            const pData = personnelDataToRender[id];
            const p = {
                id: id,
                nom: fromBase64(pData.nom),
                prenom: fromBase64(pData.prenom),
                matricule: fromBase64(pData.matricule || ""),
                commentaire: fromBase64(pData.commentaire || ""),
                fonctions: pData.fonctions ? pData.fonctions.map(f => fromBase64(f)) : []
            };
            const fullName = `${p.prenom} ${p.nom}`;
            const initials = `${p.prenom.charAt(0)}${p.nom.charAt(0)}`.toUpperCase();

            const matriculeBlock = p.matricule ? `<div class="info-block"><ion-icon name="keypad-outline"></ion-icon><span>Matricule: ******</span></div>` : '<div class="info-block"><ion-icon name="alert-circle-outline"></ion-icon><span>Pas de matricule</span></div>';

            const functionsBlock = p.fonctions.length > 0 ? p.fonctions.map(func => `<div class="info-block"><ion-icon name="shield-half-outline"></ion-icon><span>${func.replace(/ \(.+\)/, '')}</span></div>`).join('') : '<div class="info-block"><ion-icon name="shield-half-outline"></ion-icon><span>Aucune fonction</span></div>';
            if ((fullName.toLowerCase().includes(searchTerm)) && (filterTerm === '' || p.fonctions.includes(filterTerm))) {
                const card = document.createElement('div');
                card.className = 'personnel-card';
                card.innerHTML = `<div class="personnel-avatar">${initials}</div><div class="personnel-info"><h3>${fullName}</h3>${matriculeBlock}${functionsBlock}${p.commentaire ? `<div class="info-block"><ion-icon name="chatbox-ellipses-outline"></ion-icon><span>${p.commentaire}</span></div>` : ''}</div><div class="personnel-actions"><button class="action-btn edit-btn" data-id="${p.id}"><ion-icon name="pencil-outline"></ion-icon></button><button class="action-btn delete-btn" data-id="${p.id}"><ion-icon name="trash-outline"></ion-icon></button></div>`;
                personnelList.appendChild(card);
            }
        }
    };
    database.ref('personnel').on('value', (snapshot) => {
        allPersonnel = snapshot.val() || {};
        if (personnelView.classList.contains('visible')) {
            renderPersonnel(allPersonnel);
        }
        if (teamsView.classList.contains('visible') && selectedTeamDate) {
            generateAndDisplayTeams(selectedTeamDate);
        }
        if (statsView && statsView.classList.contains('visible')) {
            renderStatistics();
        }
    });

    personnelList.addEventListener('click', (e) => {
        if (!isAdmin) return;
        const target = e.target.closest('.action-btn'); if (!target) return; const id = target.dataset.id;
        if (target.classList.contains('delete-btn')) { confirmDeleteBtn.dataset.id = id; document.getElementById('confirm-message').textContent = "Êtes-vous sûr de vouloir supprimer ce personnel ? Cette action est irréversible."; openModal(confirmModal); }
        if (target.classList.contains('edit-btn')) {
            database.ref('personnel/' + id).once('value', (snapshot) => {
                const data = snapshot.val();
                document.getElementById('nom').value = fromBase64(data.nom); document.getElementById('prenom').value = fromBase64(data.prenom); document.getElementById('commentaire').value = fromBase64(data.commentaire || "");
                document.getElementById('matricule').value = fromBase64(data.matricule || "");
                document.querySelectorAll('input[name="fonctions"]').forEach(cb => cb.checked = false);
                if (data.fonctions) { data.fonctions.map(f => fromBase64(f)).forEach(func => { const checkbox = document.querySelector(`#personnel-form input[value="${func}"]`); if (checkbox) checkbox.checked = true; }); }
                personnelIdInput.value = id; modalTitle.textContent = 'Modifier le Personnel'; submitBtn.textContent = 'Modifier'; openModal(personnelModal);
            });
        }
    });
    confirmDeleteBtn.addEventListener('click', () => {
        if (!isAdmin) return;
        const idToDelete = confirmDeleteBtn.dataset.id;
        if (idToDelete) { database.ref('personnel/' + idToDelete).remove().then(() => showMessage('Personnel supprimé.', 'success')); closeModal(confirmModal); }
    });
    if (searchInput) searchInput.addEventListener('input', () => renderPersonnel(allPersonnel));
    if (filterInput) filterInput.addEventListener('change', () => renderPersonnel(allPersonnel));
    calendarSearchInput.addEventListener('input', () => {
        const searchTerm = calendarSearchInput.value.toLowerCase();
        calendarSearchResults.innerHTML = '';
        if (searchTerm.length === 0) return;
        for (const id in allPersonnel) {
            const p = { id: id, nom: fromBase64(allPersonnel[id].nom), prenom: fromBase64(allPersonnel[id].prenom) };
            const fullName = `${p.prenom} ${p.nom}`;
            if (fullName.toLowerCase().includes(searchTerm)) {
                const item = document.createElement('div');
                item.className = 'search-result-item';
                item.textContent = fullName;
                item.dataset.id = p.id;
                item.addEventListener('click', () => {
                    matriculeSessionAuth = {}; // MODIFIÉ: Réinitialiser l'auth à chaque changement de personne
                    selectedPersonnel = { id: p.id, nom: p.nom, prenom: p.prenom };
                    selectedPersonnelName.textContent = `${p.prenom} ${p.nom}`;
                    calendarPersonnelSelector.classList.add('person-selected');
                    calendarSearchInput.value = '';
                    calendarSearchResults.innerHTML = '';
                    generateCalendar(currentMonth.value, currentYear.value);
                });
                calendarSearchResults.appendChild(item);
            }
        }
    });
    deselectPersonnelBtn.addEventListener('click', () => {
        selectedPersonnel = null;
        matriculeSessionAuth = {}; // MODIFIÉ: Réinitialiser l'auth lors de la déselection
        selectedPersonnelName.textContent = 'Aucun';
        calendarPersonnelSelector.classList.remove('person-selected');
        generateCalendar(currentMonth.value, currentYear.value);
    });

    // --- LOGIQUE DE NAVIGATION (Mise à jour) ---
    function updateActiveView(activeItem) {
        document.querySelectorAll('.view-container').forEach(v => v.classList.remove('visible'));
        document.querySelectorAll('.header-controls').forEach(c => c.style.display = 'none');
        addPersonnelBtn.classList.remove('visible');

        const activeTabText = activeItem.querySelector('.text b').textContent.trim();

        if (activeTabText === 'Gestion Personnels' && isAdmin) {
            personnelView.classList.add('visible');
            addPersonnelBtn.classList.add('visible');
            headerPersonnelControls.style.display = 'flex';
            renderPersonnel(allPersonnel);
        } else if (activeTabText === 'Disponibilités') {
            calendarView.classList.add('visible');
            headerCalendarControls.style.display = 'flex';
            generateCalendar(currentMonth.value, currentYear.value);
        } else if (activeTabText === 'Paramètres' && isAdmin) {
            settingsView.classList.add('visible');
        } else if (activeTabText === 'Équipes') {
            teamsView.classList.add('visible');
            generateTeamsCalendar(teamsCurrentMonth.value, teamsCurrentYear.value);
            if (selectedTeamDate) {
                generateAndDisplayTeams(selectedTeamDate);
            } else {
                generatedTeamsContainer.innerHTML = `<div id="teams-placeholder"><ion-icon name="calendar-clear-outline"></ion-icon><h3>Sélectionnez un jour</h3><p>Cliquez sur une date pour voir les équipes.</p></div>`;
                potentialReplacementsContainer.innerHTML = '';
            }
        } else if (activeTabText === 'Statistiques' && isAdmin) {
            if (statsView) {
                statsView.classList.add('visible');
                if (headerStatsControls) headerStatsControls.style.display = 'flex';
                renderStatistics();
            } else {
                 calendarView.classList.add('visible');
                 headerCalendarControls.style.display = 'flex';
                 generateCalendar(currentMonth.value, currentYear.value);
            }
        } else {
            calendarView.classList.add('visible');
            headerCalendarControls.style.display = 'flex';
            generateCalendar(currentMonth.value, currentYear.value);
        }
    }

    function setActiveTab(tabElement) {
        if (!tabElement || tabElement.classList.contains('active')) return;
        navUl.classList.remove("indicator-ready");
        navItems.forEach(item => item.classList.remove('active'));
        tabElement.classList.add('active');
        updateActiveView(tabElement);
        moveIndicator(tabElement);
    }

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = e.currentTarget.closest('li');
            if (tab.classList.contains('admin-only') && !isAdmin) { showMessage('Cette section est réservée aux administrateurs.', 'warning'); return; }
            setActiveTab(tab);
        });
    });
    indicator.addEventListener("transitionend", (e) => { if (e.propertyName === "transform" && navUl.classList.contains("indicator-ready")) { indicator.classList.add("landed"); } });

    function setInitialState() {
        updateAdminUI();
        const activeItem = document.querySelector(".navigation .list.active") || navItems[0];
        if (activeItem.classList.contains('admin-only') && !isAdmin) {
            setActiveTab(navItems[0]);
        } else {
            setActiveTab(activeItem);
        }
    }

    // --- LOGIQUE DU CALENDRIER DE DISPONIBILITÉS ---
    const isLeapYear = (year) => (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    const getFebDays = (year) => isLeapYear(year) ? 29 : 28;
    const month_names = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

    let currentDate = new Date();
    let currentMonth = { value: currentDate.getMonth() };
    let currentYear = { value: currentDate.getFullYear() };

    const generateCalendar = (month, year) => {
        if (!calendarDaysContainer || !calendarMonthPicker || !calendarYearHeader) return;
        calendarDaysContainer.innerHTML = '';
        let days_of_month = [31, getFebDays(year), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        calendarMonthPicker.innerHTML = month_names[month];
        calendarYearHeader.innerHTML = year;
        let first_day = new Date(year, month, 1);
        let day_offset = (first_day.getDay() + 6) % 7;
        for (let i = 0; i < days_of_month[month] + day_offset; i++) {
            let day = document.createElement('div');
            if (i >= day_offset) {
                const dayNumber = i - day_offset + 1;
                const dateId = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
                day.innerHTML = dayNumber;
                day.dataset.date = dateId;
                if (dayNumber === new Date().getDate() && year === new Date().getFullYear() && month === new Date().getMonth()) day.classList.add('current-date');
                if (allAvailabilities[dateId]) {
                    day.classList.add('has-availability');
                    if (selectedPersonnel && allAvailabilities[dateId][selectedPersonnel.id]) day.classList.add('selected-available');
                }
            } else { day.classList.add('empty'); }
            calendarDaysContainer.appendChild(day);
        }
    };
    function updateDateTimeDisplay() {
        if (!dispoDayText || !dispoTimeText || !dispoDateText) return;
        const now = new Date();
        const month_names_locale = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
        dispoDayText.textContent = "AUJOURD'HUI";
        dispoTimeText.textContent = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        dispoDateText.textContent = `${String(now.getDate()).padStart(2, '0')} - ${month_names_locale[now.getMonth()]} - ${now.getFullYear()}`;
    }


    if (calendarMonthPicker) {
        calendarMonthPicker.onclick = () => {
            if (calendarMonthList) {
                calendarMonthList.classList.remove('hideonce', 'hide');
                calendarMonthList.classList.add('show');
                if (dispoDayText) { dispoDayText.classList.remove('showtime'); dispoDayText.classList.add('hidetime'); }
                if (dispoTimeText) { dispoTimeText.classList.remove('showtime'); dispoTimeText.classList.add('hideTime'); }
                if (dispoDateText) { dispoDateText.classList.remove('showtime'); dispoDateText.classList.add('hideTime'); }
            }
        };
    }
    if (calendarMonthList) {
        month_names.forEach((e, index) => {
            let monthEl = document.createElement('div');
            monthEl.innerHTML = `<div>${e}</div>`;
            calendarMonthList.append(monthEl);
            monthEl.onclick = () => {
                currentMonth.value = index;
                generateCalendar(currentMonth.value, currentYear.value);
                calendarMonthList.classList.replace('show', 'hide');
                if (dispoDayText) { dispoDayText.classList.remove('hideTime'); dispoDayText.classList.add('showtime'); }
                if (dispoTimeText) { dispoTimeText.classList.remove('hideTime'); dispoTimeText.classList.add('showtime'); }
                if (dispoDateText) { dispoDateText.classList.remove('hideTime'); dispoDateText.classList.add('showtime'); }
            };
        });
        if (!calendarMonthList.classList.contains('show')) { calendarMonthList.classList.add('hideonce'); }
    }
    if (calendarPreYearBtn) calendarPreYearBtn.onclick = () => { --currentYear.value; generateCalendar(currentMonth.value, currentYear.value); };
    if (calendarNextYearBtn) calendarNextYearBtn.onclick = () => { ++currentYear.value; generateCalendar(currentMonth.value, currentYear.value); };

    function setAvailability(dateId) {
        const availabilityRef = database.ref(`availabilities/${dateId}/${selectedPersonnel.id}`);
        availabilityRef.once('value', (snapshot) => {
            if (snapshot.exists()) {
                availabilityRef.remove();
            } else {
                availabilityRef.set({
                    nom: toBase64(selectedPersonnel.nom),
                    prenom: toBase64(selectedPersonnel.prenom)
                });
            }
        });
    }

    function promptForMatricule(dateId) {
        matriculeInput.value = '';
        openModal(matriculeConfirmModal);
        matriculeInput.focus();

        matriculeOkBtn.onclick = () => {
            const enteredMatricule = matriculeInput.value;
            if (!enteredMatricule) {
                showMessage("Veuillez entrer votre matricule.", "error");
                return;
            }

            const correctMatricule = fromBase64(allPersonnel[selectedPersonnel.id].matricule || "");
            if (!correctMatricule) {
                 showMessage("Aucun matricule n'est configuré pour ce compte. Contactez un administrateur.", "error");
                 closeModal(matriculeConfirmModal);
                 return;
            }

            if (enteredMatricule === correctMatricule) {
                matriculeSessionAuth[selectedPersonnel.id] = true; // MODIFIÉ: Enregistrer l'authentification réussie
                showMessage(`Bonjour ${selectedPersonnel.prenom}, vous êtes authentifié.`, "success");
                closeModal(matriculeConfirmModal);
                setAvailability(dateId);
            } else {
                showMessage("Matricule incorrect.", "error");
                matriculeInput.value = '';
            }
        };
    }

    if (calendarDaysContainer) {
        calendarDaysContainer.addEventListener('click', (e) => {
            const dayDiv = e.target.closest('div:not(.empty)');
            if (!dayDiv) return;

            if (availabilityDeadline && new Date() > new Date(availabilityDeadline)) {
                showMessage("La date limite de saisie est dépassée.", "error");
                return;
            }

            if (!selectedPersonnel) {
                showMessage("Veuillez d'abord vous sélectionner dans la liste.", "warning");
                return;
            }

            const dateId = dayDiv.dataset.date;

            if (isAdmin) {
                // L'admin peut modifier sans confirmation
                setAvailability(dateId);
            } else {
                // MODIFIÉ: L'utilisateur doit confirmer avec son matricule une seule fois
                if (matriculeSessionAuth[selectedPersonnel.id]) {
                    setAvailability(dateId); // Déjà authentifié
                } else {
                    promptForMatricule(dateId); // Demander le matricule
                }
            }
        });
    }

    database.ref('availabilities').on('value', (snapshot) => {
        allAvailabilities = snapshot.val() || {};
        if (calendarView.classList.contains('visible')) {
            generateCalendar(currentMonth.value, currentYear.value);
        }
        if (teamsView.classList.contains('visible') && selectedTeamDate) {
            generateAndDisplayTeams(selectedTeamDate);
        }
        if (statsView && statsView.classList.contains('visible')) {
            renderStatistics();
        }
    });

    // --- LOGIQUE POUR LE CALENDRIER DES ÉQUIPES ---
    let teamsCurrentMonth = { value: currentDate.getMonth() };
    let teamsCurrentYear = { value: currentDate.getFullYear() };
    const generateTeamsCalendar = (month, year) => {
        if (!teamsCalendarDaysContainer) return;
        teamsCalendarDaysContainer.innerHTML = '';
        let monthPicker = document.querySelector('#teams-month-picker');
        let yearPicker = document.querySelector('#teams-year');
        if (!monthPicker || !yearPicker) return;
        let days_of_month = [31, getFebDays(year), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        monthPicker.innerHTML = month_names[month];
        yearPicker.innerHTML = year;
        let first_day = new Date(year, month, 1);
        let day_offset = (first_day.getDay() + 6) % 7;
        for (let i = 0; i < days_of_month[month] + day_offset; i++) {
            let day = document.createElement('div');
            if (i >= day_offset) {
                const dayNumber = i - day_offset + 1;
                const dateId = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
                day.innerHTML = dayNumber;
                day.dataset.date = dateId;
                if (dateId === selectedTeamDate) { day.classList.add('selected-day'); }
                // Marqueur visuel si des disponibilités existent pour ce jour
                if (allAvailabilities[dateId] && Object.keys(allAvailabilities[dateId]).length > 0) {
                     day.classList.add('has-availability');
                }
                if (allEvents[dateId]) { day.classList.add('has-event'); }
                // NOUVEAU: Marqueur pour équipe provisoire (si une équipe est assignée/figée pour ce jour)
                if (allAssignedTeams[dateId]) { day.classList.add('has-provisional-team'); } // Note: CSS class name might need adjustment if it implies "not yet frozen"

            } else { day.classList.add('empty'); }
            teamsCalendarDaysContainer.appendChild(day);
        }
    };

    teamsCalendarDaysContainer.addEventListener('click', (e) => {
        const dayDiv = e.target.closest('div:not(.empty)');
        if (!dayDiv) return;
        const dateId = dayDiv.dataset.date;
        selectedTeamDate = dateId;
        generateTeamsCalendar(teamsCurrentMonth.value, teamsCurrentYear.value);
        generateAndDisplayTeams(dateId);
    });

    function openEventModal(dateId, isActivation = false) {
        if (!eventTypeModal || !eventTypeForm || !eventDateInput || !eventModalTitle) return;
        eventTypeForm.reset();
        eventDateInput.value = dateId;

        // Stocker l'information si c'est une activation
        eventTypeForm.dataset.isActivation = isActivation;

        const [year, month, day] = dateId.split('-');
        eventModalTitle.textContent = `Événement du ${day} ${month_names[parseInt(month) - 1]}`;
        if (allEvents[dateId] && allEvents[dateId].types) {
            allEvents[dateId].types.forEach(type => { const checkbox = eventTypeForm.querySelector(`input[name="eventTypes"][value="${type}"]`); if (checkbox) checkbox.checked = true; });
        }
        openModal(eventTypeModal);
    }
    eventTypeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!isAdmin) return;
        const dateId = eventDateInput.value;
        const selectedTypes = Array.from(eventTypeForm.querySelectorAll('input[name="eventTypes"]:checked')).map(cb => cb.value);
        const eventRef = database.ref(`events/${dateId}`);
        const isActivation = eventTypeForm.dataset.isActivation === 'true';

        if (selectedTypes.length > 0) {
            const promises = [];
            // 1. Enregistrer l'événement
            promises.push(eventRef.set({ types: selectedTypes }));

            // 2. Si c'est une activation, figer l'équipe actuelle
            if (isActivation && currentWorkingTeam) {
                const teamToFreeze = JSON.parse(JSON.stringify(currentWorkingTeam));
                // S'assurer de ne figer que ce qui est demandé par les types d'événements
                const wantsCcf = selectedTypes.some(type => type.startsWith("GIFF Nord"));
                const wantsMpr = selectedTypes.includes("MPR");

                // Only include parts of the team that correspond to selected event types
                const finalTeamToFreeze = {};
                if (wantsCcf && teamToFreeze.ccfTeam) {
                    finalTeamToFreeze.ccfTeam = teamToFreeze.ccfTeam;
                } else {
                    // If CCF not wanted by event, but was in currentWorkingTeam, don't freeze it.
                    // Or ensure it's explicitly nulled if the structure requires ccfTeam/mprTeam keys
                     finalTeamToFreeze.ccfTeam = null;
                }
                if (wantsMpr && teamToFreeze.mprTeam) {
                    finalTeamToFreeze.mprTeam = teamToFreeze.mprTeam;
                } else {
                     finalTeamToFreeze.mprTeam = null;
                }
                // Only save if there's something to save for assignedTeams
                if (finalTeamToFreeze.ccfTeam || finalTeamToFreeze.mprTeam) {
                    promises.push(database.ref(`assignedTeams/${dateId}`).set(finalTeamToFreeze));
                } else {
                    // If nothing matches event types, maybe remove existing assigned team
                    promises.push(database.ref(`assignedTeams/${dateId}`).remove());
                }


            }

            Promise.all(promises).then(() => {
                showMessage(isActivation ? 'Journée activée et équipe figée !' : 'Événement enregistré !', 'success');
                closeModal(eventTypeModal);
            }).catch(err => showMessage('Erreur: ' + err.message, 'error'));

        } else {
             showGenericConfirmModal(
                "Supprimer cet événement désactivera également les équipes assignées pour cette date. Continuer ?",
                () => {
                    Promise.all([
                        eventRef.remove(),
                        database.ref(`assignedTeams/${dateId}`).remove()
                    ]).then(() => {
                        showMessage('Événement et équipes assignées supprimés.', 'warning');
                        closeModal(eventTypeModal);
                    }).catch(err => showMessage('Erreur: ' + err.message, 'error'));
                }, null, "Confirmation de suppression", "btn-danger", "Oui, supprimer"
            );
        }
    });

    database.ref('events').on('value', (snapshot) => {
        allEvents = snapshot.val() || {};
        if (teamsView.classList.contains('visible')) {
            generateTeamsCalendar(teamsCurrentMonth.value, teamsCurrentYear.value);
            if (selectedTeamDate) {
                generateAndDisplayTeams(selectedTeamDate);
            } else {
                generatedTeamsContainer.innerHTML = `<div id="teams-placeholder"><ion-icon name="calendar-clear-outline"></ion-icon><h3>Sélectionnez un jour</h3><p>Cliquez sur une date pour voir ou générer les équipes.</p></div>`;
                potentialReplacementsContainer.innerHTML = '';
            }
        }
        if (statsView && statsView.classList.contains('visible')) {
            renderStatistics();
        }
    });

    database.ref('assignedTeams').on('value', (snapshot) => {
        allAssignedTeams = snapshot.val() || {};
         if (teamsView.classList.contains('visible')) { // Added to refresh teams calendar markers
            generateTeamsCalendar(teamsCurrentMonth.value, teamsCurrentYear.value);
            if (selectedTeamDate) {
                generateAndDisplayTeams(selectedTeamDate);
            }
        }
         if (statsView && statsView.classList.contains('visible')) {
            renderStatistics();
        }
    });


    const teamsMonthList = document.querySelector('#teams-month-list');
    if (teamsMonthList) {
        month_names.forEach((e, index) => {
            let month = document.createElement('div');
            month.innerHTML = `<div>${e}</div>`;
            teamsMonthList.append(month);
            month.onclick = () => { teamsCurrentMonth.value = index; generateTeamsCalendar(teamsCurrentMonth.value, teamsCurrentYear.value); teamsMonthList.classList.replace('show', 'hide'); if (!teamsMonthList.classList.contains('show')) { teamsMonthList.classList.add('hideonce'); } };
        });
        if (!teamsMonthList.classList.contains('show')) { teamsMonthList.classList.add('hideonce'); }
    }
    const teamsMonthPicker = document.querySelector('#teams-month-picker');
    if (teamsMonthPicker) teamsMonthPicker.onclick = () => { teamsMonthList.classList.remove('hideonce', 'hide'); teamsMonthList.classList.add('show'); };
    const teamsPreYear = document.querySelector('#teams-pre-year');
    if (teamsPreYear) teamsPreYear.onclick = () => { --teamsCurrentYear.value; generateTeamsCalendar(teamsCurrentMonth.value, teamsCurrentYear.value); };
    const teamsNextYear = document.querySelector('#teams-next-year');
    if (teamsNextYear) teamsNextYear.onclick = () => { ++teamsCurrentYear.value; generateTeamsCalendar(teamsCurrentMonth.value, teamsCurrentYear.value); };

    const ROLES = { CCF_DRIVER: "Conducteur Poids Lourd (CCF4MHP37)", CCF_LEADER: "Chef d'Agrès FDF (CCF4MHP37)", CCF_TEAMMATE: "Équipier FDF (CCF4MHP37)", MPR_DRIVER: "Conducteur Voiture (MPR12)", MPR_TEAMMATE: "Équipier DIV (MPR12)" };

    // --- **MODIFIED** LOGIQUE DE GÉNÉRATION ET D'AFFICHAGE DES ÉQUIPES ---
    function generateProvisionalTeam(dateId, wantsCcf, wantsMpr) {
        const availablePersonnelIds = Object.keys(allAvailabilities[dateId] || {});
        let availablePool = [...availablePersonnelIds]; // Use a fresh pool for each call context
        const personnelByFunctionForDay = {};

        availablePool.forEach(pId => {
            const person = allPersonnel[pId];
            if (person && person.fonctions) {
                person.fonctions.map(f => fromBase64(f)).forEach(func => {
                    if (!personnelByFunctionForDay[func]) personnelByFunctionForDay[func] = [];
                    personnelByFunctionForDay[func].push(pId);
                });
            }
        });

        const assignPersonnelForAuto = (role, currentPool, pbfd) => {
            const candidates = (pbfd[role] || []).filter(id => currentPool.includes(id));
            if (candidates.length > 0) {
                const assignedId = candidates[Math.floor(Math.random() * candidates.length)];
                const indexInPool = currentPool.indexOf(assignedId);
                if (indexInPool > -1) currentPool.splice(indexInPool, 1);
                return assignedId;
            }
            return null;
        };

        let ccfTeam = { [ROLES.CCF_DRIVER]: null, [ROLES.CCF_LEADER]: null, [ROLES.CCF_TEAMMATE]: [null, null] };
        let mprTeam = { [ROLES.MPR_DRIVER]: null, [ROLES.MPR_TEAMMATE]: null };

        if (wantsCcf && !wantsMpr) { // CCF Only
            ccfTeam[ROLES.CCF_DRIVER] = assignPersonnelForAuto(ROLES.CCF_DRIVER, availablePool, personnelByFunctionForDay);
            ccfTeam[ROLES.CCF_LEADER] = assignPersonnelForAuto(ROLES.CCF_LEADER, availablePool, personnelByFunctionForDay);
            ccfTeam[ROLES.CCF_TEAMMATE][0] = assignPersonnelForAuto(ROLES.CCF_TEAMMATE, availablePool, personnelByFunctionForDay);
            ccfTeam[ROLES.CCF_TEAMMATE][1] = assignPersonnelForAuto(ROLES.CCF_TEAMMATE, availablePool, personnelByFunctionForDay);
        } else if (!wantsCcf && wantsMpr) { // MPR Only
            mprTeam[ROLES.MPR_DRIVER] = assignPersonnelForAuto(ROLES.MPR_DRIVER, availablePool, personnelByFunctionForDay);
            mprTeam[ROLES.MPR_TEAMMATE] = assignPersonnelForAuto(ROLES.MPR_TEAMMATE, availablePool, personnelByFunctionForDay);
        } else if (wantsCcf && wantsMpr) { // Both Active - distribute
            // Prioritize critical roles, then others, from the shared pool
            ccfTeam[ROLES.CCF_DRIVER] = assignPersonnelForAuto(ROLES.CCF_DRIVER, availablePool, personnelByFunctionForDay);
            mprTeam[ROLES.MPR_DRIVER] = assignPersonnelForAuto(ROLES.MPR_DRIVER, availablePool, personnelByFunctionForDay);
            ccfTeam[ROLES.CCF_LEADER] = assignPersonnelForAuto(ROLES.CCF_LEADER, availablePool, personnelByFunctionForDay);
            ccfTeam[ROLES.CCF_TEAMMATE][0] = assignPersonnelForAuto(ROLES.CCF_TEAMMATE, availablePool, personnelByFunctionForDay);
            mprTeam[ROLES.MPR_TEAMMATE] = assignPersonnelForAuto(ROLES.MPR_TEAMMATE, availablePool, personnelByFunctionForDay);
            ccfTeam[ROLES.CCF_TEAMMATE][1] = assignPersonnelForAuto(ROLES.CCF_TEAMMATE, availablePool, personnelByFunctionForDay);
        }
        // If neither wantsCcf nor wantsMpr (e.g. no event and no available personnel for default), both teams remain with nulls.
        return { ccfTeam, mprTeam };
    }


    function generateAndDisplayTeams(dateId) {
        potentialReplacementsContainer.innerHTML = '';
        currentWorkingTeam = null; // Reset before generation

        let wantsCcf = false;
        let wantsMpr = false;
        let isProvisionalDisplayState = true; // Is the displayed team a mere suggestion or based on a firm event/frozen state?

        const eventDetails = allEvents[dateId];
        if (eventDetails && eventDetails.types && eventDetails.types.length > 0) {
            wantsCcf = eventDetails.types.some(type => type.startsWith("GIFF Nord"));
            wantsMpr = eventDetails.types.includes("MPR");
            isProvisionalDisplayState = false; // Team generation is guided by a specific event
        } else {
            // No event: default to wanting both if people are available (for provisional display)
            const availablePersonnelIdsForCheck = Object.keys(allAvailabilities[dateId] || {});
            if (availablePersonnelIdsForCheck.length > 0) {
                wantsCcf = true;
                wantsMpr = true;
            }
            // If no personnel, wantsCcf/Mpr remain false, leading to empty provisional teams
        }

        // 1. Check for a Frozens team first for display.
        if (allAssignedTeams[dateId]) {
            const assigned = allAssignedTeams[dateId];
            currentWorkingTeam = JSON.parse(JSON.stringify(assigned)); // This is the active team for potential modifications

            // Determine what to display from the frozen team
            const displayCcfFromFrozen = !!assigned.ccfTeam; // Display if ccfTeam key exists and is not null/empty
            const displayMprFromFrozen = !!assigned.mprTeam; // Display if mprTeam key exists and is not null/empty

            renderTeams(dateId, assigned.ccfTeam, assigned.mprTeam, displayCcfFromFrozen, displayMprFromFrozen, true, false); // isFrozen = true, isProvisional = false
            return;
        }

        // 2. No frozen team. Check for available personnel.
        const availablePersonnelIds = Object.keys(allAvailabilities[dateId] || {});
        if (availablePersonnelIds.length === 0) {
            let noPersonnelHtml = `<div id="teams-placeholder"><ion-icon name="close-circle-outline"></ion-icon><h3>Aucun personnel disponible</h3><p>Aucun personnel n'a indiqué de disponibilité pour cette date.</p></div>`;
            if (eventDetails && eventDetails.types && eventDetails.types.length > 0) { // Event was set but no one available
                noPersonnelHtml = `
                    <div class="teams-display-header">
                        <h3>Équipes du ${dateId.split('-').reverse().join('/')}</h3>
                        ${generateEventTagsHtml(dateId)}
                         <p style="text-align:center; margin-top:1rem; color:var(--fire-red);">Aucun personnel disponible pour former les équipes pour cet événement.</p>
                    </div>`;
            }
            generatedTeamsContainer.innerHTML = noPersonnelHtml;
            potentialReplacementsContainer.innerHTML = ''; // Clear replacements if no team can be formed
            return;
        }

        // 3. Personnel available, no frozen team. Generate a team based on `wantsCcf` and `wantsMpr`.
        const { ccfTeam, mprTeam } = generateProvisionalTeam(dateId, wantsCcf, wantsMpr);
        currentWorkingTeam = { ccfTeam, mprTeam }; // This generated team is now the working team

        // 4. Render the generated team.
        // `wantsCcf` & `wantsMpr` here reflect the *intended* structure for the generation.
        // `isProvisionalDisplayState` indicates if it was a pure suggestion or based on an event.
        renderTeams(dateId, ccfTeam, mprTeam, wantsCcf, wantsMpr, false, isProvisionalDisplayState);
    }

    function generateEventTagsHtml(dateId) {
        const eventInfo = allEvents[dateId];
        const assignedTeamInfo = allAssignedTeams[dateId];

        if (assignedTeamInfo) { // If team is frozen, that's the primary status
            if (eventInfo && eventInfo.types && eventInfo.types.length > 0) {
                return `<div class="event-tags">${eventInfo.types.map(t => `<span class="event-tag">${t}</span>`).join('')} <span class="event-tag provisional" style="background-color: var(--available-green);">Équipe Figée</span></div>`;
            } else {
                 // Team is frozen, but no specific event types recorded (e.g. manually frozen provisional)
                return `<div class="event-tags"><span class="event-tag provisional" style="background-color: var(--available-green);">Équipe Figée</span></div>`;
            }
        } else if (eventInfo && eventInfo.types && eventInfo.types.length > 0) { // Event defined, team not yet frozen
            return `<div class="event-tags">${eventInfo.types.map(t => `<span class="event-tag">${t}</span>`).join('')} <span class="event-tag" style="background-color: var(--provisional-blue);">Prévu (Non Figé)</span></div>`;
        }
        // No event, no frozen team => pure provisional
        return `<div class="event-tags"><span class="event-tag" style="background-color: var(--ember-orange);">Proposition Automatique</span></div>`;
    }


    function getRoleDisplayName(roleKey) {
        if (roleKey === ROLES.CCF_DRIVER) return "Conducteur PL";
        if (roleKey === ROLES.CCF_LEADER) return "Chef d'Agrès FDF";
        if (roleKey === ROLES.CCF_TEAMMATE) return "Équipier FDF";
        if (roleKey === ROLES.MPR_DRIVER) return "Conducteur VL";
        if (roleKey === ROLES.MPR_TEAMMATE) return "Équipier DIV";
        return roleKey;
    }

    function renderTeams(dateId, ccfTeam, mprTeam, displayCcf, displayMpr, isFrozen = false, isProvisional = false) {
        const getPersonnelNameAndButton = (personnelId, roleKey, teamType, teammateIndex = -1) => {
            let nameHtml;
            if (!personnelId) {
                nameHtml = '<span class="personnel-name unassigned">Non assigné</span>';
            } else {
                const p = allPersonnel[personnelId];
                nameHtml = p ? `<span class="personnel-name">${fromBase64(p.prenom)} ${fromBase64(p.nom)}</span>` : '<span class="personnel-name unassigned">Personnel Inconnu</span>';
            }

            let replaceButtonHtml = '';
            if (isAdmin && isFrozen) { // Replacement only on frozen teams
                replaceButtonHtml = `<button class="replace-personnel-btn"
                                            data-dateid="${dateId}"
                                            data-teamtype="${teamType}"
                                            data-rolekey="${roleKey}"
                                            data-currentpersonnelid="${personnelId || 'null'}"
                                            ${teammateIndex !== -1 ? `data-teammateindex="${teammateIndex}"` : ''}
                                            title="Remplacer/Assigner">
                                            <ion-icon name="swap-horizontal-outline"></ion-icon>
                                         </button>`;
            } else if (isAdmin && !isFrozen && personnelId) { // Option to "remove" from provisional before freezing
                 // This could be an advanced feature, for now, replacement is on frozen.
            }
            return `<div class="personnel-name-wrapper">${nameHtml}${replaceButtonHtml}</div>`;
        };

        let teamsHtml = '';
        let ccfHtml = '';
        let mprHtml = '';

        if (displayCcf && ccfTeam) { // ccfTeam might exist but be empty if displayCcf was true but no one could be assigned
            const isCcfComplete = ccfTeam[ROLES.CCF_DRIVER] && ccfTeam[ROLES.CCF_LEADER] && ccfTeam[ROLES.CCF_TEAMMATE] && ccfTeam[ROLES.CCF_TEAMMATE].length === 2 && ccfTeam[ROLES.CCF_TEAMMATE].every(id => id !== null);
            ccfHtml = `
                <div class="team-card ${isCcfComplete ? '' : 'incomplete'}">
                    <h4><ion-icon name="bus-outline"></ion-icon> Équipe CCF4MHP37</h4>
                    <div class="role"><span class="role-name">Conducteur PL:</span> ${getPersonnelNameAndButton(ccfTeam[ROLES.CCF_DRIVER], ROLES.CCF_DRIVER, 'ccf')}</div>
                    <div class="role"><span class="role-name">Chef d'Agrès FDF:</span> ${getPersonnelNameAndButton(ccfTeam[ROLES.CCF_LEADER], ROLES.CCF_LEADER, 'ccf')}</div>
                    <div class="role"><span class="role-name">Équipier FDF 1:</span> ${getPersonnelNameAndButton(ccfTeam[ROLES.CCF_TEAMMATE]?.[0], ROLES.CCF_TEAMMATE, 'ccf', 0)}</div>
                    <div class="role"><span class="role-name">Équipier FDF 2:</span> ${getPersonnelNameAndButton(ccfTeam[ROLES.CCF_TEAMMATE]?.[1], ROLES.CCF_TEAMMATE, 'ccf', 1)}</div>
                </div>`;
        }

        if (displayMpr && mprTeam) { // mprTeam might exist but be empty
            const isMprComplete = mprTeam[ROLES.MPR_DRIVER] && mprTeam[ROLES.MPR_TEAMMATE];
            mprHtml = `
                <div class="team-card ${isMprComplete ? '' : 'incomplete'}">
                    <h4><ion-icon name="car-sport-outline"></ion-icon> Équipe MPR12</h4>
                    <div class="role"><span class="role-name">Conducteur VL:</span> ${getPersonnelNameAndButton(mprTeam[ROLES.MPR_DRIVER], ROLES.MPR_DRIVER, 'mpr')}</div>
                    <div class="role"><span class="role-name">Équipier DIV:</span> ${getPersonnelNameAndButton(mprTeam[ROLES.MPR_TEAMMATE], ROLES.MPR_TEAMMATE, 'mpr')}</div>
                </div>`;
        }

        teamsHtml = ccfHtml + mprHtml;
        if (teamsHtml === '') {
            if (Object.keys(allAvailabilities[dateId] || {}).length > 0) { // People available but no team displayed per logic
                 teamsHtml = `<p style="text-align:center; margin-top:1rem; color:var(--text-secondary);">Aucune composition d'équipe à afficher pour les types d'événements sélectionnés ou les disponibilités.</p>`;
            } else { // No one available in the first place
                 teamsHtml = `<p style="text-align:center; margin-top:1rem; color:var(--text-secondary);">Aucun personnel disponible pour cette date.</p>`;
            }
        }

        let adminActionsHtml = '';
        if (isAdmin) {
             if (isFrozen) {
                adminActionsHtml = `<div class="header-actions" style="margin-top:1rem; display:flex; justify-content:center; gap:1rem;">
                                        <button id="edit-event-btn-display" class="btn-primary" style="padding: 0.5rem 1rem;">Gérer l'Événement/Modifier</button>
                                        <button id="reset-assigned-team-btn" class="btn-secondary" style="padding: 0.5rem 1rem;">Défiger l'Équipe</button>
                                    </div>`;
            } else if (Object.keys(allAvailabilities[dateId] || {}).length > 0 && (ccfTeam || mprTeam)) {
                // Only show activate button if there's a team (even partial) generated from available personnel
                adminActionsHtml = `<div class="header-actions" style="margin-top:1rem; display:flex; justify-content:center; gap:1rem;">
                                        <button id="activate-day-btn" class="btn-primary" style="padding: 0.5rem 1rem; background-color: var(--available-green);">Activer Journée et Figer Équipe(s)</button>
                                    </div>`;
                 // If no event is defined yet, "Activer Journée" will prompt for event types.
                 // If event types are defined, it will use those.
            } else if (allEvents[dateId] && allEvents[dateId].types && allEvents[dateId].types.length > 0) {
                // Event is defined, but no personnel to form team. Still allow event management.
                 adminActionsHtml = `<div class="header-actions" style="margin-top:1rem; display:flex; justify-content:center; gap:1rem;">
                                        <button id="edit-event-btn-display" class="btn-primary" style="padding: 0.5rem 1rem;">Gérer l'Événement</button>
                                     </div>`;
            } else {
                // No event, no personnel, no team. Maybe a button to define event types.
                adminActionsHtml = `<div class="header-actions" style="margin-top:1rem; display:flex; justify-content:center; gap:1rem;">
                                        <button id="define-event-type-btn" class="btn-secondary" style="padding: 0.5rem 1rem;">Définir Type d'Événement</button>
                                     </div>`;
            }
        } else if (isFrozen) { // Non-admin view of a frozen team
            // No actions, just view. The event tags already show status.
        } else { // Non-admin view, team not frozen
            teamsHtml = `<p style="text-align:center; margin-top:1rem; color:var(--text-secondary);">L'équipe pour cette date n'est pas encore finalisée.</p>`;
        }

        generatedTeamsContainer.innerHTML = `
            <div class="teams-display-header">
                <h3>Équipes du ${dateId.split('-').reverse().join('/')}</h3>
                ${generateEventTagsHtml(dateId)}
                ${adminActionsHtml}
            </div>
            <div class="teams-grid">${teamsHtml}</div>`;

        // --- GESTIONNAIRES D'ÉVÉNEMENTS POUR LES BOUTONS ---

        const editBtn = document.getElementById('edit-event-btn-display');
        if (editBtn) { editBtn.addEventListener('click', () => openEventModal(dateId, false)); } // false: not an activation, just editing event type

        const activateDayBtn = document.getElementById('activate-day-btn');
        if (activateDayBtn) { activateDayBtn.addEventListener('click', () => openEventModal(dateId, true)); } // true: this is an activation

        const defineEventTypeBtn = document.getElementById('define-event-type-btn');
        if (defineEventTypeBtn) { defineEventTypeBtn.addEventListener('click', () => openEventModal(dateId, false));}


        const resetAssignedTeamBtn = document.getElementById('reset-assigned-team-btn');
        if (resetAssignedTeamBtn) {
            resetAssignedTeamBtn.addEventListener('click', () => {
                showGenericConfirmModal(
                    "Voulez-vous défiger l'équipe assignée ? La génération automatique (si applicable) reprendra. L'événement défini pour le jour sera conservé.",
                    () => {
                        database.ref(`assignedTeams/${dateId}`).remove()
                        .then(() => {
                            showMessage("Équipe défigée. L'événement est conservé.", "success");
                            // generateAndDisplayTeams(dateId); // Already handled by listener on assignedTeams
                        }).catch(err => showMessage("Erreur: " + err.message, "error"));
                    }, null, "Défiger l'équipe ?", "btn-secondary", "Oui, Défiger"
                );
            });
        }

        document.querySelectorAll('.replace-personnel-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const btn = e.currentTarget;
                currentReplacementInfo = {
                    dateId: btn.dataset.dateid,
                    teamType: btn.dataset.teamtype,
                    roleKey: btn.dataset.rolekey,
                    currentPersonnelId: btn.dataset.currentpersonnelid === 'null' ? null : btn.dataset.currentpersonnelid,
                    teammateIndex: btn.dataset.teammateindex ? parseInt(btn.dataset.teammateindex) : -1
                };
                openReplacePersonnelModal();
            });
        });

        if (isAdmin && isFrozen && (ccfTeam || mprTeam)) { // Only show replacements if team is frozen AND has members
            const teamForReplacements = currentWorkingTeam; // currentWorkingTeam should be the frozen team
             if (teamForReplacements) {
                renderPotentialReplacements(dateId, teamForReplacements.ccfTeam, teamForReplacements.mprTeam);
             }
        } else {
            potentialReplacementsContainer.innerHTML = '';
        }
    }


    function renderPotentialReplacements(dateId, ccfTeam, mprTeam) {
        const availableOnDate = Object.keys(allAvailabilities[dateId] || {});
        const currentTeamAssignmentsOnDate = new Set();
        const teamsToConsider = [];
        if(ccfTeam) teamsToConsider.push(ccfTeam);
        if(mprTeam) teamsToConsider.push(mprTeam);

        teamsToConsider.forEach(team => {
            if (!team) return;
            Object.values(team).flat().forEach(id => { // .flat() handles single IDs and arrays of IDs (like CCF_TEAMMATE)
                if (id) currentTeamAssignmentsOnDate.add(id);
            });
        });

        const potentialReplacementsByRole = {};
        Object.values(ROLES).forEach(roleKey => {
            const qualifiedPersonnel = Object.keys(allPersonnel).filter(pId => {
                const pData = allPersonnel[pId];
                return pData.fonctions && pData.fonctions.map(f => fromBase64(f)).includes(roleKey);
            });

            const availableAndUnassignedForRole = qualifiedPersonnel.filter(pId =>
                availableOnDate.includes(pId) && !currentTeamAssignmentsOnDate.has(pId)
            );

            if (availableAndUnassignedForRole.length > 0) {
                potentialReplacementsByRole[roleKey] = availableAndUnassignedForRole;
            }
        });

        if (Object.keys(potentialReplacementsByRole).length === 0) {
            potentialReplacementsContainer.innerHTML = '<h3><ion-icon name="people-circle-outline"></ion-icon> Remplaçants Potentiels</h3><p style="color:var(--text-secondary); text-align:center;">Aucun remplaçant potentiel disponible actuellement (personnel disponible non assigné ayant la fonction requise).</p>';
            return;
        }

        let html = `<h3><ion-icon name="people-circle-outline"></ion-icon> Remplaçants Potentiels</h3><div class="potential-replacements-list">`;
        for (const roleKey in potentialReplacementsByRole) {
            html += `<div class="replacement-role-group">
                          <h4>${getRoleDisplayName(roleKey)}</h4>
                          <ul>`;
            potentialReplacementsByRole[roleKey].forEach(pId => {
                const person = allPersonnel[pId];
                html += `<li>${fromBase64(person.prenom)} ${fromBase64(person.nom)}</li>`;
            });
            html += `   </ul>
                      </div>`;
        }
        html += `</div>`;
        potentialReplacementsContainer.innerHTML = html;
    }

    function openReplacePersonnelModal() {
        if (!isAdmin || !currentWorkingTeam) { // currentWorkingTeam should be set if we are replacing
            showMessage("Impossible d'ouvrir le remplacement : aucune équipe de travail active ou sélectionnée.", "error");
            return;
        }
        const { dateId, roleKey, currentPersonnelId } = currentReplacementInfo;

        if (roleToReplaceEl) roleToReplaceEl.textContent = getRoleDisplayName(roleKey);
        if (replacementOptionsContainer) replacementOptionsContainer.innerHTML = '';

        const availableOnDate = Object.keys(allAvailabilities[dateId] || {});
        const currentAssignmentsInWorkingTeam = new Set(); // Consider only assignments in the *current working* (frozen) team

        const { ccfTeam, mprTeam } = currentWorkingTeam; // This is the team we are modifying
        if (ccfTeam) { Object.values(ccfTeam).flat().forEach(id => { if (id) currentAssignmentsInWorkingTeam.add(id); }); }
        if (mprTeam) { Object.values(mprTeam).flat().forEach(id => { if (id) currentAssignmentsInWorkingTeam.add(id); }); }

        // A person is a potential replacement if:
        // 1. They are available on the date.
        // 2. They have the required function (roleKey).
        // 3. They are NOT the person currently in the slot (if a person is already there).
        // 4. They are NOT already assigned elsewhere IN THE CURRENTLY FROZEN TEAM.
        const potentialReplacementsList = Object.keys(allPersonnel).filter(pId => {
            const person = allPersonnel[pId];
            return person &&
                availableOnDate.includes(pId) &&
                person.fonctions && person.fonctions.map(f => fromBase64(f)).includes(roleKey) &&
                pId !== currentPersonnelId && // Not the person being replaced
                !currentAssignmentsInWorkingTeam.has(pId); // Not already in another slot of this frozen team
        });

        // Option to unassign the current person
        if (currentPersonnelId) { // Only show if someone is currently assigned
            const unassignOptionDiv = document.createElement('div');
            unassignOptionDiv.className = 'replacement-option';
            unassignOptionDiv.textContent = `Laisser "${getRoleDisplayName(roleKey)}" Non Assigné`;
            unassignOptionDiv.addEventListener('click', () => performReplacement(null)); // Pass null to unassign
            replacementOptionsContainer.appendChild(unassignOptionDiv);
        }


        if (potentialReplacementsList.length > 0) {
            potentialReplacementsList.forEach(pId => {
                const person = allPersonnel[pId];
                const optionDiv = document.createElement('div');
                optionDiv.className = 'replacement-option';
                optionDiv.textContent = `${fromBase64(person.prenom)} ${fromBase64(person.nom)}`;
                optionDiv.addEventListener('click', () => performReplacement(pId));
                replacementOptionsContainer.appendChild(optionDiv);
            });
        } else {
            if (!currentPersonnelId) { // No one assigned and no one to assign
                 replacementOptionsContainer.insertAdjacentHTML('beforeend', '<div class="replacement-option no-options">Aucun personnel disponible pour ce rôle.</div>');
            } else { // Someone assigned, but no one else to replace them with
                 replacementOptionsContainer.insertAdjacentHTML('beforeend', '<div class="replacement-option no-options">Aucun autre remplaçant disponible pour ce rôle.</div>');
            }
        }
        openModal(replacePersonnelModal);
    }

    function performReplacement(replacementPersonnelId) {
        if (!isAdmin || !currentReplacementInfo || !currentWorkingTeam) {
             showMessage("Erreur: Remplacement impossible (pas d'admin, d'info de remplacement ou d'équipe active).", "error");
            return;
        }

        const { dateId, teamType, roleKey, teammateIndex, currentPersonnelId } = currentReplacementInfo;

        // Ensure currentWorkingTeam is the source of truth for modification
        // It should be a deep copy of the frozen team if one exists, or the generated one.
        const teamToUpdate = currentWorkingTeam[teamType + 'Team'];

        if (!teamToUpdate) {
            showMessage("Erreur: L'équipe à mettre à jour n'existe pas dans currentWorkingTeam.", "error");
            return;
        }

        // If replacing with someone already in another role in currentWorkingTeam, this needs careful handling.
        // For now, assume replacementPersonnelId is either null or not currently in another slot of currentWorkingTeam.
        // The filtering in openReplacePersonnelModal should handle this.

        if (roleKey === ROLES.CCF_TEAMMATE && teammateIndex !== -1) {
            teamToUpdate[roleKey][teammateIndex] = replacementPersonnelId;
        } else {
            teamToUpdate[roleKey] = replacementPersonnelId;
        }

        // Now, save the modified currentWorkingTeam back to Firebase as the new frozen team.
        database.ref(`assignedTeams/${dateId}`).set(currentWorkingTeam)
            .then(() => {
                showMessage("Remplacement effectué et équipe mise à jour !", "success");
                closeModal(replacePersonnelModal);
                // The Firebase listener on 'assignedTeams' will trigger generateAndDisplayTeams to refresh the view.
            })
            .catch(err => {
                showMessage("Erreur lors de la validation de l'équipe : " + err.message, "error");
            });
    }

    // --- **MODIFIÉ** LOGIQUE POUR LES STATISTIQUES ---
    function renderStatistics() {
        if (!statsView || !statsList) {
            return;
        }

        // 1. Calcul des données
        const stats = {};
        for (const pId in allPersonnel) {
            stats[pId] = {
                nom: fromBase64(allPersonnel[pId].nom),
                prenom: fromBase64(allPersonnel[pId].prenom),
                fonctions: allPersonnel[pId].fonctions ? allPersonnel[pId].fonctions.map(f => fromBase64(f)) : [],
                availabilities: 0,
                ccfCount: 0,
                mprCount: 0
            };
        }

        for (const date in allAvailabilities) {
            for (const pId in allAvailabilities[date]) {
                if (stats[pId]) {
                    stats[pId].availabilities++;
                }
            }
        }

        for (const date in allAssignedTeams) {
            const teamData = allAssignedTeams[date];
            if (teamData.ccfTeam) {
                const ccfAssignments = Object.values(teamData.ccfTeam).flat().filter(id => id); // Filter out nulls
                ccfAssignments.forEach(pId => {
                    if (stats[pId]) stats[pId].ccfCount++;
                });
            }
            if (teamData.mprTeam) {
                const mprAssignments = Object.values(teamData.mprTeam).flat().filter(id => id); // Filter out nulls
                mprAssignments.forEach(pId => {
                    if (stats[pId]) stats[pId].mprCount++;
                });
            }
        }

        // 2. Filtrage
        const searchTerm = statsSearchInput ? statsSearchInput.value.toLowerCase() : "";
        const filterTerm = statsFilterInput ? statsFilterInput.value : "";
        const filteredPersonnelIds = Object.keys(stats).filter(pId => {
            const person = stats[pId];
            const fullName = `${person.prenom} ${person.nom}`.toLowerCase();
            const matchesSearch = fullName.includes(searchTerm);
            const matchesFilter = filterTerm === '' || person.fonctions.includes(filterTerm);
            return matchesSearch && matchesFilter;
        });

        // 3. Affichage
        statsList.innerHTML = '';
        if (filteredPersonnelIds.length === 0) {
            statsList.innerHTML = '<p style="text-align:center; padding:2rem; color:var(--text-secondary);">Aucun personnel trouvé.</p>';
            return;
        }

        // Tri par nom de famille
        filteredPersonnelIds.sort((a, b) => stats[a].nom.localeCompare(stats[b].nom));

        filteredPersonnelIds.forEach(pId => {
            const p = stats[pId];
            const card = document.createElement('div');
            card.className = 'personnel-card'; // Using existing class for similar styling
            card.innerHTML = `
                <div class="personnel-avatar">${p.prenom.charAt(0)}${p.nom.charAt(0)}</div>
                <div class="personnel-info">
                    <h3>${p.prenom} ${p.nom}</h3>
                    <div class="info-block" title="Nombre total de jours de disponibilité indiqués">
                        <ion-icon name="calendar-number-outline"></ion-icon>
                        <span><strong>${p.availabilities}</strong> Disponibilités</span>
                    </div>
                    <div class="info-block" title="Nombre de fois assigné à une équipe CCF (rôle quelconque)">
                        <ion-icon name="bus-outline"></ion-icon>
                        <span><strong>${p.ccfCount}</strong> Gardes CCF</span>
                    </div>
                    <div class="info-block" title="Nombre de fois assigné à une équipe MPR (rôle quelconque)">
                        <ion-icon name="car-sport-outline"></ion-icon>
                        <span><strong>${p.mprCount}</strong> Gardes MPR</span>
                    </div>
                </div>
            `;
            statsList.appendChild(card);
        });
    }

    if (statsSearchInput) statsSearchInput.addEventListener('input', renderStatistics);
    if (statsFilterInput) statsFilterInput.addEventListener('change', renderStatistics);

    // --- LOGIQUE DE RÉINITIALISATION DES DONNÉES ---
    if (resetAllDataBtn) {
        resetAllDataBtn.addEventListener('click', () => {
            if (!isAdmin) {
                showMessage("Accès refusé. Seuls les administrateurs peuvent effectuer cette action.", "error");
                return;
            }

            const onFinalConfirm = () => {
                const promises = [];
                promises.push(database.ref('availabilities').remove());
                promises.push(database.ref('events').remove());
                promises.push(database.ref('assignedTeams').remove());

                Promise.all(promises)
                    .then(() => {
                        showMessage("Toutes les disponibilités, événements et équipes assignées ont été réinitialisés.", "success");
                    })
                    .catch(err => {
                        showMessage("Erreur lors de la réinitialisation : " + err.message, "error");
                    });
            };

            showGenericConfirmModal(
                "Êtes-vous <strong>ABSOLUMENT SÛR</strong> de vouloir tout réinitialiser ?<br><br>Cette action supprime <strong>TOUTES</strong> les disponibilités de <strong>TOUS</strong> les personnels et désactive <strong>TOUTES</strong> les dates d'événements (y compris les équipes assignées).<br><br><strong style='color:var(--fire-red);'>CETTE ACTION EST IRRÉVERSIBLE.</strong>",
                () => {
                    closeModal(genericConfirmModal);
                    showCustomPrompt("Pour confirmer la suppression DÉFINITIVE, veuillez taper \"RESET\" ci-dessous :", (typedValue) => {
                        if (typedValue === "RESET") {
                            onFinalConfirm();
                        } else if (typedValue !== null) {
                            showMessage("Réinitialisation annulée. Le texte de confirmation était incorrect.", "warning");
                        } else {
                             showMessage("Réinitialisation annulée.", "info");
                        }
                    });
                },
                null,
                "CONFIRMATION REQUISE",
                "btn-danger",
                "Oui, je comprends les risques"
            );
        });
    }

    // --- INITIALISATION ---
    updateDateTimeDisplay();
    setInterval(updateDateTimeDisplay, 1000);
    setInitialState();
});
