document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURATION ET INITIALISATION FIREBASE ---
    const firebaseConfig = {
        apiKey: "AIzaSyDmnua63SSMYhjaTdgRAoMIpPl215jgyo4", // Clé d'exemple, utilisez la vôtre
        authDomain: "retour-intervention-vsav.firebaseapp.com",
        databaseURL: "https://retour-intervention-vsav-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: "retour-intervention-vsav",
        storageBucket: "retour-intervention-vsav.appspot.com",
        messagingSenderId: "314826866332",
        appId: "1:314826866332:web:e02ff593621bef09eb3759",
        measurementId: "G-VBJC5RWF15"
    };
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();

    // --- SÉLECTEURS D'ÉLÉMENTS ---
    const navItems = document.querySelectorAll(".navigation .list");
    const navUl = document.querySelector(".navigation ul");
    const indicator = document.querySelector(".navigation .indicator");
    const viewContainers = document.querySelectorAll('.view-container');
    const topLoginBtn = document.getElementById('top-login-btn');
    const loaderModal = document.getElementById('loader-modal');
    const imagePreviewModal = document.getElementById('image-preview-modal');
    const fullImagePreview = document.getElementById('full-image-preview');
    const headerControlGroups = document.querySelectorAll('.header-control-group');
    const interventionForm = document.getElementById('interventionForm');
    const materielsList = document.getElementById('materielsList');
    const photoPreview = document.getElementById('photoPreview');
    const interventionIdInput = document.getElementById('interventionId');
    const currentInterventionsCards = document.getElementById('currentInterventionsCards');
    const archivedInterventionsCards = document.getElementById('archivedInterventionsCards');
    const pharmacyInterventionsCards = document.getElementById('pharmacyInterventionsCards');
    const detailsModal = document.getElementById('detailsModal');
    const pharmacyPasswordModal = document.getElementById('pharmacyPasswordModal');
    const postInterventionMaterialModal = document.getElementById('postInterventionMaterialModal');

    // Sélecteurs pour les contrôles DANS L'EN-TÊTE
    const currentSearchInput = document.getElementById('currentSearch');
    const filterDropdownBtn = document.getElementById('filterDropdownBtn');
    const filterDropdownMenu = document.getElementById('filterDropdownMenu');
    const exportDropdownBtn = document.getElementById('exportDropdownBtn');
    const exportDropdownMenu = document.getElementById('exportDropdownMenu');
    const exportExcelBtn = document.getElementById('exportExcelBtn');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    const archiveSearchInput = document.getElementById('archiveSearch');
    const pharmacySearchInput = document.getElementById('pharmacySearch');
    const exportPharmacyBtn = document.getElementById('exportPharmacyBtn');

    // Sélecteurs pour la section Pharmacie
    const pharmacyNavBtns = document.querySelectorAll('.pharmacy-nav-btn');
    const pharmacyTabPanes = document.querySelectorAll('.pharmacy-tab-pane');
    const stockTableBody = document.getElementById('stockTableBody');
    const addStockItemBtn = document.getElementById('addStockItemBtn');
    const pharmacyLogBody = document.getElementById('pharmacyLogBody');
    const geolocateBtn = document.getElementById('geolocateBtn');

    let monthlyChart = null;
    let statusChart = null;

    const ITEMS_PER_PAGE = 6;
    let currentPage_current = 1;
    let currentPage_archive = 1;
    let currentPage_pharmacy = 1;

    let allInterventions = {};
    let pharmacyStock = {};
    let pharmacyLog = {};
    let materiels = [];
    let photosBase64 = [];
    const PHARMACY_PASSWORD = "018A";
    const DELETE_PASSWORD = "Aspf66220*";
    let isPharmacyAuthenticated = false;
    let currentFilterStatus = 'all';
    let currentUser = "Utilisateur";

    // --- GESTION DES DONNÉES ET AFFICHAGE ---
    database.ref('interventions').on('value', (snapshot) => {
        allInterventions = snapshot.val() || {};
        refreshCurrentView();
    });

    database.ref('pharmacy/stock').on('value', (snapshot) => {
        pharmacyStock = snapshot.val() || {};
        if (document.getElementById('pharmacy-view').classList.contains('visible')) {
            displayStock();
        }
    });

    database.ref('pharmacy/log').on('value', (snapshot) => {
        pharmacyLog = snapshot.val() || {};
        if (document.getElementById('pharmacy-view').classList.contains('visible')) {
            displayPharmacyLog();
        }
    });

    function refreshCurrentView() {
        const activeTab = document.querySelector(".navigation .list.active");
        if (activeTab) {
            updateActiveView(activeTab, false);
        } else {
            displayInterventions();
        }
    }

    // --- GESTION DES CONTRÔLES DE L'EN-TÊTE ---
    function updateHeaderControls(activeViewId) {
        headerControlGroups.forEach(group => {
            const targetId = `header-controls-${activeViewId.replace('-view', '')}`;
            group.classList.toggle('visible', group.id === targetId);
        });
    }

    // --- LOGIQUE DE NAVIGATION ---
    function moveIndicator(element) {
        if (!element || !indicator || !navUl) return;
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
            if (icon) {
                const clonedIcon = icon.cloneNode(true);
                indicator.appendChild(clonedIcon);
            }
            indicator.classList.remove("landed");
            setTimeout(() => indicator.classList.add("landed"), 50);
        }, 50);
    }

    function updateActiveView(activeItem, move = true) {
        const viewId = activeItem.dataset.view;
        viewContainers.forEach(v => v.classList.remove('visible'));
        const activeView = document.getElementById(viewId);
        if (activeView) {
            activeView.classList.add('visible');
            updateHeaderControls(viewId);

            currentPage_current = 1;
            currentPage_archive = 1;
            currentPage_pharmacy = 1;

            switch (viewId) {
                case 'pharmacy-view':
                    displayInterventions();
                    displayStock();
                    displayPharmacyLog();
                    break;
                case 'current-view':
                case 'archive-view':
                    displayInterventions();
                    break;
                case 'stats-view':
                    updateStats();
                    updateCharts();
                    break;
            }
        }
        if (move) {
            moveIndicator(activeItem);
        }
    }

    function setActiveTab(tabElement) {
        if (!tabElement || tabElement.classList.contains('active')) return;
        if (navUl) navUl.classList.remove("indicator-ready");
        navItems.forEach(item => item.classList.remove('active'));
        tabElement.classList.add('active');
        updateActiveView(tabElement);
    }

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = e.currentTarget.closest('li');
            if (tab.dataset.view === 'pharmacy-view' && !isPharmacyAuthenticated) {
                promptForPharmacyPassword();
            } else {
                setActiveTab(tab);
            }
        });
    });

    // --- LOGIQUE PHARMACIE (Accès et Navigation interne) ---
    function promptForPharmacyPassword() {
        const passwordInput = document.getElementById('pharmacyPasswordInput');
        passwordInput.value = '';
        pharmacyPasswordModal.classList.add('visible');
        passwordInput.focus();
    }
    topLoginBtn.addEventListener('click', promptForPharmacyPassword);

    document.getElementById('pharmacy-password-ok-btn').addEventListener('click', () => {
        const enteredPassword = document.getElementById('pharmacyPasswordInput').value;
        if (enteredPassword === PHARMACY_PASSWORD) {
            isPharmacyAuthenticated = true;
            pharmacyPasswordModal.classList.remove('visible');
            const pharmacyTab = document.querySelector('.list[data-view="pharmacy-view"]');
            setActiveTab(pharmacyTab);
            currentUser = prompt("Veuillez entrer votre nom pour le journal d'activité :", "Utilisateur") || "Utilisateur";
            showMessage('Accès pharmacie autorisé.', 'success');
        } else {
            showMessage('Mot de passe incorrect.', 'error');
        }
    });

    document.getElementById('pharmacy-password-cancel-btn').addEventListener('click', () => {
        pharmacyPasswordModal.classList.remove('visible');
    });

    pharmacyNavBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            pharmacyNavBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            pharmacyTabPanes.forEach(pane => {
                pane.classList.toggle('active', pane.id === `pharmacy-tab-${btn.dataset.tab}`);
            });
        });
    });

    // --- GESTION DES MENUS DÉROULANTS (Filtres & Export) ---
    function setupDropdown(button, menu) {
        if (!button || !menu) return;
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('show');
        });
    }
    setupDropdown(filterDropdownBtn, filterDropdownMenu);
    setupDropdown(exportDropdownBtn, exportDropdownMenu);

    document.addEventListener('click', (e) => {
        if (filterDropdownMenu && !filterDropdownBtn.contains(e.target) && !filterDropdownMenu.contains(e.target)) {
            filterDropdownMenu.classList.remove('show');
        }
        if (exportDropdownMenu && !exportDropdownBtn.contains(e.target) && !exportDropdownMenu.contains(e.target)) {
            exportDropdownMenu.classList.remove('show');
        }
    });

    if (filterDropdownMenu) {
        filterDropdownMenu.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                currentFilterStatus = e.currentTarget.dataset.filter;
                filterDropdownMenu.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('active'));
                e.currentTarget.classList.add('active');
                currentPage_current = 1;
                displayInterventions();
                filterDropdownMenu.classList.remove('show');
            });
        });
    }

    // --- AFFICHAGE PRINCIPAL ---
    function displayInterventions() {
        if (!currentInterventionsCards || !archivedInterventionsCards || !pharmacyInterventionsCards) return;

        currentInterventionsCards.innerHTML = '';
        archivedInterventionsCards.innerHTML = '';
        pharmacyInterventionsCards.innerHTML = '';

        const currentSearchTerm = (currentSearchInput.value || '').toLowerCase();
        const archiveSearchTerm = (archiveSearchInput.value || '').toLowerCase();
        const pharmacySearchTerm = (pharmacySearchInput.value || '').toLowerCase();

        const sortedInterventions = Object.entries(allInterventions).sort(([, a], [, b]) => {
            const dateA = new Date(`${a.date}T${a.heure}`);
            const dateB = new Date(`${b.date}T${b.heure}`);
            return dateB - dateA;
        });

        let filteredCurrentArray = [];
        let filteredArchiveArray = [];
        let filteredPharmacyArray = [];

        sortedInterventions.forEach(([id, inter]) => {
            const interventionData = { id, ...inter };
            // Vue Actives
            if (!inter.archived) {
                if (matchesFiltersCurrent(inter, currentSearchTerm, currentFilterStatus)) {
                    filteredCurrentArray.push(interventionData);
                }
            }
            // Vue Archives
            if (inter.archived) {
                if (`${inter.numero_intervention} ${inter.nom} ${inter.date}`.toLowerCase().includes(archiveSearchTerm)) {
                    filteredArchiveArray.push(interventionData);
                }
            }
            // Vue Pharmacie
            if (inter.statut === 'Terminé' && hasMaterialToProcess(inter)) {
                const materialsString = Array.isArray(inter.materiels) ? inter.materiels.join(' ') : Object.keys(inter.materiels || {}).join(' ');
                if ((materialsString + " " + inter.numero_intervention).toLowerCase().includes(pharmacySearchTerm)) {
                    filteredPharmacyArray.push(interventionData);
                }
            }
        });

        const totalPagesCurrent = Math.ceil(filteredCurrentArray.length / ITEMS_PER_PAGE);
        const paginatedCurrent = filteredCurrentArray.slice((currentPage_current - 1) * ITEMS_PER_PAGE, currentPage_current * ITEMS_PER_PAGE);
        paginatedCurrent.forEach(inter => currentInterventionsCards.innerHTML += createInterventionCard(inter));
        updatePagination('currentCardsPagination', currentPage_current, totalPagesCurrent, 'current');

        const totalPagesArchive = Math.ceil(filteredArchiveArray.length / ITEMS_PER_PAGE);
        const paginatedArchive = filteredArchiveArray.slice((currentPage_archive - 1) * ITEMS_PER_PAGE, currentPage_archive * ITEMS_PER_PAGE);
        paginatedArchive.forEach(inter => archivedInterventionsCards.innerHTML += createArchivedInterventionCard(inter));
        updatePagination('archivePagination', currentPage_archive, totalPagesArchive, 'archive');

        const totalPagesPharmacy = Math.ceil(filteredPharmacyArray.length / ITEMS_PER_PAGE);
        const paginatedPharmacy = filteredPharmacyArray.slice((currentPage_pharmacy - 1) * ITEMS_PER_PAGE, currentPage_pharmacy * ITEMS_PER_PAGE);
        paginatedPharmacy.forEach(inter => pharmacyInterventionsCards.innerHTML += createPharmacyCard(inter));
        updatePagination('pharmacyPagination', currentPage_pharmacy, totalPagesPharmacy, 'pharmacy');

        addCardEventListeners();
    }

    function matchesFiltersCurrent(inter, searchTerm, filterTerm) {
        const matchesSearch = `${inter.numero_intervention} ${inter.nom} ${inter.lieu} ${inter.commune}`.toLowerCase().includes(searchTerm);
        if (!matchesSearch) return false;
        if (filterTerm === 'all') return true;
        if (filterTerm === 'Urgent' || filterTerm === 'Critique') {
            return inter.urgence === filterTerm;
        }
        return inter.statut === filterTerm;
    }

    function hasMaterialToProcess(inter) {
        if (!inter.materiels || typeof inter.materiels !== 'object') return false;
        return Object.values(inter.materiels).some(m => m.status !== 'Remis au VSAV' && m.status !== 'Traité');
    }

    // --- CRÉATION DES CARTES HTML ---
    function createInterventionCard(inter) {
        const { id, numero_intervention, nom, date, heure, lieu, statut, urgence } = inter;
        const statusSelectHtml = `
            <select class="status-select-card status-${statut.toLowerCase().replace(' ', '-')}" data-id="${id}">
                <option value="En attente" ${statut === 'En attente' ? 'selected' : ''}>En attente</option>
                <option value="En cours" ${statut === 'En cours' ? 'selected' : ''}>En cours</option>
                <option value="Terminé" ${statut === 'Terminé' ? 'selected' : ''}>Terminé</option>
            </select>`;
        let urgenceHtml = '';
        if (urgence && urgence !== 'Normal') {
            const urgenceClass = urgence === 'Urgent' ? 'badge-urgent' : 'badge-critique';
            urgenceHtml = `<div class="card-item"> <i class="bi bi-exclamation-triangle-fill"></i> <span>Urgence <span class="status-badge ${urgenceClass}">${urgence}</span></span> </div>`;
        }
        const manageMaterialBtn = statut === 'Terminé'
            ? `<button class="btn-icon-footer manage-material-btn" title="Gérer le matériel post-intervention"><i class="bi bi-box-arrow-in-down"></i></button>`
            : '';

        return `
        <div class="intervention-card" data-id="${id}">
            <div class="card-header">
                <h4><i class="bi bi-hash"></i>${numero_intervention}</h4>
                ${statusSelectHtml}
            </div>
            <div class="card-body">
                <div class="card-item"> <i class="bi bi-person-fill"></i> <span>${nom || 'N/A'}</span> </div>
                <div class="card-item"> <i class="bi bi-calendar3"></i> <span>${formatDate(date)} à ${heure}</span> </div>
                <div class="card-item"> <i class="bi bi-geo-alt-fill"></i> <span>${lieu || 'N/A'}</span> </div>
                ${urgenceHtml}
            </div>
            <div class="card-footer">
                <button class="btn-icon-footer view-btn" title="Voir les détails"><i class="bi bi-eye-fill"></i></button>
                <button class="btn-icon-footer edit-btn" title="Modifier"><i class="bi bi-pencil-fill"></i></button>
                ${manageMaterialBtn}
                <button class="btn-icon-footer archive-btn" title="Archiver (si terminée)"><i class="bi bi-archive-fill"></i></button>
            </div>
        </div>`;
    }

    function createArchivedInterventionCard(inter) {
        const { id, numero_intervention, nom, date, heure, statut } = inter;
        return `
        <div class="intervention-card archived-card" data-id="${id}">
            <div class="card-header"><h4><i class="bi bi-hash"></i>${numero_intervention}</h4><span class="status-badge">${statut}</span></div>
            <div class="card-body">
                <div class="card-item"><i class="bi bi-person-fill"></i><span>${nom || 'N/A'}</span></div>
                <div class="card-item"><i class="bi bi-calendar-x"></i><span>${formatDate(date)} à ${heure}</span></div>
            </div>
            <div class="card-footer">
                <button class="btn-icon-footer view-btn" title="Voir les détails"><i class="bi bi-eye-fill"></i></button>
                <button class="btn-icon-footer unarchive-btn" title="Désarchiver"><i class="bi bi-box-arrow-up"></i></button>
                <button class="btn-icon-footer delete-btn" title="Supprimer"><i class="bi bi-trash-fill"></i></button>
            </div>
        </div>`;
    }

    function createPharmacyCard(inter) {
        const { id, numero_intervention, date, materiels } = inter;
        const allTreated = !Object.values(materiels || {}).some(m => m.status !== 'Remis au VSAV' && m.status !== 'Traité');
        const statusText = allTreated ? 'Traité' : 'À traiter';
        const statusClass = allTreated ? 'badge-traite' : 'badge-a-traiter';
        const materielsHtmlList = Object.entries(materiels || {})
            .filter(([, m]) => m.status !== 'Remis au VSAV' && m.status !== 'Traité')
            .map(([name, m]) => `<li><span>${name}</span> <span class="mat-status">${m.status}</span></li>`).join('');

        return `
        <div class="intervention-card pharmacy-card" data-id="${id}">
            <div class="card-header">
                <h4><i class="bi bi-hash"></i>${numero_intervention}</h4>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
            <div class="card-body">
                <div class="card-item"><i class="bi bi-calendar-check"></i> <span>Terminée le ${formatDate(date)}</span></div>
                <h5>Matériels à traiter :</h5>
                <ul class="material-list-card">${materielsHtmlList || "<li>Aucun matériel à traiter.</li>"}</ul>
            </div>
            <div class="card-footer">
                <button class="btn-primary process-material-btn" title="Traiter le matériel"> <i class="bi bi-arrow-repeat"></i> Traiter le Matériel </button>
            </div>
        </div>`;
    }


    // --- GESTIONNAIRES D'ÉVÉNEMENTS ---
    function addCardEventListeners() {
        document.querySelectorAll('.view-btn').forEach(btn => btn.addEventListener('click', (e) => showDetailsModal(e.currentTarget.closest('[data-id]').dataset.id)));
        document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', (e) => editIntervention(e.currentTarget.closest('[data-id]').dataset.id)));
        document.querySelectorAll('.archive-btn').forEach(btn => btn.addEventListener('click', (e) => archiveIntervention(e.currentTarget.closest('[data-id]').dataset.id)));
        document.querySelectorAll('.unarchive-btn').forEach(btn => btn.addEventListener('click', (e) => unarchiveIntervention(e.currentTarget.closest('[data-id]').dataset.id)));
        document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', (e) => deleteIntervention(e.currentTarget.closest('[data-id]').dataset.id)));
        document.querySelectorAll('.manage-material-btn').forEach(btn => btn.addEventListener('click', (e) => openPostInterventionMaterialModal(e.currentTarget.closest('[data-id]').dataset.id)));
        document.querySelectorAll('.process-material-btn').forEach(btn => btn.addEventListener('click', (e) => openPostInterventionMaterialModal(e.currentTarget.closest('[data-id]').dataset.id, true)));
        document.querySelectorAll('.status-select-card').forEach(select => {
            select.addEventListener('change', handleCardStatusChange);
        });
    }

    async function handleCardStatusChange(e) {
        const interventionId = e.target.dataset.id;
        const newStatus = e.target.value;
        try {
            const updates = { statut: newStatus, updatedAt: firebase.database.ServerValue.TIMESTAMP };
            if (newStatus === 'Terminé') {
                const snapshot = await database.ref(`interventions/${interventionId}`).once('value');
                const intervention = snapshot.val();
                if (intervention && Array.isArray(intervention.materiels)) {
                    const materielsObject = {};
                    intervention.materiels.forEach(matName => {
                        materielsObject[matName] = { status: 'Non défini', comment: '' };
                    });
                    updates.materiels = materielsObject;
                    showMessage("Veuillez maintenant qualifier le statut de chaque matériel utilisé.", "success");
                    openPostInterventionMaterialModal(interventionId);
                }
            }
            await database.ref(`interventions/${interventionId}`).update(updates);
            showMessage(`Statut mis à jour.`, 'success');
        } catch (error) {
            showMessage("Erreur de mise à jour: " + error.message, "error");
        }
    }

    interventionForm.addEventListener('submit', handleFormSubmit);
    document.getElementById('ajouterMateriel').addEventListener('click', addMaterielTag);
    document.getElementById('photo').addEventListener('change', handlePhotoUpload);
    document.getElementById('resetForm').addEventListener('click', resetForm);
    currentSearchInput.addEventListener('input', () => { currentPage_current = 1; displayInterventions(); });
    archiveSearchInput.addEventListener('input', () => { currentPage_archive = 1; displayInterventions(); });
    pharmacySearchInput.addEventListener('input', () => { currentPage_pharmacy = 1; displayInterventions(); });
    document.querySelectorAll('.modal .close-button').forEach(btn => {
        btn.addEventListener('click', (e) => e.currentTarget.closest('.modal').classList.remove('visible'));
    });
    imagePreviewModal.addEventListener('click', () => imagePreviewModal.classList.remove('visible'));
    if (geolocateBtn) {
        geolocateBtn.addEventListener('click', handleGeolocation);
    }
    // Listeners for export buttons
    exportExcelBtn.addEventListener('click', exportToExcel);
    exportPdfBtn.addEventListener('click', exportToPdf);
    exportCsvBtn.addEventListener('click', exportToCsv);
    exportPharmacyBtn.addEventListener('click', exportPharmacyData);


    // --- MANIPULATION DES DONNÉES (FORMULAIRE) ---
    function handleFormSubmit(e) {
        e.preventDefault();
        loaderModal.classList.add('visible');
        const id = interventionIdInput.value;
        const interventionData = {
            numero_intervention: document.getElementById('numero').value,
            date: document.getElementById('date').value,
            heure: document.getElementById('heure').value,
            nom: document.getElementById('nom').value,
            lieu: document.getElementById('lieu').value,
            commune: document.getElementById('commune').value,
            statut: document.getElementById('statut').value,
            urgence: document.getElementById('urgence').value,
            categorie: document.getElementById('categorie').value,
            commentaire: document.getElementById('commentaire').value,
            photos: photosBase64,
            archived: false,
        };

        if (id) {
            const currentInter = allInterventions[id];
            let existingMateriels = currentInter.materiels || (Array.isArray(currentInter.materiels) ? [] : {});
            if (Array.isArray(existingMateriels)) {
                materiels.forEach(mat => { if (!existingMateriels.includes(mat)) existingMateriels.push(mat) });
                interventionData.materiels = existingMateriels;
            } else {
                materiels.forEach(mat => { if (!existingMateriels[mat]) existingMateriels[mat] = { status: 'Non défini', comment: '' } });
                interventionData.materiels = existingMateriels;
            }
        } else {
            interventionData.materiels = materiels;
            interventionData.createdAt = firebase.database.ServerValue.TIMESTAMP;
        }

        interventionData.updatedAt = firebase.database.ServerValue.TIMESTAMP;

        const dbRef = id ? database.ref('interventions/' + id) : database.ref('interventions').push();
        dbRef.set(interventionData).then(() => {
            showMessage(id ? 'Intervention modifiée !' : 'Intervention enregistrée !', 'success');
            resetForm();
            setActiveTab(document.querySelector('.list[data-view="current-view"]'));
        }).catch(err => {
            showMessage('Erreur: ' + err.message, 'error');
        }).finally(() => {
            loaderModal.classList.remove('visible');
        });
    }

    function editIntervention(id) {
        const inter = allInterventions[id]; if (!inter) return;
        resetForm();
        document.getElementById('numero').value = inter.numero_intervention || '';
        document.getElementById('date').value = inter.date || '';
        document.getElementById('heure').value = inter.heure || '';
        document.getElementById('nom').value = inter.nom || '';
        document.getElementById('lieu').value = inter.lieu || '';
        document.getElementById('commune').value = inter.commune || '';
        document.getElementById('statut').value = inter.statut || 'En attente';
        document.getElementById('urgence').value = inter.urgence || 'Normal';
        document.getElementById('categorie').value = inter.categorie || 'Accident';
        document.getElementById('commentaire').value = inter.commentaire || '';
        interventionIdInput.value = id;

        if (Array.isArray(inter.materiels)) {
            materiels = [...inter.materiels];
        } else if (typeof inter.materiels === 'object' && inter.materiels !== null) {
            materiels = Object.keys(inter.materiels);
        } else {
            materiels = [];
        }
        updateMaterielsTagDisplay();

        photosBase64 = inter.photos || [];
        updatePhotosDisplay();
        setActiveTab(document.querySelector('.list[data-view="form-view"]'));
    }

    function archiveIntervention(id) {
        const intervention = allInterventions[id];
        if (intervention && intervention.statut.includes('Terminé')) {
            database.ref(`interventions/${id}`).update({ archived: true, updatedAt: firebase.database.ServerValue.TIMESTAMP })
                .then(() => showMessage('Intervention archivée.', 'success'))
                .catch(err => showMessage('Erreur: ' + err.message, 'error'));
        } else {
            showMessage("L'intervention doit être 'Terminé' pour être archivée.", "error");
        }
    }
    function unarchiveIntervention(id) {
        database.ref(`interventions/${id}`).update({ archived: false, updatedAt: firebase.database.ServerValue.TIMESTAMP })
            .then(() => showMessage('Intervention désarchivée.', 'success'))
            .catch(err => showMessage('Erreur: ' + err.message, 'error'));
    }
    function deleteIntervention(id) {
        const password = prompt("Entrez le mot de passe administrateur pour supprimer :");
        if (password === DELETE_PASSWORD) {
            database.ref('interventions/' + id).remove()
                .then(() => showMessage('Intervention supprimée.', 'success'))
                .catch(err => showMessage('Erreur: ' + err.message, 'error'));
        } else if (password !== null) { showMessage('Mot de passe incorrect.', 'error'); }
    }

    function addMaterielTag() {
        const input = document.getElementById('materielInput');
        const value = input.value.trim();
        if (value && !materiels.includes(value)) {
            materiels.push(value);
            updateMaterielsTagDisplay();
            input.value = '';
        }
    }
    function updateMaterielsTagDisplay() {
        materielsList.innerHTML = materiels.map(mat => `<span class="tag-item">${mat}<button type="button" class="close-tag" data-materiel="${mat}">&times;</button></span>`).join('');
        document.querySelectorAll('.close-tag').forEach(btn => {
            btn.addEventListener('click', (e) => {
                materiels = materiels.filter(m => m !== e.target.dataset.materiel);
                updateMaterielsTagDisplay();
            });
        });
    }

    // --- LOGIQUE DES MODALS ---
    function showDetailsModal(id) {
        const inter = allInterventions[id]; if (!inter) return;
        const modalContent = detailsModal.querySelector('.modal-content') || document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.innerHTML = '';

        const modalHeaderDiv = document.createElement('div');
        modalHeaderDiv.id = 'modalHeader';
        modalHeaderDiv.innerHTML = `<h3><i class="bi bi-file-earmark-text-fill"></i>Détails - Inter. n°${inter.numero_intervention}</h3>`;
        const closeBtn = document.createElement('span');
        closeBtn.className = 'close-button';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = () => detailsModal.classList.remove('visible');
        modalHeaderDiv.appendChild(closeBtn);
        modalContent.appendChild(modalHeaderDiv);

        const modalBodyDiv = document.createElement('div');
        modalBodyDiv.id = 'modalBody';

        let materielsHtml;
        if (Array.isArray(inter.materiels) && inter.materiels.length > 0) {
            materielsHtml = `<p class="detail-item"><i class="bi bi-tools"></i><strong>Matériels:</strong> <span>${inter.materiels.join(', ')}</span></p>`;
        } else if (typeof inter.materiels === 'object' && inter.materiels !== null && Object.keys(inter.materiels).length > 0) {
            const matList = Object.entries(inter.materiels).map(([name, details]) => `${name} (${details.status})`).join('<br>');
            materielsHtml = `<div class="detail-item"><i class="bi bi-tools"></i><strong>Matériels:</strong> <span>${matList}</span></div>`;
        } else {
            materielsHtml = `<p class="detail-item"><i class="bi bi-tools"></i><strong>Matériels:</strong> <span>Aucun</span></p>`;
        }

        let photosHtml = `<h4><i class="bi bi-images"></i> Photos</h4><p>Aucune photo</p>`;
        if (inter.photos && inter.photos.length > 0) {
            photosHtml = `<h4><i class="bi bi-images"></i> Photos</h4><div class="photo-grid">${inter.photos.map(p => `<img src="${p}" class="photo-thumb" data-full-src="${p}">`).join('')}</div>`;
        }

        modalBodyDiv.innerHTML = `
            <div class="detail-section"><h4><i class="bi bi-info-circle-fill"></i> Infos Générales</h4>
                <p class="detail-item"><i class="bi bi-person-fill"></i><strong>Responsable:</strong> <span>${inter.nom}</span></p>
                <p class="detail-item"><i class="bi bi-calendar-event"></i><strong>Date/Heure:</strong> <span>${formatDate(inter.date)} à ${inter.heure}</span></p>
                <p class="detail-item"><i class="bi bi-geo-alt-fill"></i><strong>Lieu:</strong> <span>${inter.lieu || 'N/A'}</span></p>
            </div>
            <div class="detail-section"><h4><i class="bi bi-clipboard-check-fill"></i> Statut & Priorité</h4>
                <p class="detail-item"><i class="bi bi-activity"></i><strong>Statut:</strong> <span><span class="status-badge status-${(inter.statut || '').toLowerCase().replace(' ', '-')}">${inter.statut}</span></span></p>
                <p class="detail-item"><i class="bi bi-exclamation-triangle-fill"></i><strong>Urgence:</strong> <span><span class="status-badge ${inter.urgence === 'Urgent' ? 'badge-urgent' : inter.urgence === 'Critique' ? 'badge-critique' : ''}">${inter.urgence}</span></span></p>
            </div>
            <div class="detail-section full-width"><h4><i class="bi bi-card-text"></i> Détails Supplémentaires</h4>
                ${materielsHtml}
                <p class="detail-item"><i class="bi bi-chat-left-text-fill"></i><strong>Commentaire:</strong> <span>${inter.commentaire || 'Aucun'}</span></p>
            </div>
            <div class="detail-section full-width">${photosHtml}</div>
        `;
        modalContent.appendChild(modalBodyDiv);

        const modalFooterDiv = document.createElement('div');
        modalFooterDiv.className = 'modal-actions';
        const printBtn = document.createElement('button');
        printBtn.type = 'button';
        printBtn.className = 'btn-primary';
        printBtn.innerHTML = '<i class="bi bi-printer"></i> Imprimer';
        printBtn.onclick = () => printInterventionDetails(id);
        modalFooterDiv.appendChild(printBtn);
        modalContent.appendChild(modalFooterDiv);

        if (!detailsModal.querySelector('.modal-content')) {
            detailsModal.appendChild(modalContent);
        }

        detailsModal.classList.add('visible');
        detailsModal.querySelectorAll('.photo-thumb').forEach(thumb => {
            thumb.addEventListener('click', (e) => showFullImage(e.target.dataset.fullSrc));
        });
    }

    function openPostInterventionMaterialModal(interId, fromPharmacy = false) {
        const inter = allInterventions[interId];
        if (!inter || !inter.materiels || typeof inter.materiels !== 'object') {
            showMessage("Aucun matériel à gérer pour cette intervention.", "error");
            return;
        }

        const listContainer = document.getElementById('post-inter-material-list');
        listContainer.innerHTML = '';
        document.getElementById('post-inter-modal-inter-num').textContent = `n°${inter.numero_intervention}`;

        const header = document.createElement('div');
        header.className = 'material-management-item header';
        header.innerHTML = '<strong>Matériel</strong><strong>Statut</strong><strong>Commentaire / Action</strong>';
        listContainer.appendChild(header);

        Object.entries(inter.materiels).forEach(([matName, matDetails]) => {
            const item = document.createElement('div');
            item.className = 'material-management-item';
            item.dataset.matName = matName;
            let statusHtml;
            if (fromPharmacy && matDetails.status !== 'Remis au VSAV') {
                statusHtml = `
                    <select class="pharmacy-status-select">
                        <option value="À commander" ${matDetails.pharmacyStatus === 'À commander' ? 'selected' : ''}>À commander</option>
                        <option value="En stock" ${matDetails.pharmacyStatus === 'En stock' ? 'selected' : ''}>En stock</option>
                        <option value="Traité" ${matDetails.pharmacyStatus === 'Traité' ? 'selected' : ''}>Traité</option>
                    </select>`;
            } else {
                statusHtml = `
                    <select class="post-inter-status-select">
                        <option value="Non défini" ${!matDetails.status || matDetails.status === 'Non défini' ? 'selected' : ''}>Non défini</option>
                        <option value="Remis au VSAV" ${matDetails.status === 'Remis au VSAV' ? 'selected' : ''}>Remis au VSAV</option>
                        <option value="Manquant" ${matDetails.status === 'Manquant' ? 'selected' : ''}>Manquant</option>
                        <option value="Cassé" ${matDetails.status === 'Cassé' ? 'selected' : ''}>Cassé</option>
                        <option value="Ouvert (non utilisé)" ${matDetails.status === 'Ouvert (non utilisé)' ? 'selected' : ''}>Ouvert (non utilisé)</option>
                        <option value="Autre" ${matDetails.status === 'Autre' ? 'selected' : ''}>Autre</option>
                    </select>`;
            }
            const commentInput = `<input type="text" class="material-comment-input" value="${matDetails.comment || ''}" placeholder="Commentaire...">`;
            item.innerHTML = `<span>${matName}</span><div>${statusHtml}</div><div>${commentInput}</div>`;
            listContainer.appendChild(item);
        });

        const saveBtn = document.getElementById('save-post-inter-material-btn');
        saveBtn.onclick = () => savePostInterventionMaterialStatus(interId, fromPharmacy);
        saveBtn.style.display = 'block';
        postInterventionMaterialModal.classList.add('visible');
    }

    async function savePostInterventionMaterialStatus(interId, fromPharmacy) {
        const listContainer = document.getElementById('post-inter-material-list');
        const updates = {};
        let allTreated = true;
        listContainer.querySelectorAll('.material-management-item:not(.header)').forEach(item => {
            const matName = item.dataset.matName;
            const comment = item.querySelector('.material-comment-input').value;
            updates[`interventions/${interId}/materiels/${matName}/comment`] = comment;

            if (fromPharmacy) {
                const newStatusSelect = item.querySelector('.pharmacy-status-select');
                if (newStatusSelect) {
                    const newStatus = newStatusSelect.value;
                    updates[`interventions/${interId}/materiels/${matName}/pharmacyStatus`] = newStatus;
                    if (newStatus === 'En stock') {
                        updateStock(matName, -1, `Utilisé pour inter n°${allInterventions[interId].numero_intervention}`);
                    }
                    if (newStatus !== 'Traité') {
                        allTreated = false;
                    }
                }
            } else {
                const newStatus = item.querySelector('.post-inter-status-select').value;
                updates[`interventions/${interId}/materiels/${matName}/status`] = newStatus;
            }
        });

        if (fromPharmacy && allTreated) {
            updates[`interventions/${interId}/statut`] = 'Terminé & Traité';
        }
        updates[`interventions/${interId}/updatedAt`] = firebase.database.ServerValue.TIMESTAMP;
        try {
            await database.ref().update(updates);
            showMessage('Statuts du matériel enregistrés.', 'success');
            postInterventionMaterialModal.classList.remove('visible');
            refreshCurrentView();
        } catch (error) {
            showMessage('Erreur lors de la sauvegarde : ' + error.message, 'error');
        }
    }

    // --- LOGIQUE DE LA PHARMACIE (STOCK & JOURNAL) ---
    function displayStock() {
        stockTableBody.innerHTML = '';
        Object.entries(pharmacyStock).sort(([a], [b]) => a.localeCompare(b)).forEach(([name, details]) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${name}</td>
                <td><input type="number" class="stock-quantity-input" data-name="${name}" value="${details.quantity || 0}"></td>
                <td><input type="text" class="stock-notes-input" data-name="${name}" value="${details.notes || ''}"></td>
                <td>
                    <button class="btn-icon-footer save-stock-btn" data-name="${name}" title="Sauvegarder"><i class="bi bi-save"></i></button>
                    <button class="btn-icon-footer delete-stock-btn" data-name="${name}" title="Supprimer"><i class="bi bi-trash"></i></button>
                </td>
            `;
            stockTableBody.appendChild(row);
        });
        addStockEventListeners();
    }

    function displayPharmacyLog() {
        pharmacyLogBody.innerHTML = '';
        Object.entries(pharmacyLog)
            .sort(([, a], [, b]) => b.timestamp - a.timestamp)
            .forEach(([, entry]) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${new Date(entry.timestamp).toLocaleString('fr-FR')}</td>
                    <td>${entry.action}</td>
                    <td>${entry.details}</td>
                    <td>${entry.user}</td>
                `;
                pharmacyLogBody.appendChild(row);
            });
    }

    function addStockEventListeners() {
        if(addStockItemBtn.dataset.listener !== 'true'){
            addStockItemBtn.addEventListener('click', () => {
                const nameInput = document.getElementById('newStockItemName');
                const name = nameInput.value.trim();
                if (name && !pharmacyStock[name]) {
                    updateStock(name, 0, 'Création article', true);
                    nameInput.value = '';
                } else {
                    showMessage("Cet article existe déjà ou le nom est invalide.", 'error');
                }
            });
            addStockItemBtn.dataset.listener = 'true';
        }

        document.querySelectorAll('.save-stock-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const name = e.currentTarget.dataset.name;
                const row = e.currentTarget.closest('tr');
                const quantity = parseInt(row.querySelector('.stock-quantity-input').value, 10);
                const notes = row.querySelector('.stock-notes-input').value;
                updateStock(name, quantity, `Mise à jour manuelle. Notes: ${notes}`);
            });
        });
        document.querySelectorAll('.delete-stock-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const name = e.currentTarget.dataset.name;
                if (confirm(`Êtes-vous sûr de vouloir supprimer "${name}" du stock ?`)) {
                    database.ref(`pharmacy/stock/${name}`).remove();
                    addLogEntry('Suppression article', `Article "${name}" supprimé`, currentUser);
                }
            });
        });
    }

    async function updateStock(name, quantity, details, isCreation = false) {
        try {
            const stockRef = database.ref(`pharmacy/stock/${name}`);
            const originalDataSnapshot = await stockRef.once('value');
            const originalData = originalDataSnapshot.val();
            let logDetails;

            if (isCreation) {
                await stockRef.set({ quantity: 0, notes: '' });
                logDetails = `Création de l'article "${name}"`;
            } else if (Number.isInteger(quantity) && quantity < 0) { // Décrémentation
                await stockRef.child('quantity').set(firebase.database.ServerValue.increment(quantity));
                logDetails = `${quantity} pour l'article "${name}" (détail: ${details})`;
            } else { // Mise à jour complète
                const newQuantity = Number.isInteger(quantity) ? quantity : originalData.quantity;
                const newNotes = details.includes("Notes:") ? details.split("Notes:")[1].trim() : originalData.notes;
                await stockRef.update({ quantity: newQuantity, notes: newNotes });
                logDetails = `Mise à jour de "${name}". Nouvelle quantité: ${newQuantity}. Notes: "${newNotes}"`;
            }

            await addLogEntry('Mise à jour Stock', logDetails, currentUser);
            showMessage('Stock mis à jour', 'success');
        } catch (error) {
            showMessage("Erreur de mise à jour du stock: " + error.message, 'error');
        }
    }

    function addLogEntry(action, details, user) {
        const logRef = database.ref('pharmacy/log').push();
        return logRef.set({
            action,
            details,
            user,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
    }

    // --- FONCTIONS UTILITAIRES ---
    function resetForm() {
        interventionForm.reset();
        interventionIdInput.value = '';
        materiels = [];
        photosBase64 = [];
        updateMaterielsTagDisplay();
        updatePhotosDisplay();
        setDefaultDateTime();
        document.getElementById('statut').value = "En cours";
    }

    function setDefaultDateTime() {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        document.getElementById('date').value = now.toISOString().split('T')[0];
        document.getElementById('heure').value = now.toTimeString().split(' ')[0].substring(0, 5);
    }

    function showMessage(message, type) {
        const container = document.createElement('div');
        container.className = `message-container ${type}`;
        container.innerHTML = `<p>${message}</p>`;
        document.body.appendChild(container);
        setTimeout(() => { if (document.body.contains(container)) { document.body.removeChild(container); } }, 4000);
    }

    function formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    }

    function handlePhotoUpload(e) {
        const files = e.target.files; photosBase64 = []; updatePhotosDisplay();
        for (const file of files) {
            if (file.size > 15 * 1024 * 1024) { showMessage(`Le fichier ${file.name} est trop volumineux (max 15MB).`, 'error'); continue; }
            const reader = new FileReader();
            reader.onload = (event) => { photosBase64.push(event.target.result); updatePhotosDisplay(); };
            reader.readAsDataURL(file);
        }
    }
    function updatePhotosDisplay() {
        photoPreview.innerHTML = photosBase64.map((photo, index) => `<div class="photo-thumb-wrapper"><img src="${photo}" class="photo-thumb"><button type="button" class="remove-photo-btn" data-index="${index}">&times;</button></div>`).join('');
        document.querySelectorAll('.remove-photo-btn').forEach(btn => {
            btn.addEventListener('click', (e) => { e.stopPropagation(); photosBase64.splice(e.target.dataset.index, 1); updatePhotosDisplay(); });
        });
        document.querySelectorAll('.photo-thumb').forEach((thumb, index) => {
            thumb.addEventListener('click', () => showFullImage(photosBase64[index]));
        });
    }
    function showFullImage(src) {
        fullImagePreview.src = src;
        imagePreviewModal.classList.add('visible');
    }

    function updatePagination(elementId, currentPage, totalPages, type) {
        const paginationUl = document.getElementById(elementId);
        if (!paginationUl) return;
        paginationUl.innerHTML = '';
        if (totalPages <= 1) return;

        const createPageLink = (page, content, isDisabled = false, isActive = false) => {
            const li = document.createElement('li');
            li.className = `page-item ${isDisabled ? 'disabled' : ''} ${isActive ? 'active' : ''}`;
            const a = document.createElement('a');
            a.className = 'page-link';
            a.href = '#';
            a.innerHTML = content;
            if (!isDisabled) {
                a.addEventListener('click', (e) => { e.preventDefault(); handlePageChange(page, type); });
            }
            li.appendChild(a);
            return li;
        };

        paginationUl.appendChild(createPageLink(currentPage - 1, '<i class="bi bi-chevron-left"></i>', currentPage === 1));

        const maxPagesToShow = 5;
        let startPage, endPage;

        if (totalPages <= maxPagesToShow) {
            startPage = 1;
            endPage = totalPages;
        } else {
            const maxPagesBeforeCurrent = Math.floor(maxPagesToShow / 2);
            const maxPagesAfterCurrent = Math.ceil(maxPagesToShow / 2) - 1;
            if (currentPage <= maxPagesBeforeCurrent) {
                startPage = 1;
                endPage = maxPagesToShow;
            } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
                startPage = totalPages - maxPagesToShow + 1;
                endPage = totalPages;
            } else {
                startPage = currentPage - maxPagesBeforeCurrent;
                endPage = currentPage + maxPagesAfterCurrent;
            }
        }

        if (startPage > 1) {
             paginationUl.appendChild(createPageLink(1, '1'));
             if(startPage > 2) paginationUl.appendChild(createPageLink(0, '...', true));
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationUl.appendChild(createPageLink(i, i, false, i === currentPage));
        }

        if (endPage < totalPages) {
            if(endPage < totalPages - 1) paginationUl.appendChild(createPageLink(0, '...', true));
            paginationUl.appendChild(createPageLink(totalPages, totalPages));
        }

        paginationUl.appendChild(createPageLink(currentPage + 1, '<i class="bi bi-chevron-right"></i>', currentPage === totalPages));
    }

    function handlePageChange(newPage, type) {
        if (type === 'current') currentPage_current = newPage;
        else if (type === 'archive') currentPage_archive = newPage;
        else if (type === 'pharmacy') currentPage_pharmacy = newPage;
        displayInterventions();
        window.scrollTo(0, 0);
    }

    // --- Fonctions de statistiques et graphiques ---
    function updateStats() {
        const stats = { enCours: 0, termine: 0, enAttente: 0, archive: 0 };
        Object.values(allInterventions).forEach(inter => {
            if (inter.archived) stats.archive++;
            else if (inter.statut === 'En cours') stats.enCours++;
            else if (inter.statut && inter.statut.includes('Terminé')) stats.termine++;
            else if (inter.statut === 'En attente') stats.enAttente++;
        });
        document.getElementById('stats-en-cours').textContent = stats.enCours;
        document.getElementById('stats-termine').textContent = stats.termine;
        document.getElementById('stats-en-attente').textContent = stats.enAttente;
        document.getElementById('stats-archive').textContent = stats.archive;
    }

    function updateCharts() {
        const monthlyCtx = document.getElementById('monthlyChart')?.getContext('2d');
        const statusCtx = document.getElementById('statusChart')?.getContext('2d');
        if (!monthlyCtx || !statusCtx) return;
        if (monthlyChart) monthlyChart.destroy();
        if (statusChart) statusChart.destroy();

        // Monthly Chart Data
        const monthlyData = {};
        Object.values(allInterventions).forEach(inter => {
            if (inter.date) {
                const monthKey = inter.date.substring(0, 7);
                monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
            }
        });
        const sortedMonths = Object.keys(monthlyData).sort();

        monthlyChart = new Chart(monthlyCtx, {
            type: 'bar',
            data: {
                labels: sortedMonths.map(key => new Date(key + '-02').toLocaleString('fr-FR', { month: 'long', year: 'numeric' })),
                datasets: [{
                    label: 'Interventions par mois',
                    data: sortedMonths.map(key => monthlyData[key]),
                    backgroundColor: 'rgba(229, 56, 59, 0.7)',
                    borderColor: 'rgba(229, 56, 59, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, ticks: { color: '#f0f0f0', stepSize: 1 } },
                    x: { ticks: { color: '#f0f0f0' } }
                },
                plugins: { legend: { labels: { color: '#f0f0f0' } } }
            }
        });

        // Status Chart Data
        const statusData = { 'En cours': 0, 'Terminé': 0, 'En attente': 0 };
        Object.values(allInterventions).forEach(inter => {
            if (!inter.archived && statusData.hasOwnProperty(inter.statut)) {
                statusData[inter.statut]++;
            }
        });

        statusChart = new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(statusData),
                datasets: [{
                    label: 'Répartition par statut',
                    data: Object.values(statusData),
                    backgroundColor: ['#0077b6', '#2a9d8f', '#fca311'],
                    borderColor: '#2a2a2e',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top', labels: { color: '#f0f0f0' } },
                    tooltip: { callbacks: { label: (c) => ` ${c.label}: ${c.raw}` } }
                }
            }
        });
    }

    // --- Fonctions d'export et d'impression ---
    function getFilteredDataForExport() {
        const searchTerm = currentSearchInput.value.toLowerCase();
        return Object.values(allInterventions)
            .filter(inter => !inter.archived && matchesFiltersCurrent(inter, searchTerm, currentFilterStatus))
            .sort((a, b) => new Date(`${b.date}T${b.heure}`) - new Date(`${a.date}T${a.heure}`));
    }

    function exportToExcel() {
        const data = getFilteredDataForExport().map(inter => ({
            "N° Inter": inter.numero_intervention,
            "Date": formatDate(inter.date),
            "Heure": inter.heure,
            "Responsable": inter.nom,
            "Adresse": inter.lieu,
            "Commune": inter.commune,
            "Statut": inter.statut,
            "Urgence": inter.urgence,
            "Catégorie": inter.categorie,
            "Matériels": Array.isArray(inter.materiels) ? inter.materiels.join(', ') : Object.keys(inter.materiels || {}).join(', '),
            "Commentaire": inter.commentaire
        }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Interventions");
        XLSX.writeFile(workbook, `Export_Interventions_${new Date().toISOString().split('T')[0]}.xlsx`);
    }

    function exportToPdf() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const data = getFilteredDataForExport();
        const tableData = data.map(inter => [
            inter.numero_intervention,
            formatDate(inter.date),
            inter.heure,
            inter.nom,
            inter.lieu,
            inter.statut,
            inter.urgence
        ]);

        doc.text("Export des Interventions Actives", 14, 16);
        doc.autoTable({
            head: [['N° Inter', 'Date', 'Heure', 'Responsable', 'Adresse', 'Statut', 'Urgence']],
            body: tableData,
            startY: 20,
            theme: 'grid',
            headStyles: { fillColor: [229, 56, 59] }
        });
        doc.save(`Export_Interventions_${new Date().toISOString().split('T')[0]}.pdf`);
    }

    function exportToCsv() {
        const data = getFilteredDataForExport();
        const headers = ["N° Inter", "Date", "Heure", "Responsable", "Adresse", "Commune", "Statut", "Urgence", "Catégorie", "Matériels", "Commentaire"];
        const csvRows = [headers.join(',')];
        data.forEach(inter => {
            const values = [
                inter.numero_intervention,
                formatDate(inter.date),
                inter.heure,
                inter.nom,
                `"${inter.lieu || ''}"`,
                inter.commune,
                inter.statut,
                inter.urgence,
                inter.categorie,
                `"${Array.isArray(inter.materiels) ? inter.materiels.join('; ') : Object.keys(inter.materiels || {}).join('; ')}"`,
                `"${inter.commentaire || ''}"`.replace(/"/g, '""')
            ];
            csvRows.push(values.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Export_Interventions_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function exportPharmacyData() {
        const stockData = Object.entries(pharmacyStock).map(([name, details]) => ({
            "Article": name,
            "Quantité": details.quantity,
            "Notes": details.notes
        }));
        const logData = Object.entries(pharmacyLog).map(([, entry]) => ({
            "Date": new Date(entry.timestamp).toLocaleString('fr-FR'),
            "Action": entry.action,
            "Détails": entry.details,
            "Par": entry.user
        })).sort((a,b) => new Date(b.Date) - new Date(a.Date));
        
        const stockSheet = XLSX.utils.json_to_sheet(stockData);
        const logSheet = XLSX.utils.json_to_sheet(logData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, stockSheet, "Stock Pharmacie");
        XLSX.utils.book_append_sheet(workbook, logSheet, "Journal Pharmacie");
        XLSX.writeFile(workbook, `Export_Pharmacie_${new Date().toISOString().split('T')[0]}.xlsx`);
    }

    function printInterventionDetails(id) {
        const inter = allInterventions[id];
        if (!inter) return;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html><head><title>Fiche Intervention n°${inter.numero_intervention}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #e5383b; border-bottom: 2px solid #e5383b; padding-bottom: 5px;}
                .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .section { border: 1px solid #ccc; padding: 15px; border-radius: 5px; }
                .section h2 { margin-top: 0; color: #333; font-size: 1.2em; }
                p { margin: 5px 0; }
                strong { display: inline-block; width: 120px; }
                .full-width { grid-column: 1 / -1; }
                .photo-grid { display:flex; flex-wrap:wrap; gap:10px; margin-top:10px; }
                .photo-grid img { max-width: 150px; border: 1px solid #ddd; }
            </style>
            </head><body>
                <h1>Fiche Intervention n°${inter.numero_intervention}</h1>
                <div class="grid">
                    <div class="section">
                        <h2>Informations</h2>
                        <p><strong>Responsable:</strong> ${inter.nom || 'N/A'}</p>
                        <p><strong>Date/Heure:</strong> ${formatDate(inter.date)} à ${inter.heure}</p>
                        <p><strong>Lieu:</strong> ${inter.lieu || 'N/A'}</p>
                        <p><strong>Commune:</strong> ${inter.commune || 'N/A'}</p>
                    </div>
                    <div class="section">
                        <h2>Statut & Catégorie</h2>
                        <p><strong>Statut:</strong> ${inter.statut}</p>
                        <p><strong>Urgence:</strong> ${inter.urgence}</p>
                        <p><strong>Catégorie:</strong> ${inter.categorie}</p>
                    </div>
                    <div class="section full-width">
                        <h2>Détails</h2>
                        <p><strong>Matériels:</strong> ${Array.isArray(inter.materiels) ? inter.materiels.join(', ') : Object.keys(inter.materiels || {}).join(', ')}</p>
                        <p><strong>Commentaire:</strong></p>
                        <p>${inter.commentaire || 'Aucun'}</p>
                    </div>
                    <div class="section full-width">
                        <h2>Photos</h2>
                        <div class="photo-grid">
                         ${(inter.photos || []).map(p => `<img src="${p}">`).join('')}
                        </div>
                    </div>
                </div>
                <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
            </body></html>
        `);
        printWindow.document.close();
    }
    
    // --- Géolocalisation ---
    function handleGeolocation() {
        if (navigator.geolocation) {
            geolocateBtn.innerHTML = '<div class="loader-small"></div>';
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                // Utilise un service de géocodage inversé gratuit.
                // Note: ceci est un exemple, la disponibilité et les termes peuvent changer.
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                const data = await response.json();
                if (data && data.address) {
                    const address = data.address;
                    document.getElementById('lieu').value = data.display_name || 'Adresse non trouvée';
                    document.getElementById('commune').value = address.city || address.town || address.village || '';
                } else {
                    showMessage("Impossible de trouver l'adresse.", "error");
                }
                 geolocateBtn.innerHTML = '<i class="bi bi-geo"></i>';
            }, (error) => {
                showMessage(`Erreur de géolocalisation: ${error.message}`, "error");
                geolocateBtn.innerHTML = '<i class="bi bi-geo"></i>';
            });
        } else {
            showMessage("La géolocalisation n'est pas supportée par ce navigateur.", "error");
        }
    }


    // --- Initialisation au chargement ---
    setDefaultDateTime();
    const firstActiveTab = document.querySelector('.navigation .list.active');
    if(firstActiveTab){
        updateActiveView(firstActiveTab);
    }
});
