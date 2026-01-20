
import json
import os
import uuid

def process_products():
    base_dir = r"c:\Users\agust\Desktop\Proyectos\sistema-gestion\productos"
    categories = set()
    brands = set()
    products = []

    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if file.endswith(".json"):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8-sig') as f:
                        data = json.load(f)
                        if isinstance(data, list):
                            for item in data:
                                brand_name = item.get('brand', 'Sin Marca').strip()
                                product_name = item.get('name', 'Sin Nombre').strip()
                                category_name = (item.get('categoria') or item.get('category') or 'Sin Categoria').strip()

                                if brand_name:
                                    brands.add(brand_name)
                                if category_name:
                                    categories.add(category_name)
                                
                                products.append({
                                    'name': product_name,
                                    'brand': brand_name,
                                    'category': category_name,
                                    'cost': 0  # Default cost since not in JSON
                                })
                except Exception as e:
                    print(f"Error processing {file_path}: {e}")

    # Generate SQL
    sql_lines = []
    sql_lines.append("SET client_encoding TO 'UTF8';")
    sql_lines.append("CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";\n")
    
    category_colors = {
        'Accesorio': '#3b82f6',
        'Crema': '#ec4899',
        'Maquillaje': '#8b5cf6',
        'Marroquineria': '#f59e0b',
        'Perfume': '#10b981',
        'Ráúl': '#6366f1'
    }

    sql_lines.append("-- Categorias")
    for cat in sorted(list(categories)):
        # Using escape for single quotes
        cat_esc = cat.replace("'", "''")
        color = category_colors.get(cat, 'NULL')
        if color != 'NULL':
            color = f"'{color}'"
        
        sql_lines.append(f"INSERT INTO categories (id, name, color, \"isActive\", \"createdAt\", \"updatedAt\") VALUES (gen_random_uuid(), '{cat_esc}', {color}, true, now(), now()) ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color;")
    
    sql_lines.append("\n-- Marcas")
    for brand in sorted(list(brands)):
        brand_esc = brand.replace("'", "''")
        sql_lines.append(f"INSERT INTO brands (id, name, \"createdAt\", \"updatedAt\") VALUES (gen_random_uuid(), '{brand_esc}', now(), now()) ON CONFLICT (name) DO NOTHING;")

    sql_lines.append("\n-- Productos")
    for prod in products:
        name_esc = prod['name'].replace("'", "''")
        brand_esc = prod['brand'].replace("'", "''")
        cat_esc = prod['category'].replace("'", "''")
        
        # We use subqueries to find the IDs
        sql = f"""INSERT INTO products (id, name, cost, "categoryId", "brandId", "isActive", "useCustomMargin", "stock", "createdAt", "updatedAt") 
VALUES (
    gen_random_uuid(), 
    '{name_esc}', 
    0, 
    (SELECT id FROM categories WHERE name = '{cat_esc}' LIMIT 1), 
    (SELECT id FROM brands WHERE name = '{brand_esc}' LIMIT 1), 
    true, 
    false, 
    0, 
    now(), 
    now()
);"""
        sql_lines.append(sql)

    output_path = r"c:\Users\agust\Desktop\Proyectos\sistema-gestion\seed_products.sql"
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("\n".join(sql_lines))
    print(f"SQL file generated at {output_path}")

if __name__ == "__main__":
    process_products()
