import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const User = sequelize.define('User', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('admin', 'police', 'volunteer'),
    defaultValue: 'volunteer',
  },
  gender: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  profilePhoto: {
    type: DataTypes.STRING,
    defaultValue: null,
  },
  availabilityStatus: {
    type: DataTypes.ENUM('Available', 'On Duty', 'Responding', 'Busy', 'Offline'),
    defaultValue: 'Available',
  },
  lat: {
    type: DataTypes.DOUBLE,
    defaultValue: 0.0,
  },
  lng: {
    type: DataTypes.DOUBLE,
    defaultValue: 0.0,
  },
  lastLocationUpdate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  accountStatus: {
    type: DataTypes.ENUM('active', 'suspended'),
    defaultValue: 'active',
  },
}, {
  timestamps: true,
  tableName: 'users',
});

export default User;
