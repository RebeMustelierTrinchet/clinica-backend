// Inventario inicial (storage)
let items = [
  {
    id: 1,
    name: "Paracetamol 500mg",
    type: "medicamento",
    unit: "tableta",
    stock: 100,
    costPerUnit: 0.10
  },
  {
    id: 2,
    name: "Amoxicilina 500mg",
    type: "medicamento",
    unit: "tableta",
    stock: 50,
    costPerUnit: 0.50
  },
  {
    id: 3,
    name: "Jeringa 3ml",
    type: "insumo",
    unit: "unidad",
    stock: 200,
    costPerUnit: 0.12
  },
  {
    id: 4,
    name: "Guantes Desechables",
    type: "insumo",
    unit: "par",
    stock: 60,
    costPerUnit: 0.30
  },
  {
    id: 5,
    name: "Vacuna X",
    type: "vacuna",
    unit: "dosis",
    stock: 30,
    costPerUnit: 10.00
  }
];

module.exports = items;
