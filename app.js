// GANTI DENGAN URL WEB APP MILIKMU
const API_URL = "https://script.google.com/macros/s/AKfycbxjUMPf5AHMoTY7m58fnD4tb9Y9ENxE4C6_pmqS3A2NFaNWs9wpF4gC-_ZcbIqK4Rtl3Q/exec"; 

// Element DOM
const form = document.getElementById('pegawaiForm');
const tableBody = document.getElementById('tableBody');
const btnRefresh = document.getElementById('btnRefresh');
const btnBatal = document.getElementById('btnBatal');
const btnSubmit = document.getElementById('btnSubmit');
const formTitle = document.getElementById('formTitle');

// State Global
let allData = [];

// Fungsi Mengambil Data (Read)
async function loadData() {
  tableBody.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-gray-600">Memuat data...</td></tr>`;
  try {
    const response = await fetch(API_URL);
    const result = await response.json();
    
    if(result.status === "success") {
      allData = result.data;
      renderTable();
    }
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-red-500">Gagal memuat data</td></tr>`;
    console.error("Error fetching data:", error);
  }
}

// Fungsi Menampilkan Data ke Tabel
function renderTable() {
  tableBody.innerHTML = "";
  if (allData.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-gray-500">Belum ada data pegawai</td></tr>`;
    return;
  }

  allData.forEach((pegawai) => {
    // Format tanggal (asumsi format dari API bisa diubah ke string pendek)
    const tglStr = pegawai['Tanggal Lahir'] ? new Date(pegawai['Tanggal Lahir']).toISOString().split('T')[0] : '-';
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="py-3 px-4">${pegawai.Nama}</td>
      <td class="py-3 px-4">${pegawai.NIP}</td>
      <td class="py-3 px-4">${pegawai['Tempat Lahir']}</td>
      <td class="py-3 px-4">${tglStr}</td>
      <td class="py-3 px-4 text-center space-x-2">
        <button onclick="editData('${pegawai.ID}')" class="text-blue-600 hover:text-blue-800 bg-blue-100 px-2 py-1 rounded text-xs font-medium transition-colors">Edit</button>
        <button onclick="deleteData('${pegawai.ID}')" class="text-red-600 hover:text-red-800 bg-red-100 px-2 py-1 rounded text-xs font-medium transition-colors">Hapus</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

// Fungsi Submit Form (Create & Update)
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
      redirect: "follow", // Wajib untuk request GAS
      headers: {
        "Content-Type": "text/plain;charset=utf-8", // text/plain agar tidak trigger preflight CORS error
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    if(result.status === "success") {
      resetForm();
      loadData(); // Muat ulang tabel
    }
  } catch (error) {
    alert("Terjadi kesalahan saat menyimpan data");
    console.error(error);
  } finally {
    btnSubmit.innerText = "Simpan";
    btnSubmit.disabled = false;
  }
});

// Fungsi Persiapan Edit Data
window.editData = (id) => {
  const pegawai = allData.find(p => p.ID === id);
  if (!pegawai) return;

  document.getElementById('pegawaiId').value = pegawai.ID;
  document.getElementById('nama').value = pegawai.Nama;
  document.getElementById('nip').value = pegawai.NIP;
  document.getElementById('tempatLahir').value = pegawai['Tempat Lahir'];
  
  // Format tanggal untuk input type="date" (YYYY-MM-DD)
  if (pegawai['Tanggal Lahir']) {
    document.getElementById('tanggalLahir').value = new Date(pegawai['Tanggal Lahir']).toISOString().split('T')[0];
  }

  formTitle.innerText = "Edit Pegawai";
  btnSubmit.innerText = "Perbarui Data";
  btnBatal.classList.remove('hidden');
};

// Fungsi Hapus Data
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

// Fungsi Batal Edit / Reset Form
function resetForm() {
  form.reset();
  document.getElementById('pegawaiId').value = "";
  formTitle.innerText = "Tambah Pegawai";
  btnSubmit.innerText = "Simpan";
  btnBatal.classList.add('hidden');
}

btnBatal.addEventListener('click', resetForm);
btnRefresh.addEventListener('click', loadData);

// Load data saat halaman pertama kali dibuka
window.addEventListener('DOMContentLoaded', loadData);
