// Daftar Bulan
const namaBulan = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

// Opsi Status Audit untuk Dropdown di Tabel
const opsiStatus = [
    "", // Kosong (Belum diaudit)
    "SESUAI",
    "TIDAK HADIR",
    "ABSEN 0",
    "FOTO BURAM",
    "FOTO TIDAK JELAS",
    "TIDAK ADA FOTO"
];

// --- AMBIL ELEMEN HTML ---
const formPegawai = document.getElementById('form-pegawai');
const inputNama = document.getElementById('nama');
const inputJabatan = document.getElementById('jabatan');
const inputUpt = document.getElementById('upt');
const inputStatus = document.getElementById('status-pegawai'); 
const tbody = document.querySelector('#tabel-pegawai tbody');
const selectFilter = document.getElementById('filter-upt'); // Ini sekarang input hidden

// Elemen Dashboard
const elTotalPegawai = document.getElementById('total-pegawai');
const elTotalUpt = document.getElementById('total-upt');
const elTotalCuti = document.getElementById('total-cuti');     
const elTotalResign = document.getElementById('total-resign'); 
let chartInstance = null; 

// State Aplikasi
let filterAktif = "SEMUA";
let dataPegawai = JSON.parse(localStorage.getItem('dataPegawaiV6')) || [];

// --- FUNGSI LOGOUT ---
function logout() {
    if (confirm("Apakah Anda yakin ingin keluar dari dashboard?")) {
        localStorage.removeItem('isLoggedIn');
        window.location.href = 'login.html';
    }
}

// --- LOGIKA CUSTOM DROPDOWN STATUS (SIDEBAR) ---
function toggleDropdownStatus() {
    const menu = document.querySelector('#dropdown-status .custom-dropdown-menu');
    menu.classList.toggle('show');
}

function pilihStatus(nilai) {
    let label = nilai === "RESIGN" ? "TIDAK BEKERJA LAGI" : nilai;
    document.getElementById('label-status-terpilih').innerText = label;
    document.getElementById('status-pegawai').value = nilai; 
    document.querySelector('#dropdown-status .custom-dropdown-menu').classList.remove('show');
}

// --- LOGIKA CUSTOM DROPDOWN FILTER UPT (BARU) ---
function toggleDropdownUPT() {
    const menu = document.getElementById('menu-upt');
    menu.classList.toggle('show');
}

function pilihUPT(nilai, label) {
    document.getElementById('label-upt-terpilih').innerText = label;
    document.getElementById('filter-upt').value = nilai;
    filterAktif = nilai;
    document.getElementById('menu-upt').classList.remove('show');
    renderTabel();
}

function perbaruiDropdownUPT() {
    const semuaUpt = dataPegawai.map(p => p.upt.toUpperCase());
    const uptUnik = [...new Set(semuaUpt)];
    const menuUpt = document.getElementById('menu-upt');
    
    let htmlMenu = `<div class="custom-dropdown-item" onclick="pilihUPT('SEMUA', 'SEMUA UPT')">SEMUA UPT</div>`;
    
    uptUnik.forEach(upt => {
        htmlMenu += `<div class="custom-dropdown-item" onclick="pilihUPT('${upt}', '${upt}')">${upt}</div>`;
    });
    
    menuUpt.innerHTML = htmlMenu;
}

// --- LOGIKA CUSTOM DROPDOWN DI TABEL ---
function toggleTableDropdown(btn) {
    document.querySelectorAll('.table-dropdown-menu').forEach(menu => {
        if (menu !== btn.nextElementSibling) menu.classList.remove('show');
    });
    btn.nextElementSibling.classList.toggle('show');
}

function pilihNilaiTabel(item, idPegawai, indexBulan, nilaiBaru) {
    const btnText = item.parentElement.previousElementSibling.querySelector('.dropdown-text');
    btnText.innerText = nilaiBaru === "" ? "-" : nilaiBaru;
    item.parentElement.classList.remove('show');
    updateNilai(idPegawai, indexBulan, nilaiBaru);
}

// Menutup dropdown jika klik di luar
window.addEventListener('click', function(e) {
    // Tutup dropdown tabel
    if (!e.target.closest('.table-dropdown')) {
        document.querySelectorAll('.table-dropdown-menu').forEach(menu => {
            menu.classList.remove('show');
        });
    }
    // Tutup dropdown sidebar status
    const dropdownSidebar = document.getElementById('dropdown-status');
    if (dropdownSidebar && !dropdownSidebar.contains(e.target)) {
        document.querySelector('#dropdown-status .custom-dropdown-menu').classList.remove('show');
    }
    // Tutup dropdown filter UPT
    const dropdownUpt = document.getElementById('dropdown-upt');
    if (dropdownUpt && !dropdownUpt.contains(e.target)) {
        document.getElementById('menu-upt').classList.remove('show');
    }
});

// --- FUNGSI RENDER TABEL ---
function renderTabel() {
    tbody.innerHTML = ''; 

    let dataTampil = dataPegawai;
    if (filterAktif !== "SEMUA") {
        dataTampil = dataPegawai.filter(p => p.upt.toUpperCase() === filterAktif);
    }

    if (dataTampil.length === 0) {
        tbody.innerHTML = `<tr><td colspan="18" style="text-align:center; padding: 20px; color:#64748b;">Belum ada data pegawai untuk UPT ini.</td></tr>`;
        perbaruiDashboard(dataTampil); 
        return;
    }

    dataTampil.forEach((pegawai, index) => {
        const tr = document.createElement('tr');
        let kolomBulan = '';
        
        for (let i = 0; i < 12; i++) {
            let nilai = pegawai.bulanan && pegawai.bulanan[i] ? pegawai.bulanan[i] : '';
            let labelTampil = nilai === "" ? "-" : nilai;
            
            let dropdownHtml = `
            <div class="table-dropdown">
                <div class="table-dropdown-btn" onclick="toggleTableDropdown(this)">
                    <span class="dropdown-text">${labelTampil}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
                <div class="table-dropdown-menu">
                    ${opsiStatus.map(status => {
                        let label = status === "" ? "-" : status;
                        return `<div class="table-dropdown-item" onclick="pilihNilaiTabel(this, '${pegawai.id}', ${i}, '${status}')">${label}</div>`;
                    }).join('')}
                </div>
            </div>
            `;

            kolomBulan += `<td style="text-align:center;">${dropdownHtml}</td>`;
        }

        let warnaStatus = "#0b2253"; 
        if(pegawai.status === "CUTI") warnaStatus = "#eab308"; 
        if(pegawai.status === "RESIGN") warnaStatus = "#ef4444"; 

        tr.innerHTML = `
            <td style="text-align:center;">${index + 1}</td>
            <td style="font-weight: 500;">${pegawai.nama}</td>
            <td>${pegawai.jabatan}</td>
            <td>${pegawai.upt}</td>
            <td style="text-align:center; font-weight: 600; color: ${warnaStatus};">${pegawai.status === 'RESIGN' ? 'TIDAK BEKERJA LAGI' : (pegawai.status || 'AKTIF')}</td>
            ${kolomBulan}
            <td style="text-align:center;">
                <button class="btn-hapus" onclick="hapusPegawai('${pegawai.id}')">Hapus</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    perbaruiDashboard(dataTampil);
}

// --- FUNGSI UPDATE DASHBOARD ---
function perbaruiDashboard(dataTampil) {
    elTotalPegawai.innerText = dataTampil.length;

    const semuaUpt = dataPegawai.map(p => p.upt.toUpperCase()); 
    const uptUnik = [...new Set(semuaUpt)];
    elTotalUpt.innerText = uptUnik.length;

    const jumlahCuti = dataTampil.filter(p => p.status === "CUTI").length;
    elTotalCuti.innerText = jumlahCuti;

    const jumlahResign = dataTampil.filter(p => p.status === "RESIGN").length;
    elTotalResign.innerText = jumlahResign;

    gambarGrafik(dataTampil, uptUnik);
}

// --- FUNGSI GRAFIK MODERN (CHART.JS) ---
function gambarGrafik(dataTampil, semuaUptUnik) {
    const ctx = document.getElementById('grafikUPT').getContext('2d');
    let labelUpt = filterAktif === "SEMUA" ? semuaUptUnik : [filterAktif];

    const dataAktif = labelUpt.map(upt => {
        return dataTampil.filter(p => p.upt.toUpperCase() === upt && (p.status === "AKTIF" || !p.status)).length;
    });
    const dataCuti = labelUpt.map(upt => {
        return dataTampil.filter(p => p.upt.toUpperCase() === upt && p.status === "CUTI").length;
    });
    const dataResign = labelUpt.map(upt => {
        return dataTampil.filter(p => p.upt.toUpperCase() === upt && p.status === "RESIGN").length;
    });

    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labelUpt,
            datasets: [
                {
                    label: 'Aktif',
                    data: dataAktif,
                    backgroundColor: '#3b82f6', 
                    borderRadius: 4,
                    barPercentage: 0.8,
                    categoryPercentage: 0.8
                },
                {
                    label: 'Cuti',
                    data: dataCuti,
                    backgroundColor: '#facc15', 
                    borderRadius: 4,
                    barPercentage: 0.8,
                    categoryPercentage: 0.8
                },
                {
                    label: 'Tidak Bekerja Lagi',
                    data: dataResign,
                    backgroundColor: '#ef4444', 
                    borderRadius: 4,
                    barPercentage: 0.8,
                    categoryPercentage: 0.8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    display: true,
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        font: { size: 11 }
                    }
                }
            },
            scales: {
                y: { 
                    beginAtZero: true, 
                    ticks: { stepSize: 1, color: '#94a3b8' },
                    grid: { color: '#f1f5f9' }
                },
                x: {
                    ticks: { color: '#64748b' },
                    grid: { display: false }
                }
            }
        }
    });
}

// --- FUNGSI SIMPAN DATA ---
function simpanKeStorage() {
    localStorage.setItem('dataPegawaiV6', JSON.stringify(dataPegawai));
}

// --- FUNGSI TAMBAH PEGAWAI ---
formPegawai.addEventListener('submit', function(e) {
    e.preventDefault(); 
    const pegawaiBaru = {
        id: Date.now().toString(), 
        nama: inputNama.value,
        jabatan: inputJabatan.value,
        upt: inputUpt.value.toUpperCase(),
        status: inputStatus.value, 
        bulanan: Array(12).fill('') 
    };
    dataPegawai.push(pegawaiBaru); 
    simpanKeStorage(); 
    perbaruiDropdownUPT();
    renderTabel(); 
    formPegawai.reset(); 
    
    document.getElementById('label-status-terpilih').innerText = 'AKTIF';
    document.getElementById('status-pegawai').value = 'AKTIF';
});

// --- FUNGSI UPDATE NILAI BULANAN ---
function updateNilai(id, indexBulan, nilai) {
    const indexPegawai = dataPegawai.findIndex(p => p.id === id);
    if (indexPegawai !== -1) {
        if (!dataPegawai[indexPegawai].bulanan) {
            dataPegawai[indexPegawai].bulanan = Array(12).fill('');
        }
        dataPegawai[indexPegawai].bulanan[indexBulan] = nilai;
        simpanKeStorage(); 
    }
}

// --- FUNGSI HAPUS PEGAWAI ---
function hapusPegawai(id) {
    if (confirm("Apakah Anda yakin ingin menghapus data pegawai ini?")) {
        dataPegawai = dataPegawai.filter(p => p.id !== id);
        simpanKeStorage();
        perbaruiDropdownUPT(); 
        renderTabel();
    }
}

// --- FUNGSI EXPORT EXCEL ---
function exportToExcel() {
    let dataEksport = dataPegawai;
    if (filterAktif !== "SEMUA") {
        dataEksport = dataPegawai.filter(p => p.upt.toUpperCase() === filterAktif);
    }

    if (dataEksport.length === 0) {
        alert("Belum ada data untuk di-export!");
        return;
    }

    const header1 = ["No", "NAMA", "JABATAN", "UPT", "STATUS", "BULAN", "", "", "", "", "", "", "", "", "", "", ""];
    const header2 = ["", "", "", "", "", ...namaBulan]; 
    const rows = [];
    
    dataEksport.forEach((p, index) => {
        const nilaiBulan = p.bulanan || Array(12).fill('');
        let statusTampil = p.status === 'RESIGN' ? 'TIDAK BEKERJA LAGI' : (p.status || 'AKTIF');
        rows.push([index + 1, p.nama, p.jabatan, p.upt, statusTampil, ...nilaiBulan]);
    });

    const excelData = [header1, header2, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(excelData);

    worksheet['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }, 
        { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } }, 
        { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } }, 
        { s: { r: 0, c: 3 }, e: { r: 1, c: 3 } }, 
        { s: { r: 0, c: 4 }, e: { r: 1, c: 4 } }, 
        { s: { r: 0, c: 5 }, e: { r: 0, c: 16 } } 
    ];
    
    worksheet['!cols'] = [
        { wpx: 40 }, { wpx: 180 }, { wpx: 150 }, { wpx: 120 }, { wpx: 100 }, 
        { wpx: 100 }, { wpx: 100 }, { wpx: 80 }, { wpx: 80 }, 
        { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, 
        { wpx: 80 }, { wpx: 80 }, { wpx: 80 }, { wpx: 80 }  
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Audit");
    
    const tanggal = new Date().toISOString().slice(0,10);
    const namaFile = filterAktif === "SEMUA" ? `Audit_Absensi_Semua_UPT_${tanggal}.xlsx` : `Audit_Absensi_${filterAktif}_${tanggal}.xlsx`;
    
    XLSX.writeFile(workbook, namaFile);
}

// --- FUNGSI DOWNLOAD GRAFIK SEBAGAI GAMBAR ---
function downloadGrafik() {
    const canvas = document.getElementById('grafikUPT');
    if (!canvas) return;

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    
    const tanggal = new Date().toISOString().slice(0,10);
    const namaFile = filterAktif === "SEMUA" ? `Grafik_Semua_UPT_${tanggal}.png` : `Grafik_UPT_${filterAktif}_${tanggal}.png`;
    link.download = namaFile;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- FITUR INOVASI: TEKAN ENTER UNTUK PINDAH DROPDOWN DI TABEL ---
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.target.classList.contains('table-dropdown-btn')) {
        e.preventDefault(); 
        
        const semuaTombol = Array.from(document.querySelectorAll('.table-dropdown-btn'));
        const indexSekarang = semuaTombol.indexOf(e.target);
        
        if (indexSekarang > -1 && indexSekarang < semuaTombol.length - 1) {
            semuaTombol[indexSekarang + 1].focus();
        }
    }
});

// --- FUNGSI MEMBUAT KALENDER MINI ---
function buatKalender() {
    const calendarDays = document.getElementById('calendar-days');
    const judulBulan = document.getElementById('judul-bulan-tahun');
    
    if (!calendarDays || !judulBulan) return; 

    const hariIni = new Date();
    const tahun = hariIni.getFullYear();
    const bulan = hariIni.getMonth(); 

    const namaBulanArr = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    judulBulan.innerText = `${namaBulanArr[bulan]} ${tahun}`;

    const tanggalPertama = new Date(tahun, bulan, 1).getDay();
    const offsetAwal = (tanggalPertama === 0) ? 6 : tanggalPertama - 1;

    const hariDalamBulan = new Date(tahun, bulan + 1, 0).getDate();

    calendarDays.innerHTML = '';

    for (let i = 0; i < offsetAwal; i++) {
        const divKosong = document.createElement('div');
        divKosong.classList.add('empty');
        calendarDays.appendChild(divKosong);
    }

    for (let i = 1; i <= hariDalamBulan; i++) {
        const divTanggal = document.createElement('div');
        divTanggal.innerText = i;
        if (i === hariIni.getDate()) {
            divTanggal.classList.add('today');
        }
        calendarDays.appendChild(divTanggal);
    }
}

// --- FITUR AGENDA ---
let dataAgenda = JSON.parse(localStorage.getItem('dataAgenda')) || [];

function renderAgenda() {
    const listAgenda = document.getElementById('agenda-list');
    if (!listAgenda) return;

    listAgenda.innerHTML = '';

    if (dataAgenda.length === 0) {
        listAgenda.innerHTML = `<div style="font-size: 11px; color: #94a3b8; text-align:center; margin-top:10px;">Belum ada agenda.</div>`;
        return;
    }

    dataAgenda.forEach((agenda, index) => {
        const div = document.createElement('div');
        div.className = 'agenda-item';
        
        const spanTeks = document.createElement('span');
        spanTeks.innerText = agenda.teks;
        if (agenda.selesai) spanTeks.classList.add('selesai');
        spanTeks.onclick = () => toggleAgenda(index);

        const btnHapus = document.createElement('button');
        btnHapus.className = 'btn-hapus-agenda';
        btnHapus.innerHTML = '&times;';
        btnHapus.onclick = () => hapusAgenda(index);

        div.appendChild(spanTeks);
        div.appendChild(btnHapus);
        listAgenda.appendChild(div);
    });
}

function tambahAgenda() {
    const input = document.getElementById('input-agenda');
    if (!input) return;
    const teks = input.value.trim();
    
    if (teks !== '') {
        dataAgenda.push({ teks: teks, selesai: false });
        input.value = '';
        simpanAgenda();
        renderAgenda();
    }
}

const elInputAgenda = document.getElementById('input-agenda');
if (elInputAgenda) {
    elInputAgenda.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') tambahAgenda();
    });
}

function toggleAgenda(index) {
    dataAgenda[index].selesai = !dataAgenda[index].selesai;
    simpanAgenda();
    renderAgenda();
}

function hapusAgenda(index) {
    dataAgenda.splice(index, 1);
    simpanAgenda();
    renderAgenda();
}

function simpanAgenda() {
    localStorage.setItem('dataAgenda', JSON.stringify(dataAgenda));
}

// --- INISIALISASI SAAT HALAMAN DIMUAT ---
perbaruiDropdownUPT();
renderTabel();
buatKalender();
renderAgenda();