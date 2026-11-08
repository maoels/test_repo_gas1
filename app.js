// GANTI DENGAN URL WEB APP APPS SCRIPT MILIKMU
const API_URL = "https://script.google.com/macros/s/AKfycbxjUMPf5AHMoTY7m58fnD4tb9Y9ENxE4C6_pmqS3A2NFaNWs9wpF4gC-_ZcbIqK4Rtl3Q/exec"; 

// Element DOM
const form = document.getElementById('pegawaiForm');
const tableBody = document.getElementById('tableBody');
const btnRefresh = document.getElementById('btnRefresh');
const btnBatal = document.getElementById('btnBatal');
const btnSubmit = document.getElementById('btnSubmit');
const formTitle = document.getElementById('formTitle');
const searchInput = document.getElementById('searchInput');
const pageSizeSelect = document.getElementById('pageSize');
const pageInfo = document.getElementById('pageInfo');
const paginationControls = document.getElementById('paginationControls');

// State Global Paginasi & Search
let rawData = [];         // Seluruh data asli dari Apps Script
let filteredData = [];    // Data setelah di-filter oleh pencarian
let currentPage = 1;
let pageSize = 10;

// Fungsi Mengambil Data (Read)
async function loadData() {
  tableBody.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-gray-600">Memuat data...</td></tr>`;
  try {
    const response = await fetch(API_URL);
    const result = await response.json();
    
    if(result.status === "success") {
      rawData = result.data;
      applyFilter(); // Terapkan filter & render tabel
    }
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-red-500">Gagal memuat data</td></tr>`;
    console.error("Error fetching data:", error);
  }
}

// Fungsi Memfilter Data Berdasarkan Kata Kunci Pencarian
function applyFilter() {
  const query = searchInput.value.toLowerCase().trim();
  
  if (!query) {
    filteredData = [...rawData];
  } else {
    filteredData = rawData.filter(item => {
      const nama = (item.Nama || '').toString().toLowerCase();
      const nip = (item.NIP || '').toString().toLowerCase();
      const tempat = (item['Tempat Lahir'] || '').toString().toLowerCase();
      return nama.includes(query) || nip.includes(query) || tempat.includes(query);
    });
  }
  
  currentPage = 1; // Reset ke halaman pertama setiap kali mencari
  renderTable();
}

// Fungsi Menampilkan Data ke Tabel sesuai Halaman Paging
function renderTable() {
  tableBody.innerHTML = "";
  const totalEntries = filteredData.length;

  if (totalEntries === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-gray-500">Data tidak ditemukan</td></tr>`;
    pageInfo.innerText = "Menampilkan 0 dari 0 data";
    paginationControls.innerHTML = "";
    return;
  }

  // Hitung Slice Data untuk Paging
  let startIndex = 0;
  let endIndex = totalEntries;
  let totalPages = 1;

  if (pageSize !== 'all') {
    const limit = parseInt(pageSize);
    totalPages = Math.ceil(totalEntries / limit);
    
    // Validasi agar currentPage tidak melebihi totalPages
    if (currentPage > totalPages) currentPage = totalPages;
    
    startIndex = (currentPage - 1) * limit;
    endIndex = Math.min(startIndex + limit, totalEntries);
  }

  const pageItems = filteredData.slice(startIndex, endIndex);

  // Render Baris Tabel
  pageItems.forEach((pegawai) => {
    const tglStr = pegawai['Tanggal Lahir'] ? new Date(pegawai['Tanggal Lahir']).toISOString().split('T')[0] : '-';
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="py-3 px-4 font-medium text-gray-900">${pegawai.Nama}</td>
      <td class="py-3 px-4 text-gray-600">${pegawai.NIP}</td>
      <td class="py-3 px-4 text-gray-600">${pegawai['Tempat Lahir']}</td>
      <td class="py-3 px-4 text-gray-600">${tglStr}</td>
      <td class="py-3 px-4 text-center space-x-2">
        <button onclick="editData('${pegawai.ID}')" class="text-blue-600 hover:text-blue-800 bg-blue-100/80 hover:bg-blue-200 px-2.5 py-1 rounded-md text-xs font-medium transition-colors">Edit</button>
        <button onclick="deleteData('${pegawai.ID}')" class="text-red-600 hover:text-red-800 bg-red-100/80 hover:bg-red-200 px-2.5 py-1 rounded-md text-xs font-medium transition-colors">Hapus</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  // Update Teks Informasi (e.g. "Menampilkan 1 - 10 dari 50 data")
  pageInfo.innerText = `Menampilkan ${startIndex + 1} - ${endIndex} dari ${totalEntries} data`;

  // Render Tombol Paging
  renderPagination(totalPages);
}

// Fungsi Render Navigasi Paginasi
function renderPagination(totalPages) {
  paginationControls.innerHTML = "";
  if (pageSize === 'all' || totalPages <= 1) return;

  // Tombol Previous
  const prevBtn = document.createElement('button');
  prevBtn.className = "page-btn text-xs font-medium";
  prevBtn.innerText = "‹ Prev";
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
    }
  };
  paginationControls.appendChild(prevBtn);

  // Tombol Angka Halaman
  for (let i = 1; i <= totalPages; i++) {
    // Tampilkan beberapa tombol saja jika halaman terlalu banyak
    if (totalPages > 7 && Math.abs(i - currentPage) > 2 && i !== 1 && i !== totalPages) {
      if (i === 2 || i === totalPages - 1) {
        const dots = document.createElement('span');
        dots.className = "px-1 text-gray-500 text-xs";
        dots.innerText = "..";
        paginationControls.appendChild(dots);
      }
      continue;
    }

    const pageBtn = document.createElement('button');
    pageBtn.className = `page-btn text-xs font-medium ${i === currentPage ? 'active' : ''}`;
    pageBtn.innerText = i;
    pageBtn.onclick = () => {
      currentPage = i;
      renderTable();
    };
    paginationControls.appendChild(pageBtn);
  }

  // Tombol Next
  const nextBtn = document.createElement('button');
  nextBtn.className = "page-btn text-xs font-medium";
  nextBtn.innerText = "Next ›";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderTable();
    }
  };
  paginationControls.appendChild(nextBtn);
}

// Event Listeners Kontrol Filter & Paging
searchInput.addEventListener('input', applyFilter);

pageSizeSelect.addEventListener('change', (e) => {
  pageSize = e.target.value;
  currentPage = 1;
  renderTable();
});

// Submit Form (Create / Update)
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const id = document.getElementById('pegawaiId').value;
  const payload = {
    action: id ? 'update' : 'create',
    id: id,
    nama: document.getElementById('nama').value,
    nip: document.getElementById('nip').value,
    tempatLahir: document.getElementById('tempatLahir').value,
    tanggalLahir: document.getElementById('tanggalLahir').value
  };

  btnSubmit.innerText = "Menyimpan...";
  btnSubmit.disabled = true;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      redirect: "follow",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    if(result.status === "success") {
      resetForm();
      loadData();
    }
  } catch (error) {
    alert("Terjadi kesalahan saat menyimpan data");
    console.error(error);
  } finally {
    btnSubmit.innerText = "Simpan";
    btnSubmit.disabled = false;
  }
});

// Edit Data
window.editData = (id) => {
  const pegawai = rawData.find(p => p.ID === id);
  if (!pegawai) return;

  document.getElementById('pegawaiId').value = pegawai.ID;
  document.getElementById('nama').value = pegawai.Nama;
  document.getElementById('nip').value = pegawai.NIP;
  document.getElementById('tempatLahir').value = pegawai['Tempat Lahir'];
  
  if (pegawai['Tanggal Lahir']) {
    document.getElementById('tanggalLahir').value = new Date(pegawai['Tanggal Lahir']).toISOString().split('T')[0];
  }

  formTitle.innerText = "Edit Pegawai";
  btnSubmit.innerText = "Perbarui Data";
  btnBatal.classList.remove('hidden');
};

// Hapus Data
window.deleteData = async (id) => {
  if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      redirect: "follow",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({ action: 'delete', id: id })
    });
    
    const result = await response.json();
    if(result.status === "success") {
      loadData();
    }
  } catch (error) {
    alert("Gagal menghapus data");
    console.error(error);
  }
};

// Reset Form
function resetForm() {
  form.reset();
  document.getElementById('pegawaiId').value = "";
  formTitle.innerText = "Tambah Pegawai";
  btnSubmit.innerText = "Simpan";
  btnBatal.classList.add('hidden');
}

btnBatal.addEventListener('click', resetForm);
btnRefresh.addEventListener('click', loadData);

// Load data awal
window.addEventListener('DOMContentLoaded', loadData);
