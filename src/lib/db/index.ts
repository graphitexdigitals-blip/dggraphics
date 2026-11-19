import fs from 'fs';
import path from 'path';
import {
  Category,
  Product,
  Customer,
  Order,
  ProductionTask,
  Vendor,
  VendorWorkOrder,
  Material,
  MaterialConsumption,
  Labour,
  LabourTransaction,
  Invoice,
  PaymentRecord,
  Expense,
  Enquiry,
  DesignRevision,
  BusinessSettings,
  User,
  AttendanceRecord,
  MonthlySalaryPayment,
} from '../../types';
import {
  initialCategories,
  initialProducts,
  initialCustomers,
  initialVendors,
  initialMaterials,
  initialLabour,
  initialOrders,
  initialProductionTasks,
  initialVendorWorkOrders,
  initialInvoices,
  initialPayments,
  initialExpenses,
  initialEnquiries,
  initialDesignRevisions,
  initialBusinessSettings,
  initialUsers,
} from './initialData';

export interface DatabaseSchema {
  categories: Category[];
  products: Product[];
  customers: Customer[];
  orders: Order[];
  productionTasks: ProductionTask[];
  vendors: Vendor[];
  vendorWorkOrders: VendorWorkOrder[];
  materials: Material[];
  materialConsumptions: MaterialConsumption[];
  labour: Labour[];
  labourTransactions: LabourTransaction[];
  invoices: Invoice[];
  payments: PaymentRecord[];
  expenses: Expense[];
  enquiries: Enquiry[];
  designRevisions: DesignRevision[];
  settings: BusinessSettings;
  users: User[];
  attendances?: AttendanceRecord[];
  salaryPayments?: MonthlySalaryPayment[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

function ensureDatabase(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_PATH)) {
    const initialDb: DatabaseSchema = {
      categories: initialCategories,
      products: initialProducts,
      customers: initialCustomers,
      orders: initialOrders,
      productionTasks: initialProductionTasks,
      vendors: initialVendors,
      vendorWorkOrders: initialVendorWorkOrders,
      materials: initialMaterials,
      materialConsumptions: [],
      labour: initialLabour,
      labourTransactions: [],
      invoices: initialInvoices,
      payments: initialPayments,
      expenses: initialExpenses,
      enquiries: initialEnquiries,
      designRevisions: initialDesignRevisions,
      settings: initialBusinessSettings,
      users: initialUsers,
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialDb, null, 2), 'utf-8');
    return initialDb;
  }

  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as DatabaseSchema;
    if (!parsed.attendances) {
      parsed.attendances = [];
    }
    if (!parsed.salaryPayments) {
      parsed.salaryPayments = [];
    }
    return parsed;
  } catch (err) {
    console.error('Error reading db.json, repairing...', err);
    const fallback: DatabaseSchema = {
      categories: initialCategories,
      products: initialProducts,
      customers: initialCustomers,
      orders: initialOrders,
      productionTasks: initialProductionTasks,
      vendors: initialVendors,
      vendorWorkOrders: initialVendorWorkOrders,
      materials: initialMaterials,
      materialConsumptions: [],
      labour: initialLabour,
      labourTransactions: [],
      invoices: initialInvoices,
      payments: initialPayments,
      expenses: initialExpenses,
      enquiries: initialEnquiries,
      designRevisions: initialDesignRevisions,
      settings: initialBusinessSettings,
      users: initialUsers,
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(fallback, null, 2), 'utf-8');
    return fallback;
  }
}

function saveDatabase(data: DatabaseSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tempPath = path.join(DATA_DIR, `db.tmp.${Date.now()}`);
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempPath, DB_PATH);
}

// ----------------------------------------------------
// DB HELPER METHODS
// ----------------------------------------------------

export const db = {
  // CATEGORIES
  getCategories(): Category[] {
    const data = ensureDatabase();
    return data.categories.sort((a, b) => a.sortOrder - b.sortOrder);
  },
  getCategoryBySlug(slug: string): Category | undefined {
    const data = ensureDatabase();
    return data.categories.find((c) => c.slug === slug);
  },
  saveCategory(category: Category): Category {
    const data = ensureDatabase();
    const idx = data.categories.findIndex((c) => c.id === category.id);
    if (idx >= 0) {
      data.categories[idx] = category;
    } else {
      data.categories.push(category);
    }
    saveDatabase(data);
    return category;
  },

  // PRODUCTS
  getProducts(filter?: { categorySlug?: string; activeOnly?: boolean; search?: string }): Product[] {
    const data = ensureDatabase();
    let result = data.products;

    if (filter?.activeOnly) {
      result = result.filter((p) => p.isActive);
    }
    if (filter?.categorySlug) {
      const cat = data.categories.find((c) => c.slug === filter.categorySlug);
      if (cat) {
        result = result.filter((p) => p.categoryId === cat.id);
      }
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.shortDescription?.toLowerCase().includes(q)
      );
    }
    return result;
  },
  getProductById(id: string): Product | undefined {
    const data = ensureDatabase();
    return data.products.find((p) => p.id === id);
  },
  getProductBySlug(slug: string): Product | undefined {
    const data = ensureDatabase();
    return data.products.find((p) => p.slug === slug);
  },
  saveProduct(product: Product): Product {
    const data = ensureDatabase();
    const idx = data.products.findIndex((p) => p.id === product.id);
    if (idx >= 0) {
      data.products[idx] = product;
    } else {
      data.products.push(product);
    }
    saveDatabase(data);
    return product;
  },
  deleteProduct(id: string): boolean {
    const data = ensureDatabase();
    const lenBefore = data.products.length;
    data.products = data.products.filter((p) => p.id !== id);
    if (data.products.length !== lenBefore) {
      saveDatabase(data);
      return true;
    }
    return false;
  },

  // CUSTOMERS
  getCustomers(): Customer[] {
    const data = ensureDatabase();
    return data.customers.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  getCustomerById(id: string): Customer | undefined {
    const data = ensureDatabase();
    return data.customers.find((c) => c.id === id);
  },
  findCustomerByPhone(phone: string): Customer | undefined {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const data = ensureDatabase();
    return data.customers.find((c) => c.phone.replace(/[^0-9]/g, '') === cleanPhone);
  },
  saveCustomer(customer: Customer): Customer {
    const data = ensureDatabase();
    const idx = data.customers.findIndex((c) => c.id === customer.id);
    if (idx >= 0) {
      data.customers[idx] = customer;
    } else {
      data.customers.push(customer);
    }
    saveDatabase(data);
    return customer;
  },

  // ORDERS & JOB NUMBERS
  getNextJobNumber(): string {
    const data = ensureDatabase();
    const currentYear = new Date().getFullYear();
    const prefix = `JOB-${currentYear}-`;
    const matching = data.orders
      .filter((o) => o.jobNumber.startsWith(prefix))
      .map((o) => {
        const numPart = parseInt(o.jobNumber.replace(prefix, ''), 10);
        return isNaN(numPart) ? 0 : numPart;
      });
    const maxNum = matching.length > 0 ? Math.max(...matching) : 0;
    return `${prefix}${String(maxNum + 1).padStart(4, '0')}`;
  },

  getOrders(filter?: { status?: string; search?: string; customerPhone?: string }): Order[] {
    const data = ensureDatabase();
    let result = data.orders;

    if (filter?.status) {
      result = result.filter((o) => o.orderStatus === filter.status);
    }
    if (filter?.customerPhone) {
      const cleanPhone = filter.customerPhone.replace(/[^0-9]/g, '');
      result = result.filter((o) => o.customerPhone.replace(/[^0-9]/g, '') === cleanPhone);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (o) =>
          o.jobNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone.includes(q) ||
          o.items.some((i) => i.productName.toLowerCase().includes(q))
      );
    }
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  getOrderById(id: string): Order | undefined {
    const data = ensureDatabase();
    return data.orders.find((o) => o.id === id);
  },

  getOrderByJobNumber(jobNumber: string): Order | undefined {
    const data = ensureDatabase();
    const clean = jobNumber.trim().toUpperCase();
    return data.orders.find((o) => o.jobNumber.toUpperCase() === clean);
  },

  createOrder(orderData: Omit<Order, 'id' | 'jobNumber' | 'createdAt' | 'updatedAt'> & { id?: string; jobNumber?: string }): Order {
    const data = ensureDatabase();
    const now = new Date().toISOString();
    const jobNumber = orderData.jobNumber || this.getNextJobNumber();
    const orderId = orderData.id || `ord-${Date.now()}`;

    // 1. Resolve or Create/Update Customer
    let customer = this.findCustomerByPhone(orderData.customerPhone);
    if (!customer) {
      customer = {
        id: `cust-${Date.now()}`,
        name: orderData.customerName,
        phone: orderData.customerPhone,
        whatsapp: orderData.customerWhatsapp || orderData.customerPhone,
        email: orderData.customerEmail,
        address: orderData.deliveryAddress,
        pincode: orderData.deliveryPincode,
        firstOrderDate: now,
        totalOrders: 1,
        totalBilled: orderData.grandTotal,
        totalPaid: orderData.advancePaid,
        outstandingBalance: orderData.balanceDue,
        createdAt: now,
      };
      data.customers.push(customer);
    } else {
      customer.totalOrders += 1;
      customer.totalBilled += orderData.grandTotal;
      customer.totalPaid += orderData.advancePaid;
      customer.outstandingBalance += orderData.balanceDue;
      if (orderData.deliveryAddress && !customer.address) {
        customer.address = orderData.deliveryAddress;
      }
    }

    const newOrder: Order = {
      ...orderData,
      id: orderId,
      jobNumber,
      customerId: customer.id,
      createdAt: now,
      updatedAt: now,
    };

    data.orders.push(newOrder);

    // 2. Automatically create Invoice for this order
    const invoiceNum = this.getNextInvoiceNumber();
    const invoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invoiceNum,
      orderId: newOrder.id,
      jobNumber: newOrder.jobNumber,
      customerId: customer.id,
      customerName: newOrder.customerName,
      customerPhone: newOrder.customerPhone,
      customerAddress: newOrder.deliveryAddress,
      date: now.split('T')[0],
      items: newOrder.items.map((it) => {
        const specList: string[] = [];
        if (it.material) specList.push(it.material);
        if (it.specialInstructions) specList.push(it.specialInstructions);
        if (it.width && it.height) specList.push(`${it.width}x${it.height} ${it.unit || 'ft'}`);
        if (it.selectedSize) specList.push(`Size: ${it.selectedSize}`);
        if (it.selectedColor) specList.push(`Color: ${it.selectedColor}`);
        if (it.customText) specList.push(`"${it.customText}"`);
        const specStr = specList.length > 0 ? ` (${specList.join(', ')})` : '';
        return {
          description: `${it.productName}${specStr}`,
          quantity: it.quantity || 1,
          unitPrice: it.unitPrice || (it.areaSqft && it.ratePerSqft ? it.areaSqft * it.ratePerSqft : it.totalPrice / (it.quantity || 1)),
          total: it.totalPrice,
        };
      }),
      subtotal: newOrder.subtotal,
      discount: newOrder.discount,
      tax: 0,
      deliveryCharges: newOrder.deliveryCharges,
      grandTotal: newOrder.grandTotal,
      amountPaid: newOrder.advancePaid,
      balanceDue: newOrder.balanceDue,
      paymentStatus: newOrder.paymentStatus,
      status: newOrder.balanceDue === 0 ? 'Paid' : newOrder.advancePaid > 0 ? 'Partially Paid' : 'Issued',
      createdAt: now,
    };
    data.invoices.push(invoice);

    // 3. Record advance payment if paid
    if (newOrder.advancePaid > 0) {
      const payment: PaymentRecord = {
        id: `pay-${Date.now()}`,
        invoiceId: invoice.id,
        orderId: newOrder.id,
        jobNumber: newOrder.jobNumber,
        customerId: customer.id,
        amount: newOrder.advancePaid,
        paymentMethod: 'Cash',
        notes: 'Advance booking payment',
        date: now.split('T')[0],
        receivedBy: 'System / Counter',
      };
      data.payments.push(payment);
    }

    // 4. Create initial production task(s)
    newOrder.items.forEach((item, index) => {
      const task: ProductionTask = {
        id: `pt-${Date.now()}-${index}`,
        orderId: newOrder.id,
        jobNumber: newOrder.jobNumber,
        taskName: `${item.productName} Production`,
        type: newOrder.productionMethod === 'vendor_outsourced' ? 'outsourced' : 'in_house',
        materialCost: 0,
        labourCost: 0,
        vendorCost: 0,
        status: 'Pending',
        notes: item.specialInstructions || 'Produce according to dimensions/artwork.',
      };
      data.productionTasks.push(task);
    });

    saveDatabase(data);
    return newOrder;
  },

  updateOrder(id: string, updates: Partial<Order>): Order | undefined {
    const data = ensureDatabase();
    const idx = data.orders.findIndex((o) => o.id === id);
    if (idx === 0 || idx > 0) {
      const current = data.orders[idx];
      const updated: Order = {
        ...current,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      data.orders[idx] = updated;

      // Sync corresponding invoice if exists
      const invIdx = data.invoices.findIndex((inv) => inv.orderId === id || inv.jobNumber === current.jobNumber);
      if (invIdx >= 0) {
        data.invoices[invIdx].paymentStatus = updated.paymentStatus;
        data.invoices[invIdx].amountPaid = updated.advancePaid;
        data.invoices[invIdx].balanceDue = updated.balanceDue;
        if (updated.balanceDue === 0) {
          data.invoices[invIdx].status = 'Paid';
        }
      }

      saveDatabase(data);
      return updated;
    }
    return undefined;
  },

  // PRODUCTION TASKS
  getProductionTasks(filter?: { jobNumber?: string; type?: string; status?: string }): ProductionTask[] {
    const data = ensureDatabase();
    let result = data.productionTasks;
    if (filter?.jobNumber) {
      result = result.filter((t) => t.jobNumber.toUpperCase() === filter.jobNumber!.toUpperCase());
    }
    if (filter?.type) {
      result = result.filter((t) => t.type === filter.type);
    }
    if (filter?.status) {
      result = result.filter((t) => t.status === filter.status);
    }
    return result;
  },

  saveProductionTask(task: ProductionTask): ProductionTask {
    const data = ensureDatabase();
    const idx = data.productionTasks.findIndex((t) => t.id === task.id);
    if (idx >= 0) {
      data.productionTasks[idx] = task;
    } else {
      data.productionTasks.push(task);
    }
    saveDatabase(data);
    return task;
  },

  deleteProductionTask(id: string): boolean {
    const data = ensureDatabase();
    const lenBefore = data.productionTasks.length;
    data.productionTasks = data.productionTasks.filter((t) => t.id !== id);
    if (data.productionTasks.length !== lenBefore) {
      saveDatabase(data);
      return true;
    }
    return false;
  },

  // VENDORS
  getVendors(): Vendor[] {
    const data = ensureDatabase();
    return data.vendors;
  },
  getVendorById(id: string): Vendor | undefined {
    const data = ensureDatabase();
    return data.vendors.find((v) => v.id === id);
  },
  saveVendor(vendor: Vendor): Vendor {
    const data = ensureDatabase();
    const idx = data.vendors.findIndex((v) => v.id === vendor.id);
    if (idx >= 0) {
      data.vendors[idx] = vendor;
    } else {
      data.vendors.push(vendor);
    }
    saveDatabase(data);
    return vendor;
  },

  // VENDOR WORK ORDERS
  getNextVendorWorkOrderNumber(): string {
    const data = ensureDatabase();
    const currentYear = new Date().getFullYear();
    const prefix = `VWO-${currentYear}-`;
    const matching = data.vendorWorkOrders
      .filter((w) => w.workOrderNumber.startsWith(prefix))
      .map((w) => {
        const numPart = parseInt(w.workOrderNumber.replace(prefix, ''), 10);
        return isNaN(numPart) ? 0 : numPart;
      });
    const maxNum = matching.length > 0 ? Math.max(...matching) : 0;
    return `${prefix}${String(maxNum + 1).padStart(4, '0')}`;
  },

  getVendorWorkOrders(filter?: { vendorId?: string; jobNumber?: string }): VendorWorkOrder[] {
    const data = ensureDatabase();
    let result = data.vendorWorkOrders;
    if (filter?.vendorId) {
      result = result.filter((w) => w.vendorId === filter.vendorId);
    }
    if (filter?.jobNumber) {
      result = result.filter((w) => w.jobNumber.toUpperCase() === filter.jobNumber!.toUpperCase());
    }
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  saveVendorWorkOrder(workOrder: VendorWorkOrder): VendorWorkOrder {
    const data = ensureDatabase();
    const idx = data.vendorWorkOrders.findIndex((w) => w.id === workOrder.id);
    const vendorIdx = data.vendors.findIndex((v) => v.id === workOrder.vendorId);

    if (idx >= 0) {
      data.vendorWorkOrders[idx] = workOrder;
    } else {
      data.vendorWorkOrders.push(workOrder);
      // Update vendor stats
      if (vendorIdx >= 0) {
        data.vendors[vendorIdx].totalWorkAssigned += workOrder.agreedPrice;
        data.vendors[vendorIdx].totalPaid += workOrder.advancePaid;
        data.vendors[vendorIdx].outstandingBalance += workOrder.balanceDue;
      }
    }
    saveDatabase(data);
    return workOrder;
  },

  // MATERIALS & INVENTORY
  getMaterials(): Material[] {
    const data = ensureDatabase();
    return data.materials;
  },
  saveMaterial(material: Material): Material {
    const data = ensureDatabase();
    const idx = data.materials.findIndex((m) => m.id === material.id);
    if (idx >= 0) {
      data.materials[idx] = material;
    } else {
      data.materials.push(material);
    }
    saveDatabase(data);
    return material;
  },
  recordMaterialConsumption(consumption: MaterialConsumption): MaterialConsumption {
    const data = ensureDatabase();
    data.materialConsumptions.push(consumption);
    // Reduce stock
    const matIdx = data.materials.findIndex((m) => m.id === consumption.materialId);
    if (matIdx >= 0) {
      data.materials[matIdx].stockQuantity = Math.max(0, data.materials[matIdx].stockQuantity - consumption.quantityUsed);
    }
    saveDatabase(data);
    return consumption;
  },

  // LABOUR
  getLabour(): Labour[] {
    const data = ensureDatabase();
    return data.labour;
  },
  saveLabour(labour: Labour): Labour {
    const data = ensureDatabase();
    const idx = data.labour.findIndex((l) => l.id === labour.id);
    if (idx >= 0) {
      data.labour[idx] = {
        ...data.labour[idx],
        ...labour,
      };
      labour = data.labour[idx];
    } else {
      data.labour.push(labour);
    }
    saveDatabase(data);
    return labour;
  },
  recordLabourTransaction(tx: LabourTransaction): LabourTransaction {
    const data = ensureDatabase();
    data.labourTransactions.push(tx);
    const labIdx = data.labour.findIndex((l) => l.id === tx.labourId);
    if (labIdx >= 0) {
      data.labour[labIdx].totalEarnings += tx.amount;
      if (tx.isPaid) {
        data.labour[labIdx].totalPaid += tx.amount;
      } else {
        data.labour[labIdx].pendingAmount += tx.amount;
      }
    }
    saveDatabase(data);
    return tx;
  },

  // EMPLOYEE ATTENDANCE & PAYROLL
  getAttendance(filters?: { date?: string; month?: string; labourId?: string }): AttendanceRecord[] {
    const data = ensureDatabase();
    let records = data.attendances || [];
    if (filters?.date) {
      const d = filters.date;
      records = records.filter((a) => a.date === d);
    }
    if (filters?.month) {
      const m = filters.month;
      records = records.filter((a) => a.date.startsWith(m));
    }
    if (filters?.labourId) {
      const lId = filters.labourId;
      records = records.filter((a) => a.labourId === lId);
    }
    return records;
  },

  markAttendance(record: AttendanceRecord): AttendanceRecord {
    const data = ensureDatabase();
    if (!data.attendances) data.attendances = [];
    const idx = data.attendances.findIndex(
      (a) => a.labourId === record.labourId && a.date === record.date
    );
    if (idx >= 0) {
      data.attendances[idx] = record;
    } else {
      data.attendances.push(record);
    }
    saveDatabase(data);
    return record;
  },

  batchMarkAttendance(records: AttendanceRecord[]): AttendanceRecord[] {
    const data = ensureDatabase();
    if (!data.attendances) data.attendances = [];
    records.forEach((rec) => {
      const idx = data.attendances!.findIndex(
        (a) => a.labourId === rec.labourId && a.date === rec.date
      );
      if (idx >= 0) {
        data.attendances![idx] = rec;
      } else {
        data.attendances!.push(rec);
      }
    });
    saveDatabase(data);
    return records;
  },

  getSalaryPayments(month?: string): MonthlySalaryPayment[] {
    const data = ensureDatabase();
    let records = data.salaryPayments || [];
    if (month) {
      records = records.filter((p) => p.month === month);
    }
    return records;
  },

  saveSalaryPayment(payment: MonthlySalaryPayment): MonthlySalaryPayment {
    const data = ensureDatabase();
    if (!data.salaryPayments) data.salaryPayments = [];
    const idx = data.salaryPayments.findIndex(
      (p) => p.labourId === payment.labourId && p.month === payment.month
    );
    if (idx >= 0) {
      data.salaryPayments[idx] = payment;
    } else {
      data.salaryPayments.push(payment);
    }

    // If marked Paid, ensure expense is logged in Labour Charges
    const expId = `exp-sal-${payment.labourId}-${payment.month}`;
    const expIdx = data.expenses.findIndex((e) => e.id === expId);
    if (payment.status === 'Paid') {
      const expEntry: Expense = {
        id: expId,
        date: new Date().toISOString().split('T')[0],
        category: 'Labour Charges',
        description: `Wages / Salary paid to ${payment.labourName} for ${payment.month}`,
        amount: payment.amount,
        paymentStatus: 'Paid',
        paymentMethod: (payment.paymentMethod as any) || 'Cash',
        labourId: payment.labourId,
        labourName: payment.labourName,
        notes: `Marked Paid in Attendance & Wage Register for ${payment.month}.`,
        createdAt: new Date().toISOString(),
      };
      if (expIdx >= 0) {
        data.expenses[expIdx] = expEntry;
      } else {
        data.expenses.push(expEntry);
      }
    } else {
      if (expIdx >= 0) {
        data.expenses.splice(expIdx, 1);
      }
    }

    saveDatabase(data);
    return payment;
  },

  // INVOICES & PAYMENTS
  getNextInvoiceNumber(): string {
    const data = ensureDatabase();
    const currentYear = new Date().getFullYear();
    const prefix = `INV-${currentYear}-`;
    const matching = data.invoices
      .filter((i) => i.invoiceNumber.startsWith(prefix))
      .map((i) => {
        const numPart = parseInt(i.invoiceNumber.replace(prefix, ''), 10);
        return isNaN(numPart) ? 0 : numPart;
      });
    const maxNum = matching.length > 0 ? Math.max(...matching) : 0;
    return `${prefix}${String(maxNum + 1).padStart(4, '0')}`;
  },

  getInvoices(filter?: { jobNumber?: string; customerPhone?: string }): Invoice[] {
    const data = ensureDatabase();
    let result = data.invoices;
    if (filter?.jobNumber) {
      result = result.filter((i) => i.jobNumber.toUpperCase() === filter.jobNumber!.toUpperCase());
    }
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  getInvoiceById(id: string): Invoice | undefined {
    const data = ensureDatabase();
    return data.invoices.find((i) => i.id === id || i.invoiceNumber === id);
  },

  saveInvoice(invoice: Invoice): Invoice {
    const data = ensureDatabase();
    const idx = data.invoices.findIndex((i) => i.id === invoice.id);
    if (idx >= 0) {
      data.invoices[idx] = invoice;
    } else {
      data.invoices.push(invoice);
    }
    saveDatabase(data);
    return invoice;
  },

  updateInvoice(id: string, updates: any): Invoice | undefined {
    const data = ensureDatabase();
    const idx = data.invoices.findIndex((i) => i.id === id || i.invoiceNumber === id);
    if (idx < 0) return undefined;

    const currentInv = data.invoices[idx];

    // Calculate new financial amounts
    const subtotal = updates.subtotal !== undefined ? Number(updates.subtotal) : currentInv.subtotal;
    const discount = updates.discount !== undefined ? Number(updates.discount) : currentInv.discount;
    const deliveryCharges = updates.deliveryCharges !== undefined ? Number(updates.deliveryCharges) : currentInv.deliveryCharges;
    const grandTotal = updates.grandTotal !== undefined ? Number(updates.grandTotal) : currentInv.grandTotal;
    const amountPaid = updates.amountPaid !== undefined ? Number(updates.amountPaid) : currentInv.amountPaid;
    const balanceDue = Math.max(0, grandTotal - amountPaid);
    const paymentStatus = balanceDue === 0 ? 'Paid' : amountPaid > 0 ? 'Partially Paid' : 'Unpaid';

    const updatedInv: Invoice = {
      ...currentInv,
      ...updates,
      subtotal,
      discount,
      deliveryCharges,
      grandTotal,
      amountPaid,
      balanceDue,
      paymentStatus,
      status: balanceDue === 0 ? 'Paid' : amountPaid > 0 ? 'Partially Paid' : currentInv.status,
    };

    data.invoices[idx] = updatedInv;

    // 1. Sync corresponding Order if exists
    const orderIdx = data.orders.findIndex(
      (o) => (updatedInv.orderId && o.id === updatedInv.orderId) || o.jobNumber.toUpperCase() === updatedInv.jobNumber.toUpperCase()
    );

    if (orderIdx >= 0) {
      const ord = data.orders[orderIdx];
      if (updatedInv.customerName) ord.customerName = updatedInv.customerName;
      if (updatedInv.customerPhone) {
        ord.customerPhone = updatedInv.customerPhone;
        ord.customerWhatsapp = updatedInv.customerPhone;
      }
      if (updatedInv.customerAddress !== undefined) {
        ord.deliveryAddress = updatedInv.customerAddress;
      }
      ord.subtotal = updatedInv.subtotal;
      ord.discount = updatedInv.discount;
      ord.deliveryCharges = updatedInv.deliveryCharges;
      if (updates.designCharges !== undefined) {
        ord.designCharges = Number(updates.designCharges);
      }
      ord.grandTotal = updatedInv.grandTotal;
      ord.advancePaid = updatedInv.amountPaid;
      ord.balanceDue = updatedInv.balanceDue;
      ord.paymentStatus = updatedInv.paymentStatus;

      // Update order items if product details provided
      if (updates.productTitle || updates.productQuantity || updates.material || updates.dimensions || updates.specialInstructions) {
        if (!ord.items || ord.items.length === 0) {
          ord.items = [{
            id: `item-${Date.now()}`,
            productId: 'prod-custom',
            productName: updates.productTitle || 'Custom Print Job',
            pricingType: 'fixed',
            quantity: Number(updates.productQuantity) || 1,
            material: updates.material,
            specialInstructions: updates.dimensions ? `Dimensions: ${updates.dimensions}` : updates.specialInstructions,
            totalPrice: updatedInv.subtotal,
          }];
        } else {
          if (updates.productTitle) ord.items[0].productName = updates.productTitle;
          if (updates.productQuantity) ord.items[0].quantity = Number(updates.productQuantity);
          if (updates.material !== undefined) ord.items[0].material = updates.material;
          if (updates.dimensions !== undefined) {
            ord.items[0].specialInstructions = updates.specialInstructions 
              ? `${updates.specialInstructions} (Dimensions: ${updates.dimensions})`
              : `Dimensions: ${updates.dimensions}`;
          } else if (updates.specialInstructions !== undefined) {
            ord.items[0].specialInstructions = updates.specialInstructions;
          }
          ord.items[0].totalPrice = updatedInv.subtotal;
        }

        // Also update invoice items description
        if (updatedInv.items && updatedInv.items.length > 0) {
          const title = updates.productTitle || ord.items[0]?.productName || 'Printing Job';
          const specsArr: string[] = [];
          if (updates.material || ord.items[0]?.material) specsArr.push(updates.material || ord.items[0]?.material);
          if (updates.dimensions) specsArr.push(`Dimensions: ${updates.dimensions}`);
          const desc = specsArr.length > 0 ? `${title} (${specsArr.join(', ')})` : title;
          
          updatedInv.items[0].description = desc;
          updatedInv.items[0].quantity = Number(updates.productQuantity) || updatedInv.items[0].quantity;
          updatedInv.items[0].unitPrice = updatedInv.subtotal;
          updatedInv.items[0].total = updatedInv.subtotal;
        }
      }

      ord.updatedAt = new Date().toISOString();
    }

    // 2. Sync Customer profile
    const custIdx = data.customers.findIndex(
      (c) => c.id === updatedInv.customerId || c.phone === updatedInv.customerPhone
    );
    if (custIdx >= 0) {
      if (updatedInv.customerName) data.customers[custIdx].name = updatedInv.customerName;
      if (updatedInv.customerPhone) data.customers[custIdx].phone = updatedInv.customerPhone;
      if (updatedInv.customerAddress) data.customers[custIdx].address = updatedInv.customerAddress;
    }

    saveDatabase(data);
    return updatedInv;
  },

  deleteInvoice(id: string): boolean {
    const data = ensureDatabase();
    const idx = data.invoices.findIndex((i) => i.id === id || i.invoiceNumber === id);
    if (idx >= 0) {
      data.invoices.splice(idx, 1);
      saveDatabase(data);
      return true;
    }
    return false;
  },

  recordPayment(payment: PaymentRecord): PaymentRecord {
    const data = ensureDatabase();
    data.payments.push(payment);

    // 1. Update Order if exists
    if (payment.jobNumber) {
      const ordIdx = data.orders.findIndex((o) => o.jobNumber.toUpperCase() === payment.jobNumber.toUpperCase());
      if (ordIdx >= 0) {
        const ord = data.orders[ordIdx];
        ord.advancePaid += payment.amount;
        ord.balanceDue = Math.max(0, ord.grandTotal - ord.advancePaid);
        ord.paymentStatus = ord.balanceDue === 0 ? 'Paid' : 'Partially Paid';
      }
    }

    // 2. Update Invoice if exists
    if (payment.invoiceId || payment.jobNumber) {
      const invIdx = data.invoices.findIndex(
        (i) => i.id === payment.invoiceId || i.jobNumber.toUpperCase() === payment.jobNumber.toUpperCase()
      );
      if (invIdx >= 0) {
        const inv = data.invoices[invIdx];
        inv.amountPaid += payment.amount;
        inv.balanceDue = Math.max(0, inv.grandTotal - inv.amountPaid);
        inv.paymentStatus = inv.balanceDue === 0 ? 'Paid' : 'Partially Paid';
        if (inv.balanceDue === 0) {
          inv.status = 'Paid';
        }
      }
    }

    // 3. Update Customer Ledger
    if (payment.customerId) {
      const custIdx = data.customers.findIndex((c) => c.id === payment.customerId);
      if (custIdx >= 0) {
        data.customers[custIdx].totalPaid += payment.amount;
        data.customers[custIdx].outstandingBalance = Math.max(
          0,
          data.customers[custIdx].totalBilled - data.customers[custIdx].totalPaid
        );
      }
    }

    saveDatabase(data);
    return payment;
  },

  getPayments(filter?: { jobNumber?: string; customerId?: string }): PaymentRecord[] {
    const data = ensureDatabase();
    let result = data.payments;
    if (filter?.jobNumber) {
      result = result.filter((p) => p.jobNumber.toUpperCase() === filter.jobNumber!.toUpperCase());
    }
    if (filter?.customerId) {
      result = result.filter((p) => p.customerId === filter.customerId);
    }
    return result.sort((a, b) => b.date.localeCompare(a.date));
  },

  // EXPENSES
  getExpenses(filter?: { jobNumber?: string; category?: string }): Expense[] {
    const data = ensureDatabase();
    let result = data.expenses;
    if (filter?.jobNumber) {
      result = result.filter((e) => e.jobNumber?.toUpperCase() === filter.jobNumber!.toUpperCase());
    }
    if (filter?.category) {
      result = result.filter((e) => e.category === filter.category);
    }
    return result.sort((a, b) => b.date.localeCompare(a.date));
  },

  recordExpense(expense: Expense): Expense {
    const data = ensureDatabase();
    const existingIdx = data.expenses.findIndex(
      (e) => e.id === expense.id || (expense.materialId && e.materialId === expense.materialId)
    );
    if (existingIdx >= 0) {
      data.expenses[existingIdx] = expense;
    } else {
      data.expenses.unshift(expense);
    }

    // If this is a vendor payment linked to a work order, update the vendor work order balance & vendor balance
    if (expense.category === 'Vendor Payment' && expense.vendorId) {
      const vIdx = data.vendors.findIndex((v) => v.id === expense.vendorId);
      if (vIdx >= 0) {
        data.vendors[vIdx].totalPaid += expense.amount;
        data.vendors[vIdx].outstandingBalance = Math.max(
          0,
          data.vendors[vIdx].totalWorkAssigned - data.vendors[vIdx].totalPaid
        );
      }
      if (expense.vendorWorkOrderId) {
        const woIdx = data.vendorWorkOrders.findIndex((w) => w.id === expense.vendorWorkOrderId);
        if (woIdx >= 0) {
          data.vendorWorkOrders[woIdx].advancePaid += expense.amount;
          data.vendorWorkOrders[woIdx].balanceDue = Math.max(
            0,
            data.vendorWorkOrders[woIdx].agreedPrice - data.vendorWorkOrders[woIdx].advancePaid
          );
        }
      }
    }

    // If this is a labour payment, update labour balance
    if (expense.category === 'Labour Charges' && expense.labourId) {
      const lIdx = data.labour.findIndex((l) => l.id === expense.labourId);
      if (lIdx >= 0) {
        data.labour[lIdx].totalPaid += expense.amount;
        data.labour[lIdx].pendingAmount = Math.max(0, data.labour[lIdx].totalEarnings - data.labour[lIdx].totalPaid);
      }
    }

    saveDatabase(data);
    return expense;
  },

  deleteExpense(id: string): boolean {
    const data = ensureDatabase();
    const prevLen = data.expenses.length;
    data.expenses = data.expenses.filter((e) => e.id !== id);
    if (data.expenses.length !== prevLen) {
      saveDatabase(data);
      return true;
    }
    return false;
  },

  updateExpenseStatus(
    id: string,
    paymentStatus: 'Paid' | 'Unpaid' | 'Pending',
    paymentMethod?: 'Cash' | 'Offline UPI' | 'Bank Transfer'
  ): Expense | null {
    const data = ensureDatabase();
    const idx = data.expenses.findIndex((e) => e.id === id);
    if (idx === -1) return null;
    data.expenses[idx].paymentStatus = paymentStatus;
    if (paymentMethod) {
      data.expenses[idx].paymentMethod = paymentMethod;
    }
    saveDatabase(data);
    return data.expenses[idx];
  },

  // ENQUIRIES
  getEnquiries(): Enquiry[] {
    const data = ensureDatabase();
    return data.enquiries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  saveEnquiry(enquiry: Enquiry): Enquiry {
    const data = ensureDatabase();
    const idx = data.enquiries.findIndex((e) => e.id === enquiry.id);
    if (idx >= 0) {
      data.enquiries[idx] = enquiry;
    } else {
      data.enquiries.push(enquiry);
    }
    saveDatabase(data);
    return enquiry;
  },

  // DESIGN REVISIONS
  getDesignRevisions(jobNumber: string): DesignRevision[] {
    const data = ensureDatabase();
    return data.designRevisions
      .filter((r) => r.jobNumber.toUpperCase() === jobNumber.toUpperCase())
      .sort((a, b) => b.version - a.version);
  },
  saveDesignRevision(rev: DesignRevision): DesignRevision {
    const data = ensureDatabase();
    const idx = data.designRevisions.findIndex((r) => r.id === rev.id);
    if (idx >= 0) {
      data.designRevisions[idx] = rev;
    } else {
      data.designRevisions.push(rev);
    }
    saveDatabase(data);
    return rev;
  },

  // SETTINGS
  getSettings(): BusinessSettings {
    const data = ensureDatabase();
    return data.settings;
  },
  updateSettings(settings: BusinessSettings): BusinessSettings {
    const data = ensureDatabase();
    data.settings = settings;
    saveDatabase(data);
    return settings;
  },

  // USERS / STAFF
  getUsers(): User[] {
    const data = ensureDatabase();
    return data.users;
  },
  saveUser(user: User): User {
    const data = ensureDatabase();
    const idx = data.users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      data.users[idx] = user;
    } else {
      data.users.push(user);
    }
    saveDatabase(data);
    return user;
  },

  // DASHBOARD AGGREGATED METRICS & P&L
  getDashboardMetrics() {
    const data = ensureDatabase();
    const orders = data.orders;
    const payments = data.payments;
    const expenses = data.expenses;
    const vendors = data.vendors;
    const labour = data.labour;

    const totalBilled = orders.reduce((sum, o) => sum + (o.orderStatus !== 'Cancelled' ? o.grandTotal : 0), 0);
    const actualCashCollected = payments.reduce((sum, p) => sum + p.amount, 0);
    const customerOutstanding = Math.max(0, totalBilled - actualCashCollected);

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const vendorOutstanding = vendors.reduce((sum, v) => sum + v.outstandingBalance, 0);
    const labourOutstanding = labour.reduce((sum, l) => sum + l.pendingAmount, 0);
    const pendingExpenses = expenses
      .filter((e) => e.paymentStatus === 'Pending' || e.paymentStatus === 'Unpaid')
      .reduce((sum, e) => sum + e.amount, 0);
    const totalLiabilities = vendorOutstanding + labourOutstanding + pendingExpenses;

    // Job Direct Costs
    const tasks = data.productionTasks;
    const jobDirectCosts = tasks.reduce(
      (sum, t) => sum + (Number(t.materialCost) || 0) + (Number(t.labourCost) || 0) + (Number(t.vendorCost) || 0),
      0
    );

    // Net Profit: Accrual Revenue - All Operating & Job Expenses
    const grossProfit = totalBilled - jobDirectCosts;
    const netProfit = totalBilled - totalExpenses;

    const todayStr = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter((o) => o.createdAt.startsWith(todayStr)).length;
    const pendingOrders = orders.filter(
      (o) => !['Delivered', 'Cancelled'].includes(o.orderStatus)
    ).length;
    const completedOrders = orders.filter((o) => o.orderStatus === 'Delivered').length;

    return {
      totalRevenue: totalBilled,
      actualCashCollected,
      customerOutstanding,
      totalOrders: orders.length,
      todayOrders,
      pendingOrders,
      completedOrders,
      totalCustomers: data.customers.length,
      totalExpenses,
      grossProfit,
      netProfit,
      vendorOutstanding,
      labourOutstanding,
      pendingExpenses,
      totalLiabilities,
      recentOrders: orders.slice(0, 8),
      recentExpenses: expenses.slice(0, 6),
      recentPayments: payments.slice(0, 6),
    };
  },
};
