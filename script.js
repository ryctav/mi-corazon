// --- CONFIGURACIÓN ---
const CLOUDINARY_CLOUD_NAME = 'dhshscbvx'; // <-- REEMPLAZA ESTO
const CLOUDINARY_UPLOAD_PRESET = 'grabaciones qr'; // <-- REEMPLAZA ESTO
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`;

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
// Pedir permiso para el micrófono
navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            // Crear el archivo de audio a partir de los trozos grabados
            audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const audioUrl = URL.createObjectURL(audioBlob);

            // Mostrar el reproductor para confirmar
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
    // Limpiar estado anterior
    audioChunks = [];
    qrContainer.innerHTML = '';
    audioPlayback.style.display = 'none';
    confirmButton.style.display = 'none';

    // Empezar a grabar
    mediaRecorder.start();
    
    // Actualizar UI
    recordButton.disabled = true;
    stopButton.disabled = false;
    statusText.textContent = 'Grabando... Habla ahora.';
});

stopButton.addEventListener('click', () => {
    // Detener grabación
    mediaRecorder.stop();

    // Actualizar UI
    recordButton.disabled = false;
    stopButton.disabled = true;
});


// --- Lógica de Confirmación y Subida ---

confirmButton.addEventListener('click', () => {
    statusText.textContent = 'Subiendo audio a la nube...';
    confirmButton.disabled = true;
    
    // Crear un formulario para enviar el archivo
    const formData = new FormData();
    formData.append('file', audioBlob);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    // Usar fetch para subir el archivo a Cloudinary
    fetch(CLOUDINARY_URL, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.secure_url) {
            statusText.textContent = '¡Listo! Escanea tu código QR.';
            // Ocultar botones de confirmación
            audioPlayback.style.display = 'none';
            confirmButton.style.display = 'none';
            // Generar el QR
            generateQRCode(data.secure_url);
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

// --- Lógica de Generación de QR ---

function generateQRCode(audioUrl) {
    // Limpiar cualquier QR anterior
    qrContainer.innerHTML = ''; 

    // Crear el nuevo QR
    new QRCode(qrContainer, {
        text: audioUrl, 
        width: 200,
        height: 200,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });
}
