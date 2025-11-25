// controllers/sales/SalesAI.js
import Sale from "../../models/SaleModel.js";

export const getAIRecords = async (req, res) => {
  try {
    const sales = await Sale.find({}).limit(5000); // ajustar si tenés más

    const formatted = sales.map(s => ({
      id: s._id.toString(),
      text: `
        El día ${s.Fecha.toISOString().split("T")[0]},
        el cliente ${s.Nombre} (CUIT ${s.CUIT}),
        compró ${s.Cantidad} unidades del artículo ${s.NombreArticulo},
        código ${s.Articulo},
        por un total de $${s.Total},
        en ${s.Localidad}, ${s["Nombre Provincia"]}.
      `
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: "Error generando registros para IA" });
  }
};
