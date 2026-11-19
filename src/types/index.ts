export type UserRole = 'owner' | 'admin' | 'manager' | 'designer' | 'production' | 'accounts' | 'staff';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  pincode?: string;
  city?: string;
  firstOrderDate?: string;
  totalOrders: number;
  totalBilled: number;
  totalPaid: number;
  outstandingBalance: number;
  notes?: string;
  createdAt: string;
}

export type PricingType = 'fixed' | 'sqft';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ProductMaterialOption {
  id: string;
  name: string;
  pricePerSqft?: number; // for sqft products
  additionalCharge?: number; // for fixed products
}

export interface ProductFinishingOption {
  id: string;
  name: string;
  charge: number;
  chargeType: 'fixed' | 'per_sqft' | 'per_unit';
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  pricingType: PricingType;
  basePrice: number; // For fixed: price per unit. For sqft: default rate per sq.ft.
  minQuantity: number;
  minBillableArea?: number; // in sq.ft., e.g. 5 sq.ft.
  images: string[];
  materials: ProductMaterialOption[];
  finishingOptions?: ProductFinishingOption[];
  sizes?: string[]; // for apparel e.g. ['S', 'M', 'L', 'XL', 'XXL']
  colors?: string[]; // for apparel/gifts
  isBestSeller?: boolean;
  isPopular?: boolean;
  isActive: boolean;
  turnaroundTime?: string;
}

export type OrderSource = 'online' | 'walk_in';

export type OrderStatus =
  | 'Order Received'
  | 'Design Pending'
  | 'Design Approved'
  | 'Work in Progress'
  | 'Printing Completed'
  | 'Ready for Collection'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export type PaymentStatus = 'Unpaid' | 'Partially Paid' | 'Paid';

export type ProductionMethod = 'in_house' | 'vendor_outsourced' | 'hybrid';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  pricingType: PricingType;
  quantity: number;
  // Fixed pricing details
  unitPrice?: number;
  selectedSize?: string;
  selectedColor?: string;
  // Sqft pricing details
  width?: number;
  height?: number;
  unit?: 'feet' | 'inches';
  areaSqft?: number;
  ratePerSqft?: number;
  // Common customization
  material?: string;
  finishing?: string[];
  finishingCost?: number;
  customText?: string;
  artworkUrl?: string;
  artworkFileName?: string;
  specialInstructions?: string;
  totalPrice: number;
}

export interface Order {
  id: string;
  jobNumber: string; // e.g. JOB-2026-0001
  source: OrderSource;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerWhatsapp?: string;
  customerEmail?: string;
  deliveryMethod: 'shop_collection' | 'home_delivery';
  deliveryAddress?: string;
  deliveryPincode?: string;
  items: OrderItem[];
  subtotal: number;
  designCharges: number;
  additionalCharges: number;
  discount: number;
  deliveryCharges: number;
  grandTotal: number;
  advancePaid: number;
  balanceDue: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  productionMethod: ProductionMethod;
  expectedCompletionDate?: string;
  internalNotes?: string;
  customerNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProductionTaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';

export interface ProductionTask {
  id: string;
  orderId: string;
  jobNumber: string;
  taskName: string; // e.g. 'Graphic Design', 'Flex Printing', 'Framing', 'Lamination'
  type: 'in_house' | 'outsourced';
  assignedStaffId?: string;
  assignedStaffName?: string;
  vendorId?: string;
  vendorName?: string;
  vendorWorkOrderId?: string;
  materialCost: number;
  labourCost: number;
  vendorCost: number;
  status: ProductionTaskStatus;
  notes?: string;
  completedAt?: string;
}

export interface Vendor {
  id: string;
  name: string;
  businessName?: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  category: string; // e.g., 'Offset Printing', 'Acrylic Fabrication', 'Apparel Screenprint'
  servicesProvided: string[];
  totalWorkAssigned: number;
  totalPaid: number;
  outstandingBalance: number;
  createdAt: string;
}

export interface VendorWorkOrder {
  id: string;
  workOrderNumber: string; // e.g. VWO-2026-0001
  vendorId: string;
  vendorName: string;
  vendorPhone: string;
  jobNumber: string;
  taskDescription: string;
  specifications: string;
  quantity: number;
  dimensions?: string;
  agreedPrice: number;
  advancePaid: number;
  balanceDue: number;
  status: 'Pending' | 'Assigned' | 'In Progress' | 'Completed' | 'Rejected' | 'Cancelled';
  expectedDeliveryDate?: string;
  artworkUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface Material {
  id: string;
  name: string;
  sku: string;
  category: string; // e.g. 'Flex Rolls', 'Vinyl Rolls', 'Mug Blanks', 'T-Shirts', 'Inks'
  unit: string; // 'roll', 'sheet', 'piece', 'liter'
  purchasePrice: number;
  usageCostPerUnit: number;
  stockQuantity: number;
  minStockAlert: number;
  vendorId?: string;
  vendorName?: string;
  lastPurchaseDate?: string;
}

export interface MaterialConsumption {
  id: string;
  orderId: string;
  jobNumber: string;
  materialId: string;
  materialName: string;
  quantityUsed: number;
  unit: string;
  totalCost: number;
  recordedAt: string;
}

export interface Labour {
  id: string;
  name: string;
  phone: string;
  workType: string; // 'Designer', 'Printer Operator', 'Finishing & Fabrication', 'Installer'
  paymentType: 'fixed_salary' | 'per_job' | 'per_unit';
  defaultRate: number;
  totalEarnings: number;
  totalPaid: number;
  pendingAmount: number;
  isActive: boolean;
}

export interface LabourTransaction {
  id: string;
  labourId: string;
  labourName: string;
  orderId?: string;
  jobNumber?: string;
  description: string;
  amount: number;
  isPaid: boolean;
  date: string;
  paymentMethod?: string;
}

export type AttendanceStatus = 'full_day' | 'half_day' | 'absent' | 'holiday';

export interface AttendanceRecord {
  id: string;
  labourId: string;
  labourName: string;
  employmentType: 'permanent' | 'temporary'; // permanent = fixed salary, temporary = according to work
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  workNotes?: string;
  wageCalculated: number;
  createdAt: string;
}

export interface MonthlySalaryPayment {
  id: string; // sal-${labourId}-${month}
  labourId: string;
  labourName: string;
  month: string; // YYYY-MM
  status: 'Paid' | 'Not Paid' | 'Pending';
  amount: number;
  paymentMethod?: string;
  paidAt?: string;
  notes?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. INV-2026-0001
  orderId?: string;
  jobNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  date: string;
  dueDate?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  deliveryCharges: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: PaymentStatus;
  status: 'Draft' | 'Issued' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled';
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  invoiceId?: string;
  orderId?: string;
  jobNumber: string;
  customerId?: string;
  amount: number;
  paymentMethod: 'Cash' | 'Offline UPI' | 'Bank Transfer' | 'Cheque';
  transactionReference?: string;
  notes?: string;
  date: string;
  receivedBy?: string;
}

export type ExpenseCategory =
  | 'Material Purchase'
  | 'Vendor Payment'
  | 'Labour Charges'
  | 'Transportation'
  | 'Delivery'
  | 'Electricity'
  | 'Maintenance'
  | 'Rent'
  | 'Equipment'
  | 'Other Expenses';

export interface Expense {
  id: string;
  date: string;
  jobNumber?: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paymentStatus: 'Paid' | 'Unpaid' | 'Pending';
  paymentMethod: 'Cash' | 'Offline UPI' | 'Bank Transfer';
  vendorId?: string;
  vendorName?: string;
  labourId?: string;
  labourName?: string;
  materialId?: string;
  vendorWorkOrderId?: string;
  notes?: string;
  receiptUrl?: string;
  createdAt: string;
}

export interface Enquiry {
  id: string;
  name: string;
  phone: string;
  email?: string;
  productOrService: string;
  message: string;
  attachmentUrl?: string;
  status: 'New' | 'Contacted' | 'Quotation Sent' | 'Converted' | 'Not Interested' | 'Closed';
  internalNotes?: string;
  assignedStaff?: string;
  convertedJobNumber?: string;
  createdAt: string;
}

export interface DesignRevision {
  id: string;
  orderId: string;
  jobNumber: string;
  version: number;
  previewUrl: string;
  notes?: string;
  status: 'Design Pending' | 'Preview Uploaded' | 'Awaiting Approval' | 'Approved' | 'Revision Requested';
  customerFeedback?: string;
  uploadedAt: string;
  reviewedAt?: string;
}

export interface BusinessSettings {
  businessName: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  pincode: string;
  gstNumber?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
  defaultDeliveryCharge?: number;
  freeDeliveryThreshold?: number;
  whatsappTemplates: {
    orderConfirmation: string;
    readyForCollection: string;
    designReview: string;
    paymentReceipt: string;
  };
}
