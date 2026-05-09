/* Mawared Admin Dashboard JS */

// Mock login
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('username').value;
        const pass = document.getElementById('password').value;
        if (user === 'admin' && pass === '1234') {
            window.location.href = 'dashboard.html';
        } else {
            document.getElementById('login-error').style.display = 'block';
        }
    });
}

// Sidebar toggle (mobile)
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebar = document.getElementById('sidebar');
if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
}

// Sidebar nav active state
document.querySelectorAll('.sidebar__link[data-page]').forEach((link) => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.sidebar__link').forEach((l) => l.classList.remove('sidebar__link--active'));
        link.classList.add('sidebar__link--active');
    });
});

// Charts (Chart.js)
const ordersCtx = document.getElementById('ordersChart');
if (ordersCtx) {
    new Chart(ordersCtx, {
        type: 'doughnut',
        data: {
            labels: ['مكتمل', 'جاري المعالجة', 'تم الإرسال', 'ملغى'],
            datasets: [{
                data: [18, 12, 10, 7],
                backgroundColor: ['#2E7D32', '#E65100', '#1565C0', '#C62828'],
                borderWidth: 0,
            }],
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom', rtl: true } } },
    });
}

const revenueCtx = document.getElementById('revenueChart');
if (revenueCtx) {
    new Chart(revenueCtx, {
        type: 'bar',
        data: {
            labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
            datasets: [{
                label: 'الإيرادات (ريال)',
                data: [12000, 15000, 18500, 14200, 21000, 25400],
                backgroundColor: '#0B5E50',
                borderRadius: 6,
            }],
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false } } },
    });
}
