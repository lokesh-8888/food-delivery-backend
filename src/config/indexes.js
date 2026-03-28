const Restaurant = require("../models/Restaurant");
const logger = require("./logger");

async function createIndexes() {
  try {
    // First, drop any existing text indexes to avoid conflicts
    try {
      await Restaurant.collection.dropIndex("restaurant_text_search");
      logger.info("Dropped existing restaurant_text_search index");
    } catch (err) {
      // Index doesn't exist, which is fine
    }
    
    try {
      await Restaurant.collection.dropIndex("menu_text_search");
      logger.info("Dropped existing menu_text_search index");
    } catch (err) {
      // Index doesn't exist, which is fine
    }

    // Create a single comprehensive text index on Restaurant
    await Restaurant.collection.createIndex({
      name: "text",
      cuisine: "text",
      "menu.name": "text"
    }, {
      name: "restaurant_comprehensive_search",
      weights: {
        name: 10,
        cuisine: 5,
        "menu.name": 8
      }
    });

    logger.info("MongoDB comprehensive text index created successfully");
  } catch (error) {
    // If index already exists, that's okay
    if (error.code === 85) {
      logger.info("Text index already exists, skipping creation");
    } else {
      logger.error("Error creating MongoDB indexes:", error);
    }
  }
}

module.exports = {
  createIndexes
};
