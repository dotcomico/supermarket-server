import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { ROLES } from "../config/constants.js";

const User = sequelize.define('User', {
    username: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
    password: { type: DataTypes.STRING, allowNull: false },
    role: {
        type: DataTypes.ENUM(...Object.values(ROLES)),
        defaultValue: ROLES.CUSTOMER
    },
    // address: {
    //     type: DataTypes.JSON,
    //     allowNull: true,
    //     defaultValue: {
    //         street: "",
    //         houseNumber: "",
    //         apartment: "",
    //         city: "",
    //         zipCode: ""
    //     }
    // }
});
export default User;