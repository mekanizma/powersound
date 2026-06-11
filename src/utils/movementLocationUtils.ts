export interface MovementLocationRow {
  lokasyon: string;
  urunId: string;
  miktar: number;
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
): number => filterMovementsForLocation(movements, products, location).length;
