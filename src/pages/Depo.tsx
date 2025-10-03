import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Search, ArrowDown, ArrowUp, Plus, Download, Trash2, CheckSquare, Square, Scan, Volume2, Sun, Monitor, Laptop, Plug, Box, Printer, X, Save, AlertTriangle } from 'lucide-react';
import { useEnvanter } from '../contexts/EnvanterContext';
import { useAuth } from '../contexts/AuthContext';
import { exportToExcel } from '../utils/excelUtils';
import { supabase } from '../lib/supabase';
import BarcodeScanner from '../components/BarcodeScanner';
import BarkodGenerator from '../components/BarkodGenerator';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const Depo = () => {
  const { urunler, kategoriler, loadProducts } = useEnvanter();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('ad');
  const [sortDir, setSortDir] = useState('asc');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [barcodeModalProduct, setBarcodeModalProduct] = useState<string | null>(null);
  const [showBulkBarcodeModal, setShowBulkBarcodeModal] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [editModalProduct, setEditModalProduct] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteModalProduct, setDeleteModalProduct] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);



  const depodakiUrunler = urunler.filter(urun => urun.durum === 'Depoda');

  const getKategoriAdi = (kategoriId: string) => {
    const kategori = kategoriler.find(k => String(k.id) === String(kategoriId));
    return kategori ? kategori.name : 'Bilinmiyor';
  };

  const filteredUrunler = depodakiUrunler.filter((urun) => {
    const matchesSearch = urun.ad.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         urun.barkod.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? String(urun.kategori) === String(selectedCategory) : true;
    return matchesSearch && matchesCategory;
  });

  const sortedUrunler = [...filteredUrunler].sort((a, b) => {
    if (sortBy === 'miktar') {
      return sortDir === 'asc' ? a.miktar - b.miktar : b.miktar - a.miktar;
    } else {
      const strA = String(a[sortBy as keyof typeof a]);
      const strB = String(b[sortBy as keyof typeof b]);
      return sortDir === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    }
  });

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === sortedUrunler.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(sortedUrunler.map(urun => urun.id));
    }
  };

  const toggleSelectProduct = (productId: string) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    } else {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  const exportSelectedProducts = () => {
    const selectedUrunler = sortedUrunler.filter(urun => selectedProducts.includes(urun.id));
    exportToExcel(
      selectedUrunler.map(urun => ({
        'Ürün Adı': urun.ad,
        'Marka': urun.marka,
        'Model': urun.model,
        'Kategori': getKategoriAdi(urun.kategori),
        'Durum': urun.durum,
        'Seri No': urun.seriNo,
        'Barkod': urun.barkod,
        'Son İşlem': formatDateTimeForExcel(urun.eklemeTarihi)
      })),
      'Secili_Depo_Urunleri'
    );
  };

  // Ürün silme fonksiyonu
  const handleDelete = (urun: any) => {
    if (!isAdmin) return;
    setDeleteModalProduct(urun);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteModalProduct) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('products').delete().eq('id', deleteModalProduct.id);
      if (error) throw error;
      // Listeyi yenile (sayfayı yenilemeden)
      await loadProducts();
      setSelectedProducts(prev => prev.filter(id => id !== deleteModalProduct.id));
      setShowDeleteModal(false);
      setDeleteModalProduct(null);
    } catch (err) {
      alert('Ürün silinirken hata oluştu.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Toplu ürün silme fonksiyonu
  const handleBulkDelete = () => {
    if (!isAdmin) return;
    if (selectedProducts.length === 0) return;
    setDeleteModalProduct({ id: 'bulk', count: selectedProducts.length });
    setShowDeleteModal(true);
  };

  const confirmBulkDelete = async () => {
    if (!deleteModalProduct || deleteModalProduct.id !== 'bulk') return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('products').delete().in('id', selectedProducts);
      if (error) throw error;
      await loadProducts();
      setSelectedProducts([]);
      setShowDeleteModal(false);
      setDeleteModalProduct(null);
    } catch (err) {
      alert('Ürünler silinirken hata oluştu.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(sortedUrunler.length / pageSize);
  const paginatedUrunler = sortedUrunler.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Ürün düzenleme fonksiyonları
  const [editFormData, setEditFormData] = useState({
    ad: '',
    marka: '',
    model: '',
    kategori: '',
    seriNo: '',
    aciklama: '',
    miktar: 1,
    fotograf_url: ''
  });

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: name === 'miktar' ? parseInt(value) || 0 : value
    }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalProduct) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: editFormData.ad,
          brand: editFormData.marka || null,
          model: editFormData.model || null,
          category_id: editFormData.kategori,
          serial_number: editFormData.seriNo || null,
          description: editFormData.aciklama || null,
          quantity: editFormData.miktar
        })
        .eq('id', editModalProduct.id);

      if (error) throw error;

      await loadProducts();
      setShowEditModal(false);
      setEditModalProduct(null);
    } catch (err) {
      alert('Ürün güncellenirken hata oluştu.');
      console.error('Error:', err);
    }
  };

  const openEditModal = (urun: any) => {
    setEditModalProduct(urun);
    setEditFormData({
      ad: urun.ad || '',
      marka: urun.marka || '',
      model: urun.model || '',
      kategori: urun.kategori || '',
      seriNo: urun.seriNo || '',
      aciklama: urun.aciklama || '',
      miktar: urun.miktar || 1,
      fotograf_url: urun.fotograf_url || ''
    });
    setShowEditModal(true);
  };

  

  const formatDateTimeForExcel = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hour}:${minute}`;
  };

  // Kategoriye göre ikon döndüren fonksiyon
  const getCategoryIcon = (kategori: string) => {
    const name = kategori.toLowerCase();
    if (name.includes('ses')) return <Volume2 className="h-6 w-6 text-indigo-500" />;
    if (name.includes('ışık') || name.includes('isik') || name.includes('light')) return <Sun className="h-6 w-6 text-yellow-500" />;
    if (name.includes('görüntü') || name.includes('goruntu') || name.includes('monitor') || name.includes('ekran')) return <Monitor className="h-6 w-6 text-blue-500" />;
    if (name.includes('bilgisayar') || name.includes('laptop') || name.includes('pc')) return <Laptop className="h-6 w-6 text-green-500" />;
    if (name.includes('aksesuar') || name.includes('plug')) return <Plug className="h-6 w-6 text-pink-500" />;
    if (name.includes('case') || name.includes('kasa') || name.includes('box')) return <Box className="h-6 w-6 text-gray-500" />;
    return <Package className="h-6 w-6 text-gray-400" />;
  };

  // Excel'den toplu ürün yükleme (devre dışı bırakıldı)

  const handleBarcodeScan = async (barcode: string) => {
    try {
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('barcode', barcode)
        .single();

      if (error) {
        alert('Ürün bulunamadı');
        return;
      }

      if (product) {
        setBarcodeModalProduct(product.id);
      }
    } catch (err) {
      console.error('Barkod tarama hatası:', err);
      alert('Barkod tarama sırasında bir hata oluştu');
    }
  };

  const handleBulkPrint = () => {
    if (selectedProducts.length === 0) {
      alert('Lütfen yazdırılacak ürünleri seçin');
      return;
    }
    setShowBulkBarcodeModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Depodaki Ürünler</h1>
          <p className="text-sm text-gray-500 mt-1">Depoda bulunan tüm ürünleri görüntüleyin ve yönetin</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <Link
              to="/app/urunler/ekle"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
            >
              <Plus className="h-5 w-5 mr-2" />
              Yeni Ürün Ekle
            </Link>
          )}
          {isAdmin && (
            <button
              onClick={handleBulkDelete}
              disabled={selectedProducts.length === 0}
              className={`inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 ${selectedProducts.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Trash2 className="h-5 w-5 mr-2" />
              Seçili Ürünleri Sil
            </button>
          )}
          {selectedProducts.length > 0 && (
            <button
              onClick={handleBulkPrint}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
            >
              <Printer className="h-5 w-5 mr-2" />
              Seçili Barkodları Yazdır ({selectedProducts.length})
            </button>
          )}
          <button
            onClick={() => setShowScanner(true)}
            className="inline-flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <Scan className="h-5 w-5 mr-2" />
            Barkod Gir
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-800">Toplam Ürün</h3>
              <p className="text-2xl font-bold text-blue-600">{depodakiUrunler.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-800">Seçili Ürün</h3>
              <p className="text-2xl font-bold text-green-600">{selectedProducts.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ara</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ürün adı veya barkod..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Tüm Kategoriler</option>
              {kategoriler.map((kategori) => (
                <option key={kategori.id} value={kategori.id}>
                  {kategori.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sayfa Boyutu</label>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size} ürün
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4 mb-6">
        <button
          onClick={exportSelectedProducts}
          disabled={selectedProducts.length === 0}
          className={`flex items-center px-4 py-2 rounded-lg transition duration-150 ${
            selectedProducts.length === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
          }`}
        >
          <Download className="h-5 w-5 mr-2" />
          Seçili Ürünleri Dışa Aktar
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center text-gray-500 hover:text-gray-700"
                  >
                    {selectedProducts.length === sortedUrunler.length ? (
                      <CheckSquare className="h-5 w-5" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                  </button>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('ad')}
                >
                  <div className="flex items-center">
                    Ürün Adı
                    {sortBy === 'ad' && (
                      sortDir === 'asc' ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Barkod
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('kategori')}
                >
                  <div className="flex items-center">
                    Kategori
                    {sortBy === 'kategori' && (
                      sortDir === 'asc' ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Durum
                </th>
                
                
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedUrunler.map((urun) => (
                <tr key={urun.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleSelectProduct(urun.id)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {selectedProducts.includes(urun.id) ? (
                        <CheckSquare className="h-5 w-5" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                        {getCategoryIcon(getKategoriAdi(urun.kategori))}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{urun.ad}</div>
                        <div className="text-sm text-gray-500">{urun.marka} {urun.model}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer underline hover:text-indigo-600"
                      onClick={() => setBarcodeModalProduct(urun.id)}
                      title="Barkodu Yazdır">
                    {urun.barkod}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getKategoriAdi(urun.kategori)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={
                      `px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        urun.durum === 'Depoda' ? 'bg-green-100 text-green-800' :
                        urun.durum === 'Serviste' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`
                    }>
                      {urun.durum}
                    </span>
                  </td>
                  
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => openEditModal(urun)}
                          className="text-indigo-600 hover:text-indigo-900 mr-5"
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => handleDelete(urun)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Sil
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Önceki
            </button>
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Sonraki
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span>
                {' - '}
                <span className="font-medium">
                  {Math.min(currentPage * pageSize, sortedUrunler.length)}
                </span>
                {' / '}
                <span className="font-medium">{sortedUrunler.length}</span>
                {' ürün gösteriliyor'}
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Önceki</span>
                  <ArrowUp className="h-5 w-5" />
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNum
                          ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === totalPages
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Sonraki</span>
                  <ArrowDown className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {showScanner && (
        <BarcodeScanner
          onClose={() => setShowScanner(false)}
          onScan={handleBarcodeScan}
          showCamera={false}
          showInput={true}
        />
      )}

      {barcodeModalProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-5 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Barkod</h2>
            <div className="mb-4">
              <BarkodGenerator
                barkod={urunler.find(u => u.id === barcodeModalProduct)?.barkod || ''}
                urunAdi={urunler.find(u => u.id === barcodeModalProduct)?.ad || ''}
                model={urunler.find(u => u.id === barcodeModalProduct)?.model}
                onPrint={() => setBarcodeModalProduct(null)}
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setBarcodeModalProduct(null)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkBarcodeModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-5 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sticky top-0 bg-white z-10 pt-1 pb-3">
              <h2 className="text-xl font-bold text-gray-800">Seçili Barkodlar</h2>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <button
                  onClick={async () => {
                    if (selectedProducts.length === 0) return;
                    const printWindow = window.open('', '_blank');
                    if (!printWindow) return;

                    const barkodImages: Array<{ image: string; ad: string; model: string }> = [];
                    for (const productId of selectedProducts) {
                      const product = urunler.find(u => u.id === productId);
                      if (product) {
                        const tempCanvas = document.createElement('canvas');
                        const ctx = tempCanvas.getContext('2d');
                        if (ctx) {
                          try {
                            const JsBarcode = await import('jsbarcode');
                            JsBarcode.default(tempCanvas, product.barkod, {
                              format: 'CODE128',
                              width: 2,
                              height: 50,
                              displayValue: true,
                              text: product.barkod,
                              fontSize: 16,
                              margin: 10,
                            });
                            barkodImages.push({
                              image: tempCanvas.toDataURL('image/png'),
                              ad: product.ad,
                              model: product.model
                            });
                          } catch (error) {
                            console.error('Barkod oluşturma hatası:', error);
                          }
                        }
                      }
                    }

                    const labelsHTML = barkodImages.map(item => `
                    <div class="label">
                      ${item.ad ? `<div class='urun-bilgi'>${item.ad}</div>` : ''}
                      ${item.model ? `<div class='urun-model'>${item.model}</div>` : ''}
                      <img class="barcode-img" src="${item.image}" />
                    </div>
                  `).join('');

                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>Barkodları Yazdır</title>
                          <style>
                            @page { margin: 2mm; }
                            body { margin: 0; padding: 0; font-family: Arial, sans-serif; width: 110mm; }

                            .sheet {
                              display: flex;
                              flex-wrap: wrap;
                              width: 110mm;
                              margin: 0;
                              gap: 9mm;
                              box-sizing: border-box;
                              page-break-inside: avoid; break-inside: avoid;
                            }

                            .label {
                              width: 50mm;
                              height: 30mm;
                              box-sizing: border-box;
                              display: inline-flex;
                              flex-direction: column;
                              justify-content: center;
                              align-items: center;
                              overflow: hidden;
                              padding: 0; margin: 0;
                              page-break-inside: avoid; break-inside: avoid;
                            }

                            .urun-bilgi { font-size: 15px; font-weight: 700; margin: 1.5mm 0 1mm; text-align: center; line-height: 1.1; }
                            .urun-model { font-size: 10px; color: #000; margin: 0 0 1.5mm; text-align: center; line-height: 1.1; }
                            .barcode-img { width: 48mm; height: auto; max-height: 18mm; }
                          </style>
                        </head>
                        <body>
                          <div class="sheet">${labelsHTML}</div>
                          <script>
                            window.addEventListener('load', () => {
                              window.print();
                              setTimeout(() => window.close(), 300);
                            });
                          <\/script>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                    setShowBulkBarcodeModal(false);
                    setSelectedProducts([]);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded flex items-center text-sm"
                >
                  <Printer className="h-5 w-5 mr-2" />
                  Tümünü Yazdır
                </button>
                <button
                  onClick={() => {
                    setShowBulkBarcodeModal(false);
                    setSelectedProducts([]);
                  }}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-2 rounded text-sm"
                >
                  Kapat
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col gap-8 mb-4">
              {selectedProducts.map(productId => {
                const product = urunler.find(u => u.id === productId);
                if (!product) return null;
                return (
                  <div key={productId} className="border border-gray-200 rounded-lg p-4 flex flex-col items-center">
                    <BarkodGenerator
                      barkod={product.barkod}
                      urunAdi={product.ad}
                      model={product.model}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Ürün Düzenleme Modal */}
      {showEditModal && editModalProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Ürün Düzenle</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditModalProduct(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-ad" className="block text-sm font-medium text-gray-700 mb-1">
                    Ürün Adı*
                  </label>
                  <input
                    type="text"
                    id="edit-ad"
                    name="ad"
                    required
                    value={editFormData.ad}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="edit-marka" className="block text-sm font-medium text-gray-700 mb-1">
                    Marka
                  </label>
                  <input
                    type="text"
                    id="edit-marka"
                    name="marka"
                    value={editFormData.marka}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="edit-model" className="block text-sm font-medium text-gray-700 mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    id="edit-model"
                    name="model"
                    value={editFormData.model}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="edit-kategori" className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori*
                  </label>
                  <select
                    id="edit-kategori"
                    name="kategori"
                    required
                    value={editFormData.kategori}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Kategori Seçin</option>
                    {kategoriler.map((kategori) => (
                      <option key={kategori.id} value={kategori.id}>
                        {kategori.name}
                      </option>
                    ))}
                  </select>
                </div>


                <div>
                  <label htmlFor="edit-seriNo" className="block text-sm font-medium text-gray-700 mb-1">
                    Seri No
                  </label>
                  <input
                    type="text"
                    id="edit-seriNo"
                    name="seriNo"
                    value={editFormData.seriNo}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="edit-miktar" className="block text-sm font-medium text-gray-700 mb-1">
                    Miktar*
                  </label>
                  <input
                    type="number"
                    id="edit-miktar"
                    name="miktar"
                    required
                    min="1"
                    value={editFormData.miktar}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="edit-aciklama" className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <textarea
                  id="edit-aciklama"
                  name="aciklama"
                  value={editFormData.aciklama}
                  onChange={handleEditChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditModalProduct(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center"
                >
                  <Save className="h-5 w-5 mr-2" />
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Silme Onay Modal */}
      {showDeleteModal && deleteModalProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 mx-auto flex items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {deleteModalProduct.id === 'bulk' 
                  ? 'Seçili Ürünleri Sil' 
                  : 'Ürünü Sil'
                }
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {deleteModalProduct.id === 'bulk' 
                  ? `${deleteModalProduct.count} ürünü silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`
                  : `"${deleteModalProduct.ad}" ürününü silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`
                }
              </p>
              
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteModalProduct(null);
                  }}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  İptal
                </button>
                <button
                  onClick={deleteModalProduct.id === 'bulk' ? confirmBulkDelete : confirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Siliniyor...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Sil
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Depo;