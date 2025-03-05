document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/qr/dashboard', { credentials: 'include' })
        .then((res) => {
            if (!res.ok && window.location.pathname !== '/tutorial.html') {
                window.location.href = '/index.html';
            }
        })
        .catch(() => (window.location.href = '/index.html'));

    // Logout
    const logoutLink = document.getElementById('logout');
    if (logoutLink) {
        logoutLink.addEventListener('click', async (e) => {
            e.preventDefault();
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
            window.location.href = '/index.html';
        });
    }

    // Dashboard
    if (window.location.pathname === '/dashboard.html') {
        fetch('/api/qr/dashboard', { credentials: 'include' })
            .then((res) => res.json())
            .then((data) => {
                const tbody = document.querySelector('#qrTable tbody');
                data.forEach((qr) => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
            <td>${qr.id}</td>
            <td class="destination">
              ${qr.destination}
              <span>${new Date(qr.createdAt).toLocaleString()}</span>
            </td>
            <td>
              <img src="${qr.qrSVG}" alt="QR Code SVG" class="qr-code">
              <div class="download-links" style="text-align: center;">
                <a href="${qr.qrSVG}" download="qr_code_${qr.id}.svg">SVG</a> | <a href="#" onclick="downloadPng('${qr.qrSVG}', ${qr.id}); return false;">PNG</a>
              </div>
            </td>
            <td class="actions">
              <button onclick="editQr(${qr.id}, '${qr.destination}')">Edit</button>
              <button onclick="deleteQr(${qr.id})">Delete</button>
            </td>
          `;
                    tbody.appendChild(row);
                });
            })
            .catch((err) => console.error(err));

        document.getElementById('createQrBtn').addEventListener('click', () => {
            window.location.href = '/create-qr.html';
        });
    }

    // Create QR Code
    const createQrForm = document.getElementById('createQrForm');
    if (createQrForm) {
        let currentQrData = null;
        createQrForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const destination = document.getElementById('destination').value;

            const res = await fetch('/api/qr/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ destination }),
            });
            const data = await res.json();
            console.log('Received QR data:', data); // Debug log

            if (res.ok) {
                currentQrData = data;
                const qrSvg = document.getElementById('qrSvg');
                qrSvg.innerHTML = ''; // Clear any existing content
                // Display SVG as an image using the data URL
                const svgImg = new Image();
                svgImg.src = data.qrSVG;
                svgImg.style.maxWidth = '200px'; // Match PNG size (if displayed)
                qrSvg.appendChild(svgImg);
                document.getElementById('qrResult').style.display = 'block';

                document.getElementById('downloadPng').onclick = () => {
                    downloadPng(data.qrSVG, null); // Use null for ID since it's a preview
                    return false;
                };

                document.getElementById('downloadSvg').onclick = () => {
                    // Extract base64 data from the data URL and create a Blob
                    const base64Data = data.qrSVG.split(',')[1]; // Get the base64 part
                    const byteCharacters = atob(base64Data); // Decode base64 to binary string
                    const byteArrays = new Uint8Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteArrays[i] = byteCharacters.charCodeAt(i);
                    }
                    const blob = new Blob([byteArrays], { type: 'image/svg+xml' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'qr_code.svg';
                    link.click();
                    URL.revokeObjectURL(url);
                };

                document.getElementById('saveQr').onclick = async () => {
                    const saveRes = await fetch('/api/qr/save', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ destination }),
                    });
                    if (saveRes.ok) {
                        window.location.href = '/dashboard.html';
                    }
                };
            }
        });
    }

    // Edit QR Code
    const editQrForm = document.getElementById('editQrForm');
    if (editQrForm) {
        const urlParams = new URLSearchParams(window.location.search);
        const qrId = urlParams.get('id');
        const destination = urlParams.get('destination');
        document.getElementById('destination').value = destination || '';

        editQrForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newDestination = document.getElementById('destination').value;

            const res = await fetch(`/api/qr/edit/${qrId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ destination: newDestination }),
            });
            const data = await res.json();

            const messageDiv = document.getElementById('message');
            if (res.ok) {
                messageDiv.textContent = 'QR code updated. Redirecting...';
                setTimeout(() => (window.location.href = '/dashboard.html'), 2000);
            } else {
                messageDiv.textContent = data.message;
            }
        });
    }

    // Tutorial
    if (window.location.pathname === '/tutorial.html') {
        fetch('/api/qr/tutorial')
            .then((res) => res.json())
            .then((data) => {
                document.getElementById('tutorialContent').innerText = data.tutorial;
            })
            .catch((err) => console.error(err));
    }

    // Global functions for buttons
    window.deleteQr = async (id) => {
        if (confirm('Are you sure you want to delete this QR code?')) {
            const res = await fetch(`/api/qr/delete/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (res.ok) {
                window.location.reload();
            }
        }
    };

    window.editQr = (id, destination) => {
        window.location.href = `/edit-qr.html?id=${id}&destination=${encodeURIComponent(destination)}`;
    };

    // Function to convert SVG to PNG and download (client-side)
    window.downloadPng = async (svgDataUrl, qrId) => {
        try {
            if (typeof html2canvas === 'undefined') {
                throw new Error('html2canvas library is not loaded. Please check your internet connection or script inclusion.');
            }

            const base64Data = svgDataUrl.split(',')[1]; // Get the base64 part
            const rawSvg = atob(base64Data); // Decode base64 to SVG string
            console.log('Decoded SVG:', rawSvg.substring(0, 200) + '...'); // Debug log to inspect SVG

            // Create a temporary SVG element and wrap it in a styled div to scale to 300x300
            const svgWrapper = document.createElement('div');
            svgWrapper.innerHTML = rawSvg;
            svgWrapper.style.width = '300px'; // Force width to 300 pixels
            svgWrapper.style.height = '300px'; // Force height to 300 pixels
            svgWrapper.style.overflow = 'hidden'; // Prevent overflow
            // Ensure the SVG scales to fit the wrapper while maintaining aspect ratio
            const svgElement = svgWrapper.querySelector('svg');
            if (svgElement) {
                svgElement.style.width = '100%'; // Scale to full width of wrapper
                svgElement.style.height = '100%'; // Scale to full height of wrapper
                svgElement.style.objectFit = 'contain'; // Maintain aspect ratio and fit within bounds
            }

            document.body.appendChild(svgWrapper); // Temporarily add to DOM for rendering

            // Use html2canvas to render the scaled SVG to a canvas at 300x300 pixels
            const canvas = await html2canvas(svgWrapper, {
                width: 300, // Set canvas width to 300 pixels
                height: 300, // Set canvas height to 300 pixels
                scale: 1, // Prevent scaling issues
                useCORS: true, // Enable CORS if needed (for external resources, if any)
                logging: true, // Enable logging for debugging
                backgroundColor: null, // Transparent background to match SVG
            });

            // Remove the temporary SVG element
            document.body.removeChild(svgWrapper);

            // Convert canvas to PNG data URL
            const pngDataUrl = canvas.toDataURL('image/png');

            // Create a Blob from the PNG data URL and trigger download
            const pngBase64 = pngDataUrl.split(',')[1];
            const byteCharacters = atob(pngBase64);
            const byteArrays = new Uint8Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteArrays[i] = byteCharacters.charCodeAt(i);
            }
            const blob = new Blob([byteArrays], { type: 'image/png' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = qrId ? `qr_code_${qrId}.png` : 'qr_code.png';
            link.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error converting SVG to PNG:', err);
            alert('Failed to generate PNG. Please try again.');
        }
    };
});