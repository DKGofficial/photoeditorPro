document.getElementById('upload').addEventListener('change', handleImageUpload);

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let originalImage = null;

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            originalImage = img;
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function applyFilters() {
    const brightness = document.getElementById('brightness').value;
    const contrast = document.getElementById('contrast').value;
    const grayscale = document.getElementById('grayscale').value;
    const sepia = document.getElementById('sepia').value;
    const invert = document.getElementById('invert').value;
    const hueRotate = document.getElementById('hueRotate').value;
    const saturate = document.getElementById('saturate').value;
    const colorFilter = document.getElementById('colorFilter').value;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) grayscale(${grayscale}%) sepia(${sepia}%) invert(${invert}%) hue-rotate(${hueRotate}deg) saturate(${saturate}%)`;
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);

    if (colorFilter !== '#ffffff') {
        ctx.fillStyle = colorFilter + '80'; // Apply color with transparency
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

const controls = document.querySelectorAll('.controls input');
controls.forEach(control => control.addEventListener('input', applyFilters));

document.querySelectorAll('.filter-btn').forEach(button => {
    button.addEventListener('click', () => {
        applyPredefinedFilter(button.dataset.filter);
    });
});

function applyPredefinedFilter(filter) {
    switch(filter) {
        case 'vintage':
            document.getElementById('brightness').value = 90;
            document.getElementById('contrast').value = 110;
            document.getElementById('sepia').value = 40;
            document.getElementById('saturate').value = 120;
            break;
        case 'bright':
            document.getElementById('brightness').value = 150;
            document.getElementById('contrast').value = 130;
            document.getElementById('saturate').value = 150;
            break;
        case 'bw':
            document.getElementById('grayscale').value = 100;
            document.getElementById('contrast').value = 120;
            break;
        case 'cool':
            document.getElementById('hueRotate').value = 200;
            document.getElementById('saturate').value = 110;
            break;
    }
    applyFilters();
}

document.getElementById('applyResize').addEventListener('click', () => {
    const width = parseInt(document.getElementById('resizeWidth').value);
    const height = parseInt(document.getElementById('resizeHeight').value);
    const targetKB = parseInt(document.getElementById('resizeKB').value);
    const rotateDegrees = parseInt(document.getElementById('rotate').value);

    if (targetKB > 0) {
        resizeToTargetSize(targetKB);
    } else if (width && height) {
        resizeImage(width, height);
    }

    if (!isNaN(rotateDegrees)) {
        rotateImage(rotateDegrees);
    }
});

function resizeImage(width, height) {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = width;
    tempCanvas.height = height;
    tempCtx.drawImage(canvas, 0, 0, width, height);
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(tempCanvas, 0, 0);
}

function rotateImage(degrees) {
    const radians = degrees * (Math.PI / 180);
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    const sin = Math.abs(Math.sin(radians));
    const cos = Math.abs(Math.cos(radians));
    const newWidth = canvas.width * cos + canvas.height * sin;
    const newHeight = canvas.width * sin + canvas.height * cos;

    tempCanvas.width = newWidth;
    tempCanvas.height = newHeight;

    tempCtx.translate(newWidth / 2, newHeight / 2);
    tempCtx.rotate(radians);
    tempCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);

    canvas.width = newWidth;
    canvas.height = newHeight;
    ctx.clearRect(0, 0, newWidth, newHeight);
    ctx.drawImage(tempCanvas, 0, 0);
}

function resizeToTargetSize(targetKB) {
    const targetBytes = targetKB * 1024;
    let minQuality = 0.01;
    let maxQuality = 1.0;
    let attempts = 0;

    function binarySearchQuality(minQ, maxQ) {
        const quality = (minQ + maxQ) / 2;
        canvas.toBlob(blob => {
            const sizeDiff = blob.size - targetBytes;
            if (Math.abs(sizeDiff) < 512 || attempts > 30) {
                updateImageSizeDisplay(blob.size);
                return;
            }
            attempts++;
            if (sizeDiff > 0) {
                binarySearchQuality(minQ, quality);
            } else {
                binarySearchQuality(quality, maxQ);
            }
        }, 'image/jpeg', quality);
    }

    binarySearchQuality(minQuality, maxQuality);
}

function updateImageSizeDisplay(sizeInBytes) {
    const sizeInKB = (sizeInBytes / 1024).toFixed(2);
    const sizeDisplay = document.getElementById('imageSizeDisplay');
    if (!sizeDisplay) {
        const sizeElement = document.createElement('p');
        sizeElement.id = 'imageSizeDisplay';
        sizeElement.textContent = `Current Image Size: ${sizeInKB} KB`;
        document.querySelector('.editor-container').appendChild(sizeElement);
    } else {
        sizeDisplay.textContent = `Current Image Size: ${sizeInKB} KB`;
    }
}

document.getElementById('download').addEventListener('click', () => {
    const targetKB = parseInt(document.getElementById('resizeKB').value);
    if (targetKB > 0) {
        resizeToTargetSize(targetKB);
    } else {
        canvas.toBlob(blob => {
            updateImageSizeDisplay(blob.size);
            downloadBlob(blob);
        }, 'image/jpeg', 1);
    }
});

function downloadBlob(blob) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'edited_image.jpg';
    link.click();
}

document.getElementById('reset').addEventListener('click', () => {
    if (originalImage) {
        ctx.filter = 'none';
        canvas.width = originalImage.width;
        canvas.height = originalImage.height;
        ctx.drawImage(originalImage, 0, 0);
        controls.forEach(control => control.value = control.defaultValue);
        updateImageSizeDisplay(originalImage.src.length);
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') {
        rotateImage(15);
    } else if (event.key === 'ArrowLeft') {
        rotateImage(-15);
    } else if (event.key === 'ArrowUp') {
        document.getElementById('brightness').value = parseInt(document.getElementById('brightness').value) + 10;
        applyFilters();
    } else if (event.key === 'ArrowDown') {
        document.getElementById('brightness').value = parseInt(document.getElementById('brightness').value) - 10;
        applyFilters();
    }
});
