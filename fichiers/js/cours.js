document.addEventListener('DOMContentLoaded', () => {
    const db = window.firebaseDB;
    const { firebaseRef, firebaseSet, firebaseGet, firebaseChild, firebaseRemove, firebaseUpdate } = window;

    const fileListEl = document.getElementById('file-list');
    const currentPathDisplayEl = document.getElementById('current-path-display');
    const topAdminBar = document.getElementById('admin-actions-bar');
    const createFolderBtn = document.getElementById('createFolderBtn');
    const fileInput = document.getElementById('fileInput');
    const dragDropArea = document.getElementById('drag-drop-area');
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');
    
    const searchFileInput = document.getElementById('searchFileInput');
    const searchGlobalCheckbox = document.getElementById('searchGlobalCheckbox');

    const modalEl = document.getElementById('file-viewer-modal');
    const modalFileNameEl = document.getElementById('modal-file-name');
    const modalFileContentEl = document.getElementById('modal-file-content');
    const closeModalBtn = modalEl.querySelector('.close-button');
    const modalControls = document.getElementById('modal-controls');
    const modalPrintBtn = document.getElementById('modal-print-btn');
    const modalDownloadBtn = document.getElementById('modal-download-btn');
    const modalShareBtn = document.getElementById('modal-share-btn');
    const modalZoomInBtn = document.getElementById('modal-zoom-in-btn');
    const modalZoomOutBtn = document.getElementById('modal-zoom-out-btn');
    const modalZoomResetBtn = document.getElementById('modal-zoom-reset-btn');

    let currentModalFileDataForActions = null;
    let currentImageZoomLevel = 1;
    const MAX_ZOOM = 3; const MIN_ZOOM = 0.5; const ZOOM_STEP = 0.2;
    let zoomedImageElement = null;

    const backBtn = document.getElementById('backBtn');
    const forwardBtn = document.getElementById('forwardBtn');
    const adminTab = document.querySelector('.navigation .list[data-page="admin"]');
    const adminTabTextEl = document.getElementById('admin-tab-text');

    let currentFirebasePath = 'files/root';
    let isAdminLoggedIn = false;
    const ADMIN_PASSWORD = "Aspf66220*"; // 🚨 WARNING: INSECURE - For demo only

    let navigationHistory = [];
    let currentHistoryIndex = -1;
    let allItemsCache = []; 
    let allDataForGlobalSearch = null; 
    let globalSearchInProgress = false; 

    function toggleAdminMode(enable) {
        isAdminLoggedIn = enable;
        document.body.classList.toggle('admin-mode', isAdminLoggedIn);
        topAdminBar.style.display = isAdminLoggedIn ? 'flex' : 'none';
        dragDropArea.style.display = isAdminLoggedIn ? 'block' : 'none';

        if (isAdminLoggedIn) {
            adminTabTextEl.textContent = 'ADMIN ✓';
            adminTab.classList.add('admin-logged-in');
        } else {
            adminTabTextEl.textContent = 'Admin';
            adminTab.classList.remove('admin-logged-in');
        }
        if (!searchGlobalCheckbox.checked) {
             displayFiles(currentFirebasePath, false, searchFileInput.value);
        } else {
            if (allDataForGlobalSearch) {
                renderGlobalSearchResults(allDataForGlobalSearch, searchFileInput.value);
            }
        }
    }

    adminTab.addEventListener('click', (e) => {
        e.preventDefault();
        if (!isAdminLoggedIn) {
            const password = prompt("Entrez le mot de passe administrateur :");
            if (password === ADMIN_PASSWORD) {
                toggleAdminMode(true);
            } else if (password !== null) {
                alert("Mot de passe incorrect.");
            }
        }
        const adminListItem = e.currentTarget.closest('li.list');
        if (adminListItem && !adminListItem.classList.contains('active')) {
            setActiveNavLink.call(adminListItem);
        }
    });

    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', () => {
            if (isAdminLoggedIn) {
                if (confirm("Voulez-vous vous déconnecter du mode administrateur ?")) {
                    toggleAdminMode(false);
                    const coursTab = document.querySelector('.navigation .list[data-page="cours"]');
                    if (coursTab) setActiveNavLink.call(coursTab);
                }
            }
        });
    }

    const navItems = document.querySelectorAll(".navigation .list");
    const navUl = document.querySelector(".navigation ul");
    const navIndicator = document.querySelector(".navigation .indicator");

    function moveNavIndicator(activeItem) {
        if (!activeItem || !navIndicator || !navUl) return;
        const itemWidth = activeItem.offsetWidth;
        const itemPosition = activeItem.offsetLeft;
        const centerOffset = (itemWidth / 2) - (navIndicator.offsetWidth / 2);
        const finalIndicatorPosX = itemPosition + centerOffset;

        navUl.style.setProperty('--indicator-x-pos', `${finalIndicatorPosX}px`);
        navUl.classList.add('indicator-ready');

        const activeIconNode = activeItem.querySelector('.icon ion-icon');
        const shockwaveDiv = navIndicator.querySelector('.shockwave') || document.createElement('div');
        if (!shockwaveDiv.classList.contains('shockwave')) shockwaveDiv.className = 'shockwave';

        navIndicator.innerHTML = '';
        navIndicator.appendChild(shockwaveDiv);
        if (activeIconNode) navIndicator.appendChild(activeIconNode.cloneNode(true));
        navIndicator.classList.remove("landed");
    }

    if (navIndicator) {
        navIndicator.addEventListener('transitionend', (e) => {
            if (e.propertyName === 'transform' && navUl && navUl.classList.contains('indicator-ready')) {
                navIndicator.classList.add("landed");
            }
        });
    }

    function setActiveNavLink() {
        if (this.classList.contains('active') || !navUl) return;
        const previousActive = navUl.querySelector('li.list.active');
        if (previousActive) previousActive.classList.remove('active');
        this.classList.add('active');
        navUl.classList.remove('indicator-ready');
        setTimeout(() => moveNavIndicator(this), 50);
    }

    navItems.forEach((item) => item.addEventListener("click", function (e) {
        e.preventDefault();
        setActiveNavLink.call(this);
    }));

    function setInitialNavState() {
        const activeItem = document.querySelector('.navigation .list.active');
        if (activeItem) setTimeout(() => moveNavIndicator(activeItem), 150);
    }

    const embersContainer = document.querySelector('.background-embers');
    if (embersContainer) {
        const numberOfEmbers = 40;
        for (let i = 0; i < numberOfEmbers; i++) {
            const ember = document.createElement('div'); ember.className = 'ember';
            const size = Math.random() * 6 + 2;
            ember.style.width = `${size}px`; ember.style.height = `${size}px`;
            ember.style.left = `${Math.random() * 100}%`;
            const duration = Math.random() * 15 + 10;
            ember.style.animationDuration = `${duration}s`;
            const delay = Math.random() * 15;
            ember.style.animationDelay = `${delay}s`;
            embersContainer.appendChild(ember);
        }
    }

    function updateNavigationHistory(path) {
        if (searchGlobalCheckbox.checked && searchFileInput.value.trim() !== '') return; 
        if (navigationHistory[currentHistoryIndex] !== path) {
            navigationHistory = navigationHistory.slice(0, currentHistoryIndex + 1);
            navigationHistory.push(path);
            currentHistoryIndex = navigationHistory.length - 1;
        }
        updateHistoryButtons();
    }

    function updateHistoryButtons() {
        if (searchGlobalCheckbox.checked && searchFileInput.value.trim() !== '') { 
            backBtn.disabled = true;
            forwardBtn.disabled = true;
            return;
        }
        backBtn.disabled = currentHistoryIndex <= 0;
        forwardBtn.disabled = currentHistoryIndex >= navigationHistory.length - 1;
    }

    backBtn.addEventListener('click', () => {
        if (searchGlobalCheckbox.checked) return;
        if (currentHistoryIndex > 0) {
            currentHistoryIndex--;
            searchFileInput.value = ''; 
            displayFiles(navigationHistory[currentHistoryIndex], false);
        }
    });

    forwardBtn.addEventListener('click', () => {
        if (searchGlobalCheckbox.checked) return;
        if (currentHistoryIndex < navigationHistory.length - 1) {
            currentHistoryIndex++;
            searchFileInput.value = ''; 
            displayFiles(navigationHistory[currentHistoryIndex], false);
        }
    });
    
    searchFileInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value;
        if (searchGlobalCheckbox.checked) {
            updateHistoryButtons(); 
            if (allDataForGlobalSearch) {
                renderGlobalSearchResults(allDataForGlobalSearch, searchTerm);
            } else if (!globalSearchInProgress) { 
                fileListEl.innerHTML = '<li class="no-search-results-message">Données globales non chargées. Cochez/décochez "Partout" pour réessayer.</li>';
            }
        } else {
            renderFileList(searchTerm); 
        }
    });

    searchGlobalCheckbox.addEventListener('change', async (e) => {
        searchFileInput.value = '';
        fileListEl.innerHTML = '';

        if (e.target.checked) { 
            currentPathDisplayEl.textContent = "Recherche Globale Active";
            updateHistoryButtons(); 
            fileListEl.innerHTML = '<li class="empty-folder-message"><ion-icon name="hourglass-outline" class="spin"></ion-icon> Chargement des données globales...</li>';
            if (!allDataForGlobalSearch && !globalSearchInProgress) {
                globalSearchInProgress = true;
                allDataForGlobalSearch = await fetchAllItemsRecursiveForSearch('files/root');
                globalSearchInProgress = false;
            }
            if (allDataForGlobalSearch && allDataForGlobalSearch.length > 0) {
                fileListEl.innerHTML = '<li class="empty-folder-message">Prêt. Entrez un terme pour la recherche globale.</li>';
            } else if (!globalSearchInProgress) { 
                fileListEl.innerHTML = '<li class="no-search-results-message">Aucune donnée trouvée pour la recherche globale ou une erreur est survenue.</li>';
            }
        } else { 
            allDataForGlobalSearch = null; 
            const pathToShow = navigationHistory[currentHistoryIndex] || 'files/root';
            displayFiles(pathToShow, false);
        }
    });
    
    async function fetchAllItemsRecursiveForSearch(firebasePath, currentDisplayPath = 'Racine') {
        let itemsList = [];
        try {
            const snapshot = await firebaseGet(firebaseRef(db, firebasePath));
            if (snapshot.exists()) {
                const data = snapshot.val();
                for (const name in data) {
                    if (name === '_placeholder') continue;
                    const item = data[name];
                    const itemEntry = {
                        name: name,
                        type: item.type,
                        contentType: item.contentType || null,
                        firebasePath: `${firebasePath}/${name}`, 
                        displayPath: currentDisplayPath === 'Racine' ? name : `${currentDisplayPath}/${name}`
                    };
                    itemsList.push(itemEntry);

                    if (item.type === 'folder') {
                        const subDisplayPath = currentDisplayPath === 'Racine' ? name : `${currentDisplayPath}/${name}`;
                        const subItems = await fetchAllItemsRecursiveForSearch(`${firebasePath}/${name}/files`, subDisplayPath);
                        itemsList = itemsList.concat(subItems);
                    }
                }
            }
        } catch (error) {
            console.error(`Erreur lors de la récupération de ${firebasePath}:`, error);
        }
        return itemsList;
    }

    function renderGlobalSearchResults(fullData, searchTerm) {
        fileListEl.innerHTML = '';
        const normalizedSearchTerm = searchTerm.toLowerCase().trim();
        updateHistoryButtons(); 

        if (!normalizedSearchTerm) {
            fileListEl.innerHTML = '<li class="empty-folder-message">Entrez un terme pour la recherche globale.</li>';
            return;
        }
        
        const results = fullData.filter(item => item.name.toLowerCase().includes(normalizedSearchTerm));

        if (results.length === 0) {
            fileListEl.innerHTML = '<li class="no-search-results-message">Aucun résultat global pour votre recherche.</li>';
            return;
        }

        results.forEach(itemData => {
            const li = document.createElement('li');
            li.classList.add('global-search-item'); 

            const iconName = itemData.type === 'folder' ? 'folder-outline' :
                itemData.contentType && itemData.contentType.startsWith('image/') ? 'image-outline' :
                itemData.contentType === 'application/pdf' ? 'document-attach-outline' : 'document-text-outline';
            
            li.innerHTML = `
                <span class="item-icon"><ion-icon name="${iconName}"></ion-icon></span>
                <span class="item-name">${itemData.name}</span>
                <span class="item-path">${itemData.displayPath}</span>
                ${isAdminLoggedIn ? `
                <div class="item-actions">
                    <button class="edit-btn" title="Renommer"><ion-icon name="create-outline"></ion-icon></button>
                    <button class="delete-btn" title="Supprimer"><ion-icon name="trash-outline"></ion-icon></button>
                </div>` : ''}
            `;
            
            if (itemData.type === 'folder') li.classList.add('folder-card');
            else li.classList.add('file-item');

            li.addEventListener('click', async (e) => {
                if (e.target.closest('.item-actions')) return;

                searchGlobalCheckbox.checked = false; 
                allDataForGlobalSearch = null;
                searchFileInput.value = '';

                if (itemData.type === 'folder') {
                    displayFiles(itemData.firebasePath + '/files'); 
                } else {
                    try {
                        const fileSnapshot = await firebaseGet(firebaseRef(db, itemData.firebasePath));
                        if (fileSnapshot.exists()) {
                            openFileModal(itemData.name, fileSnapshot.val());
                        } else {
                            alert("Fichier non trouvé.");
                            displayFiles(navigationHistory[currentHistoryIndex] || 'files/root', false); 
                        }
                    } catch (error) {
                        console.error("Erreur ouverture fichier depuis recherche globale:", error);
                        alert("Erreur d'ouverture du fichier.");
                        displayFiles(navigationHistory[currentHistoryIndex] || 'files/root', false);
                    }
                }
            });

            if (isAdminLoggedIn) {
                const deleteBtn = li.querySelector('.delete-btn');
                const editBtn = li.querySelector('.edit-btn');
                if(deleteBtn) deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); deleteItem(itemData.firebasePath, itemData.name, itemData.type);
                });
                if(editBtn) editBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); renameItem(itemData.firebasePath, itemData.name, itemData.type);
                });
            }
            fileListEl.appendChild(li);
        });
        fileListEl.style.display = 'grid'; 
    }

    async function displayFiles(path, updateHistory = true, searchTerm = '') {
        currentFirebasePath = path;
        if (updateHistory) { 
            updateNavigationHistory(path);
        }

        const displayPathNormalized = path.replace(/^files\/root\/?/, 'Racine/').replace(/\/files\/?/g, '/').replace(/\/$/, '');
        currentPathDisplayEl.textContent = displayPathNormalized || 'Racine';
        fileListEl.innerHTML = '<li class="empty-folder-message">Chargement...</li>';

        try {
            const dbRef = firebaseChild(firebaseRef(db), path);
            const snapshot = await firebaseGet(dbRef);
            
            allItemsCache = [];
            if (snapshot.exists()) {
                const data = snapshot.val();
                const items = Object.entries(data).filter(([name]) => name !== '_placeholder');
                items.sort(([nameA, itemA], [nameB, itemB]) => { 
                    const typeA = itemA.type === 'folder' ? 0 : 1;
                    const typeB = itemB.type === 'folder' ? 0 : 1;
                    if (typeA !== typeB) return typeA - typeB;
                    return nameA.localeCompare(nameB);
                });
                allItemsCache = items;
            }
            renderFileList(searchTerm); 
        } catch (error) {
            console.error("Erreur lecture fichiers:", error);
            fileListEl.innerHTML = '<li class="empty-folder-message">Erreur lors du chargement des fichiers.</li>';
            allItemsCache = [];
        }
        if (!searchGlobalCheckbox.checked || searchTerm.trim() === '') { 
            updateHistoryButtons();
        }
    }

    function renderFileList(searchTerm = '') { 
        fileListEl.innerHTML = '';
        const normalizedSearchTerm = searchTerm.toLowerCase().trim();
        let displayedItems = allItemsCache;

        if (normalizedSearchTerm) {
            displayedItems = allItemsCache.filter(([name, item]) => name.toLowerCase().includes(normalizedSearchTerm));
        }

        if (displayedItems.length === 0) {
            const messageLi = document.createElement('li');
            messageLi.textContent = searchTerm ? 'Aucun fichier ou dossier ne correspond à votre recherche.' : 'Ce dossier est vide.';
            messageLi.className = searchTerm ? 'no-search-results-message' : 'empty-folder-message';
            fileListEl.appendChild(messageLi);
            fileListEl.style.display = 'block';
            return;
        }
        
        let hasFolders = false;
        displayedItems.forEach(([name, item]) => {
            if (item.type === 'folder') hasFolders = true;
            const li = document.createElement('li');
            const iconName = item.type === 'folder' ? 'folder-outline' :
                             item.contentType && item.contentType.startsWith('image/') ? 'image-outline' :
                             item.contentType === 'application/pdf' ? 'document-attach-outline' : 'document-text-outline';

            li.innerHTML = `
                <span class="item-icon"><ion-icon name="${iconName}"></ion-icon></span>
                <span class="item-name">${name}</span>
                <div class="item-actions">
                    <button class="edit-btn" title="Renommer"><ion-icon name="create-outline"></ion-icon></button>
                    <button class="delete-btn" title="Supprimer"><ion-icon name="trash-outline"></ion-icon></button>
                </div>
            `;

            if (item.type === 'folder') {
                li.classList.add('folder-card');
            } else {
                li.classList.add('file-item');
            }

            const itemNameSpanOrCard = item.type === 'folder' ? li : li.querySelector('.item-name');
            itemNameSpanOrCard.addEventListener('click', (e) => {
                if (e.target.closest('.item-actions')) return;
                searchFileInput.value = ''; 
                if (item.type === 'folder') displayFiles(`${currentFirebasePath}/${name}/files`);
                else openFileModal(name, item);
            });

            if (isAdminLoggedIn) {
                const deleteBtn = li.querySelector('.delete-btn');
                const editBtn = li.querySelector('.edit-btn');
                if(deleteBtn) deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); deleteItem(`${currentFirebasePath}/${name}`, name, item.type);
                });
                if(editBtn) editBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); renameItem(`${currentFirebasePath}/${name}`, name, item.type);
                });
            }
            fileListEl.appendChild(li);
        });
        fileListEl.style.display = hasFolders || displayedItems.some(entry => entry[1].type === 'folder') ? 'grid' : 'block';
    }
    
    function resetImageZoomState() { 
        currentImageZoomLevel = 1;
        if (zoomedImageElement) {
            zoomedImageElement.style.transform = 'scale(1)';
            zoomedImageElement.style.cursor = 'grab';
        }
        zoomedImageElement = null;
        modalZoomInBtn.style.display = 'none';
        modalZoomOutBtn.style.display = 'none';
        modalZoomResetBtn.style.display = 'none';
    }

    function openFileModal(fileName, fileData) {
        currentModalFileDataForActions = fileData;
        modalFileNameEl.textContent = fileName;
        modalFileContentEl.innerHTML = '';
        resetImageZoomState(); 

        modalControls.style.display = 'flex';
        modalPrintBtn.style.display = 'inline-flex';
        modalDownloadBtn.style.display = 'inline-flex';
        modalShareBtn.style.display = 'inline-flex';

        const dataUri = fileData.base64Content ? `data:${fileData.contentType || 'application/octet-stream'};base64,${fileData.base64Content}` : null;

        if (dataUri) {
             try {
                if (fileData.contentType && fileData.contentType.startsWith('image/')) {
                    const img = document.createElement('img');
                    img.src = dataUri;
                    img.alt = fileName;
                    modalFileContentEl.appendChild(img);
                    zoomedImageElement = img; 
                    modalZoomInBtn.style.display = 'inline-flex';
                    modalZoomOutBtn.style.display = 'inline-flex';
                    modalZoomResetBtn.style.display = 'inline-flex';
                } else if (fileData.contentType === 'application/pdf') {
                    const iframe = document.createElement('iframe');
                    iframe.src = dataUri;
                    modalFileContentEl.appendChild(iframe);
                } else if (fileData.contentType && fileData.contentType.startsWith('text/')) {
                    const pre = document.createElement('pre');
                    pre.textContent = atob(fileData.base64Content);
                    modalFileContentEl.appendChild(pre);
                    modalPrintBtn.style.display = 'none'; 
                } else {
                    const p = document.createElement('p');
                    p.textContent = `Type de fichier (${fileData.contentType || 'inconnu'}) non supporté pour un aperçu direct.`;
                    modalFileContentEl.appendChild(p);
                    const downloadLinkForUnsupported = document.createElement('a');
                    downloadLinkForUnsupported.href = dataUri;
                    downloadLinkForUnsupported.download = fileName;
                    downloadLinkForUnsupported.textContent = `Télécharger ${fileName}`;
                    downloadLinkForUnsupported.style.display = 'block';
                    downloadLinkForUnsupported.style.marginTop = '10px';
                    modalFileContentEl.appendChild(downloadLinkForUnsupported);
                    modalPrintBtn.style.display = 'none';
                }
            } catch (e) {
                console.error("Erreur décodage Base64 ou affichage:", e);
                modalFileContentEl.textContent = 'Erreur lors de l\'affichage du fichier.';
                modalPrintBtn.style.display = 'none';
            }
        } else { 
            modalFileContentEl.textContent = 'Contenu du fichier indisponible ou vide.';
            modalPrintBtn.style.display = 'none';
            modalDownloadBtn.style.display = 'none';
            modalShareBtn.style.display = 'none';
        }
        
        modalEl.style.display = 'block';
        modalEl.classList.add('fullscreen'); 
    }

    closeModalBtn.onclick = () => {
        modalEl.style.display = 'none';
        modalFileContentEl.innerHTML = '';
        modalEl.classList.remove('fullscreen'); 
        currentModalFileDataForActions = null;
        resetImageZoomState();
    }
    window.onclick = (event) => { if (event.target == modalEl) { closeModalBtn.onclick(); } }

    modalPrintBtn.addEventListener('click', () => {
        if (currentModalFileDataForActions && currentModalFileDataForActions.contentType === 'application/pdf') {
            const iframe = modalFileContentEl.querySelector('iframe');
            if (iframe && iframe.contentWindow) {
                try {
                    iframe.contentWindow.focus(); 
                    iframe.contentWindow.print();
                } catch (e) {
                    alert("L'impression directe a été bloquée. Essayez d'utiliser les options d'impression de la visionneuse PDF ou téléchargez le fichier.");
                    console.error("Erreur d'impression:", e);
                }
            }
        } else if (currentModalFileDataForActions && currentModalFileDataForActions.contentType.startsWith('image/')) {
            const img = modalFileContentEl.querySelector('img');
            if (img) {
                const printWindow = window.open('', '_blank');
                printWindow.document.write(`<html><head><title>Imprimer ${modalFileNameEl.textContent}</title></head><body onload="window.print();window.close();"><img src="${img.src}" style="max-width:100%;"/></body></html>`);
                printWindow.document.close();
            }
        }
    });

    modalDownloadBtn.addEventListener('click', () => {
        if (currentModalFileDataForActions && currentModalFileDataForActions.base64Content) {
            const dataUri = `data:${currentModalFileDataForActions.contentType || 'application/octet-stream'};base64,${currentModalFileDataForActions.base64Content}`;
            const link = document.createElement('a');
            link.href = dataUri;
            link.download = modalFileNameEl.textContent || 'fichier';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            alert("Aucun contenu à télécharger.");
        }
    });

    modalShareBtn.addEventListener('click', async () => {
        if (currentModalFileDataForActions && modalFileNameEl.textContent) {
            const shareData = {
                title: modalFileNameEl.textContent,
                text: `Fichier partagé: ${modalFileNameEl.textContent}. (Via Gestionnaire de Cours Pompier)`,
            };
            try {
                if (navigator.share) {
                    await navigator.share(shareData);
                } else {
                    alert('La fonction de partage Web n\'est pas supportée. Vous pouvez télécharger le fichier.');
                }
            } catch (err) {
                console.error('Erreur de partage:', err);
                if (err.name !== 'AbortError') {
                    alert('Erreur lors du partage. ' + err.message);
                }
            }
        } else {
            alert("Aucun fichier sélectionné pour le partage.");
        }
    });

    function applyImageZoom() { if (zoomedImageElement) { zoomedImageElement.style.transform = `scale(${currentImageZoomLevel})`; } }
    modalZoomInBtn.addEventListener('click', () => { if (zoomedImageElement && currentImageZoomLevel < MAX_ZOOM) { currentImageZoomLevel = parseFloat((currentImageZoomLevel + ZOOM_STEP).toFixed(2)); applyImageZoom(); } });
    modalZoomOutBtn.addEventListener('click', () => { if (zoomedImageElement && currentImageZoomLevel > MIN_ZOOM) { currentImageZoomLevel = parseFloat((currentImageZoomLevel - ZOOM_STEP).toFixed(2)); applyImageZoom(); } });
    modalZoomResetBtn.addEventListener('click', () => { if (zoomedImageElement) { currentImageZoomLevel = 1; applyImageZoom(); } });

    if (createFolderBtn) {
        createFolderBtn.addEventListener('click', async () => {
            if (!isAdminLoggedIn) return;
            const folderName = prompt("Nom du nouveau dossier :");
            if (folderName && folderName.trim() !== "") {
                const cleanFolderName = folderName.trim().replace(/[.#$[\]]/g, '_');
                
                let basePathForCreation = currentFirebasePath;
                if (searchGlobalCheckbox.checked) {
                    const targetParentPath = prompt("Entrez le chemin complet du dossier parent où créer ce nouveau dossier (ex: files/root/DossierExistant/files) ou laissez vide pour créer à la racine (files/root).", "files/root");
                    if (targetParentPath === null) return; // User cancelled
                    basePathForCreation = targetParentPath.trim() === "" || targetParentPath.trim() === "files/root" ? "files/root" : targetParentPath;
                     // Ensure if a path is given, it's a 'files' node of a folder
                    if (basePathForCreation !== 'files/root' && !basePathForCreation.endsWith('/files')) {
                        // Check if it's a valid folder path without /files
                        const parentFolderCheck = await firebaseGet(firebaseChild(firebaseRef(db), basePathForCreation));
                        if (parentFolderCheck.exists() && parentFolderCheck.val().type === 'folder') {
                            basePathForCreation += '/files'; // Append /files if it's a folder
                        } else {
                            alert("Chemin parent invalide pour la création du dossier.");
                            return;
                        }
                    }
                }
                const newFolderPathInParent = `${basePathForCreation}/${cleanFolderName}`;

                try {
                    await firebaseSet(firebaseRef(db, newFolderPathInParent), { type: 'folder', createdAt: new Date().toISOString() });
                    await firebaseSet(firebaseRef(db, `${newFolderPathInParent}/files/_placeholder`), true);
                    alert(`Dossier "${cleanFolderName}" créé.`);
                    
                    if (searchGlobalCheckbox.checked) { 
                        allDataForGlobalSearch = null; 
                        renderGlobalSearchResults([], ''); // Clear existing results
                        searchGlobalCheckbox.dispatchEvent(new Event('change')); // Trigger reload of global data for search
                    } else {
                        displayFiles(currentFirebasePath, false, searchFileInput.value);
                    }
                } catch (error) { console.error("Erreur création dossier:", error); alert("Erreur création."); }
            }
        });
    }

    async function handleFileUploads(files) {
        if (!isAdminLoggedIn || !files || files.length === 0) return;
        const MAX_SIZE_MB = 7; 
        let largeFileDetected = false;
        let filesToUpload = Array.from(files);
        let uploadedCount = 0;
        const totalFilesToAttempt = filesToUpload.length;

        if (totalFilesToAttempt === 0) return;
        
        const dragDropAreaText = dragDropArea.querySelector('p');
        const dragDropAreaIcon = dragDropArea.querySelector('ion-icon[name="cloud-upload-outline"]'); 
        const originalText = dragDropAreaText.textContent;
        
        dragDropAreaText.innerHTML = `Téléversement en cours... <ion-icon name="sync-outline" class="spin"></ion-icon>`;
        if(dragDropAreaIcon) dragDropAreaIcon.style.display = 'none';

        let finalUploadPath = currentFirebasePath;
        if (searchGlobalCheckbox.checked) {
            const targetParentPath = prompt("Entrez le chemin complet du dossier où téléverser les fichiers (ex: files/root/DossierExistant/files) ou laissez vide pour la racine (files/root).", "files/root");
            if (targetParentPath === null) { // User cancelled
                dragDropAreaText.textContent = originalText;
                if(dragDropAreaIcon) dragDropAreaIcon.style.display = 'block';
                return;
            }
            finalUploadPath = targetParentPath.trim() === "" || targetParentPath.trim() === "files/root" ? "files/root" : targetParentPath;
            // Ensure if a path is given, it's a 'files' node of a folder
            if (finalUploadPath !== 'files/root' && !finalUploadPath.endsWith('/files')) {
                const parentFolderCheck = await firebaseGet(firebaseChild(firebaseRef(db), finalUploadPath));
                if (parentFolderCheck.exists() && parentFolderCheck.val().type === 'folder') {
                    finalUploadPath += '/files'; // Append /files if it's a folder
                } else {
                    alert("Chemin invalide pour le téléversement.");
                    dragDropAreaText.textContent = originalText;
                    if(dragDropAreaIcon) dragDropAreaIcon.style.display = 'block';
                    return;
                }
            }
        }

        for (const file of filesToUpload) { 
            if (file.size > MAX_SIZE_MB * 1024 * 1024 * 0.7) { 
                alert(`Fichier "${file.name}" trop volumineux (> ${MAX_SIZE_MB}MB après encodage potentiel). Il ne sera pas ajouté.`);
                largeFileDetected = true;
                uploadedCount++;
                if (uploadedCount === totalFilesToAttempt) { // All files processed (or skipped)
                    dragDropAreaText.textContent = originalText;
                    if(dragDropAreaIcon) dragDropAreaIcon.style.display = 'block';
                    if (searchGlobalCheckbox.checked) { allDataForGlobalSearch = null; searchGlobalCheckbox.dispatchEvent(new Event('change')); } 
                    else { displayFiles(currentFirebasePath, false, searchFileInput.value); }
                }
                continue;
            }
            const reader = new FileReader();
            reader.onload = async (e) => {
                const base64Content = e.target.result.split(',')[1];
                const fileName = file.name.replace(/[.#$[\]]/g, '_');
                const newFilePath = `${finalUploadPath}/${fileName}`; 
                try {
                    await firebaseSet(firebaseRef(db, newFilePath), {
                        type: 'file', contentType: file.type, base64Content: base64Content,
                        uploadedAt: new Date().toISOString()
                    });
                } catch (error) {
                    console.error(`Erreur ajout ${fileName}:`, error);
                    alert(`Erreur ajout ${fileName}. Firebase peut refuser les écritures trop volumineuses.`);
                } finally {
                    uploadedCount++;
                    if (uploadedCount === totalFilesToAttempt) {
                        dragDropAreaText.textContent = originalText;
                        if(dragDropAreaIcon) dragDropAreaIcon.style.display = 'block';
                        if (searchGlobalCheckbox.checked) { allDataForGlobalSearch = null; searchGlobalCheckbox.dispatchEvent(new Event('change')); } 
                        else { displayFiles(currentFirebasePath, false, searchFileInput.value); }
                        if (!largeFileDetected) alert("Téléversement terminé.");
                        else alert("Téléversement terminé (certains fichiers ont pu être ignorés).");
                    }
                }
            };
            reader.onerror = (error) => {
                console.error("Erreur lecture fichier:", error);
                uploadedCount++;
                if (uploadedCount === totalFilesToAttempt) { 
                    dragDropAreaText.textContent = originalText;
                    if(dragDropAreaIcon) dragDropAreaIcon.style.display = 'block';
                    if (searchGlobalCheckbox.checked) { allDataForGlobalSearch = null; searchGlobalCheckbox.dispatchEvent(new Event('change')); }
                    else { displayFiles(currentFirebasePath, false, searchFileInput.value); }
                }
            };
            reader.readAsDataURL(file);
        }
        if (filesToUpload.filter(f => !(f.size > MAX_SIZE_MB * 1024 * 1024 * 0.7)).length === 0 && largeFileDetected) { // Only if all files were too large
            dragDropAreaText.textContent = originalText;
            if(dragDropAreaIcon) dragDropAreaIcon.style.display = 'block';
        }
        fileInput.value = '';
    }
    
    if (fileInput) { fileInput.addEventListener('change', (event) => handleFileUploads(event.target.files)); }
    if (dragDropArea) {
        dragDropArea.addEventListener('dragover', (event) => { event.preventDefault(); if (isAdminLoggedIn) dragDropArea.classList.add('dragover'); });
        dragDropArea.addEventListener('dragleave', () => { if (isAdminLoggedIn) dragDropArea.classList.remove('dragover'); }); // Corrected: remove dragover, not dragleave
        dragDropArea.addEventListener('drop', (event) => { event.preventDefault(); if (isAdminLoggedIn) { dragDropArea.classList.remove('dragover'); const files = event.dataTransfer.files; if (files.length > 0) { handleFileUploads(files); } } });
        dragDropArea.addEventListener('click', () => { if (isAdminLoggedIn) { fileInput.click(); } });
    }

    async function deleteItem(itemFullPath, itemName, itemType) { 
        if (!isAdminLoggedIn) return;
        if (confirm(`Supprimer "${itemName}" (${itemType}) ? Ceci est irréversible.`)) {
            try {
                await firebaseRemove(firebaseRef(db, itemFullPath));
                if (itemType === 'folder') {
                    await firebaseRemove(firebaseRef(db, `${itemFullPath}/files`)).catch(() => {});
                }
                alert(`"${itemName}" a été supprimé.`);
                
                if (searchGlobalCheckbox.checked) { 
                    allDataForGlobalSearch = null; 
                    renderGlobalSearchResults([], ''); 
                    searchGlobalCheckbox.dispatchEvent(new Event('change')); 
                } else {
                    displayFiles(currentFirebasePath, false, searchFileInput.value);
                }
            } catch (error) { console.error("Erreur suppression:", error); alert("Erreur suppression."); }
        }
    }

    async function renameItem(itemFullPath, oldName, itemType) {
        if (!isAdminLoggedIn) return;
        const newNameRaw = prompt(`Entrez le nouveau nom pour "${oldName}":`, oldName);
        if (newNameRaw && newNameRaw.trim() !== "" && newNameRaw.trim() !== oldName) {
            const newName = newNameRaw.trim().replace(/[.#$[\]]/g, '_');
            const parentPath = itemFullPath.substring(0, itemFullPath.lastIndexOf('/'));
            const newItemFullPath = `${parentPath}/${newName}`;

            if (itemFullPath === newItemFullPath) { alert("Le nom est identique ou invalide."); return; }

            try {
                const itemRef = firebaseRef(db, itemFullPath);
                const snapshot = await firebaseGet(itemRef);
                if (snapshot.exists()) {
                    const itemData = snapshot.val();
                    await firebaseSet(firebaseRef(db, newItemFullPath), itemData);

                    if (itemType === 'folder') {
                        const contentsSnapshot = await firebaseGet(firebaseRef(db, `${itemFullPath}/files`));
                        if (contentsSnapshot.exists()) {
                            await firebaseSet(firebaseRef(db, `${newItemFullPath}/files`), contentsSnapshot.val());
                        }
                        await firebaseRemove(firebaseRef(db, `${itemFullPath}/files`)).catch(() => {});
                    }
                    await firebaseRemove(itemRef);
                    alert(`"${oldName}" renommé en "${newName}".`);

                    if (searchGlobalCheckbox.checked) {
                         allDataForGlobalSearch = null;
                         renderGlobalSearchResults([], '');
                         searchGlobalCheckbox.dispatchEvent(new Event('change'));
                    } else {
                        displayFiles(currentFirebasePath, false, searchFileInput.value);
                    }
                } else { alert("L'élément n'a pas été trouvé."); }
            } catch (error) { console.error("Erreur renommage:", error); alert("Erreur renommage."); }
        }
    }
    
    setInitialNavState();
    displayFiles(currentFirebasePath, true); 
    toggleAdminMode(false); 
});
