# Order Report – Refactoring

Refactoring d'un script legacy de génération de rapports de commandes (TypeScript). Le comportement observable est préservé à l'identique, caractère par caractère, y compris les bugs du legacy (voir [Comportements legacy préservés](#comportements-legacy-préservés)).

- `legacy/` : code fourni, **non modifié** (script, CSV, rapport de référence)
- `src/` : code refactoré
- `tests/` : tests de régression (golden master) et tests unitaires

## Installation

### Prérequis

- Node.js 18.18 ou plus
- npm 9 ou plus

### Commandes

```bash
git clone https://github.com/Arvind-V1/order-report-refactoring.git
cd order-report-refactoring
npm install
```

## Exécution

### Exécuter le code refactoré

```bash
npm start
```

Le rapport est affiché dans la console et l'export JSON est écrit dans `output.json` à la racine (ignoré par Git).

### Exécuter les tests

```bash
npm test
```

Pour tout valider d'un coup (types, lint, format, tests) :

```bash
npm run check
```

### Comparer avec le legacy (validation)

Le test golden master (`tests/goldenMaster.test.ts`) le fait automatiquement :

```bash
npx jest tests/goldenMaster.test.ts
```

Il exécute le legacy, compare sa sortie à `legacy/expected/report.txt` (générée au premier lancement), puis compare la sortie du code refactoré à cette même référence, ainsi que l'export JSON des deux versions.

Comparaison manuelle (bash) :

```bash
diff <(npm run legacy --silent) <(npm start --silent) && echo "Sorties identiques"
```

Le legacy écrit aussi `legacy/output.json` à chaque exécution (fichier ignoré par Git).

## Choix de refactoring

### Problèmes identifiés dans le legacy

1. **Fonction monolithique** : `run()` lit les fichiers, parse, calcule, formate, affiche et écrit un fichier en une seule fonction de plus de 300 lignes.
   - Impact : impossible à tester unitairement, chaque modification risque de casser autre chose.
2. **Duplication du parsing CSV** : cinq blocs de lecture quasi identiques, chacun avec sa petite variation.
   - Impact : les valeurs par défaut et les cas limites sont dispersés, difficiles à repérer.
3. **Nombres magiques et constantes mal organisées** : seuils, taux et paliers écrits en dur (`0.05`, `0.15`, `1.2`, `1.1`…), constantes déclarées mais jamais utilisées (`SHIP`, `PREMIUM_THRESHOLD`).
   - Impact : les règles métier ne sont pas lisibles, ni modifiables sans risque.
4. **Typage inexistant** : `type Customer = any`, `Record<string, any>`.
   - Impact : le compilateur ne détecte aucune faute de frappe sur une propriété.
5. **Erreurs avalées** : `try/catch` qui ignorent tout. Ceux autour de `parseFloat` / `parseInt` sont du code mort, car ces fonctions ne lèvent jamais d'exception.
   - Impact : fausse impression de robustesse.
6. **Effets de bord mélangés à la logique** : `console.log` et `writeFileSync` au milieu du calcul, chemins calculés depuis `__dirname`.
   - Impact : le calcul ne peut pas être testé sans toucher au disque.
7. **Paliers de remise en `if` successifs qui s'écrasent** : le dernier palier gagne, mais le code ne le dit pas.
   - Impact : l'intention est difficile à deviner.

### Solutions apportées

1. **Découpage en modules à responsabilité unique** (parsing, agrégation, calculateurs, rapport, I/O).
   - Justification : chaque règle métier devient une fonction pure testable seule.
2. **Un seul parseur CSV générique** (`parseCsvRows`) et une petite fonction de conversion par entité.
   - Justification : la duplication disparaît, les valeurs par défaut sont nommées dans `constants.ts`.
3. **Constantes nommées et paliers déclaratifs** : les paliers de remise sont des tableaux de données (`VOLUME_TIERS`, `LOYALTY_TIERS`).
   - Justification : ajouter ou modifier un palier devient une modification de données, pas de logique.
4. **Modèles typés** (`Customer`, `Product`, `Order`, `Promotion`, `ShippingZone`, `ReportData`) et suppression de tous les `any` (règle ESLint `no-explicit-any`).
   - Justification : le compilateur vérifie les accès aux propriétés.
5. **Gestion d'erreurs explicite** : seul l'absence du fichier `promotions.csv` est tolérée (fichier facultatif). Toute autre erreur de lecture remonte.
   - Justification : le legacy masquait n'importe quelle erreur sans distinction.
6. **I/O isolés** : `generateReport(data)` est pure ; seuls `dataLoader.ts`, `reportWriter.ts` et `index.ts` touchent au disque ou à la console.
   - Justification : injection claire des dépendances, tests sans fichiers.
7. **Outillage** : Prettier, ESLint (règles `max-lines-per-function` à 50 lignes, `no-console`, `no-explicit-any`) et `tsc` en mode strict.
   - Justification : les critères de qualité sont vérifiés automatiquement.

### Architecture choisie

```
src/
├── index.ts                    point d'entrée : charge, génère, affiche, écrit
├── orderReport.ts              generateReport(data) : orchestration pure
├── models.ts                   types métier
├── constants.ts                valeurs par défaut partagées
├── parsing/
│   ├── csvRows.ts              découpage CSV en lignes de champs
│   └── parsers.ts              conversion des lignes en entités typées
├── aggregation/
│   └── customerTotals.ts       cumul sous-total / poids / bonus par client, tri
├── calculators/                fonctions pures
│   ├── orderLine.ts            prix d'une ligne (promo, bonus matin, poids)
│   ├── discounts.ts            remises volume, week-end, fidélité, plafond
│   ├── tax.ts
│   ├── shipping.ts
│   ├── handling.ts
│   └── money.ts                arrondi, taux de change
├── report/
│   ├── customerReport.ts       rapport complet d'un client (données)
│   ├── textFormatter.ts        rapport texte
│   └── jsonExport.ts           export JSON
└── io/
    ├── dataLoader.ts           lecture des CSV
    └── reportWriter.ts         console et écriture de fichier
```

Flux de données :

```
CSV → dataLoader → parsers → ReportData
ReportData → aggregateOrdersByCustomer → buildCustomerReport (calculateurs) → CustomerReport[]
CustomerReport[] → formatReport (texte) + toJsonExport (JSON) → reportWriter
```

### Exemples concrets

**Exemple 1 : paliers de remise**
- Problème : quatre `if` consécutifs, chacun écrasant le précédent, avec des taux écrits en dur.
- Solution : une liste de paliers ordonnée du plus haut au plus bas et un `find` qui retient le premier palier dépassé. Le palier à 20 % reste réservé aux clients `PREMIUM`.

**Exemple 2 : parsing CSV**
- Problème : cinq blocs de lecture dupliqués mélangeant fichier, découpage et valeurs par défaut.
- Solution : `parseCsvRows` découpe, une fonction `toXxx` par entité convertit, `indexBy` construit les `Map`. Tout est pur et testé sur des chaînes, sans fichier.

**Exemple 3 : frais de port**
- Problème : trois niveaux de `if` imbriqués avec des seuils (`10`, `5`, `20`) et des taux (`0.3`, `0.25`, `1.2`) sans nom.
- Solution : constantes nommées (`HEAVY_PARCEL_THRESHOLD_KG`, `REMOTE_ZONE_MULTIPLIER`…) et trois petites fonctions, chacune avec un rôle (coût selon le poids, majoration de zone, surtaxe de colis lourd).

## Comportements legacy préservés

Conformément à la consigne, les bugs du legacy ne sont **pas corrigés** : le golden master les fige. Ils sont ici documentés.

1. **Fins de ligne CRLF non nettoyées.** Les CSV utilisent `\r\n` et le legacy découpe sur `\n` seulement : le `\r` reste collé au dernier champ de chaque ligne. Conséquences :
   - le code devise (`"USD\r"`) n'est jamais reconnu : **aucune conversion USD/GBP** n'est appliquée, et la ligne `Level: … | Currency: …` du rapport contient un `\r` ;
   - dans `products.csv`, `"true\r" === "true"` est faux : **aucun produit n'est taxable** quand `taxable` est la dernière colonne, d'où `Tax: 0.00` partout ;
   - dans `promotions.csv`, `"false\r" !== "false"` est vrai : une promotion marquée `false` reste **active**.
   Le parseur conserve donc volontairement le `\r` (voir `src/parsing/csvRows.ts`).
2. **Promotion `FIXED`** déduite **par unité** et non une seule fois par ligne.
3. **Bonus week-end** : calculé sur la date de la **première** commande du client seulement, dépend du fuseau horaire de la machine (`getDay()`), et appliqué aussi quand la date est absente (traitée comme un dimanche).
4. **Points de fidélité** calculés sur le prix unitaire de la **commande**, alors que le sous-total utilise le prix du **produit**.
5. **Un total `NaN`** dans les points de fidélité repart de zéro à la commande suivante (`|| 0`).
6. **Taxe** : si au moins un produit est non taxable, la taxe est calculée ligne par ligne ; les produits inconnus sont alors ignorés, alors qu'ils sont taxés dans le calcul global.
7. **Totaux du récapitulatif** : `Grand Total` additionne des montants exprimés dans la devise de chaque client mais est étiqueté `EUR`.
8. **Code mort du legacy non repris** : constantes `SHIP` et `PREMIUM_THRESHOLD`, variable `custHeader`, champ `promoDiscount`, `try/catch` autour de `parseFloat`/`parseInt`.

## Tests

- **Golden master** (`tests/goldenMaster.test.ts`) : sortie texte identique caractère par caractère au legacy, et export JSON identique.
- **Tests unitaires** : parsing, agrégation, remises, taxe, frais de port, frais de gestion, devise, ligne de commande, rapport client, formatage texte, export JSON, chargement des données.
- Bilan actuel : 13 suites, 92 tests.
- Les tests sont exécutés avec le fuseau `Europe/Paris` (voir `tests/setupTimezone.js`) car le bonus week-end dépend du fuseau.

## Outils de qualité

| Outil | Commande |
|---|---|
| TypeScript (mode strict) | `npm run typecheck` |
| ESLint | `npm run lint` |
| Prettier | `npm run format:check` / `npm run format` |
| Tout enchaîner | `npm run check` |

## Limites et améliorations futures

### Ce qui n'a pas été fait (par manque de temps)

- [ ] Tests d'intégration avec des jeux de données variés (le golden master ne couvre qu'un seul jeu de CSV ; certaines branches, comme les frais de port d'un colis lourd sous le seuil, n'y sont pas exercées).
- [ ] Validation des lignes CSV invalides (colonnes manquantes, nombres illisibles) : elles produisent des `NaN` comme dans le legacy.
- [ ] Parseur CSV complet (champs entre guillemets, virgules dans un champ).

### Compromis assumés

- **Bugs conservés** : le sujet demande un comportement strictement identique, donc le `\r` des CSV est volontairement conservé plutôt que nettoyé.
- **Fuseau horaire figé dans les tests** : nécessaire car le legacy dépend du fuseau de la machine pour le bonus week-end.
- **Tests liés au dossier `legacy/`** : le golden master exécute le legacy à chaque lancement ; c'est le principe du test de régression, au prix d'une dépendance à ce dossier.

### Pistes d'amélioration future

- Corriger les bugs documentés ci-dessus (nettoyage des fins de ligne, conversion de devise, remise fixe globale) en les accompagnant d'une mise à jour volontaire des tests.
- Remplacer les flottants par des montants en centimes entiers pour éviter les erreurs d'arrondi.
- Rendre les règles métier (paliers, taux) configurables.
- Ajouter une intégration continue (GitHub Actions) qui lance `npm run check`.