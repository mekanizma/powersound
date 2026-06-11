export interface MovementLocationRow {
  lokasyon: string;
  urunId: string;
  miktar: number;
}

export interface MovementFlowRow {
  tip: string;
  aciklama?: string;
  tarih?: string;
}

export interface ExternalRentalProductGroup<T extends MovementLocationRow & MovementFlowRow> {
  urunId: string;
  movements: T[];
  hasGiris: boolean;
  hasCikis: boolean;
  girisMovement?: T;
  cikisMovement?: T;
  latestMovement: T;
}

export interface ProductLocationRow {
  id: string;
  location_id: string;
}

export interface LocationRef {
  id: string;
  name: string;
}

export const isExcludedLocationName = (locationName: string): boolean => {
  const normalized = String(locationName || '').trim().toLowerCase();
  return normalized === 'limak deluxe' || normalized === 'limak';
};

export const isExternalRentalLocationName = (locationName: string): boolean => {
  const normalized = String(locationName || '').trim().toLowerCase();
  return normalized === 'dış kiralama' || normalized === 'dis kiralama' || normalized.includes('kiralama');
};

const compareMovementDateDesc = (a: MovementFlowRow, b: MovementFlowRow) => {
  const dateA = String(a.tarih || '');
  const dateB = String(b.tarih || '');
  return dateB.localeCompare(dateA);
};

export const groupExternalRentalMovementsByProduct = <T extends MovementLocationRow & MovementFlowRow>(
  movements: T[]
): ExternalRentalProductGroup<T>[] => {
  const grouped = new Map<string, T[]>();

  for (const movement of movements) {
    const key = String(movement.urunId);
    const list = grouped.get(key) || [];
    list.push(movement);
    grouped.set(key, list);
  }

  return Array.from(grouped.entries()).map(([urunId, productMovements]) => {
    const sorted = [...productMovements].sort(compareMovementDateDesc);
    const girisMovement = sorted.find(m => getExternalRentalFlowDirection(m) === 'Giriş');
    const cikisMovement = sorted.find(m => getExternalRentalFlowDirection(m) === 'Çıkış');

    return {
      urunId,
      movements: sorted,
      hasGiris: Boolean(girisMovement),
      hasCikis: Boolean(cikisMovement),
      girisMovement,
      cikisMovement,
      latestMovement: sorted[0]
    };
  }).sort((a, b) => compareMovementDateDesc(a.latestMovement, b.latestMovement));
};

export const getExternalRentalFlowDirection = (movement: MovementFlowRow): 'Giriş' | 'Çıkış' => {
  const aciklama = String(movement.aciklama || '').toLowerCase();
  const isReturnToDepot =
    aciklama.includes('klon') ||
    aciklama.includes('dış kiralamadan depoya iade') ||
    aciklama.includes('dis kiralamadan depoya iade');

  if (isReturnToDepot || movement.tip === 'Giriş') {
    return 'Giriş';
  }

  return 'Çıkış';
};

export const isHotelLocationName = (locationName: string): boolean => {
  const normalized = String(locationName || '').trim().toLowerCase();
  return (
    normalized === 'kaya palazzo' ||
    normalized === 'kaya artemis' ||
    normalized === 'lords palace' ||
    normalized === 'lord place' ||
    normalized === 'les ambassadeurs'
  );
};

export const filterMovementsForLocation = (
  movements: MovementLocationRow[],
  products: ProductLocationRow[],
  location: LocationRef
): MovementLocationRow[] => {
  let list = movements.filter(h => String(h.lokasyon) === String(location.id));

  if (isHotelLocationName(location.name)) {
    list = list.filter(h => {
      const product = products.find(u => String(u.id) === String(h.urunId));
      return Boolean(
        product &&
        String(product.location_id) === String(location.id) &&
        (h.miktar || 0) > 0
      );
    });
  }

  return list;
};

export const countMovementsForLocation = (
  movements: MovementLocationRow[],
  products: ProductLocationRow[],
  location: LocationRef
): number => {
  const list = filterMovementsForLocation(movements, products, location);
  if (isExternalRentalLocationName(location.name)) {
    return groupExternalRentalMovementsByProduct(list).length;
  }
  return list.length;
};
