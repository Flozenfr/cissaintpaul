document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURATION ET INITIALISATION FIREBASE ---
    const firebaseConfig = {
        apiKey: "AIzaSyCfm_Rq_lma5JVsWRt_qLxpUvgEQ4I6k5g",
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
    const personnelView = document.getElementById('personnel-view');
    const calendarView = document.getElementById('calendar-view');
    const personnelList = document.getElementById('personnel-list');
    const addPersonnelBtn = document.getElementById('add-personnel-btn');
    const searchInput = document.getElementById('searchInput');
    const filterInput = document.getElementById('filterInput');
    const personnelModal = document.getElementById('personnel-modal');
    const confirmModal = document.getElementById('confirm-modal');
    const closeButton = document.querySelector('.close-button');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
    const personnelForm = document.getElementById('personnel-form');
    const modalTitle = document.getElementById('modal-title');
    const submitBtn = document.getElementById('submit-btn');
    const personnelIdInput = document.getElementById('personnel-id');
    const navItems = document.querySelectorAll(".navigation .list");
    const navUl = document.querySelector(".navigation ul");
    const indicator = document.querySelector(".navigation .indicator");

    const calendarPersonnelSelector = document.getElementById('calendar-personnel-selector');
    const calendarSearchInput = document.getElementById('calendar-search-input');
    const calendarSearchResults = document.getElementById('calendar-search-results');
    const selectedPersonnelName = document.getElementById('selected-personnel-name');
    const deselectPersonnelBtn = document.getElementById('deselect-personnel-btn');
    const calendarDaysContainer = document.querySelector('.calendar-days');

    const settingsView = document.getElementById('settings-view');
    const deadlineInput = document.getElementById('deadline-input');
    const saveDeadlineBtn = document.getElementById('save-deadline-btn');
    const deadlineMessage = document.getElementById('deadline-message');

    const customPromptModal = document.getElementById('custom-prompt-modal');
    const customPasswordInput = document.getElementById('custom-password-input');
    const customPromptOkBtn = document.getElementById('custom-prompt-ok-btn');
    const customPromptCancelBtn = document.getElementById('custom-prompt-cancel-btn');

    // --- NOUVEAUX SÉLECTEURS POUR LA VUE ÉQUIPES ---
    const teamsView = document.getElementById('teams-view');
    const teamsCalendarDaysContainer = document.getElementById('teams-calendar-days');
    const generatedTeamsContainer = document.getElementById('generated-teams-container');
    const eventTypeModal = document.getElementById('event-type-modal');
    const eventTypeForm = document.getElementById('event-type-form');
    const eventModalTitle = document.getElementById('event-modal-title');
    const eventDateInput = document.getElementById('event-date');
    const eventCancelBtn = document.getElementById('event-cancel-btn');


    // --- ÉTAT GLOBAL ---
    let allPersonnel = {};
    let allAvailabilities = {};
    let allEvents = {}; // Pour stocker les événements (GIFF, MPR)
    let selectedPersonnel = null;
    let isAdmin = false;
    let availabilityDeadline = null;
    let selectedTeamDate = null; // Pour savoir quel jour est sélectionné dans le calendrier des équipes

    // Fonction pour afficher un message stylisé
    function showMessage(message, type) {
        const messageContainer = document.createElement('div');
        messageContainer.className = `message-container ${type}`;
        messageContainer.innerHTML = `
            <h3>${type === 'success' ? 'Succès' : type === 'error' ? 'Erreur' : 'Attention'}</h3>
            <p>${message}</p>
        `;
        document.body.appendChild(messageContainer);
        messageContainer.classList.add('show');

        setTimeout(() => {
            messageContainer.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(messageContainer);
            }, 500);
        }, 3000);
    }

    // Fonction pour afficher la boîte de dialogue personnalisée
    function showCustomPrompt(message, callback) {
        const modal = document.getElementById('custom-prompt-modal');
        const passwordInput = document.getElementById('custom-password-input');
        const okBtn = document.getElementById('custom-prompt-ok-btn');
        const cancelBtn = document.getElementById('custom-prompt-cancel-btn');

        passwordInput.value = '';
        modal.classList.add('visible');

        okBtn.onclick = () => {
            const password = passwordInput.value;
            modal.classList.remove('visible');
            callback(password);
        };

        cancelBtn.onclick = () => {
            modal.classList.remove('visible');
            callback(null);
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
            showMessage('Vous avez été déconnecté.', 'warning');
            updateAdminUI();
        } else {
            showCustomPrompt("Veuillez entrer le mot de passe administrateur :", (password) => {
                if (password === ADMIN_PASSWORD) {
                    isAdmin = true;
                    sessionStorage.setItem('isAdmin', 'true');
                    showMessage('Connexion réussie !', 'success');
                    updateAdminUI();
                } else if (password !== null) {
                    showMessage('Mot de passe incorrect.', 'error');
                }
            });
        }
    });

    if (sessionStorage.getItem('isAdmin') === 'true') {
        isAdmin = true;
    }

    // --- GESTION DE LA DATE LIMITE (MODIFIÉE) ---
    const deadlineRef = database.ref('config/deadline');

    saveDeadlineBtn.addEventListener('click', () => {
        if (!isAdmin) return;
        const newDeadline = deadlineInput.value;
        deadlineRef.set(newDeadline || null)
            .then(() => showMessage('Date et heure limites enregistrées avec succès !', 'success'))
            .catch(err => showMessage('Erreur: ' + err.message, 'error'));
    });

    deadlineRef.on('value', (snapshot) => {
        availabilityDeadline = snapshot.val();
        if (availabilityDeadline) {
            deadlineInput.value = availabilityDeadline;

            // Formatter la date et l'heure pour l'affichage public
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

    // --- FONCTIONS UTILITAIRES BASE64 ---
    const toBase64 = (str) => btoa(unescape(encodeURIComponent(str)));
    const fromBase64 = (str) => decodeURIComponent(escape(atob(str)));

    // --- GESTION DES MODALS ---
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
    closeButton.addEventListener('click', () => closeModal(personnelModal));
    confirmCancelBtn.addEventListener('click', () => closeModal(confirmModal));
    // Ajout pour la nouvelle modale
    eventTypeModal.querySelector('.close-button').addEventListener('click', () => closeModal(eventTypeModal));
    eventCancelBtn.addEventListener('click', () => closeModal(eventTypeModal));

    window.addEventListener('click', (e) => { 
        if (e.target == personnelModal) closeModal(personnelModal); 
        if (e.target == confirmModal) closeModal(confirmModal);
        if (e.target == eventTypeModal) closeModal(eventTypeModal);
    });

    // --- LOGIQUE DE GESTION DU PERSONNEL ---
    personnelForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!isAdmin) return;
        const personnelData = {
            nom: toBase64(document.getElementById('nom').value),
            prenom: toBase64(document.getElementById('prenom').value),
            commentaire: toBase64(document.getElementById('commentaire').value),
            fonctions: Array.from(document.querySelectorAll('input[name="fonctions"]:checked')).map(el => toBase64(el.value))
        };
        const id = personnelIdInput.value;
        const dbRef = id ? database.ref('personnel/' + id) : database.ref('personnel').push();
        dbRef.update(personnelData).then(() => closeModal(personnelModal));
    });

    const renderPersonnel = (personnelData) => {
        if (!personnelList) return;
        personnelList.innerHTML = '';
        const searchTerm = searchInput.value.toLowerCase();
        const filterTerm = filterInput.value;
        allPersonnel = personnelData || {};
        for (const id in allPersonnel) {
            const p = { id: id, nom: fromBase64(allPersonnel[id].nom), prenom: fromBase64(allPersonnel[id].prenom), commentaire: fromBase64(allPersonnel[id].commentaire), fonctions: allPersonnel[id].fonctions ? allPersonnel[id].fonctions.map(f => fromBase64(f)) : [] };
            const fullName = `${p.prenom} ${p.nom}`;
            const initials = `${p.prenom.charAt(0)}${p.nom.charAt(0)}`;
            const functionsBlock = p.fonctions && p.fonctions.length > 0 ? p.fonctions.map(func => `<div class="info-block"><ion-icon name="shield-half-outline"></ion-icon><span>${func.replace(/ \(.+\)/, '')}</span></div>`).join('') : '<div class="info-block"><ion-icon name="shield-half-outline"></ion-icon><span>Aucune fonction</span></div>';
            if ((fullName.toLowerCase().includes(searchTerm)) && (filterTerm === '' || p.fonctions.includes(filterTerm))) {
                const card = document.createElement('div');
                card.className = 'personnel-card';
                card.innerHTML = `<div class="personnel-avatar">${initials}</div><div class="personnel-info"><h3>${fullName}</h3>${functionsBlock}${p.commentaire ? `<div class="info-block"><ion-icon name="chatbox-ellipses-outline"></ion-icon><span>${p.commentaire}</span></div>` : ''}</div><div class="personnel-actions"><button class="action-btn edit-btn" data-id="${p.id}"><ion-icon name="pencil-outline"></ion-icon></button><button class="action-btn delete-btn" data-id="${p.id}"><ion-icon name="trash-outline"></ion-icon></button></div>`;
                personnelList.appendChild(card);
            }
        }
    };

    database.ref('personnel').on('value', (snapshot) => {
        allPersonnel = snapshot.val() || {}; // Mettre à jour allPersonnel
        renderPersonnel(allPersonnel); // Rerendre la liste du personnel
        // Si une date est sélectionnée dans la vue équipe, régénérer les équipes
        if (selectedTeamDate) {
            generateAndDisplayTeams(selectedTeamDate);
        }
    });
    personnelList.addEventListener('click', (e) => {
        if (!isAdmin) return;
        const target = e.target.closest('.action-btn'); if (!target) return; const id = target.dataset.id;
        if (target.classList.contains('delete-btn')) { confirmDeleteBtn.dataset.id = id; openModal(confirmModal); }
        if (target.classList.contains('edit-btn')) {
            database.ref('personnel/' + id).once('value', (snapshot) => {
                const data = snapshot.val();
                document.getElementById('nom').value = fromBase64(data.nom); document.getElementById('prenom').value = fromBase64(data.prenom); document.getElementById('commentaire').value = fromBase64(data.commentaire);
                document.querySelectorAll('input[name="fonctions"]').forEach(cb => cb.checked = false);
                if (data.fonctions) { data.fonctions.map(f => fromBase64(f)).forEach(func => { const checkbox = document.querySelector(`input[value="${func}"]`); if (checkbox) checkbox.checked = true; }); }
                personnelIdInput.value = id; modalTitle.textContent = 'Modifier le Personnel'; submitBtn.textContent = 'Modifier'; openModal(personnelModal);
            });
        }
    });
    confirmDeleteBtn.addEventListener('click', () => {
        if (!isAdmin) return;
        const idToDelete = confirmDeleteBtn.dataset.id;
        if (idToDelete) { database.ref('personnel/' + idToDelete).remove(); closeModal(confirmModal); }
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
        selectedPersonnelName.textContent = 'Aucun';
        calendarPersonnelSelector.classList.remove('person-selected');
        generateCalendar(currentMonth.value, currentYear.value);
    });

    // --- LOGIQUE DE NAVIGATION (Structure finale modifiée) ---
    function updateActiveView(activeItem) {
        document.querySelectorAll('.view-container').forEach(v => v.classList.remove('visible'));
        document.querySelectorAll('.header-controls').forEach(c => c.style.display = 'none');
        addPersonnelBtn.classList.remove('visible');
        
        const activeTabText = activeItem.querySelector('.text b').textContent.trim();
        
        if (activeTabText === 'Gestion Personnels') {
            personnelView.classList.add('visible');
            addPersonnelBtn.classList.add('visible');
            headerPersonnelControls.style.display = 'flex';
        } else if (activeTabText === 'Disponibilités') {
            calendarView.classList.add('visible');
            headerCalendarControls.style.display = 'flex';
        } else if (activeTabText === 'Paramètres') {
            settingsView.classList.add('visible');
        } else if (activeTabText === 'Équipes') {
            teamsView.classList.add('visible');
            // Aucun header spécifique pour les équipes pour l'instant
        } else {
            // Vue par défaut ou autre
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
            if (tab.classList.contains('admin-only') && !isAdmin) {
                showMessage('Cette section est réservée aux administrateurs.', 'warning');
                return;
            }
            setActiveTab(tab);
        });
    });

    indicator.addEventListener("transitionend", (e) => {
        if (e.propertyName === "transform" && navUl.classList.contains("indicator-ready")) {
            indicator.classList.add("landed");
        }
    });

    function setInitialState() {
        const activeItem = document.querySelector(".navigation .list.active");
        if(activeItem) {
            updateActiveView(activeItem);
            moveIndicator(activeItem);
        }
    }

    // --- LOGIQUE DU CALENDRIER DE DISPONIBILITÉS ---
    const isLeapYear = (year) => (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    const getFebDays = (year) => isLeapYear(year) ? 29 : 28;
    const month_names = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    
    let calendar = document.querySelector('.calendar');
    let month_picker = document.querySelector('#month-picker');
    const dayTextFormate = document.querySelector('.day-text-formate');
    const timeFormate = document.querySelector('.time-formate');
    const dateFormate = document.querySelector('.date-formate');
    if (month_picker) {
        month_picker.onclick = () => { month_list.classList.remove('hideonce', 'hide'); month_list.classList.add('show'); dayTextFormate.classList.remove('showtime'); dayTextFormate.classList.add('hidetime'); timeFormate.classList.remove('showtime'); timeFormate.classList.add('hideTime'); dateFormate.classList.remove('showtime'); dateFormate.classList.add('hideTime'); };
    }

    const generateCalendar = (month, year) => {
        if (!calendarDaysContainer) return;
        calendarDaysContainer.innerHTML = '';
        let calendar_header_year = document.querySelector('#year');
        let days_of_month = [31, getFebDays(year), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        let currentDate = new Date();
        month_picker.innerHTML = month_names[month];
        calendar_header_year.innerHTML = year;
        let first_day = new Date(year, month, 1);
        let day_offset = (first_day.getDay() + 6) % 7;
        for (let i = 0; i < days_of_month[month] + day_offset; i++) {
            let day = document.createElement('div');
            if (i >= day_offset) {
                const dayNumber = i - day_offset + 1;
                const dateId = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
                day.innerHTML = dayNumber;
                day.dataset.date = dateId;
                if (dayNumber === currentDate.getDate() && year === currentDate.getFullYear() && month === currentDate.getMonth()) day.classList.add('current-date');
                if (allAvailabilities[dateId]) {
                    day.classList.add('has-availability');
                    if (selectedPersonnel && allAvailabilities[dateId][selectedPersonnel.id]) day.classList.add('selected-available');
                }
            } else { day.classList.add('empty'); }
            calendarDaysContainer.appendChild(day);
        }
    };

    calendarDaysContainer.addEventListener('click', (e) => {
        const dayDiv = e.target.closest('div:not(.empty)');
        if (!dayDiv) return;

        if (!isAdmin && availabilityDeadline && new Date() > new Date(availabilityDeadline)) {
            showMessage("La date et l'heure limites pour la modification des disponibilités sont passées. L'action est bloquée.", 'error');
            return;
        }

        if (!isAdmin) {
            showMessage("Veuillez vous connecter en tant qu'administrateur pour modifier les disponibilités.", 'warning');
            return;
        }
        if (!selectedPersonnel) { showMessage("Veuillez d'abord sélectionner un pompier dans la barre de recherche.", 'warning'); return; }

        const dateId = dayDiv.dataset.date;
        const availabilityRef = database.ref(`availabilities/${dateId}/${selectedPersonnel.id}`);
        availabilityRef.once('value', (snapshot) => {
            if (snapshot.exists()) availabilityRef.remove();
            else availabilityRef.set({ nom: toBase64(selectedPersonnel.nom), prenom: toBase64(selectedPersonnel.prenom) });
        });
    });

    database.ref('availabilities').on('value', (snapshot) => {
        allAvailabilities = snapshot.val() || {};
        generateCalendar(currentMonth.value, currentYear.value);
        // Si une date est sélectionnée dans la vue équipe, régénérer les équipes
        if (selectedTeamDate) {
            generateAndDisplayTeams(selectedTeamDate);
        }
    });

    let month_list = calendar.querySelector('.month-list');
    if (month_list) {
        month_names.forEach((e, index) => {
            let month = document.createElement('div');
            month.innerHTML = `<div>${e}</div>`;
            month_list.append(month);
            month.onclick = () => { currentMonth.value = index; generateCalendar(currentMonth.value, currentYear.value); month_list.classList.replace('show', 'hide'); dayTextFormate.classList.remove('hideTime'); dayTextFormate.classList.add('showtime'); timeFormate.classList.remove('hideTime'); timeFormate.classList.add('showtime'); dateFormate.classList.remove('hideTime'); dateFormate.classList.add('showtime'); };
        });
        (function() { month_list.classList.add('hideonce'); })();
    }

    const preYearBtn = document.querySelector('#pre-year');
    if (preYearBtn) preYearBtn.onclick = () => { --currentYear.value; generateCalendar(currentMonth.value, currentYear.value); };
    const nextYearBtn = document.querySelector('#next-year');
    if (nextYearBtn) nextYearBtn.onclick = () => { ++currentYear.value; generateCalendar(currentMonth.value, currentYear.value); };

    let currentDate = new Date();
    let currentMonth = { value: currentDate.getMonth() };
    let currentYear = { value: currentDate.getFullYear() };
    generateCalendar(currentMonth.value, currentYear.value);
    
    // --- NOUVELLE LOGIQUE POUR LE CALENDRIER DES ÉQUIPES ---

    let teamsCurrentMonth = { value: currentDate.getMonth() };
    let teamsCurrentYear = { value: currentDate.getFullYear() };

    const generateTeamsCalendar = (month, year) => {
        if (!teamsCalendarDaysContainer) return;
        teamsCalendarDaysContainer.innerHTML = '';
        let monthPicker = document.querySelector('#teams-month-picker');
        let yearPicker = document.querySelector('#teams-year');
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

                if (dateId === selectedTeamDate) {
                    day.classList.add('selected-day');
                }
                if (allEvents[dateId]) {
                    day.classList.add('has-event');
                }
            } else {
                day.classList.add('empty');
            }
            teamsCalendarDaysContainer.appendChild(day);
        }
    };
    
    // Clic sur un jour du calendrier des équipes
    teamsCalendarDaysContainer.addEventListener('click', (e) => {
        const dayDiv = e.target.closest('div:not(.empty)');
        if (!dayDiv || !isAdmin) return;

        selectedTeamDate = dayDiv.dataset.date;
        generateTeamsCalendar(teamsCurrentMonth.value, teamsCurrentYear.value); // Redessiner pour montrer la sélection
        generateAndDisplayTeams(selectedTeamDate);
    });
    
    // Gérer la modale d'événement
    function openEventModal(dateId) {
        eventTypeForm.reset();
        eventDateInput.value = dateId;
        const [year, month, day] = dateId.split('-');
        eventModalTitle.textContent = `Événement du ${day}/${month}/${year}`;
        
        // Pré-cocher les cases si un événement existe déjà
        if (allEvents[dateId] && allEvents[dateId].types) {
            allEvents[dateId].types.forEach(type => {
                const checkbox = eventTypeForm.querySelector(`input[value="${type}"]`);
                if(checkbox) checkbox.checked = true;
            });
        }
        
        openModal(eventTypeModal);
    }
    
    // Sauvegarde de l'événement
    eventTypeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const dateId = eventDateInput.value;
        const selectedTypes = Array.from(eventTypeForm.querySelectorAll('input[name="eventTypes"]:checked')).map(cb => cb.value);
        
        const eventRef = database.ref(`events/${dateId}`);
        if (selectedTypes.length > 0) {
            eventRef.set({ types: selectedTypes });
        } else {
            eventRef.remove(); // Supprimer l'événement s'il n'y a plus de type sélectionné
        }
        
        closeModal(eventTypeModal);
        showMessage('Événement enregistré !', 'success');
    });
    
    // Listener pour les données d'événements
    database.ref('events').on('value', (snapshot) => {
        allEvents = snapshot.val() || {};
        generateTeamsCalendar(teamsCurrentMonth.value, teamsCurrentYear.value);
        if (selectedTeamDate) {
             generateAndDisplayTeams(selectedTeamDate);
        }
    });

    // Navigation du calendrier des équipes
    const teamsMonthList = document.querySelector('#teams-month-list');
    month_names.forEach((e, index) => {
        let month = document.createElement('div');
        month.innerHTML = `<div>${e}</div>`;
        teamsMonthList.append(month);
        month.onclick = () => {
            teamsCurrentMonth.value = index;
            generateTeamsCalendar(teamsCurrentMonth.value, teamsCurrentYear.value);
            teamsMonthList.classList.replace('show', 'hide');
        };
    });

    document.querySelector('#teams-month-picker').onclick = () => teamsMonthList.classList.add('show');
    document.querySelector('#teams-pre-year').onclick = () => { --teamsCurrentYear.value; generateTeamsCalendar(teamsCurrentMonth.value, teamsCurrentYear.value); };
    document.querySelector('#teams-next-year').onclick = () => { ++teamsCurrentYear.value; generateTeamsCalendar(teamsCurrentMonth.value, teamsCurrentYear.value); };

    // --- ALGORITHME DE GÉNÉRATION D'ÉQUIPES ---

    const ROLES = {
        CCF_DRIVER: "Conducteur Poids Lourd (CCF4MHP37)",
        CCF_LEADER: "Chef d'Agrès FDF (CCF4MHP37)",
        CCF_TEAMMATE: "Équipier FDF (CCF4MHP37)",
        MPR_DRIVER: "Conducteur Voiture (MPR12)",
        MPR_TEAMMATE: "Équipier DIV (MPR12)"
    };

    function generateAndDisplayTeams(dateId) {
        const availablePersonnelIds = Object.keys(allAvailabilities[dateId] || {});
        
        if (availablePersonnelIds.length === 0) {
            generatedTeamsContainer.innerHTML = `
                <div class="teams-display-header">
                     <h3>Équipes du ${dateId.split('-').reverse().join('/')}</h3>
                     <p>Aucun personnel disponible pour cette date.</p>
                </div>`;
            return;
        }

        // Créer une copie modifiable des IDs disponibles
        let availablePool = [...availablePersonnelIds];
        
        // Classer les personnels disponibles par fonction
        const personnelByFunction = {};
        availablePool.forEach(pId => {
            const person = allPersonnel[pId];
            if (person && person.fonctions) {
                person.fonctions.map(f => fromBase64(f)).forEach(func => {
                    if (!personnelByFunction[func]) {
                        personnelByFunction[func] = [];
                    }
                    personnelByFunction[func].push(pId);
                });
            }
        });

        const ccfTeam = {
            [ROLES.CCF_DRIVER]: null,
            [ROLES.CCF_LEADER]: null,
            [ROLES.CCF_TEAMMATE]: [],
        };

        const mprTeam = {
            [ROLES.MPR_DRIVER]: null,
            [ROLES.MPR_TEAMMATE]: null,
        };

        // Fonction pour assigner une personne et la retirer du pool
        const assignPersonnel = (role, pool) => {
            const candidates = personnelByFunction[role] || [];
            for (const candidateId of candidates) {
                if (pool.includes(candidateId)) {
                    // Retirer la personne du pool global pour qu'elle ne soit pas assignée deux fois
                    pool.splice(pool.indexOf(candidateId), 1);
                    return candidateId;
                }
            }
            return null; // Personne non trouvée
        };
        
        // 1. Priorité : Équipe CCF
        ccfTeam[ROLES.CCF_DRIVER] = assignPersonnel(ROLES.CCF_DRIVER, availablePool);
        ccfTeam[ROLES.CCF_LEADER] = assignPersonnel(ROLES.CCF_LEADER, availablePool);
        // On a besoin de 2 équipiers
        for(let i=0; i<2; i++){
            const teammate = assignPersonnel(ROLES.CCF_TEAMMATE, availablePool);
            if(teammate) ccfTeam[ROLES.CCF_TEAMMATE].push(teammate);
        }

        // 2. Équipe MPR avec le personnel restant
        mprTeam[ROLES.MPR_DRIVER] = assignPersonnel(ROLES.MPR_DRIVER, availablePool);
        mprTeam[ROLES.MPR_TEAMMATE] = assignPersonnel(ROLES.MPR_TEAMMATE, availablePool);

        // 3. Affichage
        renderTeams(dateId, ccfTeam, mprTeam);
    }
    
    function renderTeams(dateId, ccfTeam, mprTeam) {
        const eventInfo = allEvents[dateId];
        const eventTagsHtml = eventInfo && eventInfo.types 
            ? `<div class="event-tags">${eventInfo.types.map(t => `<span class="event-tag">${t}</span>`).join('')}</div>`
            : `<div class="event-tags"><span class="event-tag" style="background-color: var(--text-secondary);">Aucun événement défini</span></div>`;

        const getPersonnelName = (id) => {
            if (!id) return '<span class="personnel-name unassigned">Non assigné</span>';
            const p = allPersonnel[id];
            return `<span class="personnel-name">${fromBase64(p.prenom)} ${fromBase64(p.nom)}</span>`;
        };
        
        const isCcfComplete = ccfTeam[ROLES.CCF_DRIVER] && ccfTeam[ROLES.CCF_LEADER] && ccfTeam[ROLES.CCF_TEAMMATE].length === 2;
        const isMprComplete = mprTeam[ROLES.MPR_DRIVER] && mprTeam[ROLES.MPR_TEAMMATE];

        generatedTeamsContainer.innerHTML = `
            <div class="teams-display-header">
                <h3>Équipes du ${dateId.split('-').reverse().join('/')}</h3>
                ${eventTagsHtml}
                <button id="edit-event-btn" class="btn-primary" style="margin-top:1rem; padding: 0.5rem 1rem;">Gérer l'Événement</button>
            </div>
            <div class="teams-grid">
                <div class="team-card ${isCcfComplete ? '' : 'incomplete'}">
                    <h4><ion-icon name="bus-outline"></ion-icon> Équipe CCF4MHP37</h4>
                    <div class="role"><span class="role-name">Conducteur PL:</span> ${getPersonnelName(ccfTeam[ROLES.CCF_DRIVER])}</div>
                    <div class="role"><span class="role-name">Chef d'Agrès FDF:</span> ${getPersonnelName(ccfTeam[ROLES.CCF_LEADER])}</div>
                    <div class="role"><span class="role-name">Équipier FDF 1:</span> ${getPersonnelName(ccfTeam[ROLES.CCF_TEAMMATE][0])}</div>
                    <div class="role"><span class="role-name">Équipier FDF 2:</span> ${getPersonnelName(ccfTeam[ROLES.CCF_TEAMMATE][1])}</div>
                </div>
                <div class="team-card ${isMprComplete ? '' : 'incomplete'}">
                    <h4><ion-icon name="car-sport-outline"></ion-icon> Équipe MPR12</h4>
                    <div class="role"><span class="role-name">Conducteur VL:</span> ${getPersonnelName(mprTeam[ROLES.MPR_DRIVER])}</div>
                    <div class="role"><span class="role-name">Équipier DIV:</span> ${getPersonnelName(mprTeam[ROLES.MPR_TEAMMATE])}</div>
                </div>
            </div>`;

        document.getElementById('edit-event-btn').addEventListener('click', () => {
            openEventModal(dateId);
        });
    }


    // --- AFFICHAGE DE L'HEURE ET DATE ACTUELLES ---
    const todayShowTime = document.querySelector('.time-formate');
    const todayShowDate = document.querySelector('.date-formate');
    const currshowDate = new Date();
    const showCurrentDateOption = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    const currentDateFormate = new Intl.DateTimeFormat('fr-FR', showCurrentDateOption).format(currshowDate);
    if(todayShowDate) todayShowDate.textContent = currentDateFormate;
    setInterval(() => {
        const timer = new Date();
        const option = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
        const formateTimer = new Intl.DateTimeFormat('fr-FR', option).format(timer);
       if(todayShowTime) todayShowTime.textContent = formateTimer;
    }, 1000);

    // Initialisation finale
    updateAdminUI();
    setInitialState();
    generateTeamsCalendar(teamsCurrentMonth.value, teamsCurrentYear.value); // Générer le calendrier des équipes au démarrage
});