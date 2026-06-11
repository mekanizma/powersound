import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, Search, Trash2, RefreshCw, ArrowDown, ArrowUp, Download, Scan, X, AlertTriangle, Camera, CheckCircle, ChevronLeft, ChevronRight, Folder, Pencil } from 'lucide-react';
import { useEnvanter } from '../contexts/EnvanterContext';
import { exportToExcel } from '../utils/excelUtils';
import { supabase } from '../lib/supabase';
import { Urun } from '../types';
import { useAuth } from '../contexts/AuthContext';
import BarcodeScanner from '../components/BarcodeScanner';
import {
  filterMovementsForLocation,
  getExternalRentalFlowDirection,
  groupExternalRentalMovementsByProduct,
  isExcludedLocationName,
  isExternalRentalLocationName,
  isHotelLocationName
} from '../utils/movementLocationUtils';

const Hareketler = () => {
  const { hareketler, urunler, removeHareket, addHareket, updateHareket, removeHareketler } = useEnvanter();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [sortBy] = useState('tarih');
  const [sortDir] = useState<'asc' | 'desc'>('desc');
  const [locations, setLocations] = useState<{id: string, name: string}[]>([]);
  const [excludedLocationIds, setExcludedLocationIds] = useState<Set<string>>(new Set());
  const [users, setUsers] = useState<{id: string, username: string}[]>([]);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeProduct, setBarcodeProduct] = useState<Urun | null>(null);
  const [barcodeError, setBarcodeError] = useState('');
  const [barcodeMovementType, setBarcodeMovementType] = useState<'Giriş' | 'Çıkış'>('Çıkış');
  const [barcodeMovementQuantity, setBarcodeMovementQuantity] = useState(1);
  const [barcodeMovementLocation, setBarcodeMovementLocation] = useState('');
  const [barcodeMovementDescription, setBarcodeMovementDescription] = useState('');
  
  // Toplu barkod tarama için yeni state'ler
  const [showBulkBarcodeModal, setShowBulkBarcodeModal] = useState(false);
  const [scannedBarcodes, setScannedBarcodes] = useState<Array<{
    id: string;
    barcode: string;
    product: Urun | null;
    quantity: number;
    error?: string;
  }>>([]);
  const [bulkMovementType, setBulkMovementType] = useState<'Giriş' | 'Çıkış'>('Çıkış');
  const [bulkMovementLocation, setBulkMovementLocation] = useState('');
  const [bulkMovementDescription, setBulkMovementDescription] = useState('');
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  
  // Gösterilecek lokasyon sırası
  const desiredLocationsOrder = [
    'Depo',
    'Kaya Artemis',
    'Kaya Palazzo',
    'Les Ambassadeurs',
    'Lords Palace',
    'Dış Kiralama',
    'Servis'
  ];
  const orderedLocations = desiredLocationsOrder
    .map(name => locations.find(l => (l.name || '').toLowerCase() === name.toLowerCase()))
    .filter((l): l is {id: string, name: string} => Boolean(l));
  
  // Sayfalama için state'ler
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedMovements, setSelectedMovements] = useState<string[]>([]);
  const [locationPages, setLocationPages] = useState<Record<string, number>>({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMovement, setEditingMovement] = useState<any>(null);
  const [editMovementType, setEditMovementType] = useState<'Giriş' | 'Çıkış'>('Çıkış');
  const [editMovementQuantity, setEditMovementQuantity] = useState(1);
  const [editMovementLocation, setEditMovementLocation] = useState('');
  const [editMovementDescription, setEditMovementDescription] = useState('');
  const [bulkEditIds, setBulkEditIds] = useState<string[]>([]);
  const [deleteModalMovement, setDeleteModalMovement] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [collapsedLocations, setCollapsedLocations] = useState<Record<string, boolean>>({});
  const [showOrphanMovements, setShowOrphanMovements] = useState(false);
  const [historyModalLocation, setHistoryModalLocation] = useState<{ id: string; name: string } | null>(null);
  // Tüm hareketler gösterilir (eski "sadece son hareket" modu kaldırıldı)
  const routerLocation = useLocation();

  // Eksik ürünleri analiz et
  useEffect(() => {
    const orphanMovements = hareketler.filter(h => {
      const urunAdi = h.urunAdi || getUrunAdi(h.urunId) || '';
      return !isValidProductName(urunAdi);
    });
    if (orphanMovements.length > 0) {
      console.log(`⚠️ ${orphanMovements.length} hareket kaydında ürün bulunamadı:`, orphanMovements);
    }
  }, [hareketler, urunler]);
  
  // Fetch locations and users from Supabase
  useEffect(() => {
    const fetchData = async () => {
      // Fetch locations
      const { data: locationsData, error: locationsError } = await supabase
        .from('locations')
        .select('id, name')
        .order('name');
      
      if (locationsError) {
        console.error('Error fetching locations:', locationsError);
      } else if (locationsData) {
        const excludedIds = new Set(
          (locationsData || [])
            .filter(loc => isExcludedLocationName(loc.name))
            .map(loc => String(loc.id))
        );
        setExcludedLocationIds(excludedIds);
        setLocations(
          (locationsData || []).filter(loc => !isExcludedLocationName(loc.name))
        );
      }

      // Fetch users from auth_users table instead of users
      const { data: usersData, error: usersError } = await supabase
        .from('auth_users')
        .select('id, username')
        .order('username');
      
      if (usersError) {
        console.error('Error fetching users:', usersError);
      } else if (usersData) {
        setUsers(usersData);
      }
    };

    fetchData();
  }, []);

  // URL lokasyon parametresine göre başlangıç filtresi ve klasörü aç
  useEffect(() => {
    const params = new URLSearchParams(routerLocation.search);
    const locParam = params.get('lokasyon');
    if (locParam) {
      setSelectedLocation(String(locParam));
      setCollapsedLocations(prev => ({ ...prev, [String(locParam)]: false }));
    }
  }, [routerLocation.search]);

  // Helper functions to get names
  const getLocationName = (locationId: string) => {
    const location = locations.find(loc => loc.id === locationId);
    return location ? location.name : locationId;
  };

  const isDepotLocationId = (locationId: string) => {
    const locationName = getLocationName(locationId);
    return String(locationName || '').trim().toLowerCase().includes('depo');
  };

  const getCurrentStockCountForLocation = (locName: string, locId: string) => {
    const normalizedName = (locName || '').trim().toLowerCase();
    if (!locId && normalizedName !== 'depo') {
      return 0;
    }

    if (normalizedName === 'depo') {
      return urunler.filter(u => {
        const status = String(u.durum || '').trim().toLowerCase();
        return status === 'depoda' || status.includes('depo');
      }).length;
    }

    return urunler.filter(u => String(u.location_id) === String(locId)).length;
  };
  const getUrunAdi = (urunId: string) => {
    const urun = urunler.find(u => String(u.id) === String(urunId));
    return urun ? urun.ad : '';
  };

  // UUID kontrolü için yardımcı fonksiyon
  const isValidProductName = (name: string): boolean => {
    if (!name) return false;
    // UUID formatı kontrolü: 8-4-4-4-12 karakterlik hex string
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return !uuidPattern.test(name);
  };

  const getUrunBarkod = (urunId: string) => {
    const urun = urunler.find(u => String(u.id) === String(urunId));
    return urun ? (urun.barkod || '-') : '-';
  };

  const renderMovementTypeCell = (hareket: { tip: string; aciklama?: string }, locationName: string) => {
    if (!isExternalRentalLocationName(locationName)) {
      return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          hareket.tip === 'Giriş' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {hareket.tip}
        </span>
      );
    }

    const direction = getExternalRentalFlowDirection(hareket);
    return renderExternalRentalTypeBadges(direction === 'Giriş', direction === 'Çıkış');
  };

  const renderExternalRentalTypeBadges = (hasGiris: boolean, hasCikis: boolean) => (
    <div className="inline-flex items-center gap-1">
      <span className={`px-2 py-0.5 text-xs rounded-full ${
        hasGiris ? 'bg-green-100 text-green-800 font-semibold' : 'bg-gray-100 text-gray-400'
      }`}>
        Giriş
      </span>
      <span className={`px-2 py-0.5 text-xs rounded-full ${
        hasCikis ? 'bg-red-100 text-red-800 font-semibold' : 'bg-gray-100 text-gray-400'
      }`}>
        Çıkış
      </span>
    </div>
  );

  const getLocationDisplayCount = (loc: { id: string; name: string }, movements: typeof latestMovements) => {
    if (isExternalRentalLocationName(loc.name)) {
      return groupExternalRentalMovementsByProduct(movements).length;
    }
    return movements.length;
  };

  const toggleGroupedMovementSelection = (movementIds: string[]) => {
    const allSelected = movementIds.every(id => selectedMovements.includes(id));
    setSelectedMovements(prev => {
      if (allSelected) {
        return prev.filter(id => !movementIds.includes(id));
      }
      const merged = new Set(prev);
      movementIds.forEach(id => merged.add(id));
      return Array.from(merged);
    });
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => String(u.id) === String(userId));
    return user ? user.username : 'Unknown';
  };
  
  // Filtreleme
  const filteredHareketler = hareketler.filter((hareket) => {
    if (excludedLocationIds.has(String(hareket.lokasyon))) return false;

    const urunAdi = hareket.urunAdi || getUrunAdi(hareket.urunId) || '';
    const urunBarkod = getUrunBarkod(hareket.urunId) || '';
    const normalizedSearch = searchTerm.toLowerCase();
    const matchesSearch = urunAdi.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (hareket.aciklama || '').toLowerCase().includes(normalizedSearch) ||
                          urunBarkod.toLowerCase().includes(normalizedSearch);
    const matchesType = selectedType ? hareket.tip === selectedType : true;
    
    // Hatalı hareket filtresi
    if (showOrphanMovements) {
      const isOrphan = !isValidProductName(urunAdi);
      return isOrphan && matchesSearch && matchesType;
    }
    
    // Lokasyon filtresi burada uygulanmaz; son hareket lokasyonuna göre klasör bazında filtrelenecek
    return matchesSearch && matchesType;
  });
  
  // Sıralama
  const sortedHareketler = [...filteredHareketler].sort((a, b) => {
    if (sortBy === 'tarih') {
      const dateA = a.tarih.split('.').reverse().join('-');
      const dateB = b.tarih.split('.').reverse().join('-');
      return sortDir === 'asc' 
        ? dateA.localeCompare(dateB) 
        : dateB.localeCompare(dateA);
    } else if (sortBy === 'urunAdi') {
      const adA = a.urunAdi || getUrunAdi(a.urunId) || '';
      const adB = b.urunAdi || getUrunAdi(b.urunId) || '';
      return sortDir === 'asc'
        ? adA.localeCompare(adB)
        : adB.localeCompare(adA);
    } else if (sortBy === 'tip') {
      return sortDir === 'asc'
        ? a.tip.localeCompare(b.tip)
        : b.tip.localeCompare(a.tip);
    } else if (sortBy === 'miktar') {
      return sortDir === 'asc'
        ? a.miktar - b.miktar
        : b.miktar - a.miktar;
    } else if (sortBy === 'kullanici') {
      return sortDir === 'asc'
        ? a.kullanici.localeCompare(b.kullanici)
        : b.kullanici.localeCompare(a.kullanici);
    }
    return 0;
  });
  
  // Sütuna göre sıralama (kullanılmıyor)

  // Tarih parse yardımcı fonksiyonu (şu an kullanılmıyor, gerektiğinde aktif edilebilir)
  // const parseDate = (dateStr: string) => {
  //   if (!dateStr) return new Date(0);
  //   if (dateStr.includes('T')) return new Date(dateStr);
  //   if (dateStr.includes('.')) {
  //     const [dd, mm, yyyyAndRest] = dateStr.split('.');
  //     const yyyy = (yyyyAndRest?.split(' ')[0]) || yyyyAndRest;
  //     return new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
  //   }
  //   return new Date(dateStr);
  // };

  // Tüm hareketleri göster
  const latestMovements = filteredHareketler;

  // Lokasyona göre gruplama
  const locationIdSetFromMovements = Array.from(new Set(latestMovements.map(h => String(h.lokasyon))));
  const notInDesired = locations.filter(l => !desiredLocationsOrder.some(name => (l.name || '').toLowerCase() === name.toLowerCase()));
  const additionalLocationsFromData = locationIdSetFromMovements
    .filter(id => !locations.find(l => String(l.id) === String(id)))
    .map(id => ({ id: String(id), name: String(id) }));
  const displayLocations: { id: string, name: string }[] = [
    ...orderedLocations,
    ...notInDesired,
    ...additionalLocationsFromData
  ].filter((loc, index, self) => self.findIndex(l => String(l.id) === String(loc.id)) === index);

  const groupedMovements: Record<string, typeof latestMovements> = displayLocations.reduce((acc, loc) => {
    const list = filterMovementsForLocation(latestMovements, urunler, loc);
    acc[loc.id] = selectedLocation ? (String(loc.id) === String(selectedLocation) ? list : []) : list;
    return acc;
  }, {} as Record<string, typeof latestMovements>);

  const toggleLocationCollapse = (locId: string) => {
    setCollapsedLocations(prev => ({ ...prev, [locId]: !prev[locId] }));
  };

  // Klasör bazında tüm hareketler seçili mi?
  const areAllMovementsSelectedForLocation = (locId: string) => {
    const movements = groupedMovements[locId] || [];
    if (movements.length === 0) return false;
    return movements.every(m => selectedMovements.includes(m.id));
  };

  // Klasördeki tüm hareketleri seç/kaldır
  const toggleSelectAllForLocation = (locId: string) => {
    const movements = groupedMovements[locId] || [];
    const ids = movements.map(m => m.id);
    setSelectedMovements(prev => {
      const allSelected = ids.every(id => prev.includes(id));
      if (allSelected) {
        return prev.filter(id => !ids.includes(id));
      }
      const merged = new Set(prev);
      ids.forEach(id => merged.add(id));
      return Array.from(merged);
    });
  };

  const openBulkEditForLocation = (locId: string) => {
    const movements = groupedMovements[locId] || [];
    const ids = movements.map(m => m.id);
    if (!ids.length) return;
    setBulkEditIds(ids);
    const first = movements[0];
    setEditingMovement(first);
    setEditMovementType(first.tip as 'Giriş' | 'Çıkış');
    setEditMovementQuantity(first.miktar);
    setEditMovementLocation(first.lokasyon);
    setEditMovementDescription('');
    setShowEditModal(true);
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hour}:${minute}`;
  };

  const openBarcodeModal = () => {
    setShowBarcodeModal(true);
    setBarcodeInput('');
    setBarcodeProduct(null);
    setBarcodeError('');
    setBarcodeMovementType('Çıkış');
    setBarcodeMovementQuantity(1);
    setBarcodeMovementLocation('');
    setBarcodeMovementDescription('');
  };

  const closeBarcodeModal = () => {
    setShowBarcodeModal(false);
    setBarcodeInput('');
    setBarcodeProduct(null);
    setBarcodeError('');
    setBarcodeMovementType('Çıkış');
    setBarcodeMovementQuantity(1);
    setBarcodeMovementLocation('');
    setBarcodeMovementDescription('');
  };

  const handleBarcodeInput = async (value: string) => {
    setBarcodeInput(value);
    if (value.length > 0) {
      const found = urunler.find(u => u.barkod === value);
      if (found) {
        setBarcodeProduct(found);
        setBarcodeError('');
        try {
          const { data: lastMovements, error: lastErr } = await supabase
            .from('movements')
            .select('location_id, created_at')
            .eq('product_id', found.id)
            .order('created_at', { ascending: false })
            .limit(1);
          if (!lastErr && lastMovements && lastMovements.length > 0) {
            const lastLoc = lastMovements[0].location_id as string;
            if (lastLoc) setBarcodeMovementLocation(String(lastLoc));
          }
        } catch (e) {
          // sessiz geç
        }
      } else {
        setBarcodeProduct(null);
        setBarcodeError('Barkod ile eşleşen ürün bulunamadı!');
      }
    } else {
      setBarcodeProduct(null);
      setBarcodeError('');
    }
  };

  const handleBarcodeMovement = async () => {
    if (!barcodeProduct) return;
    if (barcodeMovementType === 'Çıkış' && isDepotLocationId(barcodeMovementLocation)) {
      alert('Çıkış işleminde hedef lokasyon Depo olamaz. Lütfen ürünün gideceği lokasyonu seçin.');
      return;
    }
    
    // Çıkış hareketi için stok kontrolü
    if (barcodeMovementType === 'Çıkış' && barcodeProduct.miktar < barcodeMovementQuantity) {
      const onay = confirm(
        `Uyarı: ${barcodeProduct.ad} ürününden sadece ${barcodeProduct.miktar} adet stokta var. ` +
        `${barcodeMovementQuantity} adet çıkış yapmak istiyorsunuz. ` +
        `Bu işlem stok miktarını 0'a düşürecek. Devam etmek istiyor musunuz?`
      );
      if (!onay) return;
    }
    
    try {
      await addHareket({
        id: '',
        urunId: barcodeProduct.id,
        urunAdi: barcodeProduct.ad,
        tip: barcodeMovementType,
        miktar: barcodeMovementQuantity,
        tarih: new Date().toLocaleDateString('tr-TR'),
        aciklama: barcodeMovementDescription,
        lokasyon: barcodeMovementLocation,
        kullanici: user?.id || ''
      });
      closeBarcodeModal();
      alert('İşlem başarıyla kaydedildi!');
    } catch (error) {
      console.error('Tek hareket hatası:', error);
      alert(`İşlem kaydedilemedi! Hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  };

  // Toplu barkod tarama fonksiyonları
  const openBulkBarcodeModal = () => {
    setShowBulkBarcodeModal(true);
    setScannedBarcodes([]);
    setBulkMovementType('Çıkış');
    setBulkMovementLocation('');
    setBulkMovementDescription('');
    setIsProcessingBulk(false);
    setCurrentPage(1);
  };

  const closeBulkBarcodeModal = () => {
    setShowBulkBarcodeModal(false);
    setScannedBarcodes([]);
    setBulkMovementType('Çıkış');
    setBulkMovementLocation('');
    setBulkMovementDescription('');
    setIsProcessingBulk(false);
  };

  const handleBulkBarcodeScan = (barcode: string) => {
    // Aynı barkodun daha önce eklenip eklenmediğini kontrol et
    const existingIndex = scannedBarcodes.findIndex(item => item.barcode === barcode);
    
    if (existingIndex !== -1) {
      // Eğer varsa miktarını artır
      setScannedBarcodes(prev => 
        prev.map((item, index) => 
          index === existingIndex 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      // Yeni barkod ekle
      const foundProduct = urunler.find(u => u.barkod === barcode);
      const newItem = {
        id: Date.now().toString(),
        barcode,
        product: foundProduct || null,
        quantity: 1,
        error: foundProduct ? undefined : 'Ürün bulunamadı'
      };
      
      setScannedBarcodes(prev => [...prev, newItem]);
    }
  };

  const removeScannedBarcode = (id: string) => {
    setScannedBarcodes(prev => prev.filter(item => item.id !== id));
  };

  const updateScannedBarcodeQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeScannedBarcode(id);
      return;
    }
    
    setScannedBarcodes(prev => 
      prev.map(item => 
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const processBulkMovements = async () => {
    if (!bulkMovementLocation || scannedBarcodes.length === 0) return;
    if (bulkMovementType === 'Çıkış' && isDepotLocationId(bulkMovementLocation)) {
      alert('Çıkış işleminde hedef lokasyon Depo olamaz. Lütfen ürünün gideceği lokasyonu seçin.');
      return;
    }
    
    setIsProcessingBulk(true);
    const validBarcodes = scannedBarcodes.filter(item => item.product && !item.error);
    
    // Çıkış hareketi için stok kontrolü
    if (bulkMovementType === 'Çıkış') {
      const yetersizStoklar = validBarcodes.filter(item => 
        item.product && item.product.miktar < item.quantity
      );
      
      if (yetersizStoklar.length > 0) {
        const uyarıMesajı = yetersizStoklar.map(item => 
          `${item.product?.ad}: ${item.product?.miktar} adet stokta, ${item.quantity} adet çıkış`
        ).join('\n');
        
        const onay = confirm(
          `Uyarı: Aşağıdaki ürünlerde yetersiz stok var:\n\n${uyarıMesajı}\n\n` +
          `Bu işlem stok miktarlarını 0'a düşürecek. Devam etmek istiyor musunuz?`
        );
        if (!onay) {
          setIsProcessingBulk(false);
          return;
        }
      }
    }
    
    try {
      for (const item of validBarcodes) {
        if (item.product) {
          await addHareket({
            id: '',
            urunId: item.product.id,
            urunAdi: item.product.ad,
            tip: bulkMovementType,
            miktar: item.quantity,
            tarih: new Date().toLocaleDateString('tr-TR'),
            aciklama: bulkMovementDescription,
            lokasyon: bulkMovementLocation,
            kullanici: user?.id || ''
          });
        }
      }
      
      closeBulkBarcodeModal();
      alert(`${validBarcodes.length} hareket başarıyla kaydedildi!`);
    } catch (error) {
      console.error('Toplu hareket hatası:', error);
      alert(`Hareketler kaydedilirken bir hata oluştu! Hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const openSelectedProductsBulkBarcodeModal = () => {
    if (selectedMovements.length === 0) return;

    const selectedSet = new Set(selectedMovements.map(String));
    const selectedMovementRows = hareketler.filter(h => selectedSet.has(String(h.id)));

    if (selectedMovementRows.length === 0) {
      alert('Seçili harekete ait ürün bulunamadı.');
      return;
    }

    const groupedByProduct = selectedMovementRows.reduce<Record<string, number>>((acc, hareket) => {
      const key = String(hareket.urunId);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const scannedFromSelection = Object.entries(groupedByProduct).map(([productId, quantity]) => {
      const product = urunler.find(u => String(u.id) === productId) || null;
      return {
        id: `selected-${productId}`,
        barcode: product?.barkod || '',
        product,
        quantity,
        error: product ? undefined : 'Ürün bulunamadı'
      };
    });

    const selectedLocationId = String(selectedMovementRows[0]?.lokasyon || '');
    const selectedLocationName = getLocationName(selectedLocationId);
    const depoLoc = locations.find(l => (l.name || '').toLowerCase() === 'depo');
    const isFromHotel = isHotelLocationName(selectedLocationName);

    setShowBulkBarcodeModal(true);
    setScannedBarcodes(scannedFromSelection);
    setBulkMovementType(isFromHotel ? 'Giriş' : 'Çıkış');
    setBulkMovementLocation(isFromHotel && depoLoc ? String(depoLoc.id) : selectedLocationId);
    setBulkMovementDescription('');
    setIsProcessingBulk(false);
    setCurrentPage(1);
  };

  const openSingleMovementBulkBarcodeModal = (movement: any) => {
    const product = urunler.find(u => String(u.id) === String(movement.urunId)) || null;
    if (!product) {
      alert('Bu harekete ait ürün bulunamadı.');
      return;
    }

    setShowBulkBarcodeModal(true);
    setScannedBarcodes([{
      id: `single-${movement.id}`,
      barcode: product.barkod || '',
      product,
      quantity: 1
    }]);
    setBulkMovementType((movement.tip as 'Giriş' | 'Çıkış') || 'Çıkış');
    setBulkMovementLocation(String(movement.lokasyon || ''));
    setBulkMovementDescription(String(movement.aciklama || ''));
    setIsProcessingBulk(false);
    setCurrentPage(1);
  };

  // Sayfalama hesaplamaları
  const totalPages = Math.ceil(scannedBarcodes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = scannedBarcodes.slice(startIndex, endIndex);

  // Sayfa değiştirme fonksiyonları
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToPreviousPage = () => {
    goToPage(currentPage - 1);
  };

  const goToNextPage = () => {
    goToPage(currentPage + 1);
  };

  // Lokasyon bazlı sayfalama yardımcıları
  const getLocationPage = (locId: string) => locationPages[locId] || 1;
  const setLocationPage = (locId: string, page: number, total: number) => {
    const clamped = Math.max(1, Math.min(page, total));
    setLocationPages(prev => ({ ...prev, [locId]: clamped }));
  };

  // Hareket seçme işlemleri
  const toggleMovementSelection = (movementId: string) => {
    setSelectedMovements(prev => 
      prev.includes(movementId) 
        ? prev.filter(id => id !== movementId)
        : [...prev, movementId]
    );
  };

  // selectAllMovements (kullanılmıyor)

  // deselectAllMovements (kullanılmıyor)

  // Hareket düzenleme işlemleri
  const openEditModal = (movement: any) => {
    setBulkEditIds([]);
    setEditingMovement(movement);
    setEditMovementType(movement.tip as 'Giriş' | 'Çıkış');
    setEditMovementQuantity(movement.miktar);
    setEditMovementLocation(movement.lokasyon);
    setEditMovementDescription(movement.aciklama);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingMovement(null);
    setBulkEditIds([]);
  };

  const handleEditMovement = async () => {
    if (!editingMovement && bulkEditIds.length === 0) return;
    try {
      const targetIds = bulkEditIds.length ? bulkEditIds : [editingMovement.id];
      for (const id of targetIds) {
        await updateHareket(id, {
          tip: editMovementType,
          miktar: editMovementQuantity,
          lokasyon: editMovementLocation,
          aciklama: editMovementDescription
        });
      }
      closeEditModal();
      alert(bulkEditIds.length ? `${targetIds.length} hareket güncellendi!` : 'Hareket başarıyla güncellendi!');
    } catch (error) {
      alert('Hareket güncellenirken bir hata oluştu!');
    }
  };

  // Tek hareket silme fonksiyonu
  const handleDelete = (movement: any) => {
    setDeleteModalMovement(movement);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteModalMovement) return;
    setIsDeleting(true);
    try {
      await removeHareket(deleteModalMovement.id);
      setShowDeleteModal(false);
      setDeleteModalMovement(null);
    } catch (error) {
      alert('Hareket silinirken bir hata oluştu!');
    } finally {
      setIsDeleting(false);
    }
  };

  // Toplu silme işlemi
  const handleBulkDelete = () => {
    if (!selectedMovements.length) return;
    setDeleteModalMovement({ id: 'bulk', count: selectedMovements.length });
    setShowDeleteModal(true);
  };

  const confirmBulkDelete = async () => {
    if (!deleteModalMovement || deleteModalMovement.id !== 'bulk') return;
    setIsDeleting(true);
    try {
      await removeHareketler(selectedMovements);
      setSelectedMovements([]);
      setShowDeleteModal(false);
      setDeleteModalMovement(null);
    } catch (error) {
      alert('Hareketler silinirken bir hata oluştu!');
    } finally {
      setIsDeleting(false);
    }
  };

  // Hatalı hareket sayısını hesapla
  const orphanMovementsCount = hareketler.filter(h => {
    const urunAdi = h.urunAdi || getUrunAdi(h.urunId) || '';
    return !isValidProductName(urunAdi);
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Hareket Kayıtları</h1>

          {orphanMovementsCount > 0 && (
            <button
              onClick={() => setShowOrphanMovements(!showOrphanMovements)}
              className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors duration-200 ${
                showOrphanMovements 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
              }`}
            >
              <AlertTriangle className="h-5 w-5 mr-2" />
              {showOrphanMovements ? 'Tüm Hareketleri Göster' : `Hatalı Hareketleri Bul (${orphanMovementsCount})`}
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {isAdmin && selectedMovements.length > 0 && (
            <div className="flex gap-2 mr-4">
              <button
                onClick={openSelectedProductsBulkBarcodeModal}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
              >
                <Pencil className="h-5 w-5 mr-2" />
                Seçilen Ürünleri Düzenle ({selectedMovements.length})
              </button>
              <button
                onClick={handleBulkDelete}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                <Trash2 className="h-5 w-5 mr-2" />
                Seçilenleri Sil ({selectedMovements.length})
              </button>
            </div>
          )}
          {isAdmin && (
            <>
              <button
                onClick={openBulkBarcodeModal}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                <Camera className="h-5 w-5 mr-2" />
                Toplu Barkod Gir
              </button>
              <button
                onClick={openBarcodeModal}
                className="inline-flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <Scan className="h-5 w-5 mr-2" />
                Barkod Ara
              </button>
              <Link to="/app/hareketler/ekle" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Yeni Hareket
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Hatalı Hareket Uyarısı */}
      {showOrphanMovements && filteredHareketler.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-orange-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-orange-900 mb-1">Hatalı Hareketler Tespit Edildi</h3>
              <p className="text-sm text-orange-800 mb-2">
                Bu hareketlerde ürün bulunamadı. Büyük ihtimalle ürünler sistemden silindi. 
                Bu hareketleri toplu olarak silebilirsiniz.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const orphanIds = hareketler
                      .filter(h => {
                        const urunAdi = h.urunAdi || getUrunAdi(h.urunId) || '';
                        return !isValidProductName(urunAdi);
                      })
                      .map(h => h.id);
                    setSelectedMovements(orphanIds);
                  }}
                  className="text-sm px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700"
                >
                  Hepsini Seç
                </button>
                <span className="text-sm text-orange-700">
                  {filteredHareketler.length} hatalı hareket gösteriliyor
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Filtreler */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ara</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ürün veya açıklama..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hareket Tipi</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Tüm Hareketler</option>
              <option value="Giriş">Giriş</option>
              <option value="Çıkış">Çıkış</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lokasyon</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Tüm Lokasyonlar</option>
              {orderedLocations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        
      </div>
      
      {/* Lokasyon Klasörleri */}
      <div className="space-y-4">
        {displayLocations.length > 0 ? (
          displayLocations.map(loc => {
            const movements = groupedMovements[loc.id] || [];
            if (selectedLocation && String(loc.id) !== String(selectedLocation)) return null;
            const locNameLower = (loc.name || '').toLowerCase();
            const isHistoryLocation =
              locNameLower === 'dış kiralama' ||
              locNameLower === 'dis kiralama' ||
              locNameLower === 'servis';
            return (
              <div key={loc.id} className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
                <div
                  onClick={() => toggleLocationCollapse(loc.id)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    <Folder className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-800">{loc.name}</span>
                    <span className="text-xs text-gray-500">
                      {getLocationDisplayCount(loc, movements)} hareket
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={areAllMovementsSelectedForLocation(loc.id)}
                        onChange={(e) => { e.stopPropagation(); toggleSelectAllForLocation(loc.id); }}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      Tümünü Seç
                    </label>
                    {isAdmin && (
                      isHistoryLocation && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setHistoryModalLocation({ id: String(loc.id), name: loc.name });
                          }}
                          className="text-xs text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md px-2 py-1 bg-white"
                        >
                          Geçmiş Kayıtlar
                        </button>
                      )
                    )}
                    {collapsedLocations[loc.id] ? (
                      <ArrowDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ArrowUp className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                </div>
                {!collapsedLocations[loc.id] && (
                  <div className="divide-y divide-gray-100">
                    {/* Kolon Başlıkları */}
                    <div className="px-4 py-2 hidden md:grid md:grid-cols-8 gap-3 bg-gray-50 text-xs font-medium text-gray-500">
                      <div>Tarih</div>
                      <div>Ürün</div>
                      <div>Tip</div>
                      <div>Miktar</div>
                      <div>Barkod</div>
                      <div>Açıklama</div>
                      <div>İşlemi Yapan</div>
                      <div className="text-right">İşlemler</div>
                    </div>
                    {(() => {
                      const page = getLocationPage(loc.id);
                      const start = (page - 1) * itemsPerPage;
                      const end = start + itemsPerPage;
                      const isExternalRental = isExternalRentalLocationName(loc.name);
                      const externalRentalGroups = isExternalRental
                        ? groupExternalRentalMovementsByProduct(movements)
                        : [];
                      const displayCount = isExternalRental ? externalRentalGroups.length : movements.length;
                      const pageItems = isExternalRental
                        ? externalRentalGroups.slice(start, end)
                        : movements.slice(start, end);

                      if (displayCount === 0) {
                        return (
                          <div className="px-4 py-6 text-sm text-gray-500">Bu lokasyonda hareket bulunmuyor</div>
                        );
                      }

                      if (isExternalRental) {
                        return pageItems.map(group => {
                          const hareket = group.latestMovement;
                          const movementIds = group.movements.map(m => m.id);
                          const allSelected = movementIds.every(id => selectedMovements.includes(id));
                          const urunAdi = hareket.urunAdi || getUrunAdi(group.urunId) || '';
                          const displayName = isValidProductName(urunAdi) ? urunAdi : 'Bilinmeyen Ürün';
                          const isOrphan = !isValidProductName(urunAdi);

                          return (
                            <div key={`external-rental-${group.urunId}`} className="px-4 py-3 grid grid-cols-1 md:grid-cols-8 gap-3 items-center hover:bg-gray-50">
                              <div className="text-sm text-gray-700 space-y-1">
                                {group.cikisMovement && (
                                  <div>Çıkış: {formatDateTime(group.cikisMovement.tarih)}</div>
                                )}
                                {group.girisMovement && (
                                  <div>Giriş: {formatDateTime(group.girisMovement.tarih)}</div>
                                )}
                              </div>
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {displayName}
                                {isOrphan && (
                                  <div className="text-xs text-red-600 mt-1 font-mono">
                                    ID: {group.urunId.substring(0, 12)}...
                                  </div>
                                )}
                              </div>
                              <div>
                                {renderExternalRentalTypeBadges(group.hasGiris, group.hasCikis)}
                              </div>
                              <div className="text-sm text-gray-900">{hareket.miktar} adet</div>
                              <div className="text-sm text-gray-700">{getUrunBarkod(group.urunId)}</div>
                              <div className="text-xs md:text-sm text-gray-500 truncate">{hareket.aciklama}</div>
                              <div className="text-xs md:text-sm text-gray-500">{getUserName(hareket.kullanici)}</div>
                              <div className="flex items-center justify-between md:justify-end gap-3">
                                <label className="inline-flex items-center gap-2 md:hidden text-xs text-gray-500">
                                  <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={() => toggleGroupedMovementSelection(movementIds)}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                  />
                                  Seç
                                </label>
                                <input
                                  type="checkbox"
                                  checked={allSelected}
                                  onChange={() => toggleGroupedMovementSelection(movementIds)}
                                  className="hidden md:block h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                {isAdmin && (
                                  <button
                                    onClick={() => handleDelete(hareket)}
                                    className="text-red-600 hover:text-red-900 text-sm"
                                  >
                                    Sil
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        });
                      }

                      return (pageItems as typeof movements).map(hareket => {
                        const urunAdi = hareket.urunAdi || getUrunAdi(hareket.urunId) || '';
                        const displayName = isValidProductName(urunAdi) ? urunAdi : 'Bilinmeyen Ürün';
                        const isOrphan = !isValidProductName(urunAdi);
                        return (
                          <div key={hareket.id} className="px-4 py-3 grid grid-cols-1 md:grid-cols-8 gap-3 items-center hover:bg-gray-50">
                            <div className="text-sm text-gray-700">{formatDateTime(hareket.tarih)}</div>
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {displayName}
                              {isOrphan && (
                                <div className="text-xs text-red-600 mt-1 font-mono">
                                  ID: {hareket.urunId.substring(0, 12)}...
                                </div>
                              )}
                            </div>
                            <div>
                              {renderMovementTypeCell(hareket, loc.name)}
                            </div>
                            <div className="text-sm text-gray-900">{hareket.miktar} adet</div>
                            <div className="text-sm text-gray-700">{getUrunBarkod(hareket.urunId)}</div>
                            <div className="text-xs md:text-sm text-gray-500 truncate">{hareket.aciklama}</div>
                            <div className="text-xs md:text-sm text-gray-500">{getUserName(hareket.kullanici)}</div>
                            <div className="flex items-center justify-between md:justify-end gap-3">
                              <label className="inline-flex items-center gap-2 md:hidden text-xs text-gray-500">
                                <input
                                  type="checkbox"
                                  checked={selectedMovements.includes(hareket.id)}
                                  onChange={() => toggleMovementSelection(hareket.id)}
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                Seç
                              </label>
                              <input
                                type="checkbox"
                                checked={selectedMovements.includes(hareket.id)}
                                onChange={() => toggleMovementSelection(hareket.id)}
                                className="hidden md:block h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                              {isAdmin && (
                                <button
                                  onClick={() => handleDelete(hareket)}
                                  className="text-red-600 hover:text-red-900 text-sm"
                                >
                                  Sil
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}

                    {/* Lokasyon içi sayfalama kontrolü */}
                    {(() => {
                      const displayCount = getLocationDisplayCount(loc, movements);
                      if (displayCount <= itemsPerPage) return null;
                      const totalPages = Math.ceil(displayCount / itemsPerPage);
                      return (
                      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
                        <div className="text-sm text-gray-700">
                          Sayfa {getLocationPage(loc.id)} / {totalPages}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setLocationPage(loc.id, getLocationPage(loc.id) - 1, totalPages)}
                            disabled={getLocationPage(loc.id) === 1}
                            className="p-1 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setLocationPage(loc.id, getLocationPage(loc.id) + 1, totalPages)}
                            disabled={getLocationPage(loc.id) === totalPages}
                            className="p-1 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 p-6 text-center text-sm text-gray-500">
            Hareket kaydı bulunamadı
          </div>
        )}
      </div>
      
      {/* Dışa Aktar Butonu */}
      <div className="flex justify-end">
        <button 
          onClick={() => exportToExcel(
            sortedHareketler.map(hareket => ({
              'Tarih': hareket.tarih,
              'Ürün': hareket.urunAdi,
              'Tip': hareket.tip,
              'Miktar': hareket.miktar,
              'Lokasyon': getLocationName(hareket.lokasyon),
              'Açıklama': hareket.aciklama,
              'İşlemi Yapan': getUserName(hareket.kullanici)
            })),
            'Hareketler'
          )}
          className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition duration-150"
        >
          <Download className="h-5 w-5 mr-2" />
          Excel'e Aktar
        </button>
      </div>

      {/* Lokasyon Geçmiş Kayıtlar Modalı (Dış Kiralama / Servis) */}
      {historyModalLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {historyModalLocation.name} - Geçmiş Kayıtlar
              </h3>
              <button
                onClick={() => setHistoryModalLocation(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg">
              {(() => {
                const historyMovements = sortedHareketler.filter(
                  h => String(h.lokasyon) === String(historyModalLocation.id)
                );

                if (!historyMovements.length) {
                  return (
                    <div className="p-6 text-sm text-gray-500 text-center">
                      Bu lokasyon için geçmiş hareket kaydı bulunmuyor.
                    </div>
                  );
                }

                return (
                  <div className="divide-y divide-gray-100">
                    <div className="px-4 py-2 hidden md:grid md:grid-cols-7 gap-3 bg-gray-50 text-xs font-medium text-gray-500 sticky top-0">
                      <div>Tarih</div>
                      <div>Ürün</div>
                      <div>Tip</div>
                      <div>Miktar</div>
                      <div>Barkod</div>
                      <div>Açıklama</div>
                      <div>İşlemi Yapan</div>
                    </div>
                    {(isExternalRentalLocationName(historyModalLocation.name)
                      ? groupExternalRentalMovementsByProduct(historyMovements)
                      : historyMovements.map(hareket => ({
                          urunId: hareket.urunId,
                          movements: [hareket],
                          hasGiris: hareket.tip === 'Giriş',
                          hasCikis: hareket.tip === 'Çıkış',
                          girisMovement: hareket.tip === 'Giriş' ? hareket : undefined,
                          cikisMovement: hareket.tip === 'Çıkış' ? hareket : undefined,
                          latestMovement: hareket
                        }))
                    ).map(group => {
                      const hareket = group.latestMovement;
                      const urunAdi = hareket.urunAdi || getUrunAdi(group.urunId) || '';
                      const displayName = isValidProductName(urunAdi) ? urunAdi : 'Bilinmeyen Ürün';
                      const isOrphan = !isValidProductName(urunAdi);
                      return (
                        <div
                          key={`history-${group.urunId}`}
                          className="px-4 py-3 grid grid-cols-1 md:grid-cols-7 gap-3 items-center hover:bg-gray-50"
                        >
                          <div className="text-sm text-gray-700 space-y-1">
                            {group.cikisMovement && (
                              <div>Çıkış: {formatDateTime(group.cikisMovement.tarih)}</div>
                            )}
                            {group.girisMovement && (
                              <div>Giriş: {formatDateTime(group.girisMovement.tarih)}</div>
                            )}
                          </div>
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {displayName}
                            {isOrphan && (
                              <div className="text-xs text-red-600 mt-1 font-mono">
                                ID: {group.urunId.substring(0, 12)}...
                              </div>
                            )}
                          </div>
                          <div>
                            {isExternalRentalLocationName(historyModalLocation.name)
                              ? renderExternalRentalTypeBadges(group.hasGiris, group.hasCikis)
                              : renderMovementTypeCell(hareket, historyModalLocation.name)}
                          </div>
                          <div className="text-sm text-gray-900">{hareket.miktar} adet</div>
                          <div className="text-sm text-gray-700">{getUrunBarkod(group.urunId)}</div>
                          <div className="text-xs md:text-sm text-gray-500 truncate">{hareket.aciklama}</div>
                          <div className="text-xs md:text-sm text-gray-500">{getUserName(hareket.kullanici)}</div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setHistoryModalLocation(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barkod Tara Modalı */}
      {showBarcodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Barkod Ara</h3>
              <button
                onClick={closeBarcodeModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Barkod</label>
                <input
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => handleBarcodeInput(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Barkodu girin veya tarayın"
                  autoFocus
                />
              </div>
              
              {barcodeError && (
                <div className="text-red-600 text-sm">{barcodeError}</div>
              )}
              
              {barcodeProduct && (
              <div className="space-y-3 mt-2">
                  <div className="font-semibold text-gray-700">{barcodeProduct.ad} ({barcodeProduct.barkod})</div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">İşlem Tipi</label>
                    <select
                      value={barcodeMovementType}
                      onChange={e => setBarcodeMovementType(e.target.value as 'Giriş' | 'Çıkış')}
                      className="w-full border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="Giriş">Giriş</option>
                      <option value="Çıkış">Çıkış</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Miktar</label>
                    <input
                      type="number"
                      min="1"
                      value={barcodeMovementQuantity}
                      onChange={e => setBarcodeMovementQuantity(Number(e.target.value))}
                      className="w-full border border-gray-300 rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Lokasyon</label>
                    <select
                      value={barcodeMovementLocation}
                      onChange={e => setBarcodeMovementLocation(e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="">Lokasyon Seçin</option>
                      {orderedLocations.map(loc => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Açıklama</label>
                    <textarea
                      value={barcodeMovementDescription}
                      onChange={e => setBarcodeMovementDescription(e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1"
                      rows={2}
                    />
                  </div>

                  {/* Dış Kiralama & Servis geçmişi */}
                  {(() => {
                    const disKiralamaIds = locations
                      .filter(l => (l.name || '').toLowerCase().includes('dış kiralama') || (l.name || '').toLowerCase().includes('dis kiralama'))
                      .map(l => String(l.id));
                    const servisIds = locations
                      .filter(l => (l.name || '').toLowerCase() === 'servis')
                      .map(l => String(l.id));
                    const history = hareketler
                      .filter(h => String(h.urunId) === String(barcodeProduct.id))
                      .filter(h =>
                        disKiralamaIds.includes(String(h.lokasyon)) ||
                        servisIds.includes(String(h.lokasyon))
                      )
                      .sort((a, b) => (a.tarih < b.tarih ? 1 : -1));

                    if (!history.length) return null;

                    // Sadece Depo'ya giriş için göster
                    const depoLoc = locations.find(l => (l.name || '').toLowerCase() === 'depo');
                    const isReturningToDepo =
                      barcodeMovementType === 'Giriş' &&
                      depoLoc &&
                      String(barcodeMovementLocation || '') === String(depoLoc.id);

                    if (!isReturningToDepo) return null;

                    return (
                      <div className="mt-3 border-t border-gray-200 pt-3">
                        <h4 className="text-xs font-semibold text-gray-700 mb-2">
                          Dış Kiralama / Servis Geçmişi
                        </h4>
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {history.map(h => (
                            <div
                              key={h.id}
                              className="text-[11px] leading-snug text-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"
                            >
                              <div className="flex flex-wrap items-center gap-1">
                                <span className="font-medium">{formatDateTime(h.tarih)}</span>
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700">
                                  {getLocationName(h.lokasyon)}
                                </span>
                                {isExternalRentalLocationName(getLocationName(h.lokasyon)) ? (
                                  <span className="inline-flex items-center gap-1">
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                                      getExternalRentalFlowDirection(h) === 'Giriş'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-400'
                                    }`}>
                                      Giriş
                                    </span>
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                                      getExternalRentalFlowDirection(h) === 'Çıkış'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-gray-100 text-gray-400'
                                    }`}>
                                      Çıkış
                                    </span>
                                  </span>
                                ) : (
                                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                                    h.tip === 'Giriş'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {h.tip}
                                  </span>
                                )}
                                <span className="text-gray-600 ml-1">
                                  {h.miktar} adet
                                </span>
                              </div>
                              {h.aciklama && (
                                <div className="text-[10px] text-gray-500 truncate sm:max-w-[60%]">
                                  {h.aciklama}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={closeBarcodeModal}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={handleBarcodeMovement}
                disabled={!barcodeProduct || !barcodeMovementLocation}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toplu Barkod Tarama Modalı */}
      {showBulkBarcodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Toplu Barkod Girişi</h3>
              <button
                onClick={closeBulkBarcodeModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-4">
              {/* Sol taraf - Barkod tarayıcı */}
              <div className="lg:w-1/2">
                <div className="bg-gray-50 rounded-lg p-4 h-full">
                  <h4 className="font-medium text-gray-700 mb-3">Barkod Girişi</h4>
                  <BarcodeScanner 
                    onScan={handleBulkBarcodeScan}
                    onClose={() => {}}
                    showCloseButton={false}
                    showInput={true}
                    showCamera={false}
                  />
                </div>
              </div>
              
              {/* Sağ taraf - Okutulan barkodlar listesi */}
              <div className="lg:w-1/2 flex flex-col">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-gray-700">Okutulan Barkodlar ({scannedBarcodes.length})</h4>
                  {scannedBarcodes.length > 0 && (
                    <button
                      onClick={() => setScannedBarcodes([])}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Listeyi Temizle
                    </button>
                  )}
                </div>
                
                <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg">
                  {scannedBarcodes.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <Scan className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>Henüz barkod girilmedi</p>
                      <p className="text-sm">Barkod makinesinden okutun veya manuel girin</p>
                    </div>
                  ) : (
                    <>
                      <div className="divide-y divide-gray-200">
                        {currentItems.map((item) => (
                          <div key={item.id} className="p-3 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                    {item.barcode}
                                  </span>
                                  {item.product ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <X className="h-4 w-4 text-red-500" />
                                  )}
                                </div>
                                {item.product ? (
                                  <div className="mt-1">
                                    <p className="text-sm font-medium text-gray-900">{item.product.ad}</p>
                                    <p className="text-xs text-gray-500">Model: {item.product.model}</p>
                                  </div>
                                ) : (
                                  <p className="text-sm text-red-600 mt-1">{item.error}</p>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 ml-3">
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updateScannedBarcodeQuantity(item.id, Number(e.target.value))}
                                  className="w-16 text-center border border-gray-300 rounded px-2 py-1 text-sm"
                                />
                                <button
                                  onClick={() => removeScannedBarcode(item.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Sayfalama kontrolleri */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
                          <div className="flex items-center text-sm text-gray-700">
                            <span>
                              Sayfa {currentPage} / {totalPages} 
                              ({scannedBarcodes.length} toplam ürün)
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={goToPreviousPage}
                              disabled={currentPage === 1}
                              className="p-1 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            
                            <div className="flex items-center space-x-1">
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
                                    className={`px-2 py-1 text-sm rounded-md ${
                                      currentPage === pageNum
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                                    }`}
                                  >
                                    {pageNum}
                                  </button>
                                );
                              })}
                            </div>
                            
                            <button
                              onClick={goToNextPage}
                              disabled={currentPage === totalPages}
                              className="p-1 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Alt kısım - Hareket ayarları */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">İşlem Tipi</label>
                  <select
                    value={bulkMovementType}
                    onChange={(e) => setBulkMovementType(e.target.value as 'Giriş' | 'Çıkış')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="Giriş">Giriş</option>
                    <option value="Çıkış">Çıkış</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lokasyon*</label>
                  <select
                    value={bulkMovementLocation}
                    onChange={(e) => setBulkMovementLocation(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Lokasyon Seçin</option>
                    {orderedLocations.map(loc => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                  <input
                    type="text"
                    value={bulkMovementDescription}
                    onChange={(e) => setBulkMovementDescription(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Toplu hareket açıklaması"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={closeBulkBarcodeModal}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={processBulkMovements}
                disabled={!bulkMovementLocation || scannedBarcodes.filter(item => item.product).length === 0 || isProcessingBulk}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isProcessingBulk ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    İşleniyor...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Hareketleri Kaydet ({scannedBarcodes.filter(item => item.product).length})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Düzenleme Modalı */}
      {showEditModal && editingMovement && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Hareket Düzenle</h2>
              <button
                onClick={closeEditModal}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Ürün Bilgisi / Toplu Bilgi */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              {bulkEditIds.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <RefreshCw className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-gray-900">Toplu Düzenleme</h3>
                        <p className="text-sm text-gray-500">{bulkEditIds.length} hareket seçili</p>
                      </div>
                    </div>
                  </div>
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2 bg-white">
                    {(hareketler.filter(h => bulkEditIds.includes(h.id))).map(h => (
                      <div key={h.id} className="text-xs text-gray-700 py-1 flex items-center justify-between">
                        <span className="truncate mr-2">{h.urunAdi || getUrunAdi(h.urunId) || 'Bilinmeyen Ürün'}</span>
                        <span className="text-gray-400">{h.miktar} adet • {h.tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <RefreshCw className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">{editingMovement.urunAdi || getUrunAdi(editingMovement.urunId) || 'Bilinmeyen Ürün'}</h3>
                    <p className="text-sm text-gray-500">
                      {editingMovement.tip} • {editingMovement.miktar} adet
                    </p>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleEditMovement(); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hareket Tipi*
                  </label>
                  <select
                    value={editMovementType}
                    onChange={(e) => setEditMovementType(e.target.value as 'Giriş' | 'Çıkış')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                  >
                    <option value="Giriş">Giriş</option>
                    <option value="Çıkış">Çıkış</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Miktar*
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editMovementQuantity}
                    onChange={(e) => setEditMovementQuantity(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lokasyon*
                </label>
                <select
                  value={editMovementLocation}
                  onChange={(e) => setEditMovementLocation(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                >
                  <option value="">Lokasyon Seçin</option>
                  {orderedLocations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <textarea
                  value={editMovementDescription}
                  onChange={(e) => setEditMovementDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                  rows={3}
                  placeholder="Hareket hakkında açıklama yazın..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Silme Onay Modal */}
      {showDeleteModal && deleteModalMovement && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 mx-auto flex items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {deleteModalMovement.id === 'bulk' 
                  ? 'Seçili Hareketleri Sil' 
                  : 'Hareketi Sil'
                }
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {deleteModalMovement.id === 'bulk' 
                  ? `${deleteModalMovement.count} hareketi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`
                  : `"${deleteModalMovement.urunAdi || getUrunAdi(deleteModalMovement.urunId) || 'Bu Ürün'}" ürününün hareketini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`
                }
              </p>
              
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteModalMovement(null);
                  }}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  İptal
                </button>
                <button
                  onClick={deleteModalMovement.id === 'bulk' ? confirmBulkDelete : confirmDelete}
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

export default Hareketler;