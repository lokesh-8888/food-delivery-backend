const cron = require("node-cron");
const Order = require("../models/Order");
const DeliveryAgent = require("../models/DeliveryAgent");

function startJobs() {
  console.log("Starting background jobs...");

  // Job 1 — Auto cancel stale pending orders (runs every 5 minutes)
  cron.schedule("*/5 * * * *", async () => {
    try {
      console.log("Running auto-cancel stale orders job...");
      
      // Find all orders where status is "pending" AND createdAt is older than 10 minutes
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const staleOrders = await Order.find({
        status: "pending",
        createdAt: { $lt: tenMinutesAgo }
      });

      for (const order of staleOrders) {
        // Set status to "cancelled"
        order.status = "cancelled";
        // Push to timeline: { status: "cancelled" }
        order.timeline.push({ status: "cancelled" });

        // If deliveryAgent assigned → set agent isAvailable: true, activeOrder: null
        if (order.deliveryAgent) {
          await DeliveryAgent.findOneAndUpdate(
            { user: order.deliveryAgent },
            { isAvailable: true, activeOrder: null }
          );
        }

        await order.save();
      }

      console.log(`Auto cancelled ${staleOrders.length} stale orders`);
    } catch (error) {
      console.error("Error in auto-cancel stale orders job:", error);
    }
  });

  // Job 2 — Free up stuck delivery agents (runs every 10 minutes)
  cron.schedule("*/10 * * * *", async () => {
    try {
      console.log("Running free up stuck delivery agents job...");
      
      // Find all DeliveryAgents where isAvailable: false AND activeOrder is not null
      const stuckAgents = await DeliveryAgent.find({
        isAvailable: false,
        activeOrder: { $ne: null }
      });

      let freedAgents = 0;

      for (const agent of stuckAgents) {
        // Find their activeOrder
        const activeOrder = await Order.findById(agent.activeOrder);
        
        // If order status is "delivered" or "cancelled" → set agent isAvailable: true, activeOrder: null
        if (activeOrder && (activeOrder.status === "delivered" || activeOrder.status === "cancelled")) {
          agent.isAvailable = true;
          agent.activeOrder = null;
          await agent.save();
          freedAgents++;
        }
      }

      console.log(`Freed up ${freedAgents} stuck delivery agents`);
    } catch (error) {
      console.error("Error in free up stuck delivery agents job:", error);
    }
  });

  console.log("Background jobs started successfully");
}

module.exports = {
  startJobs
};
