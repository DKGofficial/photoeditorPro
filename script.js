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

    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) grayscale(${grayscale}%) sepia(${sepia}%) invert(${invert}%) hue-rotate(${hueRotate}deg) saturate(${saturate}%)`;
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
}

const controls = document.querySelectorAll('.controls input');
controls.forEach(control => control.addEventListener('input', applyFilters));

document.getElementById('applyResize').addEventListener('click', () => {
    const width = parseInt(document.getElementById('resizeWidth').value);
    const height = parseInt(document.getElementById('resizeHeight').value);
    const targetKB = parseInt(document.getElementById('resizeKB').value);
    const dpi = parseInt(document.getElementById('dpi').value);

    if (targetKB > 0) {
        resizeToTargetSize(targetKB, dpi);
    } else if (width && height) {
        resizeImage(width, height, dpi);
    }
});

function resizeImage(width, height, dpi = 72) {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = width;
    tempCanvas.height = height;
    tempCtx.drawImage(canvas, 0, 0, width, height);
    
    setDPI(tempCanvas, dpi);
    
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(tempCanvas, 0, 0);
}

function resizeToTargetSize(targetKB, dpi = 72) {
    const targetBytes = targetKB * 1024;
    let minQuality = 0.01;
    let maxQuality = 1.0;
    let attempts = 0;

    function binarySearchQuality(minQ, maxQ) {
        const quality = (minQ + maxQ) / 2;
        canvas.toBlob(blob => {
            const sizeDiff = blob.size - targetBytes;
            if (Math.abs(sizeDiff) < 512 || attempts > 30) {
                downloadBlob(blob);
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

    setDPI(canvas, dpi);
    binarySearchQuality(minQuality, maxQuality);
}

function setDPI(canvas, dpi) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.putImageData(imageData, 0, 0);

    const scale = dpi / 96;
    canvas.width = Math.floor(canvas.width * scale);
    canvas.height = Math.floor(canvas.height * scale);
    ctx.scale(scale, scale);
    ctx.drawImage(tempCanvas, 0, 0);
}

function downloadBlob(blob) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'edited_image.jpg';
    link.click();
}

document.getElementById('download').addEventListener('click', () => {
    const targetKB = parseInt(document.getElementById('resizeKB').value);
    const dpi = parseInt(document.getElementById('dpi').value);
    if (targetKB > 0) {
        resizeToTargetSize(targetKB, dpi);
    } else {
        setDPI(canvas, dpi);
        canvas.toBlob(blob => {
            downloadBlob(blob);
        }, 'image/jpeg', 1);
    }
});

document.getElementById('reset').addEventListener('click', () => {
    if (originalImage) {
        ctx.filter = 'none';
        canvas.width = originalImage.width;
        canvas.height = originalImage.height;
        ctx.drawImage(originalImage, 0, 0);
        controls.forEach(control => control.value = control.defaultValue);
    }
});
