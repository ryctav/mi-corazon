// --- CONFIGURACIÓN ---
const CLOUDINARY_CLOUD_NAME = 'dhshscbvx';
const CLOUDINARY_UPLOAD_PRESET = 'grabaciones qr';
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`;
const BASE_URL = 'https://ryctav.github.io/mi-corazon'; // <-- Tu dominio personalizado

// --- Elementos del DOM ---
const recordButton = document.getElementById('recordButton');
const stopButton = document.getElementById('stopButton');
const audioPlayback = document.getElementById('audioPlayback');
const confirmButton = document.getElementById('confirmButton');
const statusText = document.getElementById('status');
const qrContainer = document.getElementById('qrContainer');

// --- Variables para la grabación ---
let mediaRecorder;
let audioChunks = [];
let audioBlob;

// --- Lógica de Grabación ---
navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const audioUrl = URL.createObjectURL(audioBlob);
            audioPlayback.src = audioUrl;
            audioPlayback.style.display = 'block';
            confirmButton.style.display = 'inline-block';
            statusText.textContent = 'Audio grabado. Escúchalo y confirma.';
        };

    }).catch(err => {
        console.error("Error al acceder al micrófono:", err);
        statusText.textContent = "Error: No se pudo acceder al micrófono.";
    });

recordButton.addEventListener('click', () => {
    audioChunks = [];
    qrContainer.innerHTML = '';
    audioPlayback.style.display = 'none';
    confirmButton.style.display = 'none';

    mediaRecorder.start();
    
    recordButton.disabled = true;
    stopButton.disabled = false;
    statusText.textContent = 'Grabando... Habla ahora.';
});

stopButton.addEventListener('click', () => {
    mediaRecorder.stop();
    recordButton.disabled = false;
    stopButton.disabled = true;
});

// --- Confirmación y subida a Cloudinary ---
confirmButton.addEventListener('click', () => {
    statusText.textContent = 'Subiendo audio a la nube...';
    confirmButton.disabled = true;

    const formData = new FormData();
    formData.append('file', audioBlob);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    fetch(CLOUDINARY_URL, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.secure_url) {
            const publicId = getPublicIdFromUrl(data.secure_url);
            const customUrl = `${BASE_URL}/escuchar.html?audio=${publicId}`;

            statusText.textContent = '¡Listo! Escanea tu código QR.';
            audioPlayback.style.display = 'none';
            confirmButton.style.display = 'none';
            generateQRCode(customUrl);
        } else {
            throw new Error('La URL segura no se recibió de Cloudinary.');
        }
    })
    .catch(error => {
        console.error('Error al subir el audio:', error);
        statusText.textContent = 'Error al subir el audio. Inténtalo de nuevo.';
        confirmButton.disabled = false;
    });
});

// --- Generar código QR ---
function generateQRCode(url) {
    qrContainer.innerHTML = ''; 
    new QRCode(qrContainer, {
        text: url, 
        width: 200,
        height: 200,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });
}

// --- Extra: extraer public_id sin extensión ---
function getPublicIdFromUrl(url) {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    return filename.split('.')[0];
}
