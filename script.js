// ===============================
// Konfigurasi
// ===============================
// Setelah Google Apps Script dideploy sebagai Web App, isi URL di bawah.
// Contoh: https://script.google.com/macros/s/AKfycb.../exec
const API_URL =
  "https://script.google.com/macros/s/AKfycbzW4d5VCO-8vME2mfvvt71Bj8AHHSSfueQ4hwx8mW9UpOpXLMHsG5Y3gfj8vNiwmfKx/exec";

const $ = (id) => document.getElementById(id);
const rupiah = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

let products = [];

document.addEventListener("DOMContentLoaded", () => {
  $("openFormBtn").addEventListener("click", openAdd);
  $("closeFormBtn").addEventListener("click", closeModal);
  $("cancelBtn").addEventListener("click", closeModal);
  $("productForm").addEventListener("submit", saveProduct);
  $("searchInput").addEventListener("input", render);
  $("hargaBeli").addEventListener("input", updatePreview);
  $("hargaJual").addEventListener("input", updatePreview);
  $("jumlahTerjual").addEventListener("input", updatePreview);
  $("foto").addEventListener("change", previewPhoto);
  loadProducts();
});

function ensureApi() {
  if (!API_URL || API_URL.includes("GANTI_DENGAN")) {
    alert(
      "Isi API_URL di script.js dengan URL Web App Google Apps Script terlebih dahulu.",
    );
    return false;
  }
  return true;
}

async function api(action, payload = {}) {
  if (!ensureApi()) throw new Error("API belum dikonfigurasi");
  const url = API_URL + "?action=" + encodeURIComponent(action);
  const options = { method: "POST", body: JSON.stringify(payload) };
  const response = await fetch(url, options);
  const data = await response.json();
  if (!data.success) throw new Error(data.message || "Request gagal");
  return data;
}

async function loadProducts() {
  $("productTableBody").innerHTML =
    '<tr><td colspan="10">Memuat data...</td></tr>';
  try {
    const response = await fetch(API_URL + "?action=list");
    const data = await response.json();
    if (!data.success) throw new Error(data.message || "Gagal mengambil data");
    products = data.data || [];
    render();
  } catch (err) {
    $("productTableBody").innerHTML =
      `<tr><td colspan="10">Gagal memuat data: ${escapeHtml(err.message)}</td></tr>`;
  }
}

function render() {
  const q = $("searchInput").value.trim().toLowerCase();
  const filtered = products.filter((p) =>
    [p.nama, p.kategori, p.deskripsi].join(" ").toLowerCase().includes(q),
  );

  $("emptyState").style.display = filtered.length ? "none" : "block";
  $("productTableBody").innerHTML = filtered
    .map((p) => {
      const margin = Number(p.hargaJual) - Number(p.hargaBeli);
      const terjual = Number(p.terjual) || 0;
      const laba = margin * terjual;
      return `
      <tr>
        <td>${p.gambar ? `<img class="product-img" src="${escapeAttr(p.gambar)}">` : '<div class="product-img"></div>'}</td>
        <td><strong>${escapeHtml(p.nama)}</strong></td>
        <td>${escapeHtml(p.kategori || "-")}</td>
        <td>${rupiah(p.hargaBeli)}</td>
        <td>${rupiah(p.hargaJual)}</td>
        <td>${Number(p.stok) || 0}</td>
        <td>${terjual}</td>
        <td>${rupiah(margin)}</td>
        <td>${rupiah(laba)}</td>
        <td>${escapeHtml(p.deskripsi || "-")}</td>
        <td>
          <button class="action-btn" onclick="openEdit('${escapeAttr(p.id)}')">Edit</button>
          <button class="action-btn action-delete" onclick="deleteProduct('${escapeAttr(p.id)}')">Hapus</button>
        </td>
      </tr>`;
    })
    .join("");

  $("totalProduk").textContent = products.length;
  $("totalTerjual").textContent = products.reduce(
    (s, p) => s + (Number(p.terjual) || 0),
    0,
  );
  $("totalPenjualan").textContent = rupiah(
    products.reduce(
      (s, p) => s + (Number(p.hargaJual) || 0) * (Number(p.terjual) || 0),
      0,
    ),
  );
  $("totalLaba").textContent = rupiah(
    products.reduce(
      (s, p) =>
        s +
        ((Number(p.hargaJual) || 0) - (Number(p.hargaBeli) || 0)) *
          (Number(p.terjual) || 0),
      0,
    ),
  );
}

function openAdd() {
  $("productForm").reset();
  $("editId").value = "";
  $("modalTitle").textContent = "Tambah Produk";
  $("photoPreview").src = "";
  $("photoPreview").classList.add("hidden");
  $("jumlahTerjual").value = 0;
  $("stok").value = 0;
  $("modal").classList.add("show");
  updatePreview();
}

function openEdit(id) {
  const p = products.find((x) => String(x.id) === String(id));
  if (!p) return;
  $("editId").value = p.id;
  $("modalTitle").textContent = "Edit Produk";
  $("nama").value = p.nama || "";
  $("kategori").value = p.kategori || "";
  $("hargaBeli").value = p.hargaBeli || 0;
  $("hargaJual").value = p.hargaJual || 0;
  $("stok").value = p.stok || 0;
  $("jumlahTerjual").value = p.terjual || 0;
  $("deskripsi").value = p.deskripsi || "";
  $("photoPreview").src = p.gambar || "";
  $("photoPreview").classList.toggle("hidden", !p.gambar);
  $("modal").classList.add("show");
  updatePreview();
}

function closeModal() {
  $("modal").classList.remove("show");
}

async function saveProduct(e) {
  e.preventDefault();
  const file = $("foto").files[0];
  let gambar = "";
  if (file) gambar = await fileToDataUrl(file);
  else {
    const old = products.find(
      (p) => String(p.id) === String($("editId").value),
    );
    gambar = old?.gambar || "";
  }

  const payload = {
    id: $("editId").value,
    nama: $("nama").value.trim(),
    kategori: $("kategori").value.trim(),
    hargaBeli: Number($("hargaBeli").value) || 0,
    hargaJual: Number($("hargaJual").value) || 0,
    stok: Number($("stok").value) || 0,
    terjual: Number($("jumlahTerjual").value) || 0,
    gambar,
    deskripsi: $("deskripsi").value.trim(),
  };

  try {
    await api(payload.id ? "update" : "create", payload);
    closeModal();
    await loadProducts();
  } catch (err) {
    alert(err.message);
  }
}

async function deleteProduct(id) {
  const p = products.find((x) => String(x.id) === String(id));
  if (!p || !confirm(`Hapus produk "${p.nama}"?`)) return;
  try {
    await api("delete", { id });
    await loadProducts();
  } catch (err) {
    alert(err.message);
  }
}

function updatePreview() {
  const margin =
    (Number($("hargaJual").value) || 0) - (Number($("hargaBeli").value) || 0);
  const laba = margin * (Number($("jumlahTerjual").value) || 0);
  $("previewMargin").textContent = rupiah(margin);
  $("previewLaba").textContent = rupiah(laba);
}

function previewPhoto() {
  const file = $("foto").files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    $("photoPreview").src = e.target.result;
    $("photoPreview").classList.remove("hidden");
  };
  reader.readAsDataURL(file);
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function escapeHtml(v) {
  return String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[c],
  );
}
function escapeAttr(v) {
  return escapeHtml(v);
}

window.openEdit = openEdit;
window.deleteProduct = deleteProduct;
