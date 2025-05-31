document.addEventListener('DOMContentLoaded', () => {
    const db = window.firebaseDB;
    const { firebaseRef, firebaseSet, firebaseGet, firebaseChild, firebaseRemove, firebaseUpdate } = window;

    const fileListEl = document.getElementById('file-list');
    const currentPathDisplayEl = document.getElementById('current-path-display');
    const topAdminBar = document.getElementById('admin-actions-bar'); // Renommé pour clarté
    const createFolderBtn = document.getElementById('createFolderBtn'); // Maintenant hors de topAdminBar
    const uploadFileBtn = document.getElementById('uploadFileBtn');
    const fileInput = document.getElementById('fileInput');
    const dragDropArea = document.getElementById('drag-drop-area');
    const adminLogoutBtn = document.getElementById('adminLogoutBtn'); // Nouveau bouton logout

    const modalEl = document.getElementById('file-viewer-modal');
    const modalFileNameEl = document.getElementById('modal-file-name');
    const modalFileContentEl = document.getElementById('modal-file-content');
    const closeModalBtn = modalEl.querySelector('.close-button');
    const modalControls = document.getElementById('modal-controls');
    const modalPrintBtn = document.getElementById('modal-print-btn');
    const modalDownloadBtn = document.getElementById('modal-download-btn');
    const modalFullscreenBtn = document.getElementById('modal-fullscreen-btn');
    let currentModalFileDataForActions = null; // Pour stocker les données du fichier modal pour les actions

    const backBtn = document.getElementById('backBtn');
    const forwardBtn = document.getElementById('forwardBtn');
    const adminTab = document.querySelector('.navigation .list[data-page="admin"]');
    const adminTabTextEl = document.getElementById('admin-tab-text');

    let currentFirebasePath = 'files/root';
    let isAdminLoggedIn = false;
    const ADMIN_PASSWORD = "Aspf66220*"; // 🚨 WARNING: INSECURE - For demo only

    let navigationHistory = [];
    let currentHistoryIndex = -1;

    // --- Admin Mode & Authentication --- (MODIFIÉ)
    function toggleAdminMode(enable) {
        isAdminLoggedIn = enable;
        document.body.classList.toggle('admin-mode', isAdminLoggedIn);
        topAdminBar.style.display = isAdminLoggedIn ? 'flex' : 'none';
        createFolderBtn.style.display = isAdminLoggedIn ? 'flex' : 'none'; // Contrôler la visibilité
        dragDropArea.style.display = isAdminLoggedIn ? 'block' : 'none';

        if (isAdminLoggedIn) {
            adminTabTextEl.textContent = 'ADMIN ✓';
            adminTab.classList.add('admin-logged-in');
        } else {
            adminTabTextEl.textContent = 'Admin';
            adminTab.classList.remove('admin-logged-in');
        }
        displayFiles(currentFirebasePath);
    }

    adminTab.addEventListener('click', (e) => {
        e.preventDefault();
        if (isAdminLoggedIn) {
            // La déconnexion se fait maintenant via le bouton adminLogoutBtn
            // On pourrait garder une option de déconnexion ici aussi si souhaité
            // ou simplement ne rien faire si on clique sur l'onglet admin en étant déjà loggué
        } else {
            const password = prompt("Entrez le mot de passe administrateur :");
            if (password === ADMIN_PASSWORD) {
                toggleAdminMode(true);
                alert("Mode administrateur activé.");
            } else if (password !== null) {
                alert("Mot de passe incorrect.");
            }
        }
        const adminListItem = e.currentTarget.closest('li.list');
        if (adminListItem && !adminListItem.classList.contains('active')) {
            setActiveNavLink.call(adminListItem);
        }
    });

    // NOUVEAU: Gestionnaire pour le bouton de déconnexion admin
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', () => {
            if (isAdminLoggedIn) {
                if (confirm("Voulez-vous vous déconnecter du mode administrateur ?")) {
                    toggleAdminMode(false);
                     // Optionnel: revenir à l'onglet "Cours"
                    const coursTab = document.querySelector('.navigation .list[data-page="cours"]');
                    if (coursTab) setActiveNavLink.call(coursTab);
                }
            }
        });
    }

    // --- Navigation Inférieure --- (Inchangé)
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
        // La gestion du clic sur l'onglet admin est déjà faite plus haut
        // On appelle setActiveNavLink pour tous les onglets (même admin pour l'UI)
        setActiveNavLink.call(this);
    }));


    function setInitialNavState() {
        const activeItem = document.querySelector('.navigation .list.active');
        if (activeItem) setTimeout(() => moveNavIndicator(activeItem), 150);
    }

    // --- Animation Braises --- (Inchangé)
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

    // --- Historique de Navigation --- (Inchangé)
    function updateNavigationHistory(path) {
        if (navigationHistory[currentHistoryIndex] !== path) {
            navigationHistory = navigationHistory.slice(0, currentHistoryIndex + 1);
            navigationHistory.push(path);
            currentHistoryIndex = navigationHistory.length - 1;
        }
        updateHistoryButtons();
    }

    function updateHistoryButtons() {
        backBtn.disabled = currentHistoryIndex <= 0;
        forwardBtn.disabled = currentHistoryIndex >= navigationHistory.length - 1;
    }

    backBtn.addEventListener('click', () => {
        if (currentHistoryIndex > 0) {
            currentHistoryIndex--;
            displayFiles(navigationHistory[currentHistoryIndex], false);
        }
    });

    forwardBtn.addEventListener('click', () => {
        if (currentHistoryIndex < navigationHistory.length - 1) {
            currentHistoryIndex++;
            displayFiles(navigationHistory[currentHistoryIndex], false);
        }
    });

    // --- Logique du Navigateur de Fichiers --- (Inchangé par rapport à la version précédente où ".." était déjà enlevé)
    async function displayFiles(path, updateHistory = true) {
        currentFirebasePath = path;
        if (updateHistory) {
            updateNavigationHistory(path);
        }

        const displayPath = path.replace(/^files\/root\/?/, 'Racine/').replace(/\/files\/?/g, '/').replace(/\/$/, '');
        currentPathDisplayEl.textContent = displayPath || 'Racine';
        fileListEl.innerHTML = '<li>Chargement...</li>';
        const tempParentLinkContainer = fileListEl.parentNode.querySelector('.temp-parent-container');
        if (tempParentLinkContainer) tempParentLinkContainer.remove();


        try {
            const dbRef = firebaseChild(firebaseRef(db), path);
            const snapshot = await firebaseGet(dbRef);
            fileListEl.innerHTML = '';

            let hasFolders = false;
            if (snapshot.exists()) {
                const data = snapshot.val();
                const items = Object.entries(data).filter(([name]) => name !== '_placeholder');

                items.sort(([nameA, itemA], [nameB, itemB]) => {
                    const typeA = itemA.type === 'folder' ? 0 : 1;
                    const typeB = itemB.type === 'folder' ? 0 : 1;
                    if (typeA !== typeB) return typeA - typeB;
                    return nameA.localeCompare(nameB);
                });

                items.forEach(([name, item]) => {
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
                        if (item.type === 'folder') displayFiles(`${path}/${name}/files`);
                        else openFileModal(name, item);
                    });

                    if (isAdminLoggedIn) {
                        li.querySelector('.delete-btn').addEventListener('click', (e) => {
                            e.stopPropagation(); deleteItem(`${path}/${name}`, name, item.type);
                        });
                        li.querySelector('.edit-btn').addEventListener('click', (e) => {
                            e.stopPropagation(); renameItem(`${path}/${name}`, name, item.type);
                        });
                    }
                    fileListEl.appendChild(li);
                });

                if (items.length === 0) {
                    const emptyLi = document.createElement('li');
                    emptyLi.textContent = 'Ce dossier est vide.';
                    emptyLi.classList.add('empty-folder-message');
                    emptyLi.style.gridColumn = "1 / -1";
                    emptyLi.style.textAlign = "center";
                    emptyLi.style.padding = "20px";
                    emptyLi.style.cursor = "default";
                    emptyLi.style.backgroundColor = "transparent";
                    emptyLi.style.borderLeft = "none";
                    fileListEl.appendChild(emptyLi);
                    hasFolders = true;
                }

            } else {
                const notFoundLi = document.createElement('li');
                notFoundLi.textContent = 'Ce dossier est vide ou n\'existe pas.';
                notFoundLi.classList.add('empty-folder-message');
                notFoundLi.style.gridColumn = "1 / -1";
                notFoundLi.style.textAlign = "center";
                notFoundLi.style.padding = "20px";
                notFoundLi.style.cursor = "default";
                notFoundLi.style.backgroundColor = "transparent";
                notFoundLi.style.borderLeft = "none";
                fileListEl.appendChild(notFoundLi);
                hasFolders = true;
            }
            fileListEl.style.display = hasFolders ? 'grid' : 'block';

        } catch (error) {
            console.error("Erreur lecture fichiers:", error);
            fileListEl.innerHTML = '<li>Erreur chargement.</li>';
        }
        updateHistoryButtons();
    }

    // --- Modal (MODIFIÉ) ---
    function openFileModal(fileName, fileData) {
        currentModalFileDataForActions = fileData; // Stocker pour les actions (print, download)
        modalFileNameEl.textContent = fileName;
        modalFileContentEl.innerHTML = '';
        modalControls.style.display = 'none'; // Cacher par défaut, afficher si pertinent
        modalPrintBtn.style.display = 'inline-block'; // Afficher par défaut, cacher si non pertinent

        const dataUri = fileData.base64Content ? `data:${fileData.contentType || 'application/octet-stream'};base64,${fileData.base64Content}` : null;

        if (dataUri) {
            modalControls.style.display = 'flex'; // Afficher la barre de contrôles si on a un contenu
            try {
                if (fileData.contentType && fileData.contentType.startsWith('image/')) {
                    const img = document.createElement('img');
                    img.src = dataUri;
                    img.alt = fileName;
                    modalFileContentEl.appendChild(img);
                } else if (fileData.contentType === 'application/pdf') {
                    const iframe = document.createElement('iframe');
                    iframe.src = dataUri;
                    // iframe.type = 'application/pdf'; // Utile pour certains navigateurs
                    modalFileContentEl.appendChild(iframe);
                } else if (fileData.contentType && fileData.contentType.startsWith('text/')) {
                    const pre = document.createElement('pre');
                    pre.textContent = atob(fileData.base64Content); // Assumer que c'est bien du texte décodable
                    modalFileContentEl.appendChild(pre);
                    modalPrintBtn.style.display = 'none'; // Cacher bouton print pour texte simple
                } else {
                    const p = document.createElement('p');
                    p.textContent = `Type de fichier (${fileData.contentType || 'inconnu'}) non supporté pour un aperçu direct.`;
                    modalFileContentEl.appendChild(p);
                    const downloadLinkForUnsupported = document.createElement('a'); // Offrir un lien direct
                    downloadLinkForUnsupported.href = dataUri;
                    downloadLinkForUnsupported.download = fileName;
                    downloadLinkForUnsupported.textContent = `Télécharger ${fileName}`;
                    downloadLinkForUnsupported.style.display = 'block';
                    downloadLinkForUnsupported.style.marginTop = '10px';
                    modalFileContentEl.appendChild(downloadLinkForUnsupported);
                    modalPrintBtn.style.display = 'none'; // Cacher bouton print
                }
            } catch (e) {
                console.error("Erreur décodage Base64 ou affichage:", e);
                modalFileContentEl.textContent = 'Erreur lors de l\'affichage du fichier.';
                modalPrintBtn.style.display = 'none'; // Cacher bouton print en cas d'erreur
            }
        } else {
            modalFileContentEl.textContent = 'Contenu du fichier indisponible ou vide.';
            modalPrintBtn.style.display = 'none';
            modalDownloadBtn.style.display = 'none'; // Si pas de contenu, pas de téléchargement non plus
        }
        modalEl.style.display = 'block';
        modalEl.classList.remove('fullscreen'); // Assurer que la modale n'est pas en plein écran à l'ouverture
        modalFullscreenBtn.querySelector('ion-icon').setAttribute('name', 'scan-outline');
        modalFullscreenBtn.setAttribute('title', 'Plein écran');
    }

    closeModalBtn.onclick = () => {
        modalEl.style.display = 'none';
        modalFileContentEl.innerHTML = '';
        modalEl.classList.remove('fullscreen'); // Retirer classe plein écran
        modalFullscreenBtn.querySelector('ion-icon').setAttribute('name', 'scan-outline');
        modalFullscreenBtn.setAttribute('title', 'Plein écran');
        currentModalFileDataForActions = null; // Nettoyer
    }
    window.onclick = (event) => {
        if (event.target == modalEl) {
            closeModalBtn.onclick(); // Utiliser la même logique de fermeture
        }
    }

    // Actions de la modale (Print, Download, Fullscreen)
    modalPrintBtn.addEventListener('click', () => {
        if (currentModalFileDataForActions && currentModalFileDataForActions.contentType === 'application/pdf') {
            const iframe = modalFileContentEl.querySelector('iframe');
            if (iframe && iframe.contentWindow) {
                try {
                    iframe.contentWindow.focus(); // Nécessaire pour certains navigateurs
                    iframe.contentWindow.print();
                } catch (e) {
                    alert("L'impression directe a été bloquée par le navigateur. Essayez d'utiliser les options d'impression de la visionneuse PDF (clic droit) ou téléchargez le fichier pour l'imprimer.");
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

    modalFullscreenBtn.addEventListener('click', () => {
        modalEl.classList.toggle('fullscreen');
        const icon = modalFullscreenBtn.querySelector('ion-icon');
        if (modalEl.classList.contains('fullscreen')) {
            icon.setAttribute('name', 'contract-outline');
            modalFullscreenBtn.setAttribute('title', 'Quitter plein écran');
        } else {
            icon.setAttribute('name', 'scan-outline');
            modalFullscreenBtn.setAttribute('title', 'Plein écran');
        }
    });


    // --- Actions Admin (CRUD) --- (MODIFIÉ pour le bouton createFolderBtn)
    if (createFolderBtn) { // createFolderBtn est maintenant indépendant
        createFolderBtn.addEventListener('click', async () => {
            if (!isAdminLoggedIn) return;
            const folderName = prompt("Nom du nouveau dossier :");
            if (folderName && folderName.trim() !== "") {
                const cleanFolderName = folderName.trim().replace(/[.#$[\]]/g, '_');
                const newFolderPathInParent = `${currentFirebasePath}/${cleanFolderName}`;
                try {
                    await firebaseSet(firebaseRef(db, newFolderPathInParent), { type: 'folder', createdAt: new Date().toISOString() });
                    // Assurer que le dossier a un enfant 'files' avec un placeholder pour être listable même vide
                    await firebaseSet(firebaseRef(db, `${newFolderPathInParent}/files/_placeholder`), true);
                    alert(`Dossier "${cleanFolderName}" créé.`);
                    displayFiles(currentFirebasePath);
                } catch (error) { console.error("Erreur création dossier:", error); alert("Erreur création."); }
            }
        });
    }

    if (uploadFileBtn) { // uploadFileBtn est toujours dans topAdminBar
        uploadFileBtn.addEventListener('click', () => { if (isAdminLoggedIn) fileInput.click(); });
    }

    async function handleFileUploads(files) {
        if (!isAdminLoggedIn || !files || files.length === 0) return;

        const MAX_SIZE_MB = 7;
        let largeFileDetected = false;
        let filesToUpload = Array.from(files);
        let uploadedCount = 0;
        const totalFilesToAttempt = filesToUpload.length;

        if (totalFilesToAttempt === 0) return;
        
        // Afficher un message de chargement global peut être une bonne idée ici
        const originalButtonText = uploadFileBtn.innerHTML;
        uploadFileBtn.innerHTML = `<ion-icon name="sync-outline" class="spin"></ion-icon> Téléversement...`;
        uploadFileBtn.disabled = true;


        for (const file of filesToUpload) {
            if (file.size > MAX_SIZE_MB * 1024 * 1024) {
                alert(`Fichier "${file.name}" trop volumineux (> ${MAX_SIZE_MB}MB). Il ne sera pas ajouté.`);
                largeFileDetected = true;
                uploadedCount++; // Compter comme traité
                if (uploadedCount === totalFilesToAttempt) {
                    displayFiles(currentFirebasePath);
                    alert("Téléversement terminé (certains fichiers ont pu être ignorés).");
                    uploadFileBtn.innerHTML = originalButtonText;
                    uploadFileBtn.disabled = false;
                }
                continue;
            }

            const reader = new FileReader();
            reader.onload = async (e) => {
                const base64Content = e.target.result.split(',')[1];
                const fileName = file.name.replace(/[.#$[\]]/g, '_');
                const newFilePath = `${currentFirebasePath}/${fileName}`;
                try {
                    await firebaseSet(firebaseRef(db, newFilePath), {
                        type: 'file', contentType: file.type, base64Content: base64Content,
                        uploadedAt: new Date().toISOString()
                    });
                    console.log(`Fichier "${fileName}" ajouté.`);
                } catch (error) {
                    console.error(`Erreur ajout ${fileName}:`, error);
                    alert(`Erreur ajout ${fileName}. Firebase peut refuser les écritures trop volumineuses.`);
                } finally {
                    uploadedCount++;
                    if (uploadedCount === totalFilesToAttempt) {
                        displayFiles(currentFirebasePath);
                        alert("Téléversement terminé (vérifiez la console pour les erreurs potentielles).");
                        uploadFileBtn.innerHTML = originalButtonText;
                        uploadFileBtn.disabled = false;
                    }
                }
            };
            reader.onerror = (error) => {
                console.error("Erreur lecture fichier:", error);
                uploadedCount++;
                if (uploadedCount === totalFilesToAttempt) {
                    displayFiles(currentFirebasePath);
                    alert("Téléversement terminé avec des erreurs de lecture de fichier.");
                    uploadFileBtn.innerHTML = originalButtonText;
                    uploadFileBtn.disabled = false;
                }
            };
            reader.readAsDataURL(file);
        }
        if (filesToUpload.length === 0 && largeFileDetected) {
            alert("Aucun fichier n'a été téléversé car ils étaient tous trop volumineux.");
             uploadFileBtn.innerHTML = originalButtonText;
             uploadFileBtn.disabled = false;
        }
        fileInput.value = ''; // Réinitialiser pour permettre de re-sélectionner les mêmes fichiers
    }


    if (fileInput) {
        fileInput.addEventListener('change', (event) => handleFileUploads(event.target.files));
    }

    // --- Drag and Drop (MODIFIÉ pour clic) ---
    if (dragDropArea) {
        dragDropArea.addEventListener('dragover', (event) => {
            event.preventDefault();
            if (isAdminLoggedIn) dragDropArea.classList.add('dragover');
        });
        dragDropArea.addEventListener('dragleave', () => {
            if (isAdminLoggedIn) dragDropArea.classList.remove('dragover');
        });
        dragDropArea.addEventListener('drop', (event) => {
            event.preventDefault();
            if (isAdminLoggedIn) {
                dragDropArea.classList.remove('dragover');
                const files = event.dataTransfer.files;
                if (files.length > 0) {
                    handleFileUploads(files);
                }
            }
        });
        // NOUVEAU: Clic sur la zone de drag-drop
        dragDropArea.addEventListener('click', () => {
            if (isAdminLoggedIn) {
                fileInput.click();
            }
        });
    }

    // --- deleteItem et renameItem --- (Inchangé)
    async function deleteItem(itemFullPath, itemName, itemType) {
        if (!isAdminLoggedIn) return;
        if (confirm(`Supprimer "${itemName}" ? Ceci est irréversible.`)) {
            try {
                await firebaseRemove(firebaseRef(db, itemFullPath));
                // Si c'est un dossier, supprimer également son noeud 'files' qui contient les enfants
                if (itemType === 'folder') {
                    await firebaseRemove(firebaseRef(db, `${itemFullPath}/files`)).catch(() => { /* Ignorer l'erreur si files n'existe pas */ });
                }
                alert(`"${itemName}" a été supprimé.`);
                displayFiles(currentFirebasePath);
            } catch (error) { console.error("Erreur lors de la suppression:", error); alert("Erreur de suppression."); }
        }
    }

    async function renameItem(itemFullPath, oldName, itemType) {
        if (!isAdminLoggedIn) return;
        const newNameRaw = prompt(`Entrez le nouveau nom pour "${oldName}":`, oldName);
        if (newNameRaw && newNameRaw.trim() !== "" && newNameRaw.trim() !== oldName) {
            const newName = newNameRaw.trim().replace(/[.#$[\]]/g, '_');
            const parentPath = itemFullPath.substring(0, itemFullPath.lastIndexOf('/'));
            const newItemFullPath = `${parentPath}/${newName}`;

            if (itemFullPath === newItemFullPath) { alert("Le nouveau nom est identique à l'ancien ou invalide après nettoyage."); return; }

            try {
                const itemRef = firebaseRef(db, itemFullPath);
                const snapshot = await firebaseGet(itemRef);
                if (snapshot.exists()) {
                    const itemData = snapshot.val();
                    // Créer le nouvel élément
                    await firebaseSet(firebaseRef(db, newItemFullPath), itemData);

                    // Si c'est un dossier, copier également son contenu (le noeud 'files')
                    if (itemType === 'folder') {
                        const contentsSnapshot = await firebaseGet(firebaseRef(db, `${itemFullPath}/files`));
                        if (contentsSnapshot.exists()) {
                            await firebaseSet(firebaseRef(db, `${newItemFullPath}/files`), contentsSnapshot.val());
                        }
                         // Supprimer l'ancien noeud 'files'
                        await firebaseRemove(firebaseRef(db, `${itemFullPath}/files`)).catch(() => {});
                    }
                    // Supprimer l'ancien élément (la "racine" du dossier ou le fichier lui-même)
                    await firebaseRemove(itemRef);

                    alert(`"${oldName}" a été renommé en "${newName}".`);
                    displayFiles(currentFirebasePath);
                } else { alert("L'élément à renommer n'a pas été trouvé."); }
            } catch (error) { console.error("Erreur lors du renommage:", error); alert("Erreur de renommage."); }
        }
    }

    // Initial load
    setInitialNavState();
    displayFiles(currentFirebasePath, true);
    toggleAdminMode(false); // Démarrer en mode non-admin
});

// CSS pour l'icône de chargement qui tourne
const style = document.createElement('style');
style.innerHTML = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  .spin {
    animation: spin 1s linear infinite;
  }
`;
document.head.appendChild(style);
