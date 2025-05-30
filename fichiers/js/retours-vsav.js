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
    };
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();

    // --- SÉLECTEURS D'ÉLÉMENTS ---
    const globalHeader = document.getElementById('global-header');
    const mainNavUl = document.getElementById('main-nav-ul');
    const pharmacyNavUl = document.getElementById('pharmacy-nav-ul');
    const indicator = document.querySelector(".navigation .indicator");
    const viewContainers = document.querySelectorAll('.view-container');
    const topLoginBtn = document.getElementById('top-login-btn');
    const headerLogoutBtn = document.getElementById('header-logout-btn');
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
    const pharmacyArchivedInterventionsCards = document.getElementById('pharmacyArchivedInterventionsCards');
    const detailsModal = document.getElementById('detailsModal');
    const materialManagementModal = document.getElementById('materialManagementModal');
    const currentSearchInput = document.getElementById('currentSearch');
    const archiveSearchInput = document.getElementById('archiveSearch');
    const pharmacySearchInput = document.getElementById('pharmacySearch');
    const journalTableBody = document.getElementById('journalTableBody');
    
    const unifiedStockCards = document.getElementById('unifiedStockCards');

    const currentCommandesCards = document.getElementById('currentCommandesCards');
    const archivedCommandesCards = document.getElementById('archivedCommandesCards');

    const stockDatalist = document.getElementById('stockDatalist');
    const clearJournalBtn = document.getElementById('clearJournalBtn');

    const materielSelectionModal = document.getElementById('materielSelectionModal');
    const openMaterielSelectionModalBtn = document.getElementById('openMaterielSelectionModalBtn');
    const materielSearchModalInput = document.getElementById('materielSearchModalInput');
    const materielSelectionList = document.getElementById('materielSelectionList');
    const manualMaterielNameModalInput = document.getElementById('manualMaterielNameModal');
    const manualMaterielQtyModalInput = document.getElementById('manualMaterielQtyModal');
    const addManualMaterielFromModalBtn = document.getElementById('addManualMaterielFromModalBtn');
    const confirmMaterielSelectionBtn = document.getElementById('confirmMaterielSelectionBtn');
    const cancelMaterielSelectionBtn = document.getElementById('cancelMaterielSelectionBtn');
    
    const addManualCommandModal = document.getElementById('addManualCommandModal');
    const openAddManualCommandModalBtn = document.getElementById('openAddManualCommandModalBtn');
    const manualCommandItemsContainer = document.getElementById('manualCommandItemsContainer');
    const addAnotherItemToManualCommandBtn = document.getElementById('addAnotherItemToManualCommandBtn');
    const saveNewManualCommandBtn = document.getElementById('saveNewManualCommandBtn');
    const fabAddManualCommand = document.getElementById('fabAddManualCommand');

    const addStockItemModal = document.getElementById('addStockItemModal');
    const openAddStockItemModalBtn = document.getElementById('openAddStockItemModalBtn');
    const newUnifiedStockItemNameModalInput = document.getElementById('newUnifiedStockItemNameModal');
    const newUnifiedStockItemQtyModalInput = document.getElementById('newUnifiedStockItemQtyModal');
    const newUnifiedStockTargetModalSelect = document.getElementById('newUnifiedStockTargetModal');
    const saveNewStockItemBtn = document.getElementById('saveNewStockItemBtn');
    const fabAddStockItem = document.getElementById('fabAddStockItem');
    
    const pharmacyHeaderSubnavContainer = document.getElementById('pharmacy-header-subnav-container');


    // --- VARIABLES GLOBALES ---
    let allInterventions = {};
    let pompierStock = {};
    let pharmaStock = {};
    let commandLog = {};
    let activityLog = {};
    let materiels = []; 
    let tempSelectedMaterielsModal = []; 
    let photosBase64 = [];
    const ITEMS_PER_PAGE = 6; 
    let currentPage_current = 1;
    let currentPage_archive = 1;
    let currentPage_pharmacy = 1;
    let currentPage_pharmacy_archive = 1;
    let currentCommandView = 'current'; 
    let currentStockSubView = 'pompier';

    const PHARMACY_PASSWORD = "018A"; 
    const DELETE_PASSWORD = "Aspf66220*"; 
    let isPharmacyAuthenticated = false;
    let currentUser = "Anonyme";

    // --- GESTION DE LA MODALE PERSONNALISÉE ---
    const dialog = {
        modal: document.getElementById('custom-dialog-modal'),
        title: document.getElementById('dialog-title'),
        message: document.getElementById('dialog-message'),
        inputContainer: document.getElementById('dialog-input-container'),
        input: document.getElementById('dialog-input'),
        confirmBtn: document.getElementById('dialog-confirm-btn'),
        cancelBtn: document.getElementById('dialog-cancel-btn'),
        resolver: null
    };

    function showCustomDialog(options) {
        return new Promise(resolve => {
            dialog.resolver = resolve;
            dialog.title.textContent = options.title || 'Confirmation';
            dialog.message.innerHTML = options.message || ''; 
            dialog.inputContainer.style.display = options.type === 'prompt' ? 'block' : 'none';
            if (options.type === 'prompt') {
                dialog.input.type = options.inputType || 'text';
                dialog.input.value = options.defaultValue || '';
                dialog.input.placeholder = options.placeholder || '';
            }
            dialog.modal.classList.add('visible');
            if (options.type === 'prompt') dialog.input.focus();
        });
    }

    dialog.confirmBtn.addEventListener('click', () => {
        if (dialog.resolver) dialog.resolver(dialog.inputContainer.style.display === 'block' ? dialog.input.value : true);
        dialog.modal.classList.remove('visible');
    });

    dialog.cancelBtn.addEventListener('click', () => {
        if (dialog.resolver) dialog.resolver(dialog.inputContainer.style.display === 'block' ? null : false);
        dialog.modal.classList.remove('visible');
    });

    // --- GESTIONNAIRE DE JOURNALISATION (LOG) ---
    function addLogEntry(action, details) {
        const logRef = database.ref('log').push();
        return logRef.set({
            action,
            details,
            user: currentUser,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
    }

    // --- GESTION DES DONNÉES ET AFFICHAGE ---
    function fetchData() {
        database.ref('interventions').on('value', snapshot => {
            allInterventions = snapshot.val() || {};
            refreshCurrentView();
        });
        database.ref('stocks/pompier').on('value', snapshot => {
            pompierStock = snapshot.val() || {};
            updateStockDatalist();
            if (document.getElementById('stock-unified-view')?.classList.contains('visible') && currentStockSubView === 'pompier') {
                 displayUnifiedStockView();
            }
            if (materielSelectionModal.classList.contains('visible')) {
                populateMaterielSelectionModal();
            }
        });
        database.ref('stocks/pharmacie').on('value', snapshot => {
            pharmaStock = snapshot.val() || {};
            updateStockDatalist();
            if (document.getElementById('stock-unified-view')?.classList.contains('visible') && currentStockSubView === 'pharmacie') {
                 displayUnifiedStockView();
            }
            if (materielSelectionModal.classList.contains('visible')) {
                populateMaterielSelectionModal();
            }
        });
        database.ref('log').on('value', snapshot => {
            activityLog = snapshot.val() || {};
            if (document.getElementById('journal-view').classList.contains('visible')) displayJournal();
        });
        database.ref('commandes').on('value', snapshot => {
            commandLog = snapshot.val() || {};
            if (document.getElementById('commandes-view').classList.contains('visible')) displayCommandes();
        });
    }

    function refreshCurrentView() {
        const activeNav = isPharmacyAuthenticated ? pharmacyNavUl : mainNavUl;
        const activeTab = activeNav.querySelector(".list.active");
        if (activeTab) {
            updateActiveView(activeTab, false); 
            setTimeout(() => { 
                const currentActiveTab = (isPharmacyAuthenticated ? pharmacyNavUl : mainNavUl).querySelector(".list.active");
                if (currentActiveTab) moveIndicator(currentActiveTab);
            }, 100);
        } else { 
            const firstTab = isPharmacyAuthenticated 
                ? pharmacyNavUl.querySelector('.list[data-view="reappro-view"]') || pharmacyNavUl.querySelector('.list')
                : mainNavUl.querySelector('.list[data-view="form-view"]') || mainNavUl.querySelector('.list');
            if (firstTab) setActiveTab(firstTab, isPharmacyAuthenticated ? pharmacyNavUl : mainNavUl);
        }
    }

    // --- LOGIQUE DE NAVIGATION ---
    function moveIndicator(element) {
        if (!element || !indicator) return;
        const navigationContainer = element.closest('.navigation');
        if (!navigationContainer) return;
    
        setTimeout(() => { 
            const ul = element.closest('ul');
            if (!ul) return; 
            const ulLeft = ul.offsetLeft; 
            const elementLeft = element.offsetLeft; 
            const totalLeft = ulLeft + elementLeft; 
    
            const elementWidth = element.offsetWidth;
            const indicatorWidth = indicator.offsetWidth;
            if (indicatorWidth === 0) return; 
            const newX = (elementWidth / 2 - indicatorWidth / 2) + totalLeft;
    
            navigationContainer.style.setProperty("--indicator-x-pos", `${newX}px`);
            navigationContainer.classList.add("indicator-ready");
    
            const shockwave = indicator.querySelector(".shockwave") || document.createElement("div");
            shockwave.className = "shockwave";
            indicator.innerHTML = ""; 
            indicator.appendChild(shockwave);
            const iconElement = element.querySelector(".icon ion-icon");
            if (iconElement) indicator.appendChild(iconElement.cloneNode(true));
    
            indicator.classList.remove("landed");
            setTimeout(() => indicator.classList.add("landed"), 50); 
        }, 50); 
    }
    
    function updateActiveView(activeItem, move = true) {
        const viewId = activeItem.dataset.view;
        viewContainers.forEach(v => v.classList.remove('visible'));
        const activeView = document.getElementById(viewId);
    
        fabAddManualCommand.style.display = 'none'; 
        fabAddStockItem.style.display = 'none'; 

        if (activeView) {
            activeView.classList.add('visible');
            updateHeaderControls(viewId); 
            updatePharmacyHeaderSubNav(viewId); 
    
            switch (viewId) {
                case 'current-view':
                case 'archive-view':
                case 'reappro-view':
                case 'pharmacy-archives-view':
                    displayInterventions();
                    break;
                case 'journal-view':
                    displayJournal();
                    break;
                case 'stock-unified-view': 
                    displayUnifiedStockView();
                    if (isPharmacyAuthenticated && window.innerWidth <= 768) fabAddStockItem.style.display = 'flex';
                    break;
                case 'commandes-view':
                    displayCommandes();
                     if (isPharmacyAuthenticated && window.innerWidth <= 768) fabAddManualCommand.style.display = 'flex'; 
                    break;
                case 'form-view':
                    if (!interventionIdInput.value) { 
                        resetForm();
                    }
                    break;
            }
        }
    
        if (move) {
            setTimeout(() => moveIndicator(activeItem), 50); 
        }
    }

    function setActiveTab(tabElement, navContainer) {
        if (!tabElement) return;
        if (tabElement.classList.contains('active') && navContainer.querySelector('.list.active') === tabElement) {
             setTimeout(() => moveIndicator(tabElement), 50); 
            return;
        }
        
        const navigationContainer = tabElement.closest('.navigation');
        if (navigationContainer) navigationContainer.classList.remove("indicator-ready"); 
        
        navContainer.querySelectorAll('.list').forEach(item => item.classList.remove('active'));
        tabElement.classList.add('active');
        updateActiveView(tabElement, true); 
    }

    function setupNavEventListeners(navUl) {
        navUl.querySelectorAll('.list').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                setActiveTab(e.currentTarget.closest('li'), navUl);
            });
        });
    }

    function updateHeaderControls(activeViewId) {
        headerControlGroups.forEach(group => group.classList.remove('visible'));
        let targetIdSuffix = activeViewId.replace('-view', ''); 
    
        if (isPharmacyAuthenticated) {
            if (['reappro', 'commandes', 'stock-unified', 'pharmacy-archives', 'journal'].includes(targetIdSuffix)) {
                targetIdSuffix = 'pharmacy'; 
            } else if (targetIdSuffix === 'form') { 
                 targetIdSuffix = 'none'; 
            } else { 
                 targetIdSuffix = 'none'; 
            }
        } else { 
            if (!['current', 'archive', 'form'].includes(targetIdSuffix)) {
                targetIdSuffix = 'none'; 
            }
             if (targetIdSuffix === 'form') { 
                 targetIdSuffix = 'none'; 
            }
        }
            
        const targetGroup = document.getElementById(`header-controls-${targetIdSuffix}`);
        if (targetGroup) {
            targetGroup.classList.add('visible');
        }
    }

    function updatePharmacyHeaderSubNav(activeViewId) {
        pharmacyHeaderSubnavContainer.innerHTML = ''; 
        pharmacyHeaderSubnavContainer.style.display = 'none'; 
        
        const desktopSubNavCommandes = document.querySelector('#commandes-view .desktop-sub-nav');
        const desktopSubNavStock = document.querySelector('#stock-unified-view .desktop-sub-nav');

        if (isPharmacyAuthenticated) {
            globalHeader.classList.add('pharmacy-mode'); 
            let subNavHtml = '';
            if (activeViewId === 'commandes-view') {
                pharmacyHeaderSubnavContainer.style.display = 'flex';
                if(desktopSubNavCommandes) desktopSubNavCommandes.classList.add('hidden-by-header');
                
                subNavHtml = `
                    <button class="header-sub-nav-btn ${currentCommandView === 'current' ? 'active' : ''}" data-command-view="current">En cours</button>
                    <button class="header-sub-nav-btn ${currentCommandView === 'archived' ? 'active' : ''}" data-command-view="archived">Archivées</button>
                `;
                pharmacyHeaderSubnavContainer.innerHTML = subNavHtml;
                pharmacyHeaderSubnavContainer.querySelectorAll('.header-sub-nav-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        pharmacyHeaderSubnavContainer.querySelectorAll('.header-sub-nav-btn').forEach(b => b.classList.remove('active'));
                        e.currentTarget.classList.add('active');
                        currentCommandView = e.currentTarget.dataset.commandView;
                        displayCommandes(); 
                    });
                });
            } else if (activeViewId === 'stock-unified-view') {
                pharmacyHeaderSubnavContainer.style.display = 'flex';
                 if(desktopSubNavStock) desktopSubNavStock.classList.add('hidden-by-header');

                subNavHtml = `
                    <button class="header-sub-nav-btn ${currentStockSubView === 'pompier' ? 'active' : ''}" data-stock-type="pompier">Stock VSAV</button>
                    <button class="header-sub-nav-btn ${currentStockSubView === 'pharmacie' ? 'active' : ''}" data-stock-type="pharmacie">Stock Pharmacie</button>
                `;
                pharmacyHeaderSubnavContainer.innerHTML = subNavHtml;
                pharmacyHeaderSubnavContainer.querySelectorAll('.header-sub-nav-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        pharmacyHeaderSubnavContainer.querySelectorAll('.header-sub-nav-btn').forEach(b => b.classList.remove('active'));
                        e.currentTarget.classList.add('active');
                        currentStockSubView = e.currentTarget.dataset.stockType;
                        displayUnifiedStockView(); 
                    });
                });
            } else {
                globalHeader.classList.remove('pharmacy-mode');
                if(desktopSubNavCommandes) desktopSubNavCommandes.classList.remove('hidden-by-header');
                if(desktopSubNavStock) desktopSubNavStock.classList.remove('hidden-by-header');
            }
        } else { 
            globalHeader.classList.remove('pharmacy-mode');
            if(desktopSubNavCommandes) desktopSubNavCommandes.classList.remove('hidden-by-header');
            if(desktopSubNavStock) desktopSubNavStock.classList.remove('hidden-by-header');
        }

        if (pharmacyHeaderSubnavContainer.style.display === 'flex') {
            globalHeader.classList.add('pharmacy-mode-subnav-active');
        } else {
            globalHeader.classList.remove('pharmacy-mode-subnav-active');
        }
    }


    // --- LOGIQUE PHARMACIE (Login / Logout) ---
    function togglePharmacyMode(isEntering) {
        isPharmacyAuthenticated = isEntering;
        mainNavUl.style.display = isEntering ? 'none' : 'flex';
        pharmacyNavUl.style.display = isEntering ? 'flex' : 'none';
        topLoginBtn.style.display = isEntering ? 'none' : 'flex';
        headerLogoutBtn.style.display = isEntering ? 'flex' : 'none';
        
        const addCmdBtnContainerDesktop = document.getElementById('manual-command-actions-section');
        const addStockBtnContainerDesktop = document.getElementById('unifiedStockModalActions');

        if (addCmdBtnContainerDesktop) addCmdBtnContainerDesktop.style.display = isEntering ? 'flex' : 'none';
        if (addStockBtnContainerDesktop) addStockBtnContainerDesktop.style.display = isEntering ? 'flex' : 'none';
        
        fabAddManualCommand.style.display = 'none';
        fabAddStockItem.style.display = 'none';

        viewContainers.forEach(v => v.classList.remove('visible')); 
        
        if (isEntering) {
            currentUser = sessionStorage.getItem('pharmaUserName') || "Pharmacien"; 
            const pharmacyDefaultTab = pharmacyNavUl.querySelector('.list[data-view="reappro-view"]');
            setActiveTab(pharmacyDefaultTab, pharmacyNavUl);
        } else {
            currentUser = sessionStorage.getItem('userName') || "Pompier"; 
            const mainDefaultTab = mainNavUl.querySelector('.list[data-view="form-view"]'); 
            setActiveTab(mainDefaultTab, mainNavUl);
            globalHeader.classList.remove('pharmacy-mode'); 
             globalHeader.classList.remove('pharmacy-mode-subnav-active');
        }
        
        const activeNav = isEntering ? pharmacyNavUl : mainNavUl;
        const activeTab = activeNav.querySelector(".list.active"); 
        if (activeTab) {
            updateActiveView(activeTab, false); 
        }
    }

    async function handlePharmacyLogin() {
        const password = await showCustomDialog({
            title: 'Accès Sécurisé Pharmacie',
            message: 'Veuillez entrer le mot de passe.',
            type: 'prompt',
            inputType: 'password'
        });

        if (password === PHARMACY_PASSWORD) {
            const name = await showCustomDialog({
                title: 'Identification',
                message: "Veuillez entrer votre nom pour le journal d'activité :",
                type: 'prompt',
                placeholder: 'Pharmacien', 
            });
            currentUser = name || "Pharmacien"; 
            sessionStorage.setItem('pharmaUserName', currentUser); 
            showMessage('Accès pharmacie autorisé.', 'success');
            togglePharmacyMode(true);
        } else if (password !== null) { 
            showMessage('Mot de passe incorrect.', 'error');
        }
    }

    async function handlePharmacyLogout() {
        const confirmed = await showCustomDialog({
            title: 'Déconnexion',
            message: 'Quitter le mode pharmacie ?'
        });
        if (confirmed) {
            togglePharmacyMode(false);
            showMessage('Déconnexion de la pharmacie réussie.', 'success');
        }
    }
    

    // --- AFFICHAGE PRINCIPAL DES INTERVENTIONS ---
    function displayInterventions() {
        currentInterventionsCards.innerHTML = '';
        archivedInterventionsCards.innerHTML = '';
        pharmacyInterventionsCards.innerHTML = '';
        pharmacyArchivedInterventionsCards.innerHTML = '';
    
        const currentSearchTerm = (currentSearchInput.value || '').toLowerCase();
        const archiveSearchTerm = (archiveSearchInput.value || '').toLowerCase();
        const pharmacyGlobalSearchTerm = (pharmacySearchInput.value || '').toLowerCase(); 
        
        const sortedInterventions = Object.entries(allInterventions).sort(([, a], [, b]) => b.createdAt - a.createdAt);
    
        let filteredCurrent = [], filteredArchive = [], filteredPharmacyReappro = [], filteredPharmacyArchive = [];
    
        sortedInterventions.forEach(([id, inter]) => {
            const data = { id, ...inter };
            const searchableInterventionText = `${inter.numero_intervention} ${inter.nom || ''} ${inter.lieu || ''} ${inter.date || ''} ${Object.keys(inter.materiels||{}).join(' ')}`.toLowerCase();
    
            if (inter.archived) { 
                if (document.getElementById('archive-view')?.classList.contains('visible') && searchableInterventionText.includes(archiveSearchTerm)) {
                    filteredArchive.push(data);
                }
                
                if (document.getElementById('pharmacy-archives-view')?.classList.contains('visible') && 
                    searchableInterventionText.includes(pharmacyGlobalSearchTerm) && 
                    inter.pharmacyStatus === 'Traité') { 
                     filteredPharmacyArchive.push(data);
                }

                if (document.getElementById('reappro-view')?.classList.contains('visible') &&
                    searchableInterventionText.includes(pharmacyGlobalSearchTerm) &&
                    inter.pharmacyStatus !== 'Traité') { 
                    if (inter.materiels && Object.keys(inter.materiels).length > 0) { 
                        if (!filteredPharmacyReappro.find(item => item.id === id)) { 
                            filteredPharmacyReappro.push(data);
                        }
                    }
                }

            } else { 
                if (document.getElementById('current-view')?.classList.contains('visible') && searchableInterventionText.includes(currentSearchTerm)) {
                    filteredCurrent.push(data);
                }
            }
        });
    
        renderPaginatedView(filteredCurrent, currentInterventionsCards, 'currentCardsPagination', currentPage_current, createInterventionCard, 'current');
        renderPaginatedView(filteredArchive, archivedInterventionsCards, 'archivePagination', currentPage_archive, createArchivedInterventionCard, 'archive');
        renderPaginatedView(filteredPharmacyReappro, pharmacyInterventionsCards, 'pharmacyPagination', currentPage_pharmacy, createPharmacyCard, 'pharmacy');
        renderPaginatedView(filteredPharmacyArchive, pharmacyArchivedInterventionsCards, 'pharmacyArchivePagination', currentPage_pharmacy_archive, createPharmacyArchiveCard, 'pharmacy_archive'); 
    
        addCardEventListeners();
    }
    
    function renderPaginatedView(dataArray, container, paginationId, currentPage, cardCreator, pageType) {
        const totalPages = Math.ceil(dataArray.length / ITEMS_PER_PAGE);
        let effectiveCurrentPage = currentPage;

        if (currentPage > totalPages && totalPages > 0) {
            effectiveCurrentPage = totalPages;
        } else if (currentPage <= 0 && totalPages > 0) { 
             effectiveCurrentPage = 1;
        } else if (totalPages === 0) { 
            effectiveCurrentPage = 1;
        }
        
        if (pageType === 'current') currentPage_current = effectiveCurrentPage;
        else if (pageType === 'archive') currentPage_archive = effectiveCurrentPage;
        else if (pageType === 'pharmacy') currentPage_pharmacy = effectiveCurrentPage;
        else if (pageType === 'pharmacy_archive') currentPage_pharmacy_archive = effectiveCurrentPage;

        const paginatedData = dataArray.slice((effectiveCurrentPage - 1) * ITEMS_PER_PAGE, effectiveCurrentPage * ITEMS_PER_PAGE);
        
        container.innerHTML = paginatedData.length > 0 ? paginatedData.map(cardCreator).join('') : `<p class="empty-view-message">Aucun élément à afficher.</p>`;
        updatePagination(paginationId, effectiveCurrentPage, totalPages, pageType);
    }
    
    // --- CRÉATION DES CARTES HTML ---
    function createInterventionCard(inter) {
        const { id, numero_intervention, nom, date, heure, statut } = inter;
        const hasMaterials = inter.materiels && Object.keys(inter.materiels).length > 0;

        const manageMaterialBtn = statut === 'En cours'
            ? (hasMaterials
                ? `<button class="btn-primary manage-material-btn" data-id="${id}" title="Gérer le matériel et clôturer l'intervention"><i class="bi bi-box-seam"></i> <span class="btn-text">Gérer & Clôturer</span></button>`
                : `<button class="btn-primary close-intervention-btn" data-id="${id}" title="Clôturer l'intervention (sans matériel)"><i class="bi bi-check-circle"></i> <span class="btn-text">Clôturer</span></button>`
              )
            : ''; 

        return `
        <div class="intervention-card" data-id="${id}">
            <div class="card-header">
                <h4><i class="bi bi-hash"></i>${numero_intervention}</h4>
                <span class="status-badge status-${statut.toLowerCase().replace(' ', '-')}">${statut}</span>
            </div>
            <div class="card-body">
                <div class="card-item"><i class="bi bi-person-fill"></i> <span>${nom || 'N/A'}</span></div>
                <div class="card-item"><i class="bi bi-calendar3"></i> <span>${formatDate(date)} à ${heure}</span></div>
            </div>
            <div class="card-footer">
                ${manageMaterialBtn}
                 <div class="card-footer-actions">
                    <button class="btn-icon-footer view-btn" title="Voir les détails"><i class="bi bi-eye-fill"></i></button>
                    ${statut === 'En cours' ? `<button class="btn-icon-footer edit-btn" title="Modifier"><i class="bi bi-pencil-fill"></i></button>` : ''}
                    </div>
            </div>
        </div>`;
    }

    function createArchivedInterventionCard(inter) {
        return `
        <div class="intervention-card archived-card" data-id="${inter.id}">
            <div class="card-header"><h4><i class="bi bi-hash"></i>${inter.numero_intervention}</h4><span class="status-badge badge-termine">Archivé Pompier</span></div>
            <div class="card-body">
                <div class="card-item"><i class="bi bi-person-fill"></i><span>${inter.nom || 'N/A'}</span></div>
                <div class="card-item"><i class="bi bi-calendar-x"></i><span>Archivée le ${inter.archivedAt ? new Date(inter.archivedAt).toLocaleDateString('fr-FR') : formatDate(inter.date)}</span></div>
                <div class="card-item"><i class="bi bi-bandaid"></i><span>Pharmacie: <span class="status-badge badge-${(inter.pharmacyStatus || 'En attente').toLowerCase().replace(/\s/g, '-')}">${inter.pharmacyStatus || 'En attente'}</span></span></div>
            </div>
            <div class="card-footer">
                <div class="card-footer-actions">
                    <button class="btn-icon-footer view-btn" title="Voir les détails"><i class="bi bi-eye-fill"></i></button>
                    <button class="btn-icon-footer unarchive-btn" title="Désarchiver (Pompier)"><i class="bi bi-box-arrow-up"></i></button>
                    <button class="btn-icon-footer delete-btn" title="Supprimer Définitivement"><ion-icon name="trash-outline"></ion-icon></button>
                </div>
            </div>
        </div>`;
    }

    function createPharmacyCard(inter) { 
        const { id, numero_intervention, date, pharmacyStatus, nom } = inter;
        let statusText, statusClass;
        switch(pharmacyStatus) {
            case 'En cours de traitement': statusText = 'En Cours Pharma'; statusClass = 'badge-en-cours-de-traitement'; break;
            case 'Traité':  statusText = 'Traité'; statusClass = 'badge-traite'; break;
            case 'En attente': statusText = 'En Attente Traitement'; statusClass = 'badge-en-attente';  break;
            case 'À vérifier par pharmacie': statusText = 'Vérification Pharmacie'; statusClass = 'badge-a-traiter'; break; // Updated for new status
            default: statusText = 'À Traiter'; statusClass = 'badge-a-traiter';
        }

        return `
        <div class="intervention-card pharmacy-card" data-id="${id}">
            <div class="card-header">
                <h4><i class="bi bi-hash"></i>${numero_intervention}</h4>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
            <div class="card-body">
                <div class="card-item"><i class="bi bi-calendar-check"></i> <span>Intervention du ${formatDate(date)}</span></div>
                 <div class="card-item"><i class="bi bi-person"></i> <span>Par Pompier: ${nom || 'N/A'}</span></div>
                 ${inter.archivedAt ? `<div class="card-item"><i class="bi bi-archive"></i> <span>Archivée Pompier le: ${new Date(inter.archivedAt).toLocaleDateString('fr-FR')}</span></div>` : ''}
            </div>
            <div class="card-footer">
                ${(pharmacyStatus !== 'Traité') ? `<button class="btn-primary process-material-btn" data-id="${id}" title="Traiter le matériel de cette intervention"><i class="bi bi-arrow-repeat"></i> <span class="btn-text">Traiter Matériel</span></button>` : ''}
                <div class="card-footer-actions">
                    <button class="btn-icon-footer view-btn" title="Voir les détails"><i class="bi bi-eye-fill"></i></button>
                </div>
            </div>
        </div>`;
    }

     function createPharmacyArchiveCard(inter) { 
        const { id, numero_intervention, date, nom, pharmacyProcessedAt } = inter;
        return `
        <div class="intervention-card pharmacy-card archived-card" data-id="${id}">
            <div class="card-header">
                <h4><i class="bi bi-hash"></i>${numero_intervention}</h4>
                <span class="status-badge badge-traite">Traité et Archivé (Pharma)</span>
            </div>
            <div class="card-body">
                <div class="card-item"><i class="bi bi-calendar-check"></i> <span>Intervention du ${formatDate(date)}</span></div>
                <div class="card-item"><i class="bi bi-person"></i> <span>Par Pompier: ${nom || 'N/A'}</span></div>
                <div class="card-item"><i class="bi bi-clipboard-check"></i> <span>Traité Pharmacie le: ${pharmacyProcessedAt ? new Date(pharmacyProcessedAt).toLocaleDateString('fr-FR') : 'N/A'}</span></div>
            </div>
            <div class="card-footer">
                <div class="card-footer-actions">
                    <button class="btn-icon-footer view-btn" title="Voir les détails"><i class="bi bi-eye-fill"></i></button>
                    <button class="btn-icon-footer pharmacy-unarchive-btn" title="Désarchiver (Pharmacie uniquement)"><i class="bi bi-box-arrow-up"></i></button>
                    <button class="btn-icon-footer delete-pharmacy-archive-btn" title="Supprimer Définitivement (Admin)"><ion-icon name="trash-outline"></ion-icon></button>
                </div>
            </div>
        </div>`;
    }
    
    // --- GESTIONNAIRES D'ÉVÉNEMENTS ---
    function addCardEventListeners() {
        document.querySelectorAll('.view-btn').forEach(btn => btn.addEventListener('click', (e) => showDetailsModal(e.currentTarget.closest('[data-id]').dataset.id)));
        document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', (e) => editIntervention(e.currentTarget.closest('[data-id]').dataset.id)));
        document.querySelectorAll('.unarchive-btn').forEach(btn => btn.addEventListener('click', (e) => unarchiveIntervention(e.currentTarget.closest('[data-id]').dataset.id))); 
        document.querySelectorAll('.pharmacy-unarchive-btn').forEach(btn => btn.addEventListener('click', (e) => handlePharmacyUnarchive(e.currentTarget.closest('[data-id]').dataset.id))); 
        document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', (e) => deleteIntervention(e.currentTarget.closest('[data-id]').dataset.id)));
        document.querySelectorAll('.delete-pharmacy-archive-btn').forEach(btn => btn.addEventListener('click', (e) => deletePharmacyArchivedIntervention(e.currentTarget.closest('[data-id]').dataset.id)));
        document.querySelectorAll('.manage-material-btn').forEach(btn => btn.addEventListener('click', (e) => openMaterialManagementModal(e.currentTarget.dataset.id, 'firefighter')));
        document.querySelectorAll('.close-intervention-btn').forEach(btn => btn.addEventListener('click', (e) => closeInterventionDirectly(e.currentTarget.dataset.id)));
        document.querySelectorAll('.process-material-btn').forEach(btn => btn.addEventListener('click', (e) => openMaterialManagementModal(e.currentTarget.dataset.id, 'pharmacy')));
    
        // Event listeners for VSAV stock card editing (dynamically added buttons)
        unifiedStockCards.addEventListener('click', async (e) => {
            const editBtn = e.target.closest('.edit-vsav-stock-btn');
            const saveBtn = e.target.closest('.save-vsav-stock-btn');
            const cancelBtn = e.target.closest('.cancel-vsav-stock-edit-btn');

            if (editBtn) {
                await handleEditVSAVStock(editBtn);
            } else if (saveBtn) {
                await handleSaveVSAVStockChanges(saveBtn);
            } else if (cancelBtn) {
                handleCancelVSAVStockEdit(cancelBtn);
            }
        });
    }


    // --- FORMULAIRE ET MANIPULATION DES DONNÉES ---
    function handleFormSubmit(e) {
        e.preventDefault();
        loaderModal.classList.add('visible');
        const id = interventionIdInput.value;
        const numero = document.getElementById('numero').value;

        if (!numero || !document.getElementById('date').value || !document.getElementById('heure').value || !document.getElementById('nom').value) {
            showMessage('Les champs N° Intervention, Date, Heure et Responsable sont obligatoires.', 'error');
            loaderModal.classList.remove('visible');
            return;
        }

        const interventionData = {
            numero_intervention: numero,
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
            materiels: materiels.reduce((obj, mat) => ({ ...obj, [mat.name]: { quantity_used: mat.qty, reappro_status: '', comment: '', pharma_status: '', pharma_comment: '', quantity_missing: 0 } }), {}),
            archived: false, 
            pharmacyStatus: (materiels.length > 0) ? 'En attente' : 'Traité', 
        };

        if (interventionData.statut === "Terminé" && materiels.length === 0) {
            interventionData.archived = true; 
            interventionData.pharmacyStatus = 'Traité'; 
            interventionData.archivedAt = firebase.database.ServerValue.TIMESTAMP; 
            interventionData.pharmacyProcessedAt = firebase.database.ServerValue.TIMESTAMP; 
        }


        const dbRef = id ? database.ref('interventions/' + id) : database.ref('interventions').push();
        const timestamp = firebase.database.ServerValue.TIMESTAMP;
        if (id) { 
            interventionData.updatedAt = timestamp;
            const existingInter = allInterventions[id];
            if (existingInter) {
                interventionData.createdAt = existingInter.createdAt || timestamp;
                if(interventionData.archived && !existingInter.archivedAt) { 
                     interventionData.archivedAt = timestamp;
                } else if (existingInter.archivedAt) { 
                    interventionData.archivedAt = existingInter.archivedAt;
                }
                if(interventionData.pharmacyStatus === 'Traité' && !existingInter.pharmacyProcessedAt) {
                     interventionData.pharmacyProcessedAt = timestamp;
                } else if (existingInter.pharmacyProcessedAt) {
                    interventionData.pharmacyProcessedAt = existingInter.pharmacyProcessedAt;
                }
            }
        } else { 
            interventionData.createdAt = timestamp;
            interventionData.updatedAt = timestamp;
             if(interventionData.archived) interventionData.archivedAt = timestamp;
             if(interventionData.pharmacyStatus === 'Traité') interventionData.pharmacyProcessedAt = timestamp;
        }
        
        dbRef.set(interventionData).then(() => {
            const message = id ? 'Intervention modifiée !' : 'Intervention enregistrée !'
            showMessage(message, 'success');
            addLogEntry(id ? 'Intervention Modifiée' : 'Intervention Créée', `n°${numero} par ${currentUser}`);
            resetForm();
             const targetTab = mainNavUl.querySelector('.list[data-view="current-view"]'); 
             if (targetTab) {
                 setActiveTab(targetTab, mainNavUl);
             }
        }).catch(err => showMessage('Erreur: ' + err.message, 'error'))
          .finally(() => loaderModal.classList.remove('visible'));
    }

    function editIntervention(id) {
        const inter = allInterventions[id];
        if (!inter) return;
        if (inter.archived && !isPharmacyAuthenticated) { 
            showMessage("Les interventions archivées par les pompiers ne peuvent pas être modifiées par les pompiers. Désarchivez-la d'abord.", "warning");
            return;
        }
        if (isPharmacyAuthenticated) {
            showMessage("Le mode pharmacie ne permet pas l'édition directe des fiches d'intervention via ce formulaire.", "info");
            return;
        }

        resetForm(); 
        Object.keys(inter).forEach(key => {
            const inputElementId = key.replace('_intervention', ''); 
            const input = document.getElementById(inputElementId);
            if (input) {
                input.value = inter[key];
            }
        });
        interventionIdInput.value = id; 
        materiels = Object.entries(inter.materiels || {}).map(([name, details]) => ({ name: name, qty: details.quantity_used }));
        updateMaterielsTagDisplay();
        photosBase64 = inter.photos || [];
        updatePhotosDisplay();
        setActiveTab(mainNavUl.querySelector('.list[data-view="form-view"]'), mainNavUl);
    }

    async function unarchiveIntervention(id) { 
        const inter = allInterventions[id];
        if (!inter) return;

        let pharmacyWarning = "";
        if (inter.pharmacyStatus === 'Traité' || inter.pharmacyStatus === 'En cours de traitement') {
            pharmacyWarning = "\nAttention: La pharmacie a déjà traité ou est en train de traiter cette intervention. Désarchiver la remettra 'À traiter' pour la pharmacie et réinitialisera le matériel ainsi que les commandes associées.";
        }

        const confirmed = await showCustomDialog({
            title: "Désarchiver l'intervention (Pompier)",
            message: `Voulez-vous vraiment désarchiver l'intervention n°${inter.numero_intervention} ? Le statut pompier passera à "En cours". Le stock VSAV (si du matériel avait été "Réapprovisionné depuis VSAV") sera crédité à nouveau. Les commandes en cours pour cette intervention seront annulées.${pharmacyWarning}`
        });

        if (confirmed) {
            loaderModal.classList.add('visible');
            let logDetails = `Intervention n°${inter.numero_intervention} désarchivée par Pompier (${currentUser}). Statuts pompier et matériel réinitialisés.`;
            try {
                const updates = {
                    archived: false,
                    statut: 'En cours', 
                    archivedAt: null, 
                };
                let stockLogEntries = [];
                let materialResetLog = [];
                let stockUpdatePromises = [];


                if (inter.materiels) {
                    updates.materiels = JSON.parse(JSON.stringify(inter.materiels)); 
                    for (const matName in updates.materiels) {
                        const details = updates.materiels[matName];
                        const qtyUsed = details.quantity_used || 0;

                        if (details.reappro_status === 'Réapprovisionné' && qtyUsed > 0) {
                             const pompierStockRef = database.ref(`stocks/pompier/${matName}`);
                             stockUpdatePromises.push(
                                 pompierStockRef.once('value').then(snapshot => {
                                     if (snapshot.exists()) {
                                         return pompierStockRef.child('quantity').set(firebase.database.ServerValue.increment(qtyUsed));
                                     } else {
                                         return pompierStockRef.set({ quantity: qtyUsed, notes: 'Restitué lors désarchivage pompier' });
                                     }
                                 })
                             );
                            stockLogEntries.push(`+${qtyUsed} '${matName}' (VSAV)`);
                        }
                        
                        details.reappro_status = ""; 
                        details.comment = ""; 
                        details.pharma_status = ""; 
                        details.pharma_comment = ""; 
                        details.quantity_missing = 0; 
                        materialResetLog.push(matName);
                    }
                }
                
                if (updates.materiels && Object.keys(updates.materiels).length > 0) {
                    updates.pharmacyStatus = 'À traiter'; 
                    updates.pharmacyProcessedAt = null;
                } else {
                    updates.pharmacyStatus = 'Traité';
                     if (!inter.pharmacyProcessedAt) { 
                        updates.pharmacyProcessedAt = firebase.database.ServerValue.TIMESTAMP;
                    } else {
                         updates.pharmacyProcessedAt = inter.pharmacyProcessedAt; 
                    }
                }
                
                await Promise.all(stockUpdatePromises); 
                await database.ref(`interventions/${id}`).update(updates);
                
                if (stockLogEntries.length > 0) logDetails += ` Stock VSAV restitué: ${stockLogEntries.join(', ')}.`;
                if (materialResetLog.length > 0) logDetails += ` Matériel réinitialisé: ${materialResetLog.join(', ')}.`;

                const commandsToCancelPromises = [];
                let cancelledCmdMsgs = [];
                const currentCommandLog = await database.ref('commandes').once('value').then(snap => snap.val() || {});

                for (const cmdId in currentCommandLog) { 
                    const command = currentCommandLog[cmdId];
                    if (command.interventionId === id && !command.archived && command.status !== 'Annulée' && command.status !== 'Rangé et Archivé') {
                        const cmdUpdate = {
                            status: 'Annulée',
                            archived: true, 
                            cancelledAt: firebase.database.ServerValue.TIMESTAMP,
                            cancelledBy: `${currentUser} (Désarchivage Inter Pompier)`,
                            updatedAt: firebase.database.ServerValue.TIMESTAMP,
                            updatedBy: currentUser,
                            archivedAt: firebase.database.ServerValue.TIMESTAMP,
                            archivedBy: currentUser 
                        };
                        commandsToCancelPromises.push(database.ref(`commandes/${cmdId}`).update(cmdUpdate));
                        cancelledCmdMsgs.push(`Cmd ID ${cmdId} (${command.materialName})`);
                    }
                }
                await Promise.all(commandsToCancelPromises);
                if(cancelledCmdMsgs.length > 0) {
                    logDetails += ` Commandes associées annulées: ${cancelledCmdMsgs.join(', ')}.`;
                }
                
                addLogEntry('Désarchivage Pompier', logDetails);
                showMessage('Intervention désarchivée. Statuts, matériel et commandes associées réinitialisés/annulées. Stock VSAV (si applicable) restitué.', 'success');
                
            } catch (error) {
                console.error("Erreur désarchivage pompier:", error);
                showMessage(`Erreur lors du désarchivage pompier: ${error.message}`, 'error');
                addLogEntry('Erreur Désarchivage Pompier', `Inter n°${inter.numero_intervention}, Erreur: ${error.message}. ${logDetails}`);
            } finally {
                loaderModal.classList.remove('visible');
            }
        }
    }
    
    async function handlePharmacyUnarchive(id) {
        const inter = allInterventions[id];
        if (!inter) return;

        if (!inter.archived || inter.pharmacyStatus !== 'Traité') {
            showMessage("Cette intervention ne peut pas être désarchivée par la pharmacie dans son état actuel. Elle doit être archivée par le pompier et marquée comme 'Traité' par la pharmacie.", "warning");
            return;
        }

        const confirmed = await showCustomDialog({
            title: "Remettre l'Intervention 'À Traiter' (Pharmacie)",
            message: `Remettre l'intervention n°${inter.numero_intervention} au statut "À traiter" pour la pharmacie ?\nCela annulera le statut 'Traité' de la pharmacie, retirera l'intervention des archives pharmacie, inversera les mouvements de stock Pharmacie -> VSAV et annulera les commandes associées.\nLe statut d'archivage pompier reste inchangé.`
        });

        if (confirmed) {
            loaderModal.classList.add('visible');
            let logMessage = `Intervention n°${inter.numero_intervention} remise 'À traiter' par Pharmacie (${currentUser}).`;
            let allDBPromises = []; // Combined promises for all DB operations
            let stockReversalLogEntries = [];
            let materialResetLog = [];
            let cancelledCmdMsgs = [];

            try {
                // 1. Reverse stock movements
                if (inter.materiels) {
                    for (const matKey in inter.materiels) {
                        const materialDetail = inter.materiels[matKey];
                        if (materialDetail.pharma_status === 'Réapprovisionné') { 
                            const qtyReversed = (materialDetail.reappro_status === 'Manquant' && materialDetail.quantity_missing > 0)
                                                ? materialDetail.quantity_missing
                                                : (materialDetail.quantity_used || 0);

                            if (qtyReversed > 0) {
                                const pharmaStockRef = database.ref(`stocks/pharmacie/${matKey}`);
                                allDBPromises.push(
                                    pharmaStockRef.once('value').then(snapshot => {
                                        if (snapshot.exists()) {
                                            return pharmaStockRef.child('quantity').set(firebase.database.ServerValue.increment(qtyReversed));
                                        } else { 
                                            return pharmaStockRef.set({ quantity: qtyReversed, notes: 'Restitué lors réouverture traitement pharma' });
                                        }
                                    })
                                );

                                const pompierStockRef = database.ref(`stocks/pompier/${matKey}/quantity`);
                                allDBPromises.push(
                                    pompierStockRef.once('value').then(snapshot => {
                                        if (snapshot.exists() && snapshot.val() >= qtyReversed) {
                                            return pompierStockRef.set(firebase.database.ServerValue.increment(-qtyReversed));
                                        } else if (snapshot.exists()) {
                                            stockReversalLogEntries.push(`Alerte: Stock VSAV pour '${matKey}' (${snapshot.val()}) insuffisant pour retrait de ${qtyReversed}. Mis à 0.`);
                                            return pompierStockRef.set(0);
                                        } else {
                                            stockReversalLogEntries.push(`Alerte: Stock VSAV pour '${matKey}' non trouvé pour retrait de ${qtyReversed}.`);
                                            // Avoid creating negative stock if it doesn't exist, log it.
                                            // If it must be set to negative, this line would do it:
                                            // return pompierStockRef.set(firebase.database.ServerValue.increment(-qtyReversed));
                                            return Promise.resolve(); // Or handle as error if critical
                                        }
                                    })
                                );
                                stockReversalLogEntries.push(`Stock inversé pour '${matKey}': +${qtyReversed} Pharmacie, -${qtyReversed} VSAV (ou ajusté si stock VSAV bas/inexistant)`);
                            }
                        }
                    }
                }

                // 2. Cancel associated commands
                const currentCommandLogData = await database.ref('commandes').once('value').then(snap => snap.val() || {});
                for (const cmdId in currentCommandLogData) {
                    const command = currentCommandLogData[cmdId];
                    if (command.interventionId === id && !command.archived && command.status !== 'Annulée' && command.status !== 'Rangé et Archivé') {
                        const cmdUpdate = {
                            status: 'Annulée',
                            archived: true,
                            cancelledAt: firebase.database.ServerValue.TIMESTAMP,
                            cancelledBy: `${currentUser} (Réouverture Traitement Pharma Inter n°${inter.numero_intervention})`,
                            archivedAt: firebase.database.ServerValue.TIMESTAMP, 
                            archivedBy: currentUser,
                            updatedAt: firebase.database.ServerValue.TIMESTAMP,
                            updatedBy: currentUser
                        };
                        allDBPromises.push(database.ref(`commandes/${cmdId}`).update(cmdUpdate));
                        cancelledCmdMsgs.push(`Cmd ID ${cmdId} (${command.materialName})`);
                    }
                }
                
                // 3. Prepare intervention node updates
                const interventionNodeUpdates = {
                    pharmacyStatus: 'À traiter',
                    pharmacyProcessedAt: null,
                    materiels: JSON.parse(JSON.stringify(inter.materiels || {})) 
                };

                if (interventionNodeUpdates.materiels) {
                    for (const matKey in interventionNodeUpdates.materiels) {
                        interventionNodeUpdates.materiels[matKey].pharma_status = "";
                        interventionNodeUpdates.materiels[matKey].pharma_comment = "";
                        materialResetLog.push(matKey);
                    }
                }
                allDBPromises.push(database.ref(`interventions/${id}`).update(interventionNodeUpdates));
                
                await Promise.all(allDBPromises); 

                if (materialResetLog.length > 0) logMessage += ` Statuts matériel pharmacie réinitialisés pour: ${materialResetLog.join(', ')}.`;
                if (stockReversalLogEntries.length > 0) logMessage += ` ${stockReversalLogEntries.join('. ')}.`;
                if (cancelledCmdMsgs.length > 0) logMessage += ` Commandes associées annulées: ${cancelledCmdMsgs.join(', ')}.`;
                
                addLogEntry('Réouverture Traitement Pharmacie (Stock & Cmds)', logMessage);
                showMessage("Intervention remise 'À traiter'. Mouvements de stock inversés et commandes associées annulées.", 'success');

            } catch (error) {
                console.error("Erreur réouverture traitement pharmacie:", error);
                showMessage(`Erreur lors de la réouverture du traitement: ${error.message}`, 'error');
                addLogEntry('Erreur Réouverture Traitement Pharmacie', `Inter n°${inter.numero_intervention}, Erreur: ${error.message}. Détails: ${logMessage}`);
            } finally {
                loaderModal.classList.remove('visible');
            }
        }
    }


    async function deleteIntervention(id) { 
        const inter = allInterventions[id];
        if (!inter) return;
        const password = await showCustomDialog({
            title: 'Suppression Définitive (Pompier Archive)',
            message: `Entrez le mot de passe administrateur pour supprimer définitivement l'intervention n°${inter.numero_intervention}. Cette action est irréversible et n'impacte pas les stocks (faites-le manuellement si besoin).`,
            type: 'prompt', inputType: 'password'
        });
        if (password === DELETE_PASSWORD) {
            const interNum = inter.numero_intervention || id;
            await database.ref('interventions/' + id).remove();
            addLogEntry('Suppression Définitive Interv. (Archive Pompier)', `Intervention n°${interNum} par ${currentUser} (Admin)`);
            showMessage('Intervention supprimée définitivement des archives pompier.', 'success');
        } else if (password !== null) {
            showMessage('Mot de passe administrateur incorrect.', 'error');
        }
    }

    async function deletePharmacyArchivedIntervention(id) {
        const inter = allInterventions[id];
        if (!inter) return;

        const password = await showCustomDialog({
            title: 'Suppression Définitive (Archive Pharmacie)',
            message: `Entrez le mot de passe administrateur pour supprimer définitivement l'intervention n°${inter.numero_intervention} du système. Cette action est irréversible.`,
            type: 'prompt', inputType: 'password'
        });

        if (password === DELETE_PASSWORD) {
            const interNum = inter.numero_intervention || id;
            try {
                await database.ref('interventions/' + id).remove();
                addLogEntry('Suppression Définitive Interv. (Archive Pharmacie)', `Intervention n°${interNum} supprimée par ${currentUser} (Admin) depuis archive pharmacie.`);
                showMessage(`Intervention n°${interNum} supprimée définitivement du système.`, 'success');
            } catch (error) {
                showMessage(`Erreur lors de la suppression de l'intervention: ${error.message}`, 'error');
                addLogEntry('Erreur Suppression Interv. (Archive Pharmacie)', `Inter n°${interNum}, Erreur: ${error.message}`);
            }
        } else if (password !== null) {
            showMessage('Mot de passe administrateur incorrect. Suppression annulée.', 'error');
        }
    }
    
    async function closeInterventionDirectly(id) { 
        const inter = allInterventions[id];
        if (!inter) return;
        const confirmed = await showCustomDialog({
            title: "Clôturer l'intervention (sans matériel)",
            message: `Aucun matériel n'est associé à cette intervention ou le matériel a déjà été géré. Clôturer et archiver l'intervention n°${inter.numero_intervention} ?`
        });
        if (confirmed) {
            const updates = {
                archived: true, 
                statut: 'Terminé', 
                pharmacyStatus: 'Traité', 
                archivedAt: firebase.database.ServerValue.TIMESTAMP, 
                pharmacyProcessedAt: firebase.database.ServerValue.TIMESTAMP 
            };
            await database.ref(`interventions/${id}`).update(updates);
            addLogEntry('Intervention Clôturée (Sans Matériel)', `n°${inter.numero_intervention} archivée directement par ${currentUser}.`);
            showMessage('Intervention clôturée et archivée (aucun matériel à traiter).', 'success');
        }
    }

    // --- LOGIQUE DES MODALS ---
    function showDetailsModal(id) {
        const inter = allInterventions[id]; if (!inter) return;
        const isArchivedByPompier = inter.archived;
        const pompierStatusText = isArchivedByPompier ? 'Archivé Pompier' : (inter.statut || 'En cours');
        const pompierStatusClass = isArchivedByPompier ? 'badge-termine' : `badge-${(inter.statut || 'en-cours').toLowerCase().replace(/\s/g, '-')}`;

        let pharmaStatusText, pharmaStatusClass;
        switch(inter.pharmacyStatus) {
            case 'Traité': pharmaStatusText = 'Traité Pharmacie'; pharmaStatusClass = 'badge-traite'; break;
            case 'En cours de traitement': pharmaStatusText = 'En Cours (Pharma)'; pharmaStatusClass = 'badge-en-cours-de-traitement'; break;
            case 'En attente': pharmaStatusText = 'En Attente (Pharma)'; pharmaStatusClass = 'badge-en-attente'; break;
            case 'À vérifier par pharmacie': pharmaStatusText = 'Vérification Pharmacie Requise'; pharmaStatusClass = 'badge-warning-light'; break; // Custom class needed for warning
            default: pharmaStatusText = 'À Traiter (Pharma)'; pharmaStatusClass = 'badge-a-traiter';
        }

        detailsModal.innerHTML = `
        <div class="modal-content large">
            <div id="modalHeader" class="modal-header">
                <h3><i class="bi bi-file-earmark-text-fill"></i>Détails - Inter. n°${inter.numero_intervention}</h3>
                <span class="close-button modal-close-btn">&times;</span>
            </div>
            <div id="modalBody" class="modal-body">
                <div class="detail-section"><h4><i class="bi bi-info-circle-fill"></i> Infos Générales</h4>
                    <p class="detail-item"><i class="bi bi-person-fill"></i><strong>Responsable:</strong> <span>${inter.nom || 'N/A'}</span></p>
                    <p class="detail-item"><i class="bi bi-calendar-event"></i><strong>Date/Heure:</strong> <span>${formatDate(inter.date)} à ${inter.heure}</span></p>
                    <p class="detail-item"><i class="bi bi-geo-alt-fill"></i><strong>Lieu:</strong> <span>${inter.lieu || 'N/A'} (${inter.commune || 'N/A'})</span></p>
                    <p class="detail-item"><i class="bi bi-tags"></i><strong>Catégorie:</strong> <span>${inter.categorie || 'N/A'}</span></p>
                    <p class="detail-item"><i class="bi bi-exclamation-triangle"></i><strong>Urgence:</strong> <span>${inter.urgence || 'N/A'}</span></p>
                </div>
                <div class="detail-section"><h4><i class="bi bi-clipboard-check-fill"></i> Statut & Suivi</h4>
                     <p class="detail-item"><i class="bi bi-activity"></i><strong>Statut Pompier:</strong> <span><span class="status-badge ${pompierStatusClass}">${pompierStatusText}</span></span></p>
                     ${inter.archivedAt ? `<p class="detail-item"><i class="bi bi-archive-fill"></i><strong>Archivée Pompier le:</strong> <span>${new Date(inter.archivedAt).toLocaleString('fr-FR')}</span></p>` : ''}
                     <p class="detail-item"><i class="bi bi-bandaid"></i><strong>Statut Pharmacie:</strong> <span><span class="status-badge ${pharmaStatusClass}">${pharmaStatusText}</span></span></p>
                     ${inter.pharmacyProcessedAt ? `<p class="detail-item"><i class="bi bi-check-circle-fill"></i><strong>Traité Pharmacie le:</strong> <span>${new Date(inter.pharmacyProcessedAt).toLocaleString('fr-FR')}</span></p>` : ''}
                </div>
                 <div class="detail-section full-width"><h4><i class="bi bi-card-text"></i> Commentaire Intervention (Pompier)</h4>
                    <p>${inter.commentaire || 'Aucun commentaire.'}</p>
                </div>
                <div class="detail-section full-width"><h4><i class="bi bi-tools"></i> Matériels Utilisés et Suivi Réapprovisionnement</h4> 
                        <div>${Object.entries(inter.materiels || {}).map(([name, d]) => {
                            let reapproStatusDisplay = d.reappro_status || 'Non défini';
                            if (d.reappro_status === 'Manquant') {
                                reapproStatusDisplay += ` (Qté Manquante VSAV: ${d.quantity_missing || d.quantity_used || 'N/A'})`;
                            }
                            let pharmaStatusDisplay = d.pharma_status || 'Non traité par pharmacie';
                            if (d.pharma_status === 'En commande') {
                                pharmaStatusDisplay += ` (Commande pour ${d.quantity_missing > 0 ? d.quantity_missing : d.quantity_used})`;
                            } else if (d.pharma_status === 'Réapprovisionné') {
                                pharmaStatusDisplay += ` (Stock Pharmacie -> VSAV)`;
                            } else if (d.pharma_status === 'À vérifier par pharmacie') {
                                pharmaStatusDisplay = 'À vérifier par pharmacie pour commande/réappro.';
                            }


                            return `
                            <div class="detail-material-item">
                                <strong>${name} (Qté Utilisée: ${d.quantity_used || 'N/A'})</strong><br>
                                <small><u>Pompier (Réappro VSAV):</u> ${reapproStatusDisplay}</small><br>
                                <small><em>Commentaire Pompier: ${d.comment || 'Aucun'}</em></small><br>
                                <small><u>Pharmacie (Traitement):</u> ${pharmaStatusDisplay}</small><br>
                                <small><em>Commentaire Pharmacie: ${d.pharma_comment || 'Aucun'}</em></small>
                            </div>`;
                        }).join('') || '<p>Aucun matériel utilisé.</p>'}
                        </div>
                </div>
                <div class="detail-section full-width">
                     <h4><i class="bi bi-images"></i> Photos</h4>
                     <div class="photo-grid">${(inter.photos || []).map(p => `<img src="${p}" class="photo-thumb" data-full-src="${p}">`).join('') || '<p>Aucune photo</p>'}</div>
                </div>
            </div>
        </div>`;
        detailsModal.classList.add('visible');
        detailsModal.querySelector('.close-button').onclick = () => detailsModal.classList.remove('visible');
        detailsModal.querySelectorAll('.photo-thumb').forEach(thumb => {
            thumb.addEventListener('click', (e) => showFullImage(e.target.dataset.fullSrc));
        });
    }

    function openMaterialManagementModal(interId, userType) {
        const inter = allInterventions[interId];
        if (!inter) return;
        const hasMaterials = inter.materiels && Object.keys(inter.materiels).length > 0;

        if (!hasMaterials) {
            if (userType === 'firefighter') {
                closeInterventionDirectly(interId); 
            } else { 
                if (inter.pharmacyStatus && inter.pharmacyStatus !== 'Traité') {
                    database.ref(`interventions/${interId}`).update({ 
                        pharmacyStatus: 'Traité',
                        pharmacyProcessedAt: firebase.database.ServerValue.TIMESTAMP
                    });
                    addLogEntry('Traitement Pharmacie (Auto)', `Inter n°${inter.numero_intervention} marquée traitée (aucun matériel) par ${currentUser}.`);
                    showMessage("Intervention marquée comme traitée par la pharmacie (aucun matériel).", 'success');
                } else {
                    showMessage("Aucun matériel à traiter pour cette intervention.", "info");
                }
            }
            return; 
        }

        const listContainer = document.getElementById('material-management-list');
        document.getElementById('material-modal-inter-num').textContent = `n°${inter.numero_intervention}`;
        
        const saveBtnTextSpan = document.getElementById('save-material-btn').querySelector('.btn-text');
        if(saveBtnTextSpan) {
            saveBtnTextSpan.textContent = userType === 'firefighter' ? "Enregistrer et Clôturer" : "Enregistrer Traitement";
        }
        
        const headerHtml = userType === 'firefighter' 
            ? `<div class="material-management-item header firefighter-view"><strong>Matériel</strong><strong>Qté Utilisée</strong><strong>Statut Réappro. VSAV</strong><strong>Commentaire Pompier</strong></div>`
            : `<div class="material-management-item header pharmacy-view"><strong>Matériel & Contexte Pompier</strong><strong>Statut Traitement Pharmacie</strong><strong>Commentaire Pharmacie</strong></div>`;
        
        const itemsHtml = Object.entries(inter.materiels).map(([matName, details]) => {
            const qtyUsedOriginal = details.quantity_used || 1;
            if (userType === 'firefighter') {
                return `
                <div class="material-management-item firefighter-view" data-mat-name="${matName}">
                    <span>${matName}</span>
                    <input type="number" class="mat-qty-used" value="${qtyUsedOriginal}" min="0" readonly title="Quantité utilisée initialement (non modifiable ici)">
                    <div>
                        <select class="mat-reappro-status">
                            <option value="">Choisir statut...</option>
                            <option value="Réapprovisionné" ${details.reappro_status === 'Réapprovisionné' ? 'selected' : ''}>Réapprovisionné (depuis VSAV)</option>
                            <option value="Manquant" ${details.reappro_status === 'Manquant' ? 'selected' : ''}>Manquant (vérif. pharmacie)</option>
                            <option value="Pas besoin" ${details.reappro_status === 'Pas besoin' ? 'selected' : ''}>Pas besoin de réappro.</option>
                        </select>
                        <div class="quantity-input-group missing-qty-input ${details.reappro_status === 'Manquant' ? 'visible' : ''}" style="margin-top: 0.5rem;">
                            <label style="font-size:0.8em; margin-right:5px;">Qté manquante:</label>
                            <button type="button" class="qty-adjust-btn" data-target-class="missing-qty-value" data-action="decrement">-</button>
                            <input type="number" class="missing-qty-value" placeholder="Qté manquante" value="${details.quantity_missing || qtyUsedOriginal}" min="1" step="1">
                            <button type="button" class="qty-adjust-btn" data-target-class="missing-qty-value" data-action="increment">+</button>
                        </div>
                    </div>
                    <input type="text" class="mat-comment" value="${details.comment || ''}" placeholder="Commentaire pompier (optionnel)...">
                </div>`;
            } else { 
                 const pompierReapproStatus = details.reappro_status || "Non défini par pompier";
                 const pompierMissingQty = details.quantity_missing || 0;
                 let materialContext = `Utilisé: ${qtyUsedOriginal}. Demande Pompier (VSAV): ${pompierReapproStatus}`;
                 if (pompierReapproStatus === 'Manquant' && pompierMissingQty > 0) {
                     materialContext += ` (Qté demandée: ${pompierMissingQty})`;
                 } else if (pompierReapproStatus === 'Manquant' && pompierMissingQty === 0) {
                     materialContext += ` (Qté demandée: ${qtyUsedOriginal})`; 
                 }
                 if (details.pharma_status === 'À vérifier par pharmacie') {
                    materialContext += `. Statut actuel pharmacie: À vérifier.`;
                 }


                return `
                <div class="material-management-item pharmacy-view" data-mat-name="${matName}">
                    <span>${matName} <small style="display:block; color: var(--text-secondary-color);"><i>${materialContext}</i></small></span>
                    <select class="mat-pharma-status">
                         <option value="">Choisir statut traitement...</option>
                         <option value="En commande" ${details.pharma_status === 'En commande' ? 'selected' : ''}>En commande (via Pharmacie)</option>
                         <option value="Réapprovisionné" ${details.pharma_status === 'Réapprovisionné' ? 'selected' : ''}>Réapprovisionné (depuis stock Pharmacie vers VSAV)</option>
                         <option value="Pas besoin" ${details.pharma_status === 'Pas besoin' ? 'selected' : ''}>Pas besoin de traitement/commande pharmacie</option>
                    </select>
                    <input type="text" class="mat-pharma-comment" value="${details.pharma_comment || ''}" placeholder="Commentaire pharmacie (optionnel)...">
                </div>`;
            }
        }).join('');

        listContainer.innerHTML = headerHtml + itemsHtml;
        document.getElementById('save-material-btn').onclick = () => saveMaterialData(interId, userType);
        
        listContainer.querySelectorAll('.mat-reappro-status').forEach(select => {
            select.addEventListener('change', e => {
                const itemRow = e.target.closest('.material-management-item');
                const missingQtyGroup = itemRow.querySelector('.missing-qty-input'); 
                const missingQtyInput = missingQtyGroup.querySelector('.missing-qty-value');
                missingQtyGroup.classList.toggle('visible', e.target.value === 'Manquant');
                if (e.target.value === 'Manquant') { 
                    if(!missingQtyInput.value || parseInt(missingQtyInput.value,10) === 0 ) { 
                        const qtyUsed = parseInt(itemRow.querySelector('.mat-qty-used').value, 10) || 1;
                        missingQtyInput.value = qtyUsed; 
                    }
                } else { 
                    missingQtyInput.value = ''; 
                }
            });
        });
        materialManagementModal.classList.add('visible');
    }

    async function saveMaterialData(interId, userType) {
        const updates = {};
        const interRef = database.ref(`interventions/${interId}`);
        const intervention = allInterventions[interId]; 
        let allFirefighterInputsValid = true; 
        let isPharmacyProcessingAnyItem = false; 
        let pharmacyActionsLog = [];
        let pompierActionsLog = [];
        let dbOperationPromises = []; // Renamed from stockUpdatePromises


        document.querySelectorAll('#material-management-list .material-management-item:not(.header)').forEach(item => {
            const matName = item.dataset.matName;
            const interventionMaterialDetails = intervention.materiels[matName]; 
            
            if (userType === 'firefighter') {
                const reappro_status = item.querySelector('.mat-reappro-status').value;
                const comment = item.querySelector('.mat-comment').value;
                let quantity_missing = 0; 

                if (reappro_status === 'Manquant') {
                    const missingInput = item.querySelector('.missing-qty-value'); 
                    quantity_missing = parseInt(missingInput.value, 10);
                    if (isNaN(quantity_missing) || quantity_missing <= 0) {
                        allFirefighterInputsValid = false; 
                        missingInput.style.borderColor = 'red'; 
                    } else {
                        missingInput.style.borderColor = ''; 
                    }
                    // MODIFICATION: Set pharma_status for pharmacy review, DO NOT create command
                    updates[`materiels/${matName}/pharma_status`] = 'À vérifier par pharmacie'; 
                    pompierActionsLog.push(`${quantity_missing} x '${matName}' signalé manquant (vérification pharmacie requise) pour inter n°${intervention.numero_intervention}`);
                } else {
                     updates[`materiels/${matName}/pharma_status`] = interventionMaterialDetails.pharma_status || ''; // Preserve if already set, or clear
                }


                updates[`materiels/${matName}/reappro_status`] = reappro_status;
                updates[`materiels/${matName}/quantity_missing`] = quantity_missing; 
                updates[`materiels/${matName}/comment`] = comment;

                if (!reappro_status && Object.keys(intervention.materiels || {}).length > 0) { 
                    allFirefighterInputsValid = false; 
                    item.querySelector('.mat-reappro-status').style.borderColor = 'red';
                } else if (reappro_status) {
                     item.querySelector('.mat-reappro-status').style.borderColor = '';
                }


                const qtyUsedOriginal = interventionMaterialDetails?.quantity_used || 0;

                if (reappro_status === 'Réapprovisionné') { 
                    if (pompierStock[matName] && qtyUsedOriginal > 0) {
                        const pompierStockRef = database.ref(`stocks/pompier/${matName}/quantity`);
                        dbOperationPromises.push(pompierStockRef.set(firebase.database.ServerValue.increment(-qtyUsedOriginal)));
                        pompierActionsLog.push(`-${qtyUsedOriginal} '${matName}' (Stock VSAV) pour réappro inter n°${intervention.numero_intervention}`);
                    } else if (qtyUsedOriginal > 0) {
                         pompierActionsLog.push(`Alerte: '${matName}' marqué réapprovisionné VSAV mais stock VSAV inexistant ou à 0. Quantité utilisée: ${qtyUsedOriginal}.`);
                    }
                }
                 // Removed automatic command creation for "Manquant" by firefighter
            } else { // userType === 'pharmacy'
                 const pharma_status = item.querySelector('.mat-pharma-status').value;
                 const pharma_comment = item.querySelector('.mat-pharma-comment').value;
                 updates[`materiels/${matName}/pharma_status`] = pharma_status;
                 updates[`materiels/${matName}/pharma_comment`] = pharma_comment;

                 if (pharma_status) { 
                    isPharmacyProcessingAnyItem = true; 
                 }
                 
                 const qtyToHandlePharmacie = (interventionMaterialDetails.reappro_status === 'Manquant' && interventionMaterialDetails.quantity_missing > 0)
                                          ? interventionMaterialDetails.quantity_missing 
                                          : (interventionMaterialDetails.quantity_used || 0); 

                 if (pharma_status === 'En commande' && qtyToHandlePharmacie > 0) {
                    const newCommandRef = database.ref('commandes').push();
                    dbOperationPromises.push(newCommandRef.set({ 
                        interventionId: interId,
                        interventionNum: intervention.numero_intervention,
                        materialName: matName,
                        quantityMissing: qtyToHandlePharmacie, 
                        status: 'En commande', 
                        createdAt: firebase.database.ServerValue.TIMESTAMP,
                        orderedBy: currentUser, 
                        archived: false
                    }));
                    pharmacyActionsLog.push(`Commande créée/confirmée: ${qtyToHandlePharmacie} x '${matName}' (Inter n°${intervention.numero_intervention})`);
                 } else if (pharma_status === 'Réapprovisionné' && qtyToHandlePharmacie > 0) {
                    
                    const pharmaStockRef = database.ref(`stocks/pharmacie/${matName}`);
                    dbOperationPromises.push(
                        pharmaStockRef.once('value').then(snapshot => {
                            if (snapshot.exists() && snapshot.child('quantity').val() >= qtyToHandlePharmacie) {
                                return pharmaStockRef.child('quantity').set(firebase.database.ServerValue.increment(-qtyToHandlePharmacie));
                            } else {
                                pharmacyActionsLog.push(`Alerte: Stock Pharmacie pour '${matName}' insuffisant ou inexistant pour réappro. Qté: ${qtyToHandlePharmacie}`);
                                throw new Error(`Stock Pharmacie insuffisant pour ${matName}`);
                            }
                        })
                    );
                    pharmacyActionsLog.push(`-${qtyToHandlePharmacie} '${matName}' (Stock Pharmacie) pour réappro VSAV`);
                    
                    const pompierStockRef = database.ref(`stocks/pompier/${matName}`);
                    dbOperationPromises.push(
                        pompierStockRef.once('value').then(snapshot => {
                            if (snapshot.exists()) {
                                return pompierStockRef.child('quantity').set(firebase.database.ServerValue.increment(qtyToHandlePharmacie));
                            } else { 
                                return pompierStockRef.set({ quantity: qtyToHandlePharmacie, notes: 'Ajout via réappro pharmacie (Inter)' });
                            }
                        })
                    );
                    pharmacyActionsLog.push(`+${qtyToHandlePharmacie} '${matName}' (Stock VSAV) via réappro pharmacie`);
                 }
            }
        });

        try {
            await Promise.all(dbOperationPromises); 

            if (userType === 'firefighter') {
                if (!allFirefighterInputsValid) return showMessage("Veuillez définir un statut de réapprovisionnement pour tous les matériels. Si 'Manquant', une quantité valide est requise.", 'error');
                
                updates['statut'] = 'Terminé'; 
                updates['archived'] = true;   
                updates['archivedAt'] = firebase.database.ServerValue.TIMESTAMP;
                
                let needsPharmacyAction = false;
                if (intervention.materiels && Object.keys(intervention.materiels).length > 0) {
                    for (const matName of Object.keys(intervention.materiels)) {
                        const matDetails = updates[`materiels/${matName}/pharma_status`] ? { pharma_status: updates[`materiels/${matName}/pharma_status`] } : intervention.materiels[matName];
                         // Check if this material, after firefighter processing, requires pharmacy attention
                        if (updates[`materiels/${matName}/reappro_status`] === 'Manquant') { // Firefighter explicitly marked as missing
                            needsPharmacyAction = true;
                            updates[`materiels/${matName}/pharma_status`] = 'À vérifier par pharmacie'; // Ensure this is set
                            break; 
                        }
                        // If not "Manquant", but other conditions might imply pharmacy check (e.g. default state if reappro_status is empty)
                        // However, the logic now is: if "Manquant", flag for pharma. Otherwise, assume handled or no action by pharma based on initial state.
                    }
                }


                if (needsPharmacyAction) {
                    updates['pharmacyStatus'] = 'À traiter';
                    updates['pharmacyProcessedAt'] = null;
                } else {
                    // If no material is explicitly marked "Manquant" by firefighter,
                    // and thus pharma_status isn't set to 'À vérifier par pharmacie',
                    // we assume pharmacy doesn't need to act further based on firefighter's input.
                    // It could be already 'Traité' or remains 'En attente' if it was so.
                    // This part might need refinement if default state for pharmacy should be 'Traité' if no items are 'Manquant'.
                    // For now, keep existing pharmacyStatus unless explicitly needs action.
                    if (!intervention.pharmacyStatus || intervention.pharmacyStatus === 'En attente' && !needsPharmacyAction) {
                         // If materials exist but none require pharmacy action from this firefighter update
                         // And initial pharmacy status was 'En attente', it could be considered 'Traité' IF no items are 'Manquant'
                         let allNotManquant = true;
                         if (intervention.materiels && Object.keys(intervention.materiels).length > 0) {
                             for (const matName of Object.keys(intervention.materiels)) {
                                 if (updates[`materiels/${matName}/reappro_status`] === 'Manquant') {
                                     allNotManquant = false;
                                     break;
                                 }
                             }
                             if (allNotManquant && Object.keys(intervention.materiels).length > 0) {
                                 updates['pharmacyStatus'] = 'Traité';
                                 if (!intervention.pharmacyProcessedAt) {
                                     updates['pharmacyProcessedAt'] = firebase.database.ServerValue.TIMESTAMP;
                                 }
                             } else if (!needsPharmacyAction) { // If not needing action but also not all "not manquant"
                                updates['pharmacyStatus'] = intervention.pharmacyStatus || 'En attente'; // Keep existing or default
                             }

                         } else { // No materials, so pharmacy is 'Traité'
                            updates['pharmacyStatus'] = 'Traité';
                            if (!intervention.pharmacyProcessedAt) {
                                updates['pharmacyProcessedAt'] = firebase.database.ServerValue.TIMESTAMP;
                            }
                         }
                    } else if (needsPharmacyAction) {
                        updates['pharmacyStatus'] = 'À traiter';
                        updates['pharmacyProcessedAt'] = null;
                    }
                    // If it was already 'Traité' by pharmacy, don't change it unless firefighter input forces re-evaluation.
                     if(intervention.pharmacyStatus === 'Traité' && !needsPharmacyAction){
                        updates['pharmacyStatus'] = 'Traité';
                        updates['pharmacyProcessedAt'] = intervention.pharmacyProcessedAt || firebase.database.ServerValue.TIMESTAMP;
                    }


                }
                addLogEntry('Intervention Clôturée (Pompier)', `n°${intervention.numero_intervention} archivée, matériel géré par ${currentUser}. ${pompierActionsLog.join('. ')}`);
            } else { // userType === 'pharmacy'
                let allItemsHavePharmaStatusSelected = true;
                if (Object.keys(intervention.materiels || {}).length > 0) {
                     document.querySelectorAll('#material-management-list .material-management-item:not(.header)').forEach(item => {
                        const pharma_status_select = item.querySelector('.mat-pharma-status');
                        if (!pharma_status_select.value) {
                            allItemsHavePharmaStatusSelected = false;
                            pharma_status_select.style.borderColor = 'red';
                        } else {
                            pharma_status_select.style.borderColor = '';
                        }
                     });
                }

                if (!allItemsHavePharmaStatusSelected) {
                     return showMessage("Veuillez définir un statut de traitement pour tous les matériels listés.", 'error');
                }

                updates['pharmacyStatus'] = 'Traité';
                updates['pharmacyProcessedAt'] = firebase.database.ServerValue.TIMESTAMP;
                addLogEntry('Traitement Matériel Pharmacie', `Intervention n°${intervention.numero_intervention} traitée par ${currentUser}. Actions: ${pharmacyActionsLog.join('. ')}`);
            }
            
            await interRef.update(updates); 
            showMessage("Données du matériel enregistrées avec succès.", 'success');
            materialManagementModal.classList.remove('visible');

        } catch (error) {
            showMessage(`Erreur lors de l'enregistrement des données matériel: ${error.message}`, 'error');
            addLogEntry('Erreur Enregistrement Matériel', `Inter n°${intervention.numero_intervention}, Erreur: ${error.message}. Pharmacie Actions: ${pharmacyActionsLog.join('. ')}, Pompier Actions: ${pompierActionsLog.join('. ')}`);
        }
    }
    
    // --- GESTION DES STOCKS UNIFIÉE ---
    function displayUnifiedStockView() {
        const addStockBtnContainerDesktop = document.getElementById('unifiedStockModalActions');
        if (addStockBtnContainerDesktop) {
            addStockBtnContainerDesktop.style.display = isPharmacyAuthenticated ? 'flex' : 'none';
        }
        fabAddStockItem.style.display = (isPharmacyAuthenticated && window.innerWidth <= 768) ? 'flex' : 'none';
        setupStockCardCreation(currentStockSubView, unifiedStockCards);
    }

    function setupStockCardCreation(viewType, cardsContainer) {
        const stockData = viewType === 'pompier' ? pompierStock : pharmaStock;
        const searchTerm = (pharmacySearchInput.value || '').toLowerCase(); 
        cardsContainer.innerHTML = '';
        const filteredStock = Object.entries(stockData)
            .filter(([name]) => name.toLowerCase().includes(searchTerm))
            .sort(([a], [b]) => a.toLowerCase().localeCompare(b.toLowerCase()));

        if (filteredStock.length === 0) {
            cardsContainer.innerHTML = `<p class="empty-view-message">Le stock ${viewType === 'pompier' ? 'VSAV' : 'Pharmacie'} est vide ${searchTerm ? 'pour cette recherche' : ''}.</p>`;
        }

        filteredStock.forEach(([name, details]) => {
            const isVSAVStockViewByPharmacie = isPharmacyAuthenticated && viewType === 'pompier';
            const canEditPharmacieStock = isPharmacyAuthenticated && viewType === 'pharmacie';
            
            let footerHtml = '';
            if (isPharmacyAuthenticated) {
                if (viewType === 'pharmacie') { // Pharma stock view, by Pharmacie
                    footerHtml = `
                        <div class="stock-card-footer">
                            <button class="btn-icon-card transfer-stock-btn" data-name="${name}" title="Transférer vers Stock VSAV">
                                <ion-icon name="swap-horizontal-outline"></ion-icon>
                            </button>
                            <button class="btn-icon-card save-stock-btn" title="Sauvegarder les modifications">
                                <ion-icon name="checkmark-circle-outline"></ion-icon>
                            </button>
                            <button class="btn-icon-card delete-stock-btn" title="Supprimer l'article des deux stocks">
                                <ion-icon name="trash-outline"></ion-icon>
                            </button>
                        </div>`;
                } else { // VSAV stock view, by Pharmacie
                    footerHtml = `
                        <div class="stock-card-footer">
                            <button class="btn-icon-card edit-vsav-stock-btn" data-name="${name}" title="Modifier Stock VSAV (Admin Pharmacie)">
                                <ion-icon name="create-outline"></ion-icon>
                            </button>
                            <button class="btn-icon-card save-vsav-stock-btn" data-name="${name}" title="Sauvegarder Stock VSAV" style="display:none;">
                                <ion-icon name="save-outline"></ion-icon>
                            </button>
                            <button class="btn-icon-card cancel-vsav-stock-edit-btn" data-name="${name}" title="Annuler Modification VSAV" style="display:none;">
                                <ion-icon name="close-circle-outline"></ion-icon>
                            </button>
                            <button class="btn-icon-card delete-stock-btn" title="Supprimer l'article des deux stocks">
                                <ion-icon name="trash-outline"></ion-icon>
                            </button>
                        </div>`;
                }
            }

            const cardHtml = `
            <div class="stock-card" data-name="${name}" data-stock-type="${viewType}" data-original-quantity="${details.quantity || 0}" data-original-notes="${details.notes || ''}">
                <div class="stock-card-header"><h3>${name}</h3></div>
                <div class="stock-card-body">
                    <div class="form-group-card">
                        <label>Quantité</label>
                        <div class="quantity-input-group stock-qty-group">
                            ${canEditPharmacieStock ? `<button type="button" class="qty-adjust-btn stock-card-qty-adjust" data-action="decrement">-</button>` : ''}
                            <input type="number" class="stock-quantity-input" value="${details.quantity || 0}" ${!canEditPharmacieStock && viewType === 'pharmacie' || viewType === 'pompier' ? 'readonly' : ''} min="0" step="1">
                            ${canEditPharmacieStock ? `<button type="button" class="qty-adjust-btn stock-card-qty-adjust" data-action="increment">+</button>` : ''}
                        </div>
                    </div>
                    <div class="form-group-card">
                        <label>Notes</label>
                        <input type="text" class="stock-notes-input" value="${details.notes || ''}" placeholder="Aucune note..." ${!canEditPharmacieStock && viewType === 'pharmacie' || viewType === 'pompier' ? 'readonly' : ''}>
                    </div>
                </div>
                ${footerHtml}
            </div>`;
            cardsContainer.innerHTML += cardHtml;
        });

        if(isPharmacyAuthenticated) {
            cardsContainer.querySelectorAll('.save-stock-btn').forEach(btn => btn.onclick = (e) => { // For Pharmacie stock
                const card = e.currentTarget.closest('.stock-card');
                const name = card.dataset.name;
                const stockType = card.dataset.stockType; 
                if (stockType !== 'pharmacie') return; 

                const quantity = parseInt(card.querySelector('.stock-quantity-input').value, 10);
                const notes = card.querySelector('.stock-notes-input').value;
                if (isNaN(quantity) || quantity < 0) return showMessage("Quantité invalide.", "error");

                database.ref(`stocks/${stockType}/${name}`).update({ quantity, notes });
                addLogEntry(`Mise à jour Stock Pharmacie`, `Article '${name}' (Qté: ${quantity}, Notes: ${notes || 'aucune'}) par ${currentUser}`);
                showMessage(`Article "${name}" dans le stock Pharmacie sauvegardé.`, 'success');
            });

            cardsContainer.querySelectorAll('.delete-stock-btn').forEach(btn => btn.onclick = async (e) => {
                const name = e.currentTarget.closest('.stock-card').dataset.name;
                if (await showCustomDialog({ title: 'Supprimer article des DEUX stocks', message: `Supprimer "${name}" définitivement des stocks VSAV ET Pharmacie ? Cette action est irréversible.` })) {
                    await database.ref(`stocks/pompier/${name}`).remove();
                    await database.ref(`stocks/pharmacie/${name}`).remove();
                    addLogEntry(`Suppression Article Stock (Global)`, `Suppression de '${name}' des stocks VSAV et Pharmacie par ${currentUser}`);
                    showMessage(`Article "${name}" supprimé des deux stocks (VSAV et Pharmacie).`, 'success');
                }
            });
           
            cardsContainer.querySelectorAll('.transfer-stock-btn').forEach(btn => btn.onclick = (e) => { 
                const name = e.currentTarget.closest('.stock-card').dataset.name;
                handleStockTransfer(name);
            });
        }
    }

    async function handleEditVSAVStock(editButton) {
        const card = editButton.closest('.stock-card');
        const itemName = card.dataset.name;
        
        const password = await showCustomDialog({
            title: 'Modifier Stock VSAV',
            message: `Entrez le mot de passe pharmacie (${PHARMACY_PASSWORD}) pour modifier le stock VSAV de "${itemName}".`,
            type: 'prompt',
            inputType: 'password'
        });

        if (password === PHARMACY_PASSWORD) {
            card.querySelector('.stock-quantity-input').readOnly = false;
            card.querySelector('.stock-notes-input').readOnly = false;

            const qtyGroup = card.querySelector('.stock-qty-group');
            // Add +/- buttons if not already there
            if (!qtyGroup.querySelector('.stock-card-qty-adjust')) {
                const decrementBtn = document.createElement('button');
                decrementBtn.type = 'button';
                decrementBtn.className = 'qty-adjust-btn stock-card-qty-adjust';
                decrementBtn.dataset.action = 'decrement';
                decrementBtn.textContent = '-';
                qtyGroup.insertBefore(decrementBtn, qtyGroup.firstChild);

                const incrementBtn = document.createElement('button');
                incrementBtn.type = 'button';
                incrementBtn.className = 'qty-adjust-btn stock-card-qty-adjust';
                incrementBtn.dataset.action = 'increment';
                incrementBtn.textContent = '+';
                qtyGroup.appendChild(incrementBtn);
            }


            card.querySelector('.edit-vsav-stock-btn').style.display = 'none';
            card.querySelector('.save-vsav-stock-btn').style.display = 'inline-flex';
            card.querySelector('.cancel-vsav-stock-edit-btn').style.display = 'inline-flex';
        } else if (password !== null) {
            showMessage('Mot de passe incorrect.', 'error');
        }
    }

    async function handleSaveVSAVStockChanges(saveButton) {
        const card = saveButton.closest('.stock-card');
        const itemName = card.dataset.name;
        const newQuantity = parseInt(card.querySelector('.stock-quantity-input').value, 10);
        const newNotes = card.querySelector('.stock-notes-input').value;

        if (isNaN(newQuantity) || newQuantity < 0) {
            showMessage('Quantité invalide pour le stock VSAV.', 'error');
            return;
        }

        try {
            await database.ref(`stocks/pompier/${itemName}`).update({ quantity: newQuantity, notes: newNotes });
            addLogEntry('Modification Stock VSAV (Admin Pharmacie)', `Article '${itemName}' stock VSAV modifié (Qté: ${newQuantity}, Notes: ${newNotes || 'aucune'}) par ${currentUser}.`);
            showMessage(`Stock VSAV pour "${itemName}" sauvegardé avec succès.`, 'success');
            
            card.dataset.originalQuantity = newQuantity; // Update original for subsequent cancels
            card.dataset.originalNotes = newNotes;

            // Revert to read-only state
            card.querySelector('.stock-quantity-input').readOnly = true;
            card.querySelector('.stock-notes-input').readOnly = true;
            
            card.querySelectorAll('.stock-card-qty-adjust').forEach(btn => btn.remove());


            card.querySelector('.edit-vsav-stock-btn').style.display = 'inline-flex';
            card.querySelector('.save-vsav-stock-btn').style.display = 'none';
            card.querySelector('.cancel-vsav-stock-edit-btn').style.display = 'none';

        } catch (error) {
            showMessage(`Erreur lors de la sauvegarde du stock VSAV: ${error.message}`, 'error');
        }
    }

    function handleCancelVSAVStockEdit(cancelButton) {
        const card = cancelButton.closest('.stock-card');
        const originalQuantity = card.dataset.originalQuantity;
        const originalNotes = card.dataset.originalNotes;

        card.querySelector('.stock-quantity-input').value = originalQuantity;
        card.querySelector('.stock-notes-input').value = originalNotes;

        card.querySelector('.stock-quantity-input').readOnly = true;
        card.querySelector('.stock-notes-input').readOnly = true;
        
        card.querySelectorAll('.stock-card-qty-adjust').forEach(btn => btn.remove());


        card.querySelector('.edit-vsav-stock-btn').style.display = 'inline-flex';
        card.querySelector('.save-vsav-stock-btn').style.display = 'none';
        card.querySelector('.cancel-vsav-stock-edit-btn').style.display = 'none';
        showMessage('Modification du stock VSAV annulée.', 'info');
    }

    
    async function handleStockTransfer(itemName) { 
        const currentPharmaQty = pharmaStock[itemName]?.quantity || 0;
        if (currentPharmaQty <= 0) return showMessage(`Le stock de "${itemName}" dans la pharmacie est vide. Transfert impossible.`, 'error');
        
        const qtyToTransferStr = await showCustomDialog({
            title: `Transfert de "${itemName}" (Pharma vers VSAV)`,
            message: `Stock Pharmacie actuel pour "${itemName}": ${currentPharmaQty}.\nEntrez la quantité à transférer vers le stock VSAV.`,
            type: 'prompt', inputType: 'number', defaultValue: '1'
        });

        if (qtyToTransferStr === null) return; 
        const qty = parseInt(qtyToTransferStr, 10);

        if (isNaN(qty) || qty <= 0) return showMessage('Quantité de transfert invalide.', 'error');
        if (qty > currentPharmaQty) return showMessage('La quantité à transférer ne peut pas dépasser le stock pharmacie actuel.', 'error');

        loaderModal.classList.add('visible');
        try {
            
            await database.ref(`stocks/pharmacie/${itemName}/quantity`).set(firebase.database.ServerValue.increment(-qty));
            
            
            const pompierItemRef = database.ref(`stocks/pompier/${itemName}`);
            const pompierItemSnapshot = await pompierItemRef.once('value');
            if (pompierItemSnapshot.exists()) { 
                await pompierItemRef.child('quantity').set(firebase.database.ServerValue.increment(qty));
            } else { 
                await pompierItemRef.set({ quantity: qty, notes: 'Transféré depuis stock pharmacie' });
            }
            addLogEntry('Transfert Stock (Pharma->VSAV)', `${qty} x '${itemName}' transféré de Pharmacie vers VSAV par ${currentUser}.`);
            showMessage(`Transfert de ${qty} x "${itemName}" de la Pharmacie vers le VSAV effectué.`, 'success');
        } catch (error) {
            showMessage(`Erreur lors du transfert de stock : ${error.message}`, 'error');
            addLogEntry('Erreur Transfert Stock', `Échec transfert ${itemName} (Pharma->VSAV): ${error.message}`);
        } finally {
            loaderModal.classList.remove('visible');
        }
    }

    function handleAddNewStockItemViaModal() {
        const name = newUnifiedStockItemNameModalInput.value.trim();
        const quantity = parseInt(newUnifiedStockItemQtyModalInput.value, 10);
        const targetStock = newUnifiedStockTargetModalSelect.value; 
        
        if (!name) return showMessage("Le nom de l'article ne peut pas être vide.", "error");
        if (isNaN(quantity) || quantity < 0) return showMessage("La quantité initiale ne peut pas être négative.", "error");

        const combinedStockKeys = [...new Set([...Object.keys(pompierStock), ...Object.keys(pharmaStock)])];
        if (combinedStockKeys.some(existingName => existingName.toLowerCase() === name.toLowerCase())) {
             return showMessage(`L'article "${name}" (ou une variation de casse) existe déjà dans l'un des stocks. Veuillez modifier l'article existant ou choisir un autre nom.`, "error");
        }

        const updates = {};
        const notes = 'Nouvel article ajouté via modal';

        if (targetStock === 'pompier') {
            updates[`stocks/pompier/${name}`] = { quantity: quantity, notes: notes };
            updates[`stocks/pharmacie/${name}`] = { quantity: 0, notes: `${notes} (créé car ajouté au VSAV)` };
        } else { 
            updates[`stocks/pharmacie/${name}`] = { quantity: quantity, notes: notes };
            updates[`stocks/pompier/${name}`] = { quantity: 0, notes: `${notes} (créé car ajouté à la Pharmacie)` };
        }

        database.ref().update(updates) 
            .then(() => {
                addLogEntry(`Création Article Stock (Global)`, `Création de '${name}' (Initial: ${quantity} dans ${targetStock}, 0 dans l'autre) par ${currentUser}`);
                showMessage(`L'article '${name}' a été ajouté avec ${quantity} unité(s) au stock ${targetStock === 'pompier' ? 'VSAV' : 'Pharmacie'} (et initialisé à 0 dans l'autre stock).`, 'success');
                newUnifiedStockItemNameModalInput.value = '';
                newUnifiedStockItemQtyModalInput.value = '0'; 
                addStockItemModal.classList.remove('visible');
            })
            .catch(error => showMessage(`Erreur lors de l'ajout de l'article: ${error.message}`, 'error'));
    }

    function displayJournal() {
        const searchTerm = (pharmacySearchInput.value || '').toLowerCase();
        const filteredLog = Object.entries(activityLog)
            .filter(([, log]) => {
                if (searchTerm) {
                    return (log.user?.toLowerCase().includes(searchTerm) ||
                            log.action?.toLowerCase().includes(searchTerm) ||
                            log.details?.toLowerCase().includes(searchTerm));
                }
                return true;
            })
            .sort(([, a], [, b]) => b.timestamp - a.timestamp); 

        if (filteredLog.length === 0) {
            journalTableBody.innerHTML = `<tr><td colspan="4" class="empty-view-message">Aucune entrée dans le journal ${searchTerm ? 'pour cette recherche' : ''}.</td></tr>`;
            return;
        }
        journalTableBody.innerHTML = filteredLog.map(([, log]) => `
                <tr>
                    <td>${new Date(log.timestamp).toLocaleString('fr-FR', {dateStyle: 'short', timeStyle: 'medium'})}</td>
                    <td>${log.user || 'N/A'}</td>
                    <td>${log.action || 'N/A'}</td>
                    <td>${log.details || 'N/A'}</td>
                </tr>
            `).join('');
    }

    function addManualCommandItemRow(item = { name: '', quantity: 1 }) {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('manual-command-item-row'); 
        itemDiv.innerHTML = `
            <div class="form-group"> <label>Nom du matériel</label>
                <input type="text" class="manual-command-item-name" list="stockDatalist" placeholder="Nom du matériel..." value="${item.name}">
            </div>
            <div class="form-group"> <label>Quantité</label>
                <div class="quantity-input-group">
                    <button type="button" class="qty-adjust-btn" data-action="decrement">-</button>
                    <input type="number" class="manual-command-item-qty" placeholder="Qté" min="1" value="${item.quantity}" step="1">
                    <button type="button" class="qty-adjust-btn" data-action="increment">+</button>
                </div>
            </div>
            <button type="button" class="btn-icon-action icon-danger remove-manual-command-item-btn" title="Supprimer cet article">
                <i class="bi bi-trash"></i>
            </button>
        `;
        manualCommandItemsContainer.appendChild(itemDiv);
        itemDiv.querySelector('.remove-manual-command-item-btn').addEventListener('click', () => {
            itemDiv.remove();
            if (manualCommandItemsContainer.children.length === 0) {
                addManualCommandItemRow();
            }
        });
    }
    
    function displayCommandes() {
        const searchTerm = (pharmacySearchInput.value || '').toLowerCase();
        let container;
        let isArchivedView;
        const addCmdBtnContainerDesktop = document.getElementById('manual-command-actions-section');
    
        if (currentCommandView === 'current') {
            container = currentCommandesCards;
            if (archivedCommandesCards) archivedCommandesCards.style.display = 'none';
            container.style.display = 'grid'; 
            isArchivedView = false;
            if (addCmdBtnContainerDesktop) addCmdBtnContainerDesktop.style.display = isPharmacyAuthenticated ? 'flex' : 'none';
            fabAddManualCommand.style.display = (isPharmacyAuthenticated && window.innerWidth <= 768) ? 'flex' : 'none';
        } else { 
            container = archivedCommandesCards;
            if (currentCommandesCards) currentCommandesCards.style.display = 'none';
            container.style.display = 'grid';
            isArchivedView = true;
            if (addCmdBtnContainerDesktop) addCmdBtnContainerDesktop.style.display = 'none'; 
            fabAddManualCommand.style.display = 'none'; 
        }
        container.innerHTML = ''; 

        const filteredCommands = Object.entries(commandLog)
            .filter(([id, cmd]) => {
                const matchesArchiveStatus = isArchivedView ? cmd.archived === true : !cmd.archived;
                if (!matchesArchiveStatus) return false;
                if (searchTerm) { 
                    return (cmd.materialName?.toLowerCase().includes(searchTerm) ||
                            cmd.interventionNum?.toLowerCase().includes(searchTerm) ||
                            cmd.status?.toLowerCase().includes(searchTerm) ||
                            (cmd.requestedBy && cmd.requestedBy.toLowerCase().includes(searchTerm)) ||
                            (cmd.orderedBy && cmd.orderedBy.toLowerCase().includes(searchTerm)) ||
                            (cmd.receivedBy && cmd.receivedBy.toLowerCase().includes(searchTerm)) ||
                            (cmd.stockedBy && cmd.stockedBy.toLowerCase().includes(searchTerm)) ||
                            (cmd.cancelledBy && cmd.cancelledBy.toLowerCase().includes(searchTerm)) );
                }
                return true;
            })
            .sort(([, a], [, b]) => b.createdAt - a.createdAt);

        if (filteredCommands.length === 0) {
            container.innerHTML = `<p class="empty-view-message">Aucune commande ${isArchivedView ? 'archivée' : 'en cours'} ${searchTerm ? 'pour cette recherche' : ''}.</p>`;
            return;
        }

        filteredCommands.forEach(([id, cmd]) => {
            let cardHtml;
            const isCancelled = cmd.status === 'Annulée';
            const cardClass = isCancelled ? 'command-card cancelled-command' : 'command-card';

            const interventionLink = cmd.interventionId && cmd.interventionId !== 'MANUEL' && cmd.interventionNum !== 'Commande Manuelle'
                ? `<a href="#" data-inter-id="${cmd.interventionId}">${cmd.interventionNum}</a>`
                : cmd.interventionNum; 

            if (isArchivedView) { 
                let statusBadgeClass = 'badge-termine'; 
                if (isCancelled) statusBadgeClass = 'badge-annulee';

                cardHtml = `
                <div class="${cardClass}" data-cmd-id="${id}">
                    <div class="command-card-header">
                        <h3>${cmd.materialName}</h3>
                        <span class="command-quantity">Qté: ${cmd.quantityMissing}</span>
                    </div>
                    <div class="command-card-body">
                        <p class="command-inter-link"><ion-icon name="document-text-outline"></ion-icon>Intervention: ${interventionLink}</p>
                        <p>Statut: <span class="status-badge ${statusBadgeClass}">${cmd.status || 'Archivé'}</span></p>
                        <div class="command-actors-readonly">
                            ${cmd.requestedBy ? `<small>Demandé par: ${cmd.requestedBy}</small>`:''}
                            ${cmd.orderedBy ? `<small>Commandé par: ${cmd.orderedBy}</small>`:''}
                            ${cmd.receivedBy ? `<small>Reçu par: ${cmd.receivedBy}</small>`:''}
                            ${cmd.stockedBy ? `<small>Rangé par: ${cmd.stockedBy}</small>`:''}
                            ${cmd.cancelledBy ? `<small>Annulé par: ${cmd.cancelledBy} le ${cmd.cancelledAt ? new Date(cmd.cancelledAt).toLocaleDateString('fr-FR') : 'N/A'}</small>`:''}
                            <small>Archivé le: ${cmd.archivedAt ? new Date(cmd.archivedAt).toLocaleDateString('fr-FR') : 'N/A'}</small>
                        </div>
                    </div>
                    <div class="command-card-footer">
                        <button class="btn-secondary unarchive-cmd-btn"><ion-icon name="arrow-undo-outline"></ion-icon> <span class="btn-text">Désarchiver</span></button>
                        <button class="btn-danger delete-cmd-btn"><ion-icon name="trash-outline"></ion-icon> <span class="btn-text">Supprimer</span></button>
                    </div>
                </div>`;
            } else { 
                if (isCancelled) { 
                    cardHtml = ` 
                    <div class="${cardClass}" data-cmd-id="${id}">
                        <div class="command-card-header"><h3>${cmd.materialName}</h3><span class="command-quantity">Qté: ${cmd.quantityMissing}</span></div>
                        <div class="command-card-body">
                            <p class="command-inter-link"><ion-icon name="document-text-outline"></ion-icon>Intervention: ${interventionLink}</p>
                            <p>Statut: <span class="status-badge badge-annulee">${cmd.status}</span></p>
                            <small>Annulé par: ${cmd.cancelledBy || 'N/A'} le ${cmd.cancelledAt ? new Date(cmd.cancelledAt).toLocaleDateString('fr-FR') : 'N/A'}</small>
                        </div>
                        ${ isPharmacyAuthenticated ? `
                        <div class="command-card-footer">
                             <button class="btn-danger delete-cmd-btn"><ion-icon name="trash-outline"></ion-icon> <span class="btn-text">Supprimer</span></button>
                        </div>` : ''}
                    </div>`;
                } else {
                    cardHtml = `
                    <div class="${cardClass}" data-cmd-id="${id}">
                        <div class="command-card-header">
                            <h3>${cmd.materialName}</h3>
                             <div class="quantity-input-group" style="max-width: 120px;">
                                <button type="button" class="qty-adjust-btn" data-action="decrement">-</button>
                                <input type="number" class="command-quantity-input" value="${cmd.quantityMissing}" min="1" step="1" style="font-size:0.9em; padding:0.4rem;">
                                <button type="button" class="qty-adjust-btn" data-action="increment">+</button>
                            </div>
                        </div>
                        <div class="command-card-body">
                            <p class="command-inter-link"><ion-icon name="document-text-outline"></ion-icon>Intervention: ${interventionLink}</p>
                            <div class="form-group-card">
                                <label for="cmd-status-${id}">Statut de la commande</label>
                                <select id="cmd-status-${id}" class="cmd-status-select">
                                    <option value="À commander" ${cmd.status === 'À commander' ? 'selected' : ''}>À commander</option>
                                    <option value="En commande" ${cmd.status === 'En commande' ? 'selected' : ''}>En commande</option>
                                    <option value="Reçu" ${cmd.status === 'Reçu' ? 'selected' : ''}>Reçu</option>
                                    </select>
                            </div>
                            <div class="command-actors">
                                 <input type="text" class="cmd-user-input" data-field="requestedBy" placeholder="Demandé par..." value="${cmd.requestedBy || ''}" title="Demandé par">
                                 <input type="text" class="cmd-user-input" data-field="orderedBy" placeholder="Commandé par..." value="${cmd.orderedBy || ''}" title="Commandé par">
                                 <input type="text" class="cmd-user-input" data-field="receivedBy" placeholder="Reçu par..." value="${cmd.receivedBy || ''}" title="Reçu par">
                                 <input type="text" class="cmd-user-input" data-field="stockedBy" placeholder="Rangé par..." value="${cmd.stockedBy || ''}" title="Rangé par (avant archivage)">
                            </div>
                        </div>
                        <div class="command-card-footer">
                            <button class="btn-secondary save-cmd-btn" title="Enregistrer les modifications de cette commande"><ion-icon name="save-outline"></ion-icon> <span class="btn-text">Enregistrer</span></button>
                            <button class="btn-primary archive-range-cmd-btn" title="Ranger en stock Pharmacie et archiver la commande"><ion-icon name="archive-outline"></ion-icon> <span class="btn-text">Ranger & Archiver</span></button>
                            <button class="btn-danger cancel-cmd-btn" title="Annuler cette commande"><ion-icon name="close-circle-outline"></ion-icon> <span class="btn-text">Annuler Commande</span></button>
                        </div>
                    </div>`;
                }
            }
            container.innerHTML += cardHtml;
        });

        container.querySelectorAll('.save-cmd-btn').forEach(btn => btn.addEventListener('click', handleSaveCommand));
        container.querySelectorAll('.archive-range-cmd-btn').forEach(btn => btn.addEventListener('click', handleArchiveAndStockCommand));
        container.querySelectorAll('.cancel-cmd-btn').forEach(btn => btn.addEventListener('click', handleCancelCommand)); 
        container.querySelectorAll('.unarchive-cmd-btn').forEach(btn => btn.addEventListener('click', handleUnarchiveCommand));
        container.querySelectorAll('.delete-cmd-btn').forEach(btn => btn.addEventListener('click', handleDeleteCommand));
        
        container.querySelectorAll('.command-inter-link a').forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                const interId = e.target.dataset.interId;
                if (interId && interId !== 'MANUEL' && interId !== 'Commande Manuelle') {
                    showDetailsModal(interId);
                }
            });
        });
    }
    
    async function handleSaveCommand(e) {
        const card = e.currentTarget.closest('.command-card');
        const cmdId = card.dataset.cmdId;
        const newQuantity = parseInt(card.querySelector('.command-quantity-input')?.value, 10); 

        if (isNaN(newQuantity) || newQuantity < 1) {
            return showMessage("La quantité de la commande doit être d'au moins 1.", "error");
        }

        const updates = {
            status: card.querySelector('.cmd-status-select').value,
            quantityMissing: newQuantity, 
            requestedBy: card.querySelector('[data-field="requestedBy"]').value || '',
            orderedBy: card.querySelector('[data-field="orderedBy"]').value || '',
            receivedBy: card.querySelector('[data-field="receivedBy"]').value || '',
            stockedBy: card.querySelector('[data-field="stockedBy"]').value || '',
            updatedAt: firebase.database.ServerValue.TIMESTAMP,
            updatedBy: currentUser
        };
        await database.ref(`commandes/${cmdId}`).update(updates);
        addLogEntry('Mise à jour Commande', `Cmd ID: ${cmdId}, Mat: ${commandLog[cmdId]?.materialName}, Qté: ${updates.quantityMissing}, Statut: ${updates.status}, par ${currentUser}`);
        showMessage("Modifications de la commande enregistrées.", "success");
    }
    
    async function handleArchiveAndStockCommand(e) {
        const card = e.currentTarget.closest('.command-card');
        const cmdId = card.dataset.cmdId;
        const cmdData = commandLog[cmdId]; 

        if (!cmdData) return showMessage("Données de commande introuvables.", "error");

        const currentQuantityOnCard = parseInt(card.querySelector('.command-quantity-input')?.value, 10);
        if (isNaN(currentQuantityOnCard) || currentQuantityOnCard < 1) {
            return showMessage("Quantité invalide sur la carte. Enregistrez d'abord la quantité.", "error");
        }

        const confirmed = await showCustomDialog({
            title: "Archiver et Ranger la Commande",
            message: `Confirmez-vous que la commande pour ${currentQuantityOnCard} x "${cmdData.materialName}" a été reçue et rangée ? Le stock pharmacie sera mis à jour avec cette quantité.`
        });

        if (confirmed) {
            const updates = {
                status: 'Rangé et Archivé',
                quantityMissing: currentQuantityOnCard, 
                archived: true,
                archivedAt: firebase.database.ServerValue.TIMESTAMP,
                archivedBy: currentUser,
                requestedBy: card.querySelector('[data-field="requestedBy"]').value || cmdData.requestedBy || '',
                orderedBy: card.querySelector('[data-field="orderedBy"]').value || cmdData.orderedBy || '',
                receivedBy: card.querySelector('[data-field="receivedBy"]').value || cmdData.receivedBy || currentUser, 
                stockedBy: card.querySelector('[data-field="stockedBy"]').value || currentUser 
            };
            try {
                await database.ref(`commandes/${cmdId}`).update(updates);
                
                const pharmaItemRef = database.ref(`stocks/pharmacie/${cmdData.materialName}`);
                const pharmaItemSnapshot = await pharmaItemRef.once('value');
                if (pharmaItemSnapshot.exists()) {
                    await pharmaItemRef.child('quantity').set(firebase.database.ServerValue.increment(currentQuantityOnCard));
                } else { 
                    await pharmaItemRef.set({ quantity: currentQuantityOnCard, notes: 'Ajouté via commande rangée et archivée' });
                }
                addLogEntry('Stock Pharmacie & Archivage Cmd', `+${currentQuantityOnCard} de '${cmdData.materialName}' au stock pharmacie. Cmd ID: ${cmdId} archivée par ${currentUser}`);
                showMessage(`Commande archivée. Stock pharmacie pour "${cmdData.materialName}" mis à jour.`, 'success');
            } catch (error) {
                 showMessage(`Erreur lors de l'archivage et de la mise à jour du stock: ${error.message}`, 'error');
                 addLogEntry('Erreur Archivage Cmd & Stock', `Cmd ID: ${cmdId}, Erreur: ${error.message}`);
            }
        }
    }

    async function handleCancelCommand(e) {
        const card = e.currentTarget.closest('.command-card');
        const cmdId = card.dataset.cmdId;
        const cmdData = commandLog[cmdId];

        if (!cmdData) return showMessage("Données de commande introuvables.", "error");
        if (cmdData.archived || cmdData.status === 'Annulée') { 
            return showMessage("Cette commande est déjà archivée ou annulée.", "info");
        }

        const confirmed = await showCustomDialog({
            title: "Annuler la Commande",
            message: `Voulez-vous vraiment annuler la commande pour ${cmdData.quantityMissing} x "${cmdData.materialName}" ?\nSi cette commande provient d'une intervention, le statut du matériel concerné dans l'intervention sera réinitialisé.`
        });

        if (confirmed) {
            loaderModal.classList.add('visible');
            try {
                const updates = {
                    status: 'Annulée',
                    archived: true, 
                    cancelledAt: firebase.database.ServerValue.TIMESTAMP,
                    cancelledBy: currentUser,
                    archivedAt: firebase.database.ServerValue.TIMESTAMP, 
                    archivedBy: currentUser,
                    updatedAt: firebase.database.ServerValue.TIMESTAMP,
                    updatedBy: currentUser
                };
                await database.ref(`commandes/${cmdId}`).update(updates);
                let logDetails = `Commande ID: ${cmdId} (${cmdData.materialName}) annulée par ${currentUser}.`;

                if (cmdData.interventionId && cmdData.interventionId !== 'MANUEL' && cmdData.materialName) {
                    const interSnapshot = await database.ref(`interventions/${cmdData.interventionId}`).once('value');
                    const inter = interSnapshot.val();
                    if (inter && inter.materiels && inter.materiels[cmdData.materialName]) {
                        const materialUpdates = {};
                        // When a command is cancelled, the material status in intervention should reflect it needs re-evaluation
                        materialUpdates[`interventions/${cmdData.interventionId}/materiels/${cmdData.materialName}/pharma_status`] = 'À vérifier par pharmacie'; 
                        // We don't necessarily reset reappro_status here, as the firefighter's assessment of need might still be valid.
                        // The pharmacy will see "À vérifier par pharmacie" and can decide the next step.
                        await database.ref().update(materialUpdates);
                        logDetails += ` Statut matériel pharmacie pour '${cmdData.materialName}' réinitialisé à 'À vérifier par pharmacie' pour inter n°${cmdData.interventionNum}.`;
                    }
                }
                addLogEntry('Annulation Commande', logDetails);
                showMessage("Commande annulée et archivée.", "success");
            } catch (error) {
                showMessage(`Erreur lors de l'annulation de la commande: ${error.message}`, 'error');
                addLogEntry('Erreur Annulation Commande', `Cmd ID: ${cmdId}, Erreur: ${error.message}`);
            } finally {
                loaderModal.classList.remove('visible');
            }
        }
    }

    async function handleUnarchiveCommand(e) {
        const card = e.target.closest('.command-card');
        const cmdId = card.dataset.cmdId;
        const cmdData = commandLog[cmdId];

        if (!cmdData) return showMessage("Données de commande introuvables.", "error");
        if (!cmdData.archived) return showMessage("Cette commande n'est pas archivée.", "info");


        const confirmed = await showCustomDialog({
            title: "Désarchiver la Commande",
            message: `Voulez-vous vraiment désarchiver la commande pour "${cmdData.materialName}" ?`
        });

        if (confirmed) {
            const updates = {
                archived: false,
                archivedAt: null,
                archivedBy: null,
                updatedAt: firebase.database.ServerValue.TIMESTAMP,
                updatedBy: currentUser
            };

            if (cmdData.status === 'Rangé et Archivé') {
                updates.status = 'Reçu'; 
            } 
            
            await database.ref(`commandes/${cmdId}`).update(updates);
            addLogEntry('Désarchivage Commande', `Cmd ID: ${cmdId} (${cmdData.materialName}) désarchivée par ${currentUser}.`);
            showMessage("Commande désarchivée.", "success");
        }
    }

    async function handleDeleteCommand(e) {
        const card = e.target.closest('.command-card');
        const cmdId = card.dataset.cmdId;
        const cmdData = commandLog[cmdId];

        if (!cmdData) return showMessage("Données de commande introuvables.", "error");

        const confirmed = await showCustomDialog({
            title: 'Suppression Définitive de Commande',
            message: `Supprimer définitivement la commande pour "${cmdData.materialName}" ? Cette action est irréversible.`,
        });

        if (confirmed) {
            const password = await showCustomDialog({
                title: 'Accès Sécurisé (Admin)',
                message: 'Entrez le mot de passe administrateur pour confirmer la suppression de la commande.',
                type: 'prompt', inputType: 'password'
            });

            if (password === DELETE_PASSWORD) {
                await database.ref(`commandes/${cmdId}`).remove();
                addLogEntry('Suppression Définitive Cmd', `Commande ID: ${cmdId} (${cmdData.materialName}) supprimée par ${currentUser} (Admin)`);
                showMessage('Commande supprimée définitivement.', 'success');
            } else if (password !== null) {
                showMessage('Mot de passe administrateur incorrect. La commande n\'a pas été supprimée.', 'error');
            }
        }
    }
    
    async function handleManualCommandViaModal() {
        const itemRows = manualCommandItemsContainer.querySelectorAll('.manual-command-item-row');
        if (itemRows.length === 0) {
            return showMessage("Veuillez ajouter au moins un article à la commande.", "error");
        }

        loaderModal.classList.add('visible');
        let commandsCreatedCount = 0;
        let errorsEncountered = 0;
        const commandPromises = [];

        for (const row of itemRows) {
            const materialNameInput = row.querySelector('.manual-command-item-name');
            const quantityInput = row.querySelector('.manual-command-item-qty');
            const materialName = materialNameInput.value.trim();
            const quantity = parseInt(quantityInput.value, 10);

            if (!materialName || !quantity || quantity < 1) {
                materialNameInput.style.borderColor = !materialName ? 'red' : '';
                quantityInput.style.borderColor = (!quantity || quantity < 1) ? 'red' : '';
                errorsEncountered++;
                continue; 
            }
            materialNameInput.style.borderColor = '';
            quantityInput.style.borderColor = '';

            const commandData = {
                interventionId: 'MANUEL', 
                interventionNum: 'Commande Manuelle',
                materialName: materialName,
                quantityMissing: quantity,
                status: 'À commander', 
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                requestedBy: currentUser, 
                orderedBy: currentUser, 
                archived: false
            };
            commandPromises.push(
                database.ref('commandes').push().set(commandData)
                    .then(() => {
                        commandsCreatedCount++;
                        addLogEntry('Création Commande Manuelle', `${quantity} x '${materialName}' par ${currentUser}`);
                    })
                    .catch(err => {
                        errorsEncountered++;
                        console.error("Erreur création commande manuelle pour", materialName, err);
                        showMessage(`Erreur création commande pour ${materialName}: ${err.message}`, "error");
                    })
            );
        }

        await Promise.all(commandPromises);
        loaderModal.classList.remove('visible');

        if (commandsCreatedCount > 0) {
            showMessage(`${commandsCreatedCount} commande(s) manuelle(s) créée(s) avec succès.`, 'success');
        }
        if (errorsEncountered > 0) {
            showMessage(`${errorsEncountered} erreur(s) lors de la création de certaines commandes. Vérifiez la console.`, 'error');
        } else if (commandsCreatedCount === 0 && itemRows.length > 0) {
             showMessage("Veuillez corriger les erreurs dans les articles de la commande.", "error");
        }


        if (errorsEncountered === 0 && commandsCreatedCount > 0) {
            manualCommandItemsContainer.innerHTML = ''; 
            addManualCommandItemRow(); 
            addManualCommandModal.classList.remove('visible');
        }
    }
    
    async function handleClearJournal() {
        const confirmed = await showCustomDialog({
            title: "Effacer le Journal d'Activité",
            message: "Cette action est irréversible et supprimera toutes les entrées du journal. Voulez-vous continuer ?"
        });
        if (confirmed) {
            const password = await showCustomDialog({
                title: 'Accès Sécurisé (Admin)',
                message: 'Entrez le mot de passe administrateur pour confirmer la suppression du journal.',
                type: 'prompt', inputType: 'password'
            });
            if (password === DELETE_PASSWORD) {
                await database.ref('log').remove();
                showMessage("Journal d'activité effacé avec succès.", 'success');
                addLogEntry('Journal Effacé', `Journal d'activité effacé par ${currentUser} (Admin)`);
            } else if (password !== null) { 
                showMessage('Mot de passe administrateur incorrect. Le journal n\'a pas été effacé.', 'error');
            }
        }
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
        tempSelectedMaterielsModal = []; 
    }

    function setDefaultDateTime() {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); 
        document.getElementById('date').valueAsDate = now; 
        document.getElementById('heure').value = now.toTimeString().slice(0, 5); 
    }
    
    function updateStockDatalist() {
        const combinedStockNames = [...new Set([...Object.keys(pompierStock), ...Object.keys(pharmaStock)])]
            .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
        
        stockDatalist.innerHTML = combinedStockNames.map(item => `<option value="${item}"></option>`).join('');
    }

    function updateMaterielsTagDisplay() {
        materielsList.innerHTML = materiels.map(mat => 
            `<span class="tag-item">${mat.name} (x${mat.qty})<button type="button" class="close-tag" data-materiel-name="${mat.name}" title="Retirer ce matériel">&times;</button></span>`
        ).join('');
        materielsList.querySelectorAll('.close-tag').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const materialNameToRemove = e.target.dataset.materielName;
                materiels = materiels.filter(m => m.name !== materialNameToRemove);
                updateMaterielsTagDisplay(); 
            });
        });
    }
    
    function handlePhotoUpload(e) {
        const files = Array.from(e.target.files);
        const maxPhotos = 5;
        const maxSizeMB = 2; 

        if (photosBase64.length + files.length > maxPhotos) { 
            showMessage(`Vous ne pouvez télécharger qu'un maximum de ${maxPhotos} photos. Vous en avez déjà ${photosBase64.length}.`, "error");
            e.target.value = null; 
            return;
        }

        files.forEach(file => {
            if (file.size > maxSizeMB * 1024 * 1024) { 
                showMessage(`Le fichier ${file.name} est trop volumineux (max ${maxSizeMB}MB). Il ne sera pas ajouté.`, "error");
                return; 
            }
            if (!file.type.startsWith('image/')) {
                showMessage(`Le fichier ${file.name} n'est pas une image valide. Il ne sera pas ajouté.`, "error");
                return; 
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                if (photosBase64.length < maxPhotos) { 
                    photosBase64.push(event.target.result);
                    updatePhotosDisplay();
                }
            };
            reader.onerror = () => showMessage(`Erreur lors de la lecture du fichier ${file.name}.`, "error");
            reader.readAsDataURL(file);
        });
        e.target.value = null; 
    }

    function updatePhotosDisplay() {
        photoPreview.innerHTML = photosBase64.map((photo, index) => 
            `<div class="photo-thumb-wrapper">
                <img src="${photo}" class="photo-thumb" alt="Aperçu photo ${index + 1}" data-index="${index}">
                <button type="button" class="remove-photo-btn" data-index="${index}" title="Supprimer cette photo">&times;</button>
            </div>`
        ).join('');

        document.querySelectorAll('.remove-photo-btn').forEach(btn => {
            btn.addEventListener('click', (e) => { 
                e.stopPropagation(); 
                const indexToRemove = parseInt(e.target.dataset.index, 10);
                photosBase64.splice(indexToRemove, 1); 
                updatePhotosDisplay(); 
            });
        });
        document.querySelectorAll('.photo-thumb').forEach(thumb => { 
            thumb.addEventListener('click', (e) => showFullImage(photosBase64[parseInt(e.target.dataset.index, 10)]));
        });
    }

    function showFullImage(src) {
        if (!src) return;
        fullImagePreview.src = src;
        imagePreviewModal.classList.add('visible');
    }

    function showMessage(message, type = 'info') { 
        const container = document.createElement('div');
        container.className = `message-container ${type}`; 
        container.innerHTML = `<p>${message}</p><button class="close-message" title="Fermer">&times;</button>`;
        document.body.appendChild(container);
        
        const closeMsgBtn = container.querySelector('.close-message');
        
        const autoCloseTimeout = setTimeout(() => {
            if (document.body.contains(container)) {
                container.style.opacity = '0'; 
                setTimeout(() => document.body.removeChild(container), 300); 
            }
        }, 4000);

        closeMsgBtn.addEventListener('click', () => {
            clearTimeout(autoCloseTimeout); 
            if (document.body.contains(container)) {
                container.style.opacity = '0';
                setTimeout(() => document.body.removeChild(container), 300);
            }
        });
    }

    function formatDate(dateStr) { 
        if (!dateStr) return 'N/A';
        if (dateStr.includes('-')) { 
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                return `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
        }
        return dateStr; 
    }

    function handlePageChange(newPage, type) {
        if (type === 'current') currentPage_current = newPage;
        else if (type === 'archive') currentPage_archive = newPage;
        else if (type === 'pharmacy') currentPage_pharmacy = newPage;
        else if (type === 'pharmacy_archive') currentPage_pharmacy_archive = newPage;
        displayInterventions(); 
        window.scrollTo(0, 0); 
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
            if (!isDisabled) a.dataset.page = page; 
            li.appendChild(a);
            return li;
        };

        paginationUl.appendChild(createPageLink(currentPage - 1, '<i class="bi bi-chevron-left"></i>', currentPage === 1));

        const MAX_PAGES_SHOWN = 5; 
        let startPage = Math.max(1, currentPage - Math.floor(MAX_PAGES_SHOWN / 2));
        let endPage = Math.min(totalPages, startPage + MAX_PAGES_SHOWN - 1);

        if (endPage - startPage + 1 < MAX_PAGES_SHOWN && totalPages >= MAX_PAGES_SHOWN) {
            startPage = Math.max(1, endPage - MAX_PAGES_SHOWN + 1);
        }
        
        if (startPage > 1) {
            paginationUl.appendChild(createPageLink(1, '1')); 
            if (startPage > 2) { 
                 const li = document.createElement('li'); li.className = 'page-item disabled';
                 li.innerHTML = `<span class="page-link">...</span>`; paginationUl.appendChild(li);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationUl.appendChild(createPageLink(i, i, false, i === currentPage));
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) { 
                const li = document.createElement('li'); li.className = 'page-item disabled';
                li.innerHTML = `<span class="page-link">...</span>`; paginationUl.appendChild(li);
            }
            paginationUl.appendChild(createPageLink(totalPages, totalPages)); 
        }

        paginationUl.appendChild(createPageLink(currentPage + 1, '<i class="bi bi-chevron-right"></i>', currentPage === totalPages));
        
        paginationUl.querySelectorAll('a.page-link').forEach(link => {
            if (!link.closest('.disabled') && !link.closest('.active')) { 
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    handlePageChange(parseInt(link.dataset.page), type);
                });
            }
        });
    }

    // --- MODAL DE SÉLECTION DE MATÉRIEL (pour formulaire intervention) ---
    function populateMaterielSelectionModal(searchTerm = '') {
        materielSelectionList.innerHTML = ''; 
        const combinedStock = { ...pompierStock, ...pharmaStock }; 
        const lowerSearchTerm = searchTerm.toLowerCase();
        
        const sortedStockNames = Object.keys(combinedStock)
            .filter(name => name.toLowerCase().includes(lowerSearchTerm))
            .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

        if (sortedStockNames.length === 0 && !searchTerm) { 
             materielSelectionList.innerHTML = '<p class="empty-view-message">Aucun article en stock. Vous pouvez ajouter un matériel non listé ci-dessous.</p>'; return;
        }
        if (sortedStockNames.length === 0 && searchTerm) { 
             materielSelectionList.innerHTML = `<p class="empty-view-message">Aucun article trouvé pour "${searchTerm}". Ajoutez-le manuellement si besoin.</p>`; return;
        }

        sortedStockNames.forEach(name => {
            const itemDetailsPompier = pompierStock[name] || { quantity: 0 };
            const itemDetailsPharma = pharmaStock[name] || { quantity: 0 };
            const existingSelection = tempSelectedMaterielsModal.find(m => m.name === name);
            const currentQtyInModal = existingSelection ? existingSelection.qty : 0;
            
            const itemDiv = document.createElement('div');
            itemDiv.className = 'materiel-selection-item';
            itemDiv.innerHTML = `
                <span>${name} <small class="stock-info">(Stock VSAV: ${itemDetailsPompier.quantity}, Stock Pharmacie: ${itemDetailsPharma.quantity})</small></span>
                <div class="quantity-input-group">
                    <button type="button" class="qty-adjust-btn" data-action="decrement">-</button>
                    <input type="number" value="${currentQtyInModal}" min="0" data-name="${name}" placeholder="Qté" class="materiel-selection-qty-input" step="1">
                    <button type="button" class="qty-adjust-btn" data-action="increment">+</button>
                </div>
            `;
            materielSelectionList.appendChild(itemDiv);

            const qtyInput = itemDiv.querySelector('input[type="number"]');
            qtyInput.addEventListener('change', (e) => {
                updateTempSelectedMateriels(e.target.dataset.name, parseInt(e.target.value, 10) || 0);
            });
            qtyInput.addEventListener('input', (e) => { 
                 updateTempSelectedMateriels(e.target.dataset.name, parseInt(e.target.value, 10) || 0);
            });
            qtyInput.addEventListener('focus', () => qtyInput.select()); 
        });
    }

    function updateTempSelectedMateriels(itemName, newQty) {
        const index = tempSelectedMaterielsModal.findIndex(m => m.name === itemName);
        if (newQty > 0) { 
            if (index > -1) { 
                tempSelectedMaterielsModal[index].qty = newQty;
            } else { 
                tempSelectedMaterielsModal.push({ name: itemName, qty: newQty });
            }
        } else { 
            if (index > -1) { 
                tempSelectedMaterielsModal.splice(index, 1);
            }
        }
    }


    openMaterielSelectionModalBtn.addEventListener('click', () => {
        tempSelectedMaterielsModal = JSON.parse(JSON.stringify(materiels)); 
        populateMaterielSelectionModal(); 
        materielSearchModalInput.value = ''; 
        manualMaterielNameModalInput.value = ''; 
        manualMaterielQtyModalInput.value = '1';
        materielSelectionModal.classList.add('visible');
        materielSearchModalInput.focus();
    });

    materielSearchModalInput.addEventListener('input', (e) => {
        populateMaterielSelectionModal(e.target.value);
    });

    addManualMaterielFromModalBtn.addEventListener('click', () => {
        const name = manualMaterielNameModalInput.value.trim();
        const qty = parseInt(manualMaterielQtyModalInput.value, 10);
        if (name && qty > 0) {
            const existingIndex = tempSelectedMaterielsModal.findIndex(m => m.name.toLowerCase() === name.toLowerCase());
            if (existingIndex > -1) { 
                tempSelectedMaterielsModal[existingIndex].qty += qty; 
                showMessage(`Quantité pour "${tempSelectedMaterielsModal[existingIndex].name}" mise à jour (total: ${tempSelectedMaterielsModal[existingIndex].qty}).`, 'info');
            } else { 
                tempSelectedMaterielsModal.push({ name, qty });
                showMessage(`"${name}" (x${qty}) ajouté à la sélection.`, 'info');
            }
            manualMaterielNameModalInput.value = '';
            manualMaterielQtyModalInput.value = '1';
            populateMaterielSelectionModal(materielSearchModalInput.value); 
            manualMaterielNameModalInput.focus();
        } else {
            showMessage("Nom de matériel et quantité valide (>0) requis pour l'ajout manuel.", "error");
        }
    });

    confirmMaterielSelectionBtn.addEventListener('click', () => {
        materiels = tempSelectedMaterielsModal.filter(m => m.qty > 0);
        updateMaterielsTagDisplay(); 
        materielSelectionModal.classList.remove('visible');
        tempSelectedMaterielsModal = []; 
    });
    
    cancelMaterielSelectionBtn.addEventListener('click', () => {
        materielSelectionModal.classList.remove('visible');
        tempSelectedMaterielsModal = []; 
    });

    document.body.addEventListener('click', function(e) {
        const targetButton = e.target.closest('.qty-adjust-btn');
        if (targetButton) {
            const action = targetButton.dataset.action;
            let inputEl;
            const card = targetButton.closest('.stock-card');
            const isVSAVStockCardByPharmacie = card && card.dataset.stockType === 'pompier' && isPharmacyAuthenticated;


            if (targetButton.dataset.target) { 
                inputEl = document.getElementById(targetButton.dataset.target);
            } else if (targetButton.dataset.targetClass) { 
                 inputEl = targetButton.closest('.quantity-input-group').querySelector('.' + targetButton.dataset.targetClass);
            } else { 
                inputEl = targetButton.parentElement.querySelector('input[type="number"]');
            }

            if (inputEl) {
                // Prevent action if input is readonly (e.g. for locked VSAV stock quantity by pharmacie)
                 if (inputEl.readOnly && (inputEl.classList.contains('mat-qty-used') || (isVSAVStockCardByPharmacie && !card.classList.contains('editing-vsav-stock')) )) {
                    return;
                }


                let currentValue = parseInt(inputEl.value, 10) || 0; 
                const min = parseInt(inputEl.min, 10); 
                const step = parseInt(inputEl.step, 10) || 1; 

                if (action === 'increment') {
                    currentValue += step;
                } else if (action === 'decrement') {
                    currentValue -= step;
                }

                if (!isNaN(min) && currentValue < min) {
                    currentValue = min;
                } else if (currentValue < 0 && isNaN(min) && min !== 0) { 
                    currentValue = 0;
                }
                
                inputEl.value = currentValue;

                if (targetButton.closest('#materielSelectionList') && inputEl.dataset.name) {
                    updateTempSelectedMateriels(inputEl.dataset.name, currentValue);
                }
                const changeEvent = new Event('change', { bubbles: true });
                inputEl.dispatchEvent(changeEvent);
                 const inputEvent = new Event('input', { bubbles: true }); 
                inputEl.dispatchEvent(inputEvent);
            }
        }
    });


    // --- Initialisation ---
    function initializeApp() {
        currentUser = sessionStorage.getItem('userName'); 
        const pharmaUser = sessionStorage.getItem('pharmaUserName'); 
        if (pharmaUser) { 
            currentUser = pharmaUser;
            isPharmacyAuthenticated = true; 
        } else if (!currentUser) { 
            currentUser = prompt("Votre nom ou matricule pour suivi (Pompier) :", "Pompier");
            sessionStorage.setItem('userName', currentUser || "Pompier");
        }
        currentUser = currentUser || (isPharmacyAuthenticated ? "Pharmacien" : "Pompier");
        
        fetchData(); 
        setDefaultDateTime(); 

        setupNavEventListeners(mainNavUl);
        setupNavEventListeners(pharmacyNavUl);
        
        togglePharmacyMode(isPharmacyAuthenticated); 
                                                  
        interventionForm.addEventListener('submit', handleFormSubmit);
        document.getElementById('photo').addEventListener('change', handlePhotoUpload);
        document.getElementById('resetForm').addEventListener('click', resetForm);
        
        currentSearchInput.addEventListener('input', () => { currentPage_current = 1; displayInterventions(); });
        archiveSearchInput.addEventListener('input', () => { currentPage_archive = 1; displayInterventions(); });
        pharmacySearchInput.addEventListener('input', () => { 
            const activeViewId = document.querySelector('.view-container.visible')?.id;
            if (activeViewId === 'commandes-view') { displayCommandes(); } 
            else if (activeViewId === 'stock-unified-view') { displayUnifiedStockView(); } 
            else if (activeViewId === 'journal-view') { displayJournal(); } 
            else if (['reappro-view', 'pharmacy-archives-view'].includes(activeViewId)) {
                 currentPage_pharmacy = 1; currentPage_pharmacy_archive = 1; displayInterventions();
            }
        });

        document.querySelectorAll('.modal .close-button, .modal .modal-close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => e.currentTarget.closest('.modal').classList.remove('visible'));
        });

        topLoginBtn.addEventListener('click', handlePharmacyLogin);
        headerLogoutBtn.addEventListener('click', handlePharmacyLogout);
        
        openAddManualCommandModalBtn.addEventListener('click', () => {
            manualCommandItemsContainer.innerHTML = ''; 
            addManualCommandItemRow(); 
            addManualCommandModal.classList.add('visible');
        });
        fabAddManualCommand.addEventListener('click', () => {
            manualCommandItemsContainer.innerHTML = '';
            addManualCommandItemRow();
            addManualCommandModal.classList.add('visible');
        });
        addAnotherItemToManualCommandBtn.addEventListener('click', () => addManualCommandItemRow());
        saveNewManualCommandBtn.addEventListener('click', handleManualCommandViaModal);


        openAddStockItemModalBtn.addEventListener('click', () => addStockItemModal.classList.add('visible'));
        fabAddStockItem.addEventListener('click', () => addStockItemModal.classList.add('visible'));
        saveNewStockItemBtn.addEventListener('click', handleAddNewStockItemViaModal);

        clearJournalBtn.addEventListener('click', handleClearJournal);

        document.querySelectorAll('#commandes-view .desktop-sub-nav .sub-nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (globalHeader.classList.contains('pharmacy-mode-subnav-active') && pharmacyHeaderSubnavContainer.querySelector('[data-command-view]')) return; 

                document.querySelectorAll('#commandes-view .desktop-sub-nav .sub-nav-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                currentCommandView = e.currentTarget.dataset.commandView;
                displayCommandes();
            });
        });
        document.querySelectorAll('#stock-unified-view .desktop-sub-nav .sub-nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (globalHeader.classList.contains('pharmacy-mode-subnav-active') && pharmacyHeaderSubnavContainer.querySelector('[data-stock-type]')) return;

                document.querySelectorAll('#stock-unified-view .desktop-sub-nav .sub-nav-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                currentStockSubView = e.currentTarget.dataset.stockType;
                displayUnifiedStockView();
            });
        });

        document.querySelectorAll('#header-controls .search-box i.bi-search').forEach(icon => {
            icon.addEventListener('click', () => {
                const input = icon.nextElementSibling; 
                if (input && input.tagName === 'INPUT' && typeof input.focus === 'function') {
                    input.focus();
                }
            });
        });

        window.addEventListener('resize', () => {
            const activeViewId = document.querySelector('.view-container.visible')?.id;
            if (isPharmacyAuthenticated) {
                fabAddManualCommand.style.display = (activeViewId === 'commandes-view' && window.innerWidth <= 768) ? 'flex' : 'none';
                fabAddStockItem.style.display = (activeViewId === 'stock-unified-view' && window.innerWidth <= 768) ? 'flex' : 'none';
            } else { 
                fabAddManualCommand.style.display = 'none';
                fabAddStockItem.style.display = 'none';
            }
            if(activeViewId) updatePharmacyHeaderSubNav(activeViewId);
        });
    }

    initializeApp();
});
