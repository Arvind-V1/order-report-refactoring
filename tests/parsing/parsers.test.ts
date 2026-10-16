import { parseCsvRows } from '../../src/parsing/csvRows';
import {
  parseCustomers,
  parseOrders,
  parseProducts,
  parsePromotions,
  parseShippingZones,
} from '../../src/parsing/parsers';

describe('parseCsvRows', () => {
  it("ignore l'en-tête et les lignes vides", () => {
    expect(parseCsvRows('a,b\n1,2\n\n3,4\n')).toEqual([['1', '2'], ['3', '4']]);
  });

  it('conserve le \\r du CRLF dans le dernier champ (comportement legacy)', () => {
    expect(parseCsvRows('a,b\r\n1,2\r\n')).toEqual([['1', '2\r']]);
  });
});

describe('parseCustomers', () => {
  it('applique les valeurs par défaut sur les champs manquants', () => {
    const customers = parseCustomers('id,name,level,shipping_zone,currency\nC001,Alice Martin\n');

    expect(customers.get('C001')).toEqual({
      id: 'C001',
      name: 'Alice Martin',
      level: 'BASIC',
      shippingZone: 'ZONE1',
      currency: 'EUR',
    });
  });
});

describe('parseProducts', () => {
  it('lit les champs numériques', () => {
    const products = parseProducts('h\nP001,Laptop Pro,Electronics,1299.00,2.5,true\n');

    expect(products.get('P001')).toMatchObject({ price: 1299, weight: 2.5, taxable: true });
  });

  it('considère taxable=false si la valeur est suivie de \\r (bug legacy préservé)', () => {
    const products = parseProducts('h\r\nP001,Laptop Pro,Electronics,1299.00,2.5,true\r\n');

    expect(products.get('P001')?.taxable).toBe(false);
  });
});

describe('parseShippingZones', () => {
  it('applique le tarif au kg par défaut', () => {
    const zones = parseShippingZones('h\nZONE1,5.00\n');

    expect(zones.get('ZONE1')).toEqual({ zone: 'ZONE1', baseCost: 5, costPerKg: 0.5 });
  });
});

describe('parsePromotions', () => {
  it('désactive une promo marquée false', () => {
    expect(parsePromotions('h\nP,PERCENTAGE,10,false\n').get('P')?.active).toBe(false);
  });

  it('garde active une promo "false" en CRLF (bug legacy préservé)', () => {
    expect(parsePromotions('h\r\nP,PERCENTAGE,10,false\r\n').get('P')?.active).toBe(true);
  });
});

describe('parseOrders', () => {
  it('applique le code promo et l\'heure par défaut', () => {
    const [order] = parseOrders('h\nO1,C001,P001,2,10.5,2025-01-15\n');

    expect(order).toEqual({
      id: 'O1',
      customerId: 'C001',
      productId: 'P001',
      quantity: 2,
      unitPrice: 10.5,
      date: '2025-01-15',
      promoCode: '',
      time: '12:00',
    });
  });
});