import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import Badge from './Badge';

const RecentActivity = ({ activities, className = "" }) => {
  const getActivityIcon = (type) => {
    const iconClasses = {
      order: 'bg-green-100 text-green-600',
      product: 'bg-blue-100 text-blue-600',
      user: 'bg-purple-100 text-purple-600',
      category: 'bg-yellow-100 text-yellow-600',
      default: 'bg-gray-100 text-gray-600'
    };
    
    return iconClasses[type] || iconClasses.default;
  };

  const getActivityColor = (type) => {
    const colorClasses = {
      order: 'text-green-600',
      product: 'text-blue-600',
      user: 'text-purple-600',
      category: 'text-yellow-600',
      default: 'text-gray-600'
    };
    
    return colorClasses[type] || colorClasses.default;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Activité récente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getActivityIcon(activity.type)}`}>
                <activity.icon className="h-4 w-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">
                  {activity.message}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-gray-500">
                    {activity.time}
                  </span>
                  {activity.status && (
                    <Badge variant={activity.status === 'success' ? 'success' : 'warning'}>
                      {activity.status}
                    </Badge>
                  )}
                </div>
              </div>
              
              {activity.action && (
                <button
                  onClick={activity.action.onClick}
                  className={`text-xs font-medium ${getActivityColor(activity.type)} hover:underline`}
                >
                  {activity.action.label}
                </button>
              )}
            </div>
          ))}
        </div>
        
        {activities.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-2">📊</div>
            <p className="text-gray-500">Aucune activité récente</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
