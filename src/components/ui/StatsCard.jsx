import React from 'react';
import { Card, CardContent } from './Card';

const StatsCard = ({ 
  name, 
  value, 
  change, 
  changeType = 'neutral', 
  icon: Icon, 
  color = 'bg-blue-500',
  description,
  loading = false 
}) => {
  if (loading) {
    return (
      <Card variant="elevated">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
              <div className={`${color} p-3 rounded-xl w-12 h-12`}></div>
            </div>
            <div className="mt-4">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{name}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
          </div>
          {Icon && (
            <div className={`${color} p-3 rounded-xl`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          )}
        </div>
        {change && (
          <div className="mt-4 flex items-center">
            <span className={`text-sm font-medium ${
              changeType === 'positive' ? 'text-green-600' : 
              changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {change}
            </span>
            <span className="text-sm text-gray-500 ml-2">vs mois dernier</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;
