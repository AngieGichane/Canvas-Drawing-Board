// DOM Elements
const canvas = document.getElementById('drawing-board');
const ctx = canvas.getContext('2d');
const brushColor = document.getElementById('brush-color');
const brushSize = document.getElementById('brush-size');
const sizeDisplay = document.getElementById('size-display');
const clearBtn = document.getElementById('clear-btn');
const saveBtn = document.getElementById('save-btn');
const usernameInput = document.getElementById('username');
const gallery = document.getElementById('gallery');

// Canvas setup
function setupCanvas() {
    // Set canvas size to match its container
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Set default canvas style
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
}

// Drawing variables
let isDrawing = false;
let lastX = 0;
let lastY = 0;

// Drawing functions
function startDrawing(e) {
    isDrawing = true;
    const { offsetX, offsetY } = getCoordinates(e);
    lastX = offsetX;
    lastY = offsetY;
}

function draw(e) {
    if (!isDrawing) return;
    
    const { offsetX, offsetY } = getCoordinates(e);
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(offsetX, offsetY);
    ctx.strokeStyle = brushColor.value;
    ctx.lineWidth = brushSize.value;
    ctx.stroke();
    
    // Update last position
    lastX = offsetX;
    lastY = offsetY;
}

function stopDrawing() {
    isDrawing = false;
}

// Helper function to get coordinates for both mouse and touch events
function getCoordinates(e) {
    let offsetX, offsetY;
    
    if (e.type.includes('touch')) {
        const rect = canvas.getBoundingClientRect();
        offsetX = e.touches[0].clientX - rect.left;
        offsetY = e.touches[0].clientY - rect.top;
    } else {
        offsetX = e.offsetX;
        offsetY = e.offsetY;
    }
    
    return { offsetX, offsetY };
}

// Clear canvas
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Save drawing to Firebase
function saveDrawing() {
    const username = usernameInput.value.trim() || 'Anonymous';
    
    // Check if canvas is empty (all white)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let isCanvasEmpty = true;
    for (let i = 0; i < imageData.length; i += 4) {
        if (imageData[i] !== 255 || imageData[i + 1] !== 255 || imageData[i + 2] !== 255) {
            isCanvasEmpty = false;
            break;
        }
    }
    
    if (isCanvasEmpty) {
        alert('Draw something before saving!');
        return;
    }
    
    // Show saving indicator
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;
    
    // Get image data
    const imageDataUrl = canvas.toDataURL('image/png');
    
    // Create a reference in storage
    const timestamp = Date.now();
    const storageRef = storage.ref(`drawings/${timestamp}.png`);
    
    // Convert data URL to blob
    const blob = dataURItoBlob(imageDataUrl);
    
    // Upload to Firebase Storage
    storageRef.put(blob)
        .then(snapshot => snapshot.ref.getDownloadURL())
        .then(url => {
            // Store metadata in Firestore
            return db.collection('drawings').add({
                imageUrl: url,
                username: username,
                timestamp: timestamp,
                date: new Date().toISOString()
            });
        })
        .then(() => {
            alert('Drawing saved successfully!');
            loadDrawings(); // Reload gallery
        })
        .catch(error => {
            console.error('Error saving drawing:', error);
            alert('Failed to save drawing. Please try again.');
        })
        .finally(() => {
            saveBtn.textContent = 'Save Drawing';
            saveBtn.disabled = false;
        });
}

// Convert data URL to Blob
function dataURItoBlob(dataURI) {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    
    return new Blob([ab], { type: mimeString });
}

// Load drawings from Firebase
function loadDrawings() {
    gallery.innerHTML = '<p id="loading-text">Loading gallery...</p>';
    
    db.collection('drawings')
        .orderBy('timestamp', 'desc')
        .limit(12)
        .get()
        .then(snapshot => {
            gallery.innerHTML = '';
            
            if (snapshot.empty) {
                gallery.innerHTML = '<p id="loading-text">No drawings yet. Be the first to add one!</p>';
                return;
            }
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const drawingElement = createDrawingElement(data);
                gallery.appendChild(drawingElement);
            });
        })
        .catch(error => {
            console.error('Error loading drawings:', error);
            gallery.innerHTML = '<p id="loading-text">Failed to load drawings. Please refresh the page.</p>';
        });
}

// Create drawing element for gallery
function createDrawingElement(data) {
    const div = document.createElement('div');
    div.className = 'drawing-item';
    
    const img = document.createElement('img');
    img.className = 'drawing-image';
    img.src = data.imageUrl;
    img.alt = `Drawing by ${data.username}`;
    img.loading = 'lazy';
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'drawing-info';
    
    const userName = document.createElement('h3');
    userName.textContent = data.username;
    
    const date = document.createElement('p');
    date.className = 'drawing-date';
    date.textContent = formatDate(data.date);
    
    infoDiv.appendChild(userName);
    infoDiv.appendChild(date);
    
    div.appendChild(img);
    div.appendChild(infoDiv);
    
    return div;
}

// Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Update size display
function updateSizeDisplay() {
    sizeDisplay.textContent = `${brushSize.value}px`;
}

// Event listeners
window.addEventListener('load', () => {
    setupCanvas();
    loadDrawings();
    updateSizeDisplay();
    
    // Resize canvas on window resize
    window.addEventListener('resize', setupCanvas);
    
    // Drawing events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDrawing);
    
    // Control events
    brushSize.addEventListener('input', updateSizeDisplay);
    clearBtn.addEventListener('click', clearCanvas);
    saveBtn.addEventListener('click', saveDrawing);
});