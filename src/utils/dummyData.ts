import { InventoryItem, Transaction } from '../types';

export const INITIAL_ITEMS: InventoryItem[] = [
  {
    id: "item_001",
    sku: "SKU-HWD-5120",
    name: "Premium Brass Bushing Fitting (3/4\")",
    category: "Hardware",
    quantity: 48,
    unit: "Pcs",
    unitPrice: 125000,
    minStock: 15,
    location: "Aisle-B2 / Bin-12",
    notes: "Heavy-duty corrosion-resistant brass threads for pipe transitions.",
    lastUpdated: "2026-05-27T10:30:00Z"
  },
  {
    id: "item_002",
    sku: "SKU-ELC-1088",
    name: "Heavy Duty Conduit PVC Pipe (3m)",
    category: "Electrical",
    quantity: 12,
    unit: "Pcs",
    unitPrice: 89000,
    minStock: 15,
    location: "Yard-Rear / Row-3",
    notes: "Outdoor listed Schedule 40 PVC piping for sub-panel linkage feed.",
    lastUpdated: "2026-05-27T11:15:00Z"
  },
  {
    id: "item_003",
    sku: "SKU-SAF-7798",
    name: "Reflective Safety Mesh Vest (XL-Lime)",
    category: "Safety Wear",
    quantity: 78,
    unit: "Pcs",
    unitPrice: 62000,
    minStock: 10,
    location: "Cabin-A / Drawer-4",
    notes: "High-visibility fluorescent neon safety vests with reflective stripes.",
    lastUpdated: "2026-05-26T09:00:00Z"
  },
  {
    id: "item_004",
    sku: "SKU-TOOL-4482",
    name: "Industrial Steel Adjustable Wrench 12\"",
    category: "Tools & Equipment",
    quantity: 8,
    unit: "Pcs",
    unitPrice: 349900,
    minStock: 5,
    location: "Toolroom / Shelf-E",
    notes: "High torque alloy steel body with precision jaw adjustment dial.",
    lastUpdated: "2026-05-27T08:45:00Z"
  },
  {
    id: "item_005",
    sku: "SKU-STR-2210",
    name: "High-Strength Epoxy Adhesive Resin",
    category: "Chemicals & Adhesives",
    quantity: 2,
    unit: "Box",
    unitPrice: 421500,
    minStock: 5,
    location: "Hazmat-Cab / Item-8",
    notes: "Dual-part structural adhesive, quick-bond 5-minute set. Temperature sensitive.",
    lastUpdated: "2026-05-25T14:20:00Z"
  },
  {
    id: "item_006",
    sku: "SKU-STR-9912",
    name: "Stainless Steel Wood Screws #8 2\"",
    category: "Hardware",
    quantity: 350,
    unit: "Pcs",
    unitPrice: 1200,
    minStock: 100,
    location: "Aisle-B3 / Cabinet-F",
    notes: "Corrosion resistant flat head Phillips drive timber fasteners.",
    lastUpdated: "2026-05-27T12:00:00Z"
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: "tx_001",
    itemId: "item_001",
    sku: "SKU-HWD-5120",
    itemName: "Premium Brass Bushing Fitting (3/4\")",
    type: "IN",
    quantity: 48,
    timestamp: "2026-06-02T10:30:00Z",
    operator: "Alex Morgan",
    notes: "Incoming freight shipment #FR-4029. Verified count."
  },
  {
    id: "tx_002",
    itemId: "item_002",
    sku: "SKU-ELC-1088",
    itemName: "Heavy Duty Conduit PVC Pipe (3m)",
    type: "IN",
    quantity: 20,
    timestamp: "2026-06-03T08:00:00Z",
    operator: "Alex Morgan",
    notes: "Supplier delivery restock batch."
  },
  {
    id: "tx_003",
    itemId: "item_002",
    sku: "SKU-ELC-1088",
    itemName: "Heavy Duty Conduit PVC Pipe (3m)",
    type: "OUT",
    quantity: 8,
    timestamp: "2026-05-27T11:15:00Z",
    operator: "Michael J.",
    notes: "Dispatched to Site-B electrical crew for sub-feed installation."
  },
  {
    id: "tx_004",
    itemId: "item_005",
    sku: "SKU-STR-2210",
    itemName: "High-Strength Epoxy Adhesive Resin",
    type: "OUT",
    quantity: 3,
    timestamp: "2026-05-25T14:20:00Z",
    operator: "Sarah Jenkins",
    notes: "Dispatched to concrete repair division."
  },
  {
    id: "tx_005",
    itemId: "item_003",
    sku: "SKU-SAF-7798",
    itemName: "Reflective Safety Mesh Vest (XL-Lime)",
    type: "IN",
    quantity: 50,
    timestamp: "2026-05-26T09:00:00Z",
    operator: "Alex Morgan",
    notes: "Safety stock expansion order."
  }
];
