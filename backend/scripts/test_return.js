const knex = require('knex');
require('dotenv').config({ path: './.env' });

const db = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  }
});

async function testReturn() {
  try {
    const saleId = 3648; // from user prompt
    const userId = 1; // dummy
    const reason = 'test return';
    const refundMethodId = 1; // dummy, assume 1 is cash
    
    // fetch a valid detail
    const detail = await db('sale_details').where({ sale_id: saleId }).first();
    if (!detail) {
      console.log('No details found for sale', saleId);
      return;
    }

    const items = [
      {
        sale_detail_id: detail.id,
        quantity: 1
      }
    ];

    await db.transaction(async (trx) => {
      let totalRefund = 0;
      const returnDetails = [];

      for (const item of items) {
        const saleDetail = await trx('sale_details')
          .where({ id: item.sale_detail_id, sale_id: saleId })
          .first();

        const currentReturned = Number(saleDetail.quantity_returned) || 0;
        const requestedReturn = Number(item.quantity);
        const unitPrice = Number(saleDetail.unit_price);
        const lineRefund = unitPrice * requestedReturn;
        totalRefund += lineRefund;

        returnDetails.push({
          sale_detail_id: item.sale_detail_id,
          product_id: saleDetail.product_id,
          quantity_returned: requestedReturn,
          unit_price: unitPrice,
          line_refund: lineRefund,
          restock: item.restock !== undefined ? item.restock : true
        });
      }

      const [saleReturnRecord] = await trx('sale_returns')
        .insert({
          original_sale_id: saleId,
          reason: reason || 'Devolución parcial a solicitud del cliente',
          status: 'COMPLETED',
          total_refund: totalRefund,
          refund_method_id: refundMethodId || null,
          created_by: userId
        })
        .returning('id');

      const saleReturnId = saleReturnRecord.id || saleReturnRecord;

      const detailsToInsert = returnDetails.map(d => ({ ...d, sale_return_id: saleReturnId }));
      await trx('sale_return_details').insert(detailsToInsert);

      if (totalRefund > 0 && refundMethodId) {
        await trx('sale_payments').insert({
          sale_id: saleId,
          payment_method_id: refundMethodId,
          amount: -totalRefund,
          reference_code: `RETURN-${saleReturnId}`
        });
      }

      // intentionally abort so we don't pollute db
      throw new Error('ROLLBACK_TEST_SUCCESS');
    });

  } catch (err) {
    if (err.message === 'ROLLBACK_TEST_SUCCESS') {
      console.log('Test completed successfully, rolled back.');
    } else {
      console.error('Error in return process:', err);
    }
  } finally {
    await db.destroy();
  }
}

testReturn();
