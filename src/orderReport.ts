import * as fs from 'fs';
import { DEFAULT_PRODUCT_WEIGHT_KG } from './constants';
import { loadReportData } from './io/dataLoader';

// Constantes globales mal organisées
const TAX = 0.2;
const SHIPPING_LIMIT = 50;
const SHIP = 5.0;
const PREMIUM_THRESHOLD = 1000;
const LOYALTY_RATIO = 0.01;
const HANDLING_FEE = 2.5;
const MAX_DISCOUNT = 200;

// Fonction principale qui fait TOUT
export function run(dataDir: string, jsonOutputPath: string): string {
    const { customers, products, shippingZones, promotions, orders } = loadReportData(dataDir);

    // Calcul des points de fidélité (première duplication)
    const loyaltyPoints: Record<string, number> = {};
    for (const o of orders) {
        const cid = o.customerId;
        if (!loyaltyPoints[cid]) {
            loyaltyPoints[cid] = 0;
        }
        // Calcul basé sur le prix de commande
        loyaltyPoints[cid] += o.quantity * o.unitPrice * LOYALTY_RATIO;
    }

    // Groupement par client (logique métier mélangée avec aggregation)
    const totalsByCustomer: Record<string, any> = {};
    for (const o of orders) {
        const cid = o.customerId;

        // Récupération du produit avec fallback
        const prod = products.get(o.productId);
        const basePrice = prod ? prod.price : o.unitPrice;
        const promoCode = o.promoCode;
        let discountRate = 0;
        let fixedDiscount = 0;

        const promo = promoCode ? promotions.get(promoCode) : undefined;
        if (promo && promo.active) {
            if (promo.type === 'PERCENTAGE') {
                discountRate = promo.value / 100;
            } else if (promo.type === 'FIXED') {
                // Bug intentionnel: appliqué par ligne au lieu de global
                fixedDiscount = promo.value;
            }
        }

        let lineTotal = o.quantity * basePrice * (1 - discountRate) - fixedDiscount * o.quantity;

        // Bonus matin (règle cachée basée sur l'heure)
        const hour = parseInt(o.time.split(':')[0]);
        let morningBonus = 0;
        if (hour < 10) {
            morningBonus = lineTotal * 0.03; // 3% de réduction supplémentaire
        }
        lineTotal = lineTotal - morningBonus;

        if (!totalsByCustomer[cid]) {
            totalsByCustomer[cid] = {
                subtotal: 0.0,
                items: [],
                weight: 0.0,
                promoDiscount: 0.0,
                morningBonus: 0.0
            };
        }

        totalsByCustomer[cid].subtotal += lineTotal;
        totalsByCustomer[cid].weight += (prod?.weight || DEFAULT_PRODUCT_WEIGHT_KG) * o.quantity;
        totalsByCustomer[cid].items.push(o);
        totalsByCustomer[cid].morningBonus += morningBonus;
    }

    // Génération du rapport (mélange calculs + formatage + I/O)
    const outputLines: string[] = [];
    const jsonData: any[] = [];
    let grandTotal = 0.0;
    let totalTaxCollected = 0.0;

    // Tri par ID client (comportement à préserver)
    const sortedCustomerIds = Object.keys(totalsByCustomer).sort();

    for (const cid of sortedCustomerIds) {
        const cust = customers.get(cid);
        const name = cust?.name || 'Unknown';
        const level = cust?.level || 'BASIC';
        const zone = cust?.shippingZone || 'ZONE1'; 
        const currency = cust?.currency || 'EUR';

        const sub = totalsByCustomer[cid].subtotal;

        // Remise par paliers (duplication #1 + magic numbers)
        let disc = 0.0;
        if (sub > 50) {
            disc = sub * 0.05;
        }
        if (sub > 100) {
            disc = sub * 0.10; // écrase la précédente (bug intentionnel)
        }
        if (sub > 500) {
            disc = sub * 0.15;
        }
        if (sub > 1000 && level === 'PREMIUM') {
            disc = sub * 0.20;
        }

        // Bonus weekend (règle cachée basée sur la date)
        const firstOrderDate = totalsByCustomer[cid].items[0]?.date || '';
        const dayOfWeek = firstOrderDate ? new Date(firstOrderDate).getDay() : 0;
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            disc = disc * 1.05; // 5% de bonus sur la remise
        }

        // Calcul remise fidélité (duplication #2)
        let loyaltyDiscount = 0.0;
        const pts = loyaltyPoints[cid] || 0;
        if (pts > 100) {
            loyaltyDiscount = Math.min(pts * 0.1, 50.0);
        }
        if (pts > 500) {
            loyaltyDiscount = Math.min(pts * 0.15, 100.0);
        }

        // Plafond de remise global (règle cachée)
        let totalDiscount = disc + loyaltyDiscount;
        if (totalDiscount > MAX_DISCOUNT) {
            totalDiscount = MAX_DISCOUNT;
            // On ajuste proportionnellement (logique complexe)
            const ratio = MAX_DISCOUNT / (disc + loyaltyDiscount);
            disc = disc * ratio;
            loyaltyDiscount = loyaltyDiscount * ratio;
        }

        // Calcul taxe (avec gestion spéciale par produit)
        const taxable = sub - totalDiscount;
        let tax = 0.0;

        // Vérifier si tous les produits sont taxables
        let allTaxable = true;
        for (const item of totalsByCustomer[cid].items) {
            const prod = products.get(item.productId);
            if (prod && prod.taxable === false) {
                allTaxable = false;
                break;
            }
        }

        if (allTaxable) {
            tax = Math.round(taxable * TAX * 100) / 100; // Arrondi à 2 décimales
        } else {
            // Calcul taxe par ligne (plus complexe)
            for (const item of totalsByCustomer[cid].items) {
                const prod = products.get(item.productId);
                if (prod && prod.taxable !== false) {
                    const itemTotal = item.quantity * (prod.price || item.unitPrice);
                    tax += itemTotal * TAX;
                }
            }
            tax = Math.round(tax * 100) / 100;
        }

        // Frais de port complexes (duplication #3)
        let ship = 0.0;
        const weight = totalsByCustomer[cid].weight;

        if (sub < SHIPPING_LIMIT) {
            const shipZone = shippingZones.get(zone) ?? { baseCost: 5.0, costPerKg: 0.5 };
            const baseShip = shipZone.baseCost;


            if (weight > 10) {
                ship = baseShip + (weight - 10) * shipZone.costPerKg;
            } else if (weight > 5) {
                // Palier intermédiaire (règle cachée)
                ship = baseShip + (weight - 5) * 0.3;
            } else {
                ship = baseShip;
            }

            // Majoration pour livraison en zone éloignée
            if (zone === 'ZONE3' || zone === 'ZONE4') {
                ship = ship * 1.2;
            }
        } else {
            // Livraison gratuite mais frais de manutention pour poids élevé
            if (weight > 20) {
                ship = (weight - 20) * 0.25;
            }
        }

        // Frais de gestion (magic number + condition cachée)
        let handling = 0.0;
        const itemCount = totalsByCustomer[cid].items.length;
        if (itemCount > 10) {
            handling = HANDLING_FEE;
        }
        if (itemCount > 20) {
            handling = HANDLING_FEE * 2; // double pour très grosses commandes
        }

        // Conversion devise (règle cachée pour non-EUR)
        let currencyRate = 1.0;
        if (currency === 'USD') {
            currencyRate = 1.1;
        } else if (currency === 'GBP') {
            currencyRate = 0.85;
        }

        const total = Math.round((taxable + tax + ship + handling) * currencyRate * 100) / 100;
        grandTotal += total;
        totalTaxCollected += tax * currencyRate;

      
        outputLines.push(`Customer: ${name} (${cid})`);
        outputLines.push(`Level: ${level} | Zone: ${zone} | Currency: ${currency}`);
        outputLines.push(`Subtotal: ${sub.toFixed(2)}`);
        outputLines.push(`Discount: ${totalDiscount.toFixed(2)}`);
        outputLines.push(`  - Volume discount: ${disc.toFixed(2)}`);
        outputLines.push(`  - Loyalty discount: ${loyaltyDiscount.toFixed(2)}`);
        if (totalsByCustomer[cid].morningBonus > 0) {
            outputLines.push(`  - Morning bonus: ${totalsByCustomer[cid].morningBonus.toFixed(2)}`);
        }
        outputLines.push(`Tax: ${(tax * currencyRate).toFixed(2)}`);
        outputLines.push(`Shipping (${zone}, ${weight.toFixed(1)}kg): ${ship.toFixed(2)}`);
        if (handling > 0) {
            outputLines.push(`Handling (${itemCount} items): ${handling.toFixed(2)}`);
        }
        outputLines.push(`Total: ${total.toFixed(2)} ${currency}`);
        outputLines.push(`Loyalty Points: ${Math.floor(pts)}`);
        outputLines.push('');

        // Export JSON en parallèle (side effect)
        jsonData.push({
            customer_id: cid,
            name: name,
            total: total,
            currency: currency,
            loyalty_points: Math.floor(pts)
        });
    }

    outputLines.push(`Grand Total: ${grandTotal.toFixed(2)} EUR`);
    outputLines.push(`Total Tax Collected: ${totalTaxCollected.toFixed(2)} EUR`);

    const result = outputLines.join('\n');

    // Side effects: print + file write
    console.log(result);

    // Export JSON surprise
    jsonOutputPath
    fs.writeFileSync(jsonOutputPath, JSON.stringify(jsonData, null, 2));

    return result;
}

