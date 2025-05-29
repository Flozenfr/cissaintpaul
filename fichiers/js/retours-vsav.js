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
    const pharmacySearchInput = document.getElementById('pharmacySearch'); // Input de recherche partagé
    const mobileSearchIcon = document.getElementById('mobile-search-icon'); // Nouvelle icône de recherche mobile
    const pharmacySearchBox = document.querySelector('#header-controls-pharmacy .search-box'); // La search-box de pharmacie

    const journalTableBody = document.getElementById('journalTableBody');
    
    const unifiedStockCards = document.getElementById('unifiedStockCards');

    const currentCommandesCards = document.getElementById('currentCommandesCards');
    const archivedCommandesCards = document.getElementById('archivedCommandesCards');

    const stockDatalist = document.getElementById('stockDatalist');
    const clearJournalBtn = document.getElementById('clearJournalBtn');

    // Modale sélection matériel (formulaire inter)
    const materielSelectionModal = document.getElementById('materielSelectionModal');
    const openMaterielSelectionModalBtn = document.getElementById('openMaterielSelectionModalBtn');
    const materielSearchModalInput = document.getElementById('materielSearchModalInput');
    const materielSelectionList = document.getElementById('materielSelectionList');
    const manualMaterielNameModalInput = document.getElementById('manualMaterielNameModal');
    const manualMaterielQtyModalInput = document.getElementById('manualMaterielQtyModal');
    const addManualMaterielFromModalBtn = document.getElementById('addManualMaterielFromModalBtn');
    const confirmMaterielSelectionBtn = document.getElementById('confirmMaterielSelectionBtn');
    const cancelMaterielSelectionBtn = document.getElementById('cancelMaterielSelectionBtn');
    
    // Modale ajout commande manuelle
    const addManualCommandModal = document.getElementById('addManualCommandModal');
    const openAddManualCommandModalBtn = document.getElementById('openAddManualCommandModalBtn'); // Bouton Desktop
    const newCommandMaterialNameModalInput = document.getElementById('newCommandMaterialNameModal');
    const newCommandQuantityModalInput = document.getElementById('newCommandQuantityModal');
    const saveNewManualCommandBtn = document.getElementById('saveNewManualCommandBtn');
    const fabAddManualCommand = document.getElementById('fabAddManualCommand'); // FAB Mobile

    // Modale ajout article stock
    const addStockItemModal = document.getElementById('addStockItemModal');
    const openAddStockItemModalBtn = document.getElementById('openAddStockItemModalBtn'); // Bouton Desktop
    const newUnifiedStockItemNameModalInput = document.getElementById('newUnifiedStockItemNameModal');
    const newUnifiedStockItemQtyModalInput = document.getElementById('newUnifiedStockItemQtyModal');
    const newUnifiedStockTargetModalSelect = document.getElementById('newUnifiedStockTargetModal');
    const saveNewStockItemBtn = document.getElementById('saveNewStockItemBtn');
    const fabAddStockItem = document.getElementById('fabAddStockItem'); // FAB Mobile
    
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
            dialog.message.textContent = options.message || '';
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
            const firstTab = isPharmacyAuthenticated ? pharmacyNavUl.querySelector('.list') : mainNavUl.querySelector('.list');
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
        if (pharmacySearchBox) pharmacySearchBox.classList.remove('mobile-visible'); // Fermer la recherche mobile en changeant de vue

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
                    if (isPharmacyAuthenticated && window.innerWidth <= 768) fabAddStockItem.style.display = 'block';
                    break;
                case 'commandes-view':
                    displayCommandes();
                     if (isPharmacyAuthenticated && window.innerWidth <= 768) fabAddManualCommand.style.display = 'block';
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
        if (mobileSearchIcon) mobileSearchIcon.style.display = 'none';
        if (pharmacySearchBox && !pharmacySearchBox.classList.contains('mobile-visible')) { // Ne pas cacher si volontairement ouvert
             // pharmacySearchBox.classList.remove('mobile-visible'); // Géré dans updateActiveView
        }


        let targetIdSuffix = activeViewId.replace('-view', '');
        let showPharmacySearchGroup = false;
    
        if (isPharmacyAuthenticated) {
            globalHeader.classList.add('pharmacy-mode');
            document.body.classList.add('pharmacy-active-padding'); // Pour ajuster le padding-top du body

            const pharmacySearchRelevantViews = ['reappro', 'commandes', 'stock-unified', 'pharmacy-archives', 'journal'];
            if (pharmacySearchRelevantViews.includes(targetIdSuffix)) {
                if (window.innerWidth <= 768) { // Mobile pharmacie
                    if (mobileSearchIcon) mobileSearchIcon.style.display = 'flex';
                    // La search-box pharmacie elle-même (pharmacySearchBox) est gérée par l'icône
                    // On s'assure que `pharmacySearchInput` est bien celui utilisé pour filtrer.
                } else { // Desktop pharmacie
                    showPharmacySearchGroup = true;
                }
                targetIdSuffix = 'pharmacy'; // Pour s'assurer que pharmacySearchInput est utilisé
            } else {
                targetIdSuffix = 'none'; // Pas de recherche pour les autres vues (ex: form-view pharma)
            }
        } else { // Mode Pompier
            globalHeader.classList.remove('pharmacy-mode');
            document.body.classList.remove('pharmacy-active-padding');
            if (!['current', 'archive', 'form'].includes(targetIdSuffix)) {
                targetIdSuffix = 'none';
            }
             if (targetIdSuffix === 'form') { 
                 targetIdSuffix = 'none'; 
            }
        }
            
        const targetGroup = document.getElementById(`header-controls-${targetIdSuffix}`);
        if (targetGroup) {
            if (isPharmacyAuthenticated && window.innerWidth <= 768 && targetIdSuffix === 'pharmacy') {
                // Sur mobile pharmacie, le groupe de recherche pharmacie n'est pas rendu visible directement,
                // seule l'icône l'est. La search-box est affichée/cachée via JS.
            } else {
                targetGroup.classList.add('visible');
            }
        }
        if (showPharmacySearchGroup) { // Pour desktop pharmacie, s'assurer que le bon groupe est visible
            const pharmaSearchGroup = document.getElementById('header-controls-pharmacy');
            if (pharmaSearchGroup) pharmaSearchGroup.classList.add('visible');
        }
    }


    function updatePharmacyHeaderSubNav(activeViewId) {
        pharmacyHeaderSubnavContainer.innerHTML = ''; 
        pharmacyHeaderSubnavContainer.style.display = 'none'; 
        
        const desktopSubNavCommandes = document.querySelector('#commandes-view .desktop-sub-nav');
        const desktopSubNavStock = document.querySelector('#stock-unified-view .desktop-sub-nav');

        // Par défaut, les sub-navs dans les vues sont visibles (seront cachées si header subnav prend le relais)
        if(desktopSubNavCommandes) desktopSubNavCommandes.style.display = 'flex';
        if(desktopSubNavStock) desktopSubNavStock.style.display = 'flex';


        if (!isPharmacyAuthenticated) {
            // globalHeader.classList.remove('pharmacy-mode'); // Géré par updateHeaderControls
            return;
        }
        
        // globalHeader.classList.add('pharmacy-mode'); // Géré par updateHeaderControls

        const isDesktopOrLargeTablet = window.innerWidth > 768; // Seuil pour cacher les subnavs de vue

        if (activeViewId === 'commandes-view') {
            pharmacyHeaderSubnavContainer.style.display = 'flex';
            if(desktopSubNavCommandes && isDesktopOrLargeTablet) desktopSubNavCommandes.style.display = 'none';
            
            pharmacyHeaderSubnavContainer.innerHTML = `
                <button class="header-sub-nav-btn ${currentCommandView === 'current' ? 'active' : ''}" data-command-view="current">En cours</button>
                <button class="header-sub-nav-btn ${currentCommandView === 'archived' ? 'active' : ''}" data-command-view="archived">Archivées</button>
            `;
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
            if(desktopSubNavStock && isDesktopOrLargeTablet) desktopSubNavStock.style.display = 'none';
            
            pharmacyHeaderSubnavContainer.innerHTML = `
                <button class="header-sub-nav-btn ${currentStockSubView === 'pompier' ? 'active' : ''}" data-stock-type="pompier">Stock VSAV</button>
                <button class="header-sub-nav-btn ${currentStockSubView === 'pharmacie' ? 'active' : ''}" data-stock-type="pharmacie">Stock Pharmacie</button>
            `;
            pharmacyHeaderSubnavContainer.querySelectorAll('.header-sub-nav-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    pharmacyHeaderSubnavContainer.querySelectorAll('.header-sub-nav-btn').forEach(b => b.classList.remove('active'));
                    e.currentTarget.classList.add('active');
                    currentStockSubView = e.currentTarget.dataset.stockType;
                    displayUnifiedStockView();
                });
            });
        } else {
             // Ne rien faire si pas de subnav spécifique pour la vue
        }
    }


    // --- LOGIQUE PHARMACIE (Login / Logout) ---
    function togglePharmacyMode(isEntering) {
        isPharmacyAuthenticated = isEntering;
        mainNavUl.style.display = isEntering ? 'none' : 'flex';
        pharmacyNavUl.style.display = isEntering ? 'flex' : 'none';
        topLoginBtn.style.display = isEntering ? 'none' : 'flex';
        headerLogoutBtn.style.display = isEntering ? 'flex' : 'none';
        
        if (mobileSearchIcon) mobileSearchIcon.style.display = 'none'; 
        if (pharmacySearchBox) pharmacySearchBox.classList.remove('mobile-visible');
        
        const addCmdBtnContainerDesktop = document.getElementById('manual-command-actions-section');
        const addStockBtnContainerDesktop = document.getElementById('unifiedStockModalActions');

        if (addCmdBtnContainerDesktop) addCmdBtnContainerDesktop.style.display = isEntering ? 'flex' : 'none';
        if (addStockBtnContainerDesktop) addStockBtnContainerDesktop.style.display = isEntering ? 'flex' : 'none';
        
        fabAddManualCommand.style.display = 'none';
        fabAddStockItem.style.display = 'none';

        viewContainers.forEach(v => v.classList.remove('visible'));
        pharmacyHeaderSubnavContainer.innerHTML = ''; 
        pharmacyHeaderSubnavContainer.style.display = 'none';
        globalHeader.classList.toggle('pharmacy-mode', isEntering);
        document.body.classList.toggle('pharmacy-active-padding', isEntering);


        if (isEntering) {
            currentUser = sessionStorage.getItem('pharmaUserName') || "Pharmacien";
            const pharmacyDefaultTab = pharmacyNavUl.querySelector('.list[data-view="reappro-view"]');
            if (pharmacyDefaultTab) setActiveTab(pharmacyDefaultTab, pharmacyNavUl);
        } else {
            currentUser = sessionStorage.getItem('userName') || "Pompier";
            const mainDefaultTab = mainNavUl.querySelector('.list[data-view="current-view"]');
            if (mainDefaultTab) setActiveTab(mainDefaultTab, mainNavUl);
            document.querySelectorAll('.desktop-sub-nav').forEach(nav => nav.style.display = 'flex');
        }
        
        const activeNav = isEntering ? pharmacyNavUl : mainNavUl;
        const activeTab = activeNav.querySelector(".list.active");
        if (activeTab) {
            // updateHeaderControls et updatePharmacyHeaderSubNav sont appelés dans updateActiveView
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
            } else { 
                if (document.getElementById('current-view')?.classList.contains('visible') && searchableInterventionText.includes(currentSearchTerm)) {
                    filteredCurrent.push(data);
                }
                 if (document.getElementById('reappro-view')?.classList.contains('visible') && 
                     searchableInterventionText.includes(pharmacyGlobalSearchTerm) && 
                     inter.pharmacyStatus !== 'Traité') {
                    if (!filteredPharmacyReappro.find(item => item.id === id)) { 
                        filteredPharmacyReappro.push(data);
                    }
                }
            }
        });
    
        renderPaginatedView(filteredCurrent, currentInterventionsCards, 'currentCardsPagination', currentPage_current, createInterventionCard, 'current');
        renderPaginatedView(filteredArchive, archivedInterventionsCards, 'archivePagination', currentPage_archive, createArchivedInterventionCard, 'archive');
        renderPaginatedView(filteredPharmacyReappro, pharmacyInterventionsCards, 'pharmacyPagination', currentPage_pharmacy, createPharmacyCard, 'pharmacy');
        renderPaginatedView(filteredPharmacyArchive, pharmacyArchivedInterventionsCards, 'pharmacyArchivePagination', currentPage_pharmacy_archive, createPharmacyCard, 'pharmacy_archive');
    
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
                ? `<button class="btn-primary manage-material-btn" data-id="${id}" title="Gérer le matériel et clôturer l'intervention"><i class="bi bi-box-seam"></i> Gérer & Clôturer</button>`
                : `<button class="btn-primary close-intervention-btn" data-id="${id}" title="Clôturer l'intervention (sans matériel)"><i class="bi bi-check-circle"></i> Clôturer</button>`
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
            <div class="card-header"><h4><i class="bi bi-hash"></i>${inter.numero_intervention}</h4><span class="status-badge badge-termine">Archivé</span></div>
            <div class="card-body">
                <div class="card-item"><i class="bi bi-person-fill"></i><span>${inter.nom || 'N/A'}</span></div>
                <div class="card-item"><i class="bi bi-calendar-x"></i><span>${formatDate(inter.date)} à ${inter.heure}</span></div>
            </div>
            <div class="card-footer">
                <div class="card-footer-actions">
                    <button class="btn-icon-footer view-btn" title="Voir les détails"><i class="bi bi-eye-fill"></i></button>
                    <button class="btn-icon-footer unarchive-btn" title="Désarchiver"><i class="bi bi-box-arrow-up"></i></button>
                    <button class="btn-icon-footer delete-btn" title="Supprimer"><ion-icon name="trash-outline"></ion-icon></button>
                </div>
            </div>
        </div>`;
    }

    function createPharmacyCard(inter) {
        const { id, numero_intervention, date, pharmacyStatus } = inter;
        let statusText, statusClass;
        switch(pharmacyStatus) {
            case 'En cours de traitement':
                statusText = 'En cours';
                statusClass = 'badge-en-cours-de-traitement';
                break;
            case 'Traité':
                 statusText = 'Traité';
                 statusClass = 'badge-traite';
                 break;
            default: 
                statusText = 'À traiter';
                statusClass = 'badge-a-traiter';
        }

        return `
        <div class="intervention-card pharmacy-card" data-id="${id}">
            <div class="card-header">
                <h4><i class="bi bi-hash"></i>${numero_intervention}</h4>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
            <div class="card-body">
                <div class="card-item"><i class="bi bi-calendar-check"></i> <span>Intervention du ${formatDate(date)}</span></div>
                 <div class="card-item"><i class="bi bi-person"></i> <span>Par: ${inter.nom || 'N/A'}</span></div>
            </div>
            <div class="card-footer">
                ${(pharmacyStatus !== 'Traité') ? `<button class="btn-primary process-material-btn" data-id="${id}" title="Traiter le matériel"><i class="bi bi-arrow-repeat"></i> Traiter</button>` : ''}
                <div class="card-footer-actions">
                    <button class="btn-icon-footer view-btn" title="Voir les détails"><i class="bi bi-eye-fill"></i></button>
                </div>
            </div>
        </div>`;
    }
    
    // --- GESTIONNAIRES D'ÉVÉNEMENTS ---
    function addCardEventListeners() {
        document.querySelectorAll('.view-btn').forEach(btn => btn.addEventListener('click', (e) => showDetailsModal(e.currentTarget.closest('[data-id]').dataset.id)));
        document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', (e) => editIntervention(e.currentTarget.closest('[data-id]').dataset.id)));
        document.querySelectorAll('.unarchive-btn').forEach(btn => btn.addEventListener('click', (e) => unarchiveIntervention(e.currentTarget.closest('[data-id]').dataset.id)));
        document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', (e) => deleteIntervention(e.currentTarget.closest('[data-id]').dataset.id)));
        document.querySelectorAll('.manage-material-btn').forEach(btn => btn.addEventListener('click', (e) => openMaterialManagementModal(e.currentTarget.dataset.id, 'firefighter')));
        document.querySelectorAll('.close-intervention-btn').forEach(btn => btn.addEventListener('click', (e) => closeInterventionDirectly(e.currentTarget.dataset.id)));
        document.querySelectorAll('.process-material-btn').forEach(btn => btn.addEventListener('click', (e) => openMaterialManagementModal(e.currentTarget.dataset.id, 'pharmacy')));
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
            materiels: materiels.reduce((obj, mat) => ({ ...obj, [mat.name]: { quantity_used: mat.qty, status: 'Non défini' } }), {}),
            archived: false, 
            pharmacyStatus: (materiels.length > 0) ? 'En attente' : 'Traité', 
        };
        if (materiels.length === 0 && interventionData.statut === "Terminé") {
            interventionData.archived = true;
        }

        const dbRef = id ? database.ref('interventions/' + id) : database.ref('interventions').push();
        const timestamp = firebase.database.ServerValue.TIMESTAMP;
        if (id) {
            interventionData.updatedAt = timestamp;
        } else {
            interventionData.createdAt = timestamp;
            interventionData.updatedAt = timestamp;
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
            showMessage("Les interventions archivées ne peuvent pas être modifiées par les pompiers.", "warning");
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
        const formTab = mainNavUl.querySelector('.list[data-view="form-view"]');
        if(formTab) setActiveTab(formTab, mainNavUl);
    }

    async function unarchiveIntervention(id) {
        const inter = allInterventions[id];
        if (!inter) return;
        const confirmed = await showCustomDialog({
            title: "Désarchiver l'intervention",
            message: `Voulez-vous vraiment désarchiver l'intervention n°${inter.numero_intervention} ? Le statut passera à "En cours" et le stock utilisé (si réapprovisionné depuis VSAV) sera restitué.`
        });

        if (confirmed) {
            const updates = {
                archived: false,
                statut: 'En cours', 
                pharmacyStatus: (inter.materiels && Object.keys(inter.materiels).length > 0) ? 'À traiter' : 'Traité'
            };
            let stockLogEntries = [];
            if (inter.materiels) {
                for (const matName in inter.materiels) {
                    const details = inter.materiels[matName];
                    if (details.reappro_status === 'Réapprovisionné') {
                        const qtyUsed = details.quantity_used || 0;
                        if (pompierStock[matName] && qtyUsed > 0) { 
                            await database.ref(`stocks/pompier/${matName}/quantity`).set(firebase.database.ServerValue.increment(qtyUsed));
                            stockLogEntries.push(`+${qtyUsed} de '${matName}' (Stock VSAV)`);
                        }
                    }
                    updates[`materiels/${matName}/reappro_status`] = ""; 
                    updates[`materiels/${matName}/pharma_status`] = "";
                    updates[`materiels/${matName}/pharma_comment`] = "";
                    updates[`materiels/${matName}/quantity_missing`] = 0; 
                }
            }
            await database.ref(`interventions/${id}`).update(updates);
            let logDetails = `Intervention n°${inter.numero_intervention}`;
            if(stockLogEntries.length > 0) {
                logDetails += `. Stock restitué: ${stockLogEntries.join(', ')}`;
            }
            addLogEntry('Désarchivage', `${logDetails} par ${currentUser}`);
            showMessage('Intervention désarchivée et stock (si applicable) restitué.', 'success');
        }
    }

    async function deleteIntervention(id) {
        const password = await showCustomDialog({
            title: 'Suppression Définitive',
            message: 'Entrez le mot de passe administrateur.',
            type: 'prompt', inputType: 'password'
        });
        if (password === DELETE_PASSWORD) {
            const interNum = allInterventions[id]?.numero_intervention || id;
            database.ref('interventions/' + id).remove();
            addLogEntry('Suppression Interv.', `Intervention n°${interNum} par ${currentUser}`);
            showMessage('Intervention supprimée.', 'success');
        } else if (password !== null) {
            showMessage('Mot de passe incorrect.', 'error');
        }
    }
    
    async function closeInterventionDirectly(id) {
        const inter = allInterventions[id];
        if (!inter) return;
        const confirmed = await showCustomDialog({
            title: "Clôturer l'intervention",
            message: `Aucun matériel n'est associé à cette intervention ou ils ont été gérés. Clôturer et archiver l'intervention n°${inter.numero_intervention} ?`
        });
        if (confirmed) {
            const updates = {
                archived: true,
                statut: 'Terminé',
                pharmacyStatus: 'Traité' 
            };
            await database.ref(`interventions/${id}`).update(updates);
            addLogEntry('Intervention Clôturée', `n°${inter.numero_intervention} archivée directement par ${currentUser}.`);
            showMessage('Intervention clôturée et archivée.', 'success');
        }
    }

    // --- LOGIQUE DES MODALS ---
    function showDetailsModal(id) {
        const inter = allInterventions[id]; if (!inter) return;
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
                     <p class="detail-item"><i class="bi bi-activity"></i><strong>Statut Pompier:</strong> <span><span class="status-badge badge-${inter.archived ? 'termine' : (inter.statut || 'en-cours').toLowerCase().replace(/\s/g, '-')}">${inter.archived ? 'Archivé' : inter.statut}</span></span></p>
                     <p class="detail-item"><i class="bi bi-bandaid"></i><strong>Statut Pharmacie:</strong> <span><span class="status-badge badge-${(inter.pharmacyStatus || 'En attente').toLowerCase().replace(/\s/g, '-')}">${inter.pharmacyStatus || 'En attente'}</span></span></p>
                </div>
                 <div class="detail-section full-width"><h4><i class="bi bi-card-text"></i> Commentaire Intervention</h4>
                    <p>${inter.commentaire || 'Aucun commentaire.'}</p>
                </div>
                <div class="detail-section full-width"><h4><i class="bi bi-tools"></i> Matériels Utilisés</h4> 
                        <div>${Object.entries(inter.materiels || {}).map(([name, d]) => `
                            <div class="detail-material-item">
                                <strong>${name} (Qté: ${d.quantity_used || 'N/A'})</strong><br>
                                <small>Statut Pompier (Réappro VSAV): ${d.reappro_status || 'Non défini'}${d.reappro_status === 'Manquant' ? ` (Manquant: ${d.quantity_missing || 'N/A'})` : ''}</small><br>
                                <small>Statut Pharmacie (Traitement): ${d.pharma_status || 'Non traité'}</small><br>
                                <small><i>Commentaire Pompier: ${d.comment || 'Aucun'}</i></small><br>
                                <small><i>Commentaire Pharmacie: ${d.pharma_comment || 'Aucun'}</i></small>
                            </div>`).join('') || '<p>Aucun matériel utilisé.</p>'}
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
                    database.ref(`interventions/${interId}`).update({ pharmacyStatus: 'Traité' });
                    addLogEntry('Traitement Pharmacie', `Inter n°${inter.numero_intervention} marquée traitée (aucun matériel) par ${currentUser}.`);
                    showMessage("Intervention marquée comme traitée (aucun matériel).", 'success');
                } else {
                    showMessage("Aucun matériel à traiter pour cette intervention.", "info");
                }
            }
            return;
        }
        const listContainer = document.getElementById('material-management-list');
        document.getElementById('material-modal-inter-num').textContent = `n°${inter.numero_intervention}`;
        document.getElementById('save-material-btn').textContent = userType === 'firefighter' ? 'Enregistrer et Clôturer Intervention' : 'Enregistrer Traitement Pharmacie';
        
        const headerHtml = userType === 'firefighter' 
            ? `<div class="material-management-item header firefighter-view"><strong>Matériel</strong><strong>Qté Utilisée</strong><strong>Statut Réappro. VSAV</strong><strong>Commentaire Pompier</strong></div>`
            : `<div class="material-management-item header pharmacy-view"><strong>Matériel</strong><strong>Statut Traitement Pharmacie</strong><strong>Commentaire Pharmacie</strong></div>`;
        const itemsHtml = Object.entries(inter.materiels).map(([matName, details]) => {
            if (userType === 'firefighter') {
                return `
                <div class="material-management-item firefighter-view" data-mat-name="${matName}">
                    <span>${matName}</span>
                    <input type="number" class="mat-qty-used" value="${details.quantity_used || 1}" min="0" readonly title="Quantité utilisée initialement">
                    <div>
                        <select class="mat-reappro-status">
                            <option value="">Choisir statut...</option>
                            <option value="Réapprovisionné" ${details.reappro_status === 'Réapprovisionné' ? 'selected' : ''}>Réapprovisionné (depuis VSAV)</option>
                            <option value="Manquant" ${details.reappro_status === 'Manquant' ? 'selected' : ''}>Manquant (à commander)</option>
                            <option value="Pas besoin" ${details.reappro_status === 'Pas besoin' ? 'selected' : ''}>Pas besoin de réappro.</option>
                        </select>
                        <input type="number" class="missing-qty-input ${details.reappro_status === 'Manquant' ? 'visible' : ''}" placeholder="Qté manquante" value="${details.quantity_missing || details.quantity_used || 1}" min="1">
                    </div>
                    <input type="text" class="mat-comment" value="${details.comment || ''}" placeholder="Commentaire (optionnel)...">
                </div>`;
            } else { 
                 const pompierReapproStatus = details.reappro_status || "Non défini";
                 const pompierMissingQty = details.quantity_missing || 0;
                 let materialContext = `Utilisé: ${details.quantity_used || 0}. Statut VSAV: ${pompierReapproStatus}`;
                 if (pompierReapproStatus === 'Manquant' && pompierMissingQty > 0) {
                     materialContext += ` (Qté manquante VSAV: ${pompierMissingQty})`;
                 }
                return `
                <div class="material-management-item pharmacy-view" data-mat-name="${matName}">
                    <span>${matName} <small>(${materialContext})</small></span>
                    <select class="mat-pharma-status">
                         <option value="">Choisir statut...</option>
                         <option value="En commande" ${details.pharma_status === 'En commande' ? 'selected' : ''}>En commande (via Pharmacie)</option>
                         <option value="Réapprovisionné" ${details.pharma_status === 'Réapprovisionné' ? 'selected' : ''}>Réapprovisionné (depuis stock Pharmacie vers VSAV)</option>
                         <option value="Pas besoin" ${details.pharma_status === 'Pas besoin' ? 'selected' : ''}>Pas besoin de traitement/commande</option>
                    </select>
                    <input type="text" class="mat-pharma-comment" value="${details.pharma_comment || ''}" placeholder="Commentaire pharmacie...">
                </div>`;
            }
        }).join('');
        listContainer.innerHTML = headerHtml + itemsHtml;
        document.getElementById('save-material-btn').onclick = () => saveMaterialData(interId, userType);
        listContainer.querySelectorAll('.mat-reappro-status').forEach(select => {
            select.addEventListener('change', e => {
                const missingQtyInput = e.target.closest('div').querySelector('.missing-qty-input');
                missingQtyInput.classList.toggle('visible', e.target.value === 'Manquant');
                if (e.target.value !== 'Manquant') {
                    missingQtyInput.value = ''; 
                } else {
                    if(!missingQtyInput.value) {
                        const qtyUsed = parseInt(e.target.closest('.material-management-item').querySelector('.mat-qty-used').value, 10) || 1;
                        missingQtyInput.value = qtyUsed;
                    }
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
        let allPharmacyInputsValid = true; 
        let isPharmacyProcessingAnyItem = false; 

        document.querySelectorAll('#material-management-list .material-management-item:not(.header)').forEach(item => {
            const matName = item.dataset.matName;
            const interventionMaterialDetails = intervention.materiels[matName]; 
            if (userType === 'firefighter') {
                const reappro_status = item.querySelector('.mat-reappro-status').value;
                const comment = item.querySelector('.mat-comment').value;
                let quantity_missing = 0;
                if (reappro_status === 'Manquant') {
                    const missingInput = item.querySelector('.missing-qty-input');
                    quantity_missing = parseInt(missingInput.value, 10);
                    if (isNaN(quantity_missing) || quantity_missing <= 0) {
                        allFirefighterInputsValid = false;
                        missingInput.style.borderColor = 'red'; 
                    } else {
                        missingInput.style.borderColor = ''; 
                    }
                }
                updates[`materiels/${matName}/reappro_status`] = reappro_status;
                updates[`materiels/${matName}/quantity_missing`] = quantity_missing; 
                updates[`materiels/${matName}/comment`] = comment;
                if (!reappro_status) allFirefighterInputsValid = false; 
                const qtyUsedOriginal = interventionMaterialDetails?.quantity_used || 0;
                if (reappro_status === 'Réapprovisionné') { 
                    if (pompierStock[matName] && qtyUsedOriginal > 0) {
                        database.ref(`stocks/pompier/${matName}/quantity`).set(firebase.database.ServerValue.increment(-qtyUsedOriginal));
                        addLogEntry('Stock Pompier (Sortie)', `-${qtyUsedOriginal} de '${matName}' (Réappro VSAV pour inter n°${intervention.numero_intervention}) par ${currentUser}`);
                    }
                } else if (reappro_status === 'Manquant' && quantity_missing > 0) {
                    database.ref('commandes').push().set({
                        interventionId: interId,
                        interventionNum: intervention.numero_intervention,
                        materialName: matName,
                        quantityMissing: quantity_missing, 
                        status: 'À commander', 
                        createdAt: firebase.database.ServerValue.TIMESTAMP,
                        requestedBy: currentUser, 
                        archived: false
                    });
                     addLogEntry('Demande Commande (Pompier)', `${quantity_missing} x '${matName}' pour inter n°${intervention.numero_intervention} par ${currentUser}`);
                }
            } else { 
                 const pharma_status = item.querySelector('.mat-pharma-status').value;
                 const pharma_comment = item.querySelector('.mat-pharma-comment').value;
                 updates[`materiels/${matName}/pharma_status`] = pharma_status;
                 updates[`materiels/${matName}/pharma_comment`] = pharma_comment;
                 if (pharma_status) { 
                    isPharmacyProcessingAnyItem = true;
                 } else { 
                    if (interventionMaterialDetails) allPharmacyInputsValid = false; 
                 }
                 const qtyToHandlePharmacie = (interventionMaterialDetails.reappro_status === 'Manquant' && interventionMaterialDetails.quantity_missing > 0)
                                          ? interventionMaterialDetails.quantity_missing 
                                          : (interventionMaterialDetails.quantity_used || 0); 
                 if (pharma_status === 'En commande' && qtyToHandlePharmacie > 0) {
                    database.ref('commandes').push().set({
                        interventionId: interId,
                        interventionNum: intervention.numero_intervention,
                        materialName: matName,
                        quantityMissing: qtyToHandlePharmacie, 
                        status: 'En commande', 
                        createdAt: firebase.database.ServerValue.TIMESTAMP,
                        orderedBy: currentUser, 
                        archived: false
                    });
                    addLogEntry('Création Commande (Pharma)', `${qtyToHandlePharmacie} x '${matName}' pour inter n°${intervention.numero_intervention} par ${currentUser}`);
                 } else if (pharma_status === 'Réapprovisionné' && qtyToHandlePharmacie > 0) {
                    if (pharmaStock[matName]) { 
                        database.ref(`stocks/pharmacie/${matName}/quantity`).set(firebase.database.ServerValue.increment(-qtyToHandlePharmacie));
                        addLogEntry('Stock Pharmacie (Sortie)', `-${qtyToHandlePharmacie} de '${matName}' pour réappro VSAV (Inter n°${intervention.numero_intervention}) par ${currentUser}`);
                    }
                    if (pompierStock[matName]) {
                        database.ref(`stocks/pompier/${matName}/quantity`).set(firebase.database.ServerValue.increment(qtyToHandlePharmacie));
                    } else { 
                        database.ref(`stocks/pompier/${matName}`).set({ quantity: qtyToHandlePharmacie, notes: 'Ajout via réappro pharmacie (Inter)' });
                    }
                    addLogEntry('Stock Pompier (Entrée)', `+${qtyToHandlePharmacie} de '${matName}' via réappro pharmacie (Inter n°${intervention.numero_intervention}) par ${currentUser}`);
                 }
            }
        });

        if (userType === 'firefighter') {
            if (!allFirefighterInputsValid) return showMessage("Veuillez définir un statut pour tous les matériels et une quantité valide si 'Manquant'.", 'error');
            updates['statut'] = 'Terminé'; 
            updates['archived'] = true;   
            updates['pharmacyStatus'] = 'À traiter'; 
            addLogEntry('Intervention Clôturée', `n°${intervention.numero_intervention} archivée, matériel géré par ${currentUser}.`);
        } else { 
            if (!allPharmacyInputsValid && isPharmacyProcessingAnyItem) { 
                 return showMessage("Veuillez définir un statut pour tous les matériels listés qui nécessitent un traitement.", 'error');
            }
            if (isPharmacyProcessingAnyItem) { 
                let allItemsFullyProcessedByPharmacy = true;
                Object.keys(intervention.materiels).forEach(matKey => {
                    const finalMatStatus = updates[`materiels/${matKey}/pharma_status`] || intervention.materiels[matKey].pharma_status;
                    if(!finalMatStatus || (finalMatStatus !== 'Réapprovisionné' && finalMatStatus !== 'Pas besoin')) {
                       allItemsFullyProcessedByPharmacy = false;
                    }
                });
                 if (allItemsFullyProcessedByPharmacy) {
                    updates['pharmacyStatus'] = 'Traité';
                } else {
                    updates['pharmacyStatus'] = 'En cours de traitement';
                }
            }
            addLogEntry('Traitement Pharmacie', `Mise à jour matériel pour inter n°${intervention.numero_intervention} par ${currentUser}`);
        }
        
        await interRef.update(updates);
        showMessage("Données du matériel enregistrées.", 'success');
        materialManagementModal.classList.remove('visible');
    }
    
    // --- GESTION DES STOCKS UNIFIÉE ---
    function displayUnifiedStockView() {
        const addStockBtnContainerDesktop = document.getElementById('unifiedStockModalActions');
        if (addStockBtnContainerDesktop) {
            addStockBtnContainerDesktop.style.display = isPharmacyAuthenticated ? 'flex' : 'none';
        }
        setupStockCardCreation(currentStockSubView, unifiedStockCards);
    }

    function setupStockCardCreation(viewType, cardsContainer) {
        const stockData = viewType === 'pompier' ? pompierStock : pharmaStock;
        const searchTerm = (pharmacySearchInput.value || '').toLowerCase(); 
        cardsContainer.innerHTML = '';
        const filteredStock = Object.entries(stockData)
            .filter(([name]) => name.toLowerCase().includes(searchTerm))
            .sort(([a], [b]) => a.localeCompare(b));

        if (filteredStock.length === 0) {
            cardsContainer.innerHTML = `<p class="empty-view-message">Le stock ${viewType === 'pompier' ? 'VSAV' : 'Pharmacie'} est vide ${searchTerm ? 'pour cette recherche' : ''}.</p>`;
        }

        filteredStock.forEach(([name, details]) => {
            const transferBtnHtml = viewType === 'pharmacie' && isPharmacyAuthenticated ? `
                <button class="btn-icon-card transfer-stock-btn" data-name="${name}" title="Transférer vers Stock VSAV">
                    <ion-icon name="swap-horizontal-outline"></ion-icon>
                </button>` : '';
            const editControls = isPharmacyAuthenticated ? `
                <button class="btn-icon-card save-stock-btn" title="Sauvegarder les modifications">
                    <ion-icon name="checkmark-circle-outline"></ion-icon>
                </button>
                <button class="btn-icon-card delete-stock-btn" title="Supprimer l'article des deux stocks">
                    <ion-icon name="trash-outline"></ion-icon>
                </button>
            ` : '';
            const cardHtml = `
            <div class="stock-card" data-name="${name}">
                <div class="stock-card-header"><h3>${name}</h3></div>
                <div class="stock-card-body">
                    <div class="form-group-card">
                        <label>Quantité</label>
                        <input type="number" class="stock-quantity-input" value="${details.quantity || 0}" ${!isPharmacyAuthenticated ? 'readonly' : ''}>
                    </div>
                    <div class="form-group-card">
                        <label>Notes</label>
                        <input type="text" class="stock-notes-input" value="${details.notes || ''}" placeholder="Aucune note..." ${!isPharmacyAuthenticated ? 'readonly' : ''}>
                    </div>
                </div>
                ${isPharmacyAuthenticated ? `<div class="stock-card-footer">${transferBtnHtml}${editControls}</div>` : ''}
            </div>`;
            cardsContainer.innerHTML += cardHtml;
        });

        if(isPharmacyAuthenticated) {
            cardsContainer.querySelectorAll('.save-stock-btn').forEach(btn => btn.onclick = (e) => {
                const card = e.currentTarget.closest('.stock-card');
                const name = card.dataset.name;
                const quantity = parseInt(card.querySelector('.stock-quantity-input').value, 10);
                const notes = card.querySelector('.stock-notes-input').value;
                if (isNaN(quantity) || quantity < 0) return showMessage("Quantité invalide.", "error");
                database.ref(`stocks/${viewType}/${name}`).update({ quantity, notes });
                addLogEntry(`Stock ${viewType}`, `Mise à jour de '${name}' (Qté: ${quantity}) par ${currentUser}`);
                showMessage(`Article "${name}" sauvegardé.`, 'success');
            });
            cardsContainer.querySelectorAll('.delete-stock-btn').forEach(btn => btn.onclick = async (e) => {
                const name = e.currentTarget.closest('.stock-card').dataset.name;
                if (await showCustomDialog({ title: 'Supprimer article', message: `Supprimer "${name}" définitivement des deux stocks (VSAV et Pharmacie) ? Cette action est irréversible.` })) {
                    await database.ref(`stocks/pompier/${name}`).remove();
                    await database.ref(`stocks/pharmacie/${name}`).remove();
                    addLogEntry(`Stock Général`, `Suppression de '${name}' des deux stocks par ${currentUser}`);
                    showMessage(`Article "${name}" supprimé des deux stocks.`, 'success');
                }
            });
            if (viewType === 'pharmacie') {
                cardsContainer.querySelectorAll('.transfer-stock-btn').forEach(btn => btn.onclick = (e) => {
                    const name = e.currentTarget.closest('.stock-card').dataset.name;
                    handleStockTransfer(name);
                });
            }
        }
    }
    
    async function handleStockTransfer(itemName) {
        const currentPharmaQty = pharmaStock[itemName]?.quantity || 0;
        if (currentPharmaQty <= 0) return showMessage(`Le stock de "${itemName}" dans la pharmacie est vide.`, 'error');
        const qtyToTransferStr = await showCustomDialog({
            title: `Transfert de "${itemName}"`,
            message: `Stock Pharmacie actuel: ${currentPharmaQty}. Entrez la quantité à transférer vers le stock VSAV.`,
            type: 'prompt', inputType: 'number', defaultValue: '1'
        });
        if (qtyToTransferStr === null) return; 
        const qty = parseInt(qtyToTransferStr, 10);
        if (isNaN(qty) || qty <= 0) return showMessage('Quantité invalide.', 'error');
        if (qty > currentPharmaQty) return showMessage('La quantité à transférer ne peut pas dépasser le stock pharmacie actuel.', 'error');
        try {
            await database.ref(`stocks/pharmacie/${itemName}/quantity`).set(firebase.database.ServerValue.increment(-qty));
            const pompierItemRef = database.ref(`stocks/pompier/${itemName}`);
            const pompierItemSnapshot = await pompierItemRef.once('value');
            if (pompierItemSnapshot.exists()) {
                await pompierItemRef.child('quantity').set(firebase.database.ServerValue.increment(qty));
            } else {
                await pompierItemRef.set({ quantity: qty, notes: 'Transféré depuis pharmacie' });
            }
            addLogEntry('Transfert Stock', `${qty} x '${itemName}' de Pharmacie vers VSAV par ${currentUser}.`);
            showMessage(`Transfert de ${qty} x "${itemName}" effectué.`, 'success');
        } catch (error) {
            showMessage(`Erreur lors du transfert : ${error.message}`, 'error');
            addLogEntry('Erreur Transfert Stock', `Échec transfert ${itemName}: ${error.message}`);
        }
    }

    function handleAddNewStockItemViaModal() {
        const name = newUnifiedStockItemNameModalInput.value.trim();
        const quantity = parseInt(newUnifiedStockItemQtyModalInput.value, 10);
        const targetStock = newUnifiedStockTargetModalSelect.value; 
        if (!name) return showMessage("Le nom de l'article ne peut pas être vide.", "error");
        if (isNaN(quantity) || quantity < 0) return showMessage("La quantité ne peut pas être négative.", "error");
        const combinedStock = { ...pompierStock, ...pharmaStock };
        if (Object.keys(combinedStock).some(existingName => existingName.toLowerCase() === name.toLowerCase())) {
             return showMessage(`L'article "${name}" (ou une forme similaire) existe déjà. Modifiez l'existant.`, "error");
        }
        const updatePompier = {};
        const updatePharmacie = {};
        if (targetStock === 'pompier') {
            updatePompier[`stocks/pompier/${name}`] = { quantity: quantity, notes: 'Nouvel article' };
            updatePharmacie[`stocks/pharmacie/${name}`] = { quantity: 0, notes: 'Nouvel article (via ajout VSAV)' };
        } else { 
            updatePharmacie[`stocks/pharmacie/${name}`] = { quantity: quantity, notes: 'Nouvel article' };
            updatePompier[`stocks/pompier/${name}`] = { quantity: 0, notes: 'Nouvel article (via ajout Pharmacie)' };
        }
        database.ref().update({ ...updatePompier, ...updatePharmacie })
            .then(() => {
                addLogEntry(`Stock Général`, `Création de '${name}' (Initial: ${quantity} dans ${targetStock}) par ${currentUser}`);
                showMessage(`'${name}' ajouté avec ${quantity} unité(s) au stock ${targetStock}.`, 'success');
                newUnifiedStockItemNameModalInput.value = '';
                newUnifiedStockItemQtyModalInput.value = '0';
                addStockItemModal.classList.remove('visible');
            })
            .catch(error => showMessage(`Erreur lors de l'ajout: ${error.message}`, 'error'));
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
            journalTableBody.innerHTML = `<tr><td colspan="4" class="empty-view-message">Aucune entrée ${searchTerm ? 'pour cette recherche' : ''}.</td></tr>`;
            return;
        }
        journalTableBody.innerHTML = filteredLog.map(([, log]) => `
                <tr>
                    <td>${new Date(log.timestamp).toLocaleString('fr-FR', {dateStyle: 'short', timeStyle: 'medium'})}</td>
                    <td>${log.user}</td>
                    <td>${log.action}</td>
                    <td>${log.details}</td>
                </tr>
            `).join('');
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

        } else { 
            container = archivedCommandesCards;
            if (currentCommandesCards) currentCommandesCards.style.display = 'none';
            container.style.display = 'grid';
            isArchivedView = true;
            if (addCmdBtnContainerDesktop) addCmdBtnContainerDesktop.style.display = 'none'; 
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
                            cmd.orderedBy?.toLowerCase().includes(searchTerm) ||
                            cmd.receivedBy?.toLowerCase().includes(searchTerm) ||
                            cmd.stockedBy?.toLowerCase().includes(searchTerm) );
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
            if (isArchivedView) {
                cardHtml = `
                <div class="command-card archived" data-cmd-id="${id}">
                    <div class="command-card-header"><h3>${cmd.materialName}</h3><span class="command-quantity">Qté: ${cmd.quantityMissing}</span></div>
                    <div class="command-card-body">
                        <p class="command-inter-link"><ion-icon name="document-text-outline"></ion-icon>Intervention: ${cmd.interventionNum === 'Commande Manuelle' ? cmd.interventionNum : `<a href="#" data-inter-id="${cmd.interventionId}">${cmd.interventionNum}</a>`}</p>
                        <p>Statut: <span class="status-badge badge-termine">${cmd.status || 'Rangé et Archivé'}</span></p>
                        <div class="command-actors-readonly">
                            <small>Demandé/Commandé par: ${cmd.requestedBy || cmd.orderedBy || 'N/A'}</small>
                            <small>Reçu par: ${cmd.receivedBy || 'N/A'}</small>
                            <small>Rangé par: ${cmd.stockedBy || 'N/A'}</small>
                            <small>Archivé le: ${cmd.archivedAt ? new Date(cmd.archivedAt).toLocaleString('fr-FR') : 'N/A'}</small>
                        </div>
                    </div>
                </div>`;
            } else { 
                cardHtml = `
                <div class="command-card" data-cmd-id="${id}">
                    <div class="command-card-header"><h3>${cmd.materialName}</h3><span class="command-quantity">Qté: ${cmd.quantityMissing}</span></div>
                    <div class="command-card-body">
                        <p class="command-inter-link"><ion-icon name="document-text-outline"></ion-icon>Intervention: ${cmd.interventionNum === 'Commande Manuelle' ? cmd.interventionNum : `<a href="#" data-inter-id="${cmd.interventionId}">${cmd.interventionNum}</a>`}</p>
                        <div class="form-group-card">
                            <label for="cmd-status-${id}">Statut de la commande</label>
                            <select id="cmd-status-${id}" class="cmd-status-select">
                                <option value="À commander" ${cmd.status === 'À commander' ? 'selected' : ''}>À commander</option>
                                <option value="En commande" ${cmd.status === 'En commande' ? 'selected' : ''}>En commande</option>
                                <option value="Reçu" ${cmd.status === 'Reçu' ? 'selected' : ''}>Reçu</option>
                            </select>
                        </div>
                        <div class="command-actors">
                             <input type="text" class="cmd-user-input" data-field="orderedBy" placeholder="Commandé par..." value="${cmd.orderedBy || (cmd.status === 'À commander' && cmd.requestedBy ? cmd.requestedBy : '')}">
                             <input type="text" class="cmd-user-input" data-field="receivedBy" placeholder="Reçu par..." value="${cmd.receivedBy || ''}">
                             <input type="text" class="cmd-user-input" data-field="stockedBy" placeholder="Rangé par..." value="${cmd.stockedBy || ''}">
                        </div>
                    </div>
                    <div class="command-card-footer">
                        <button class="btn-secondary save-cmd-btn" title="Enregistrer les modifications"><ion-icon name="save-outline"></ion-icon> Enregistrer</button>
                        <button class="btn-primary archive-range-cmd-btn" title="Ranger en stock et archiver"><ion-icon name="archive-outline"></ion-icon> Ranger & Archiver</button>
                    </div>
                </div>`;
            }
            container.innerHTML += cardHtml;
        });
        container.querySelectorAll('.save-cmd-btn').forEach(btn => btn.addEventListener('click', handleSaveCommand));
        container.querySelectorAll('.archive-range-cmd-btn').forEach(btn => btn.addEventListener('click', handleArchiveAndStockCommand));
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
        const updates = {
            status: card.querySelector('.cmd-status-select').value,
            orderedBy: card.querySelector('[data-field="orderedBy"]').value || '',
            receivedBy: card.querySelector('[data-field="receivedBy"]').value || '',
            stockedBy: card.querySelector('[data-field="stockedBy"]').value || '',
            updatedAt: firebase.database.ServerValue.TIMESTAMP,
            updatedBy: currentUser
        };
        await database.ref(`commandes/${cmdId}`).update(updates);
        addLogEntry('Mise à jour Commande', `Cmd ID: ${cmdId}, Statut: ${updates.status}, par ${currentUser}`);
        showMessage("Modifications de la commande enregistrées.", "success");
    }
    
    async function handleArchiveAndStockCommand(e) {
        const card = e.currentTarget.closest('.command-card');
        const cmdId = card.dataset.cmdId;
        const cmdData = commandLog[cmdId];
        if (!cmdData) return showMessage("Données de commande introuvables.", "error");
        const confirmed = await showCustomDialog({
            title: "Archiver et Ranger la Commande",
            message: `Confirmez-vous que la commande pour ${cmdData.quantityMissing} x "${cmdData.materialName}" a été reçue et rangée ? Le stock pharmacie sera mis à jour.`
        });
        if (confirmed) {
            const updates = {
                status: 'Rangé et Archivé',
                archived: true,
                archivedAt: firebase.database.ServerValue.TIMESTAMP,
                archivedBy: currentUser,
                orderedBy: card.querySelector('[data-field="orderedBy"]').value || cmdData.orderedBy || '',
                receivedBy: card.querySelector('[data-field="receivedBy"]').value || cmdData.receivedBy || currentUser, 
                stockedBy: card.querySelector('[data-field="stockedBy"]').value || currentUser 
            };
            try {
                await database.ref(`commandes/${cmdId}`).update(updates);
                const pharmaItemRef = database.ref(`stocks/pharmacie/${cmdData.materialName}`);
                const pharmaItemSnapshot = await pharmaItemRef.once('value');
                if (pharmaItemSnapshot.exists()) {
                    await pharmaItemRef.child('quantity').set(firebase.database.ServerValue.increment(cmdData.quantityMissing));
                } else {
                    await pharmaItemRef.set({ quantity: cmdData.quantityMissing, notes: 'Ajout via commande' });
                }
                addLogEntry('Stock Pharmacie & Archivage Cmd', `+${cmdData.quantityMissing} de '${cmdData.materialName}'. Cmd ID: ${cmdId} archivée par ${currentUser}`);
                showMessage(`Commande archivée. Stock pharmacie pour "${cmdData.materialName}" mis à jour.`, 'success');
            } catch (error) {
                 showMessage(`Erreur archivage/mise à jour stock: ${error.message}`, 'error');
                 addLogEntry('Erreur Archivage Cmd', `Cmd ID: ${cmdId}, Erreur: ${error.message}`);
            }
        }
    }
    
    function handleManualCommandViaModal() {
        const materialName = newCommandMaterialNameModalInput.value.trim();
        const quantity = parseInt(newCommandQuantityModalInput.value, 10);
        if (!materialName || !quantity || quantity < 1) {
            return showMessage("Veuillez entrer un nom de matériel et une quantité valide (> 0).", "error");
        }
        database.ref('commandes').push().set({
            interventionId: 'MANUEL', 
            interventionNum: 'Commande Manuelle',
            materialName: materialName,
            quantityMissing: quantity,
            status: 'À commander', 
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            requestedBy: currentUser, 
            orderedBy: currentUser, 
            archived: false
        }).then(() => {
            showMessage("Commande manuelle créée.", "success");
            addLogEntry('Création Commande Manuelle', `${quantity} x '${materialName}' par ${currentUser}`);
            newCommandMaterialNameModalInput.value = '';
            newCommandQuantityModalInput.value = '1';
            addManualCommandModal.classList.remove('visible');
        }).catch(err => showMessage("Erreur création commande: " + err.message, "error"));
    }
    
    async function handleClearJournal() {
        const confirmed = await showCustomDialog({
            title: "Effacer le Journal",
            message: "Cette action est irréversible et supprimera toutes les entrées du journal. Continuer ?"
        });
        if (confirmed) {
            const password = await showCustomDialog({
                title: 'Accès Sécurisé',
                message: 'Entrez le mot de passe administrateur pour confirmer.',
                type: 'prompt', inputType: 'password'
            });
            if (password === DELETE_PASSWORD) {
                await database.ref('log').remove();
                showMessage("Journal d'activité effacé.", 'success');
                console.log(`Journal effacé par ${currentUser} le ${new Date().toLocaleString()}`);
            } else if (password !== null) {
                showMessage('Mot de passe incorrect. Journal non effacé.', 'error');
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
        const combinedStock = { ...pompierStock, ...pharmaStock }; 
        const sortedStockNames = Object.keys(combinedStock).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
        stockDatalist.innerHTML = sortedStockNames.map(item => `<option value="${item}"></option>`).join('');
    }

    function updateMaterielsTagDisplay() {
        materielsList.innerHTML = materiels.map(mat => 
            `<span class="tag-item">${mat.name} (x${mat.qty})<button type="button" class="close-tag" data-materiel-name="${mat.name}" title="Retirer">&times;</button></span>`
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
        if (photosBase64.length + files.length > 5) { 
            showMessage("Maximum 5 photos.", "error");
            return;
        }
        files.forEach(file => {
            if (file.size > 2 * 1024 * 1024) { 
                showMessage(`Fichier ${file.name} trop volumineux (max 2MB).`, "error");
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                photosBase64.push(event.target.result);
                updatePhotosDisplay();
            };
            reader.onerror = () => showMessage(`Erreur lecture fichier ${file.name}.`, "error");
            reader.readAsDataURL(file);
        });
        e.target.value = null; 
    }

    function updatePhotosDisplay() {
        photoPreview.innerHTML = photosBase64.map((photo, index) => 
            `<div class="photo-thumb-wrapper">
                <img src="${photo}" class="photo-thumb" alt="Aperçu ${index + 1}">
                <button type="button" class="remove-photo-btn" data-index="${index}" title="Supprimer">&times;</button>
            </div>`
        ).join('');
        document.querySelectorAll('.remove-photo-btn').forEach(btn => {
            btn.addEventListener('click', (e) => { 
                e.stopPropagation(); 
                photosBase64.splice(e.target.dataset.index, 1); 
                updatePhotosDisplay(); 
            });
        });
        document.querySelectorAll('.photo-thumb').forEach((thumb, index) => {
            thumb.addEventListener('click', () => showFullImage(photosBase64[index]));
        });
    }

    function showFullImage(src) {
        fullImagePreview.src = src;
        imagePreviewModal.classList.add('visible');
    }

    function showMessage(message, type) {
        const container = document.createElement('div');
        container.className = `message-container ${type}`;
        container.innerHTML = `<p>${message}</p><button class="close-message">&times;</button>`;
        document.body.appendChild(container);
        const closeMsgBtn = container.querySelector('.close-message');
        const autoCloseTimeout = setTimeout(() => {
            if (document.body.contains(container)) document.body.removeChild(container);
        }, 4000);
        closeMsgBtn.addEventListener('click', () => {
            clearTimeout(autoCloseTimeout);
            if (document.body.contains(container)) document.body.removeChild(container);
        });
    }

    function formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        if (dateStr.includes('-')) {
            const [year, month, day] = dateStr.split('-');
            return `${day}/${month}/${year}`;
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
            a.dataset.page = page;
            li.appendChild(a);
            return li;
        };
        paginationUl.appendChild(createPageLink(currentPage - 1, '<i class="bi bi-chevron-left"></i>', currentPage === 1));
        const MAX_PAGES_SHOWN = 5;
        let startPage = Math.max(1, currentPage - Math.floor(MAX_PAGES_SHOWN / 2));
        let endPage = Math.min(totalPages, startPage + MAX_PAGES_SHOWN - 1);
        if (endPage - startPage + 1 < MAX_PAGES_SHOWN) {
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

    // --- MODAL DE SÉLECTION DE MATÉRIEL ---
    function populateMaterielSelectionModal(searchTerm = '') {
        materielSelectionList.innerHTML = ''; 
        const combinedStock = { ...pompierStock, ...pharmaStock };
        const lowerSearchTerm = searchTerm.toLowerCase();
        const sortedStockNames = Object.keys(combinedStock)
            .filter(name => name.toLowerCase().includes(lowerSearchTerm))
            .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
        if (sortedStockNames.length === 0 && !searchTerm) {
             materielSelectionList.innerHTML = '<p class="empty-view-message">Aucun article. Ajoutez manuellement.</p>'; return;
        }
        if (sortedStockNames.length === 0 && searchTerm) {
             materielSelectionList.innerHTML = `<p class="empty-view-message">Aucun article pour "${searchTerm}".</p>`; return;
        }
        sortedStockNames.forEach(name => {
            const itemDetailsPompier = pompierStock[name] || { quantity: 0 };
            const itemDetailsPharma = pharmaStock[name] || { quantity: 0 };
            const existingSelection = tempSelectedMaterielsModal.find(m => m.name === name);
            const currentQtyInModal = existingSelection ? existingSelection.qty : 0;
            const itemDiv = document.createElement('div');
            itemDiv.className = 'materiel-selection-item';
            itemDiv.innerHTML = `
                <span>${name} <small class="stock-info">(VSAV: ${itemDetailsPompier.quantity}, Pharma: ${itemDetailsPharma.quantity})</small></span>
                <input type="number" value="${currentQtyInModal}" min="0" data-name="${name}" placeholder="Qté">
            `;
            materielSelectionList.appendChild(itemDiv);
            const qtyInput = itemDiv.querySelector('input[type="number"]');
            qtyInput.addEventListener('change', (e) => {
                const newQty = parseInt(e.target.value, 10);
                const itemName = e.target.dataset.name;
                const index = tempSelectedMaterielsModal.findIndex(m => m.name === itemName);
                if (newQty > 0) {
                    if (index > -1) tempSelectedMaterielsModal[index].qty = newQty;
                    else tempSelectedMaterielsModal.push({ name: itemName, qty: newQty });
                } else { 
                    if (index > -1) tempSelectedMaterielsModal.splice(index, 1);
                }
            });
             qtyInput.addEventListener('focus', () => qtyInput.select()); 
        });
    }

    openMaterielSelectionModalBtn.addEventListener('click', () => {
        tempSelectedMaterielsModal = [...materiels.map(m => ({ ...m }))]; 
        populateMaterielSelectionModal();
        materielSearchModalInput.value = ''; 
        materielSelectionModal.classList.add('visible');
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
            } else {
                tempSelectedMaterielsModal.push({ name, qty });
            }
            showMessage(`"${name}" (x${qty}) ajouté/mis à jour.`, 'info');
            manualMaterielNameModalInput.value = '';
            manualMaterielQtyModalInput.value = '1';
            populateMaterielSelectionModal(materielSearchModalInput.value); 
        } else {
            showMessage("Nom et quantité valide requis.", "error");
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


    // --- Initialisation ---
    function initializeApp() {
        currentUser = sessionStorage.getItem('userName');
        if (!currentUser && !sessionStorage.getItem('pharmaUserName')) { 
            currentUser = prompt("Votre nom ou matricule pour suivi :", "Pompier");
            sessionStorage.setItem('userName', currentUser || "Pompier");
        } else if (sessionStorage.getItem('pharmaUserName')) {
            currentUser = sessionStorage.getItem('pharmaUserName'); 
        } else {
            currentUser = currentUser || "Pompier"; 
        }
        
        fetchData();
        setDefaultDateTime();
        setupNavEventListeners(mainNavUl);
        setupNavEventListeners(pharmacyNavUl);
        
        const initialActiveTab = isPharmacyAuthenticated 
            ? (pharmacyNavUl.querySelector('.list.active') || pharmacyNavUl.querySelector('.list'))
            : (mainNavUl.querySelector('.list.active') || mainNavUl.querySelector('.list')); 
        if (initialActiveTab) {
            const parentNav = initialActiveTab.closest('ul');
            if (parentNav) setActiveTab(initialActiveTab, parentNav); 
        } else { // Fallback if no tab is active or found (e.g. first load)
            const defaultNav = isPharmacyAuthenticated ? pharmacyNavUl : mainNavUl;
            const firstItem = defaultNav.querySelector('.list');
            if (firstItem) setActiveTab(firstItem, defaultNav);
        }


        interventionForm.addEventListener('submit', handleFormSubmit);
        document.getElementById('photo').addEventListener('change', handlePhotoUpload);
        document.getElementById('resetForm').addEventListener('click', resetForm);
        
        currentSearchInput.addEventListener('input', () => { currentPage_current = 1; displayInterventions(); });
        archiveSearchInput.addEventListener('input', () => { currentPage_archive = 1; displayInterventions(); });
        
        // pharmacySearchInput est l'unique input pour les recherches en mode pharmacie
        pharmacySearchInput.addEventListener('input', () => {
            const activeViewId = document.querySelector('.view-container.visible')?.id;
            if (activeViewId === 'commandes-view') { displayCommandes(); } 
            else if (activeViewId === 'stock-unified-view') { displayUnifiedStockView(); } 
            else if (activeViewId === 'journal-view') { displayJournal(); } 
            else if (['reappro-view', 'pharmacy-archives-view'].includes(activeViewId)) {
                 currentPage_pharmacy = 1; currentPage_pharmacy_archive = 1; displayInterventions();
            }
        });
        
        if (mobileSearchIcon && pharmacySearchBox) {
            mobileSearchIcon.addEventListener('click', () => {
                pharmacySearchBox.classList.toggle('mobile-visible');
                if (pharmacySearchBox.classList.contains('mobile-visible')) {
                    pharmacySearchInput.focus();
                }
            });
        }


        document.querySelectorAll('.modal .close-button, .modal .modal-close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => e.currentTarget.closest('.modal').classList.remove('visible'));
        });

        topLoginBtn.addEventListener('click', handlePharmacyLogin);
        headerLogoutBtn.addEventListener('click', handlePharmacyLogout);
        
        openAddManualCommandModalBtn.addEventListener('click', () => addManualCommandModal.classList.add('visible'));
        fabAddManualCommand.addEventListener('click', () => addManualCommandModal.classList.add('visible'));
        saveNewManualCommandBtn.addEventListener('click', handleManualCommandViaModal);

        openAddStockItemModalBtn.addEventListener('click', () => addStockItemModal.classList.add('visible'));
        fabAddStockItem.addEventListener('click', () => addStockItemModal.classList.add('visible'));
        saveNewStockItemBtn.addEventListener('click', handleAddNewStockItemViaModal);

        clearJournalBtn.addEventListener('click', handleClearJournal);

        document.querySelectorAll('#commandes-view .desktop-sub-nav .sub-nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('#commandes-view .desktop-sub-nav .sub-nav-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                currentCommandView = e.currentTarget.dataset.commandView;
                displayCommandes();
                // Si la subnav du header est visible, la mettre à jour aussi
                if(pharmacyHeaderSubnavContainer.style.display === 'flex') updatePharmacyHeaderSubNav('commandes-view');
            });
        });
        document.querySelectorAll('#stock-unified-view .desktop-sub-nav .sub-nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('#stock-unified-view .desktop-sub-nav .sub-nav-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                currentStockSubView = e.currentTarget.dataset.stockType;
                displayUnifiedStockView();
                if(pharmacyHeaderSubnavContainer.style.display === 'flex') updatePharmacyHeaderSubNav('stock-unified-view');
            });
        });

        window.addEventListener('resize', () => {
            const activeViewId = document.querySelector('.view-container.visible')?.id;
            if (activeViewId) {
                updateHeaderControls(activeViewId); // Réévaluer les contrôles du header
                updatePharmacyHeaderSubNav(activeViewId); // Réévaluer la subnav du header
            }


            if (isPharmacyAuthenticated) {
                fabAddManualCommand.style.display = (activeViewId === 'commandes-view' && window.innerWidth <= 768) ? 'block' : 'none';
                fabAddStockItem.style.display = (activeViewId === 'stock-unified-view' && window.innerWidth <= 768) ? 'block' : 'none';
                
                // Gérer la visibilité de la search-box pharmacie au redimensionnement
                if (window.innerWidth > 768) {
                    if (pharmacySearchBox) pharmacySearchBox.classList.remove('mobile-visible'); // Cacher si on passe en desktop
                    if (mobileSearchIcon) mobileSearchIcon.style.display = 'none'; // Cacher l'icône
                    // S'assurer que la barre de recherche normale est visible si applicable
                    if (document.getElementById('header-controls-pharmacy')?.classList.contains('visible')) {
                         if(pharmacySearchBox) pharmacySearchBox.style.display = 'flex';
                    }
                } else {
                    // La logique dans updateHeaderControls gère l'affichage de l'icône
                     if (pharmacySearchBox && !pharmacySearchBox.classList.contains('mobile-visible')) {
                        // pharmacySearchBox.style.display = 'none'; // S'assurer qu'elle est cachée si pas active
                    }
                }

            } else {
                fabAddManualCommand.style.display = 'none';
                fabAddStockItem.style.display = 'none';
                if (pharmacySearchBox) pharmacySearchBox.classList.remove('mobile-visible');
            }
        });
    }
    initializeApp();
});
