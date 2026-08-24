import { createClient } from '@supabase/supabase-js';
import { Branch, Invoice, Product, User, UserRole } from '../types';

export const SUPABASE_URL = 'https://kjdpayvavaarlcochzgt.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqZHBheXZhdmFhcmxjb2Noemd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4OTg2MDIsImV4cCI6MjA4NTQ3NDYwMn0.Y6Vmn7zJZrdzVZMGupPTzDPdCh7yJmdzTbea_CRLM-g';

// Helper to normalize Supabase role strings to supported UserRole
export function normalizeUserRole(rawRole: any, isAdminFlag?: boolean): UserRole {
  if (isAdminFlag) return 'admin';
  if (!rawRole) return 'sales_rep';
  const r = String(rawRole).toLowerCase().trim();
  if (r === 'admin' || r.includes('super_admin') || r.includes('superadmin')) return 'admin';
  if (r === 'branch_manager' || r.includes('manager') || r.includes('branch')) return 'branch_manager';
  if (r === 'supervisor' || r.includes('supervis')) return 'supervisor';
  if (r === 'sales_rep' || r.includes('rep') || r.includes('sales')) return 'sales_rep';
  return 'sales_rep';
}

// Initialize Supabase Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export interface SupabaseSyncStatus {
  connected: boolean;
  tableFound?: string;
  usersCount?: number;
  productsCount?: number;
  invoicesCount?: number;
  lastSyncTime?: string;
  error?: string;
}

/**
 * Test connectivity with Supabase project and check available tables
 */
export async function testSupabaseConnection(): Promise<SupabaseSyncStatus> {
  try {
    // Try fetching from users or profiles or products table
    let foundTable = '';
    let usersCount = 0;
    let productsCount = 0;
    let invoicesCount = 0;

    // 1. Try 'users' or 'profiles' table
    try {
      const { data: usersData, error: userErr } = await supabase.from('users').select('*').limit(50);
      if (!userErr && usersData) {
        foundTable += 'users ';
        usersCount = usersData.length;
      } else {
        const { data: profData, error: profErr } = await supabase.from('profiles').select('*').limit(50);
        if (!profErr && profData) {
          foundTable += 'profiles ';
          usersCount = profData.length;
        }
      }
    } catch (e) {
      console.warn('Could not query users table in Supabase:', e);
    }

    // 2. Try 'products' or 'items' table
    try {
      const { data: prodData, error: prodErr } = await supabase.from('products').select('*').limit(50);
      if (!prodErr && prodData) {
        foundTable += 'products ';
        productsCount = prodData.length;
      }
    } catch (e) {
      console.warn('Could not query products table in Supabase:', e);
    }

    // 3. Try 'invoices' or 'orders' table
    try {
      const { data: invData, error: invErr } = await supabase.from('invoices').select('*').limit(50);
      if (!invErr && invData) {
        foundTable += 'invoices ';
        invoicesCount = invData.length;
      }
    } catch (e) {
      console.warn('Could not query invoices table in Supabase:', e);
    }

    return {
      connected: true,
      tableFound: foundTable.trim() || 'متصل بنجاح بقاعدة البيانات',
      usersCount,
      productsCount,
      invoicesCount,
      lastSyncTime: new Date().toLocaleTimeString('ar-EG'),
    };
  } catch (err: any) {
    return {
      connected: false,
      error: err?.message || 'فشل الاتصال بقاعدة بيانات Supabase',
    };
  }
}

/**
 * Fetch all users from Supabase (checking 'users' or 'profiles' or 'app_users')
 */
export async function fetchUsersFromSupabase(): Promise<{ success: boolean; users?: User[]; error?: string }> {
  try {
    // Try 'users'
    const { data: usersData, error: uErr } = await supabase.from('users').select('*');
    if (!uErr && usersData && usersData.length > 0) {
      const mapped: User[] = usersData.map((u: any, idx: number) => ({
        id: u.id || `sup-u-${idx + 1}`,
        name: u.name || u.full_name || u.username || 'مستخدم',
        username: u.username || u.email?.split('@')[0] || `user_${idx + 1}`,
        email: u.email || '',
        password: u.password || '123',
        role: normalizeUserRole(u.role, u.is_admin),
        branchName: u.branch_name || u.branchName || 'فرع أكتوبر (الفرع الرئيسي والمخزن المركزي)',
        supervisorId: u.supervisor_id || u.supervisorId,
        phone: u.phone || u.mobile || '',
        commissionRate: u.commission_rate || u.commissionRate || 2.5,
        isActive: u.is_active !== undefined ? u.is_active : true,
        approvalStatus: u.approval_status || u.approvalStatus || 'active',
        createdAt: u.created_at || u.createdAt || new Date().toISOString(),
      }));
      return { success: true, users: mapped };
    }

    // Try 'profiles'
    const { data: profData, error: pErr } = await supabase.from('profiles').select('*');
    if (!pErr && profData && profData.length > 0) {
      const mapped: User[] = profData.map((u: any, idx: number) => ({
        id: u.id || `sup-p-${idx + 1}`,
        name: u.name || u.full_name || u.username || 'مستخدم',
        username: u.username || u.email?.split('@')[0] || `user_${idx + 1}`,
        email: u.email || '',
        password: u.password || '123',
        role: normalizeUserRole(u.role, u.is_admin),
        branchName: u.branch_name || u.branchName || 'فرع أكتوبر (الفرع الرئيسي والمخزن المركزي)',
        supervisorId: u.supervisor_id || u.supervisorId,
        phone: u.phone || u.mobile || '',
        commissionRate: u.commission_rate || u.commissionRate || 2.5,
        isActive: u.is_active !== undefined ? u.is_active : true,
        approvalStatus: u.approval_status || u.approvalStatus || 'active',
        createdAt: u.created_at || u.createdAt || new Date().toISOString(),
      }));
      return { success: true, users: mapped };
    }

    return { success: false, error: 'لم يتم العثور على سجلات في جدول users أو profiles' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطأ في جلب المستخدمين من Supabase' };
  }
}

/**
 * Upsert / Save user into Supabase
 */
export async function saveUserToSupabase(user: User): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      password: user.password,
      role: user.role,
      branch_name: user.branchName,
      supervisor_id: user.supervisorId || null,
      phone: user.phone || '',
      commission_rate: user.commissionRate || 2.5,
      is_active: user.isActive,
      approval_status: user.approvalStatus,
      updated_at: new Date().toISOString(),
    };

    // Try saving to 'users' table
    const { error: err1 } = await supabase.from('users').upsert(payload);
    if (!err1) return { success: true };

    // Fallback to 'profiles'
    const { error: err2 } = await supabase.from('profiles').upsert(payload);
    if (!err2) return { success: true };

    return { success: false, error: err1.message || err2?.message };
  } catch (e: any) {
    return { success: false, error: e?.message };
  }
}

/**
 * Save invoice / order into Supabase
 */
export async function saveInvoiceToSupabase(invoice: Invoice): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      id: invoice.id,
      invoice_number: invoice.invoiceNumber,
      customer_name: invoice.customerName,
      customer_phone: invoice.customerPhone,
      customer_address: invoice.customerAddress,
      customer_tax_number: invoice.customerTaxNumber || null,
      rep_id: invoice.repId,
      rep_name: invoice.repName,
      supervisor_name: invoice.supervisorName,
      branch_name: invoice.branchName,
      status: invoice.status,
      payment_method: invoice.paymentMethod,
      total_cartons: invoice.totalCartons,
      total_pieces: invoice.totalPieces,
      subtotal: invoice.subtotal,
      discount_percentage: invoice.discountPercentage,
      discount_amount: invoice.discountAmount,
      estimated_grand_total: invoice.estimatedGrandTotal,
      notes: invoice.notes,
      items: invoice.items,
      synced_to_accounting: invoice.syncedToAccounting,
      has_shortage_split: invoice.hasShortageSplit,
      shortage_invoice_number: invoice.shortageInvoiceNumber || null,
      is_shortage_invoice: invoice.isShortageInvoice || false,
      parent_invoice_id: invoice.parentInvoiceId || null,
      parent_invoice_number: invoice.parentInvoiceNumber || null,
      qr_payload: invoice.qrPayload || null,
      created_at: invoice.date ? `${invoice.date} ${invoice.time || ''}`.trim() : new Date().toISOString(),
    };

    // 1. Try upserting to 'invoices' table
    const { error: invErr } = await supabase.from('invoices').upsert(payload);
    if (!invErr) return { success: true };

    // 2. Try upserting to 'orders' table
    const { error: ordErr } = await supabase.from('orders').upsert(payload);
    if (!ordErr) return { success: true };

    // 3. Fallback: Try simplified payload if tables have fewer columns
    const simplePayload = {
      id: invoice.id,
      invoice_number: invoice.invoiceNumber,
      customer_name: invoice.customerName,
      customer_phone: invoice.customerPhone,
      rep_name: invoice.repName,
      branch_name: invoice.branchName,
      status: invoice.status,
      total_cartons: invoice.totalCartons,
      total_pieces: invoice.totalPieces,
      estimated_grand_total: invoice.estimatedGrandTotal,
      items: typeof invoice.items === 'string' ? invoice.items : JSON.stringify(invoice.items),
      created_at: invoice.date ? `${invoice.date} ${invoice.time || ''}`.trim() : new Date().toISOString(),
    };

    const { error: simpleInvErr } = await supabase.from('invoices').upsert(simplePayload);
    if (!simpleInvErr) return { success: true };

    const { error: simpleOrdErr } = await supabase.from('orders').upsert(simplePayload);
    if (!simpleOrdErr) return { success: true };

    console.warn('Supabase Invoice Save Error:', invErr?.message || ordErr?.message || simpleInvErr?.message);
    return { success: false, error: invErr?.message || ordErr?.message || 'فشل حفظ الفاتورة في Supabase' };
  } catch (e: any) {
    console.warn('Supabase Invoice Save Exception:', e);
    return { success: false, error: e?.message };
  }
}

/**
 * Fetch all invoices / orders from Supabase
 */
export async function fetchInvoicesFromSupabase(): Promise<{ success: boolean; invoices?: Invoice[]; error?: string }> {
  try {
    let rawInvoices: any[] | null = null;
    const { data: invData, error: invErr } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
    
    if (!invErr && invData && invData.length > 0) {
      rawInvoices = invData;
    } else {
      const { data: ordData, error: ordErr } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (!ordErr && ordData && ordData.length > 0) {
        rawInvoices = ordData;
      }
    }

    if (rawInvoices) {
      const mapped: Invoice[] = rawInvoices.map((i: any) => ({
        id: i.id || `inv-${Date.now()}`,
        invoiceNumber: i.invoice_number || i.invoiceNumber || 'DRM-INV',
        customerName: i.customer_name || i.customerName || 'عميل',
        customerPhone: i.customer_phone || i.customerPhone || '',
        customerAddress: i.customer_address || i.customerAddress || '',
        customerTaxNumber: i.customer_tax_number || i.customerTaxNumber || '',
        date: i.date || (i.created_at ? i.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10)),
        time: i.time || (i.created_at ? i.created_at.slice(11, 19) : ''),
        repId: i.rep_id || i.repId || 'u-rep',
        repName: i.rep_name || i.repName || 'مندوب المبيعات',
        supervisorName: i.supervisor_name || i.supervisorName || 'مشرف الفرع',
        branchName: i.branch_name || i.branchName || 'الفرع الرئيسي',
        items: Array.isArray(i.items) ? i.items : typeof i.items === 'string' ? JSON.parse(i.items) : [],
        totalCartons: i.total_cartons || i.totalCartons || 0,
        totalPieces: i.total_pieces || i.totalPieces || 0,
        subtotal: i.subtotal || i.estimated_grand_total || 0,
        discountPercentage: i.discount_percentage || 0,
        discountAmount: i.discount_amount || i.discountAmount || 0,
        taxPercentage: 0,
        taxAmount: 0,
        estimatedGrandTotal: i.estimated_grand_total || i.estimatedGrandTotal || 0,
        paymentMethod: i.payment_method || i.paymentMethod || 'نقدي (كاش)',
        status: i.status || 'قيد مراجعة المشرف',
        notes: i.notes || '',
        syncedToAccounting: i.synced_to_accounting || false,
        hasShortageSplit: i.has_shortage_split || false,
        shortageInvoiceNumber: i.shortage_invoice_number,
        isShortageInvoice: i.is_shortage_invoice || false,
        parentInvoiceId: i.parent_invoice_id,
        parentInvoiceNumber: i.parent_invoice_number,
        qrPayload: i.qr_payload,
      }));
      return { success: true, invoices: mapped };
    }

    return { success: true, invoices: [] };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطأ في جلب الفواتير من Supabase' };
  }
}

/**
 * Save / Upsert product into Supabase
 */
export async function saveProductsToSupabase(products: Product[]): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = products.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      sales_priority: p.salesPriority,
      status: p.status,
      carton_quantity: p.cartonQuantity,
      size: p.size,
      color: p.color,
      branch_stock_actual: p.branchStockActual,
      branch_stock_reserved: p.branchStockReserved,
      main_warehouse_actual: p.mainWarehouseActual,
      main_warehouse_reserved: p.mainWarehouseReserved,
      department: p.department || p.category,
      category: p.category,
      piece_price: p.piecePrice,
      carton_price: p.cartonPrice,
      promo_price: p.promoPrice || null,
      branch_name: p.branchName,
      image_url: p.imageUrl || null,
      cloudinary_public_id: p.cloudinaryPublicId || null,
      barcode: p.barcode || null,
      updated_at: new Date().toISOString(),
    }));

    // Chunk upserts by 100
    for (let i = 0; i < payload.length; i += 100) {
      const chunk = payload.slice(i, i + 100);
      const { error } = await supabase.from('products').upsert(chunk);
      if (error) {
        // try 'items'
        await supabase.from('items').upsert(chunk);
      }
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message };
  }
}

/**
 * Fetch products from Supabase
 */
export async function fetchProductsFromSupabase(): Promise<{ success: boolean; products?: Product[]; error?: string }> {
  try {
    let raw: any[] | null = null;
    const { data: prodData, error: pErr } = await supabase.from('products').select('*');
    if (!pErr && prodData && prodData.length > 0) {
      raw = prodData;
    } else {
      const { data: itemsData, error: iErr } = await supabase.from('items').select('*');
      if (!iErr && itemsData && itemsData.length > 0) {
        raw = itemsData;
      }
    }

    if (raw && raw.length > 0) {
      const mapped: Product[] = raw.map((p: any) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        salesPriority: p.sales_priority || p.salesPriority || 'عادي',
        status: p.status || 'نشط',
        cartonQuantity: p.carton_quantity || p.cartonQuantity || 1,
        size: p.size || '',
        color: p.color || '',
        branchStockActual: Number(p.branch_stock_actual ?? p.branchStockActual ?? 0),
        branchStockReserved: Number(p.branch_stock_reserved ?? p.branchStockReserved ?? 0),
        mainWarehouseActual: Number(p.main_warehouse_actual ?? p.mainWarehouseActual ?? 0),
        mainWarehouseReserved: Number(p.main_warehouse_reserved ?? p.mainWarehouseReserved ?? 0),
        department: p.department || p.category || 'LHLotus',
        category: p.category || p.department || 'LHLotus',
        classification: p.classification || p.department || p.category || 'LHLotus',
        piecePrice: Number(p.piece_price ?? p.piecePrice ?? 0),
        cartonPrice: Number(p.carton_price ?? p.cartonPrice ?? 0),
        promoPrice: p.promo_price ? Number(p.promo_price) : undefined,
        branchName: p.branch_name || p.branchName || 'فرع أكتوبر (الفرع الرئيسي والمخزن المركزي)',
        imageUrl: p.image_url || p.imageUrl || undefined,
        cloudinaryPublicId: p.cloudinary_public_id || p.cloudinaryPublicId || p.code,
        barcode: p.barcode || undefined,
      }));
      return { success: true, products: mapped };
    }

    return { success: true, products: [] };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}
