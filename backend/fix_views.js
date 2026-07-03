const fs = require('fs');
const { Client } = require('pg');

const env = fs.readFileSync('.env', 'utf-8').split('\n').reduce((acc, line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) acc[match[1]] = match[2].trim();
    return acc;
}, {});

const client = new Client({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    ssl: { rejectUnauthorized: false } // Required for Supabase external connections
});

const views = [
    'vw_reporte_regimen_simplificado_cr_v2',
    'vw_compras_pendientes_tributacion',
    'vw_alerta_limite_simplificado',
    'vw_tax_liquidation_report',
    'vw_tax_report',
    'vw_inventory_abc_analysis',
    'vw_customer_debts',
    'vw_product_price_history',
    'vw_sales_summary',
    'vw_kardex',
    'vw_low_stock',
    'vw_product_profitability'
];

async function run() {
    try {
        await client.connect();
        console.log("Connected to database.");
        for (const view of views) {
            try {
                await client.query(`ALTER VIEW public.${view} SET (security_invoker = on);`);
                console.log(`Successfully updated ${view}`);
            } catch (e) {
                console.error(`Error updating ${view}:`, e.message);
            }
        }
    } catch (e) {
        console.error("Connection error:", e);
    } finally {
        await client.end();
    }
}

run();
