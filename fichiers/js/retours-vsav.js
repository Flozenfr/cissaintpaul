document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURATION ET INITIALISATION FIREBASE ---
    const firebaseConfig = {
        apiKey: "AIzaSyDmnua63SSMYhjaTdgRAoMIpPl215jgyo4",
        authDomain: "retour-intervention-vsav.firebaseapp.com",
        databaseURL: "https://retour-intervention-vsav-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: "retour-intervention-vsav",
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

    // Nouveaux sélecteurs
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
    const modalBody = document.getElementById('modalBody');
    const pharmacyPasswordModal = document.getElementById('pharmacyPasswordModal');
    const materialStatusModal = document.getElementById('materialStatusModal');

    // Sélecteurs pour les contrôles DANS L'EN-TÊTE
    const currentSearchInput = document.getElementById('currentSearch');
    const filterDropdownBtn = document.getElementById('filterDropdownBtn');
    const filterDropdownMenu = document.getElementById('filterDropdownMenu');
    const exportDropdownBtn = document.getElementById('exportDropdownBtn');
    const exportDropdownMenu = document.getElementById('exportDropdownMenu');
    const archiveSearchInput = document.getElementById('archiveSearch');
    const pharmacySearchInput = document.getElementById('pharmacySearch');
    const exportPharmacyBtn = document.getElementById('exportPharmacyBtn');


    let monthlyChart = null;
    let statusChart = null;

    const ITEMS_PER_PAGE = 6;
    let currentPage_current = 1;
    let currentPage_archive = 1;
    let currentPage_pharmacy = 1;

    let allInterventions = {};
    let materiels = [];
    let photosBase64 = [];
    const PHARMACY_PASSWORD = "018A";
    const DELETE_PASSWORD = "Aspf66220*";
    let isPharmacyAuthenticated = false;
    let currentFilterStatus = 'all';

    // --- GESTION DES CONTRÔLES DE L'EN-TÊTE ---
    function updateHeaderControls(activeViewId) {
        headerControlGroups.forEach(group => {
            if (group.id === `header-controls-${activeViewId.replace('-view', '')}`) {
                group.classList.add('visible');
            } else {
                group.classList.remove('visible');
            }
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
    function updateActiveView(activeItem) {
        const viewId = activeItem.dataset.view;
        viewContainers.forEach(v => v.classList.remove('visible'));
        const activeView = document.getElementById(viewId);
        if (activeView) {
            activeView.classList.add('visible');
            updateHeaderControls(viewId); // Met à jour les contrôles de l'en-tête
            currentPage_current = 1;
            currentPage_archive = 1;
            currentPage_pharmacy = 1;
            if (viewId === 'current-view' || viewId === 'archive-view' || viewId === 'pharmacy-view') {
                 displayInterventions();
            } else if(viewId === 'stats-view') {
                updateStats();
                updateCharts();
            }
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
            if (tab.dataset.view === 'pharmacy-view' && !isPharmacyAuthenticated) {
                 promptForPharmacyPassword();
            } else {
                setActiveTab(tab);
            }
        });
    });
    if(indicator) indicator.addEventListener("transitionend", (e) => {
        if (e.propertyName === "transform" && navUl && navUl.classList.contains("indicator-ready")) {
            indicator.classList.add("landed");
        }
    });

    // --- LOGIQUE PHARMACIE (Accès) ---
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
            showMessage('Accès pharmacie autorisé.', 'success');
        } else {
            showMessage('Mot de passe incorrect.', 'error');
        }
    });
    document.getElementById('pharmacy-password-cancel-btn').addEventListener('click', () => {
        pharmacyPasswordModal.classList.remove('visible');
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
        if (filterDropdownMenu && filterDropdownBtn && !filterDropdownBtn.contains(e.target) && !filterDropdownMenu.contains(e.target)) {
            filterDropdownMenu.classList.remove('show');
        }
        if (exportDropdownMenu && exportDropdownBtn && !exportDropdownBtn.contains(e.target) && !exportDropdownMenu.contains(e.target)) {
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

    // --- GESTION DES DONNÉES ET AFFICHAGE ---
    database.ref('interventions').on('value', (snapshot) => {
        allInterventions = snapshot.val() || {};
        const activeTab = document.querySelector(".navigation .list.active");
        if(activeTab){
             updateActiveView(activeTab); // Raffraîchit la vue actuelle
        } else {
            displayInterventions();
        }
    });

    function displayInterventions() {
        if (!currentInterventionsCards || !archivedInterventionsCards || !pharmacyInterventionsCards) return;

        currentInterventionsCards.innerHTML = '';
        archivedInterventionsCards.innerHTML = '';
        pharmacyInterventionsCards.innerHTML = '';

        const currentSearchTerm = currentSearchInput.value.toLowerCase();
        const archiveSearchTerm = archiveSearchInput.value.toLowerCase();
        const pharmacySearchTerm = pharmacySearchInput.value.toLowerCase();

        const sortedInterventions = Object.entries(allInterventions).sort(([,a], [,b]) => {
            const dateA = new Date(`${a.date}T${a.heure}`);
            const dateB = new Date(`${b.date}T${b.heure}`);
            return dateB - dateA;
        });

        let filteredCurrentArray = [];
        let filteredArchiveArray = [];
        let filteredPharmacyArray = [];

        sortedInterventions.forEach(([id, inter]) => {
            const interventionData = { id, ...inter };
            if (!inter.statut.includes('Terminé') && !inter.archived) {
                if (matchesFiltersCurrent(inter, currentSearchTerm, currentFilterStatus)) {
                    filteredCurrentArray.push(interventionData);
                }
            }
            if (inter.archived || inter.statut === 'Terminé & Réapprovisionné') {
                if (`${inter.numero_intervention} ${inter.nom} ${inter.date}`.toLowerCase().includes(archiveSearchTerm)) {
                    filteredArchiveArray.push(interventionData);
                }
            }
            if (inter.statut === 'Terminé' && inter.materiels && inter.materiels.length > 0) {
                 if ((inter.materiels.join(' ') + " " + inter.numero_intervention).toLowerCase().includes(pharmacySearchTerm)) {
                    filteredPharmacyArray.push(interventionData);
                   }
            }
        });

        const totalPagesCurrent = Math.ceil(filteredCurrentArray.length / ITEMS_PER_PAGE);
        const startIndexCurrent = (currentPage_current - 1) * ITEMS_PER_PAGE;
        const paginatedCurrent = filteredCurrentArray.slice(startIndexCurrent, startIndexCurrent + ITEMS_PER_PAGE);
        paginatedCurrent.forEach(inter => currentInterventionsCards.innerHTML += createInterventionCard(inter));
        updatePagination('currentCardsPagination', currentPage_current, totalPagesCurrent, 'current');

        const totalPagesArchive = Math.ceil(filteredArchiveArray.length / ITEMS_PER_PAGE);
        const startIndexArchive = (currentPage_archive - 1) * ITEMS_PER_PAGE;
        const paginatedArchive = filteredArchiveArray.slice(startIndexArchive, startIndexArchive + ITEMS_PER_PAGE);
        paginatedArchive.forEach(inter => archivedInterventionsCards.innerHTML += createArchivedInterventionCard(inter));
        updatePagination('archivePagination', currentPage_archive, totalPagesArchive, 'archive');

        const totalPagesPharmacy = Math.ceil(filteredPharmacyArray.length / ITEMS_PER_PAGE);
        const startIndexPharmacy = (currentPage_pharmacy - 1) * ITEMS_PER_PAGE;
        const paginatedPharmacy = filteredPharmacyArray.slice(startIndexPharmacy, startIndexPharmacy + ITEMS_PER_PAGE);
        paginatedPharmacy.forEach(inter => pharmacyInterventionsCards.innerHTML += createPharmacyCard(inter));
        updatePagination('pharmacyPagination', currentPage_pharmacy, totalPagesPharmacy, 'pharmacy');

        addCardEventListeners();
    }

    function matchesFiltersCurrent(inter, searchTerm, filterTerm) {
        const matchesSearch = `${inter.numero_intervention} ${inter.nom} ${inter.lieu} ${inter.commune}`.toLowerCase().includes(searchTerm);
        if (!matchesSearch) return false;

        if (filterTerm === 'all') return true;
        if (filterTerm === 'Terminé') { // Spécifique pour les terminées non archivées
             return inter.statut === filterTerm && !inter.archived;
        }
        if (filterTerm === 'Urgent' || filterTerm === 'Critique') {
            return inter.urgence === filterTerm;
        }
        return inter.statut === filterTerm;
    }

    // --- CRÉATION D'ÉLÉMENTS HTML (CARTES AMÉLIORÉES) ---
    function getStatusSelectClass(statut) {
        switch (statut) {
            case 'En attente': return 'status-en-attente';
            case 'En cours': return 'status-en-cours';
            case 'Terminé': return 'status-termine';
            default: return '';
        }
    }

    function createInterventionCard(inter) {
        const { id, numero_intervention, nom, date, heure, lieu, statut, urgence } = inter;
        
        const statusSelectHtml = `
            <select class="status-select-card ${getStatusSelectClass(statut)}" data-id="${id}">
                <option value="En attente" ${statut === 'En attente' ? 'selected' : ''}>En attente</option>
                <option value="En cours" ${statut === 'En cours' ? 'selected' : ''}>En cours</option>
                <option value="Terminé" ${statut === 'Terminé' ? 'selected' : ''}>Terminé</option>
            </select>
        `;
        
        let urgenceHtml = '';
        if (urgence !== 'Normal') {
            const urgenceClass = urgence === 'Urgent' ? 'badge-urgent' : 'badge-critique';
            const urgenceIcon = urgence === 'Urgent' ? 'bi-exclamation-triangle-fill' : 'bi-exclamation-octagon-fill';
            urgenceHtml = `
                <div class="card-item">
                    <i class="bi ${urgenceIcon}"></i>
                    <span>Urgence <span class="status-badge ${urgenceClass}">${urgence}</span></span>
                </div>`;
        }

        return `
            <div class="intervention-card" data-id="${id}">
                <div class="card-header">
                    <h4><i class="bi bi-hash"></i>${numero_intervention}</h4>
                    ${statusSelectHtml}
                </div>
                <div class="card-body">
                    <div class="card-item"> <i class="bi bi-person-fill"></i> <span>${nom || 'N/A'}</span> </div>
                    <div class="card-item"> <i class="bi bi-calendar3"></i> <span>${formatDate(date)} à ${heure}</span> </div>
                    <div class="card-item"> <i class="bi bi-geo-alt-fill"></i> <span>${lieu || 'Lieu non spécifié'}</span> </div>
                    ${urgenceHtml}
                </div>
                <div class="card-footer">
                    <button class="btn-icon-footer view-btn" title="Voir les détails"><i class="bi bi-eye-fill"></i></button>
                    <button class="btn-icon-footer edit-btn" title="Modifier"><i class="bi bi-pencil-fill"></i></button>
                    <button class="btn-icon-footer archive-btn" title="Archiver (si terminée)"><i class="bi bi-archive-fill"></i></button>
                </div>
            </div>
        `;
    }

    function createArchivedInterventionCard(inter) {
        const { id, numero_intervention, nom, date, heure, lieu, statut } = inter;
        return `
            <div class="intervention-card archived-card" data-id="${id}">
                <div class="card-header">
                    <h4><i class="bi bi-hash"></i>${numero_intervention}</h4>
                    <span class="status-badge ${getStatusBadgeClass(statut)}">${statut}</span>
                </div>
                <div class="card-body">
                    <div class="card-item"> <i class="bi bi-person-fill"></i> <span>${nom || 'N/A'}</span> </div>
                    <div class="card-item"> <i class="bi bi-calendar-x"></i> <span>${formatDate(date)} à ${heure}</span> </div>
                    <div class="card-item"> <i class="bi bi-geo-alt-fill"></i> <span>${lieu || 'Lieu non spécifié'}</span> </div>
                </div>
                <div class="card-footer">
                    <button class="btn-icon-footer view-btn" title="Voir les détails"><i class="bi bi-eye-fill"></i></button>
                    <button class="btn-icon-footer unarchive-btn" title="Désarchiver"><i class="bi bi-box-arrow-up"></i></button>
                    <button class="btn-icon-footer delete-btn" title="Supprimer définitivement"><i class="bi bi-trash-fill"></i></button>
                </div>
            </div>
        `;
    }
    
    function createPharmacyCard(inter) {
        const { id, numero_intervention, date, materiels, pharmacyMaterials } = inter;

        const allReappro = materiels.every(mat => pharmacyMaterials && pharmacyMaterials[mat] && pharmacyMaterials[mat].status === 'reapprovisionne');
        const statusText = allReappro ? 'Réapprovisionné' : 'En attente';
        const statusClass = allReappro ? 'badge-termine-reappro' : 'badge-en-attente';

        const materielsHtmlList = materiels && materiels.length > 0
            ? `<ul class="material-list-card">${materiels.map(mat => `<li><i class="bi bi-box-seam"></i>${mat}</li>`).join('')}</ul>`
            : '<p>Aucun matériel à traiter.</p>';

        return `
            <div class="intervention-card pharmacy-card" data-id="${id}">
                <div class="card-header">
                    <h4><i class="bi bi-hash"></i>${numero_intervention}</h4>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>
                <div class="card-body">
                    <div class="card-item"> <i class="bi bi-calendar-check"></i> <span>Terminée le ${formatDate(date)}</span> </div>
                    <h5>Matériels à réapprovisionner :</h5>
                    ${materielsHtmlList}
                </div>
                <div class="card-footer">
                    <button class="btn-primary manage-material-btn" title="Gérer le matériel"> <i class="bi bi-pencil-square"></i> Gérer le Matériel </button>
                </div>
            </div>
        `;
    }

    // --- GESTIONNAIRES D'ÉVÉNEMENTS ---
    function addCardEventListeners() {
        document.querySelectorAll('.view-btn').forEach(btn => btn.addEventListener('click', (e) => showDetailsModal(e.currentTarget.closest('[data-id]').dataset.id)));
        document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', (e) => editIntervention(e.currentTarget.closest('[data-id]').dataset.id)));
        document.querySelectorAll('.archive-btn').forEach(btn => btn.addEventListener('click', (e) => archiveIntervention(e.currentTarget.closest('[data-id]').dataset.id)));
        document.querySelectorAll('.unarchive-btn').forEach(btn => btn.addEventListener('click', (e) => unarchiveIntervention(e.currentTarget.closest('[data-id]').dataset.id)));
        document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', (e) => deleteIntervention(e.currentTarget.closest('[data-id]').dataset.id)));
        document.querySelectorAll('.manage-material-btn').forEach(btn => btn.addEventListener('click', (e) => openMaterialStatusModal(e.currentTarget.closest('[data-id]').dataset.id)));

        document.querySelectorAll('.status-select-card').forEach(select => {
            select.addEventListener('change', handleCardStatusChange);
        });
    }

    async function handleCardStatusChange(e) {
        const interventionId = e.target.dataset.id;
        const newStatus = e.target.value;
        const interventionRef = database.ref(`interventions/${interventionId}`);

        try {
            await interventionRef.update({ statut: newStatus, updatedAt: firebase.database.ServerValue.TIMESTAMP });
            showMessage(`Statut de l'intervention mis à jour à "${newStatus}".`, 'success');

            if (newStatus === 'Terminé') {
                const snapshot = await interventionRef.once('value');
                const intervention = snapshot.val();
                if (intervention && intervention.materiels && intervention.materiels.length > 0) {
                    const pharmacyMaterialsUpdates = {};
                    intervention.materiels.forEach(material => {
                        const currentPharmacyMat = intervention.pharmacyMaterials?.[material];
                        pharmacyMaterialsUpdates[`pharmacyMaterials/${material}/status`] = currentPharmacyMat?.status || 'attente';
                        pharmacyMaterialsUpdates[`pharmacyMaterials/${material}/updatedAt`] = firebase.database.ServerValue.TIMESTAMP;
                        if (!currentPharmacyMat?.comment) {
                             pharmacyMaterialsUpdates[`pharmacyMaterials/${material}/comment`] = '';
                        }
                    });
                    await interventionRef.update(pharmacyMaterialsUpdates);
                }
            }
            e.target.className = `status-select-card ${getStatusSelectClass(newStatus)}`;

        } catch (error) {
            showMessage("Erreur lors de la mise à jour du statut: " + error.message, "error");
            displayInterventions();
        }
    }

    interventionForm.addEventListener('submit', handleFormSubmit);
    document.getElementById('ajouterMateriel').addEventListener('click', addMateriel);
    document.getElementById('photo').addEventListener('change', handlePhotoUpload);
    document.getElementById('resetForm').addEventListener('click', resetForm);

    currentSearchInput.addEventListener('input', () => { currentPage_current = 1; displayInterventions(); });
    archiveSearchInput.addEventListener('input', () => { currentPage_archive = 1; displayInterventions(); });
    pharmacySearchInput.addEventListener('input', () => { currentPage_pharmacy = 1; displayInterventions(); });

    document.querySelectorAll('.modal .close-button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.currentTarget.closest('.modal').classList.remove('visible');
        });
    });
     // Cacher le modal image en cliquant n'importe où
    imagePreviewModal.addEventListener('click', () => {
        imagePreviewModal.classList.remove('visible');
    });

    // --- FONCTIONS DE MANIPULATION DES DONNÉES ---
    function handleFormSubmit(e) {
        e.preventDefault();
        loaderModal.classList.add('visible'); // AFFICHER LE CHARGEMENT

        const id = interventionIdInput.value;
        const interventionData = {
            numero_intervention: document.getElementById('numero').value, date: document.getElementById('date').value,
            heure: document.getElementById('heure').value, nom: document.getElementById('nom').value,
            lieu: document.getElementById('lieu').value, commune: document.getElementById('commune').value,
            statut: document.getElementById('statut').value, urgence: document.getElementById('urgence').value,
            categorie: document.getElementById('categorie').value, materiels: materiels,
            commentaire: document.getElementById('commentaire').value, photos: photosBase64, archived: false,
        };
        if (!id) { interventionData.createdAt = firebase.database.ServerValue.TIMESTAMP; }
        interventionData.updatedAt = firebase.database.ServerValue.TIMESTAMP;
        const dbRef = id ? database.ref('interventions/' + id) : database.ref('interventions').push();
        
        dbRef.set(interventionData).then(() => {
            showMessage(id ? 'Intervention modifiée !' : 'Intervention enregistrée !', 'success');
            resetForm(); 
            setActiveTab(document.querySelector('.list[data-view="current-view"]'));
        }).catch(err => {
            showMessage('Erreur: ' + err.message, 'error');
        }).finally(() => {
             loaderModal.classList.remove('visible'); // CACHER LE CHARGEMENT
        });
    }

    function editIntervention(id) {
        const inter = allInterventions[id]; if (!inter) return;
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
        materiels = inter.materiels || []; updateMaterielsDisplay();
        photosBase64 = inter.photos || []; updatePhotosDisplay();
        setActiveTab(document.querySelector('.list[data-view="form-view"]'));
    }
    function archiveIntervention(id) {
        const intervention = allInterventions[id];
        if (intervention && intervention.statut.includes('Terminé')) {
            database.ref(`interventions/${id}`).update({archived: true, updatedAt: firebase.database.ServerValue.TIMESTAMP})
                .then(() => showMessage('Intervention archivée.', 'success'))
                .catch(err => showMessage('Erreur: ' + err.message, 'error'));
        } else {
            showMessage("L'intervention doit être 'Terminé' pour être archivée.", "error");
        }
    }
    function unarchiveIntervention(id) {
        database.ref(`interventions/${id}`).update({archived: false, statut: 'En attente', updatedAt: firebase.database.ServerValue.TIMESTAMP})
            .then(() => showMessage('Intervention désarchivée et remise en attente.', 'success')).catch(err => showMessage('Erreur: ' + err.message, 'error'));
    }
    function deleteIntervention(id) {
        const password = prompt("Pour supprimer définitivement, entrez le mot de passe administrateur :");
        if (password === DELETE_PASSWORD) {
            database.ref('interventions/' + id).remove()
                .then(() => showMessage('Intervention supprimée définitivement.', 'success')).catch(err => showMessage('Erreur: ' + err.message, 'error'));
        } else if (password !== null) { showMessage('Mot de passe incorrect. Suppression annulée.', 'error'); }
    }

    // --- FONCTIONS UTILITAIRES ET VISIONNEUSE D'IMAGE ---
    function resetForm() {
        interventionForm.reset(); interventionIdInput.value = ''; materiels = []; photosBase64 = [];
        updateMaterielsDisplay(); updatePhotosDisplay(); setDefaultDateTime();
    }
    function setDefaultDateTime() {
        const now = new Date();
        document.getElementById('date').value = now.toISOString().split('T')[0];
        document.getElementById('heure').value = now.toTimeString().split(' ')[0].substring(0, 5);
    }
    function addMateriel() {
        const input = document.getElementById('materielInput'); const value = input.value.trim();
        if (value && !materiels.includes(value)) { materiels.push(value); updateMaterielsDisplay(); input.value = '';}
    }
    function updateMaterielsDisplay() {
        materielsList.innerHTML = materiels.map(mat => `<span class="tag-item">${mat}<button type="button" class="close-tag" data-materiel="${mat}">&times;</button></span>`).join('');
        document.querySelectorAll('.close-tag').forEach(btn => {
            btn.addEventListener('click', (e) => { materiels = materiels.filter(m => m !== e.target.dataset.materiel); updateMaterielsDisplay(); });
        });
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
    
    function showFullImage(src) {
        fullImagePreview.src = src;
        imagePreviewModal.classList.add('visible');
    }

    // Ajout d'un écouteur d'événements global pour ouvrir la visionneuse
    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('photo-thumb')) {
             e.stopPropagation(); // Empêche le clic de fermer la modale immédiatement
            showFullImage(e.target.src);
        }
    });

    function updatePhotosDisplay() {
        photoPreview.innerHTML = photosBase64.map((photo, index) => `<div class="photo-thumb-wrapper"><img src="${photo}" class="photo-thumb"><button type="button" class="remove-photo-btn" data-index="${index}">&times;</button></div>`).join('');
        document.querySelectorAll('.remove-photo-btn').forEach(btn => {
            btn.addEventListener('click', (e) => { e.stopPropagation(); photosBase64.splice(e.target.dataset.index, 1); updatePhotosDisplay(); });
        });
    }

    function showMessage(message, type) {
        const container = document.createElement('div'); container.className = `message-container ${type}`;
        container.innerHTML = `<p>${message}</p>`; document.body.appendChild(container);
        setTimeout(() => { if (document.body.contains(container)) { document.body.removeChild(container);}}, 3000);
    }
    function formatDate(dateStr) {
        if (!dateStr) return ''; const [year, month, day] = dateStr.split('-'); return `${day}/${month}/${year}`;
    }
    function getStatusBadgeClass(statut) {
       switch (statut) {
         case 'En cours': return 'badge-en-cours'; case 'Terminé': return 'badge-termine';
         case 'Terminé & Réapprovisionné': return 'badge-termine-reappro'; case 'En attente': return 'badge-en-attente';
         default: return '';
       }
    }
    function createBackgroundEmbers() {
        const container = document.querySelector('.background-embers'); if (!container) return; const count = 40; container.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const ember = document.createElement('div'); ember.className = 'ember'; const size = Math.random() * 6 + 2;
            ember.style.width = `${size}px`; ember.style.height = `${size}px`; ember.style.left = `${Math.random() * 100}%`;
            ember.style.animationDuration = `${Math.random() * 15 + 10}s`; ember.style.animationDelay = `${Math.random() * 15}s`;
            container.appendChild(ember);
        }
    }

    // --- LOGIQUE DES MODALS ---
    function showDetailsModal(id) {
        const inter = allInterventions[id]; if (!inter) return;
        const modalContent = detailsModal.querySelector('.modal-content'); modalContent.innerHTML = '';
        const modalHeaderDiv = document.createElement('div'); modalHeaderDiv.id = 'modalHeader';
        modalHeaderDiv.innerHTML = `<h3><i class="bi bi-file-earmark-text-fill"></i>Détails - Inter. n°${inter.numero_intervention}</h3>`;
        const closeBtn = document.createElement('span'); closeBtn.className = 'close-button'; closeBtn.innerHTML = '&times;';
        closeBtn.onclick = () => detailsModal.classList.remove('visible');
        modalHeaderDiv.appendChild(closeBtn); modalContent.appendChild(modalHeaderDiv);
        const modalBodyDiv = document.createElement('div'); modalBodyDiv.id = 'modalBody';
        let photosHtml = `<h4><i class="bi bi-images"></i> Photos</h4><p>Aucune photo</p>`;
        if (inter.photos && inter.photos.length > 0) {
            photosHtml = `<h4><i class="bi bi-images"></i> Photos</h4><div class="photo-grid">${inter.photos.map(p => `<img src="${p}" class="photo-thumb">`).join('')}</div>`;
        }
        let materielsHtml = `<p class="detail-item"><i class="bi bi-tools"></i><strong>Matériels:</strong> <span>Aucun</span></p>`;
        if (inter.materiels && inter.materiels.length > 0) {
            materielsHtml = `<p class="detail-item"><i class="bi bi-tools"></i><strong>Matériels:</strong> <span>${inter.materiels.join(', ')}</span></p>`;
        }
        modalBodyDiv.innerHTML = `
            <div class="detail-section"><h4><i class="bi bi-info-circle-fill"></i> Informations Générales</h4>
                <p class="detail-item"><i class="bi bi-person-fill"></i><strong>Responsable:</strong> <span>${inter.nom}</span></p>
                <p class="detail-item"><i class="bi bi-calendar-event"></i><strong>Date/Heure:</strong> <span>${formatDate(inter.date)} à ${inter.heure}</span></p>
                <p class="detail-item"><i class="bi bi-geo-alt-fill"></i><strong>Lieu:</strong> <span>${inter.lieu || 'N/A'}</span></p>
                <p class="detail-item"><i class="bi bi-building"></i><strong>Commune:</strong> <span>${inter.commune || 'N/A'}</span></p></div>
            <div class="detail-section"><h4><i class="bi bi-clipboard-check-fill"></i> Statut & Priorité</h4>
                <p class="detail-item"><i class="bi bi-activity"></i><strong>Statut:</strong> <span><span class="status-badge ${getStatusBadgeClass(inter.statut)}">${inter.statut}</span></span></p>
                <p class="detail-item"><i class="bi bi-exclamation-triangle-fill"></i><strong>Urgence:</strong> <span><span class="status-badge ${inter.urgence === 'Urgent' ? 'badge-urgent' : inter.urgence === 'Critique' ? 'badge-critique' : ''}">${inter.urgence}</span></span></p>
                <p class="detail-item"><i class="bi bi-tag-fill"></i><strong>Catégorie:</strong> <span><span class="category-badge category-${inter.categorie.replace(/\s+/g, '-')}">${inter.categorie}</span></span></p></div>
            <div class="detail-section full-width"><h4><i class="bi bi-card-text"></i> Détails Supplémentaires</h4>
                ${materielsHtml}
                <p class="detail-item"><i class="bi bi-chat-left-text-fill"></i><strong>Commentaire:</strong> <span>${inter.commentaire || 'Aucun'}</span></p></div>
            <div class="detail-section full-width">${photosHtml}</div>`;
        modalContent.appendChild(modalBodyDiv);
        const modalFooterDiv = document.createElement('div'); modalFooterDiv.className = 'modal-actions';
        const printBtn = document.createElement('button'); printBtn.type = 'button'; printBtn.className = 'btn-primary';
        printBtn.id = 'printInterventionModalBtn'; printBtn.innerHTML = '<i class="bi bi-printer"></i> Imprimer';
        printBtn.onclick = () => printInterventionDetails(id);
        modalFooterDiv.appendChild(printBtn); modalContent.appendChild(modalFooterDiv);
        detailsModal.classList.add('visible');
    }
    
    // ... Reste du code JS inchangé (stats, export, pagination, modals pharmacie, etc.)
    function openMaterialStatusModal(interId) {
        const inter = allInterventions[interId]; if (!inter || !inter.materiels) return;
        document.getElementById('material-modal-inter-num').textContent = `n°${inter.numero_intervention}`;
        const listContainer = document.getElementById('material-management-list'); listContainer.innerHTML = '';
        inter.materiels.forEach(mat => {
            const matStatus = inter.pharmacyMaterials?.[mat]?.status || 'attente';
            const item = document.createElement('div'); item.className = 'material-management-item';
            item.innerHTML = `<span>${mat}</span><select data-inter-id="${interId}" data-material-name="${mat}"><option value="attente" ${matStatus === 'attente' ? 'selected' : ''}>En attente</option><option value="commande" ${matStatus === 'commande' ? 'selected' : ''}>En commande</option><option value="reapprovisionne" ${matStatus === 'reapprovisionne' ? 'selected' : ''}>Réapprovisionné</option></select>`;
            listContainer.appendChild(item);
        });
        listContainer.querySelectorAll('select').forEach(select => { select.addEventListener('change', updateMaterialStatus); });
        materialStatusModal.classList.add('visible');
    }
    function updateMaterialStatus(e) {
        const { interId, materialName } = e.target.dataset; const newStatus = e.target.value;
        const path = `interventions/${interId}/pharmacyMaterials/${materialName}/status`;
        database.ref(path).set(newStatus).then(() => {
            showMessage(`Statut de '${materialName}' mis à jour.`, 'success');
            checkAllMaterialsReapprovisioned(interId);
        }).catch(err => showMessage('Erreur: ' + err.message, 'error'));
    }
    async function checkAllMaterialsReapprovisioned(interId) {
        const inter = allInterventions[interId]; if (!inter || !inter.materiels) return;
        const snapshot = await database.ref(`interventions/${interId}/pharmacyMaterials`).once('value');
        const pharmacyData = snapshot.val();
        const allReappro = inter.materiels.every(mat => pharmacyData?.[mat]?.status === 'reapprovisionne');
        if (allReappro) {
            await database.ref(`interventions/${interId}`).update({ statut: 'Terminé & Réapprovisionné', archived: true, updatedAt: firebase.database.ServerValue.TIMESTAMP });
            showMessage(`Intervention n°${inter.numero_intervention} terminée et archivée.`, 'success');
        }
    }
    document.getElementById('material-status-close-btn').addEventListener('click', () => {
        materialStatusModal.classList.remove('visible');
    });

    function updateStats() {
        const stats = { enCours: 0, termine: 0, enAttente: 0, archive: 0 };
        Object.values(allInterventions).forEach(inter => {
            if (inter.archived) stats.archive++;
            else if (inter.statut === 'En cours') stats.enCours++;
            else if (inter.statut.includes('Terminé')) stats.termine++;
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
        const monthlyData = {};
        Object.values(allInterventions).forEach(inter => {
            const monthKey = inter.date.substring(0, 7);
            monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
        });
        const sortedMonths = Object.keys(monthlyData).sort();
        const chartLabels = sortedMonths.map(key => {
            const [year, month] = key.split('-');
            return new Date(year, month-1).toLocaleString('fr-FR', {month: 'short', year: 'numeric'});
        });
        const chartData = sortedMonths.map(key => monthlyData[key]);
        if(monthlyChart) monthlyChart.destroy();
        monthlyChart = new Chart(monthlyCtx, {
            type: 'bar', data: { labels: chartLabels, datasets: [{ label: 'Interventions par mois', data: chartData, backgroundColor: 'rgba(229, 56, 59, 0.7)',}]},
            options: { scales: { y: { beginAtZero: true, ticks: {color: '#fff'}}, x:{ticks:{color:'#fff'}} }, plugins: { legend: { labels: { color: '#fff' } } } }
        });
        const statusData = { 'En attente': 0, 'En cours': 0, 'Terminé': 0, 'Archivé':0 };
        Object.values(allInterventions).forEach(inter => {
            if(inter.archived && inter.statut === 'Terminé & Réapprovisionné'){ statusData['Terminé']++; statusData['Archivé']++; }
            else if(inter.archived) { statusData['Archivé']++; } else if(inter.statut.includes('Terminé')) { statusData['Terminé']++; }
            else if(statusData[inter.statut] !== undefined) { statusData[inter.statut]++; }
        });
        if(statusChart) statusChart.destroy();
        statusChart = new Chart(statusCtx, {
            type: 'doughnut', data: { labels: Object.keys(statusData), datasets: [{ data: Object.values(statusData), backgroundColor: ['#ff9100', '#0077b6', '#2a9d8f', '#6c757d']}]},
            options: { plugins: { legend: { labels: { color: '#fff' } } } }
        });
    }
    function printInterventionDetails(id) {
        const inter = allInterventions[id]; if (!inter) return; const { jsPDF } = window.jspdf; const doc = new jsPDF();
        doc.setFontSize(18); doc.text(`Fiche Intervention VSAV - N°${inter.numero_intervention}`, 14, 22);
        doc.autoTable({
            startY: 30, head: [['Champ', 'Détail']],
            body: [
                ['Responsable', inter.nom], ['Date / Heure', `${formatDate(inter.date)} à ${inter.heure}`],
                ['Lieu', `${inter.lieu || 'N/A'}, ${inter.commune || 'N/A'}`], ['Statut', inter.statut],
                ['Urgence', inter.urgence], ['Catégorie', inter.categorie],
                ['Matériels', (inter.materiels || []).join(', ')], ['Commentaire', inter.commentaire || 'Aucun']
            ], theme: 'grid', headStyles: { fillColor: [229, 56, 59] }
        });
        doc.save(`Intervention_${inter.numero_intervention}.pdf`);
    }
    exportPharmacyBtn.addEventListener('click', () => {
        const { jsPDF } = window.jspdf; const doc = new jsPDF(); doc.text("Export Pharmacie - Réapprovisionnement", 14, 22);
        const body = [];
        Object.entries(allInterventions).forEach(([id, inter]) => {
            if (inter.statut === 'Terminé' && inter.materiels && inter.materiels.length > 0) {
                 inter.materiels.forEach(mat => {
                      const status = inter.pharmacyMaterials?.[mat]?.status || 'En attente';
                      body.push([inter.numero_intervention, formatDate(inter.date), mat, status]);
                 });
            }
        });
        doc.autoTable({
            startY: 30, head: [['N° Inter.', 'Date', 'Matériel', 'Statut Réappro.']], body: body,
            theme: 'grid', headStyles: { fillColor: [229, 56, 59] }
        });
        doc.save('Export_Pharmacie.pdf');
    });
    document.getElementById('exportExcelBtn')?.addEventListener('click', exportActivesToExcel);
    document.getElementById('exportPdfBtn')?.addEventListener('click', exportActivesToPDF);
    document.getElementById('exportCsvBtn')?.addEventListener('click', exportActivesToCSV);
    function getActiveInterventionsForExport() {
        return Object.values(allInterventions).filter(inter =>
            !inter.archived && matchesFiltersCurrent(inter, currentSearchInput.value.toLowerCase(), currentFilterStatus)
        );
    }
    function exportActivesToExcel() {
        const dataToExport = getActiveInterventionsForExport();
        const ws_data = [["N° Inter.", "Resp.", "Date", "Heure", "Lieu", "Commune", "Statut", "Urgence", "Catégorie", "Matériels"],
            ...dataToExport.map(i => [i.numero_intervention, i.nom, formatDate(i.date), i.heure, i.lieu, i.commune, i.statut, i.urgence, i.categorie, (i.materiels || []).join(", ")])];
        const ws = XLSX.utils.aoa_to_sheet(ws_data); const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Interventions Actives"); XLSX.writeFile(wb, "interventions_actives.xlsx");
        showMessage('Export Excel généré.', 'success');
    }
    function exportActivesToPDF() {
        const dataToExport = getActiveInterventionsForExport(); const { jsPDF } = window.jspdf; const doc = new jsPDF();
        doc.text("Interventions Actives", 14, 22);
        doc.autoTable({
            startY: 30, head: [['N°', 'Resp.', 'Date', 'Statut', 'Urgence']],
            body: dataToExport.map(i => [i.numero_intervention, i.nom, formatDate(i.date), i.statut, i.urgence]),
            theme: 'grid', headStyles: { fillColor: [229, 56, 59] }
        });
        doc.save('interventions_actives.pdf'); showMessage('Export PDF généré.', 'success');
    }
    function exportActivesToCSV() {
        const dataToExport = getActiveInterventionsForExport();
        let csvContent = "data:text/csv;charset=utf-8,N° Intervention;Responsable;Date;Heure;Lieu;Commune;Statut;Urgence;Catégorie;Matériels\n";
        dataToExport.forEach(i => {
            const row = [i.numero_intervention, i.nom, formatDate(i.date), i.heure, `"${i.lieu || ''}"`, `"${i.commune || ''}"`, i.statut, i.urgence, i.categorie, `"${(i.materiels || []).join(", ")}"`].join(";");
            csvContent += row + "\n";
        });
        const encodedUri = encodeURI(csvContent); const link = document.createElement("a");
        link.setAttribute("href", encodedUri); link.setAttribute("download", "interventions_actives.csv");
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        showMessage('Export CSV généré.', 'success');
    }

    function updatePagination(elementId, currentPage, totalPages, type) {
        const paginationUl = document.getElementById(elementId); if (!paginationUl) return; paginationUl.innerHTML = '';
        if (totalPages <= 1) return;
        const prevLi = document.createElement('li'); prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        const prevA = document.createElement('a'); prevA.className = 'page-link'; prevA.href = '#'; prevA.innerHTML = '<i class="bi bi-chevron-left"></i>';
        prevA.addEventListener('click', (e) => { e.preventDefault(); if (currentPage > 1) handlePageChange(currentPage - 1, type); });
        prevLi.appendChild(prevA); paginationUl.appendChild(prevLi);
        const maxPagesToShow = 5; let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
        if (endPage - startPage + 1 < maxPagesToShow) { startPage = Math.max(1, endPage - maxPagesToShow + 1); }
        if (startPage > 1) {
            const firstLi = document.createElement('li'); firstLi.className = 'page-item';
            const firstA = document.createElement('a'); firstA.className = 'page-link'; firstA.href = '#'; firstA.textContent = '1';
            firstA.addEventListener('click', (e) => { e.preventDefault(); handlePageChange(1, type); });
            firstLi.appendChild(firstA); paginationUl.appendChild(firstLi);
            if (startPage > 2) {
                const ellipsisLi = document.createElement('li'); ellipsisLi.className = 'page-item disabled';
                ellipsisLi.innerHTML = '<span class="page-link">...</span>'; paginationUl.appendChild(ellipsisLi);
            }
        }
        for (let i = startPage; i <= endPage; i++) {
            const pageLi = document.createElement('li'); pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
            const pageA = document.createElement('a'); pageA.className = 'page-link'; pageA.href = '#'; pageA.textContent = i;
            pageA.addEventListener('click', (e) => { e.preventDefault(); handlePageChange(i, type); });
            pageLi.appendChild(pageA); paginationUl.appendChild(pageLi);
        }
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const ellipsisLi = document.createElement('li'); ellipsisLi.className = 'page-item disabled';
                ellipsisLi.innerHTML = '<span class="page-link">...</span>'; paginationUl.appendChild(ellipsisLi);
            }
            const lastLi = document.createElement('li'); lastLi.className = 'page-item';
            const lastA = document.createElement('a'); lastA.className = 'page-link'; lastA.href = '#'; lastA.textContent = totalPages;
            lastA.addEventListener('click', (e) => { e.preventDefault(); handlePageChange(totalPages, type); });
            lastLi.appendChild(lastA); paginationUl.appendChild(lastLi);
        }
        const nextLi = document.createElement('li'); nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
        const nextA = document.createElement('a'); nextA.className = 'page-link'; nextA.href = '#'; nextA.innerHTML = '<i class="bi bi-chevron-right"></i>';
        nextA.addEventListener('click', (e) => { e.preventDefault(); if (currentPage < totalPages) handlePageChange(currentPage + 1, type); });
        nextLi.appendChild(nextA); paginationUl.appendChild(nextLi);
    }
    function handlePageChange(newPage, type) {
        if (type === 'current') currentPage_current = newPage;
        else if (type === 'archive') currentPage_archive = newPage;
        else if (type === 'pharmacy') currentPage_pharmacy = newPage;
        displayInterventions();
    }

    // --- INITIALISATION ---
    function initializeApp() {
        const initialActiveTab = document.querySelector(".navigation .list.active");
        if (initialActiveTab) {
            updateActiveView(initialActiveTab);
            moveIndicator(initialActiveTab);
        }
        setDefaultDateTime();
        createBackgroundEmbers();
    }
    initializeApp();
});
