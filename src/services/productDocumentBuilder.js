export function buildProductDocument(product) {
  return `
Producto: ${product.name}
Categoría: ${product.categoria}
Subcategoría: ${product.subcategoria}
Descripción técnica: ${product.description || "No especificada"}
Marca: ${product.brand || "No especificada"}
Clase: ${product.class}
Tipo: Repuesto automotor
Uso habitual: mantenimiento y reparación
`.trim();
}
