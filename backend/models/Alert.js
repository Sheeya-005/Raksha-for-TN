import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const Alert = sequelize.define('Alert', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
  },
  victimId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  victimName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  victimPhone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  lat: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  lng: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'SOS Triggered',
  },
  message: {
    type: DataTypes.STRING,
    defaultValue: "I am in danger! (நான் ஆபத்தில் இருக்கிறேன்!)",
  },
  accuracy: {
    type: DataTypes.DOUBLE,
    defaultValue: null,
  },
  district: {
    type: DataTypes.STRING,
    defaultValue: null,
  },
  assignedResponder: {
    type: DataTypes.STRING,
    defaultValue: null,
  },
  responderType: {
    type: DataTypes.ENUM('police', 'volunteer', 'none'),
    defaultValue: 'none',
  },
  responderLat: {
    type: DataTypes.DOUBLE,
    defaultValue: null,
  },
  responderLng: {
    type: DataTypes.DOUBLE,
    defaultValue: null,
  },
  triggerTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  acceptedTime: {
    type: DataTypes.DATE,
    defaultValue: null,
  },
  arrivalTime: {
    type: DataTypes.DATE,
    defaultValue: null,
  },
  resolutionTime: {
    type: DataTypes.DATE,
    defaultValue: null,
  },
  timeline: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
}, {
  timestamps: true,
  tableName: 'alerts',
});

export default Alert;
