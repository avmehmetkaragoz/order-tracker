const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dexvmttyvpzziqfumjju.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleHZtdHR5dnB6emlxZnVtamp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1MDgxNTksImV4cCI6MjA3MTA4NDE1OX0.ZDsnDF-St9fnyCyy0IrjQDlWGx4s122ooL5kn7dZqkw'
);

async function checkBarcodes() {
  try {
    const { data, error } = await supabase
      .from('warehouse_items')
      .select('barcode, material, cm, mikron, supplier')
      .limit(10);
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log('Existing barcodes in database:');
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Script error:', err);
  }
}

checkBarcodes();
