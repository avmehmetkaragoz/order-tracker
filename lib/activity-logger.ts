/**
 * Client-side Activity Logger
 * 
 * Bu dosya client-side'da activity logging için kullanılır
 */

export interface ActivityLogRequest {
  action: string
  resource_type: string
  resource_id?: string
  details?: any
}

/**
 * Log activity to the server
 */
export async function logActivity(request: ActivityLogRequest): Promise<void> {
  try {
    const response = await fetch('/api/activity-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      throw new Error(`Activity logging failed: ${response.status}`)
    }
  } catch (error) {
    // Don't throw error for logging failures - just log to console
    console.warn('Activity logging failed:', error)
  }
}

/**
 * Activity logging helpers for common operations
 */
export const ActivityLogger = {
  // Order operations
  orderCreated: (orderId: string, orderDetails?: any) => 
    logActivity({
      action: 'create',
      resource_type: 'order',
      resource_id: orderId,
      details: orderDetails
    }),

  orderUpdated: (orderId: string, changes?: any) => 
    logActivity({
      action: 'update',
      resource_type: 'order',
      resource_id: orderId,
      details: changes
    }),

  orderDeleted: (orderId: string) => 
    logActivity({
      action: 'delete',
      resource_type: 'order',
      resource_id: orderId
    }),

  orderStatusChanged: (orderId: string, oldStatus: string, newStatus: string) => 
    logActivity({
      action: 'status_update',
      resource_type: 'order',
      resource_id: orderId,
      details: { old_status: oldStatus, new_status: newStatus }
    }),

  // Warehouse operations
  warehouseItemCreated: (itemId: string, itemDetails?: any) => 
    logActivity({
      action: 'create',
      resource_type: 'warehouse_item',
      resource_id: itemId,
      details: itemDetails
    }),

  warehouseItemUpdated: (itemId: string, changes?: any) => 
    logActivity({
      action: 'update',
      resource_type: 'warehouse_item',
      resource_id: itemId,
      details: changes
    }),

  warehouseItemDeleted: (itemId: string) => 
    logActivity({
      action: 'delete',
      resource_type: 'warehouse_item',
      resource_id: itemId
    }),

  warehouseStockIn: (itemId: string, details?: any) => 
    logActivity({
      action: 'stock_in',
      resource_type: 'warehouse_item',
      resource_id: itemId,
      details
    }),

  warehouseStockOut: (itemId: string, details?: any) => 
    logActivity({
      action: 'stock_out',
      resource_type: 'warehouse_item',
      resource_id: itemId,
      details
    }),

  warehouseTransfer: (itemId: string, details?: any) => 
    logActivity({
      action: 'transfer',
      resource_type: 'warehouse_item',
      resource_id: itemId,
      details
    }),

  // Printing operations
  qrLabelPrinted: (resourceId: string, details?: any) => 
    logActivity({
      action: 'qr_labels',
      resource_type: 'printing',
      resource_id: resourceId,
      details
    }),

  returnLabelPrinted: (resourceId: string, details?: any) => 
    logActivity({
      action: 'return_labels',
      resource_type: 'printing',
      resource_id: resourceId,
      details
    }),

  coilLabelPrinted: (resourceId: string, details?: any) => 
    logActivity({
      action: 'coil_labels',
      resource_type: 'printing',
      resource_id: resourceId,
      details
    }),

  // System operations
  settingsChanged: (settingType: string, details?: any) => 
    logActivity({
      action: 'settings',
      resource_type: 'system',
      resource_id: settingType,
      details
    }),

  reportGenerated: (reportType: string, details?: any) => 
    logActivity({
      action: 'reports',
      resource_type: 'system',
      resource_id: reportType,
      details
    }),

  // Authentication operations
  userLogin: (details?: any) => 
    logActivity({
      action: 'login',
      resource_type: 'auth',
      details
    }),

  userLogout: (details?: any) => 
    logActivity({
      action: 'logout',
      resource_type: 'auth',
      details
    }),

  // Barcode/QR scanning operations
  barcodeScanned: (barcode: string, result?: any) => 
    logActivity({
      action: 'scan',
      resource_type: 'barcode',
      resource_id: barcode,
      details: result
    }),

  qrCodeScanned: (qrData: string, result?: any) => 
    logActivity({
      action: 'scan',
      resource_type: 'qr_code',
      resource_id: qrData,
      details: result
    })
}