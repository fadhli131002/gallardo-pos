const prisma = require('../../config/db');

const createPayment = async (req, res, next) => {
  try {
    const { transactionId } = req.params;
    const { amount_paid, payment_method } = req.body;

    if (amount_paid === undefined || !payment_method) {
      return res.status(400).json({ success: false, error: 'amount_paid and payment_method are required' });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: parseInt(transactionId) }
    });

    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    // Begin transaction for data consistency
    const result = await prisma.$transaction(async (tx) => {
      // 1. Save payment
      const payment = await tx.payment.create({
        data: {
          transaction_id: parseInt(transactionId),
          amount_paid: parseFloat(amount_paid),
          payment_method
        }
      });

      // 2. Calculate total paid
      const allPayments = await tx.payment.findMany({
        where: { transaction_id: parseInt(transactionId) }
      });
      const total_paid = allPayments.reduce((sum, p) => sum + p.amount_paid, 0);

      // 3. Calculate sisa_tagihan
      const sisa_tagihan = transaction.total_amount - total_paid;

      // 4. Determine status
      let status_pembayaran = 'Proses';
      if (sisa_tagihan <= 0 || payment_method === 'FREE_OF_CHARGE') {
        status_pembayaran = 'Lunas';
      } else if (total_paid > 0 && sisa_tagihan > 0) {
        status_pembayaran = 'DP/Sebagian';
      }

      // 5. Update transaction
      const updatedTransaction = await tx.transaction.update({
        where: { id: parseInt(transactionId) },
        data: {
          sisa_tagihan: sisa_tagihan < 0 ? 0 : sisa_tagihan, // Prevent negative balance if overpaid
          status_pembayaran
        }
      });

      return { payment, updatedTransaction };
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const updatePayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { payment_date, amount, method, notes } = req.body;

    const payment = await prisma.payment.findUnique({
      where: { id: parseInt(id) }
    });

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: parseInt(id) },
      data: {
        payment_date: payment_date ? new Date(payment_date) : undefined,
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        method: method,
        notes: notes
      }
    });

    res.json({
      success: true,
      data: updatedPayment
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createPayment, updatePayment };
