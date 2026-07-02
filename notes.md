1. In server/controllers/orderController.js :Found that createOrder trusted client-sent totalAmount — fixed by computing it server-side from items to prevent price tampering. 
problem:const createOrder = async (req, res, next) => {
  try {
    // Status is always PENDING on creation — admin drives further transitions
    const order = await Order.create({ ...req.body, status: 'PENDING' });
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};
fix: const createOrder = async (req, res, next) => {
  try {
    const { retailerId, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must contain at least one item' });
    }

    // Server calculates totalAmount — never trust a client-supplied total
    const totalAmount = items.reduce((sum, item) => {
      return sum + (item.quantity * item.priceAtPurchase);
    }, 0);

    const order = await Order.create({
      retailerId,
      items,
      totalAmount,
      status: 'PENDING',
    });

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};