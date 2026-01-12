export function buildProductText(p) {
  return `
Producto: ${p.name}
Código interno: ${p.cod}
Categoría: ${p.categoria}
Subcategoría: ${p.subcategoria}
Marca: ${p.brand || "No especificada"}
Clase: ${p.class}
Descripción técnica: ${p.description || "Sin descripción"}

Este artículo se utiliza comúnmente en reparaciones, mantenimiento y reemplazo
dentro de su categoría correspondiente.
`.trim();
}
