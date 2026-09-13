const $=id=>document.getElementById(id);
const form=$("productForm"), modal=$("modal"), tbody=$("productTableBody");
const defaultProducts=[
{id:1,nama:"Kaos Oversize",hargaBeli:50000,hargaJual:79000,jumlahTerjual:20,deskripsi:"Cotton combed 24s, model oversize.",foto:""},
{id:2,nama:"Kemeja Flanel",hargaBeli:85000,hargaJual:129000,jumlahTerjual:12,deskripsi:"Kemeja flanel lengan panjang.",foto:""},
{id:3,nama:"Celana Chino",hargaBeli:100000,hargaJual:155000,jumlahTerjual:8,deskripsi:"Celana chino slim fit.",foto:""}
];
let products=JSON.parse(localStorage.getItem("produkPakaianV2"))||defaultProducts;
let currentPhoto="";

function rupiah(n){return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",minimumFractionDigits:0}).format(Number(n)||0)}
function margin(p){return Number(p.hargaJual)-Number(p.hargaBeli)}
function laba(p){return margin(p)*Number(p.jumlahTerjual)}
function save(){localStorage.setItem("produkPakaianV2",JSON.stringify(products))}
function esc(s){const d=document.createElement("div");d.textContent=s||"";return d.innerHTML}

function updateSummary(){
 $("totalProduk").textContent=products.length;
 $("totalTerjual").textContent=products.reduce((a,p)=>a+Number(p.jumlahTerjual),0);
 $("totalPenjualan").textContent=rupiah(products.reduce((a,p)=>a+Number(p.hargaJual)*Number(p.jumlahTerjual),0));
 $("totalLaba").textContent=rupiah(products.reduce((a,p)=>a+laba(p),0));
}
function render(keyword=""){
 const q=keyword.toLowerCase().trim();
 const list=products.filter(p=>p.nama.toLowerCase().includes(q)||p.deskripsi.toLowerCase().includes(q));
 tbody.innerHTML="";
 list.forEach(p=>{
  const tr=document.createElement("tr");
  tr.innerHTML=`<td>${p.foto?`<img class="product-photo" src="${p.foto}" alt="${esc(p.nama)}">`:`<div class="product-photo no-photo">No Foto</div>`}</td>
  <td><strong>${esc(p.nama)}</strong></td>
  <td>${rupiah(p.hargaBeli)}</td><td>${rupiah(p.hargaJual)}</td><td>${p.jumlahTerjual}</td>
  <td class="margin">${rupiah(margin(p))}</td><td class="margin">${rupiah(laba(p))}</td>
  <td>${esc(p.deskripsi)||"-"}</td>
  <td><div class="action-group"><button class="action-btn edit" onclick="editProduct(${p.id})">Edit</button><button class="action-btn delete" onclick="deleteProduct(${p.id})">Hapus</button></div></td>`;
  tbody.appendChild(tr);
 });
 $("emptyState").style.display=list.length?"none":"block"; updateSummary();
}
function preview(){
 const b=Number($("hargaBeli").value)||0,j=Number($("hargaJual").value)||0,t=Number($("jumlahTerjual").value)||0;
 $("previewMargin").textContent=rupiah(j-b); $("previewLaba").textContent=rupiah((j-b)*t);
}
function openModal(){modal.classList.add("active")}
function closeModal(){modal.classList.remove("active");form.reset();$("editId").value="";currentPhoto="";$("photoPreview").src="";$("photoPreview").classList.add("hidden");$("modalTitle").textContent="Tambah Produk";preview()}
$("openFormBtn").onclick=openModal;$("closeFormBtn").onclick=closeModal;$("cancelBtn").onclick=closeModal;
["hargaBeli","hargaJual","jumlahTerjual"].forEach(id=>$(id).addEventListener("input",preview));
$("searchInput").addEventListener("input",e=>render(e.target.value));

$("foto").addEventListener("change",e=>{
 const file=e.target.files[0]; if(!file)return;
 const reader=new FileReader();
 reader.onload=()=>{currentPhoto=reader.result;$("photoPreview").src=currentPhoto;$("photoPreview").classList.remove("hidden")};
 reader.readAsDataURL(file);
});

form.onsubmit=e=>{
 e.preventDefault();
 const data={nama:$("nama").value.trim(),hargaBeli:Number($("hargaBeli").value),hargaJual:Number($("hargaJual").value),jumlahTerjual:Number($("jumlahTerjual").value),deskripsi:$("deskripsi").value.trim()};
 const id=Number($("editId").value);
 if(id){products=products.map(p=>p.id===id?{...p,...data,foto:currentPhoto||p.foto}:p)}
 else products.push({...data,id:Date.now(),foto:currentPhoto});
 save();render($("searchInput").value);closeModal();
};
window.editProduct=id=>{
 const p=products.find(x=>x.id===id);if(!p)return;
 $("editId").value=p.id;$("nama").value=p.nama;$("hargaBeli").value=p.hargaBeli;$("hargaJual").value=p.hargaJual;$("jumlahTerjual").value=p.jumlahTerjual;$("deskripsi").value=p.deskripsi;
 currentPhoto=p.foto||"";$("photoPreview").src=currentPhoto;$("photoPreview").classList.toggle("hidden",!currentPhoto);$("modalTitle").textContent="Edit Produk";preview();openModal();
};
window.deleteProduct=id=>{const p=products.find(x=>x.id===id);if(p&&confirm(`Hapus produk "${p.nama}"?`)){products=products.filter(x=>x.id!==id);save();render($("searchInput").value)}};
modal.onclick=e=>{if(e.target===modal)closeModal()};
render();
