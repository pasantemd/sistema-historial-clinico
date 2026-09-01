export class InventarioError extends Error {}

export class MedicamentoInventarioNoEncontradoError extends InventarioError {
  constructor() {
    super("El medicamento de inventario no fue encontrado.");
  }
}

export class StockInsuficienteError extends InventarioError {
  constructor() {
    super("La cantidad solicitada supera el stock disponible.");
  }
}

export class MedicamentoInventarioInactivoError extends InventarioError {
  constructor() {
    super("El medicamento está inactivo.");
  }
}
