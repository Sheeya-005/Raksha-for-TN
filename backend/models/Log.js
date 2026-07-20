import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const Log = sequelize.define('Log', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
  },
  userId: {
    type: DataTypes.STRING,
    defaultValue: 'anonymous',
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: false,
  tableName: 'logs',
});

export default Log;
