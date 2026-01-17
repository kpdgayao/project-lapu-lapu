import fs from 'fs';
import path from 'path';

export interface Product {
  productName: string;
  genericName: string;
  drugClass: string;
  sizeVariant: string;
  regularPrice: number;
  pwdSeniorPrice: number;
  category: string;
  description: string;
  mechanismOfAction: string;
  indications: string;
  dosageInfo: string;
  activeIngredients: string;
  importantInfo: string;
  contraindications: string;
  warnings: string;
}

// In-memory product cache
let productsCache: Product[] | null = null;

/**
 * Load products from CSV file
 */
function loadProducts(): Product[] {
  if (productsCache) {
    return productsCache;
  }

  try {
    // Try multiple possible paths
    const possiblePaths = [
      path.join(process.cwd(), 'data', 'products.csv'),
      path.join(process.cwd(), 'apps', 'api', 'data', 'products.csv'),
      path.join(__dirname, '..', '..', 'data', 'products.csv'),
    ];

    let csvContent = '';
    for (const csvPath of possiblePaths) {
      if (fs.existsSync(csvPath)) {
        csvContent = fs.readFileSync(csvPath, 'utf-8');
        console.log(`Loaded products from: ${csvPath}`);
        break;
      }
    }

    if (!csvContent) {
      console.warn('Products CSV not found, using empty catalog');
      productsCache = [];
      return productsCache;
    }

    const lines = csvContent.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',');

    productsCache = lines.slice(1).map(line => {
      // Handle CSV parsing with quoted fields containing commas
      const values: string[] = [];
      let current = '';
      let inQuotes = false;

      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      return {
        productName: values[0] || '',
        genericName: values[1] || '',
        drugClass: values[2] || '',
        sizeVariant: values[3] || '',
        regularPrice: parseFloat(values[4]) || 0,
        pwdSeniorPrice: parseFloat(values[5]) || 0,
        category: values[6] || '',
        description: values[7] || '',
        mechanismOfAction: values[8] || '',
        indications: values[9] || '',
        dosageInfo: values[10] || '',
        activeIngredients: values[11] || '',
        importantInfo: values[12] || '',
        contraindications: values[13] || '',
        warnings: values[14] || '',
      };
    });

    console.log(`Loaded ${productsCache.length} products`);
    return productsCache;
  } catch (error) {
    console.error('Error loading products:', error);
    productsCache = [];
    return productsCache;
  }
}

/**
 * Search products by query (name, generic name, category, or condition)
 */
export function searchProducts(query: string): Product[] {
  const products = loadProducts();
  const searchTerms = query.toLowerCase().split(' ');

  return products.filter(product => {
    const searchableText = [
      product.productName,
      product.genericName,
      product.drugClass,
      product.category,
      product.description,
      product.indications,
    ].join(' ').toLowerCase();

    return searchTerms.every(term => searchableText.includes(term));
  });
}

/**
 * Get product by exact name
 */
export function getProductByName(name: string): Product | undefined {
  const products = loadProducts();
  return products.find(
    p => p.productName.toLowerCase() === name.toLowerCase()
  );
}

/**
 * Get all products in a category
 */
export function getProductsByCategory(category: string): Product[] {
  const products = loadProducts();
  return products.filter(
    p => p.category.toLowerCase() === category.toLowerCase()
  );
}

/**
 * Get all unique categories
 */
export function getCategories(): string[] {
  const products = loadProducts();
  return [...new Set(products.map(p => p.category))];
}

/**
 * Format product for voice response (concise)
 */
export function formatProductForVoice(product: Product): string {
  return `${product.productName} (${product.genericName}), ${product.sizeVariant}. ` +
    `Regular price: ${product.regularPrice} pesos. ` +
    `PWD/Senior price: ${product.pwdSeniorPrice} pesos. ` +
    `${product.indications}`;
}

/**
 * Format product details for voice response (detailed)
 */
export function formatProductDetailsForVoice(product: Product): string {
  let response = `${product.productName} is ${product.genericName}, a ${product.drugClass}. `;
  response += `It is available in ${product.sizeVariant} at ${product.regularPrice} pesos regular price, `;
  response += `or ${product.pwdSeniorPrice} pesos with PWD or Senior Citizen discount. `;
  response += `${product.description} `;

  if (product.dosageInfo) {
    response += `Dosage: ${product.dosageInfo} `;
  }

  if (product.importantInfo) {
    response += `Important: ${product.importantInfo}`;
  }

  return response;
}
