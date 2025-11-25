// controllers/sales/SalesRead.js
import Sale from "../../models/SaleModel.js";

export const getSales = async (req, res) => {
  try {
    const {
      cliente,
      articulo,
      provincia,
      fechaInicio,
      fechaFin,
      page = 1,
      limit = 50
    } = req.query;

    const query = {};

    if (cliente) query.Cliente = cliente;
    if (articulo) query.Articulo = articulo;
    if (provincia) query["Nombre Provincia"] = provincia;

    if (fechaInicio || fechaFin) {
      query.Fecha = {};
      if (fechaInicio) query.Fecha.$gte = new Date(fechaInicio);
      if (fechaFin) query.Fecha.$lte = new Date(fechaFin);
    }

    const skip = (page - 1) * limit;

    const sales = await Sale.find(query)
      .skip(skip)
      .limit(Number(limit))
      .sort({ Fecha: -1 });

    const count = await Sale.countDocuments(query);

    res.json({
      total: count,
      page: Number(page),
      pages: Math.ceil(count / limit),
      data: sales
    });

  } catch (error) {
    res.status(500).json({ error: "Error obteniendo ventas", details: error.message });
  }
};

export const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ error: "Venta no encontrada" });

    res.json(sale);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo venta", details: error.message });
  }
};
