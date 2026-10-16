export interface Customer {
  id: string;
  name: string;
  level: string;
  shippingZone: string;
  currency: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  weight: number;
  taxable: boolean;
}

export interface ShippingZone {
  zone: string;
  baseCost: number;
  costPerKg: number;
}

export interface Promotion {
  code: string;
  type: string;
  value: number;
  active: boolean;
}

export interface Order {
  id: string;
  customerId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  date: string;
  promoCode: string;
  time: string;
}

export interface ReportData {
  customers: Map<string, Customer>;
  products: Map<string, Product>;
  shippingZones: Map<string, ShippingZone>;
  promotions: Map<string, Promotion>;
  orders: Order[];
}
