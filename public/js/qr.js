document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token && window.location.pathname !== '/tutorial.html') {
        window.location.href = '/index.html';
    }

    // Logout
    const logoutLink = document.getElementById('logout');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            window.location.href = '/index.html';
        });
    }

    // Dashboard
    if (window.location.pathname === '/dashboard.html') {
        fetch('/api/qr/dashboard', {
            headers: { 'Authorization': `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(data => {
                const tbody = document.querySelector('#qrTable tbody');
                data.forEach(qr => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
            <td>${qr.id}</td>
            <td>${qr.destination}</td>
            <td>${new Date(qr.createdAt).toLocaleString()}</td>
            <td><img src="${qr.qrImage}" alt="QR PNG" style="max-width: 100px;"></td>
            <td><div>${qr.qrSVG}</div></td>
          `;
                    tbody.appendChild(row);
                });
            })
            .catch(err => console.error(err));

        document.getElementById('createQrBtn').addEventListener('click', () => {
            window.location.href = '/create-qr.html';
        });
    }

    // Create QR Code
    const createQrForm = document.getElementById('createQrForm');
    if (createQrForm) {
        createQrForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const destination = document.getElementById('destination').value;

            const res = await fetch('/api/qr/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ destination }),
            });
            const data = await res.json();

            if (res.ok) {
                document.getElementById('qrPng').src = data.qrImage;
                document.getElementById('qrSvg').innerHTML = data.qrSVG;

                document.getElementById('downloadPng').onclick = () => {
                    const link = document.createElement('a');
                    link.href = data.qrImage;
                    link.download = 'qr_code.png';
                    link.click();
                };

                document.getElementById('downloadSvg').onclick = () => {
                    const blob = new Blob([data.qrSVG], { type: 'image/svg+xml' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'qr_code.svg';
                    link.click();
                    URL.revokeObjectURL(url);
                };
            }
        });
    }

    // Tutorial
    if (window.location.pathname === '/tutorial.html') {
        fetch('/api/qr/tutorial')
            .then(res => res.json())
            .then(data => {
                document.getElementById('tutorialContent').innerText = data.tutorial;
            })
            .catch(err => console.error(err));
    }
});