
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { entities } from '../entities'; // Adjust path if needed
import { Product } from '../modules/products/entities/product.entity';
import { Category } from '../modules/products/entities/category.entity';
import { Brand } from '../modules/products/entities/brand.entity';

// Load environment variables from project root
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const PRODUCTS_DIR = path.resolve(__dirname, '../../../../productos');

// Setup DataSource
const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    entities: entities,
    synchronize: false,
    logging: false,
});

interface JsonProduct {
    name: string;
    brand: string;
    category?: string;
    categoria?: string;
    [key: string]: any;
}

async function connectDB() {
    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
        console.log('Database connected');
    }
}

async function closeDB() {
    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
        console.log('Database connection closed');
    }
}

async function getJsonFiles(dir: string): Promise<string[]> {
    let results: string[] = [];
    const list = await fs.promises.readdir(dir);
    for (const file of list) {
        const filePath = path.resolve(dir, file);
        const stat = await fs.promises.stat(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(await getJsonFiles(filePath));
        } else if (file.endsWith('.json')) {
            results.push(filePath);
        }
    }
    return results;
}

async function createCategories() {
    await connectDB();
    const categoryRepo = AppDataSource.getRepository(Category);
    const files = await getJsonFiles(PRODUCTS_DIR);

    const categoriesSet = new Set<string>();

    console.log(`Scanning ${files.length} files for categories...`);

    for (const file of files) {
        try {
            const content = await fs.promises.readFile(file, 'utf-8');
            const data: JsonProduct[] = JSON.parse(content);

            data.forEach(item => {
                const cat = item.category || item.categoria;
                if (cat) {
                    categoriesSet.add(cat.trim());
                }
            });
        } catch (error) {
            console.error(`Error reading file ${file}:`, error);
        }
    }

    console.log(`Found ${categoriesSet.size} unique categories:`, Array.from(categoriesSet));

    for (const catName of categoriesSet) {
        const existing = await categoryRepo.findOne({ where: { name: catName } });
        if (!existing) {
            const newCat = categoryRepo.create({
                name: catName,
                description: `Imported category: ${catName}`,
                isActive: true
            });
            await categoryRepo.save(newCat);
            console.log(`Created category: ${catName}`);
        } else {
            console.log(`Category exists: ${catName}`);
        }
    }
}

async function processFile(filePath: string) {
    await connectDB();
    const productRepo = AppDataSource.getRepository(Product);
    const brandRepo = AppDataSource.getRepository(Brand);
    const categoryRepo = AppDataSource.getRepository(Category);

    console.log(`Processing file: ${filePath}`);

    try {
        console.log(`Reading file: ${filePath}`);
        let content = await fs.promises.readFile(filePath, 'utf-8');

        // Remove BOM if present
        if (content.charCodeAt(0) === 0xFEFF) {
            content = content.slice(1);
        }

        console.log(`Content length: ${content.length}`);
        console.log(`First 100 chars: ${content.substring(0, 100)}`);

        const data: JsonProduct[] = JSON.parse(content);

        if (!Array.isArray(data)) {
            console.error('File content is not an array.');
            return;
        }

        console.log(`Found ${data.length} products.`);

        let successCount = 0;
        let errorCount = 0;

        for (const item of data) {
            try {
                const brandName = item.brand;
                const categoryName = item.category || item.categoria;
                const productName = item.name;

                if (!brandName || !productName) {
                    console.warn(`Skipping item without name or brand: ${JSON.stringify(item).substring(0, 100)}...`);
                    continue;
                }

                // 1. Ensure Brand
                let brand = await brandRepo.findOne({ where: { name: brandName.toLowerCase() } });
                if (!brand) {
                    brand = brandRepo.create({
                        name: brandName.toLowerCase(),
                    });
                    await brandRepo.save(brand);
                    // console.log(`Created Brand: ${brandName}`);
                }

                // 2. Ensure Category
                let category: Category | null = null;
                if (categoryName) {
                    category = await categoryRepo.findOne({ where: { name: categoryName.trim() } });
                    if (!category) {
                        category = categoryRepo.create({
                            name: categoryName.trim(),
                            isActive: true
                        });
                        await categoryRepo.save(category);
                        // console.log(`Created Category (on fly): ${categoryName}`);
                    }
                }

                // 3. Upsert Product
                let product = await productRepo.findOne({
                    where: { name: productName },
                    relations: ['brand', 'category']
                });

                if (product) {
                    // Update relationships if needed
                    let updated = false;
                    if (product.brand?.id !== brand.id) {
                        product.brand = brand;
                        updated = true;
                    }
                    if (category && product.category?.id !== category.id) {
                        product.category = category;
                        updated = true;
                    }
                    if (updated) {
                        await productRepo.save(product);
                        // console.log(`Updated Product: ${productName}`);
                    }
                } else {
                    // Create
                    product = productRepo.create({
                        name: productName,
                        description: item.description,
                        cost: item.cost || 0,
                        price: item.price || 0,
                        stock: item.stock || 0,
                        brand: brand,
                        category: category || undefined,
                        isActive: true
                    });
                    await productRepo.save(product);
                    // console.log(`Created Product: ${productName}`);
                }
                successCount++;

                // Log progress every 100 items
                if (successCount % 100 === 0) {
                    console.log(`Processed ${successCount}/${data.length} items...`);
                }

            } catch (innerError) {
                console.error(`Error processing item ${item.name || 'unknown'}:`, innerError);
                errorCount++;
            }
        }
        console.log(`File processed. Success: ${successCount}, Errors: ${errorCount}`);

    } catch (error) {
        console.error(`Critical error processing file ${filePath}:`, error);
    }
}

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    try {
        if (command === '--categories') {
            await createCategories();
        } else if (command === '--file') {
            const fileArg = args[1];
            if (!fileArg) {
                console.error('Please provide a file path: --file <path>');
                process.exit(1);
            }
            const absolutePath = path.resolve(process.cwd(), fileArg);
            console.log(`Resolved file path: ${absolutePath}`);
            if (!fs.existsSync(absolutePath)) {
                console.error(`File does not exist at path: ${absolutePath}`);
                process.exit(1);
            }
            await processFile(absolutePath);
        } else if (command === '--all') {
            await createCategories();
            const allFiles = await getJsonFiles(PRODUCTS_DIR);
            for (const f of allFiles) {
                await processFile(f);
            }
        } else {
            console.log('Usage:');
            console.log('  ts-node populate-products.ts --categories       # Create categories from all files');
            console.log('  ts-node populate-products.ts --file <path>      # Process a specific file');
            console.log('  ts-node populate-products.ts --all              # Process all files');
        }
    } catch (err) {
        console.error(err);
    } finally {
        await closeDB();
    }
}

main();
