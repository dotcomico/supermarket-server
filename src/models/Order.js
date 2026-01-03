import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { ORDER_STATUS } from "../config/constants.js";

const Order = sequelize.define("Order", {
  totalAmount: { type: DataTypes.FLOAT, allowNull: false },
  status: {
    type: DataTypes.ENUM(...Object.values(ORDER_STATUS)),
    defaultValue: "pending",
  },
  address: { type: DataTypes.STRING },
});

export default Order;
