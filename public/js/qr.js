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
            <div class="download-links">
              <a href="${qr.qrSVG}" download="qr_code_${qr.id}.svg">SVG</a>
              <a href="${qr.qrImage}" download="qr_code_${qr.id}.png">PNG</a>
              <a href="${qr.qrJPG}" download="qr_code_${qr.id}.jpg">JPG</a>
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
                const qrPng = document.getElementById('qrPng');
                const qrSvg = document.getElementById('qrSvg');
                qrPng.src = data.qrImage;
                qrSvg.innerHTML = ''; // Clear any existing content
                // Display SVG as an image using the data URL
                const svgImg = new Image();
                svgImg.src = data.qrSVG;
                svgImg.style.maxWidth = '200px'; // Match PNG size
                qrSvg.appendChild(svgImg);
                document.getElementById('qrResult').style.display = 'block';

                document.getElementById('downloadPng').onclick = () => {
                    const link = document.createElement('a');
                    link.href = data.qrImage;
                    link.download = 'qr_code.png';
                    link.click();
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
});