document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURATION FIREBASE ---
    const firebaseConfig = {
        apiKey: "AIzaSyDVD-VSJnQBBxV-xGaG2hSroKATe0PCoFI",
        authDomain: "calendrier-cis.firebaseapp.com",
        databaseURL: "https://calendrier-cis-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: "calendrier-cis",
        storageBucket: "calendrier-cis.appspot.com",
        messagingSenderId: "765976767744",
        appId: "1:765976767744:web:3a865f5b727bbdd49e57e5"
    };

    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();
    const eventsRef = database.ref('events');

    // --- ÉLÉMENTS DU DOM ---
    const calendarGrid = document.getElementById('calendarGrid');
    const searchInput = document.getElementById('searchInput');
    const typeFilter = document.getElementById('typeFilter');
    const eventModal = document.getElementById('eventModal');
    const eventDetailsModal = document.getElementById('eventDetailsModal');
    const customAlertModal = document.getElementById('customAlertModal');
    const eventForm = document.getElementById('eventForm');
    const addEventBtn = document.getElementById('addEventBtn');
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    const newParticipantNameInput = document.getElementById('newParticipantNameInput');
    const addParticipantToFormBtn = document.getElementById('addParticipantToFormBtn');
    const formParticipantsListUI = document.getElementById('formParticipantsList');
    
    // --- VARIABLES D'ÉTAT ---
    let allEvents = {};
    let currentDate = new Date();
    let currentSearchTerm = '';
    let currentFilterType = 'all';
    let currentDetailEventId = null;
    let currentFormParticipants = []; 

    // --- DIALOGUES PERSONNALISÉS ---
    function showCustomConfirm({ title, message, okText = 'Confirmer', cancelText = 'Annuler' }) {
        return new Promise(resolve => {
            document.getElementById('customAlertTitle').textContent = title;
            document.getElementById('customAlertMessage').textContent = message;
            document.getElementById('customAlertInput').style.display = 'none';

            const actionsContainer = document.querySelector('#customAlertModal .custom-alert-actions');
            actionsContainer.innerHTML = `
                <button type="button" class="cancel-btn">${cancelText}</button>
                <button type="button" class="ok-btn">${okText}</button>
            `;

            customAlertModal.style.display = 'flex';

            const closeAndResolve = (value) => {
                customAlertModal.style.display = 'none';
                resolve(value);
            };

            actionsContainer.querySelector('.ok-btn').onclick = () => closeAndResolve(true);
            actionsContainer.querySelector('.cancel-btn').onclick = () => closeAndResolve(false);
        });
    }

    function showCustomPrompt({ title, message, okText = 'Valider', cancelText = 'Annuler' }) {
        return new Promise(resolve => {
            document.getElementById('customAlertTitle').textContent = title;
            document.getElementById('customAlertMessage').textContent = message;
            
            const input = document.getElementById('customAlertInput');
            input.value = '';
            input.style.display = 'block';

            const actionsContainer = document.querySelector('#customAlertModal .custom-alert-actions');
            actionsContainer.innerHTML = `
                <button type="button" class="cancel-btn">${cancelText}</button>
                <button type="button" class="ok-btn">${okText}</button>
            `;

            customAlertModal.style.display = 'flex';
            input.focus();

            const closeAndResolve = (value) => {
                customAlertModal.style.display = 'none';
                resolve(value);
            };

            actionsContainer.querySelector('.ok-btn').onclick = () => closeAndResolve(input.value);
            actionsContainer.querySelector('.cancel-btn').onclick = () => closeAndResolve(null);
        });
    }

    // --- FILTRAGE ET AFFICHAGE ---
    function eventMatchesFilters(event) {
        const search = currentSearchTerm.toLowerCase();
        const matchesSearch = !search || 
            event.title.toLowerCase().includes(search) ||
            (event.description && event.description.toLowerCase().includes(search));
        
        const matchesType = currentFilterType === 'all' || event.type === currentFilterType;

        return matchesSearch && matchesType;
    }

    function applyFiltersAndRender() {
        renderCalendar();
        renderEventsList();
    }

    // --- CALENDRIER ---
    function renderCalendar() {
        calendarGrid.innerHTML = `<div class="day-name">Lun</div><div class="day-name">Mar</div><div class="day-name">Mer</div><div class="day-name">Jeu</div><div class="day-name">Ven</div><div class="day-name">Sam</div><div class="day-name">Dim</div>`;
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        document.getElementById('currentMonthYear').textContent = `${currentDate.toLocaleString('fr-FR', { month: 'long' })} ${year}`;
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startingDay = (firstDayOfMonth === 0) ? 6 : firstDayOfMonth - 1;

        for (let i = 0; i < startingDay; i++) {
            calendarGrid.appendChild(document.createElement('div')).classList.add('day-cell', 'other-month');
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const cell = document.createElement('div');
            cell.classList.add('day-cell');
            const dateStr = new Date(year, month, i).toISOString().split('T')[0];
            cell.dataset.date = dateStr;
            const dayNumber = document.createElement('span');
            dayNumber.classList.add('day-number');
            dayNumber.textContent = i;
            cell.appendChild(dayNumber);
            if (i === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()) {
                cell.classList.add('today');
            }
            const dayEvents = Object.entries(allEvents).filter(([, e]) => e.date === dateStr);
            if (dayEvents.length > 0) {
                const eventsContainer = document.createElement('div');
                eventsContainer.className = 'day-events-container';
                dayEvents.forEach(([id, event]) => {
                    const eventItem = document.createElement('div');
                    eventItem.className = `day-event-item ${event.type}`;
                    
                    const titleSpan = document.createElement('span');
                    titleSpan.className = 'event-title-on-calendar';
                    titleSpan.textContent = event.title;
                    
                    const countSpan = document.createElement('span');
                    countSpan.className = 'event-participant-count-on-calendar';
                    const participantCount = event.participants ? Object.keys(event.participants).length : 0;
                    countSpan.textContent = `(${participantCount})`;
                    
                    eventItem.appendChild(titleSpan);
                    eventItem.appendChild(countSpan);

                    if (!eventMatchesFilters(event)) {
                        eventItem.classList.add('filtered-out');
                    }
                    eventsContainer.appendChild(eventItem);
                });
                cell.appendChild(eventsContainer);
            }
            cell.addEventListener('click', () => openDayEvents(dateStr));
            calendarGrid.appendChild(cell);
        }
    }
    
    function openDayEvents(dateStr) {
        const dayEvents = Object.entries(allEvents).filter(([, e]) => e.date === dateStr && eventMatchesFilters(e));
        if (dayEvents.length > 0) {
            showEventDetails(dayEvents[0][0]);
        } else {
            openEventModalForCreate(dateStr);
        }
    }

    // --- LISTE DES ÉVÉNEMENTS ---
    function renderEventsList() {
        const upcomingList = document.getElementById('upcomingEventsList');
        const pastList = document.getElementById('pastEventsList');
        const archivedList = document.getElementById('archivedEventsList');
        
        upcomingList.innerHTML = '';
        pastList.innerHTML = '';
        archivedList.innerHTML = '';

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const filteredEvents = Object.entries(allEvents).filter(([, event]) => eventMatchesFilters(event));
        // Tri pour passés/archivés : plus récent en haut. À venir : plus proche en haut.
        const sortedForPastArchived = [...filteredEvents].sort(([,a], [,b]) => new Date(b.date) - new Date(a.date));
        const sortedForUpcoming = [...filteredEvents].sort(([,a], [,b]) => new Date(a.date) - new Date(b.date));

        let upcomingCount = 0, pastCount = 0, archivedCount = 0;

        // Pour 'À venir', on veut le plus proche en premier, donc on itère sur la liste triée normalement et on ajoute à la fin (prepend)
        sortedForUpcoming.reverse().forEach(([id, event]) => {
            const eventDate = new Date(event.date);
            if (!event.isArchived && eventDate >= now) {
                const item = createEventListItem(id, event, false);
                upcomingList.appendChild(item); // append pour ordre chronologique correct
                upcomingCount++;
            }
        });

        // Pour 'Passés' et 'Archives', on veut le plus récent en premier
        sortedForPastArchived.forEach(([id, event]) => {
            const eventDate = new Date(event.date);
            const item = createEventListItem(id, event, eventDate < now);
            if (event.isArchived) {
                archivedList.appendChild(item);
                archivedCount++;
            } else if (eventDate < now) {
                pastList.appendChild(item);
                pastCount++;
            }
        });


        if (upcomingCount === 0) upcomingList.innerHTML = '<p class="no-events">Aucun événement à venir.</p>';
        if (pastCount === 0) pastList.innerHTML = '<p class="no-events">Aucun événement passé.</p>';
        if (archivedCount === 0) archivedList.innerHTML = '<p class="no-events">Aucun événement archivé.</p>';
    }

    function createEventListItem(id, event, isPast) {
        const item = document.createElement('div');
        item.className = 'event-list-item';
        item.dataset.eventId = id;

        const content = document.createElement('div');
        content.className = 'event-list-item-content';
        content.innerHTML = `
            <div class="event-list-item-type ${event.type}"></div>
            <div class="event-list-item-details">
                <div class="title">${event.title}</div>
                <div class="date">${new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
            </div>`;
        content.addEventListener('click', () => showEventDetails(id));
        
        const actions = document.createElement('div');
        actions.className = 'event-item-actions';

        if (event.isArchived) {
            const unarchiveBtn = document.createElement('button');
            unarchiveBtn.className = 'unarchive-btn';
            unarchiveBtn.innerHTML = `<ion-icon name="arrow-up-circle-outline"></ion-icon>`;
            unarchiveBtn.title = "Désarchiver";
            unarchiveBtn.type = 'button';
            unarchiveBtn.addEventListener('click', () => eventsRef.child(id).update({ isArchived: false }));
            actions.appendChild(unarchiveBtn);
        } else if (isPast) {
            const archiveBtn = document.createElement('button');
            archiveBtn.className = 'archive-btn';
            archiveBtn.innerHTML = `<ion-icon name="archive-outline"></ion-icon>`;
            archiveBtn.title = "Archiver";
            archiveBtn.type = 'button';
            archiveBtn.addEventListener('click', () => eventsRef.child(id).update({ isArchived: true }));
            actions.appendChild(archiveBtn);
        }

        if (isPast || event.isArchived) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = `<ion-icon name="trash-outline"></ion-icon>`;
            deleteBtn.title = "Supprimer définitivement";
            deleteBtn.type = 'button';
            deleteBtn.addEventListener('click', async () => {
                const isConfirmed = await showCustomConfirm({
                    title: 'Confirmation de Suppression',
                    message: `Voulez-vous vraiment supprimer l'événement "${event.title}" ? Cette action est irréversible.`,
                    okText: 'Supprimer',
                    cancelText: 'Annuler'
                });
                if (isConfirmed) {
                    eventsRef.child(id).remove();
                }
            });
            actions.appendChild(deleteBtn);
        }

        item.appendChild(content);
        if (actions.hasChildNodes()) {
            item.appendChild(actions);
        }
        
        return item;
    }

    // --- GESTION INTERACTIVE DES PARTICIPANTS DANS LE FORMULAIRE ---
    function renderFormParticipantsList() {
        formParticipantsListUI.innerHTML = '';
        if (currentFormParticipants.length === 0) {
            const li = document.createElement('li');
            li.textContent = "Aucun participant ajouté.";
            li.style.fontStyle = "italic";
            li.style.opacity = "0.7";
            formParticipantsListUI.appendChild(li);
            return;
        }
        currentFormParticipants.forEach((name, index) => {
            const li = document.createElement('li');
            li.textContent = name;
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-participant-btn';
            removeBtn.innerHTML = `<ion-icon name="trash-outline"></ion-icon>`;
            removeBtn.title = "Supprimer ce participant";
            removeBtn.type = 'button'; 
            removeBtn.addEventListener('click', () => {
                currentFormParticipants.splice(index, 1); 
                renderFormParticipantsList(); 
            });
            li.appendChild(removeBtn);
            formParticipantsListUI.appendChild(li);
        });
    }

    addParticipantToFormBtn.addEventListener('click', () => {
        const newName = newParticipantNameInput.value.trim();
        if (newName) {
            if (!currentFormParticipants.includes(newName)) {
                currentFormParticipants.push(newName);
                renderFormParticipantsList();
            }
            newParticipantNameInput.value = ''; 
        }
        newParticipantNameInput.focus();
    });

    // --- GESTION DES MODALS ---
    function openEventModalForCreate(date = null) {
        eventForm.reset();
        document.getElementById('eventId').value = '';
        document.getElementById('modalTitle').textContent = "Ajouter un Événement";
        document.getElementById('saveEventBtn').textContent = "Enregistrer";
        document.getElementById('eventDate').value = date || new Date().toISOString().split('T')[0];
        
        currentFormParticipants = []; 
        renderFormParticipantsList(); 
        
        eventModal.style.display = 'flex';
    }

    function openEventModalForEdit(eventId) {
        const event = allEvents[eventId];
        if (!event) return;
        closeDetailsModal();
        
        document.getElementById('eventId').value = eventId;
        document.getElementById('modalTitle').textContent = "Modifier l'Événement";
        document.getElementById('eventTitle').value = event.title;
        document.getElementById('eventDate').value = event.date;
        document.getElementById('eventType').value = event.type;
        document.getElementById('eventLocation').value = event.location || '';
        document.getElementById('eventDuration').value = event.duration || 'indeterminee';
        document.getElementById('eventDescription').value = event.description || '';
        
        currentFormParticipants = []; 
        if (event.participants) {
            currentFormParticipants = Object.values(event.participants).map(p => p.name);
        }
        renderFormParticipantsList();
        
        document.getElementById('saveEventBtn').textContent = "Mettre à jour";
        eventModal.style.display = 'flex';
    }

    function showEventDetails(eventId) {
        const event = allEvents[eventId];
        if (!event) {
            closeDetailsModal(); // Si l'événement n'existe plus (ex: supprimé par un autre utilisateur)
            return;
        }
        currentDetailEventId = eventId;

        document.getElementById('detailsTitle').textContent = event.title;
        document.getElementById('detailsDate').textContent = new Date(event.date).toLocaleDateString('fr-FR');
        document.getElementById('detailsLocation').textContent = event.location || 'Non spécifié';
        const durationValue = event.duration || 'indeterminee';
        let friendlyDuration = durationValue.replace(/-/g, ' ');
        friendlyDuration = friendlyDuration.charAt(0).toUpperCase() + friendlyDuration.slice(1);
        document.getElementById('detailsDuration').textContent = friendlyDuration;
        document.getElementById('detailsType').textContent = event.type.charAt(0).toUpperCase() + event.type.slice(1);
        document.getElementById('detailsDescription').textContent = event.description || "Aucune description.";
        
        refreshParticipantsListInDetailsModal(event.participants, eventId);
        eventDetailsModal.style.display = 'flex';
    }

    function refreshParticipantsListInDetailsModal(participantsData, eventId) {
        const pList = document.getElementById('participantsList');
        pList.innerHTML = '';
        if (participantsData && Object.keys(participantsData).length > 0) {
            Object.entries(participantsData).forEach(([participantKey, participant]) => {
                const li = document.createElement('li');
                
                const nameSpan = document.createElement('span');
                nameSpan.textContent = participant.name;
                li.appendChild(nameSpan);

                const deleteParticipantBtn = document.createElement('button');
                deleteParticipantBtn.className = 'remove-participant-from-details-btn';
                deleteParticipantBtn.innerHTML = '<ion-icon name="trash-outline" role="img" class="hydrated" aria-label="trash outline"></ion-icon>';
                deleteParticipantBtn.title = 'Supprimer ce participant';
                deleteParticipantBtn.type = 'button';
                
                deleteParticipantBtn.addEventListener('click', async () => {
                    const isConfirmed = await showCustomConfirm({
                        title: 'Supprimer le Participant',
                        message: `Êtes-vous sûr de vouloir supprimer "${participant.name}" de cet événement ?`,
                        okText: 'Supprimer',
                        cancelText: 'Annuler'
                    });
                    if (isConfirmed) {
                        eventsRef.child(eventId).child('participants').child(participantKey).remove();
                    }
                });
                li.appendChild(deleteParticipantBtn);
                pList.appendChild(li);
            });
        } else {
            pList.innerHTML = "<li>Aucun participant.</li>";
        }
    }
    
    const closeEventModal = () => {
        eventModal.style.display = 'none';
        currentFormParticipants = []; 
    };
    const closeDetailsModal = () => { 
        eventDetailsModal.style.display = 'none'; 
        currentDetailEventId = null; 
    };

    // --- GESTION DES ÉVÉNEMENTS (FIREBASE) ---
    eventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const eventId = document.getElementById('eventId').value;
        
        const participantsObject = {};
        if (currentFormParticipants.length > 0) {
            currentFormParticipants.forEach(name => {
                const participantId = `id_${name.replace(/\s+/g, '_').toLowerCase()}_${Math.random().toString(36).substr(2, 9)}`;
                participantsObject[participantId] = { name: name };
            });
        }

        const eventData = { 
            title: document.getElementById('eventTitle').value, 
            date: document.getElementById('eventDate').value, 
            type: document.getElementById('eventType').value, 
            location: document.getElementById('eventLocation').value,
            duration: document.getElementById('eventDuration').value,
            description: document.getElementById('eventDescription').value,
            participants: participantsObject,
            isArchived: (eventId && allEvents[eventId]) ? allEvents[eventId].isArchived || false : false
        };
        
        if (eventId) {
            eventsRef.child(eventId).update(eventData);
        } else {
            eventsRef.push().set(eventData);
        }
        closeEventModal();
    });

    // --- ÉCOUTEURS D'ÉVÉNEMENTS ---
    searchInput.addEventListener('input', e => { currentSearchTerm = e.target.value.toLowerCase(); applyFiltersAndRender(); });
    typeFilter.addEventListener('change', e => { currentFilterType = e.target.value; applyFiltersAndRender(); });
    addEventBtn.addEventListener('click', () => openEventModalForCreate());
    prevMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
    nextMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });
    document.querySelector('#eventModal .close-btn').addEventListener('click', closeEventModal);
    document.querySelector('#eventDetailsModal .close-details-btn').addEventListener('click', closeDetailsModal);
    
    window.addEventListener('click', e => {
        if (e.target == eventModal) closeEventModal();
        if (e.target == eventDetailsModal) closeDetailsModal();
        if (e.target == customAlertModal && customAlertModal.style.display === 'flex') {
            // Gérer la fermeture de la modale custom si on clique à l'extérieur
            // Cela dépend de comment vous voulez que `resolve` soit appelé (null, false ?)
            // Pour l'instant, on ne fait rien pour éviter de résoudre la promesse incorrectement
        }
    });

    document.getElementById('editEventBtn').addEventListener('click', () => { if (currentDetailEventId) openEventModalForEdit(currentDetailEventId); });
    
    document.getElementById('deleteEventBtn').addEventListener('click', async () => {
        if (!currentDetailEventId) return;
        const eventToDelete = allEvents[currentDetailEventId];
        if (!eventToDelete) return;

        const isConfirmed = await showCustomConfirm({
            title: 'Confirmation de Suppression',
            message: `Êtes-vous sûr de vouloir supprimer l'événement "${eventToDelete.title}" ? Cette action est irréversible.`,
            okText: 'Supprimer',
            cancelText: 'Annuler'
        });
        if (isConfirmed) {
            eventsRef.child(currentDetailEventId).remove();
            closeDetailsModal();
        }
    });
    
    document.getElementById('joinEventBtn').addEventListener('click', async () => {
        if (!currentDetailEventId) return;
        const userName = await showCustomPrompt({
            title: "Rejoindre l'événement",
            message: 'Entrez votre nom pour participer :',
            okText: 'Rejoindre',
            cancelText: 'Annuler'
        });
        if (userName && userName.trim() !== '') {
            eventsRef.child(currentDetailEventId).child('participants').push().set({ name: userName.trim() });
        }
    });

    // Listener Firebase pour la mise à jour en temps réel
    eventsRef.on('value', snapshot => { 
        const data = snapshot.val() || {};
        allEvents = data; 

        applyFiltersAndRender();
        
        if (eventDetailsModal.style.display === 'flex' && currentDetailEventId && allEvents[currentDetailEventId]) {
            const currentEventData = allEvents[currentDetailEventId];
            document.getElementById('detailsTitle').textContent = currentEventData.title;
            document.getElementById('detailsDate').textContent = new Date(currentEventData.date).toLocaleDateString('fr-FR');
            document.getElementById('detailsLocation').textContent = currentEventData.location || 'Non spécifié';
            const durationValue = currentEventData.duration || 'indeterminee';
            let friendlyDuration = durationValue.replace(/-/g, ' ');
            friendlyDuration = friendlyDuration.charAt(0).toUpperCase() + friendlyDuration.slice(1);
            document.getElementById('detailsDuration').textContent = friendlyDuration;
            document.getElementById('detailsType').textContent = currentEventData.type.charAt(0).toUpperCase() + currentEventData.type.slice(1);
            document.getElementById('detailsDescription').textContent = currentEventData.description || "Aucune description.";
            refreshParticipantsListInDetailsModal(currentEventData.participants, currentDetailEventId);
        } else if (eventDetailsModal.style.display === 'flex' && currentDetailEventId && !allEvents[currentDetailEventId]) {
            closeDetailsModal();
        }
    });

    // --- NAVIGATION ET ANIMATIONS ---
    const navList = document.querySelectorAll(".navigation .list");
    const ul = document.querySelector(".navigation ul");
    const indicator = document.querySelector(".indicator");
    const pageViews = document.querySelectorAll('.page-view');

    function moveIndicator(activeItem) {
        if (!activeItem) return;
        const itemWidth = activeItem.offsetWidth;
        const itemPosition = activeItem.offsetLeft;
        const centerOffset = (itemWidth / 2) - (indicator.offsetWidth / 2);
        ul.style.setProperty('--indicator-x-pos', `${itemPosition + centerOffset}px`);
        ul.classList.add('indicator-ready');
        const activeIconEl = activeItem.querySelector('.icon ion-icon');
        indicator.innerHTML = '';
        indicator.appendChild(document.createElement('div')).className = 'shockwave';
        if (activeIconEl) indicator.appendChild(activeIconEl.cloneNode(true));
        indicator.classList.remove("landed");
    }

    indicator.addEventListener('transitionend', e => {
        if (e.propertyName === 'transform' && ul.classList.contains('indicator-ready')) {
            indicator.classList.add("landed");
        }
    });

    function setActiveLink(clickedItem) {
        if (clickedItem.classList.contains('active')) return;
        ul.classList.remove('indicator-ready');
        navList.forEach(item => item.classList.remove("active"));
        clickedItem.classList.add("active");
        const viewId = clickedItem.dataset.view;
        pageViews.forEach(view => view.classList.toggle('active', view.id === viewId));
        setTimeout(() => moveIndicator(clickedItem), 50);
    }
    navList.forEach(item => item.addEventListener("click", () => setActiveLink(item)));
    
    function setInitialState() {
        const activeItem = document.querySelector('.list.active');
        if (activeItem) setTimeout(() => moveIndicator(activeItem), 50);
        const embersContainer = document.querySelector('.background-embers');
        if (embersContainer) {
            for (let i = 0; i < 40; i++) {
                const ember = document.createElement('div');
                ember.className = 'ember';
                const size = Math.random() * 6 + 2;
                ember.style.cssText = `width:${size}px; height:${size}px; left:${Math.random()*100}%; animation-duration:${Math.random()*15+10}s; animation-delay:${Math.random()*15}s;`;
                embersContainer.appendChild(ember);
            }
        }
    }

    window.addEventListener('load', setInitialState);
});
