// src/controllers/sales/SalesStats.js

import Sales from "../../models/SaleModel.js";

// -----------------------------------------------------------------------------
// Total de ventas
// -----------------------------------------------------------------------------
export const totalSales = async (req, res) => {
  try {
    const total = await Sales.countDocuments();
    res.json({ total });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener total de ventas" });
  }
};

// -----------------------------------------------------------------------------
// Ticket promedio (avg ticket)
// -----------------------------------------------------------------------------
export const avgTicket = async (req, res) => {
  try {
    const result = await Sales.aggregate([
      {
        $group: {
          _id: null,
          avgAmount: { $avg: "$MontoTotal" },
        },
      },
    ]);

    const avg = result[0]?.avgAmount || 0;

    res.json({ avgTicket: avg });
  } catch (error) {
    res.status(500).json({ error: "Error al calcular ticket promedio" });
  }
};

// -----------------------------------------------------------------------------
// Total facturado (sumatoria de montos)
// -----------------------------------------------------------------------------
export const totalRevenue = async (req, res) => {
  try {
    const result = await Sales.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$MontoTotal" },
        },
      },
    ]);

    const total = result[0]?.total || 0;

    res.json({ totalRevenue: total });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener total facturado" });
  }
};

// -----------------------------------------------------------------------------
// Top productos más vendidos
// -----------------------------------------------------------------------------
export const topProducts = async (req, res) => {
  try {
    const result = await Sales.aggregate([
      {
        $group: {
          _id: "$Articulo",
          totalSold: { $sum: "$Cantidad" },
          revenue: { $sum: "$MontoTotal" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
    ]);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener productos más vendidos" });
  }
};

// -----------------------------------------------------------------------------
// Top clientes (por monto total)
// -----------------------------------------------------------------------------
export const topCustomers = async (req, res) => {
  try {
    const result = await Sales.aggregate([
      {
        $group: {
          _id: "$Cliente",
          totalSpent: { $sum: "$MontoTotal" },
          totalTickets: { $sum: 1 },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
    ]);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener mejores clientes" });
  }
};

// -----------------------------------------------------------------------------
// Ventas agrupadas por provincia
// (cambia "Provincia" por el campo real en tu modelo si es distinto)
// -----------------------------------------------------------------------------
export const salesByProvince = async (req, res) => {
  try {
    const result = await Sales.aggregate([
      {
        $group: {
          _id: "$Provincia",
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: "$MontoTotal" },
        },
      },
      { $sort: { totalSales: -1 } },
    ]);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener ventas por provincia" });
  }
};

// -----------------------------------------------------------------------------
// Ventas agrupadas por mes
// -----------------------------------------------------------------------------
export const salesByMonth = async (req, res) => {
  try {
    const result = await Sales.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$Fecha" },
            month: { $month: "$Fecha" },
          },
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: "$MontoTotal" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener ventas por mes" });
  }
};
