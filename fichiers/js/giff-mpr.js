document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURATION ET INITIALISATION FIREBASE ---
    const firebaseConfig = {
        apiKey: "AIzaSyCfm_Rq_lma5JVsWRt_qLxpUvgEQ4I6k5g", // Remplacez par votre clé réelle
        authDomain: "giffmpr-test.firebaseapp.com",
        databaseURL: "https://giffmpr-test-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: "giffmpr-test",
        storageBucket: "giffmpr-test.appspot.com", // Habituellement .appspot.com
        messagingSenderId: "348590054088",
        appId: "1:348590054088:web:22639eeebdb6ea4050a3fd",
        measurementId: "G-FNH1VZRJ34"
    };
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();

    // --- SÉLECTEURS D'ÉLÉMENTS ---
    const topLoginBtn = document.getElementById('top-login-btn');
    const adminOnlyTabs = document.querySelectorAll('.admin-only');
    const adminOnlyFlexContainers = document.querySelectorAll('.admin-only-flex');
    const headerPersonnelControls = document.getElementById('header-personnel-controls');
    const headerCalendarControls = document.getElementById('header-calendar-controls');
    const headerStatsControls = document.getElementById('header-stats-controls');
    const headerTeamsControls = document.getElementById('header-teams-controls');
    const personnelView = document.getElementById('personnel-view');
    const calendarView = document.getElementById('calendar-view');
    const statsView = document.getElementById('stats-view');
    const personnelList = document.getElementById('personnel-list');
    const statsList = document.getElementById('stats-list');
    const addPersonnelBtn = document.getElementById('add-personnel-btn');
    const searchInput = document.getElementById('searchInput');
    const filterInput = document.getElementById('filterInput');
    const statsSearchInput = document.getElementById('statsSearchInput');
    const statsFilterInput = document.getElementById('statsFilterInput');
    const teamsSearchInput = document.getElementById('teamsSearchInput');
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
    const matriculeConfirmModal = document.getElementById('matricule-confirm-modal');
    const matriculeInput = document.getElementById('matricule-input');
    const matriculeOkBtn = document.getElementById('matricule-ok-btn');
    const matriculeCancelBtn = document.getElementById('matricule-cancel-btn');
    const calendarDaysContainer = document.querySelector('#calendar-view .calendar-days');
    const calendarMonthPicker = document.querySelector('#calendar-view #month-picker');
    const calendarYearHeader = document.querySelector('#calendar-view #year');
    const calendarPreYearBtn = document.querySelector('#calendar-view #pre-year');
    const calendarNextYearBtn = document.querySelector('#calendar-view #next-year');
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');
    const dispoDayText = document.querySelector('#calendar-view .day-text-formate');
    const dispoTimeText = document.querySelector('#calendar-view .time-formate');
    const dispoDateText = document.querySelector('#calendar-view .date-formate');
    const calendarPersonnelSelector = document.getElementById('calendar-personnel-selector');
    const calendarSearchInput = document.getElementById('calendar-search-input');
    const calendarSearchResults = document.getElementById('calendar-search-results');
    const selectedPersonnelName = document.getElementById('selected-personnel-name');
    const deselectPersonnelBtn = document.getElementById('deselect-personnel-btn');
    const teamsView = document.getElementById('teams-view');
    const teamsCalendarDaysContainer = document.getElementById('teams-calendar-days');
    const generatedTeamsContainer = document.getElementById('generated-teams-container');
    const potentialReplacementsContainer = document.getElementById('potential-replacements-container');
    const eventTypeModal = document.getElementById('event-type-modal');
    const eventTypeForm = document.getElementById('event-type-form');
    const eventModalTitle = document.getElementById('event-modal-title');
    const eventDateInput = document.getElementById('event-date');
    const eventCancelBtn = document.getElementById('event-cancel-btn');
    const teamsMonthPicker = document.querySelector('#teams-view #teams-month-picker');
    const teamsPrevMonthBtn = document.getElementById('teams-prev-month-btn');
    const teamsNextMonthBtn = document.getElementById('teams-next-month-btn');
    const exportProposalsBtn = document.getElementById('export-proposals-btn');
    const exportActivatedBtn = document.getElementById('export-activated-btn');
    const replacePersonnelModal = document.getElementById('replace-personnel-modal');
    const replaceModalTitle = document.getElementById('replace-modal-title');
    const roleToReplaceEl = document.getElementById('role-to-replace');
    const replacementOptionsContainer = document.getElementById('replacement-options-container');
    const manualReplacementNameInput = document.getElementById('manual-replacement-name');

    // --- ÉTAT GLOBAL ---
    let allPersonnel = {};
    let allAvailabilities = {};
    let allEvents = {};
    let allAssignedTeams = {};
    let selectedPersonnel = null;
    let isAdmin = false;
    let availabilityDeadline = null;
    let selectedTeamDate = null;
    let currentReplacementInfo = {};
    let currentWorkingTeam = null;
    let matriculeSessionAuth = {};

    // --- CORRECTION : GESTION CENTRALISÉE DES CLICS SUR LA MODALE DE REMPLACEMENT ---
    if (replacePersonnelModal) {
        replacePersonnelModal.addEventListener('click', (e) => {
            // Clic sur le bouton d'ajout manuel
            if (e.target.id === 'manual-replacement-btn') {
                e.preventDefault(); // Empêche tout comportement par défaut du bouton
                const manualName = manualReplacementNameInput.value.trim();
                if (manualName) {
                    performReplacement(`MANUAL:${manualName}`);
                } else {
                    showMessage("Veuillez entrer un nom pour l'ajout manuel.", "warning");
                }
            }
            // Clic sur le bouton Annuler
            if (e.target.id === 'replace-cancel-btn') {
                closeModal(replacePersonnelModal);
            }
            // Clic sur le bouton de fermeture (X)
            if (e.target.classList.contains('close-button')) {
                closeModal(replacePersonnelModal);
            }
        });
    }

    // --- FONCTIONS UTILITAIRES ---
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
        genericConfirmOkBtn.className = 'btn-primary'; 
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

    const toBase64 = (str) => str ? btoa(unescape(encodeURIComponent(str))) : "";
    const fromBase64 = (str) => str ? decodeURIComponent(escape(atob(str))) : "";
    const openModal = (modal) => modal.classList.add('visible');
    const closeModal = (modal) => modal.classList.remove('visible');

    // --- LOGIQUE POUR LES MENUS DÉROULANTS DE RECHERCHE ---
    function setupSearchDropdown(arrow) {
        const wrapper = arrow.closest('.search-wrapper');
        if (!wrapper) return;
        const listContainer = wrapper.querySelector('.search-results-list, #calendar-search-results');
        const searchInputEl = wrapper.querySelector('input');

        if (!listContainer || !searchInputEl) return;

        arrow.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = listContainer.classList.toggle('visible');
            arrow.classList.toggle('open', isVisible);

            document.querySelectorAll('.search-results-list.visible, #calendar-search-results.visible').forEach(otherList => {
                if (otherList !== listContainer) {
                    otherList.classList.remove('visible');
                    const otherArrow = otherList.closest('.search-wrapper')?.querySelector('.dropdown-arrow');
                    if (otherArrow) otherArrow.classList.remove('open');
                }
            });

            if (isVisible) {
                populatePersonnelListForInput(listContainer, searchInputEl);
            }
        });
    }

    function populatePersonnelListForInput(listContainer, searchInputEl) {
        listContainer.innerHTML = '';
        const personnelArray = Object.entries(allPersonnel).map(([id, p]) => ({
            id,
            nom: fromBase64(p.nom),
            prenom: fromBase64(p.prenom)
        }));

        personnelArray.sort((a, b) => a.nom.localeCompare(b.nom));

        personnelArray.forEach(p => {
            const fullName = `${p.nom} ${p.prenom}`;
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.textContent = fullName;
            item.dataset.id = p.id;
            item.addEventListener('click', () => {
                if (searchInputEl.id === 'calendar-search-input') {
                    matriculeSessionAuth = {};
                    selectedPersonnel = { id: p.id, nom: toBase64(p.nom), prenom: toBase64(p.prenom) };
                    if(selectedPersonnelName) selectedPersonnelName.textContent = fullName;
                    if(headerCalendarControls) headerCalendarControls.classList.add('person-selected');
                    searchInputEl.value = '';
                    generateCalendar(currentMonth.value, currentYear.value);
                } else {
                    searchInputEl.value = fullName;
                    searchInputEl.dispatchEvent(new Event('input', { bubbles: true }));
                }
                listContainer.classList.remove('visible');
                const arrow = searchInputEl.closest('.search-wrapper')?.querySelector('.dropdown-arrow');
                if (arrow) arrow.classList.remove('open');
            });
            listContainer.appendChild(item);
        });
    }

    // --- LOGIQUE DE NAVIGATION ---
    function moveIndicator(element) {
        if (!element || !indicator || !navUl) return; // Added navUl check here for safety
        setTimeout(() => {
            const E_width = element.offsetWidth;
            const E_left = element.offsetLeft;
            const i_width = indicator.offsetWidth;
            const newX = (E_width / 2 - i_width / 2) + E_left;
            
            navUl.style.setProperty("--indicator-x-pos", `${newX}px`);
            navUl.classList.add("indicator-ready"); // Crucial for visibility
            
            const shockwave = indicator.querySelector(".shockwave") || document.createElement("div");
            shockwave.className = "shockwave";
            indicator.innerHTML = ""; // Clear previous icon
            indicator.appendChild(shockwave);
            const icon = element.querySelector(".icon ion-icon");
            if (icon) {
                 const clonedIcon = icon.cloneNode(true);
                 indicator.appendChild(clonedIcon);
            }
            indicator.classList.remove("landed"); // Reset for animation
            // Add landed class after a short delay for shockwave effect to replay if needed
             setTimeout(() => indicator.classList.add("landed"), 50);

        }, 50);
    }
    
    // --- GESTION DE L'AUTHENTIFICATION ET DE L'UI ---
    const ADMIN_PASSWORD = "Aspf66220*"; 
    function updateAdminUI() {
        const loginIcon = topLoginBtn.querySelector('ion-icon');
        let currentActiveLi = document.querySelector('.navigation .list.active');
        const exportControls = document.getElementById('teams-export-controls');
        const exportProposalsBtn = document.getElementById('export-proposals-btn');
    
        if (isAdmin) {
            adminOnlyTabs.forEach(tab => tab.style.display = 'list-item');
            adminOnlyFlexContainers.forEach(container => container.style.display = 'flex');
            loginIcon.setAttribute('name', 'log-out-outline');
            topLoginBtn.setAttribute('title', 'Déconnexion');
        } else {
            adminOnlyTabs.forEach(tab => tab.style.display = 'none');
            adminOnlyFlexContainers.forEach(container => {
                if (container.id !== 'teams-export-controls') {
                    container.style.display = 'none';
                }
            });
            loginIcon.setAttribute('name', 'log-in-outline');
            topLoginBtn.setAttribute('title', 'Connexion');
    
            if (exportControls) {
                exportControls.style.display = 'flex';
                if (exportProposalsBtn) {
                    exportProposalsBtn.style.display = 'none';
                }
            }
    
            if (currentActiveLi && currentActiveLi.classList.contains('admin-only') && currentActiveLi.style.display === 'none') {
                setActiveTab(navItems[0]); // This handles view update and calls moveIndicator
                return; // setActiveTab takes care of the indicator
            }
        }
    
        // Ensure indicator is updated for the tab that is finally active
        currentActiveLi = document.querySelector('.navigation .list.active'); // Re-query for the true active tab
        if (currentActiveLi) {
            moveIndicator(currentActiveLi);
        } else if (navItems.length > 0) {
            setActiveTab(navItems[0]); // Fallback
        }
    }
    
    if(topLoginBtn) topLoginBtn.addEventListener('click', () => {
        if (isAdmin) {
            isAdmin = false;
            sessionStorage.removeItem('isAdmin');
            matriculeSessionAuth = {}; 
            showMessage('Vous avez été déconnecté.', 'warning');
            updateAdminUI(); // This will adjust UI and indicator
            // updateActiveView should be called based on the new active tab, which updateAdminUI handles
            const activeTab = document.querySelector('.navigation .list.active');
            if (activeTab) updateActiveView(activeTab); // Update content for the new active tab
        } else {
            showCustomPrompt("Veuillez entrer le mot de passe administrateur :", (password) => {
                if (password === ADMIN_PASSWORD) {
                    isAdmin = true;
                    sessionStorage.setItem('isAdmin', 'true');
                    matriculeSessionAuth = {};
                    showMessage('Connexion réussie !', 'success');
                    updateAdminUI(); // This will adjust UI and indicator
                    const activeTab = document.querySelector('.navigation .list.active');
                    if (activeTab) updateActiveView(activeTab); // Update content for the current (or new) active tab
                } else if (password !== null) {
                    showMessage('Mot de passe incorrect.', 'error');
                }
            });
        }
    });
    if (sessionStorage.getItem('isAdmin') === 'true') { isAdmin = true; }

    // --- GESTION DE LA DATE LIMITE ---
    const deadlineRef = database.ref('config/deadline');
    if(saveDeadlineBtn) {
        saveDeadlineBtn.addEventListener('click', () => {
            if (!isAdmin) return;
            const newDeadline = deadlineInput.value;
            deadlineRef.set(newDeadline || null).then(() => showMessage('Date et heure limites enregistrées !', 'success')).catch(err => showMessage('Erreur: ' + err.message, 'error'));
        });
    }
    deadlineRef.on('value', (snapshot) => {
        availabilityDeadline = snapshot.val();
        if (availabilityDeadline) {
            if(deadlineInput) deadlineInput.value = availabilityDeadline;
            const dateObj = new Date(availabilityDeadline);
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            const formattedDate = new Intl.DateTimeFormat('fr-FR', options).format(dateObj);
            if(deadlineMessage) {
                deadlineMessage.innerHTML = `Date et heure limites pour la saisie : <strong>${formattedDate}</strong>`;
                deadlineMessage.style.display = 'block';
            }
        } else {
            if(deadlineMessage) deadlineMessage.style.display = 'none';
            if(deadlineInput) deadlineInput.value = '';
        }
    });

    // --- FONCTIONS UTILITAIRES ET GESTION MODALS (Suite) ---
    if(addPersonnelBtn) addPersonnelBtn.addEventListener('click', () => {
        if (!isAdmin) return;
        if(personnelForm) personnelForm.reset();
        if(personnelIdInput) personnelIdInput.value = '';
        if(modalTitle) modalTitle.textContent = 'Ajouter du Personnel';
        if(submitBtn) submitBtn.textContent = 'Ajouter';
        if(personnelModal) openModal(personnelModal);
    });
    if (closeButton) closeButton.addEventListener('click', () => closeModal(personnelModal));
    if (confirmCancelBtn) confirmCancelBtn.addEventListener('click', () => closeModal(confirmModal));
    if (eventTypeModal && eventTypeModal.querySelector('.close-button')) {
        eventTypeModal.querySelector('.close-button').addEventListener('click', () => closeModal(eventTypeModal));
    }
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

        if (!e.target.closest('.search-wrapper')) {
            document.querySelectorAll('.search-results-list.visible, #calendar-search-results.visible').forEach(list => {
                list.classList.remove('visible');
                const arrow = list.closest('.search-wrapper')?.querySelector('.dropdown-arrow');
                if (arrow) arrow.classList.remove('open');
            });
        }
    });

    // --- LOGIQUE DE GESTION DU PERSONNEL ---
    if(personnelForm) personnelForm.addEventListener('submit', (e) => {
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
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
        const filterTerm = filterInput ? filterInput.value : "";

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
            const fullName = `${p.nom} ${p.prenom}`;
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
        document.querySelectorAll('.dropdown-arrow').forEach(setupSearchDropdown);

        const activeTabEl = document.querySelector('.navigation .list.active');
        if (activeTabEl) updateActiveView(activeTabEl);
    });

    if(personnelList) personnelList.addEventListener('click', (e) => {
        if (!isAdmin) return;
        const target = e.target.closest('.action-btn'); if (!target) return; const id = target.dataset.id;
        if (target.classList.contains('delete-btn')) { if(confirmDeleteBtn) confirmDeleteBtn.dataset.id = id; if(document.getElementById('confirm-message')) document.getElementById('confirm-message').textContent = "Êtes-vous sûr de vouloir supprimer ce personnel ? Cette action est irréversible."; if(confirmModal) openModal(confirmModal); }
        if (target.classList.contains('edit-btn')) {
            database.ref('personnel/' + id).once('value', (snapshot) => {
                const data = snapshot.val();
                if(data){
                    document.getElementById('nom').value = fromBase64(data.nom); document.getElementById('prenom').value = fromBase64(data.prenom); document.getElementById('commentaire').value = fromBase64(data.commentaire || "");
                    document.getElementById('matricule').value = fromBase64(data.matricule || "");
                    document.querySelectorAll('input[name="fonctions"]').forEach(cb => cb.checked = false);
                    if (data.fonctions) { data.fonctions.map(f => fromBase64(f)).forEach(func => { const checkbox = document.querySelector(`#personnel-form input[value="${func}"]`); if (checkbox) checkbox.checked = true; }); }
                    if(personnelIdInput) personnelIdInput.value = id; if(modalTitle) modalTitle.textContent = 'Modifier le Personnel'; if(submitBtn) submitBtn.textContent = 'Modifier'; if(personnelModal) openModal(personnelModal);
                }
            });
        }
    });
    if(confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', () => {
        if (!isAdmin) return;
        const idToDelete = confirmDeleteBtn.dataset.id;
        if (idToDelete) { database.ref('personnel/' + idToDelete).remove().then(() => showMessage('Personnel supprimé.', 'success')); closeModal(confirmModal); }
    });
    if (searchInput) searchInput.addEventListener('input', () => renderPersonnel(allPersonnel));
    if (filterInput) filterInput.addEventListener('change', () => renderPersonnel(allPersonnel));
    
    if (calendarSearchInput) calendarSearchInput.addEventListener('input', () => {
        const searchTermText = calendarSearchInput.value.toLowerCase();
        const arrow = calendarSearchInput.closest('.search-wrapper')?.querySelector('.dropdown-arrow');

        if (searchTermText.length === 0) {
            if(calendarSearchResults) calendarSearchResults.classList.remove('visible');
            if (arrow) arrow.classList.remove('open');
            return;
        }

        if(calendarSearchResults) {
            calendarSearchResults.innerHTML = '';
            calendarSearchResults.classList.add('visible');
        }
        if (arrow) arrow.classList.add('open');

        const filteredPersonnel = Object.entries(allPersonnel).filter(([id, p]) => {
            const fullName = `${fromBase64(p.nom)} ${fromBase64(p.prenom)}`;
            return fullName.toLowerCase().includes(searchTermText);
        });

        filteredPersonnel.forEach(([id, pData]) => {
            const p = { id, nom: fromBase64(pData.nom), prenom: fromBase64(pData.prenom) };
            const fullName = `${p.nom} ${p.prenom}`;
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.textContent = fullName;
            item.dataset.id = p.id;
            item.addEventListener('click', () => {
                matriculeSessionAuth = {};
                selectedPersonnel = { id: p.id, nom: toBase64(p.nom), prenom: toBase64(p.prenom) };
                if(selectedPersonnelName) selectedPersonnelName.textContent = fullName;
                if(headerCalendarControls) headerCalendarControls.classList.add('person-selected');
                calendarSearchInput.value = '';
                if(calendarSearchResults) calendarSearchResults.classList.remove('visible');
                if (arrow) arrow.classList.remove('open');
                generateCalendar(currentMonth.value, currentYear.value);
            });
            if(calendarSearchResults) calendarSearchResults.appendChild(item);
        });
    });

    if(deselectPersonnelBtn) deselectPersonnelBtn.addEventListener('click', () => {
        selectedPersonnel = null;
        matriculeSessionAuth = {};
        if(selectedPersonnelName) selectedPersonnelName.textContent = 'Aucun';
        if(headerCalendarControls) headerCalendarControls.classList.remove('person-selected');
        generateCalendar(currentMonth.value, currentYear.value);
    });

    // --- LOGIQUE DE NAVIGATION (Mise à jour) ---
    function updateActiveView(activeItem) {
        document.querySelectorAll('.view-container').forEach(v => v.classList.remove('visible'));
        document.querySelectorAll('.header-controls').forEach(c => c.style.display = 'none');
        if(addPersonnelBtn) addPersonnelBtn.classList.remove('visible');

        const activeTabText = activeItem.querySelector('.text b').textContent.trim();

        if (activeTabText === 'Gestion Personnels' && isAdmin) {
            if(personnelView) personnelView.classList.add('visible');
            if(addPersonnelBtn) addPersonnelBtn.classList.add('visible');
            if(headerPersonnelControls) headerPersonnelControls.style.display = 'flex';
            renderPersonnel(allPersonnel);
        } else if (activeTabText === 'Disponibilités') {
            if(calendarView) calendarView.classList.add('visible');
            if(headerCalendarControls) headerCalendarControls.style.display = 'flex';
            generateCalendar(currentMonth.value, currentYear.value);
        } else if (activeTabText === 'Paramètres' && isAdmin) {
            if(settingsView) settingsView.classList.add('visible');
        } else if (activeTabText === 'Équipes') {
            if(teamsView) teamsView.classList.add('visible');
            if(headerTeamsControls) headerTeamsControls.style.display = 'flex';
            generateTeamsCalendar(teamsCurrentMonth.value, teamsCurrentYear.value);
            if (selectedTeamDate) {
                generateAndDisplayTeams(selectedTeamDate);
            } else {
                if(generatedTeamsContainer) generatedTeamsContainer.innerHTML = `<div id="teams-placeholder"><ion-icon name="calendar-clear-outline"></ion-icon><h3>Sélectionnez un jour</h3><p>Cliquez sur une date pour voir les équipes.</p></div>`;
                if(potentialReplacementsContainer) potentialReplacementsContainer.innerHTML = '';
            }
        } else if (activeTabText === 'Statistiques' && isAdmin) {
            if (statsView) {
                statsView.classList.add('visible');
                if (headerStatsControls) headerStatsControls.style.display = 'flex';
                renderGlobalStatistics();
                renderStatistics();
            } else {
                if(calendarView) calendarView.classList.add('visible');
                if(headerCalendarControls) headerCalendarControls.style.display = 'flex';
                generateCalendar(currentMonth.value, currentYear.value);
            }
        } else { 
            if(calendarView) calendarView.classList.add('visible');
            if(headerCalendarControls) headerCalendarControls.style.display = 'flex';
            generateCalendar(currentMonth.value, currentYear.value);
        }
    }

    function setActiveTab(tabElement) {
        if (!tabElement || tabElement.classList.contains('active')) return;
        if(navUl) navUl.classList.remove("indicator-ready");
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
    if(indicator) indicator.addEventListener("transitionend", (e) => { if (e.propertyName === "transform" && navUl && navUl.classList.contains("indicator-ready")) { indicator.classList.add("landed"); } });

    function setInitialState() {
        updateAdminUI(); // Handles initial tab visibility, potential switch, and indicator.
    
        const activeItem = document.querySelector(".navigation .list.active");
        if (activeItem) {
            updateActiveView(activeItem); // Ensure view content matches the active tab.
        } else if (navItems.length > 0) {
            // This fallback ensures if updateAdminUI somehow didn't set an active tab,
            // the first tab is made active and its view is shown.
            setActiveTab(navItems[0]);
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
        if(calendarMonthPicker) calendarMonthPicker.innerHTML = month_names[month];
        if(calendarYearHeader) calendarYearHeader.innerHTML = year;
        let first_day = new Date(year, month, 1);
        let day_offset = (first_day.getDay() + 6) % 7; 
        for (let i = 0; i < days_of_month[month] + day_offset; i++) {
            let day = document.createElement('div');
            if (i >= day_offset) {
                const dayNumber = i - day_offset + 1;
                const dateId = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
                day.innerHTML = `<span class="day-number">${dayNumber}</span>`;
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

    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentMonth.value--;
            if (currentMonth.value < 0) { currentMonth.value = 11; currentYear.value--; }
            generateCalendar(currentMonth.value, currentYear.value);
        });
    }
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            currentMonth.value++;
            if (currentMonth.value > 11) { currentMonth.value = 0; currentYear.value++; }
            generateCalendar(currentMonth.value, currentYear.value);
        });
    }

    if (calendarPreYearBtn) calendarPreYearBtn.onclick = () => { --currentYear.value; generateCalendar(currentMonth.value, currentYear.value); };
    if (calendarNextYearBtn) calendarNextYearBtn.onclick = () => { ++currentYear.value; generateCalendar(currentMonth.value, currentYear.value); };

    function setAvailability(dateId) {
        const availabilityRef = database.ref(`availabilities/${dateId}/${selectedPersonnel.id}`);
        availabilityRef.once('value', (snapshot) => {
            if (snapshot.exists()) {
                availabilityRef.remove();
            } else {
                availabilityRef.set({ nom: selectedPersonnel.nom, prenom: selectedPersonnel.prenom });
            }
        });
    }

    function promptForMatricule(dateId) {
        if(matriculeInput) matriculeInput.value = '';
        if(matriculeConfirmModal) openModal(matriculeConfirmModal);
        if(matriculeInput) matriculeInput.focus();

        if(matriculeOkBtn) matriculeOkBtn.onclick = () => {
            const enteredMatricule = matriculeInput.value;
            if (!enteredMatricule) { showMessage("Veuillez entrer votre matricule.", "error"); return; }
            const correctMatricule = fromBase64(allPersonnel[selectedPersonnel.id].matricule || "");
            if (!correctMatricule) {
                showMessage("Aucun matricule n'est configuré pour ce compte. Contactez un administrateur.", "error");
                closeModal(matriculeConfirmModal); return;
            }
            if (enteredMatricule === correctMatricule) {
                matriculeSessionAuth[selectedPersonnel.id] = true;
                showMessage(`Bonjour ${fromBase64(selectedPersonnel.prenom)}, vous êtes authentifié.`, "success");
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
                showMessage("La date limite de saisie est dépassée.", "error"); return;
            }
            if (!selectedPersonnel) { showMessage("Veuillez d'abord vous sélectionner dans la liste.", "warning"); return; }
            const dateId = dayDiv.dataset.date;
            if (isAdmin || matriculeSessionAuth[selectedPersonnel.id]) {
                setAvailability(dateId);
            } else {
                promptForMatricule(dateId);
            }
        });
    }

    database.ref('availabilities').on('value', (snapshot) => {
        allAvailabilities = snapshot.val() || {};
        const activeTabEl = document.querySelector('.navigation .list.active');
        if (activeTabEl) updateActiveView(activeTabEl);
    });

    // --- LOGIQUE POUR LE CALENDRIER DES ÉQUIPES ---
    let teamsCurrentMonth = { value: currentDate.getMonth() };
    let teamsCurrentYear = { value: currentDate.getFullYear() };
    const ROLES = { CCF_DRIVER: "Conducteur Poids Lourd (CCF4MHP37)", CCF_LEADER: "Chef d'Agrès FDF (CCF4MHP37)", CCF_TEAMMATE: "Équipier FDF (CCF4MHP37)", MPR_DRIVER: "Conducteur Voiture (MPR12)", MPR_TEAMMATE: "Équipier DIV (MPR12)" };

    function getTeamStatusForDate(dateId) {
        let status = { ccfStatus: 'not-applicable', mprStatus: 'not-applicable' };
        const eventDetails = allEvents[dateId];
        const hasAvailabilities = allAvailabilities[dateId] && Object.keys(allAvailabilities[dateId]).length > 0;

        if (!eventDetails && !hasAvailabilities) return status;

        let wantsCcf = false, wantsMpr = false;
        if (eventDetails && eventDetails.types && eventDetails.types.length > 0) {
            wantsCcf = eventDetails.types.some(type => type.startsWith("GIFF Nord"));
            wantsMpr = eventDetails.types.includes("MPR");
        } else if (hasAvailabilities) {
            wantsCcf = true; wantsMpr = true;
        }

        let teamToCheck;
        if (allAssignedTeams[dateId]) teamToCheck = allAssignedTeams[dateId];
        else if (hasAvailabilities) teamToCheck = generateProvisionalTeam(dateId, wantsCcf, wantsMpr);
        
        if (!teamToCheck) {
            if (wantsCcf) status.ccfStatus = 'incomplete';
            if (wantsMpr) status.mprStatus = 'incomplete';
            return status;
        }
        if (wantsCcf && teamToCheck.ccfTeam) {
            const ccf = teamToCheck.ccfTeam;
            const isCcfComplete = ccf[ROLES.CCF_DRIVER] && ccf[ROLES.CCF_LEADER] && ccf[ROLES.CCF_TEAMMATE] && ccf[ROLES.CCF_TEAMMATE].length === 2 && ccf[ROLES.CCF_TEAMMATE].every(id => id !== null);
            status.ccfStatus = isCcfComplete ? 'complete' : 'incomplete';
        } else if (wantsCcf) {
            status.ccfStatus = 'incomplete';
        }

        if (wantsMpr && teamToCheck.mprTeam) {
            const mpr = teamToCheck.mprTeam;
            const isMprComplete = mpr[ROLES.MPR_DRIVER] && mpr[ROLES.MPR_TEAMMATE];
            status.mprStatus = isMprComplete ? 'complete' : 'incomplete';
        } else if (wantsMpr) {
            status.mprStatus = 'incomplete';
        }
        return status;
    }

    const generateTeamsCalendar = (month, year) => {
        if (!teamsCalendarDaysContainer || !teamsMonthPicker || !document.querySelector('#teams-view #teams-year')) return;
        teamsCalendarDaysContainer.innerHTML = '';
        teamsMonthPicker.innerHTML = month_names[month];
        document.querySelector('#teams-view #teams-year').innerHTML = year;
        
        let days_of_month = [31, getFebDays(year), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        let first_day = new Date(year, month, 1);
        let day_offset = (first_day.getDay() + 6) % 7;
        const searchTerm = teamsSearchInput ? teamsSearchInput.value.toLowerCase().trim() : "";
        let searchedPersonnelId = null;

        if (searchTerm) {
            for (const id in allPersonnel) {
                const p = allPersonnel[id];
                if (`${fromBase64(p.nom)} ${fromBase64(p.prenom)}`.toLowerCase().includes(searchTerm)) {
                    searchedPersonnelId = id; 
                    break; 
                }
            }
        }

        for (let i = 0; i < days_of_month[month] + day_offset; i++) {
            let day = document.createElement('div');
            if (i >= day_offset) {
                const dayNumber = i - day_offset + 1;
                const dateId = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
                day.innerHTML = `<span class="day-number">${dayNumber}</span>`;
                day.dataset.date = dateId;
                if (dateId === selectedTeamDate) day.classList.add('selected-day');
                
                const teamStatus = getTeamStatusForDate(dateId);
                if (teamStatus.ccfStatus === 'complete') day.classList.add('ccf-complete');
                else if (teamStatus.ccfStatus === 'incomplete') day.classList.add('ccf-incomplete');
                if (teamStatus.mprStatus === 'complete') day.classList.add('mpr-complete');
                else if (teamStatus.mprStatus === 'incomplete') day.classList.add('mpr-incomplete');

                if (searchedPersonnelId) {
                    let isPresent = false;
                    if (allAssignedTeams[dateId]) {
                        const teams = allAssignedTeams[dateId];
                        if (teams.ccfTeam && Object.values(teams.ccfTeam).flat().includes(searchedPersonnelId)) isPresent = true;
                        if (!isPresent && teams.mprTeam && Object.values(teams.mprTeam).flat().includes(searchedPersonnelId)) isPresent = true;
                    } else if (allAvailabilities[dateId] && allAvailabilities[dateId][searchedPersonnelId]) {
                        isPresent = true;
                    }
                    if (isPresent) day.classList.add('day-highlighted-for-search');
                }
                if (allAssignedTeams[dateId]) {
                    day.classList.add('is-activated');
                    day.innerHTML += '<span class="activated-text">Activé</span>';
                }
                if (dayNumber === new Date().getDate() && year === new Date().getFullYear() && month === new Date().getMonth()) day.classList.add('current-date');
            } else { day.classList.add('empty'); }
            teamsCalendarDaysContainer.appendChild(day);
        }
    };

    if(teamsSearchInput) teamsSearchInput.addEventListener('input', () => generateTeamsCalendar(teamsCurrentMonth.value, teamsCurrentYear.value));
    if(teamsCalendarDaysContainer) teamsCalendarDaysContainer.addEventListener('click', (e) => {
        const dayDiv = e.target.closest('div:not(.empty)');
        if (!dayDiv) return;
        selectedTeamDate = dayDiv.dataset.date;
        generateTeamsCalendar(teamsCurrentMonth.value, teamsCurrentYear.value);
        generateAndDisplayTeams(selectedTeamDate);
    });
    if (teamsPrevMonthBtn) teamsPrevMonthBtn.addEventListener('click', () => { teamsCurrentMonth.value--; if (teamsCurrentMonth.value < 0) { teamsCurrentMonth.value = 11; teamsCurrentYear.value--; } generateTeamsCalendar(teamsCurrentMonth.value, teamsCurrentYear.value); });
    if (teamsNextMonthBtn) teamsNextMonthBtn.addEventListener('click', () => { teamsCurrentMonth.value++; if (teamsCurrentMonth.value > 11) { teamsCurrentMonth.value = 0; teamsCurrentYear.value++; } generateTeamsCalendar(teamsCurrentMonth.value, teamsCurrentYear.value); });
    
    const teamsPreYearBtn = document.querySelector('#teams-view #teams-pre-year');
    const teamsNextYearBtn = document.querySelector('#teams-view #teams-next-year');
    if(teamsPreYearBtn) teamsPreYearBtn.onclick = () => { --teamsCurrentYear.value; generateTeamsCalendar(teamsCurrentMonth.value, teamsCurrentYear.value); };
    if(teamsNextYearBtn) teamsNextYearBtn.onclick = () => { ++teamsCurrentYear.value; generateTeamsCalendar(teamsCurrentMonth.value, teamsCurrentYear.value); };


    function openEventModal(dateId, isActivation = false) {
        if (!eventTypeModal || !eventTypeForm || !eventDateInput || !eventModalTitle) return;
        eventTypeForm.reset();
        eventDateInput.value = dateId;
        eventTypeForm.dataset.isActivation = isActivation;
        const [year, month, day] = dateId.split('-');
        eventModalTitle.textContent = `Événement du ${day} ${month_names[parseInt(month) - 1]}`;
        if (allEvents[dateId] && allEvents[dateId].types) {
            allEvents[dateId].types.forEach(type => { const checkbox = eventTypeForm.querySelector(`input[name="eventTypes"][value="${type}"]`); if (checkbox) checkbox.checked = true; });
        }
        openModal(eventTypeModal);
    }
    if(eventTypeForm) eventTypeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!isAdmin) return;
        const dateId = eventDateInput.value;
        const selectedTypes = Array.from(eventTypeForm.querySelectorAll('input[name="eventTypes"]:checked')).map(cb => cb.value);
        const eventRef = database.ref(`events/${dateId}`);
        const isActivation = eventTypeForm.dataset.isActivation === 'true';

        if (selectedTypes.length > 0) {
            const promises = [eventRef.set({ types: selectedTypes })];
            if (isActivation && currentWorkingTeam) {
                const teamToFreeze = JSON.parse(JSON.stringify(currentWorkingTeam));
                const wantsCcf = selectedTypes.some(type => type.startsWith("GIFF Nord"));
                const wantsMpr = selectedTypes.includes("MPR");
                const finalTeamToFreeze = {};
                finalTeamToFreeze.ccfTeam = (wantsCcf && teamToFreeze.ccfTeam) ? teamToFreeze.ccfTeam : null;
                finalTeamToFreeze.mprTeam = (wantsMpr && teamToFreeze.mprTeam) ? teamToFreeze.mprTeam : null;
                if (finalTeamToFreeze.ccfTeam || finalTeamToFreeze.mprTeam) {
                    promises.push(database.ref(`assignedTeams/${dateId}`).set(finalTeamToFreeze));
                } else {
                    promises.push(database.ref(`assignedTeams/${dateId}`).remove());
                }
            }
            Promise.all(promises)
                .then(() => { showMessage(isActivation ? 'Journée activée et équipe figée !' : 'Événement enregistré !', 'success'); closeModal(eventTypeModal); })
                .catch(err => showMessage('Erreur: ' + err.message, 'error'));
        } else {
            showGenericConfirmModal(
                "Supprimer cet événement désactivera également les équipes assignées pour cette date. Continuer ?",
                () => {
                    Promise.all([eventRef.remove(), database.ref(`assignedTeams/${dateId}`).remove()])
                        .then(() => { showMessage('Événement et équipes assignées supprimés.', 'warning'); closeModal(eventTypeModal); })
                        .catch(err => showMessage('Erreur: ' + err.message, 'error'));
                }, null, "Confirmation de suppression", "btn-danger", "Oui, supprimer"
            );
        }
    });

    database.ref('events').on('value', (snapshot) => {
        allEvents = snapshot.val() || {};
        const activeTabEl = document.querySelector('.navigation .list.active');
        if (activeTabEl) updateActiveView(activeTabEl);
    });

    database.ref('assignedTeams').on('value', (snapshot) => {
        allAssignedTeams = snapshot.val() || {};
        const activeTabEl = document.querySelector('.navigation .list.active');
        if (activeTabEl) updateActiveView(activeTabEl);
    });

    function createSeedFromDate(dateId) { let hash = 0; for (let i = 0; i < dateId.length; i++) { const char = dateId.charCodeAt(i); hash = ((hash << 5) - hash) + char; hash |= 0; } return hash; }
    function mulberry32(a) { let t = a += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }

    function generateProvisionalTeam(dateId, wantsCcf, wantsMpr) {
        let seed = createSeedFromDate(dateId);
        const availablePersonnelIds = Object.keys(allAvailabilities[dateId] || {});
        let availablePool = [...availablePersonnelIds];
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
                seed++; 
                const randomIndex = Math.floor(mulberry32(seed) * candidates.length); 
                const assignedId = candidates[randomIndex]; 
                const indexInPool = currentPool.indexOf(assignedId); 
                if (indexInPool > -1) currentPool.splice(indexInPool, 1); 
                return assignedId; 
            } 
            return null; 
        };
        let ccfTeam = { [ROLES.CCF_DRIVER]: null, [ROLES.CCF_LEADER]: null, [ROLES.CCF_TEAMMATE]: [null, null] };
        let mprTeam = { [ROLES.MPR_DRIVER]: null, [ROLES.MPR_TEAMMATE]: null };

        if (wantsCcf && !wantsMpr) { 
            ccfTeam[ROLES.CCF_DRIVER] = assignPersonnelForAuto(ROLES.CCF_DRIVER, availablePool, personnelByFunctionForDay); 
            ccfTeam[ROLES.CCF_LEADER] = assignPersonnelForAuto(ROLES.CCF_LEADER, availablePool, personnelByFunctionForDay); 
            ccfTeam[ROLES.CCF_TEAMMATE][0] = assignPersonnelForAuto(ROLES.CCF_TEAMMATE, availablePool, personnelByFunctionForDay); 
            ccfTeam[ROLES.CCF_TEAMMATE][1] = assignPersonnelForAuto(ROLES.CCF_TEAMMATE, availablePool, personnelByFunctionForDay); 
        } else if (!wantsCcf && wantsMpr) { 
            mprTeam[ROLES.MPR_DRIVER] = assignPersonnelForAuto(ROLES.MPR_DRIVER, availablePool, personnelByFunctionForDay); 
            mprTeam[ROLES.MPR_TEAMMATE] = assignPersonnelForAuto(ROLES.MPR_TEAMMATE, availablePool, personnelByFunctionForDay); 
        } else if (wantsCcf && wantsMpr) { 
            ccfTeam[ROLES.CCF_DRIVER] = assignPersonnelForAuto(ROLES.CCF_DRIVER, availablePool, personnelByFunctionForDay); 
            mprTeam[ROLES.MPR_DRIVER] = assignPersonnelForAuto(ROLES.MPR_DRIVER, availablePool, personnelByFunctionForDay); 
            ccfTeam[ROLES.CCF_LEADER] = assignPersonnelForAuto(ROLES.CCF_LEADER, availablePool, personnelByFunctionForDay); 
            ccfTeam[ROLES.CCF_TEAMMATE][0] = assignPersonnelForAuto(ROLES.CCF_TEAMMATE, availablePool, personnelByFunctionForDay); 
            mprTeam[ROLES.MPR_TEAMMATE] = assignPersonnelForAuto(ROLES.MPR_TEAMMATE, availablePool, personnelByFunctionForDay); 
            ccfTeam[ROLES.CCF_TEAMMATE][1] = assignPersonnelForAuto(ROLES.CCF_TEAMMATE, availablePool, personnelByFunctionForDay); 
        }
        return { ccfTeam: wantsCcf ? ccfTeam : null, mprTeam: wantsMpr ? mprTeam : null };
    }

    function generateAndDisplayTeams(dateId) {
        if(potentialReplacementsContainer) potentialReplacementsContainer.innerHTML = '';
        currentWorkingTeam = null;
        let wantsCcf = false, wantsMpr = false; let isProvisionalDisplayState = true;
        const eventDetails = allEvents[dateId];
        if (eventDetails && eventDetails.types && eventDetails.types.length > 0) { 
            wantsCcf = eventDetails.types.some(type => type.startsWith("GIFF Nord")); 
            wantsMpr = eventDetails.types.includes("MPR"); 
            isProvisionalDisplayState = false; 
        } else { 
            const availablePersonnelIdsForCheck = Object.keys(allAvailabilities[dateId] || {}); 
            if (availablePersonnelIdsForCheck.length > 0) { wantsCcf = true; wantsMpr = true; }
        }
        if (allAssignedTeams[dateId]) { 
            const assigned = allAssignedTeams[dateId]; 
            currentWorkingTeam = JSON.parse(JSON.stringify(assigned)); 
            const displayCcfFromFrozen = !!assigned.ccfTeam; 
            const displayMprFromFrozen = !!assigned.mprTeam; 
            renderTeams(dateId, assigned.ccfTeam, assigned.mprTeam, displayCcfFromFrozen, displayMprFromFrozen, true, false); 
            return; 
        }
        const availablePersonnelIds = Object.keys(allAvailabilities[dateId] || {});
        if (availablePersonnelIds.length === 0 && !(eventDetails && eventDetails.types && eventDetails.types.length > 0)) { 
             if(generatedTeamsContainer) generatedTeamsContainer.innerHTML = `<div id="teams-placeholder"><ion-icon name="close-circle-outline"></ion-icon><h3>Aucun personnel disponible</h3><p>Aucun personnel n'a indiqué de disponibilité pour cette date.</p></div>`;
             if(potentialReplacementsContainer) potentialReplacementsContainer.innerHTML = '';
             return;
        }
         if (availablePersonnelIds.length === 0 && (eventDetails && eventDetails.types && eventDetails.types.length > 0)) {
             let noPersonnelHtml = `<div class="teams-display-header"><h3>Équipes du ${dateId.split('-').reverse().join('/')}</h3>${generateEventTagsHtml(dateId)}<p style="text-align:center; margin-top:1rem; color:var(--fire-red);">Aucun personnel disponible pour former les équipes pour cet événement.</p></div>`;
             if(generatedTeamsContainer) generatedTeamsContainer.innerHTML = noPersonnelHtml;
             if(potentialReplacementsContainer) potentialReplacementsContainer.innerHTML = '';
             return;
         }
        const { ccfTeam, mprTeam } = generateProvisionalTeam(dateId, wantsCcf, wantsMpr);
        currentWorkingTeam = { ccfTeam, mprTeam };
        renderTeams(dateId, ccfTeam, mprTeam, wantsCcf, wantsMpr, false, isProvisionalDisplayState);
    }

    function generateEventTagsHtml(dateId) { 
        const eventInfo = allEvents[dateId]; 
        const assignedTeamInfo = allAssignedTeams[dateId]; 
        if (assignedTeamInfo) { 
            if (eventInfo && eventInfo.types && eventInfo.types.length > 0) { 
                return `<div class="event-tags">${eventInfo.types.map(t => `<span class="event-tag">${t}</span>`).join('')} <span class="event-tag provisional" style="background-color: var(--available-green);">Équipe Figée</span></div>`; 
            } else { 
                return `<div class="event-tags"><span class="event-tag provisional" style="background-color: var(--available-green);">Équipe Figée</span></div>`; 
            } 
        } else if (eventInfo && eventInfo.types && eventInfo.types.length > 0) { 
            return `<div class="event-tags">${eventInfo.types.map(t => `<span class="event-tag">${t}</span>`).join('')} <span class="event-tag" style="background-color: var(--provisional-blue);">Prévu (Non Figé)</span></div>`; 
        } 
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
            } else if (String(personnelId).startsWith('MANUAL:')) {
                const manualName = personnelId.substring(7);
                nameHtml = `<span class="personnel-name manual-entry"><ion-icon name="person-add-outline" style="vertical-align: middle; margin-right: 4px; color: var(--ember-orange);"></ion-icon>${manualName}</span>`;
            } else { 
                const p = allPersonnel[personnelId]; 
                nameHtml = p ? `<span class="personnel-name">${fromBase64(p.nom)} ${fromBase64(p.prenom)}</span>` : '<span class="personnel-name unassigned">Personnel Inconnu</span>';
            } 
            let replaceButtonHtml = ''; 
            if (isAdmin && isFrozen) { 
                replaceButtonHtml = `<button class="replace-personnel-btn" data-dateid="${dateId}" data-teamtype="${teamType}" data-rolekey="${roleKey}" data-currentpersonnelid="${personnelId || 'null'}" ${teammateIndex !== -1 ? `data-teammateindex="${teammateIndex}"` : ''} title="Remplacer/Assigner"><ion-icon name="swap-horizontal-outline"></ion-icon></button>`; 
            } 
            return `<div class="personnel-name-wrapper">${nameHtml}${replaceButtonHtml}</div>`; 
        };
        let teamsHtml = '', ccfHtml = '', mprHtml = '';
        if (displayCcf && ccfTeam) { 
            const isCcfComplete = ccfTeam[ROLES.CCF_DRIVER] && ccfTeam[ROLES.CCF_LEADER] && ccfTeam[ROLES.CCF_TEAMMATE] && ccfTeam[ROLES.CCF_TEAMMATE].length === 2 && ccfTeam[ROLES.CCF_TEAMMATE].every(id => id !== null); 
            ccfHtml = `<div class="team-card ${isCcfComplete ? '' : 'incomplete'}"><h4><ion-icon name="bus-outline"></ion-icon> Équipe CCF4MHP37</h4><div class="role"><span class="role-name">Conducteur PL:</span> ${getPersonnelNameAndButton(ccfTeam[ROLES.CCF_DRIVER], ROLES.CCF_DRIVER, 'ccf')}</div><div class="role"><span class="role-name">Chef d'Agrès FDF:</span> ${getPersonnelNameAndButton(ccfTeam[ROLES.CCF_LEADER], ROLES.CCF_LEADER, 'ccf')}</div><div class="role"><span class="role-name">Équipier FDF 1:</span> ${getPersonnelNameAndButton(ccfTeam[ROLES.CCF_TEAMMATE]?.[0], ROLES.CCF_TEAMMATE, 'ccf', 0)}</div><div class="role"><span class="role-name">Équipier FDF 2:</span> ${getPersonnelNameAndButton(ccfTeam[ROLES.CCF_TEAMMATE]?.[1], ROLES.CCF_TEAMMATE, 'ccf', 1)}</div></div>`; 
        }
        if (displayMpr && mprTeam) { 
            const isMprComplete = mprTeam[ROLES.MPR_DRIVER] && mprTeam[ROLES.MPR_TEAMMATE]; 
            mprHtml = `<div class="team-card ${isMprComplete ? '' : 'incomplete'}"><h4><ion-icon name="car-sport-outline"></ion-icon> Équipe MPR12</h4><div class="role"><span class="role-name">Conducteur VL:</span> ${getPersonnelNameAndButton(mprTeam[ROLES.MPR_DRIVER], ROLES.MPR_DRIVER, 'mpr')}</div><div class="role"><span class="role-name">Équipier DIV:</span> ${getPersonnelNameAndButton(mprTeam[ROLES.MPR_TEAMMATE], ROLES.MPR_TEAMMATE, 'mpr')}</div></div>`; 
        }
        teamsHtml = ccfHtml + mprHtml;
        if (teamsHtml === '') { 
            if (Object.keys(allAvailabilities[dateId] || {}).length > 0 || (allEvents[dateId] && allEvents[dateId].types && allEvents[dateId].types.length > 0) ) {
                 teamsHtml = `<p style="text-align:center; margin-top:1rem; color:var(--smoke-white);">Aucune équipe applicable pour les types d'événements ou les disponibilités de cette journée.</p>`;
            } else {
                 teamsHtml = `<p style="text-align:center; margin-top:1rem; color:var(--smoke-white);">Aucun personnel disponible et aucun événement défini pour cette date.</p>`;
            }
        }
        let adminActionsHtml = '';
        if (isAdmin) { 
            if (isFrozen) { 
                adminActionsHtml = `<div class="header-actions" style="margin-top:1rem; display:flex; justify-content:center; gap:1rem;"><button id="edit-event-btn-display" class="btn-primary" style="padding: 0.5rem 1rem;">Gérer l'Événement/Modifier</button><button id="reset-assigned-team-btn" class="btn-secondary" style="padding: 0.5rem 1rem;">Défiger l'Équipe</button></div>`; 
            } else if ( (Object.keys(allAvailabilities[dateId] || {}).length > 0 && (ccfTeam || mprTeam)) || (allEvents[dateId] && allEvents[dateId].types && allEvents[dateId].types.length > 0) ) { 
                adminActionsHtml = `<div class="header-actions" style="margin-top:1rem; display:flex; justify-content:center; gap:1rem;"><button id="activate-day-btn" class="btn-primary" style="padding: 0.5rem 1rem; background-color: var(--available-green);">Activer Journée et Figer Équipe(s)</button></div>`; 
            } else { 
                adminActionsHtml = `<div class="header-actions" style="margin-top:1rem; display:flex; justify-content:center; gap:1rem;"><button id="define-event-type-btn" class="btn-secondary" style="padding: 0.5rem 1rem;">Définir Type d'Événement</button></div>`; 
            } 
        } else if (!isFrozen && (Object.keys(allAvailabilities[dateId] || {}).length > 0 || (allEvents[dateId] && allEvents[dateId].types && allEvents[dateId].types.length > 0) ) ) { 
             teamsHtml = `<p style="text-align:center; margin-top:1rem; color:var(--smoke-white);">L'équipe pour cette date n'est pas encore finalisée.</p>`;
        }


        if(generatedTeamsContainer) generatedTeamsContainer.innerHTML = `<div class="teams-display-header"><h3>Équipes du ${dateId.split('-').reverse().join('/')}</h3>${generateEventTagsHtml(dateId)}${adminActionsHtml}</div><div class="teams-grid">${teamsHtml}</div>`;
        
        const editBtn = document.getElementById('edit-event-btn-display'); if (editBtn) { editBtn.addEventListener('click', () => openEventModal(dateId, false)); }
        const activateDayBtn = document.getElementById('activate-day-btn'); if (activateDayBtn) { activateDayBtn.addEventListener('click', () => openEventModal(dateId, true)); }
        const defineEventTypeBtn = document.getElementById('define-event-type-btn'); if (defineEventTypeBtn) { defineEventTypeBtn.addEventListener('click', () => openEventModal(dateId, false));}
        const resetAssignedTeamBtn = document.getElementById('reset-assigned-team-btn'); if (resetAssignedTeamBtn) { resetAssignedTeamBtn.addEventListener('click', () => { showGenericConfirmModal( "Voulez-vous défiger l'équipe assignée ? La génération automatique (si applicable) reprendra. L'événement défini pour le jour sera conservé.", () => { database.ref(`assignedTeams/${dateId}`).remove().then(() => { showMessage("Équipe défigée. L'événement est conservé.", "success"); }).catch(err => showMessage("Erreur: " + err.message, "error")); }, null, "Défiger l'équipe ?", "btn-secondary", "Oui, Défiger" ); }); }
        
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
        
        // MODIFICATION: Afficher les remplacements potentiels pour les admins, même pour les propositions
        if (isAdmin && (ccfTeam || mprTeam)) { 
            const teamForReplacements = currentWorkingTeam; 
            if (teamForReplacements && potentialReplacementsContainer) { 
                renderPotentialReplacements(dateId, teamForReplacements.ccfTeam, teamForReplacements.mprTeam); 
            }
        } else { 
            if(potentialReplacementsContainer) potentialReplacementsContainer.innerHTML = ''; 
        }
    }

    function renderPotentialReplacements(dateId, ccfTeam, mprTeam) {
        if(!potentialReplacementsContainer) return;
        const availableOnDate = Object.keys(allAvailabilities[dateId] || {}); 
        const currentTeamAssignmentsOnDate = new Set(); 
        const teamsToConsider = []; 
        if(ccfTeam) teamsToConsider.push(ccfTeam); 
        if(mprTeam) teamsToConsider.push(mprTeam); 
        teamsToConsider.forEach(team => { if (!team) return; Object.values(team).flat().forEach(id => { if (id && !String(id).startsWith('MANUAL:')) currentTeamAssignmentsOnDate.add(id); }); });
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
            potentialReplacementsContainer.innerHTML = '<h3><ion-icon name="people-circle-outline"></ion-icon> Remplaçants Potentiels</h3><p style="color:var(--smoke-white); text-align:center;">Aucun remplaçant potentiel disponible.</p>'; 
            return; 
        }
        let html = `<h3><ion-icon name="people-circle-outline"></ion-icon> Remplaçants Potentiels</h3><div class="potential-replacements-list">`; 
        for (const roleKey in potentialReplacementsByRole) { 
            html += `<div class="replacement-role-group"><h4>${getRoleDisplayName(roleKey)}</h4><ul>`; 
            potentialReplacementsByRole[roleKey].forEach(pId => { 
                const person = allPersonnel[pId]; 
                html += `<li>${fromBase64(person.nom)} ${fromBase64(person.prenom)}</li>`;
            }); 
            html += `</ul></div>`; 
        } 
        html += `</div>`; 
        potentialReplacementsContainer.innerHTML = html;
    }

    function openReplacePersonnelModal() {
        if (!isAdmin || !currentWorkingTeam) { 
            showMessage("Impossible de remplacer: pas d'équipe active ou droits admin manquants.", "error"); 
            return; 
        } 
        const { dateId, roleKey, currentPersonnelId } = currentReplacementInfo;
        if (roleToReplaceEl) roleToReplaceEl.textContent = getRoleDisplayName(roleKey); 
        if (replacementOptionsContainer) replacementOptionsContainer.innerHTML = ''; 
        if (manualReplacementNameInput) manualReplacementNameInput.value = '';

        const availableOnDate = Object.keys(allAvailabilities[dateId] || {}); 
        const currentAssignmentsInWorkingTeam = new Set(); 
        const { ccfTeam, mprTeam } = currentWorkingTeam; 
        if (ccfTeam) { Object.values(ccfTeam).flat().forEach(id => { if (id && !String(id).startsWith('MANUAL:')) currentAssignmentsInWorkingTeam.add(id); }); } 
        if (mprTeam) { Object.values(mprTeam).flat().forEach(id => { if (id && !String(id).startsWith('MANUAL:')) currentAssignmentsInWorkingTeam.add(id); }); }
        const potentialReplacementsList = Object.keys(allPersonnel).filter(pId => { 
            const person = allPersonnel[pId]; 
            return person && 
                   availableOnDate.includes(pId) && 
                   person.fonctions && person.fonctions.map(f => fromBase64(f)).includes(roleKey) && 
                   pId !== currentPersonnelId && 
                   !currentAssignmentsInWorkingTeam.has(pId); 
        });
        if (currentPersonnelId && replacementOptionsContainer) { 
            const unassignOptionDiv = document.createElement('div'); 
            unassignOptionDiv.className = 'replacement-option'; 
            unassignOptionDiv.textContent = `Laisser "${getRoleDisplayName(roleKey)}" Non Assigné`; 
            unassignOptionDiv.addEventListener('click', () => performReplacement(null)); 
            replacementOptionsContainer.appendChild(unassignOptionDiv); 
        }
        if (replacementOptionsContainer) { 
            if (potentialReplacementsList.length > 0) { 
                potentialReplacementsList.forEach(pId => { 
                    const person = allPersonnel[pId]; 
                    const optionDiv = document.createElement('div'); 
                    optionDiv.className = 'replacement-option'; 
                    optionDiv.textContent = `${fromBase64(person.nom)} ${fromBase64(person.prenom)}`;
                    optionDiv.addEventListener('click', () => performReplacement(pId)); 
                    replacementOptionsContainer.appendChild(optionDiv); 
                }); 
            } else { 
                if (!currentPersonnelId) { 
                    replacementOptionsContainer.insertAdjacentHTML('beforeend', '<div class="replacement-option no-options">Aucun personnel disponible pour ce rôle.</div>'); 
                } else { 
                    replacementOptionsContainer.insertAdjacentHTML('beforeend', '<div class="replacement-option no-options">Aucun autre remplaçant disponible pour ce rôle.</div>'); 
                } 
            } 
        }
        if(replacePersonnelModal) openModal(replacePersonnelModal);
    }

    function performReplacement(replacementPersonnelId) {
        if (!isAdmin || !currentReplacementInfo || !currentWorkingTeam) {
            showMessage("Erreur: Remplacement impossible.", "error");
            return;
        }
    
        const { dateId, teamType, roleKey, teammateIndex } = currentReplacementInfo;
    
        if (teamType === 'ccf' && !currentWorkingTeam.ccfTeam) {
            currentWorkingTeam.ccfTeam = { [ROLES.CCF_DRIVER]: null, [ROLES.CCF_LEADER]: null, [ROLES.CCF_TEAMMATE]: [null, null] };
        }
        if (teamType === 'mpr' && !currentWorkingTeam.mprTeam) {
            currentWorkingTeam.mprTeam = { [ROLES.MPR_DRIVER]: null, [ROLES.MPR_TEAMMATE]: null };
        }
    
        const teamToUpdate = currentWorkingTeam[teamType + 'Team'];
        if (!teamToUpdate) {
            showMessage("Erreur: Équipe à mettre à jour non trouvée.", "error");
            return;
        }
    
        // MODIFICATION COMMENCE ICI
        if (roleKey === ROLES.CCF_TEAMMATE && teammateIndex !== -1) {
            // Pour les Équipiers CCF, s'assurer que la structure est un tableau de 2 éléments.
            // teamToUpdate[roleKey] fait référence à, par exemple, currentWorkingTeam.ccfTeam["Équipier FDF (CCF4MHP37)"]
            
            // Si l'emplacement n'existe pas, n'est pas un tableau, ou n'a pas la bonne longueur, on le corrige.
            if (typeof teamToUpdate[roleKey] === 'undefined' || !Array.isArray(teamToUpdate[roleKey])) {
                // La propriété n'existe pas ou n'est pas un tableau : initialisation complète
                teamToUpdate[roleKey] = [null, null];
            } else if (teamToUpdate[roleKey].length !== 2) {
                // C'est un tableau, mais pas de longueur 2. On le normalise à 2 éléments.
                // On essaie de préserver le premier élément s'il existait (cas où c'était un tableau de longueur 1).
                const preservedVal0 = teamToUpdate[roleKey].length >= 1 ? teamToUpdate[roleKey][0] : null;
                teamToUpdate[roleKey] = [preservedVal0, null]; // Devient [valeur, null] ou [null, null]
            }
            
            // À ce stade, teamToUpdate[roleKey] EST GARANTI d'être un tableau de longueur 2.
            if (teammateIndex >= 0 && teammateIndex < teamToUpdate[roleKey].length) { // La longueur ici devrait être 2
                teamToUpdate[roleKey][teammateIndex] = replacementPersonnelId;
            } else {
                // Ce bloc ne devrait théoriquement plus être atteint si la logique ci-dessus est correcte.
                console.error("Index d'équipier invalide (après correction):", teammateIndex, "Tableau actuel:", JSON.stringify(teamToUpdate[roleKey]));
                showMessage("Erreur: Index d'équipier invalide lors de l'affectation.", "error");
                return;
            }
        } else {
            // Pour les rôles qui ne sont pas ROLES.CCF_TEAMMATE (affectation unique)
            // ou si teammateIndex était -1 (ne devrait pas arriver pour CCF_TEAMMATE)
            teamToUpdate[roleKey] = replacementPersonnelId;
        }
        // MODIFICATION FIN ICI
    
        database.ref(`assignedTeams/${dateId}`).set(currentWorkingTeam)
            .then(() => {
                showMessage("Remplacement effectué et équipe mise à jour !", "success");
                if(replacePersonnelModal) closeModal(replacePersonnelModal);
                // Rafraîchir l'affichage des équipes
                generateAndDisplayTeams(dateId); 
            })
            .catch(err => {
                showMessage("Erreur lors de la validation de l'équipe : " + err.message, "error");
            });
    }

    // --- Fonctions pour les statistiques ---
    function renderGlobalStatistics() {
        const totalPersonnel = Object.keys(allPersonnel).length; 
        let totalAvailabilitiesLogged = 0; 
        for (const date in allAvailabilities) { totalAvailabilitiesLogged += Object.keys(allAvailabilities[date]).length; } 
        const totalEventDays = Object.keys(allEvents).length; 
        const totalFrozenTeamDays = Object.keys(allAssignedTeams).length; 
        let totalCcfAssignments = 0, totalMprAssignments = 0; 
        for (const date in allAssignedTeams) { 
            const teamData = allAssignedTeams[date]; 
            if (teamData.ccfTeam) totalCcfAssignments += Object.values(teamData.ccfTeam).flat().filter(id => id && !String(id).startsWith('MANUAL:')).length; 
            if (teamData.mprTeam) totalMprAssignments += Object.values(teamData.mprTeam).flat().filter(id => id && !String(id).startsWith('MANUAL:')).length; 
        }
        const elIds = ['global-total-personnel', 'global-total-availabilities', 'global-total-event-days', 'global-total-frozen-team-days', 'global-total-ccf-assignments', 'global-total-mpr-assignments'];
        const values = [totalPersonnel, totalAvailabilitiesLogged, totalEventDays, totalFrozenTeamDays, totalCcfAssignments, totalMprAssignments];
        elIds.forEach((id, index) => { const el = document.getElementById(id); if (el) el.textContent = values[index]; });
    }

    function renderStatistics() {
        if (!statsView || !statsList) return; 
        const stats = {}; 
        for (const pId in allPersonnel) { 
            stats[pId] = { 
                nom: fromBase64(allPersonnel[pId].nom), 
                prenom: fromBase64(allPersonnel[pId].prenom), 
                fonctions: allPersonnel[pId].fonctions ? allPersonnel[pId].fonctions.map(f => fromBase64(f)) : [], 
                availabilities: 0, 
                ccfCount: 0, 
                mprCount: 0, 
                mprPercentage: 0, 
                ccfPercentage: 0 
            }; 
        }
        for (const date in allAvailabilities) { for (const pId in allAvailabilities[date]) { if (stats[pId]) stats[pId].availabilities++; } }
        for (const date in allAssignedTeams) { 
            const teamData = allAssignedTeams[date]; 
            if (teamData.ccfTeam) Object.values(teamData.ccfTeam).flat().filter(id => id && !String(id).startsWith('MANUAL:')).forEach(pId => { if (stats[pId]) stats[pId].ccfCount++; });
            if (teamData.mprTeam) Object.values(teamData.mprTeam).flat().filter(id => id && !String(id).startsWith('MANUAL:')).forEach(pId => { if (stats[pId]) stats[pId].mprCount++; });
        }
        for (const pId in stats) { 
            if (stats[pId].availabilities > 0) { 
                stats[pId].mprPercentage = (stats[pId].mprCount / stats[pId].availabilities) * 100; 
                stats[pId].ccfPercentage = (stats[pId].ccfCount / stats[pId].availabilities) * 100; 
            } 
        }
        const searchTerm = statsSearchInput ? statsSearchInput.value.toLowerCase() : ""; 
        const filterTerm = statsFilterInput ? statsFilterInput.value : "";
        const filteredPersonnelIds = Object.keys(stats).filter(pId => { 
            const person = stats[pId]; 
            const fullName = `${person.nom} ${person.prenom}`.toLowerCase();
            return fullName.includes(searchTerm) && (filterTerm === '' || person.fonctions.includes(filterTerm)); 
        });
        statsList.innerHTML = ''; 
        if (filteredPersonnelIds.length === 0) { 
            statsList.innerHTML = '<p style="text-align:center; padding:2rem; color:var(--smoke-white);">Aucun personnel trouvé.</p>'; 
            return; 
        }
        filteredPersonnelIds.sort((a, b) => stats[a].nom.localeCompare(stats[b].nom));
        filteredPersonnelIds.forEach(pId => { 
            const p = stats[pId]; 
            const card = document.createElement('div'); 
            card.className = 'personnel-card'; 
            card.innerHTML = `
                <div class="personnel-avatar">${p.prenom.charAt(0)}${p.nom.charAt(0)}</div>
                <div class="personnel-info">
                    <h3>${p.nom} ${p.prenom}</h3>
                    <div class="info-block" title="Dispos"><ion-icon name="calendar-number-outline"></ion-icon><span><strong>${p.availabilities}</strong> Dispos</span></div>
                    <div class="info-block" title="Gardes CCF"><ion-icon name="bus-outline"></ion-icon><span><strong>${p.ccfCount}</strong> CCF</span></div>
                    <div class="info-block" title="Gardes MPR"><ion-icon name="car-sport-outline"></ion-icon><span><strong>${p.mprCount}</strong> MPR</span></div>
                    <div class="info-block" title="% GIFF/Dispos"><ion-icon name="flame-outline"></ion-icon> <span><strong>${p.ccfPercentage.toFixed(1)}%</strong> GIFF/D</span></div>
                    <div class="info-block" title="% MPR/Dispos"><ion-icon name="car-outline"></ion-icon> <span><strong>${p.mprPercentage.toFixed(1)}%</strong> MPR/D</span></div>
                </div>`; 
            statsList.appendChild(card); 
        });
    }

    if (statsSearchInput) statsSearchInput.addEventListener('input', renderStatistics);
    if (statsFilterInput) statsFilterInput.addEventListener('change', renderStatistics);

    // --- Logique de Réinitialisation des Données ---
    if (resetAllDataBtn) {
        resetAllDataBtn.addEventListener('click', () => {
            if (!isAdmin) { showMessage("Accès refusé.", "error"); return; }
            const onFinalConfirm = () => { 
                Promise.all([
                    database.ref('availabilities').remove(), 
                    database.ref('events').remove(), 
                    database.ref('assignedTeams').remove()
                ])
                .then(() => showMessage("Toutes les données ont été réinitialisées.", "success"))
                .catch(err => showMessage("Erreur lors de la réinitialisation : " + err.message, "error")); 
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

    // --- LOGIQUE D'EXPORTATION PDF ---
    const PDF_COLORS = { fireRed: '#e5383b', emberOrange: '#ff9100', availableGreen: '#2a9d8f', textSecondary: '#6c757d', black: '#000000', cardBg: '#f8f9fa', lineColor: '#dee2e6' };
    function drawTeamInPdf(doc, dateId, teamData, currentY) { 
        const PADDING = 14; const PAGE_WIDTH = doc.internal.pageSize.getWidth(); const PAGE_HEIGHT = doc.internal.pageSize.getHeight(); const CONTENT_WIDTH = PAGE_WIDTH - 2 * PADDING; const CARD_SPACING = 8; const CARD_WIDTH = (CONTENT_WIDTH - CARD_SPACING) / 2; const LINE_HEIGHT = 5; const CARD_PADDING = 5; const { ccfTeam, mprTeam } = teamData; let ccfRoles = [], mprRoles = []; let ccfCardHeight = 0, mprCardHeight = 0; 
        if (ccfTeam) { ccfRoles = [{ label: "Conducteur PL:", id: ccfTeam[ROLES.CCF_DRIVER] }, { label: "Chef d'Agrès FDF:", id: ccfTeam[ROLES.CCF_LEADER] }, { label: "Équipier FDF 1:", id: ccfTeam[ROLES.CCF_TEAMMATE]?.[0] }, { label: "Équipier FDF 2:", id: ccfTeam[ROLES.CCF_TEAMMATE]?.[1] }]; ccfCardHeight = (ccfRoles.length * LINE_HEIGHT) + (2 * CARD_PADDING) + 7; } 
        if (mprTeam) { mprRoles = [{ label: "Conducteur VL:", id: mprTeam[ROLES.MPR_DRIVER] }, { label: "Équipier DIV:", id: mprTeam[ROLES.MPR_TEAMMATE] }]; mprCardHeight = (mprRoles.length * LINE_HEIGHT) + (2 * CARD_PADDING) + 7; } 
        
        const eventDetails = allEvents[dateId];
        let eventTextHeight = 0;
        if (eventDetails && eventDetails.types && eventDetails.types.length > 0) {
            eventTextHeight = 7;
        }

        const maxCardHeight = Math.max(ccfCardHeight, mprCardHeight, 15); const neededHeight = maxCardHeight + 15 + eventTextHeight;
        if (currentY + neededHeight > PAGE_HEIGHT - 20) { doc.addPage(); currentY = 25; } 
        if (currentY > 30) { doc.setDrawColor(PDF_COLORS.lineColor); doc.setLineWidth(0.2); doc.line(PADDING, currentY - 5, PAGE_WIDTH - PADDING, currentY - 5); } 
        doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(PDF_COLORS.emberOrange); doc.text(`Jour du ${dateId.split('-').reverse().join('/')}`, PADDING, currentY); currentY += 5; 
        
        if (eventDetails && eventDetails.types && eventDetails.types.length > 0) {
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(PDF_COLORS.textSecondary);
            const eventText = `Événement(s): ${eventDetails.types.join(', ')}`;
            doc.text(eventText, PADDING, currentY);
            currentY += eventTextHeight - 2;
        } else {
             currentY += 2;
        }
        
        let cardStartY = currentY; let startX = PADDING; 
        
        const drawRole = (role) => {
            let name;
            let nameColor = PDF_COLORS.black;
            if (role.id && String(role.id).startsWith('MANUAL:')) {
                name = `(M) ${role.id.substring(7)}`; 
            } else if (role.id && allPersonnel[role.id]) {
                name = `${fromBase64(allPersonnel[role.id].nom)} ${fromBase64(allPersonnel[role.id].prenom)}`;
            } else {
                name = "Non assigné";
                nameColor = PDF_COLORS.fireRed;
            }
            doc.setFont('helvetica', 'normal'); doc.setTextColor(PDF_COLORS.textSecondary); doc.text(role.label, startX + CARD_PADDING, roleY); doc.setFont('helvetica', 'bold'); doc.setTextColor(nameColor); doc.text(name, startX + CARD_PADDING + 28, roleY); roleY += LINE_HEIGHT;
        };

        if (ccfTeam) { const isComplete = ccfRoles.every(r => r.id); const statusColor = isComplete ? PDF_COLORS.availableGreen : PDF_COLORS.fireRed; doc.setFillColor(PDF_COLORS.cardBg); doc.setDrawColor(statusColor); doc.setLineWidth(0.5); doc.rect(startX, cardStartY, CARD_WIDTH, ccfCardHeight, 'FD'); doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(PDF_COLORS.black); doc.text("Équipe CCF4MHP37", startX + CARD_PADDING, cardStartY + 6); var roleY = cardStartY + 13; doc.setFontSize(8); ccfRoles.forEach(drawRole); startX += CARD_WIDTH + CARD_SPACING; } 
        if (mprTeam) { const isComplete = mprRoles.every(r => r.id); const statusColor = isComplete ? PDF_COLORS.availableGreen : PDF_COLORS.fireRed; doc.setFillColor(PDF_COLORS.cardBg); doc.setDrawColor(statusColor); doc.setLineWidth(0.5); doc.rect(startX, cardStartY, CARD_WIDTH, mprCardHeight, 'FD'); doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(PDF_COLORS.black); doc.text("Équipe MPR12", startX + CARD_PADDING, cardStartY + 6); var roleY = cardStartY + 13; doc.setFontSize(8); mprRoles.forEach(drawRole); } 
        if (!ccfTeam && !mprTeam) { doc.setFontSize(9); doc.setFont('helvetica', 'italic'); doc.setTextColor(PDF_COLORS.textSecondary); doc.text("Aucune équipe générée ou applicable.", PADDING, currentY + 5); } 
        return cardStartY + maxCardHeight + 8; 
    }
    function addPdfHeaderFooter(doc, title) { 
        const pageCount = doc.internal.getNumberOfPages(); const generationDate = new Date().toLocaleDateString('fr-FR'); const PADDING = 14; 
        for (let i = 1; i <= pageCount; i++) { 
            doc.setPage(i); 
            doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(PDF_COLORS.black); doc.text(title, PADDING, 15); 
            doc.setFontSize(8); doc.setTextColor(PDF_COLORS.textSecondary); const pageText = `Page ${i} / ${pageCount}`; doc.text(pageText, PADDING, doc.internal.pageSize.getHeight() - 10); doc.text(`Généré le: ${generationDate}`, doc.internal.pageSize.getWidth() - PADDING, doc.internal.pageSize.getHeight() - 10, { align: 'right' }); 
        } 
    }
    function exportProposalsToPDF() { 
        if (!isAdmin) return; 
        const { jsPDF } = window.jspdf; 
        const doc = new jsPDF('p', 'mm', 'a4'); 
        const month = teamsCurrentMonth.value; 
        const year = teamsCurrentYear.value; 
        const monthName = month_names[month]; 
        const title = `Propositions Automatiques - ${monthName} ${year}`; 
        let currentY = 25; 
        const daysInMonth = new Date(year, month + 1, 0).getDate(); 
        let teamsFound = false; 
        for (let day = 1; day <= daysInMonth; day++) { 
            const dateId = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; 
            if (allAvailabilities[dateId] && Object.keys(allAvailabilities[dateId]).length > 0) { 
                teamsFound = true; 
                const provisionalTeam = generateProvisionalTeam(dateId, true, true); 
                currentY = drawTeamInPdf(doc, dateId, provisionalTeam, currentY); 
            } 
        } 
        if (!teamsFound) { 
            doc.setFontSize(12); doc.setTextColor(PDF_COLORS.textSecondary); doc.text(`Aucune proposition pour ${monthName} ${year} (pas de disponibilités).`, 14, 30); 
        } 
        addPdfHeaderFooter(doc, title); 
        doc.save(`propositions-${monthName}-${year}.pdf`); 
    }
    function exportActivatedToPDF() { 
        // MODIFICATION: Suppression du contrôle !isAdmin pour autoriser tous les utilisateurs
        const { jsPDF } = window.jspdf; 
        const doc = new jsPDF('p', 'mm', 'a4'); 
        const month = teamsCurrentMonth.value; 
        const year = teamsCurrentYear.value; 
        const monthName = month_names[month]; 
        const title = `Équipes Figées (Activées) - ${monthName} ${year}`; 
        let currentY = 25; 
        const monthStr = String(month + 1).padStart(2, '0'); 
        const activatedDatesInMonth = Object.keys(allAssignedTeams).filter(dateId => dateId.startsWith(`${year}-${monthStr}`)).sort(); 
        if (activatedDatesInMonth.length === 0) { 
            doc.setFontSize(12); doc.setTextColor(PDF_COLORS.textSecondary); doc.text(`Aucune équipe figée trouvée pour ${monthName} ${year}.`, 14, 30); 
        } else { 
            activatedDatesInMonth.forEach(dateId => { 
                const teamData = allAssignedTeams[dateId]; 
                currentY = drawTeamInPdf(doc, dateId, teamData, currentY); 
            }); 
        } 
        addPdfHeaderFooter(doc, title); 
        doc.save(`equipes-figees-${monthName}-${year}.pdf`); 
    }

    // --- AJOUT POUR L'ANIMATION DE FOND (BRAISES) ---
    function createBackgroundEmbers() {
        const embersContainer = document.querySelector('.background-embers');
        if (!embersContainer) {
            console.error("Le conteneur '.background-embers' est introuvable.");
            return;
        }
        const numberOfEmbers = 40; 
        embersContainer.innerHTML = ''; 
        for (let i = 0; i < numberOfEmbers; i++) {
            const ember = document.createElement('div');
            ember.className = 'ember';
            const size = Math.random() * 6 + 2;
            ember.style.width = `${size}px`;
            ember.style.height = `${size}px`;
            ember.style.left = `${Math.random() * 100}%`;
            const duration = Math.random() * 15 + 10;
            ember.style.animationDuration = `${duration}s`;
            const delay = Math.random() * 15;
            ember.style.animationDelay = `${delay}s`;
            embersContainer.appendChild(ember);
        }
    }

    // --- INITIALISATION ---
    updateDateTimeDisplay();
    setInterval(updateDateTimeDisplay, 1000);
    setInitialState();
    createBackgroundEmbers();

    if (exportProposalsBtn) exportProposalsBtn.addEventListener('click', exportProposalsToPDF);
    if (exportActivatedBtn) exportActivatedBtn.addEventListener('click', exportActivatedToPDF);
});
