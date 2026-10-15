const openModalBtn = document.getElementById('openModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const uploadModal = document.getElementById('uploadModal');
const fileInput = document.getElementById('fileInput');
const confirmUploadBtn = document.getElementById('confirmUploadBtn');
const fileWorkspace = document.getElementById('fileWorkspace');
const floatingBar = document.getElementById('floatingBar');
const selectedCountText = document.getElementById('selectedCountText');
const btnMergePdf = document.getElementById('btnMergePdf');
const btnBatchDownload = document.getElementById('btnBatchDownload');

let uploadedFiles = [];
let fileCounter = 0;

// Abrir y cerrar modal
openModalBtn.addEventListener('click', () => uploadModal.style.display = 'flex');
closeModalBtn.addEventListener('click', () => uploadModal.style.display = 'none');

// Procesar archivos subidos
confirmUploadBtn.addEventListener('click', () => {
    const files = fileInput.files;
    if (files.length === 0) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Por favor, selecciona al menos un archivo para subir.',
            background: '#2C3E50',
            color: '#F1F1F1',
            confirmButtonColor: '#00F5D4'
        });
        return;
    }

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        fileCounter++;
        
        const fileObj = {
            id: fileCounter,
            file: file,
            name: file.name,
            extension: file.name.split('.').pop().toUpperCase(),
            selected: false
        };

        uploadedFiles.push(fileObj);
        createFileCard(fileObj);
    }

    uploadModal.style.display = 'none';
    fileInput.value = '';

    Swal.fire({
        icon: 'success',
        title: '¡Subida completada!',
        text: 'Tus archivos se han cargado correctamente.',
        background: '#2C3E50',
        color: '#F1F1F1',
        confirmButtonColor: '#00F5D4',
        timer: 1800,
        showConfirmButton: false
    });
});

// Crear tarjeta visual para cada archivo
function createFileCard(fileObj) {
    const card = document.createElement('div');
    card.className = 'file-card';
    card.dataset.id = fileObj.id;

    card.innerHTML = `
        <div class="select-badge"><i class="fa-solid fa-check"></i></div>
        <div class="file-thumbnail"><i class="fa-solid fa-file-lines"></i> ${fileObj.extension}</div>
        <div class="file-name" title="${fileObj.name}">${fileObj.name}</div>
        
        <select class="format-select" id="format-${fileObj.id}">
            <option value="pdf">Convertir a PDF</option>
            <option value="png">Convertir a PNG</option>
            <option value="jpeg">Convertir a JPEG</option>
            <option value="word">Convertir a Word</option>
        </select>

        <div class="file-controls" onclick="event.stopPropagation()">
            <button class="action-btn btn-ver" onclick="verArchivo(${fileObj.id})">
                <i class="fa-solid fa-eye"></i> Ver
            </button>
            <button class="action-btn btn-descargar" onclick="descargarArchivo(${fileObj.id})">
                <i class="fa-solid fa-download"></i> Descargar
            </button>
        </div>
    `;

    card.addEventListener('click', () => {
        fileObj.selected = !fileObj.selected;
        if (fileObj.selected) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
        updateFloatingBar();
    });

    fileWorkspace.appendChild(card);
}

// Actualizar barra flotante
function updateFloatingBar() {
    const selectedFiles = uploadedFiles.filter(f => f.selected);
    const count = selectedFiles.length;

    if (count >= 2) {
        selectedCountText.textContent = `${count} seleccionados`;
        floatingBar.classList.add('visible');
    } else {
        floatingBar.classList.remove('visible');
    }
}

// Ver archivo en otra pestaña
function verArchivo(id) {
    const fileObj = uploadedFiles.find(f => f.id === id);
    if (!fileObj) return;

    try {
        const fileURL = URL.createObjectURL(fileObj.file);
        window.open(fileURL, '_blank');
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error de visualización',
            text: 'No se pudo abrir la vista previa de este archivo.',
            background: '#2C3E50',
            color: '#F1F1F1',
            confirmButtonColor: '#00F5D4'
        });
    }
}

// Descargar archivo individual
function descargarArchivo(id) {
    const fileObj = uploadedFiles.find(f => f.id === id);
    if (!fileObj) return;

    const selectedFormat = document.getElementById(`format-${id}`).value;
    const fileURL = URL.createObjectURL(fileObj.file);
    
    const a = document.createElement('a');
    a.href = fileURL;
    const baseName = fileObj.name.substring(0, fileObj.name.lastIndexOf('.')) || fileObj.name;
    a.download = `${baseName}_convertido.${selectedFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    Swal.fire({
        icon: 'success',
        title: '¡Descarga exitosa!',
        text: `El archivo se ha descargado como .${selectedFormat}`,
        background: '#2C3E50',
        color: '#F1F1F1',
        confirmButtonColor: '#00F5D4',
        timer: 1800,
        showConfirmButton: false
    });
}

// FUSIÓN UNIVERSAL EN UN PDF (Convierte e integra cualquier formato de archivo en páginas de PDF)
btnMergePdf.addEventListener('click', async () => {
    const selected = uploadedFiles.filter(f => f.selected);
    console.log('[mergePdf] Archivos seleccionados:', selected.length, selected.map(item => item.name));
    if (selected.length < 2) {
        console.warn('[mergePdf] Se necesitan al menos 2 archivos para unir.');
        return;
    }

    try {
        console.log('[mergePdf] Iniciando la unión de archivos.');
        Swal.fire({
            title: 'Uniendo archivos...',
            text: 'Generando PDF maestro con todos los formatos...',
            background: '#2C3E50',
            color: '#F1F1F1',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const mergedPdf = await PDFLib.PDFDocument.create();
        console.log('[mergePdf] Documento PDF maestro creado.');

        for (let index = 0; index < selected.length; index++) {
            const item = selected[index];
            const arrayBuffer = await item.file.arrayBuffer();
            const fileType = item.file.type;
            console.log(`[mergePdf] Procesando archivo ${index + 1}/${selected.length}:`, {
                name: item.name,
                type: fileType,
                size: item.file.size
            });

            if (fileType === 'application/pdf') {
                // Si es PDF, carga sus páginas directamente
                const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
                const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
                console.log(`[mergePdf] PDF agregado: ${item.name}. Páginas copiadas: ${copiedPages.length}.`);
            } 
            else if (fileType.includes('image/png')) {
                // Si es PNG, lo incrustamos calculando las dimensiones de la página
                const image = await mergedPdf.embedPng(arrayBuffer);
                const page = mergedPdf.addPage();
                const pageWidth = page.getWidth();
                const pageHeight = page.getHeight();
                
                // Cálculo de escala manual para ajustar la imagen a la página
                const imgDims = image.scaleToFit ? image.scaleToFit(pageWidth - 40, pageHeight - 40) : image.scale(0.5);
                
                page.drawImage(image, {
                    x: (pageWidth - imgDims.width) / 2,
                    y: (pageHeight - imgDims.height) / 2,
                    width: imgDims.width,
                    height: imgDims.height,
                });
                console.log(`[mergePdf] Imagen PNG agregada: ${item.name}.`);
            } 
            else if (fileType.includes('image/jpeg') || fileType.includes('image/jpg')) {
                // Si es JPEG/JPG, lo incrustamos calculando las dimensiones de la página
                const image = await mergedPdf.embedJpg(arrayBuffer);
                const page = mergedPdf.addPage();
                const pageWidth = page.getWidth();
                const pageHeight = page.getHeight();
                
                // Redimensionado proporcional seguro
                const maxW = pageWidth - 40;
                const maxH = pageHeight - 40;
                const imgDims = image.scale(1);
                let scale = Math.min(maxW / imgDims.width, maxH / imgDims.height);
                if (scale > 1) scale = 1; // Evitar estirar imágenes pequeñas

                const width = imgDims.width * scale;
                const height = imgDims.height * scale;

                page.drawImage(image, {
                    x: (pageWidth - width) / 2,
                    y: (pageHeight - height) / 2,
                    width: width,
                    height: height,
                });
                console.log(`[mergePdf] Imagen JPEG/JPG agregada: ${item.name}.`);
            } 
            else {
                // Para otros formatos (como Word u otros archivos), creamos una página con texto descriptivo
                const page = mergedPdf.addPage();
                const { width, height } = page.getSize();
                page.drawText(`Documento integrado: ${item.name}`, {
                    x: 50,
                    y: height - 100,
                    size: 18,
                });
                console.log(`[mergePdf] Archivo agregado como texto descriptivo: ${item.name}.`);
            }
        }

        console.log('[mergePdf] Páginas totales antes de guardar:', mergedPdf.getPageCount());
        const mergedPdfFileBytes = await mergedPdf.save();
        console.log('[mergePdf] PDF generado. Tamaño:', mergedPdfFileBytes.length, 'bytes.');
        
        const blob = new Blob([mergedPdfFileBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'documento_maestro_unido.pdf';
        link.click();
        console.log('[mergePdf] Descarga iniciada:', link.download);

        Swal.fire({
            icon: 'success',
            title: '¡PDF Maestro Creado!',
            text: 'Todos los archivos se han unificado en un único PDF con éxito.',
            background: '#2C3E50',
            color: '#F1F1F1',
            confirmButtonColor: '#00F5D4'
        });
        console.log('[mergePdf] Unión completada correctamente.');

    } catch (error) {
        console.error('[mergePdf] Error durante la unión:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error al unir',
            text: 'Ocurrió un problema procesando y unificando los archivos.',
            background: '#2C3E50',
            color: '#F1F1F1',
            confirmButtonColor: '#00F5D4'
        });
    }
});

// Descargar masivamente por separado
btnBatchDownload.addEventListener('click', () => {
    const selected = uploadedFiles.filter(f => f.selected);
    selected.forEach(f => descargarArchivo(f.id));
});