const Restaurant = require("../models/Restaurant");
const logger = require("./logger");

async function createIndexes() {
  try {
    // Create text index on Restaurant: { name: "text", cuisine: "text" }
    await Restaurant.collection.createIndex({
      name: "text",
      cuisine: "text"
    }, {
      name: "restaurant_text_search"
    });

    // Create text index on Restaurant menu items: { "menu.name": "text" }
    await Restaurant.collection.createIndex({
      "menu.name": "text"
    }, {
      name: "menu_text_search"
    });

    logger.info("MongoDB text indexes created successfully");
  } catch (error) {
    logger.error("Error creating MongoDB indexes:", error);
  }
}

module.exports = {
  createIndexes
};
