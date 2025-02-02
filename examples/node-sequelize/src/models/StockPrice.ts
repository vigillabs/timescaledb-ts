import { Model, DataTypes } from 'sequelize';
import sequelize from '../database';

class StockPrice extends Model {
  public symbol!: string;
  public timestamp!: Date;
  public price!: number;
  public volume!: number;
}

StockPrice.init(
  {
    symbol: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    timestamp: {
      type: DataTypes.DATE,
      primaryKey: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
    },
    volume: {
      type: DataTypes.DECIMAL(10, 2),
    },
  },
  {
    sequelize,
    tableName: 'stock_prices',
    timestamps: false,
    underscored: true,
  },
);

export default StockPrice;
