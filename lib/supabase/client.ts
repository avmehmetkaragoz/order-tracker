import { createClient } from "@supabase/supabase-js"

// Check if Supabase environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const isSupabaseConfigured =
  typeof supabaseUrl === "string" &&
  supabaseUrl.length > 0 &&
  typeof supabaseAnonKey === "string" &&
  supabaseAnonKey.length > 0

if (!isSupabaseConfigured) {
  
  
  
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

export const testSupabaseConnection = async () => {
  try {
    
    const { data, error } = await supabase.from("orders").select("count").limit(1)
    if (error) {
      
      return false
    }
    
    return true
  } catch (err) {
    
    return false
  }
}

export type Database = {
  public: {
    Tables: {
      orders: {
        Row: {
          id: string
          requester: string
          supplier: string
          customer: string | null
          material: string
          cm: number | null
          mikron: number | null
          bobin_sayisi: number | null
          description: string | null
          quantity: number
          unit: string
          custom_price: boolean
          price_per_unit: number | null
          currency: string
          total_price: number | null
          status: string
          ordered_date: string | null
          eta_date: string | null
          delivered_date: string | null
          notes: string | null
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          requester: string
          supplier: string
          customer?: string | null
          material: string
          cm?: number | null
          mikron?: number | null
          bobin_sayisi?: number | null
          description?: string | null
          quantity: number
          unit?: string
          custom_price?: boolean
          price_per_unit?: number | null
          currency?: string
          total_price?: number | null
          status?: string
          ordered_date?: string | null
          eta_date?: string | null
          delivered_date?: string | null
          notes?: string | null
          tags?: string[] | null
        }
        Update: {
          id?: string
          requester?: string
          supplier?: string
          customer?: string | null
          material?: string
          cm?: number | null
          mikron?: number | null
          bobin_sayisi?: number | null
          description?: string | null
          quantity?: number
          unit?: string
          custom_price?: boolean
          price_per_unit?: number | null
          currency?: string
          total_price?: number | null
          status?: string
          ordered_date?: string | null
          eta_date?: string | null
          delivered_date?: string | null
          notes?: string | null
          tags?: string[] | null
        }
      }
      warehouse_items: {
        Row: {
          id: string
          barcode: string
          material: string
          cm: number | null
          mikron: number | null
          supplier: string | null
          current_weight: number
          original_weight: number
          coil_count: number
          location: string
          status: string
          notes: string | null
          order_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          barcode: string
          material: string
          cm?: number | null
          mikron?: number | null
          supplier?: string | null
          current_weight: number
          original_weight: number
          coil_count?: number
          location?: string
          status?: string
          notes?: string | null
          order_id?: string | null
        }
        Update: {
          id?: string
          barcode?: string
          material?: string
          cm?: number | null
          mikron?: number | null
          supplier?: string | null
          current_weight?: number
          original_weight?: number
          coil_count?: number
          location?: string
          status?: string
          notes?: string | null
          order_id?: string | null
        }
      }
      stock_movements: {
        Row: {
          id: string
          warehouse_item_id: string
          type: string
          quantity: number
          notes: string | null
          operator: string
          created_at: string
        }
        Insert: {
          id?: string
          warehouse_item_id: string
          type: string
          quantity: number
          notes?: string | null
          operator?: string
        }
        Update: {
          id?: string
          warehouse_item_id?: string
          type?: string
          quantity?: number
          notes?: string | null
          operator?: string
        }
      }
      settings: {
        Row: {
          id: string
          key: string
          value: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: any
        }
        Update: {
          id?: string
          key?: string
          value?: any
        }
      }
      pricing: {
        Row: {
          id: string
          supplier: string
          material: string
          price_per_unit: number
          currency: string
          effective_date: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          supplier: string
          material: string
          price_per_unit: number
          currency?: string
          effective_date?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          supplier?: string
          material?: string
          price_per_unit?: number
          currency?: string
          effective_date?: string
          is_active?: boolean
        }
      }
    }
  }
}
